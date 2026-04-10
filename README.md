# w3w-map

Static GTA V map viewer built with Next.js, Tailwind, and Leaflet.

This project renders a full GTA V world map in the browser, overlays a What3Words-style grid based on the W3W FiveM logic, and supports postal lookup and highlighting. It is designed to be fast, static-hostable, and easy to deploy with the heavy tile assets hosted separately.

## What This Project Does

- Renders GTA V map tiles in three styles: Atlas, Satellite, and Roadmap.
- Converts GTA/FiveM coordinates into a browser-space map using a calibrated linear transform.
- Replicates the W3W-FiveM address logic so a location can be previewed and searched as `word.word.word`.
- Highlights partial W3W searches as you type.
- Supports wildcard search in the form `*.word` to highlight a horizontal band.
- Searches and highlights postal codes using a canvas overlay for performance.
- Exports as a static Next.js site so it can be deployed without running a permanent Node server.

## Stack

- Next.js 14
- React 18
- Leaflet with `CRS.Simple`
- Tailwind CSS
- Bun for local package/runtime workflow

## How It Works

### Map rendering

The viewer uses pre-generated `256x256` map tiles and displays them through Leaflet.

- Tile layers are switched client-side between Atlas, Satellite, and Roadmap.
- The app uses `CRS.Simple`, so the map behaves as a flat image plane instead of a real-world geographic projection.
- Tiles are requested from either local `public/tiles` during development or an external CDN/object bucket in production via `NEXT_PUBLIC_TILE_BASE`.

### Coordinate conversion

The mapping logic lives in [src/lib/w3w.ts](src/lib/w3w.ts).

- The full zoom-7 map size is `32768 x 32768` pixels.
- GTA coordinates are converted to pixels with calibrated constants derived from the Flamm64 map set.
- `gtaToPixel`, `pixelToGta`, `gtaToLatLng`, and `latLngToGta` handle the translation between in-game positions and Leaflet space.

### W3W logic

The W3W address logic mirrors the W3W FiveM resource.

- The W3W grid covers `-8000..8000` in GTA units.
- Each grid cell is `8` GTA units.
- The app loads [public/words.txt](public/words.txt) and converts between coordinates and `word.word.word` addresses in the browser.

### Postal rendering

Postal data is loaded from [public/postals.json](public/postals.json).

- Postal labels are drawn into a canvas-backed `L.GridLayer` instead of individual DOM markers.
- This keeps rendering fast even with thousands of postal labels.
- Postal search highlights exact matches and can be toggled on or off from the top bar.

### Dev server behavior

The local dev script is [scripts/dev.mjs](scripts/dev.mjs).

- It deletes `.next` before starting `next dev`.
- This avoids the Windows `.next/trace` permission issue that can make the dev server look like it is hanging.

## Project Structure

```text
src/
  app/
    layout.tsx
    page.tsx
    globals.css
  components/
    GtaMap.tsx
    InfoBar.tsx
    SearchPanel.tsx
    WordSelector.tsx
  lib/
    w3w.ts
public/
  postals.json
  words.txt
  tiles/
scripts/
  dev.mjs
```

## Local Development

### Requirements

- Bun
- Node.js

### Install

```bash
bun install
```

### Run locally

If you are serving tiles from the repo locally, keep `NEXT_PUBLIC_TILE_BASE` unset.

```bash
bun dev
```

The app will serve tiles from `/public/tiles` by default.

## Environment Variables

The only app-specific environment variable is:

```dotenv
NEXT_PUBLIC_TILE_BASE=
```

Usage:

- Leave it empty locally to use `public/tiles`.
- Set it in production to your public R2 URL or custom tile domain.

Examples:

```dotenv
NEXT_PUBLIC_TILE_BASE=https://pub-xxxxxxxxxxxxxxxx.r2.dev
NEXT_PUBLIC_TILE_BASE=https://tiles.example.com
```

Do not use the R2 S3 API endpoint such as:

```dotenv
https://<account-id>.r2.cloudflarestorage.com/<bucket>
```

That URL is for API tools like `rclone`, not for browser tile requests.

## Production Deployment

This project is set up for static hosting.

- [next.config.mjs](next.config.mjs) uses `output: 'export'`.
- [vercel.json](vercel.json) applies long-lived immutable cache headers to static assets.
- The large tile set should be hosted outside the app deploy.

### Recommended setup

1. Deploy the app itself to Vercel.
2. Upload the tile set to Cloudflare R2.
3. Expose the bucket via an `r2.dev` URL or, preferably, a custom domain.
4. Set `NEXT_PUBLIC_TILE_BASE` in Vercel.

### Why split the tiles out

The tile set is large.

- About `65,541` files total.
- Roughly `~971 MB` in size.

That is too heavy for a normal Vercel static deployment, so the site and tile assets should be hosted separately.

## Free Hosting Notes

The cheapest practical setup for this project is:

- App: Vercel free tier
- Tiles: Cloudflare R2

The project already supports this split-hosting model through `NEXT_PUBLIC_TILE_BASE`.

## FiveM-Related Downloads And References

If someone wants to pair this viewer with an actual FiveM server setup, these are the relevant upstream downloads and references.

### Viewer / map references

- GTA V map Leaflet reference: https://github.com/RiceaRaul/gta-v-map-leaflet
- Tile set source used for calibration in this project: https://github.com/Flamm64/GTA-V-World-Map

### W3W resource

- W3W FiveM resource: https://github.com/LondonStudios/W3W-FiveM

### Postal resource

- Postal script thread: https://forum.cfx.re/t/release-postal-code-map-minimap-new-improved-v1-3/147458

## Important Notes For FiveM Users

- This repository is a standalone web viewer, not a drop-in FiveM resource.
- The W3W and postal logic here are intended to mirror in-game behavior so the web map matches what players see in-server.
- If you want an in-game implementation, you still need the actual FiveM resources linked above.

## Repo

- GitHub repo: https://github.com/oyuh/w3w-map

## Credits

- Built by Lawson
- W3W logic inspired by London Studios' W3W-FiveM
- Postal data/workflow inspired by the Cfx.re postal resource
- GTA V map tile research and calibration based on Flamm64 and other community Leaflet map projects
