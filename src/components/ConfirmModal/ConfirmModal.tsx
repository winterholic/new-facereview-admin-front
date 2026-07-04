import type { ReactElement, ReactNode } from 'react';

import './confirmModal.scss';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  isSubmitting?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal = ({
  isOpen,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  danger,
  isSubmitting,
  children,
  onConfirm,
  onCancel,
}: ConfirmModalProps): ReactElement | null => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal__overlay" onClick={onCancel}>
      <div className="confirm-modal__panel" onClick={(event) => event.stopPropagation()}>
        <h3 className="confirm-modal__title font-title-mini">{title}</h3>
        {description && (
          <p className="confirm-modal__description font-body-medium">{description}</p>
        )}
        {children && <div className="confirm-modal__body">{children}</div>}
        <div className="confirm-modal__actions">
          <button
            type="button"
            className="confirm-modal__button confirm-modal__button--cancel font-label-medium"
            onClick={onCancel}
            disabled={isSubmitting}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`confirm-modal__button font-label-medium${
              danger ? ' confirm-modal__button--danger' : ' confirm-modal__button--primary'
            }`}
            onClick={onConfirm}
            disabled={isSubmitting}>
            {isSubmitting ? '처리 중...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
