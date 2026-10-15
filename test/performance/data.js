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
 * @param {number} [density] Feature-count multiplier.
 * @return {Array<Feature>} Features in the tile projection.
 */
export function createTileFeatures(tileCoord, extent, density = 1) {
  const [z, x, y] = tileCoord;
  const random = createRandom((z * 73856093) ^ (x * 19349663) ^ (y * 83492791));
  const minX = extent[0];
  const minY = extent[1];
  const width = extent[2] - extent[0];
  const height = extent[3] - extent[1];
  const features = [];

  for (let i = 0; i < 12 * density; ++i) {
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

  for (let i = 0; i < 24 * density; ++i) {
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

  for (let i = 0; i < 6 * density; ++i) {
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

/**
 * Dense urban tile content with area geometry, roads, and paired icon/label
 * points. Counts and coordinates are deterministic so Canvas and WebGPU runs
 * receive identical work.
 *
 * @param {import("../../src/ol/tilecoord.js").TileCoord} tileCoord Tile coordinate.
 * @param {import("../../src/ol/extent.js").Extent} extent Tile extent.
 * @param {number} [density] Feature-count multiplier.
 * @return {Array<Feature>} Features in the tile projection.
 */
export function createUrbanTileFeatures(tileCoord, extent, density = 8) {
  const [z, x, y] = tileCoord;
  const random = createRandom(
    (z * 73856093) ^ (x * 19349663) ^ (y * 83492791) ^ 0x5bd1e995,
  );
  const width = extent[2] - extent[0];
  const height = extent[3] - extent[1];
  const features = [];

  for (let i = 0; i < 10 * density; ++i) {
    const cx = extent[0] + random() * width;
    const cy = extent[1] + random() * height;
    const rx = width * (0.005 + random() * 0.025);
    const ry = height * (0.005 + random() * 0.025);
    const ring = [];
    for (let corner = 0; corner < 8; ++corner) {
      const angle = (corner / 8) * Math.PI * 2;
      ring.push([cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry]);
    }
    ring.push(ring[0].slice());
    const feature = new Feature(new Polygon([ring]));
    feature.setProperties({kind: 'building', rank: i % 6});
    features.push(feature);
  }

  for (let i = 0; i < 20 * density; ++i) {
    let px = extent[0] + random() * width;
    let py = extent[1] + random() * height;
    const coordinates = [];
    for (let vertex = 0; vertex < 8; ++vertex) {
      px += (random() - 0.5) * width * 0.08;
      py += (random() - 0.5) * height * 0.08;
      coordinates.push([px, py]);
    }
    const feature = new Feature(new LineString(coordinates));
    feature.setProperties({kind: 'road', rank: i % 5});
    features.push(feature);
  }

  for (let i = 0; i < 160 * density; ++i) {
    const feature = new Feature(
      new Point([extent[0] + random() * width, extent[1] + random() * height]),
    );
    feature.setId(`${z}/${x}/${y}/poi/${i}`);
    feature.setProperties({
      kind: 'poi',
      rank: i % 8,
      name: `Vienna place ${Math.floor(i / 3)}`,
    });
    features.push(feature);
  }
  return features;
}
