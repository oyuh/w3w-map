"use client";

import { useState, useRef, useEffect, useMemo } from "react";

interface WordSelectorProps {
  label: string;
  words: string[];
  value: string;
  onChange: (word: string) => void;
  disabled?: boolean;
  autoValue?: string;
  allowWildcard?: boolean;
}

export default function WordSelector({
  label,
  words,
  value,
  onChange,
  disabled = false,
  autoValue,
  allowWildcard = false,
}: WordSelectorProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoValue && !value) {
      onChange(autoValue);
    }
  }, [autoValue, onChange, value]);

  const filtered = useMemo(() => {
    const results: string[] = [];
    if (allowWildcard && (!query || "*".startsWith(query.toLowerCase()))) {
      results.push("*");
    }
    if (!query) return [...results, ...words.slice(1, 101)];
    const q = query.toLowerCase();
    for (let i = 1; i < words.length && results.length < 50; i++) {
      if (words[i].startsWith(q)) results.push(words[i]);
    }
    if (results.length < 50) {
      for (let i = 1; i < words.length && results.length < 50; i++) {
        if (!words[i].startsWith(q) && words[i].includes(q))
          results.push(words[i]);
      }
    }
    return results;
  }, [words, query, allowWildcard]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (word: string) => {
    onChange(word);
    setQuery("");
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-[10px] uppercase tracking-widest text-brutal-dim mb-1">
        {label}
      </label>
      {value ? (
        <div className="flex items-center bg-brutal-surface border-2 border-brutal-highlight px-3 py-1.5 text-sm">
          <span className={`flex-1 font-bold ${value === "*" ? "text-brutal-accent" : "text-brutal-text"}`}>
            {value === "*" ? "★ Any (wildcard)" : value}
          </span>
          <button
            onClick={handleClear}
            className="text-brutal-dim hover:text-brutal-text ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="type to filter..."
          disabled={disabled}
          className="w-full bg-brutal-surface border-2 border-brutal-border text-brutal-text px-3 py-1.5 text-sm font-mono focus:border-brutal-muted focus:outline-none placeholder:text-brutal-dim disabled:opacity-30"
        />
      )}
      {isOpen && !value && !disabled && (
        <div className="absolute z-[2000] left-0 right-0 mt-1 bg-brutal-panel border-2 border-brutal-border max-h-48 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-brutal-dim">No matches</div>
          ) : (
            filtered.map((word) => (
              <button
                key={word}
                onClick={() => handleSelect(word)}
                className={`block w-full text-left px-3 py-1 text-sm hover:bg-brutal-surface hover:text-brutal-text transition-colors ${
                  word === "*" ? "text-brutal-accent font-bold border-b border-brutal-border" : "text-brutal-muted"
                }`}
              >
                {word === "*" ? "★ Any (wildcard)" : word}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
