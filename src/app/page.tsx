"use client";

import { useEffect, useState, useCallback } from "react";
// @ts-expect-error CSS Modulesの型定義がNext.js 13 App Routerで認識されない問題の一時的な回避策
import styles from "./page.module.css";

const NOTE_NAMES = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
const A4_FREQ = 440.0;

// 全周波数範囲（C1からC8まで）
const FREQ_RANGE = {
  min: 30,   // C1 = 32.70 Hz
  max: 4200  // C8 = 4186.01 Hz
};

// チューニング許容範囲（セント）
const TUNING_THRESHOLD = 5;

export default function Tuner() {
  const [frequency, setFrequency] = useState<number | null>(null);
  const [note, setNote] = useState<string>("");
  const [cents, setCents] = useState<number>(0);
  const [isInTune, setIsInTune] = useState<boolean>(false);

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

    const detectPitch = () => {
      const frequencyData = new Float32Array(analyser.frequencyBinCount);
      analyser.getFloatFrequencyData(frequencyData);

      const nyquist = audioContext.sampleRate / 2;
      const range = FREQ_RANGE;
      const peaks: Array<{ frequency: number; amplitude: number }> = [];

      // ピーク検出
      for (let i = 1; i < frequencyData.length - 1; i++) {
        const frequency = (i * nyquist) / frequencyData.length;
        if (frequency < range.min || frequency > range.max) continue;

        const amplitude = frequencyData[i];
        if (amplitude <= -60) continue; // ノイズフィルタリング

        // ローカルピークの検出
        if (amplitude > frequencyData[i - 1] && amplitude > frequencyData[i + 1]) {
          peaks.push({ frequency, amplitude });
        }
      }

      // 振幅でソートし、上位のピークを取得
      peaks.sort((a, b) => b.amplitude - a.amplitude);
      const topPeaks = peaks.slice(0, 5);

      // 基本周波数の推定
      let fundamentalFreq = 0;
      if (topPeaks.length > 0) {
        // スペクトル重心法を使用して基本周波数を推定
        let weightedSum = 0;
        let amplitudeSum = 0;

        for (const peak of topPeaks) {
          const weight = Math.pow(10, peak.amplitude / 20); // dBを線形スケールに変換
          weightedSum += peak.frequency * weight;
          amplitudeSum += weight;
        }

        // 基本周波数の推定（最も低い周波数に近い倍音を選択）
        const spectralCentroid = weightedSum / amplitudeSum;
        const lowestPeak = topPeaks[0];
        const harmonicIndex = Math.round(spectralCentroid / lowestPeak.frequency);

        fundamentalFreq = harmonicIndex > 0 ?
          spectralCentroid / harmonicIndex :
          lowestPeak.frequency;
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

        const detectedNote = getNote(medianFreq);
        const newCents = getCents(medianFreq, detectedNote);

        setFrequency(medianFreq);
        setNote(detectedNote);
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
  }, [getNote, getCents]);

  return (
    <main className={styles.main}>
      <div className={styles.tunerContainer}>
        <div className={`${styles.tunerNote} ${isInTune ? styles.inTune : ''}`}>
          {note || "-"}
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
