/**
 * 音声のピッチ（基本周波数）を検出するモジュール
 * 
 * このモジュールは以下の機能を提供します：
 * - マイクからの音声入力の取得
 * - 自己相関関数を使用したピッチ検出
 * - 動的な移動平均による安定したピッチ値の計算
 * - 指定された周波数範囲内でのピッチ検出
 */

import { FREQ_RANGE, CORRELATION_THRESHOLD, MIN_SIGNAL_STRENGTH } from './constants';

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
  private source: MediaStreamAudioSourceNode;
  private movingAverageBuffer: number[] = [];

  constructor() {
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 32768;
  }

  /**
   * 音声入力ストリームの初期化
   * @param stream - マイクからの音声ストリーム
   */
  async initialize(stream: MediaStream) {
    this.source = this.audioContext.createMediaStreamSource(stream);
    this.source.connect(this.analyser);
  }

  /**
   * 現在の音声からピッチを検出
   * @returns 検出されたピッチ値（Hz）または検出できない場合はnull
   */
  detectPitch(): number | null {
    const timeDomainData = new Float32Array(this.analyser.frequencyBinCount);
    this.analyser.getFloatTimeDomainData(timeDomainData);

    // 信号強度のチェック
    let signalStrength = 0;
    for (let i = 0; i < timeDomainData.length; i++) {
      signalStrength += timeDomainData[i] * timeDomainData[i];
    }
    signalStrength = Math.sqrt(signalStrength / timeDomainData.length);

    if (signalStrength < MIN_SIGNAL_STRENGTH) {
      return null;
    }

    const correlationData = new Float32Array(timeDomainData.length);
    const range = FREQ_RANGE;

    // 自己相関関数の計算
    for (let lag = 0; lag < correlationData.length; lag++) {
      let correlation = 0;
      for (let i = 0; i < correlationData.length - lag; i++) {
        correlation += timeDomainData[i] * timeDomainData[i + lag];
      }
      correlationData[lag] = correlation;
    }

    // ピーク検出
    let maxCorrelation = -Infinity;
    let fundamentalFreq = 0;
    const sampleRate = this.audioContext.sampleRate;
    const minLag = Math.floor(sampleRate / range.max);
    const maxLag = Math.ceil(sampleRate / range.min);

    // 相関値の正規化
    const maxCorrValue = Math.max(...correlationData);
    const minCorrValue = Math.min(...correlationData);
    const corrRange = maxCorrValue - minCorrValue;

    for (let lag = minLag; lag <= maxLag; lag++) {
      const normalizedCorr = (correlationData[lag] - minCorrValue) / corrRange;
      
      if (normalizedCorr > CORRELATION_THRESHOLD &&
          correlationData[lag] > correlationData[lag - 1] &&
          correlationData[lag] > correlationData[lag + 1] &&
          correlationData[lag] > maxCorrelation) {
        
        const freq = sampleRate / lag;
        // 倍音の影響を軽減するためのチェック
        let isHarmonic = false;
        for (let i = 2; i <= 4; i++) {
          const harmonicFreq = freq * i;
          const harmonicLag = Math.round(sampleRate / harmonicFreq);
          if (harmonicLag < correlationData.length &&
              correlationData[harmonicLag] > correlationData[lag] * 0.9) {
            isHarmonic = true;
            break;
          }
        }

        if (!isHarmonic && freq >= range.min && freq <= range.max) {
          maxCorrelation = correlationData[lag];
          fundamentalFreq = freq;
        }
      }
    }

    if (fundamentalFreq > 0) {
      const dynamicBufferSize = fundamentalFreq < 100 ? 8 :
        fundamentalFreq < 200 ? 6 :
          4;

      this.movingAverageBuffer.push(fundamentalFreq);
      if (this.movingAverageBuffer.length > dynamicBufferSize) {
        this.movingAverageBuffer.shift();
      }

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
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
} 