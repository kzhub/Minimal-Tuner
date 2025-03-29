import { useEffect } from "react";
import styles from "../app/page.module.css";
import { type Translation } from "../lib/constants";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLowMode: boolean;
  onModeChange: (isLow: boolean) => void;
  translations: Translation['settings'];
}

export function SettingsModal({
  isOpen,
  onClose,
  isLowMode,
  onModeChange,
  translations,
}: SettingsModalProps) {
  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  // モード変更時にモーダルを閉じる
  const handleModeChange = () => {
    onModeChange(!isLowMode);
    // スイッチのアニメーションを確認できるように遅延して閉じる
    setTimeout(() => {
      onClose();
    }, 850); // 500ミリ秒の遅延
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        id="settings-modal"
      >
        <div className={styles.modalHeader}>
          <h2 id="settings-modal-title">{translations.openSettings}</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label={translations.closeSettings}
          >
            ×
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.settingItem}>
            <label htmlFor="mode-toggle">{translations.mode.label}</label>
            <div className={styles.switchContainer}>
              <label className={styles.switch}>
                <input
                  id="mode-toggle"
                  type="checkbox"
                  checked={isLowMode}
                  onChange={handleModeChange}
                  aria-label={`${translations.mode.label} ${translations.mode.guitar}/${translations.mode.bass}`}
                />
                <span className={styles.slider}></span>
              </label>
              <div className={styles.switchLabel}>
                <span>{translations.mode.guitar}</span>
                <span>{translations.mode.bass}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
