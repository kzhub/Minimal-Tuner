/**
 * 音声のゲイン（音量）を最適化するモジュール
 * 
 * このモジュールは以下の機能を提供します：
 * - 動的なゲイン調整
 * - 目標音量レベルの設定と維持
 * - スムーズなゲイン遷移
 */

export class GainControl {
  private gainNode: GainNode;
  private targetLevel: number;
  private currentGain: number;
  private smoothingFactor: number;
  private readonly MIN_GAIN = 0.1;
  private readonly MAX_GAIN = 10.0;
  private readonly TARGET_RMS = 0.3;

  constructor(audioContext: AudioContext) {
    this.gainNode = audioContext.createGain();
    this.targetLevel = this.TARGET_RMS;
    this.currentGain = 1.0;
    this.smoothingFactor = 0.1;
  }

  /**
   * ゲインノードを取得
   */
  getNode(): GainNode {
    return this.gainNode;
  }

  /**
   * 目標音量レベルを設定
   * @param level - 目標RMSレベル（0.0 ~ 1.0）
   */
  setTargetLevel(level: number) {
    this.targetLevel = Math.max(0.0, Math.min(1.0, level));
  }

  /**
   * スムージング係数を設定
   * @param factor - スムージング係数（0.0 ~ 1.0）
   */
  setSmoothingFactor(factor: number) {
    this.smoothingFactor = Math.max(0.0, Math.min(1.0, factor));
  }

  /**
   * 現在の音声レベルに基づいてゲインを調整
   * @param rmsLevel - 現在のRMSレベル
   */
  updateGain(rmsLevel: number) {
    if (rmsLevel === 0) return;

    const targetGain = this.targetLevel / rmsLevel;
    const clampedGain = Math.max(this.MIN_GAIN, Math.min(this.MAX_GAIN, targetGain));

    // スムーズなゲイン遷移
    this.currentGain = this.currentGain * (1 - this.smoothingFactor) +
                       clampedGain * this.smoothingFactor;

    this.gainNode.gain.setTargetAtTime(this.currentGain, this.gainNode.context.currentTime, 0.1);
  }
} 