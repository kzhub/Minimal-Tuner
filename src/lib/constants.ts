/**
 * 音声チューナーアプリケーションで使用される定数を定義するモジュール
 * 
 * このモジュールは以下の定数を提供します：
 * - 音符名の配列（CからBまでの12音）
 * - 基準音A4の周波数（440Hz）
 * - A4のMIDIノートナンバー
 * - チューナーで検出可能な周波数範囲
 * - チューニングの許容誤差（セント）
 */

export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const A4_FREQ = 440.0;
export const A4_NOTE_NUMBER = 69; // MIDIノートナンバーでのA4

export const FREQ_RANGE = {
  min: 27.5,  // A0
  max: 4186.0 // C8
};

export const CORRELATION_THRESHOLD = 0.05;  // 相関値の最小閾値を0.1から0.05に下げる
export const MIN_SIGNAL_STRENGTH = 0.005;   // 信号強度の最小閾値を0.01から0.005に下げる

export const TUNING_THRESHOLD = 5; 