import styles from "../app/page.module.css";
import { type Translation } from "../lib/constants";

interface TunerDisplayProps {
  note: string;
  noteWithOctave: string;
  frequency: number | null;
  cents: number;
  isInTune: boolean;
  translations: Translation['tuner'];
}

export function TunerDisplay({
  note,
  noteWithOctave,
  frequency,
  cents,
  isInTune,
  translations,
}: TunerDisplayProps) {
  return (
    <div className={styles.tunerContainer}>
      <div className={`${styles.tunerNote} ${isInTune ? styles.inTune : ""}`}>
        {note || "-"}{" "}
        <span style={{ fontSize: "0.4em", verticalAlign: "super" }}>
          {noteWithOctave ? noteWithOctave.slice(-1) : ""}
        </span>
        <div
          className={`${styles.tuningIndicator} ${isInTune ? styles.inTune : ""
            }`}
        />
      </div>
      <div className={styles.tunerFreq}>
        {frequency ? `${frequency.toFixed(1)} ${translations.hertz}` : `- ${translations.hertz}`}
      </div>
      <div className={styles.tunerCents}>
        {cents ? `${cents > 0 ? "+" : ""}${cents}` : "0"} {translations.cents}
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
