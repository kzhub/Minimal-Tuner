import { Note } from './note';
import { A4_FREQ, A4_NOTE_NUMBER, NOTE_NAMES } from './constants';

export function getClosestNote(frequency: number): { note: Note; cents: number } {
  const noteNumber = Math.round(12 * Math.log2(frequency / A4_FREQ) + A4_NOTE_NUMBER);
  const equalTemperamentFreq = A4_FREQ * Math.pow(2, (noteNumber - A4_NOTE_NUMBER) / 12);
  const cents = Math.round(1200 * Math.log2(frequency / equalTemperamentFreq));

  const octave = Math.floor((noteNumber - 12) / 12);
  const noteIndex = ((noteNumber % 12) + 12) % 12;
  const note: Note = {
    name: NOTE_NAMES[noteIndex],
    octave
  };

  return { note, cents };
} 