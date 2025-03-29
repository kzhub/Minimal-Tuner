/**
 * 音声のピッチ（基本周波数）を検出するモジュール
 * 
 * このモジュールは以下の機能を提供します：
 * - マイクからの音声入力の取得
 * - 自己相関関数を使用した高精度なピッチ検出
 * - 動的な移動平均による安定したピッチ値の計算
 * - 指定された周波数範囲内でのピッチ検出
 * - 持続的な音のみを検出する仕組み
 * - 全音以上の音程変化を無効とするフィルタリング
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
 * 4. 持続的な音のみの検出
 * 5. 全音以上の音程変化をフィルタリング
 */
export class PitchDetector {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private source: MediaStreamAudioSourceNode | null = null;
  private movingAverageBuffer: number[] = [];
  private timeDomainBuffer: Float32Array;
  private gainControl: GainControl;
  
  // 持続的な音を検出するための変数
  private lastValidPitch: number | null = null;
  private sustainedPitchBuffer: number[] = [];
  private readonly SUSTAINED_PITCH_THRESHOLD: number = 8; // 持続的な音と判断するためのフレーム数
  
  // 全音以上の変化を検出するための変数
  private readonly WHOLE_TONE_RATIO: number = 1.122462; // 全音の比率（周波数比≒1.122）
  private readonly STABILITY_FRAMES: number = 8; // 安定したピッチとみなすために必要なフレーム数

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
   * 持続的な音かどうかを判定し、全音以上の音程変化をフィルタリングする
   * @param detectedPitch - 検出された生のピッチ値
   * @returns フィルタリングされたピッチ値
   */
  private filterPitchChanges(detectedPitch: number | null): number | null {
    // ピッチが検出されなかった場合
    if (detectedPitch === null) {
      // 一定期間ピッチが検出されなかった場合、持続バッファをリセット
      if (this.sustainedPitchBuffer.length > 0) {
        this.sustainedPitchBuffer = [];
      }
      return this.lastValidPitch;
    }

    // 持続バッファにピッチを追加
    this.sustainedPitchBuffer.push(detectedPitch);
    
    // バッファサイズを制限
    if (this.sustainedPitchBuffer.length > this.STABILITY_FRAMES) {
      this.sustainedPitchBuffer.shift();
    }

    // 持続バッファが閾値未満の場合は音が持続的でないと判断
    if (this.sustainedPitchBuffer.length < this.SUSTAINED_PITCH_THRESHOLD) {
      return this.lastValidPitch;
    }

    // 持続バッファ内のピッチの安定性を確認
    const median = this.calculateMedian(this.sustainedPitchBuffer);
    const isStable = this.sustainedPitchBuffer.every(pitch => {
      const ratio = Math.max(pitch / median, median / pitch);
      return ratio < this.WHOLE_TONE_RATIO; // 全音未満の変動は安定とみなす
    });

    // 持続バッファ内のピッチが安定していない場合
    if (!isStable) {
      return this.lastValidPitch;
    }

    // 前回の有効なピッチと比較して全音以上の変化がある場合
    if (this.lastValidPitch !== null) {
      const ratio = Math.max(median / this.lastValidPitch, this.lastValidPitch / median);
      
      // 全音以上の変化があり、安定フレーム数に達していない場合
      if (ratio >= this.WHOLE_TONE_RATIO && this.sustainedPitchBuffer.length < this.STABILITY_FRAMES) {
        return this.lastValidPitch;
      }
    }

    // すべての条件を満たした場合、新しいピッチを有効とする
    this.lastValidPitch = median;
    return median;
  }

  /**
   * 配列の中央値を計算
   * @param values - 数値配列
   * @returns 中央値
   */
  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    
    return sorted[middle];
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
      return this.filterPitchChanges(null);
    }

    // 自己相関関数の計算
    const correlation = this.calculateAutocorrelation(this.timeDomainBuffer);
    const sampleRate = this.audioContext.sampleRate;

    // ピークの検出と補間
    const peakIndex = this.findPeakIndex(correlation, sampleRate, freqRange);
    if (peakIndex === null) {
      return this.filterPitchChanges(null);
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
      const medianPitch = sortedBuffer[Math.floor(sortedBuffer.length / 2)];
      
      // 持続的な音かどうかを判定し、全音以上の変化をフィルタリング
      return this.filterPitchChanges(medianPitch);
    }

    return this.filterPitchChanges(null);
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