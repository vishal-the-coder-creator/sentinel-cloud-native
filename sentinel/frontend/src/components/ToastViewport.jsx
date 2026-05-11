import { useEffect } from "react";

export default function ToastViewport({ toasts, onDismiss }) {
  useEffect(() => {
    if (toasts.length === 0) {
      return undefined;
    }

    const timeoutIds = toasts.map((toast) =>
      window.setTimeout(() => {
        onDismiss(toast.id);
      }, 3200)
    );

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [onDismiss, toasts]);

  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div className={`toast toast-${toast.tone}`} key={toast.id}>
          <span className="toast__dot" aria-hidden="true" />
          <p>{toast.message}</p>
          <button type="button" onClick={() => onDismiss(toast.id)}>
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}
