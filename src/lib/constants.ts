/**
 * 音声チューナーアプリケーションで使用される定数を定義するモジュール
 * 
 * このモジュールは以下の定数を提供します：
 * - 音符名の配列（CからBまでの12音）
 * - 基準音A4の周波数（440Hz）
 * - A4のMIDIノートナンバー
 * - チューナーで検出可能な周波数範囲
 * - チューニングの許容誤差（セント）
 */

export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const A4_FREQ = 440.0;
export const A4_NOTE_NUMBER = 69; // MIDIノートナンバーでのA4

// 周波数範囲の定義
export const FREQ_RANGE = {
  min: 20,  // Hz
  max: 2000 // Hz
};

// 楽器モード別の周波数範囲
export const INSTRUMENT_FREQ_RANGES = {
  guitar: {
    min: 60,   // Hz (ギターの最低音E2は約82.4Hz)
    max: 1000  // Hz (ギターの高音域と倍音を考慮)
  },
  bass: {
    min: 20,   // Hz (5弦ベースのB0は約31Hz)
    max: 400   // Hz (ベースの基音に焦点)
  }
};

export const CORRELATION_THRESHOLD = 0.8;
export const MIN_SIGNAL_STRENGTH = 0.01;
export const FFT_SIZE = 8192;
export const MOVING_AVERAGE_BUFFER_SIZE = 5;

export const TUNING_THRESHOLD = 15;

export const LOCALES = ['en', 'ja'] as const;
export type Locale = typeof LOCALES[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const translations = {
  en: {
    title: 'minimal-tuner | Free Chromatic Tuner',
    description: 'High-precision chromatic tuner for all musical instruments. Perfect for guitar, bass, violin, ukulele, and more. Free online tuner with Free-grade accuracy.',
    keywords: 'chromatic tuner, guitar tuner, bass tuner, violin tuner, ukulele tuner, online tuner, free tuner, professional tuner, musical instrument tuner, pitch tuner',
    ogTitle: 'minimal-tuner | Free Chromatic Tuner',
    ogDescription: 'High-precision chromatic tuner for all musical instruments. Perfect for guitar, bass, violin, ukulele, and more. Free online tuner with Free-grade accuracy.',
    ogLocale: 'en_US',
    settings: {
      openSettings: 'Open Settings',
      closeSettings: 'Close Settings',
      mode: {
        label: 'Mode',
        guitar: 'high',
        bass: 'low',
      },
    },
    tuner: {
      hertz: 'Hz',
      cents: 'cents',
      flat: 'flat',
      sharp: 'sharp',
      inTune: 'In Tune',
      outOfTune: 'Out of Tune',
      mainContent: 'Tuner Display',
    },
  },
  ja: {
    title: 'minimal-tuner | 無料 クロマチックチューナー',
    description: 'すべての楽器に対応した高精度なクロマチックチューナー。ギター、ベース、バイオリン、ウクレレなど、様々な楽器のチューニングに最適。無料で使えるオンラインチューナー。',
    keywords: 'クロマチックチューナー, ギターチューナー, ベースチューナー, バイオリンチューナー, ウクレレチューナー, オンラインチューナー, 無料チューナー, プロフェッショナルチューナー, 楽器チューナー, 音程チューナー',
    ogTitle: 'minimal-tuner | 無料 クロマチックチューナー',
    ogDescription: 'すべての楽器に対応した高精度なクロマチックチューナー。ギター、ベース、バイオリン、ウクレレなど、様々な楽器のチューニングに最適。無料で使えるオンラインチューナー。',
    ogLocale: 'ja_JP',
    settings: {
      openSettings: '設定を開く',
      closeSettings: '設定を閉じる',
      mode: {
        label: 'モード',
        guitar: '高音',
        bass: '低音',
      },
    },
    tuner: {
      hertz: 'ヘルツ',
      cents: 'セント',
      flat: 'フラット',
      sharp: 'シャープ',
      inTune: 'チューニング完了',
      outOfTune: 'チューニングが必要',
      mainContent: 'チューナー表示',
    },
  },
} as const;

export type Translation = typeof translations[Locale];
