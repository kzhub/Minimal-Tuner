/**
 * 音声のピッチ（基本周波数）を検出するモジュール
 * 
 * このモジュールは以下の機能を提供します：
 * - マイクからの音声入力の取得
 * - 自己相関関数を使用した高精度なピッチ検出
 * - 動的な移動平均による安定したピッチ値の計算
 * - 指定された周波数範囲内でのピッチ検出
 */

import { FREQ_RANGE, CORRELATION_THRESHOLD, MIN_SIGNAL_STRENGTH, FFT_SIZE, MOVING_AVERAGE_BUFFER_SIZE } from './constants';
import { GainControl } from './gainControl';

// 周波数範囲の型定義
interface FrequencyRange {
  min: number;
  max: number;
}

/**
 * 音声のピッチを検出するクラス
 * 
 * このクラスは以下の処理を行います：
 * 1. 音声入力の初期化と設定
 * 2. リアルタイムでのピッチ検出
 * 3. 検出されたピッチ値の安定化
 */
export class PitchDetector {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private source: MediaStreamAudioSourceNode | null = null;
  private movingAverageBuffer: number[] = [];
  private timeDomainBuffer: Float32Array;
  private gainControl: GainControl;

  constructor() {
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = FFT_SIZE;
    this.timeDomainBuffer = new Float32Array(this.analyser.frequencyBinCount);
    this.gainControl = new GainControl(this.audioContext);
  }

  /**
   * 音声入力ストリームの初期化
   * @param stream - マイクからの音声ストリーム
   */
  async initialize(stream: MediaStream) {
    this.source = this.audioContext.createMediaStreamSource(stream);
    this.source.connect(this.gainControl.getNode());
    this.gainControl.getNode().connect(this.analyser);
  }

  private calculateAutocorrelation(data: Float32Array): Float32Array {
    const result = new Float32Array(data.length);
    for (let lag = 0; lag < data.length; lag++) {
      let sum = 0;
      for (let i = 0; i < data.length - lag; i++) {
        sum += data[i] * data[i + lag];
      }
      result[lag] = sum;
    }
    return result;
  }

  private findPeakIndex(correlation: Float32Array, sampleRate: number, freqRange: FrequencyRange): number | null {
    const minLag = Math.floor(sampleRate / freqRange.max);
    const maxLag = Math.ceil(sampleRate / freqRange.min);

    let maxCorrelation = -Infinity;
    let peakIndex = -1;

    // 最初のピークを探す
    for (let i = minLag; i <= maxLag; i++) {
      if (correlation[i] > maxCorrelation) {
        maxCorrelation = correlation[i];
        peakIndex = i;
      }
    }

    // ピークの有効性を確認
    if (peakIndex === -1 || maxCorrelation < CORRELATION_THRESHOLD) {
      return null;
    }

    return peakIndex;
  }

  private interpolatePeak(correlation: Float32Array, peakIndex: number): number {
    const alpha = correlation[peakIndex - 1];
    const beta = correlation[peakIndex];
    const gamma = correlation[peakIndex + 1];

    const p = 0.5 * (alpha - gamma) / (alpha - 2 * beta + gamma);
    return peakIndex + p;
  }

  /**
   * 現在の音声からピッチを検出
   * @param freqRange - 検出する周波数の範囲（指定しない場合はデフォルト値を使用）
   * @returns 検出されたピッチ値（Hz）または検出できない場合はnull
   */
  detectPitch(freqRange: FrequencyRange = FREQ_RANGE): number | null {
    // 時系列データの取得
    this.analyser.getFloatTimeDomainData(this.timeDomainBuffer);

    // 信号強度のチェックとゲイン調整
    let signalStrength = 0;
    for (const value of this.timeDomainBuffer) {
      signalStrength += value * value;
    }
    signalStrength = Math.sqrt(signalStrength / this.timeDomainBuffer.length);

    // ゲインの更新
    this.gainControl.updateGain(signalStrength);

    if (signalStrength < MIN_SIGNAL_STRENGTH) {
      return null;
    }

    // 自己相関関数の計算
    const correlation = this.calculateAutocorrelation(this.timeDomainBuffer);
    const sampleRate = this.audioContext.sampleRate;

    // ピークの検出と補間
    const peakIndex = this.findPeakIndex(correlation, sampleRate, freqRange);
    if (peakIndex === null) {
      return null;
    }

    const interpolatedIndex = this.interpolatePeak(correlation, peakIndex);
    const fundamentalFreq = sampleRate / interpolatedIndex;

    if (fundamentalFreq >= freqRange.min && fundamentalFreq <= freqRange.max) {
      this.movingAverageBuffer.push(fundamentalFreq);
      if (this.movingAverageBuffer.length > MOVING_AVERAGE_BUFFER_SIZE) {
        this.movingAverageBuffer.shift();
      }

      // 中央値を使用して安定化
      const sortedBuffer = [...this.movingAverageBuffer].sort((a, b) => a - b);
      return sortedBuffer[Math.floor(sortedBuffer.length / 2)];
    }

    return null;
  }

  /**
   * リソースの解放とクリーンアップ
   */
  cleanup() {
    if (this.source) {
      this.source.disconnect();
    }
    if (this.gainControl) {
      this.gainControl.getNode().disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
} 