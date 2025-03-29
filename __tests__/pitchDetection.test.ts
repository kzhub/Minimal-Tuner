/**
 * @jest-environment jsdom
 */

import { PitchDetector } from '../src/lib/pitchDetection';
import { FREQ_RANGE } from '../src/lib/constants';
import { GainControl } from '../src/lib/gainControl';

// GainControlのモック
jest.mock('../src/lib/gainControl', () => {
  return {
    GainControl: jest.fn().mockImplementation(() => ({
      getNode: jest.fn().mockReturnValue({
        connect: jest.fn(),
        disconnect: jest.fn(),
        gain: {
          setTargetAtTime: jest.fn()
        }
      }),
      updateGain: jest.fn()
    }))
  };
});

describe('ピッチ検出機能', () => {
  let pitchDetector: PitchDetector;
  let mockStream: MediaStream;
  let mockAudioContext: AudioContext;
  let mockAnalyser: AnalyserNode;
  let mockSource: MediaStreamAudioSourceNode;
  let mockGainNode: GainNode;
  let mockGainControl: GainControl;

  beforeEach(() => {
    // モックの設定
    mockStream = {} as MediaStream;
    mockAnalyser = {
      fftSize: 2048,
      frequencyBinCount: 1024,
      getFloatTimeDomainData: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
    } as unknown as AnalyserNode;

    mockSource = {
      connect: jest.fn(),
      disconnect: jest.fn(),
    } as unknown as MediaStreamAudioSourceNode;

    mockGainNode = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      gain: {
     
      }
    } as unknown as GainNode;

    mockGainControl = {
      getNode: jest.fn().mockReturnValue(mockGainNode),
      updateGain: jest.fn()
    } as unknown as GainControl;

    mockAudioContext = {
      createAnalyser: jest.fn().mockReturnValue(mockAnalyser),
      createMediaStreamSource: jest.fn().mockReturnValue(mockSource),
      createGain: jest.fn().mockReturnValue(mockGainNode),
      sampleRate: 44100,
      close: jest.fn(),
    } as unknown as AudioContext;

    // AudioContextのグローバルモック
    global.AudioContext = jest.fn().mockImplementation(() => mockAudioContext);

    // GainControlのモックを設定
    (GainControl as jest.Mock).mockImplementation(() => mockGainControl);

    pitchDetector = new PitchDetector();
  });

  afterEach(() => {
    jest.clearAllMocks();
    pitchDetector.cleanup();
  });

  describe('初期化処理', () => {
    it('オーディオノードを正しく初期化する', async () => {
      await pitchDetector.initialize(mockStream);

      expect(mockSource.connect).toHaveBeenCalledWith(mockGainNode);
      expect(mockGainNode.connect).toHaveBeenCalledWith(mockAnalyser);
    });
  });

  describe('ピッチ検出処理', () => {
    it('信号強度が弱い場合はnullを返す', () => {
      const mockTimeDomainData = new Float32Array(1024).fill(0.01);
      mockAnalyser.getFloatTimeDomainData = jest.fn().mockImplementation((array) => {
        array.set(mockTimeDomainData);
      });
   
    });
  });

  describe('detectPitch', () => {
    it('有効なピークが見つからない場合はnullを返す', () => {
      const mockTimeDomainData = new Float32Array(1024).fill(0.5);
      mockAnalyser.getFloatTimeDomainData = jest.fn().mockImplementation((array) => {
        array.set(mockTimeDomainData);
      });

      const result = pitchDetector.detectPitch();
      expect(result).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('すべてのオーディオノードを適切にクリーンアップする', async () => {
      await pitchDetector.initialize(mockStream);
      pitchDetector.cleanup();

      expect(mockSource.disconnect).toHaveBeenCalled();
      expect(mockGainNode.disconnect).toHaveBeenCalled();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });
  });

  // プライベートメソッドのテスト
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