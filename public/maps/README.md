# Japan prefecture boundaries

Source: 地球地図日本（国土地理院 / Geospatial Information Authority of Japan）.

- Original dataset and applicable terms: https://www.gsi.go.jp/kankyochiri/gm_jpn.html
- GSI content terms: https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html
- GeoJSON conversion and prefecture properties: https://github.com/dataofjapan/land
- Pinned source: https://github.com/dataofjapan/land/blob/c686f194db009794b63b38585af060fbe1b0b304/japan.geojson
- Retrieved: 2026-10-28. Upstream file SHA-256: `b2fa31a9ce37c006904a06b8afcaeaf5ceeff40ae365eca167e09fbfff052f00`.

`japan-c686f194.geojson` contains all 47 prefectures from that revision. Only JSON whitespace was removed with `JSON.stringify(JSON.parse(source))`; coordinates and properties were not simplified or changed. The UI normalizes prefecture display names on an in-memory copy.

Attribution shown in the map: 出典：地球地図日本（国土地理院）. This is a derived presentation, not an official GSI map or current administrative boundary reference. The upstream README defers usage conditions to the original publisher; consult the linked GSI terms when reusing the data.

The file is served from the site's own `/maps/` path and copied by Vite into `dist/client/maps/`. GitHub is needed only for a deliberate source update, not for visitor map requests. Preserve this provenance and use a new versioned filename when updating the data.
