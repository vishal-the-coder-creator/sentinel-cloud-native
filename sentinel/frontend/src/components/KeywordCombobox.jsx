import { useEffect, useMemo, useRef, useState } from "react";

function matchesKeyword(option, query) {
  if (!query.trim()) {
    return true;
  }

  return option.keyword.toLowerCase().includes(query.trim().toLowerCase());
}

export default function KeywordCombobox({ options, value, onChange }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  const filteredOptions = useMemo(() => {
    const ranked = options.filter((option) => matchesKeyword(option, query));
    return ranked.slice(0, 12);
  }, [options, query]);

  const handleSelect = (keyword) => {
    setQuery(keyword);
    setOpen(false);
    onChange({ keyword });
  };

  const handleClear = () => {
    setQuery("");
    setOpen(false);
    onChange({ keyword: "" });
  };

  return (
    <div className="keyword-combobox" ref={rootRef}>
      <div className={`keyword-combobox__shell ${open ? "keyword-combobox__shell-open" : ""}`}>
        <input
          aria-expanded={open}
          aria-label="Search keywords"
          className="keyword-combobox__input"
          placeholder="Search live keywords"
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
            }

            if (event.key === "Enter") {
              const exactMatch = options.find(
                (option) => option.keyword.toLowerCase() === query.trim().toLowerCase()
              );

              if (exactMatch) {
                handleSelect(exactMatch.keyword);
              } else if (!query.trim()) {
                handleClear();
              }
            }
          }}
        />
        {value ? (
          <button className="keyword-combobox__clear" type="button" onClick={handleClear}>
            Clear
          </button>
        ) : (
          <span className="keyword-combobox__hint">Live search</span>
        )}
      </div>

      {open ? (
        <div className="keyword-combobox__menu">
          <button className="keyword-option keyword-option-reset" type="button" onClick={handleClear}>
            <span>All keywords</span>
            <strong>Reset filter</strong>
          </button>

          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                className={`keyword-option ${value === option.keyword ? "keyword-option-active" : ""}`}
                key={option.keyword}
                type="button"
                onClick={() => handleSelect(option.keyword)}
              >
                <span>{option.keyword}</span>
                <strong>{option.count}</strong>
              </button>
            ))
          ) : (
            <div className="keyword-combobox__empty">No matching keywords yet.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
