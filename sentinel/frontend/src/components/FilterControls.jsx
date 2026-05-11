import KeywordCombobox from "./KeywordCombobox.jsx";

const hourOptions = [
  { value: 1, label: "Last hour" },
  { value: 6, label: "Last 6 hours" },
  { value: 24, label: "Last 24 hours" },
  { value: 168, label: "Last 7 days" },
  { value: 720, label: "Last 30 days" },
];

export default function FilterControls({ filters, keywords, theme, onChange, onToggleTheme }) {
  return (
    <section className="control-panel panel">
      <div className="control-copy">
        <p className="section-kicker">Live Filters</p>
        <h2>Slice the stream by keyword, traffic window, and live signal intensity</h2>
      </div>

      <div className="control-actions">
        <label className="field">
          <span>Keyword explorer</span>
          <KeywordCombobox options={keywords} value={filters.keyword} onChange={onChange} />
        </label>

        <label className="field field-compact">
          <span>Time range</span>
          <select
            value={filters.hours}
            onChange={(event) => onChange({ hours: Number(event.target.value) })}
          >
            {hourOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button className="theme-switch" type="button" onClick={onToggleTheme}>
          <span className="theme-switch__icon" aria-hidden="true">
            {theme === "dark" ? "L" : "D"}
          </span>
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </section>
  );
}
