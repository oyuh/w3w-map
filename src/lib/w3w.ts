const MAP_SIZE = 32768; // 128 tiles × 256px at zoom 7

// Tile coordinate system derived from Flamm64/GTA-V-World-Map conversion:
//   pixel_x = 1.6096 * gta_x + 15541.92
//   pixel_y = -1.6096 * gta_y + 19868.8
// TILE_MIN is the left-edge GTA X, TILE_MAX is the top-edge GTA Y.
// TILE_RANGE is the side length in GTA units (same for both axes).
const TILE_MIN = -9655.77;   // left edge of tile grid in GTA X
const TILE_MAX = 12343.94;   // top edge of tile grid in GTA Y
const TILE_RANGE = 20357.85; // GTA units per tile-grid side

// W3W coordinate system: W3W grid covers -8000 to 8000
const GTA_MIN = -8000;
const GTA_MAX = 8000;
const GTA_RANGE = GTA_MAX - GTA_MIN; // 16000
const GRID_CELL = 8; // GTA units per W3W cell

export function gtaToPixel(x: number, y: number): [number, number] {
  const px = ((x - TILE_MIN) / TILE_RANGE) * MAP_SIZE;
  const py = ((TILE_MAX - y) / TILE_RANGE) * MAP_SIZE;
  return [px, py];
}

export function pixelToGta(px: number, py: number): { x: number; y: number } {
  const x = (px / MAP_SIZE) * TILE_RANGE + TILE_MIN;
  const y = TILE_MAX - (py / MAP_SIZE) * TILE_RANGE;
  return { x, y };
}

export function gtaToLatLng(map: L.Map, x: number, y: number): L.LatLng {
  const [px, py] = gtaToPixel(x, y);
  return map.unproject([px, py], 7);
}

export function latLngToGta(map: L.Map, latlng: L.LatLng): { x: number; y: number } {
  const point = map.project(latlng, 7);
  return pixelToGta(point.x, point.y);
}

/**
 * Convert GTA coordinates to a W3W address.
 * Replicates the Lua logic from W3W-FiveM (1-indexed word array).
 */
export function coordsToW3W(x: number, y: number, words: string[]): string {
  const index1 = Math.round(Math.abs(x + 8000) / 8);
  const index2 = Math.round(Math.abs(y + 8000) / 8);
  const word1 = words[index1] || "???";
  const word2 = words[index2] || "???";
  const word3 = words[index1 + 10] || "???";
  return `${word1}.${word2}.${word3}`;
}

/**
 * Convert a W3W address back to GTA coordinates.
 */
export function w3wToCoords(
  address: string,
  words: string[]
): { x: number; y: number } | null {
  const parts = address.replace(/^\/+/, "").split(".");
  if (parts.length !== 3) return null;

  const [word1, word2] = parts;
  const idx1 = words.indexOf(word1.toLowerCase().trim());
  const idx2 = words.indexOf(word2.toLowerCase().trim());

  if (idx1 === -1 || idx2 === -1) return null;

  const x = Math.round(idx1 * 8 - 8000);
  const y = Math.round(idx2 * 8 - 8000);
  return { x, y };
}

/**
 * Get the grid cell bounds in GTA coords for a position.
 */
export function getGridCell(x: number, y: number): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  const cellX = Math.round((x + 8000) / 8);
  const cellY = Math.round((y + 8000) / 8);
  return {
    minX: cellX * 8 - 8000,
    maxX: cellX * 8 - 8000 + 8,
    minY: cellY * 8 - 8000,
    maxY: cellY * 8 - 8000 + 8,
  };
}

/**
 * Load and parse the word list. Filters to words with length > 1.
 * Prepends an empty string at index 0 to simulate Lua 1-indexing.
 */
export async function loadWords(): Promise<string[]> {
  const res = await fetch("/words.txt");
  const text = await res.text();
  const filtered = text
    .split(/\r?\n/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 1);
  // Index 0 = empty (Lua 1-indexing: words[1] = first word)
  return ["", ...filtered];
}

export { MAP_SIZE, TILE_MIN, TILE_MAX, TILE_RANGE, GTA_MIN, GTA_MAX, GTA_RANGE, GRID_CELL };
