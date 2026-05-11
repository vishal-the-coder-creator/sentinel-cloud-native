import CountUp from "react-countup";

const ResolvedCountUp = CountUp?.default ?? CountUp;

function formatStaticValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Intl.NumberFormat().format(value);
  }

  return value ?? "--";
}

export default function CountUpValue({ value, duration = 1.8, className = "" }) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return <span className={className}>{formatStaticValue(value)}</span>;
  }

  if (typeof ResolvedCountUp !== "function") {
    return <span className={className}>{formatStaticValue(value)}</span>;
  }

  return (
    <span className={className}>
      <ResolvedCountUp end={value} duration={duration} separator="," preserveValue decimals={0} />
    </span>
  );
}
