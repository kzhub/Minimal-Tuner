"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./page.module.css";
import { PitchDetector } from "../lib/pitchDetection";
import {
  findClosestEqualTemperamentNote,
  getNoteNameWithOctave,
} from "../lib/noteConversion";
import { TunerDisplay } from "../components/TunerDisplay";
import { SettingsModal } from "../components/SettingsModal";
import { TUNING_THRESHOLD, INSTRUMENT_FREQ_RANGES } from "../lib/constants";
import { IoSettingsOutline } from "react-icons/io5";

export default function Tuner() {
  const [frequency, setFrequency] = useState<number | null>(null);
  const [note, setNote] = useState<string>("");
  const [cents, setCents] = useState<number>(0);
  const [isInTune, setIsInTune] = useState<boolean>(false);
  const [noteWithOctave, setNoteWithOctave] = useState<string>("");
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isLowMode, setIsLowMode] = useState<boolean>(false);

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

      // 選択されたモードの周波数範囲を使用
      const freqRange = isLowMode
        ? INSTRUMENT_FREQ_RANGES.bass
        : INSTRUMENT_FREQ_RANGES.guitar;
      const freq = pitchDetector.detectPitch(freqRange);

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
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
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
  }, [analyzeNote, isLowMode]);

  return (
    <main className={styles.main}>
      <div className={styles.settingsButton}>
        <button
          onClick={() => setIsSettingsOpen(true)}
          aria-label="設定を開く"
          aria-expanded={isSettingsOpen}
          aria-controls="settings-modal"
          className={styles.settingsButton}
        >
          <IoSettingsOutline size={24} color="#666" aria-hidden="true" />
        </button>
      </div>
      <TunerDisplay
        note={note}
        noteWithOctave={noteWithOctave}
        frequency={frequency}
        cents={cents}
        isInTune={isInTune}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isLowMode={isLowMode}
        onModeChange={setIsLowMode}
      />
    </main>
  );
}
