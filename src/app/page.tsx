"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./page.module.css";

const NOTE_NAMES = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
const A4_FREQ = 440.0;

// ギターとベースの周波数範囲
const FREQ_RANGES = {
  guitar: { min: 80, max: 1200 }, // E2からE6まで
  bass: { min: 40, max: 400 }, // E1からG4まで
} as const;

type Instrument = keyof typeof FREQ_RANGES;

export default function Tuner() {
  const [frequency, setFrequency] = useState<number | null>(null);
  const [note, setNote] = useState<string>("");
  const [cents, setCents] = useState<number>(0);
  const [instrument, setInstrument] = useState<Instrument>("guitar");

  const getNote = useCallback((frequency: number) => {
    const noteNum = 12 * (Math.log2(frequency / A4_FREQ));
    const noteIndex = Math.round(noteNum) % 12;
    if (noteIndex < 0) {
      return NOTE_NAMES[noteIndex + 12];
    }
    return NOTE_NAMES[noteIndex];
  }, []);

  const getCents = useCallback((frequency: number, note: string) => {
    const baseFreq = A4_FREQ * Math.pow(2, NOTE_NAMES.indexOf(note) / 12);
    const cents = Math.round(1200 * Math.log2(frequency / baseFreq));
    return cents;
  }, []);

  useEffect(() => {
    let audioContext: AudioContext;
    let analyser: AnalyserNode;
    let source: MediaStreamAudioSourceNode;
    let animationFrame: number;
    const movingAverageBuffer: number[] = [];
    const BUFFER_SIZE = 5; // 移動平均のバッファサイズ

    const detectPitch = () => {
      const frequencyData = new Float32Array(analyser.frequencyBinCount);
      analyser.getFloatFrequencyData(frequencyData);

      const nyquist = audioContext.sampleRate / 2;
      let maxAmplitude = -Infinity;
      let maxFrequency = 0;
      const range = FREQ_RANGES[instrument];

      // 周波数スペクトルの分析
      for (let i = 0; i < frequencyData.length; i++) {
        const frequency = (i * nyquist) / frequencyData.length;
        const amplitude = frequencyData[i];

        if (
          frequency >= range.min &&
          frequency <= range.max &&
          amplitude > -60 && // ノイズフィルタリング
          amplitude > maxAmplitude
        ) {
          maxAmplitude = amplitude;
          maxFrequency = frequency;
        }
      }

      if (maxFrequency > 0) {
        // 移動平均の計算
        movingAverageBuffer.push(maxFrequency);
        if (movingAverageBuffer.length > BUFFER_SIZE) {
          movingAverageBuffer.shift();
        }

        const avgFreq = movingAverageBuffer.reduce((a, b) => a + b) / movingAverageBuffer.length;

        setFrequency(avgFreq);
        const detectedNote = getNote(avgFreq);
        setNote(detectedNote);
        setCents(getCents(avgFreq, detectedNote));
      }

      animationFrame = requestAnimationFrame(detectPitch);
    };

    const startAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 32768; // より高精度な周波数分析
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
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
      if (source) {
        source.disconnect();
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [instrument, getNote, getCents]);

  return (
    <main className={styles.main}>
      <div className={styles.tunerContainer}>
        <select
          value={instrument}
          onChange={(e) => setInstrument(e.target.value as Instrument)}
          className={styles.instrumentSelect}
        >
          <option value="guitar">Guitar</option>
          <option value="bass">Bass</option>
        </select>
        <div className={styles.tunerNote}>{note || "-"}</div>
        <div className={styles.tunerFreq}>
          {frequency ? `${frequency.toFixed(1)} Hz` : "- Hz"}
        </div>
        <div className={styles.tunerCents}>
          {cents ? `${cents > 0 ? "+" : ""}${cents}` : "0"} cents
        </div>
        <div
          className={styles.needle}
          style={{
            transform: `rotate(${Math.min(Math.max(-45, cents / 2), 45)}deg)`
          }}
        />
      </div>
    </main>
  );
}
