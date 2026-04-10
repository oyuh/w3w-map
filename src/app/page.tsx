"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import SearchPanel from "@/components/SearchPanel";
import InfoBar from "@/components/InfoBar";
import { GTA_MIN, GTA_MAX } from "@/lib/w3w";

const GtaMap = dynamic(() => import("@/components/GtaMap"), { ssr: false });

// SVG icon components
const MapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
    <path d="M0 1l5.5 2L11 1l5 2v12l-5-2-5.5 2L0 13V1zm1 1.5v9l4 1.5V4L1 2.5zM6 4v9l4.5-1.7V2.5L6 4zm5.5-1.5v9l3.5 1.3v-9l-3.5-1.3z"/>
  </svg>
);
const SatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
    <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 1.5a6.5 6.5 0 110 13 6.5 6.5 0 010-13zM8 4a4 4 0 100 8 4 4 0 000-8zm0 1.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5z"/>
  </svg>
);
const RoadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
    <path d="M5 0L3 16h2l2-16H5zm6 0l-2 16h2l2-16h-2zM7 3v2h2V3H7zm0 4v2h2V7H7zm0 4v2h2v-2H7z"/>
  </svg>
);
const GridIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
    <path d="M0 0h5v5H0V0zm6 0h4v5H6V0zm5 0h5v5h-5V0zM0 6h5v4H0V6zm6 0h4v4H6V6zm5 0h5v4h-5V6zM0 11h5v5H0v-5zm6 0h4v5H6v-5zm5 0h5v5h-5v-5z"/>
  </svg>
);
const PostalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
    <path d="M8 0C5.2 0 3 2.2 3 5c0 4.2 5 11 5 11s5-6.8 5-11c0-2.8-2.2-5-5-5zm0 7.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
  </svg>
);

const layerIcons: Record<string, React.ReactNode> = {
  Atlas: <MapIcon />,
  Satellite: <SatIcon />,
  Roadmap: <RoadIcon />,
};

