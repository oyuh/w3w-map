"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
// @ts-ignore - CSS side-effect import handled by Next.js
import "leaflet/dist/leaflet.css";
import {
  loadWords,
  latLngToGta,
  coordsToW3W,
  gtaToLatLng,
  getGridCell,
  MAP_SIZE,
  TILE_MIN,
  TILE_MAX,
  TILE_RANGE,
  GTA_RANGE,
  GTA_MIN,
  GTA_MAX,
} from "@/lib/w3w";

interface PostalEntry {
  x: number;
  y: number;
  code: string;
}

interface GtaMapProps {
  onMapReady: (map: L.Map, words: string[], postals: PostalEntry[]) => void;
  onCursorMove: (w3w: string, coords: { x: number; y: number }) => void;
  onCellSelect: (w3w: string, coords: { x: number; y: number }) => void;
  currentLayer: string;
  gridVisible: boolean;
  postalsVisible: boolean;
  onZoomChange: (zoom: number) => void;
  searchCoords: { x: number; y: number } | null;
  searchHighlightBounds: { minX: number; maxX: number; minY: number; maxY: number } | null;
  postalHighlight: { x: number; y: number } | null;
}

// Custom grid overlay using L.GridLayer with Canvas tiles
function createGridLayer() {
  return L.GridLayer.extend({
    createTile(coords: L.Coords) {
      const tile = document.createElement("canvas");
      const size = this.getTileSize();
      tile.width = size.x;
      tile.height = size.y;

      const ctx = tile.getContext("2d");
      if (!ctx) return tile;

      const zoom = coords.z;
      if (zoom < 3) return tile;

      const mapPxSize = 256 * Math.pow(2, zoom);
      const pxPerUnit = mapPxSize / TILE_RANGE;
      const gridPx = 8 * pxPerUnit;

      const minSpacing = zoom >= 7 ? 14 : 20;
      const step = Math.max(1, Math.ceil(minSpacing / gridPx));
      const stepUnits = 8 * step;

      const tileStartX = coords.x * 256;
      const tileStartY = coords.y * 256;

      // GTA range covered by this tile (using TILE coordinate system)
      const gtaXStart = (tileStartX / mapPxSize) * TILE_RANGE + TILE_MIN;
      const gtaXEnd = ((tileStartX + 256) / mapPxSize) * TILE_RANGE + TILE_MIN;
      const gtaYStart = TILE_MAX - (tileStartY / mapPxSize) * TILE_RANGE;
      const gtaYEnd = TILE_MAX - ((tileStartY + 256) / mapPxSize) * TILE_RANGE;

      // Skip tiles outside W3W grid bounds
      if (gtaXEnd < GTA_MIN || gtaXStart > GTA_MAX || gtaYEnd > GTA_MAX || gtaYStart < GTA_MIN) {
        return tile;
      }

      const alpha = zoom >= 7 ? 0.3 : zoom >= 6 ? 0.2 : zoom >= 5 ? 0.12 : 0.08;
      ctx.strokeStyle = `rgba(180, 180, 180, ${alpha})`;
      ctx.lineWidth = zoom >= 7 ? 0.75 : 0.5;

      // Vertical lines (grid positions in GTA coords, pixel positions via TILE mapping)
      const firstX =
        Math.ceil((gtaXStart - GTA_MIN) / stepUnits) * stepUnits + GTA_MIN;
      for (let gx = firstX; gx <= gtaXEnd; gx += stepUnits) {
        const px = ((gx - TILE_MIN) / TILE_RANGE) * mapPxSize - tileStartX;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, 256);
        ctx.stroke();
      }

      // Horizontal lines
      const firstY =
        Math.floor((gtaYStart - GTA_MIN) / stepUnits) * stepUnits + GTA_MIN;
      for (let gy = firstY; gy >= gtaYEnd; gy -= stepUnits) {
        const py = ((TILE_MAX - gy) / TILE_RANGE) * mapPxSize - tileStartY;
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(256, py);
        ctx.stroke();
      }

      return tile;
    },
  });
}

const TILE_BASE = process.env.NEXT_PUBLIC_TILE_BASE || "/tiles";

function createTileLayer(layerName: string): L.TileLayer {
  const tileLayer = L.tileLayer("", {
    minZoom: 0,
    maxZoom: 7,
    noWrap: true,
  });

  tileLayer.getTileUrl = (coords: L.Coords) => {
    const limit = 1 << coords.z;

    if (coords.x < 0 || coords.y < 0 || coords.x >= limit || coords.y >= limit) {
      return `${TILE_BASE}/${layerName}/empty.jpg`;
    }

    return `${TILE_BASE}/${layerName}/${coords.z}_${coords.x}_${coords.y}.jpg`;
  };

  return tileLayer;
}

