import EmptyState from "./EmptyState.jsx";
import LoadingSkeleton from "./LoadingSkeleton.jsx";

export default function ChartCard({
  title,
  eyebrow,
  description,
  loading,
  empty,
  emptyMessage,
  emptyActionLabel,
  onEmptyAction,
  className = "",
  children,
}) {
  return (
    <section className={`panel chart-card ${className}`.trim()}>
      <div className="panel-heading">
        <div>
          <p className="section-kicker">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        {description ? <p className="panel-description">{description}</p> : null}
      </div>

      <div className="chart-body">
        {loading ? (
          <div className="chart-skeleton">
            <LoadingSkeleton className="skeleton-chart-header" />
            <LoadingSkeleton className="skeleton-chart" />
          </div>
        ) : empty ? (
          <EmptyState message={emptyMessage} actionLabel={emptyActionLabel} onAction={onEmptyAction} />
        ) : (
          children
        )}
      </div>
    </section>
  );
}
