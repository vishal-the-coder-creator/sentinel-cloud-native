import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

export default function LoadingSkeleton({
  className = "",
  count = 1,
  height,
  inline = false,
  circle = false,
}) {
  return (
    <SkeletonTheme
      baseColor="var(--skeleton-base)"
      highlightColor="var(--skeleton-highlight)"
      borderRadius="18px"
      duration={1.2}
    >
      <Skeleton
        className={`loading-skeleton ${className}`.trim()}
        count={count}
        height={height}
        inline={inline}
        circle={circle}
        aria-hidden="true"
      />
    </SkeletonTheme>
  );
}
