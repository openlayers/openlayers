/**
 * Seeded geometry for benchmarks. Nothing is fetched over the network, and two
 * runs render the same features.
 */
import Feature from '../../src/ol/Feature.js';
import LineString from '../../src/ol/geom/LineString.js';
import Point from '../../src/ol/geom/Point.js';
import Polygon from '../../src/ol/geom/Polygon.js';

/**
 * mulberry32: small, fast, and identical across browsers.
 * @param {number} seed Seed.
 * @return {function(): number} Generator returning values in [0, 1).
 */
function createRandom(seed) {
  let state = seed >>> 0;
  return function () {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Polygons spread over the whole world in EPSG:4326, shaped and sized like the
 * ecoregion data used by the reprojection example.
 * @param {number} count Polygon count.
 * @param {number} vertices Vertices per ring.
 * @return {Array<Feature>} Features in EPSG:4326.
 */
export function createWorldPolygons(count, vertices) {
  const random = createRandom(42);
  const features = [];
  for (let i = 0; i < count; ++i) {
    const cx = -180 + random() * 360;
    const cy = -75 + random() * 150;
    const radius = 1.5 + random() * 9;
    const wobble = 0.35 + random() * 0.5;
    const phase = random() * Math.PI * 2;
    const lobes = 3 + Math.floor(random() * 5);
    const ring = [];
    for (let v = 0; v < vertices; ++v) {
      const angle = (v / vertices) * Math.PI * 2;
      const r = radius * (1 + wobble * Math.sin(angle * lobes + phase) * 0.5);
      ring.push([
        Math.max(-179.9, Math.min(179.9, cx + Math.cos(angle) * r * 1.6)),
        Math.max(-84.9, Math.min(84.9, cy + Math.sin(angle) * r)),
      ]);
    }
    ring.push(ring[0].slice());
    const feature = new Feature(new Polygon([ring]));
    feature.setId(i + 1);
    feature.set('name', 'region ' + (i + 1));
    features.push(feature);
  }
  return features;
}

/**
 * Features for one vector tile, derived from the tile coordinate so a tile
 * always yields the same geometry.
 * @param {import("../../src/ol/tilecoord.js").TileCoord} tileCoord Tile coordinate.
 * @param {import("../../src/ol/extent.js").Extent} extent Tile extent.
 * @return {Array<Feature>} Features in the tile projection.
 */
export function createTileFeatures(tileCoord, extent) {
  const [z, x, y] = tileCoord;
  const random = createRandom((z * 73856093) ^ (x * 19349663) ^ (y * 83492791));
  const minX = extent[0];
  const minY = extent[1];
  const width = extent[2] - extent[0];
  const height = extent[3] - extent[1];
  const features = [];

  for (let i = 0; i < 12; ++i) {
    const cx = minX + random() * width;
    const cy = minY + random() * height;
    const rx = width * (0.02 + random() * 0.12);
    const ry = height * (0.02 + random() * 0.12);
    const steps = 12 + Math.floor(random() * 20);
    const ring = [];
    for (let s = 0; s < steps; ++s) {
      const angle = (s / steps) * Math.PI * 2;
      ring.push([cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry]);
    }
    ring.push(ring[0].slice());
    features.push(new Feature(new Polygon([ring])));
  }

  for (let i = 0; i < 24; ++i) {
    const steps = 6 + Math.floor(random() * 10);
    const coordinates = [];
    let px = minX + random() * width;
    let py = minY + random() * height;
    for (let s = 0; s < steps; ++s) {
      px += (random() - 0.5) * width * 0.2;
      py += (random() - 0.5) * height * 0.2;
      coordinates.push([px, py]);
    }
    features.push(new Feature(new LineString(coordinates)));
  }

  for (let i = 0; i < 6; ++i) {
    const feature = new Feature(
      new Point([minX + random() * width, minY + random() * height]),
    );
    feature.set('name', `${z}/${x}/${y}-${i}`);
    features.push(feature);
  }

  return features;
}

/**
 * Dense point labels for measuring placement without geometry tessellation
 * dominating the result.
 * @param {import("../../src/ol/tilecoord.js").TileCoord} tileCoord Tile coordinate.
 * @param {import("../../src/ol/extent.js").Extent} extent Tile extent.
 * @return {Array<Feature>} Features in the tile projection.
 */
export function createLabelTileFeatures(tileCoord, extent) {
  const [z, x, y] = tileCoord;
  const random = createRandom((z * 73856093) ^ (x * 19349663) ^ (y * 83492791));
  const width = extent[2] - extent[0];
  const height = extent[3] - extent[1];
  const features = [];
  for (let i = 0; i < 48; ++i) {
    const feature = new Feature(
      new Point([extent[0] + random() * width, extent[1] + random() * height]),
    );
    feature.set('name', `place-${Math.floor((x * 48 + i) / 3)}`);
    feature.setId(`${z}/${x}/${y}/${i}`);
    features.push(feature);
  }
  return features;
}
