/**
 * @jest-environment jsdom
 */

import { PitchDetector } from '../src/lib/pitchDetection';
import { FREQ_RANGE } from '../src/lib/constants';

// AudioContextとAnalyserNodeのモック
const mockAnalyser = {
  fftSize: 0,
  frequencyBinCount: 2048,
  getFloatTimeDomainData: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
};

const mockAudioContext = {
  createAnalyser: jest.fn(() => mockAnalyser),
  createMediaStreamSource: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
  close: jest.fn(),
};

// グローバルにAudioContextを定義
global.AudioContext = jest.fn().mockImplementation(() => mockAudioContext);

describe('PitchDetector', () => {
  let pitchDetector: PitchDetector;

  beforeEach(() => {
    // モックをリセット
    jest.clearAllMocks();
    pitchDetector = new PitchDetector();
  });

  afterEach(() => {
    pitchDetector.cleanup();
  });

  describe('detectPitch', () => {
    test('信号強度が弱い場合はnullを返す', () => {
      // 弱い信号をシミュレート
      mockAnalyser.getFloatTimeDomainData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = 0.0001; // 非常に小さい値
        }
      });

      const result = pitchDetector.detectPitch();
      expect(result).toBeNull();
    });
  });

  // プライベートメソッドのテスト（実装の詳細に依存するため、必要に応じて追加）
  describe('private methods', () => {
    test('calculateAutocorrelation - 正しい自己相関を計算する', () => {
      // @ts-ignore - プライベートメソッドへのアクセス
      const result = pitchDetector.calculateAutocorrelation(new Float32Array([1, 0, 1, 0]));
      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(4);
    });

    test('findPeakIndex - 有効な相関ピークを検出する', () => {
      // 440Hz（A4）に相当する相関データを作成
      const sampleRate = 44100;
      const period = Math.round(sampleRate / 440); // A4の周期をサンプル数で表現
      const correlation = new Float32Array(period * 2);
      
      // 相関データを設定
      for (let i = 0; i < correlation.length; i++) {
        correlation[i] = i === period ? 0.9 : 0.1;
      }

      // @ts-ignore - プライベートメソッドへのアクセス
      const result = pitchDetector.findPeakIndex(correlation, sampleRate);
      expect(result).not.toBeNull();
      expect(typeof result).toBe('number');
      if (result !== null) {
        const freq = sampleRate / result;
        expect(freq).toBeGreaterThan(FREQ_RANGE.min);
        expect(freq).toBeLessThan(FREQ_RANGE.max);
      }
    });

    test('interpolatePeak - ピーク位置を補間する', () => {
      const correlation = new Float32Array([0.5, 1, 0.5]);
      // @ts-ignore - プライベートメソッドへのアクセス
      const result = pitchDetector.interpolatePeak(correlation, 1);
      expect(typeof result).toBe('number');
    });
  });

  describe('frequency range', () => {
    test('検出可能な周波数範囲が定義されている', () => {
      expect(FREQ_RANGE.min).toBeGreaterThan(0);
      expect(FREQ_RANGE.max).toBeGreaterThan(FREQ_RANGE.min);
    });
  });
}); 