// Canvas-based postal layer — far more efficient than DOM markers
function createPostalLayer(postals: PostalEntry[]) {
  return L.GridLayer.extend({
    createTile(coords: L.Coords) {
      const tile = document.createElement("canvas");
      const size = this.getTileSize();
      tile.width = size.x;
      tile.height = size.y;

      const ctx = tile.getContext("2d");
      if (!ctx) return tile;

      const zoom = coords.z;
      if (zoom < 3) return tile;

      const mapPxSize = 256 * Math.pow(2, zoom);
      const tileStartX = coords.x * 256;
      const tileStartY = coords.y * 256;

      ctx.font = '700 9px "JetBrains Mono", monospace';
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      for (let i = 0; i < postals.length; i++) {
        // Density filter
        if (zoom === 3 && i % 10 !== 0) continue;
        if (zoom === 4 && i % 3 !== 0 && i % 10 !== 0) continue;

        const p = postals[i];
        const px = ((p.x - TILE_MIN) / TILE_RANGE) * mapPxSize;
        const py = ((TILE_MAX - p.y) / TILE_RANGE) * mapPxSize;

        // Skip if outside tile (with padding for text overflow)
        if (px < tileStartX - 40 || px > tileStartX + 296) continue;
        if (py < tileStartY - 12 || py > tileStartY + 268) continue;

        const lx = px - tileStartX + 3;
        const ly = py - tileStartY + 3;

        // Shadow for legibility
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillText(p.code, lx + 1, ly + 1);
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillText(p.code, lx - 1, ly + 2);
        // Main text
        ctx.fillStyle = "#f0d060";
        ctx.fillText(p.code, lx, ly);
      }

      return tile;
    },
  });
}

async function loadPostals(): Promise<PostalEntry[]> {
  const res = await fetch("/postals.json");
  return res.json();
}

