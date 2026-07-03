export default function DeleteModal({ open, title, message, onConfirm, onClose }) {
  if (!open) return null;

  return (
    <div className="delete-modal-overlay" onClick={onClose}>
      <div
        className="delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="delete-modal-title">{title}</h3>
        <p>{message}</p>

        <div className="delete-modal-actions">
          <button
            type="button"
            className="action-btn edit-btn"
            onClick={onClose}
          >
            Ləğv et
          </button>

          <button
            type="button"
            className="action-btn delete-btn"
            onClick={onConfirm}
          >
            Sil
          </button>
        </div>
      </div>
    </div>
  );
}
