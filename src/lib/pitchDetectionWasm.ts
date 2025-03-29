import init, { PitchDetector, init_panic_hook } from 'pitch-detector';

export class PitchDetectorWasm {
  private detector: PitchDetector | null = null;
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private source: MediaStreamAudioSourceNode | null = null;
  private timeDomainBuffer: Float32Array;
  private isInitialized: boolean = false;

  constructor() {
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.timeDomainBuffer = new Float32Array(1024);
    console.log('Buffer size:', this.timeDomainBuffer.length);
  }

  async initialize(stream: MediaStream) {
    if (!this.isInitialized) {
      // WebAssemblyモジュールの初期化
      await init();
      init_panic_hook();
      this.isInitialized = true;
    }
    
    // ピッチ検出器の初期化
    this.detector = PitchDetector.new(
      this.audioContext.sampleRate,
      1024
    );

    // オーディオソースの設定
    this.source = this.audioContext.createMediaStreamSource(stream);
    this.source.connect(this.analyser);
  }

  detectPitch(): number {
    if (!this.audioContext || !this.analyser || !this.detector) {
      console.warn('PitchDetectorWasm not initialized');
      return 0;
    }

    try {
      // 時系列データの取得（1024サンプルに制限）
      const tempBuffer = new Float32Array(this.analyser.frequencyBinCount * 2);
      this.analyser.getFloatTimeDomainData(tempBuffer);
      
      // 最初の1024サンプルをコピー
      const timeDomainBuffer = tempBuffer.slice(0, 1024);

      // バッファサイズの確認
      console.log('Buffer size:', timeDomainBuffer.length);

      // 信号強度の計算
      const signalStrength = Math.sqrt(
        timeDomainBuffer.reduce((sum, x) => sum + x * x, 0) / timeDomainBuffer.length
      );
      console.log('TypeScript signal strength:', signalStrength);

      // ピッチ検出
      const freq = this.detector.detect_pitch(timeDomainBuffer);
      console.log('TypeScript detected pitch:', freq);

      return freq;
    } catch (error) {
      console.error('Error in detectPitch:', error);
      return 0;
    }
  }

  cleanup() {
    if (this.source) {
      this.source.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    if (this.detector) {
      this.detector.free();
    }
  }
} 