export default function GtaMap({
  onMapReady,
  onCursorMove,
  onCellSelect,
  currentLayer,
  gridVisible,
  postalsVisible,
  onZoomChange,
  searchCoords,
  searchHighlightBounds,
  postalHighlight,
}: GtaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const gridLayerRef = useRef<L.GridLayer | null>(null);
  const wordsRef = useRef<string[]>([]);
  const highlightRef = useRef<L.Rectangle | null>(null);
  const searchHighlightRef = useRef<L.Rectangle | null>(null);
  const searchAreaRef = useRef<L.Rectangle | null>(null);
  const postalLayerRef = useRef<L.GridLayer | null>(null);
  const postalCircleRef = useRef<L.CircleMarker | null>(null);
  const postalsVisibleRef = useRef(postalsVisible);
  const postalsDataRef = useRef<PostalEntry[]>([]);
  const onCellSelectRef = useRef(onCellSelect);
  const selectedCoordsRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => { postalsVisibleRef.current = postalsVisible; }, [postalsVisible]);
  useEffect(() => { onCellSelectRef.current = onCellSelect; }, [onCellSelect]);
  useEffect(() => { selectedCoordsRef.current = searchCoords; }, [searchCoords]);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Map bounds: the entire tile area at zoom 7 = MAP_SIZE pixels
    const southWest = L.CRS.Simple.pointToLatLng(L.point(0, MAP_SIZE), 7);
    const northEast = L.CRS.Simple.pointToLatLng(L.point(MAP_SIZE, 0), 7);
    const mapBounds = L.latLngBounds(southWest, northEast);

    const map = L.map(containerRef.current, {
      crs: L.CRS.Simple,
      minZoom: 0,
      maxZoom: 7,
      zoomControl: false,
      zoomSnap: 1,
      zoomDelta: 1,
      attributionControl: false,
      maxBounds: mapBounds.pad(0.5),
      maxBoundsViscosity: 0.8,
    });

    // Add zoom control to bottom-right so it doesn't overlap search toggle
    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;

    // Initial tile layer (no wrapping)
    const tileLayer = createTileLayer("Atlas").addTo(map);
    tileLayerRef.current = tileLayer;

    // Grid layer
    const GridLayerClass = createGridLayer();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gridLayer = new (GridLayerClass as any)({
      minZoom: 0,
      maxZoom: 7,
      noWrap: true,
      opacity: 1,
    }) as L.GridLayer;
    gridLayer.addTo(map);
    gridLayerRef.current = gridLayer;

    // Search area highlight (partial word search - faded overlay)
    const searchArea = L.rectangle([[0, 0], [0, 0]], {
      color: "#ff0000",
      weight: 1,
      fillColor: "#ff0000",
      fillOpacity: 0.08,
      dashArray: "4, 4",
      interactive: false,
    });
    searchAreaRef.current = searchArea;

    // Hover highlight (grayish-red, muted)
    const highlight = L.rectangle([[0, 0], [0, 0]], {
      color: "#993333",
      weight: 2,
      fillColor: "#993333",
      fillOpacity: 0.15,
      interactive: false,
    });
    highlightRef.current = highlight;

    // Selected/searched cell highlight (bright red, persistent)
    const searchHL = L.rectangle([[0, 0], [0, 0]], {
      color: "#ff0000",
      weight: 3,
      fillColor: "#ff0000",
      fillOpacity: 0.2,
      interactive: false,
    });
    searchHighlightRef.current = searchHL;

    // Postal search highlight circle
    const postalHL = L.circleMarker([0, 0], {
      radius: 16,
      color: "#ff0000",
      weight: 3,
      fillColor: "#ff0000",
      fillOpacity: 0.2,
      interactive: false,
    });
    postalCircleRef.current = postalHL;

    // Center on GTA map
    const center = map.unproject([MAP_SIZE / 2, MAP_SIZE / 2], 7);
    map.setView(center, 3);

    // Zoom change handler
    map.on("zoomend", () => {
      onZoomChange(map.getZoom());
    });

    // Mouse move handler for W3W display
    map.on("mousemove", (e: L.LeafletMouseEvent) => {
      if (!wordsRef.current.length) return;
      const gta = latLngToGta(map, e.latlng);

      // Clamp to GTA bounds
      if (gta.x < GTA_MIN || gta.x > GTA_MAX || gta.y < GTA_MIN || gta.y > GTA_MAX) {
        if (highlightRef.current && map.hasLayer(highlightRef.current)) {
          map.removeLayer(highlightRef.current);
        }
        return;
      }

      const w3w = coordsToW3W(gta.x, gta.y, wordsRef.current);
      onCursorMove(w3w, { x: Math.round(gta.x), y: Math.round(gta.y) });

      // Update highlight rectangle
      if (map.getZoom() >= 5 && highlightRef.current) {
        const cell = getGridCell(gta.x, gta.y);
        const sw = gtaToLatLng(map, cell.minX, cell.minY);
        const ne = gtaToLatLng(map, cell.maxX, cell.maxY);
        highlightRef.current.setBounds(L.latLngBounds(sw, ne));
        if (!map.hasLayer(highlightRef.current)) {
          highlightRef.current.addTo(map);
        }
      } else if (highlightRef.current && map.hasLayer(highlightRef.current)) {
        map.removeLayer(highlightRef.current);
      }
    });

    // Click to select/deselect W3W cell
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (!wordsRef.current.length) return;
      const gta = latLngToGta(map, e.latlng);
      if (gta.x < GTA_MIN || gta.x > GTA_MAX || gta.y < GTA_MIN || gta.y > GTA_MAX) return;

      const w3w = coordsToW3W(gta.x, gta.y, wordsRef.current);
      const roundedCoords = { x: Math.round(gta.x), y: Math.round(gta.y) };

      // Toggle: if clicking on the already-selected cell, deselect
      const sel = selectedCoordsRef.current;
      if (sel) {
        const cell = getGridCell(sel.x, sel.y);
        const clickCell = getGridCell(gta.x, gta.y);
        if (cell.minX === clickCell.minX && cell.minY === clickCell.minY) {
          onCellSelectRef.current("", { x: 0, y: 0 });
          return;
        }
      }

      L.popup({ className: "w3w-popup", closeButton: true })
        .setLatLng(e.latlng)
        .setContent(
          `<div style="font-family:monospace;padding:4px">` +
            `<div style="color:#ccc;font-size:14px;font-weight:800"><span style="color:#ff0000">///</span> ${w3w}</div>` +
            `<div style="color:#666;font-size:11px;margin-top:4px">` +
            `X: ${roundedCoords.x} Y: ${roundedCoords.y}</div>` +
            `</div>`
        )
        .openOn(map);

      onCellSelectRef.current(w3w, roundedCoords);
    });

    // Load words and postals
    Promise.all([loadWords(), loadPostals()]).then(([w, postals]) => {
      wordsRef.current = w;

      // Canvas-based postal layer (no DOM elements)
      postalsDataRef.current = postals;
      const PostalLayerClass = createPostalLayer(postals);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const postalLayer = new (PostalLayerClass as any)({
        minZoom: 0,
        maxZoom: 7,
        noWrap: true,
        opacity: 1,
      }) as L.GridLayer;
      postalLayerRef.current = postalLayer;
      if (postalsVisibleRef.current) postalLayer.addTo(map);
      onMapReady(map, w, postals);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle layer changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !tileLayerRef.current) return;

    map.removeLayer(tileLayerRef.current);
    const newLayer = createTileLayer(currentLayer).addTo(map);
    tileLayerRef.current = newLayer;

    // Bring all overlays to front in correct order
    if (postalLayerRef.current && map.hasLayer(postalLayerRef.current)) postalLayerRef.current.bringToFront();
    if (gridLayerRef.current && map.hasLayer(gridLayerRef.current)) gridLayerRef.current.bringToFront();
    if (searchAreaRef.current && map.hasLayer(searchAreaRef.current)) searchAreaRef.current.bringToFront();
    if (highlightRef.current && map.hasLayer(highlightRef.current)) highlightRef.current.bringToFront();
    if (searchHighlightRef.current && map.hasLayer(searchHighlightRef.current)) searchHighlightRef.current.bringToFront();
  }, [currentLayer]);

  // Handle grid visibility
  useEffect(() => {
    const map = mapRef.current;
    const grid = gridLayerRef.current;
    if (!map || !grid) return;

    if (gridVisible && !map.hasLayer(grid)) {
      grid.addTo(map);
    } else if (!gridVisible && map.hasLayer(grid)) {
      map.removeLayer(grid);
    }
  }, [gridVisible]);

  // Handle postals visibility
  useEffect(() => {
    const map = mapRef.current;
    const layer = postalLayerRef.current;
    if (!map) return;
    if (layer) {
      if (postalsVisible && !map.hasLayer(layer)) layer.addTo(map);
      else if (!postalsVisible && map.hasLayer(layer)) map.removeLayer(layer);
    }
    if (!postalsVisible && postalCircleRef.current && map.hasLayer(postalCircleRef.current)) {
      map.removeLayer(postalCircleRef.current);
    }
  }, [postalsVisible]);

  // Handle postal highlight from search
  useEffect(() => {
    const map = mapRef.current;
    const circle = postalCircleRef.current;
    if (!map || !circle) return;

    if (postalHighlight) {
      const latlng = gtaToLatLng(map, postalHighlight.x, postalHighlight.y);
      circle.setLatLng(latlng);
      if (!map.hasLayer(circle)) circle.addTo(map);
      map.setView(latlng, Math.max(map.getZoom(), 5), { animate: true });
    } else {
      if (map.hasLayer(circle)) map.removeLayer(circle);
    }
  }, [postalHighlight]);

  // Handle selected cell highlight
  useEffect(() => {
    const map = mapRef.current;
    const rect = searchHighlightRef.current;
    if (!map || !rect) return;

    if (searchCoords) {
      const cell = getGridCell(searchCoords.x, searchCoords.y);
      const sw = gtaToLatLng(map, cell.minX, cell.minY);
      const ne = gtaToLatLng(map, cell.maxX, cell.maxY);
      rect.setBounds(L.latLngBounds(sw, ne));
      if (!map.hasLayer(rect)) rect.addTo(map);
      rect.bringToFront();
    } else {
      if (map.hasLayer(rect)) map.removeLayer(rect);
    }
  }, [searchCoords]);

  // Handle partial search area highlight
  useEffect(() => {
    const map = mapRef.current;
    const rect = searchAreaRef.current;
    if (!map || !rect) return;

    if (searchHighlightBounds) {
      const sw = gtaToLatLng(map, searchHighlightBounds.minX, searchHighlightBounds.minY);
      const ne = gtaToLatLng(map, searchHighlightBounds.maxX, searchHighlightBounds.maxY);
      rect.setBounds(L.latLngBounds(sw, ne));
      if (!map.hasLayer(rect)) rect.addTo(map);
      rect.bringToFront();
    } else {
      if (map.hasLayer(rect)) map.removeLayer(rect);
    }
  }, [searchHighlightBounds]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {/* Postal calibration UI retired after the fixed mapping was derived. */}
    </div>
  );
}
