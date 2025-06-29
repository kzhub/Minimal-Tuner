"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "../app/page.module.css";
import { PitchDetector } from "../lib/pitchDetection";
import {
  findClosestEqualTemperamentNote,
  getNoteNameWithOctave,
} from "../lib/noteConversion";
import { TunerDisplay } from "./TunerDisplay";
import { SettingsModal } from "./SettingsModal";
import { TUNING_THRESHOLD, INSTRUMENT_FREQ_RANGES, translations, type Locale } from "../lib/constants";
import { IoSettingsOutline } from "react-icons/io5";
import { usePathname, useRouter } from "next/navigation";

export default function TunerClient() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentLocale, setCurrentLocale] = useState<Locale>((pathname?.split('/')[1] as Locale) || 'en');
  const t = translations[currentLocale];

  const [frequency, setFrequency] = useState<number | null>(null);
  const [note, setNote] = useState<string>("");
  const [cents, setCents] = useState<number>(0);
  const [isInTune, setIsInTune] = useState<boolean>(false);
  const [noteWithOctave, setNoteWithOctave] = useState<string>("");
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isLowMode, setIsLowMode] = useState<boolean>(false);

  const toggleLocale = () => {
    const newLocale = currentLocale === 'en' ? 'ja' : 'en';
    setCurrentLocale(newLocale);
    router.push(`/${newLocale}`);
    document.documentElement.lang = newLocale;
  };

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
  }, [analyzeNote, isLowMode]);

  return (
    <main className={styles.main} role="main" aria-label={t.tuner.mainContent}>
      <div className={styles.headerButtons}>
        <button
          onClick={toggleLocale}
          aria-label={currentLocale === 'en' ? '日本語に切り替え' : 'Switch to English'}
          className={styles.langButton}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleLocale();
            }
          }}
        >
          {currentLocale === 'en' ? 'JA' : 'EN'}
        </button>
        <button
          onClick={() => setIsSettingsOpen(true)}
          aria-label={t.settings.openSettings}
          aria-expanded={isSettingsOpen}
          aria-controls="settings-modal"
          className={styles.settingsButton}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsSettingsOpen(true);
            }
          }}
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
        translations={t.tuner}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isLowMode={isLowMode}
        onModeChange={setIsLowMode}
        translations={t.settings}
      />
    </main>
  );
} 