export default function Home() {
  const [cursorW3W, setCursorW3W] = useState<string>("");
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number } | null>(null);
  const [mapRef, setMapRef] = useState<any>(null);
  const [words, setWords] = useState<string[]>([]);
  const [currentLayer, setCurrentLayer] = useState<string>("Atlas");
  const [gridVisible, setGridVisible] = useState(true);
  const [postalsVisible, setPostalsVisible] = useState(false);
  const [zoom, setZoom] = useState(2);
  const [searchCoords, setSearchCoords] = useState<{ x: number; y: number } | null>(null);
  const [selectedW3W, setSelectedW3W] = useState<string>("");
  const [selectedCoords, setSelectedCoords] = useState<{ x: number; y: number } | null>(null);
  const [searchHighlightBounds, setSearchHighlightBounds] = useState<{ minX: number; maxX: number; minY: number; maxY: number } | null>(null);
  const [postals, setPostals] = useState<{ x: number; y: number; code: string }[]>([]);
  const [postalHighlight, setPostalHighlight] = useState<{ x: number; y: number } | null>(null);
  const [selectionBounds, setSelectionBounds] = useState<{ minX: number; maxX: number; minY: number; maxY: number } | null>(null);

  const selectionInfo = useMemo(() => {
    if (!selectionBounds) return null;
    const cellCountX = Math.round((selectionBounds.maxX - selectionBounds.minX) / 8);
    const cellCountY = Math.round((selectionBounds.maxY - selectionBounds.minY) / 8);
    return {
      ...selectionBounds,
      cellCountX,
      cellCountY,
      totalCells: cellCountX * cellCountY,
    };
  }, [selectionBounds]);

  const handleMapReady = useCallback((map: any, loadedWords: string[], loadedPostals: any[]) => {
    setMapRef(map);
    setWords(loadedWords);
    setPostals(loadedPostals);
  }, []);

  const handleCursorMove = useCallback((w3w: string, coords: { x: number; y: number }) => {
    setCursorW3W(w3w);
    setCursorCoords(coords);
  }, []);

  const handleSearch = useCallback(
    (address: string) => {
      if (!mapRef || !words.length) return;
      import("@/lib/w3w").then(({ w3wToCoords, gtaToLatLng }) => {
        const coords = w3wToCoords(address, words);
        if (coords) {
          setSearchCoords(coords);
          setSelectedW3W(address);
          setSelectedCoords(coords);
          const latlng = gtaToLatLng(mapRef, coords.x, coords.y);
          mapRef.setView(latlng, 7, { animate: true });
        }
      });
    },
    [mapRef, words]
  );

  const handleCellSelect = useCallback(
    (w3w: string, coords: { x: number; y: number }) => {
      setSelectionBounds(null);
      if (!w3w) {
        // Deselect
        setSelectedW3W("");
        setSelectedCoords(null);
        setSearchCoords(null);
        return;
      }
      setSelectedW3W(w3w);
      setSelectedCoords(coords);
      setSearchCoords(coords);
    },
    []
  );

  const handleSelectionChange = useCallback(
    (bounds: { minX: number; maxX: number; minY: number; maxY: number } | null) => {
      setSelectionBounds(bounds);
      if (bounds) {
        setSelectedW3W("");
        setSelectedCoords(null);
        setSearchCoords(null);
      }
    },
    []
  );

  const handlePostalSearch = useCallback(
    (code: string) => {
      if (!code) {
        setPostalHighlight(null);
        return;
      }
      const match = postals.find((p) => p.code === code);
      if (match) {
        setPostalHighlight({ x: match.x, y: match.y });
      } else {
        setPostalHighlight(null);
      }
    },
    [postals]
  );

  const handleClearSearch = useCallback(() => {
    setSearchCoords(null);
    setSelectedW3W("");
    setSelectedCoords(null);
    setSearchHighlightBounds(null);
    setSelectionBounds(null);
  }, []);

  const handlePartialChange = useCallback(
    (w1: string, w2: string) => {
      if (!words.length || (!w1 && !w2)) {
        setSearchHighlightBounds(null);
        return;
      }
      // Treat empty w1 with set w2 as wildcard
      if (!w1 && w2) w1 = "*";
      // Wildcard: *.word highlights a horizontal band for word2 (Y axis)
      if (w1 === "*") {
        if (!w2) { setSearchHighlightBounds(null); return; }
        const idx2 = words.indexOf(w2);
        if (idx2 === -1) { setSearchHighlightBounds(null); return; }
        const y = idx2 * 8 - 8000;
        setSearchHighlightBounds({ minX: GTA_MIN, maxX: GTA_MAX, minY: y, maxY: y + 8 });
        return;
      }
      const idx1 = words.indexOf(w1);
      if (idx1 === -1) {
        setSearchHighlightBounds(null);
        return;
      }
      const x = idx1 * 8 - 8000;
      if (!w2 || w2 === "*") {
        setSearchHighlightBounds({ minX: x, maxX: x + 8, minY: GTA_MIN, maxY: GTA_MAX });
        return;
      }
      const idx2 = words.indexOf(w2);
      if (idx2 === -1) {
        setSearchHighlightBounds({ minX: x, maxX: x + 8, minY: GTA_MIN, maxY: GTA_MAX });
        return;
      }
      const y = idx2 * 8 - 8000;
      setSearchHighlightBounds({ minX: x, maxX: x + 8, minY: y, maxY: y + 8 });
    },
    [words]
  );

  const handleLayerChange = useCallback((layer: string) => {
    setCurrentLayer(layer);
  }, []);

  return (
    <main className="h-screen w-screen flex flex-col">
      {/* Top bar */}
      <div className="flex-none h-12 border-b-2 border-brutal-border bg-brutal-bg flex items-center justify-between px-4 z-50 relative">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-extrabold tracking-tighter uppercase">
            <span className="text-brutal-accent">///</span> <span className="text-brutal-text">W3W</span>
          </h1>
          <span className="text-[10px] text-brutal-dim uppercase tracking-widest hidden sm:inline">
            GTA V Grid Viewer
          </span>
        </div>
        <div className="flex items-center gap-2">
          {["Atlas", "Satellite", "Roadmap"].map((layer) => (
            <button
              key={layer}
              onClick={() => handleLayerChange(layer)}
              className={`px-3 py-1 text-xs font-bold uppercase border-2 transition-colors flex items-center gap-1.5 ${
                currentLayer === layer
                  ? "border-brutal-muted bg-brutal-surface text-brutal-text"
                  : "border-brutal-border text-brutal-dim hover:border-brutal-muted hover:text-brutal-muted"
              }`}
            >
              {layerIcons[layer]}
              {layer}
            </button>
          ))}
          <div className="w-px h-6 bg-brutal-border mx-1" />
          <button
            onClick={() => setGridVisible(!gridVisible)}
            className={`px-3 py-1 text-xs font-bold uppercase border-2 transition-colors flex items-center gap-1.5 ${
              gridVisible
                ? "border-brutal-muted bg-brutal-surface text-brutal-text"
                : "border-brutal-border text-brutal-dim hover:border-brutal-muted hover:text-brutal-muted"
            }`}
          >
            <GridIcon />
            Grid
          </button>
          <button
            onClick={() => setPostalsVisible(!postalsVisible)}
            className={`px-3 py-1 text-xs font-bold uppercase border-2 transition-colors flex items-center gap-1.5 ${
              postalsVisible
                ? "border-brutal-muted bg-brutal-surface text-brutal-text"
                : "border-brutal-border text-brutal-dim hover:border-brutal-muted hover:text-brutal-muted"
            }`}
          >
            <PostalIcon />
            Postals
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Search panel */}
        <SearchPanel
          onSearch={handleSearch}
          onClearSearch={handleClearSearch}
          onPartialChange={handlePartialChange}
          onPostalSearch={handlePostalSearch}
          words={words}
          postals={postals}
          selectionInfo={selectionInfo}
        />

        {/* Map */}
        <div className="flex-1 relative">
          <GtaMap
            onMapReady={handleMapReady}
            onCursorMove={handleCursorMove}
            onCellSelect={handleCellSelect}
            currentLayer={currentLayer}
            gridVisible={gridVisible}
            postalsVisible={postalsVisible}
            onZoomChange={setZoom}
            searchCoords={searchCoords}
            searchHighlightBounds={searchHighlightBounds}
            postalHighlight={postalHighlight}
            onSelectionChange={handleSelectionChange}
            selectionBounds={selectionBounds}
          />
        </div>
      </div>

      {/* Bottom info bar */}
      <InfoBar
        w3w={cursorW3W}
        coords={cursorCoords}
        zoom={zoom}
        selectedW3W={selectedW3W}
        selectedCoords={selectedCoords}
        selectionInfo={selectionInfo}
      />
    </main>
  );
}
