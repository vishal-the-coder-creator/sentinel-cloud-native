export default function EmptyState({ message, actionLabel, onAction }) {
  return (
    <div className="empty-state" role="status" aria-live="polite">
      <div className="empty-state__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path
            d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8A2.5 2.5 0 0 1 17.5 17h-5.086L8.707 20.707A1 1 0 0 1 7 20v-3H6.5A2.5 2.5 0 0 1 4 14.5z"
            fill="currentColor"
            opacity="0.18"
          />
          <path
            d="M8 9h8M8 12h5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p>{message}</p>
      {actionLabel && onAction ? (
        <button className="primary-button empty-state__action" onClick={onAction} type="button">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
