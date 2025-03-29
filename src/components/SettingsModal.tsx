import { useEffect } from "react";
import styles from "../app/page.module.css";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLowMode: boolean;
  onModeChange: (isLow: boolean) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  isLowMode,
  onModeChange,
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
          <h2 id="settings-modal-title">settings</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.settingItem}>
            <label htmlFor="mode-toggle">mode</label>
            <div className={styles.switchContainer}>
              <label className={styles.switch}>
                <input
                  id="mode-toggle"
                  type="checkbox"
                  checked={isLowMode}
                  onChange={handleModeChange}
                  aria-label="Toggle mode"
                />
                <span className={styles.slider}></span>
              </label>
              <div className={styles.switchLabel}>
                <span>high</span>
                <span>low</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
