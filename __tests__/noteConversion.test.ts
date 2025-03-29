/**
 * @jest-environment jsdom
 */

import { midiNoteToFreq, findClosestEqualTemperamentNote, getNoteNameWithOctave } from '../src/lib/noteConversion';
import { A4_FREQ, A4_NOTE_NUMBER } from '../src/lib/constants';

describe('noteConversion', () => {
  describe('midiNoteToFreq', () => {
    test('A4（69）は440Hzを返す', () => {
      expect(midiNoteToFreq(A4_NOTE_NUMBER)).toBe(A4_FREQ);
    });

    test('A3（57）は220Hzを返す', () => {
      expect(midiNoteToFreq(57)).toBeCloseTo(220.0, 1);
    });

    test('A5（81）は880Hzを返す', () => {
      expect(midiNoteToFreq(81)).toBeCloseTo(880.0, 1);
    });
  });

  describe('findClosestEqualTemperamentNote', () => {
    test('440Hzは A4（69）を返し、cents差は0', () => {
      const result = findClosestEqualTemperamentNote(440.0);
      expect(result.noteNumber).toBe(69);
      expect(result.cents).toBe(0);
    });

    test('450HzはA4に近く、正のcents差を返す', () => {
      const result = findClosestEqualTemperamentNote(450.0);
      expect(result.noteNumber).toBe(69);
      expect(result.cents).toBeGreaterThan(0);
    });

    test('430HzはA4に近く、負のcents差を返す', () => {
      const result = findClosestEqualTemperamentNote(430.0);
      expect(result.noteNumber).toBe(69);
      expect(result.cents).toBeLessThan(0);
    });
  });

  describe('getNoteNameWithOctave', () => {
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