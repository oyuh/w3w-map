"use client";

interface InfoBarProps {
  w3w: string;
  coords: { x: number; y: number } | null;
  zoom: number;
  selectedW3W: string;
  selectedCoords: { x: number; y: number } | null;
}

export default function InfoBar({ w3w, coords, zoom, selectedW3W, selectedCoords }: InfoBarProps) {
  return (
    <div className="flex-none h-9 border-t-2 border-brutal-border bg-brutal-bg flex items-center px-4 gap-6 z-50 relative" style={{ fontVariantNumeric: 'tabular-nums' }}>
      {/* Hover W3W */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[10px] text-brutal-dim uppercase tracking-wider font-bold shrink-0">Hover</span>
        <span className="text-brutal-accent font-extrabold text-xs shrink-0">///</span>
        <span className="text-sm font-bold text-brutal-text truncate w-[32ch]">
          {w3w || "—"}
        </span>
      </div>

      <div className="w-px h-4 bg-brutal-border shrink-0" />

      {/* Coordinates */}
      <div className="text-xs text-brutal-dim font-mono shrink-0 w-[18ch]">
        {coords ? (
          <><span className="text-brutal-muted">X:</span>{String(coords.x).padStart(6, '\u2007')} <span className="text-brutal-muted">Y:</span>{String(coords.y).padStart(6, '\u2007')}</>
        ) : (
          "—"
        )}
      </div>

      <div className="w-px h-4 bg-brutal-border shrink-0" />

      {/* Zoom */}
      <div className="text-xs text-brutal-dim font-mono shrink-0">
        <span className="text-brutal-muted">Z:</span>{zoom}
      </div>

      {/* Selected W3W */}
      {selectedW3W && (
        <>
          <div className="w-px h-4 bg-brutal-border shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] text-brutal-accent uppercase tracking-wider font-bold shrink-0">Sel</span>
            <span className="text-brutal-accent font-extrabold text-xs shrink-0">///</span>
            <span className="text-sm font-bold text-brutal-accent truncate">
              {selectedW3W}
            </span>
            {selectedCoords && (
              <span className="text-[10px] text-brutal-dim font-mono">
                ({selectedCoords.x}, {selectedCoords.y})
              </span>
            )}
          </div>
        </>
      )}

      <div className="ml-auto text-[10px] text-brutal-dim uppercase tracking-widest hidden sm:block">
        MADE BY LAWSON
      </div>
    </div>
  );
}
