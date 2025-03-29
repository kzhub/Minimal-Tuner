"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./page.module.css";
import { PitchDetector } from "../lib/pitchDetection";
import { findClosestEqualTemperamentNote, getNoteNameWithOctave } from "../lib/noteConversion";
import { TunerDisplay } from "../components/TunerDisplay";
import { TUNING_THRESHOLD } from "../lib/constants";

export default function Tuner() {
  const [frequency, setFrequency] = useState<number | null>(null);
  const [note, setNote] = useState<string>("");
  const [cents, setCents] = useState<number>(0);
  const [isInTune, setIsInTune] = useState<boolean>(false);
  const [noteWithOctave, setNoteWithOctave] = useState<string>("");

  const analyzeNote = useCallback((frequency: number) => {
    const { noteNumber, cents } = findClosestEqualTemperamentNote(frequency);
    const noteName = getNoteNameWithOctave(noteNumber);
    return { noteName, cents };
  }, []);

  useEffect(() => {
    let pitchDetector: PitchDetector | null = null;
    let animationFrame: number;

    const detectPitch = () => {
      if (!pitchDetector) return;

      const freq = pitchDetector.detectPitch();
      if (freq) {
        const { noteName, cents: newCents } = analyzeNote(freq);

        setFrequency(freq);
        setNote(noteName.slice(0, -1));
        setNoteWithOctave(noteName);
        setCents(newCents);
        setIsInTune(Math.abs(newCents) <= TUNING_THRESHOLD);
      }

      animationFrame = requestAnimationFrame(detectPitch);
    };

    const startAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        pitchDetector = new PitchDetector();
        await pitchDetector.initialize(stream);
        detectPitch();
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    };

    startAudio();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      if (pitchDetector) {
        pitchDetector.cleanup();
      }
    };
  }, [analyzeNote]);

  return (
    <main className={styles.main}>
      <TunerDisplay
        note={note}
        noteWithOctave={noteWithOctave}
        frequency={frequency}
        cents={cents}
        isInTune={isInTune}
      />
    </main>
  );
}
