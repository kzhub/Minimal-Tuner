/**
 * @jest-environment jsdom
 */

import { midiNoteToFreq, findClosestEqualTemperamentNote, getNoteNameWithOctave } from '../src/lib/noteConversion';
import { A4_FREQ, A4_NOTE_NUMBER } from '../src/lib/constants';

describe('音階変換機能', () => {
  describe('MIDIノート番号から周波数への変換', () => {
    test('A4（MIDIノート番号69）は440Hzを返す', () => {
      expect(midiNoteToFreq(A4_NOTE_NUMBER)).toBe(A4_FREQ);
    });

    test('A3（MIDIノート番号57）は220Hzを返す', () => {
      expect(midiNoteToFreq(57)).toBeCloseTo(220.0, 1);
    });

    test('A5（MIDIノート番号81）は880Hzを返す', () => {
      expect(midiNoteToFreq(81)).toBeCloseTo(880.0, 1);
    });
  });

  describe('周波数から最も近い平均律の音階を求める', () => {
    test('440HzはA4（MIDIノート番号69）を返し、音程差は0セント', () => {
      const result = findClosestEqualTemperamentNote(440.0);
      expect(result.noteNumber).toBe(69);
      expect(result.cents).toBe(0);
    });

    test('450HzはA4に近く、正の音程差を返す', () => {
      const result = findClosestEqualTemperamentNote(450.0);
      expect(result.noteNumber).toBe(69);
      expect(result.cents).toBeGreaterThan(0);
    });

    test('430HzはA4に近く、負の音程差を返す', () => {
      const result = findClosestEqualTemperamentNote(430.0);
      expect(result.noteNumber).toBe(69);
      expect(result.cents).toBeLessThan(0);
    });
  });

  describe('MIDIノート番号から音名（オクターブ付き）への変換', () => {
    test('MIDIノート番号69はA4を返す', () => {
      expect(getNoteNameWithOctave(69)).toBe('A4');
    });

    test('MIDIノート番号60はC4を返す', () => {
      expect(getNoteNameWithOctave(60)).toBe('C4');
    });

    test('MIDIノート番号61はC#4を返す', () => {
      expect(getNoteNameWithOctave(61)).toBe('C#4');
    });

    test('MIDIノート番号71はB4を返す', () => {
      expect(getNoteNameWithOctave(71)).toBe('B4');
    });
  });
}); 