import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';


export function Modal({ open, title, onClose, children, footer, size = 'md' }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    const previousOverflow = document.body.style.overflow;
    
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    if (dialogRef.current) dialogRef.current.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`modal ${size === 'sm' ? 'modal--sm' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="modal__header">
          <h2 className="modal__title" id="modal-title">
            {title}
          </h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close dialog">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="modal__body">{children}</div>

        {footer ? <div className="modal__footer">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}
