import { GainControl } from '../src/lib/gainControl';

describe('GainControl', () => {
  let gainControl: GainControl;
  let mockAudioContext: AudioContext;
  let mockGainNode: GainNode;

  beforeEach(() => {
    mockGainNode = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      gain: {
        setTargetAtTime: jest.fn()
      },
      context: {
        currentTime: 0
      }
    } as unknown as GainNode;

    mockAudioContext = {
      createGain: jest.fn().mockReturnValue(mockGainNode),
      currentTime: 0
    } as unknown as AudioContext;

    gainControl = new GainControl(mockAudioContext);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getNode', () => {
    it('should return the gain node', () => {
      const node = gainControl.getNode();
      expect(node).toBe(mockGainNode);
    });
  });

  describe('setTargetLevel', () => {
    it('should clamp the target level between 0 and 1', () => {
      gainControl.setTargetLevel(2.0);
      expect(gainControl['targetLevel']).toBe(1.0);

      gainControl.setTargetLevel(-1.0);
      expect(gainControl['targetLevel']).toBe(0.0);
    });
  });

  describe('setSmoothingFactor', () => {
    it('should clamp the smoothing factor between 0 and 1', () => {
      gainControl.setSmoothingFactor(2.0);
      expect(gainControl['smoothingFactor']).toBe(1.0);

      gainControl.setSmoothingFactor(-1.0);
      expect(gainControl['smoothingFactor']).toBe(0.0);
    });
  });

  describe('updateGain', () => {
    it('should not update gain when rms level is 0', () => {
      gainControl.updateGain(0);
      expect(mockGainNode.gain.setTargetAtTime).not.toHaveBeenCalled();
    });

    it('should update gain based on current rms level', () => {
      gainControl.updateGain(0.1);
      expect(mockGainNode.gain.setTargetAtTime).toHaveBeenCalledWith(
        expect.any(Number),
        mockGainNode.context.currentTime,
        0.1
      );
    });

    it('should clamp gain between MIN_GAIN and MAX_GAIN', () => {
      gainControl.updateGain(0.0001); // 非常に小さい値
      expect(mockGainNode.gain.setTargetAtTime).toHaveBeenCalledWith(
        expect.any(Number),
        mockGainNode.context.currentTime,
        0.1
      );
    });
  });
}); 