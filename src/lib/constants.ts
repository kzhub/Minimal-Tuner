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
  min: 20,  // Hz
  max: 2000 // Hz
};

export const CORRELATION_THRESHOLD = 0.8;
export const MIN_SIGNAL_STRENGTH = 0.01;
export const FFT_SIZE = 2048;
export const MOVING_AVERAGE_BUFFER_SIZE = 5;

export const TUNING_THRESHOLD = 15; 