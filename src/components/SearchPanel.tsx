"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import WordSelector from "./WordSelector";

interface SelectionInfo {
  minX: number; maxX: number; minY: number; maxY: number;
  cellCountX: number; cellCountY: number;
  totalCells: number;
}

interface SearchPanelProps {
  onSearch: (address: string) => void;
  onClearSearch: () => void;
  onPartialChange: (word1: string, word2: string) => void;
  onPostalSearch: (code: string) => void;
  words: string[];
  postals: { x: number; y: number; code: string }[];
  selectionInfo: SelectionInfo | null;
}

export default function SearchPanel({ onSearch, onClearSearch, onPartialChange, onPostalSearch, words, postals, selectionInfo }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [word1, setWord1] = useState("");
  const [word2, setWord2] = useState("");
  const [word3, setWord3] = useState("");
  const [postalQuery, setPostalQuery] = useState("");

  const autoWord3 =
    word1 && word1 !== "*" && words.length > 0
      ? words[words.indexOf(word1) + 10] || ""
      : "";

  useEffect(() => {
    if (word1 && word1 !== "*" && word2 && word2 !== "*" && (word3 || autoWord3)) {
      const addr = `${word1}.${word2}.${word3 || autoWord3}`;
      onSearch(addr);
    }
  }, [word1, word2, word3, autoWord3, onSearch]);

  useEffect(() => {
    // Treat empty word1 with set word2 as wildcard
    const effectiveW1 = !word1 && word2 ? "*" : word1;
    onPartialChange(effectiveW1, word2);
  }, [word1, word2, onPartialChange]);

  // Progressive search from quick search input
  useEffect(() => {
    if (!query.trim()) {
      // Don't clear if word selectors are active
      if (!word1 && !word2) onPartialChange("", "");
      return;
    }
    const parts = query.trim().split(".");
    const w1 = parts[0] || "";
    const w2 = parts[1] || "";
    const w3 = parts[2] || "";

    // Validate words exist to do progressive highlight
    if (w1 === "*") {
      // Wildcard: *.word searches by second word (Y axis)
      if (w2 && words.includes(w2)) {
        onPartialChange("*", w2);
      } else {
        onPartialChange("", "");
      }
    } else if (w1 && words.includes(w1)) {
      if (w2 && words.includes(w2)) {
        onPartialChange(w1, w2);
        if (w3 && words.includes(w3)) {
          onSearch(`${w1}.${w2}.${w3}`);
        }
      } else {
        onPartialChange(w1, "");
      }
    } else {
      onPartialChange("", "");
    }
  }, [query, words, onPartialChange, onSearch, word1]);

  // Postal search - find exact match
  const postalMatches = useMemo(() => {
    if (!postalQuery.trim()) return [];
    return postals.filter((p) => p.code.startsWith(postalQuery.trim())).slice(0, 20);
  }, [postalQuery, postals]);

  useEffect(() => {
    if (!postalQuery.trim()) {
      onPostalSearch("");
      return;
    }
    const exact = postals.find((p) => p.code === postalQuery.trim());
    if (exact) {
      onPostalSearch(exact.code);
    } else {
      onPostalSearch("");
    }
  }, [postalQuery, postals, onPostalSearch]);

  const handleQuickSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) onSearch(query.trim());
    },
    [query, onSearch]
  );

  const handleClearAll = () => {
    setWord1("");
    setWord2("");
    setWord3("");
    setQuery("");
    setPostalQuery("");
    onClearSearch();
    onPostalSearch("");
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-2 left-2 z-[1000] bg-brutal-bg border-2 border-brutal-border p-2 hover:border-brutal-muted transition-colors"
      >
        <span className="text-brutal-accent font-extrabold text-lg">///</span>
      </button>
    );
  }

  return (
    <div className="flex-none w-72 border-r-2 border-brutal-border bg-brutal-panel z-50 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-brutal-border flex items-center justify-between">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-brutal-muted">
          Search
        </h2>
        <button
          onClick={() => setIsOpen(false)}
          className="text-brutal-dim hover:text-brutal-text text-sm font-bold"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* W3W Quick Search */}
        <form onSubmit={handleQuickSearch} className="p-4 border-b border-brutal-border">
          <label className="block text-[10px] uppercase tracking-widest text-brutal-dim mb-2">
            W3W Search
          </label>
          <div className="flex">
            <span className="bg-brutal-accent text-brutal-bg font-extrabold px-2 flex items-center text-xs">
              ///
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="word.word.word"
              className="flex-1 bg-brutal-surface border-2 border-brutal-border text-brutal-text px-3 py-1.5 text-sm font-mono focus:border-brutal-muted focus:outline-none placeholder:text-brutal-dim"
            />
          </div>
          <p className="text-[9px] text-brutal-dim mt-1">Type to highlight · Use * for wildcard</p>
        </form>

        {/* Word selectors */}
        <div className="p-4 space-y-3 border-b border-brutal-border">
          <div className="text-[10px] uppercase tracking-widest text-brutal-dim mb-1">
            — or select words —
          </div>
          <WordSelector label="Word 1" words={words} value={word1} onChange={setWord1} allowWildcard />
          <WordSelector label="Word 2" words={words} value={word2} onChange={setWord2} allowWildcard />
          <WordSelector
            label="Word 3"
            words={words}
            value={word3}
            onChange={(w) => setWord3(w)}
            autoValue={autoWord3}
          />
        </div>

        {/* Postal Search */}
        <div className="p-4 border-b border-brutal-border">
          <label className="block text-[10px] uppercase tracking-widest text-brutal-dim mb-2">
            Postal Search
          </label>
          <div className="flex">
            <span className="bg-yellow-600 text-brutal-bg font-extrabold px-2 flex items-center text-xs">
              #
            </span>
            <input
              type="text"
              value={postalQuery}
              onChange={(e) => setPostalQuery(e.target.value)}
              placeholder="postal code"
              className="flex-1 bg-brutal-surface border-2 border-brutal-border text-brutal-text px-3 py-1.5 text-sm font-mono focus:border-brutal-muted focus:outline-none placeholder:text-brutal-dim"
            />
          </div>
          {postalMatches.length > 0 && (
            <div className="mt-2 max-h-32 overflow-y-auto border border-brutal-border bg-brutal-surface">
              {postalMatches.map((p) => (
                <button
                  key={p.code}
                  onClick={() => setPostalQuery(p.code)}
                  className={`w-full text-left px-2 py-1 text-xs font-mono hover:bg-brutal-highlight transition-colors ${
                    p.code === postalQuery.trim()
                      ? "text-yellow-500 bg-brutal-highlight"
                      : "text-brutal-text"
                  }`}
                >
                  <span className="text-yellow-500 font-bold">#{p.code}</span>
                  <span className="text-brutal-dim ml-2">({Math.round(p.x)}, {Math.round(p.y)})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selection Info */}
        {selectionInfo && (
          <div className="p-4 border-b border-brutal-border">
            <div className="text-[10px] uppercase tracking-widest text-orange-500 font-bold mb-2">
              ■ Area Selection
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-brutal-dim">X Range</span>
                <span className="text-brutal-muted">{selectionInfo.minX} → {selectionInfo.maxX}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brutal-dim">Y Range</span>
                <span className="text-brutal-muted">{selectionInfo.minY} → {selectionInfo.maxY}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brutal-dim">Size</span>
                <span className="text-brutal-muted">{selectionInfo.cellCountX} × {selectionInfo.cellCountY}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brutal-dim">Cells</span>
                <span className="text-orange-500 font-bold">{selectionInfo.totalCells}</span>
              </div>
            </div>
          </div>
        )}

        {/* Clear */}
        <div className="p-4">
          <button
            onClick={handleClearAll}
            className="w-full py-1.5 text-xs uppercase tracking-wider font-bold text-brutal-dim border-2 border-brutal-border hover:border-brutal-muted hover:text-brutal-muted transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="p-4 border-t border-brutal-border">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-brutal-dim mb-2">
          Controls
        </h3>
        <div className="space-y-1 text-[11px] text-brutal-dim">
          <p><span className="text-brutal-muted font-bold">Click</span> — Pin / Unpin W3W</p>
          <p><span className="text-brutal-muted font-bold">Shift+Drag</span> — Area select</p>
          <p><span className="text-brutal-muted font-bold">Hover</span> — Live preview</p>
          <p><span className="text-brutal-muted font-bold">Scroll</span> — Zoom</p>
          <p><span className="text-brutal-muted font-bold">*.word.*</span> — Wildcard search</p>
        </div>
      </div>
    </div>
  );
}
