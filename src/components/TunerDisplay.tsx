import styles from "../app/page.module.css";

// 楽器モードのタイプ定義
type InstrumentMode = "guitar" | "bass";

interface TunerDisplayProps {
  note: string;
  noteWithOctave: string;
  frequency: number | null;
  cents: number;
  isInTune: boolean;
  isLowMode: boolean;
}

export function TunerDisplay({
  note,
  noteWithOctave,
  frequency,
  cents,
  isInTune,
  isLowMode,
}: TunerDisplayProps) {
  return (
    <div className={styles.tunerContainer}>
      <div className={styles.instrumentMode}>{isLowMode ? "🎻" : "🎸"}</div>
      <div className={`${styles.tunerNote} ${isInTune ? styles.inTune : ""}`}>
        {note || "-"}{" "}
        <span style={{ fontSize: "0.4em", verticalAlign: "super" }}>
          {noteWithOctave ? noteWithOctave.slice(-1) : ""}
        </span>
        <div
          className={`${styles.tuningIndicator} ${
            isInTune ? styles.inTune : ""
          }`}
        />
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
          transform: `rotate(${Math.min(Math.max(-45, cents / 2), 45)}deg)`,
        }}
      />
    </div>
  );
}
