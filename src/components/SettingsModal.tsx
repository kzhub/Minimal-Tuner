import { useEffect, useRef } from "react";
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
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  // モーダルが開いた時にフォーカスを設定
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  // モーダルが閉じた時にフォーカスを復元
  useEffect(() => {
    if (!isOpen && previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isOpen]);

  // モード変更時にモーダルを閉じる
  const handleModeChange = () => {
    onModeChange(!isLowMode);
    // スイッチのアニメーションを確認できるように遅延して閉じる
    setTimeout(() => {
      onClose();
    }, 850);
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
        ref={modalRef}
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        id="settings-modal"
        tabIndex={-1}
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
                <span className={styles.slider} aria-hidden="true"></span>
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
