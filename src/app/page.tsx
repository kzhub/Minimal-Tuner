"use client";

import { useEffect, useState, useCallback } from "react";
// @ts-expect-error CSS Modulesの型定義がNext.js 13 App Routerで認識されない問題の一時的な回避策
import styles from "./page.module.css";

// 音名とオクターブ情報を含む配列
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const A4_FREQ = 440.0;
const A4_NOTE_NUMBER = 69; // MIDIノートナンバーでのA4

// 全周波数範囲（C1からC8まで）
const FREQ_RANGE = {
  min: 30,   // C1 = 32.70 Hz
  max: 4200  // C8 = 4186.01 Hz
};

// チューニング許容範囲（セント）
const TUNING_THRESHOLD = 5;

// MIDIノートナンバーから周波数を計算
function midiNoteToFreq(noteNumber: number): number {
  return A4_FREQ * Math.pow(2, (noteNumber - A4_NOTE_NUMBER) / 12);
}

// 周波数から最も近い平均率の音を見つける
function findClosestEqualTemperamentNote(freq: number): { noteNumber: number; cents: number } {
  const noteNumber = Math.round(12 * Math.log2(freq / A4_FREQ) + A4_NOTE_NUMBER);
  const equalTemperamentFreq = midiNoteToFreq(noteNumber);
  const cents = Math.round(1200 * Math.log2(freq / equalTemperamentFreq));
  return { noteNumber, cents };
}

// MIDIノートナンバーから音名とオクターブを取得
function getNoteNameWithOctave(noteNumber: number): string {
  const octave = Math.floor((noteNumber - 12) / 12);
  const noteIndex = ((noteNumber % 12) + 12) % 12;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

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
    let audioContext: AudioContext;
    let analyser: AnalyserNode;
    let source: MediaStreamAudioSourceNode;
    let animationFrame: number;
    const movingAverageBuffer: number[] = [];

    // 自己相関による基本周波数検出
    const detectPitch = () => {
      const timeDomainData = new Float32Array(analyser.frequencyBinCount);
      analyser.getFloatTimeDomainData(timeDomainData);

      const correlationData = new Float32Array(timeDomainData.length);
      const range = FREQ_RANGE;

      // 自己相関関数の計算
      for (let lag = 0; lag < correlationData.length; lag++) {
        let correlation = 0;
        for (let i = 0; i < correlationData.length - lag; i++) {
          correlation += timeDomainData[i] * timeDomainData[i + lag];
        }
        correlationData[lag] = correlation;
      }

      // ピーク検出
      let maxCorrelation = -Infinity;
      let fundamentalFreq = 0;
      const sampleRate = audioContext.sampleRate;
      const minLag = Math.floor(sampleRate / range.max);
      const maxLag = Math.ceil(sampleRate / range.min);

      for (let lag = minLag; lag <= maxLag; lag++) {
        if (correlationData[lag] > correlationData[lag - 1] &&
          correlationData[lag] > correlationData[lag + 1] &&
          correlationData[lag] > maxCorrelation) {
          // 自己相関のピークを検出
          const freq = sampleRate / lag;
          if (freq >= range.min && freq <= range.max) {
            maxCorrelation = correlationData[lag];
            fundamentalFreq = freq;
          }
        }
      }

      if (fundamentalFreq > 0) {
        // 動的バッファサイズの調整（低音域ではより大きく）
        const dynamicBufferSize = fundamentalFreq < 100 ? 8 :
          fundamentalFreq < 200 ? 6 :
            4;

        // 移動平均の計算
        movingAverageBuffer.push(fundamentalFreq);
        if (movingAverageBuffer.length > dynamicBufferSize) {
          movingAverageBuffer.shift();
        }

        // 中央値フィルタリングを適用
        const sortedBuffer = [...movingAverageBuffer].sort((a, b) => a - b);
        const medianFreq = sortedBuffer[Math.floor(sortedBuffer.length / 2)];

        const { noteName, cents: newCents } = analyzeNote(medianFreq);

        setFrequency(medianFreq);
        setNote(noteName.slice(0, -1)); // オクターブ番号を除いた音名
        setNoteWithOctave(noteName);
        setCents(newCents);

        // チューニング状態の更新
        setIsInTune(Math.abs(newCents) <= TUNING_THRESHOLD);
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
  }, [analyzeNote]);

  return (
    <main className={styles.main}>
      <div className={styles.tunerContainer}>
        <div className={`${styles.tunerNote} ${isInTune ? styles.inTune : ''}`}>
          {note || "-"}{" "}
          <span style={{ fontSize: "0.4em", verticalAlign: "super" }}>
            {noteWithOctave ? noteWithOctave.slice(-1) : ""}
          </span>
          <div className={`${styles.tuningIndicator} ${isInTune ? styles.inTune : ''}`} />
        </div>
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
