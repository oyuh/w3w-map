"use client";

const buyMeACoffeeUrl = process.env.NEXT_PUBLIC_BUYMEACOFFEE_URL;

interface InfoBarProps {
  w3w: string;
  coords: { x: number; y: number } | null;
  zoom: number;
  selectedW3W: string;
  selectedCoords: { x: number; y: number } | null;
  selectionInfo: {
    minX: number; maxX: number; minY: number; maxY: number;
    cellCountX: number; cellCountY: number;
    totalCells: number;
  } | null;
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.7 7.7 0 012-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function RepoIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M2.5 1A1.5 1.5 0 001 2.5v11A1.5 1.5 0 002.5 15H5v-1H2.5a.5.5 0 01-.5-.5v-11a.5.5 0 01.5-.5h3A1.5 1.5 0 017 3.5V14h1V3.5A2.5 2.5 0 005.5 1h-3z" />
      <path d="M10.5 2A1.5 1.5 0 009 3.5v10A1.5 1.5 0 0010.5 15h3a1.5 1.5 0 001.5-1.5v-10A1.5 1.5 0 0013.5 2h-3zm0 1h3a.5.5 0 01.5.5v10a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-10a.5.5 0 01.5-.5z" />
    </svg>
  );
}

function CoffeeIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M3 3.5A1.5 1.5 0 014.5 2h5A1.5 1.5 0 0111 3.5V4h.5A2.5 2.5 0 0114 6.5v.25A2.25 2.25 0 0111.75 9H11A4 4 0 017 13H5A4 4 0 011 9V3.5h2zm8 1.5v2.5h.75A1.25 1.25 0 0013 6.25V6.5A1.5 1.5 0 0011.5 5H11zM2 5v4a3 3 0 003 3h2a3 3 0 003-3V5H2z" />
    </svg>
  );
}

export default function InfoBar({ w3w, coords, zoom, selectedW3W, selectedCoords, selectionInfo }: InfoBarProps) {
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

      {/* Area selection info */}
      {selectionInfo && (
        <>
          <div className="w-px h-4 bg-brutal-border shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] text-orange-500 uppercase tracking-wider font-bold shrink-0">Area</span>
            <span className="text-xs text-brutal-muted font-mono">
              {selectionInfo.cellCountX}×{selectionInfo.cellCountY} = {selectionInfo.totalCells} cells
            </span>
            <span className="text-[10px] text-brutal-dim font-mono">
              X:{selectionInfo.minX}→{selectionInfo.maxX} Y:{selectionInfo.minY}→{selectionInfo.maxY}
            </span>
          </div>
        </>
      )}

      <div className="ml-auto flex items-center gap-3 shrink-0">
        <span className="hidden md:block text-[10px] text-brutal-dim normal-case tracking-normal">
          made with &lt;3 by lawson
        </span>
        <a
          href="https://github.com/oyuh"
          target="_blank"
          rel="noreferrer"
          aria-label="Lawson on GitHub"
          className="flex items-center gap-1.5 text-[10px] text-brutal-dim uppercase tracking-widest hover:text-brutal-text transition-colors"
        >
          <GitHubIcon />
          <span className="hidden sm:inline">GitHub</span>
        </a>
        <a
          href="https://github.com/oyuh/w3w-map"
          target="_blank"
          rel="noreferrer"
          aria-label="w3w-map repository"
          className="flex items-center gap-1.5 text-[10px] text-brutal-dim uppercase tracking-widest hover:text-brutal-text transition-colors"
        >
          <RepoIcon />
          <span className="hidden sm:inline">Repo</span>
        </a>
        {buyMeACoffeeUrl && (
          <a
            href={buyMeACoffeeUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Buy me a coffee"
            className="flex items-center gap-1.5 text-[10px] text-brutal-dim uppercase tracking-widest hover:text-brutal-text transition-colors"
          >
            <CoffeeIcon />
            <span className="hidden sm:inline">Coffee</span>
          </a>
        )}
      </div>
    </div>
  );
}
