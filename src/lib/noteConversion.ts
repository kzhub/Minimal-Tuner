/**
 * 音声処理における音階変換を担当するモジュール
 * 
 * このモジュールは以下の機能を提供します：
 * - MIDIノート番号から周波数への変換
 * - 周波数から最も近い平均律の音階への変換
 * - MIDIノート番号から音名（オクターブ付き）への変換
 */

import { A4_FREQ, A4_NOTE_NUMBER, NOTE_NAMES } from './constants';

/**
 * MIDIノート番号を周波数（Hz）に変換します
 * @param noteNumber - MIDIノート番号（例：A4は69）
 * @returns 対応する周波数（Hz）
 */
export function midiNoteToFreq(noteNumber: number): number {
  return A4_FREQ * Math.pow(2, (noteNumber - A4_NOTE_NUMBER) / 12);
}

/**
 * 与えられた周波数に最も近い平均律の音階を求めます
 * @param freq - 周波数（Hz）
 * @returns 最も近いMIDIノート番号と、その音との音程差（セント）
 */
export function findClosestEqualTemperamentNote(freq: number): { noteNumber: number; cents: number } {
  const noteNumber = Math.round(12 * Math.log2(freq / A4_FREQ) + A4_NOTE_NUMBER);
  const equalTemperamentFreq = midiNoteToFreq(noteNumber);
  const cents = Math.round(1200 * Math.log2(freq / equalTemperamentFreq));
  return { noteNumber, cents };
}

/**
 * MIDIノート番号から音名（オクターブ付き）を生成します
 * @param noteNumber - MIDIノート番号
 * @returns 音名とオクターブ（例：'A4', 'C#5'）
 */
export function getNoteNameWithOctave(noteNumber: number): string {
  const octave = Math.floor((noteNumber - 12) / 12);
  const noteIndex = ((noteNumber % 12) + 12) % 12;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
} 