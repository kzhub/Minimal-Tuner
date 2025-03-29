import { useEffect, useState, useRef } from 'react';
import { PitchDetectorWasm } from '../lib/pitchDetectionWasm';
import { Note } from '../lib/note';
import { getClosestNote } from '../lib/noteUtils';

export default function Tuner() {
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [cents, setCents] = useState<number>(0);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const detectorRef = useRef<PitchDetectorWasm | null>(null);

  useEffect(() => {
    const startListening = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            autoGainControl: false,
            noiseSuppression: false
          }
        });

        const detector = new PitchDetectorWasm();
        await detector.initialize(stream);
        detectorRef.current = detector;
        setIsListening(true);
        setError(null);

        const updatePitch = () => {
          if (!detectorRef.current) return;

          const frequency = detectorRef.current.detectPitch();
          if (frequency) {
            const { note, cents } = getClosestNote(frequency);
            setCurrentNote(note);
            setCents(cents);
          }
          requestAnimationFrame(updatePitch);
        };

        updatePitch();
      } catch (error) {
        console.error('Error accessing microphone:', error);
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            setError('マイクへのアクセスが拒否されました。ブラウザの設定でマイクへのアクセスを許可してください。');
          } else {
            setError(`マイクの初期化中にエラーが発生しました: ${error.message}`);
          }
        }
        setIsListening(false);
      }
    };

    startListening();

    return () => {
      if (detectorRef.current) {
        detectorRef.current.cleanup();
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold mb-8 text-center">Tuner</h1>

        {error ? (
          <div className="text-red-500 text-center mb-4">
            {error}
          </div>
        ) : (
          <>
            <div className="text-center">
              <div className="text-6xl font-bold mb-4">
                {currentNote ? `${currentNote.name}${currentNote.octave}` : '--'}
              </div>
              <div className="text-2xl text-gray-600">
                {cents > 0 ? `+${cents.toFixed(1)}` : cents.toFixed(1)} cents
              </div>
            </div>

            <div className="mt-8">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-200"
                  style={{
                    width: '50%',
                    transform: `translateX(${cents * 2}%)`
                  }}
                />
              </div>
            </div>
          </>
        )}

        <div className="mt-4 text-center text-sm text-gray-500">
          {isListening ? 'Listening...' : 'Initializing...'}
        </div>
      </div>
    </div>
  );
} 