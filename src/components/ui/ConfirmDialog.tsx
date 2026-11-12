import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center p-2">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
            variant === 'danger'
              ? 'bg-red-50 text-red-600'
              : variant === 'warning'
              ? 'bg-amber-50 text-amber-600'
              : 'bg-blue-50 text-blue-600'
          }`}
        >
          {variant === 'danger' || variant === 'warning' ? (
            <AlertTriangle className="w-6 h-6" />
          ) : (
            <Info className="w-6 h-6" />
          )}
        </div>

        <h3 className="font-heading text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>

        <div className="flex gap-3 w-full justify-center">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="flex-1">
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'maroon' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
