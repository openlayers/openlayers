/**
 * Seeded geometry for benchmarks. Nothing is fetched over the network, and two
 * runs render the same features.
 */
import Feature from '../../../src/ol/Feature.js';
import LineString from '../../../src/ol/geom/LineString.js';
import MultiLineString from '../../../src/ol/geom/MultiLineString.js';
import MultiPoint from '../../../src/ol/geom/MultiPoint.js';
import MultiPolygon from '../../../src/ol/geom/MultiPolygon.js';
import Point from '../../../src/ol/geom/Point.js';
import Polygon from '../../../src/ol/geom/Polygon.js';
import {transform} from '../../../src/ol/proj.js';

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
 * Geometry kinds in `createVectorFeatures`, repeated in this order.
 * @type {Array<string>}
 */
const VECTOR_GEOMETRY_TYPES = [
  'Point',
  'MultiPoint',
  'LineString',
  'MultiLineString',
  'Polygon',
  'MultiPolygon',
];

/**
 * Points, lines, polygons, and multi-part geometries spread across the world.
 *
 * Generation is seeded, so the same count, vertex budget, and projection
 * always produce the same features. Coordinates are returned in `projection`.
 * Callers should pass the view projection: the canvas vector renderer draws
 * feature coordinates in the view CRS and does not reproject a source CRS.
 * @param {number} count Feature count.
 * @param {number} vertices Vertex budget for each part that has one.
 * @param {import('../../../src/ol/proj.js').ProjectionLike} [projection] Projection of the returned coordinates.
 * @return {Array<Feature>} Features.
 */
export function createVectorFeatures(
  count,
  vertices,
  projection = 'EPSG:3857',
) {
  const random = createRandom(42);
  const features = [];
  for (let i = 0; i < count; ++i) {
    const type = VECTOR_GEOMETRY_TYPES[i % VECTOR_GEOMETRY_TYPES.length];
    const feature = new Feature(
      createVectorGeometry(type, random, vertices, projection),
    );
    feature.setId(i + 1);
    features.push(feature);
  }
  return features;
}

/**
 * @param {string} type Geometry type name.
 * @param {function(): number} random Seeded generator.
 * @param {number} vertices Vertex budget.
 * @param {import('../../../src/ol/proj.js').ProjectionLike} projection Target projection.
 * @return {import('../../../src/ol/geom/Geometry.js').default} Geometry.
 */
function createVectorGeometry(type, random, vertices, projection) {
  if (type === 'Point') {
    return new Point(project(origin(random), projection));
  }
  if (type === 'MultiPoint') {
    return new MultiPoint(
      projectAll(multiPointCoordinates(random, vertices), projection),
    );
  }
  if (type === 'LineString') {
    return new LineString(
      projectAll(lineCoordinates(random, vertices), projection),
    );
  }
  if (type === 'MultiLineString') {
    return new MultiLineString(
      multiLineCoordinates(random, vertices).map((line) =>
        projectAll(line, projection),
      ),
    );
  }
  if (type === 'MultiPolygon') {
    return new MultiPolygon(
      multiPolygonCoordinates(random, vertices).map((polygon) =>
        polygon.map((ring) => projectAll(ring, projection)),
      ),
    );
  }
  return new Polygon(
    polygonCoordinates(random, vertices).map((ring) =>
      projectAll(ring, projection),
    ),
  );
}

/**
 * @param {function(): number} random Seeded generator.
 * @return {Array<number>} Longitude and latitude.
 */
function origin(random) {
  return [random() * 300 - 150, random() * 100 - 50];
}

/**
 * @param {number} lon Longitude.
 * @param {number} lat Latitude.
 * @return {Array<number>} Clamped longitude and latitude.
 */
function clampLonLat(lon, lat) {
  return [
    Math.max(-179.9, Math.min(179.9, lon)),
    Math.max(-84, Math.min(84, lat)),
  ];
}

/**
 * @param {Array<number>} coordinate Longitude and latitude.
 * @param {import('../../../src/ol/proj.js').ProjectionLike} projection Target projection.
 * @return {Array<number>} Projected coordinate.
 */
function project(coordinate, projection) {
  return transform(coordinate, 'EPSG:4326', projection);
}

/**
 * @param {Array<Array<number>>} coordinates Longitude and latitude pairs.
 * @param {import('../../../src/ol/proj.js').ProjectionLike} projection Target projection.
 * @return {Array<Array<number>>} Projected coordinates.
 */
function projectAll(coordinates, projection) {
  return coordinates.map((coordinate) => project(coordinate, projection));
}

/**
 * @param {function(): number} random Seeded generator.
 * @param {number} vertices Point count.
 * @return {Array<Array<number>>} Clustered longitude and latitude pairs.
 */
function multiPointCoordinates(random, vertices) {
  const count = Math.max(2, vertices);
  const [lon, lat] = origin(random);
  const spread = 0.35 + random() * 2.2;
  const coordinates = [];
  for (let i = 0; i < count; ++i) {
    const angle = random() * Math.PI * 2;
    const distance = spread * Math.sqrt(random());
    coordinates.push(
      clampLonLat(
        lon + Math.cos(angle) * distance,
        lat + Math.sin(angle) * distance,
      ),
    );
  }
  return coordinates;
}

/**
 * @param {function(): number} random Seeded generator.
 * @param {number} vertices Vertex count.
 * @return {Array<Array<number>>} A random-walk line.
 */
function lineCoordinates(random, vertices) {
  const count = Math.max(2, vertices);
  const start = origin(random);
  let lon = start[0];
  let lat = start[1];
  let heading = random() * Math.PI * 2;
  const step = 0.2 + random() * 0.7;
  const coordinates = [clampLonLat(lon, lat)];
  for (let i = 1; i < count; ++i) {
    heading += (random() - 0.5) * 0.9;
    lon += Math.cos(heading) * step;
    lat += Math.sin(heading) * step * 0.65;
    coordinates.push(clampLonLat(lon, lat));
  }
  return coordinates;
}

/**
 * @param {function(): number} random Seeded generator.
 * @param {number} vertices Vertices in each part.
 * @return {Array<Array<Array<number>>>} Three separated lines.
 */
function multiLineCoordinates(random, vertices) {
  const anchor = origin(random);
  const lines = [];
  for (let part = 0; part < 3; ++part) {
    const start = clampLonLat(anchor[0] + (part - 1) * 4, anchor[1]);
    let lon = start[0];
    let lat = start[1];
    let heading = random() * Math.PI * 2;
    const step = 0.15 + random() * 0.45;
    const count = Math.max(2, vertices);
    const line = [start.slice()];
    for (let i = 1; i < count; ++i) {
      heading += (random() - 0.5) * 0.8;
      lon += Math.cos(heading) * step;
      lat += Math.sin(heading) * step * 0.65;
      line.push(clampLonLat(lon, lat));
    }
    lines.push(line);
  }
  return lines;
}

/**
 * @param {function(): number} random Seeded generator.
 * @param {Array<number>} center Longitude and latitude.
 * @param {number} radius Radius in degrees.
 * @param {number} vertices Ring length before closing.
 * @return {Array<Array<number>>} Closed ring.
 */
function ring(random, center, radius, vertices) {
  const count = Math.max(3, vertices);
  const wobble = 0.25 + random() * 0.45;
  const phase = random() * Math.PI * 2;
  const lobes = 3 + Math.floor(random() * 4);
  const coordinates = [];
  for (let v = 0; v < count; ++v) {
    const angle = (v / count) * Math.PI * 2;
    const distance =
      radius * (1 + wobble * Math.sin(angle * lobes + phase) * 0.45);
    coordinates.push(
      clampLonLat(
        center[0] + Math.cos(angle) * distance * 1.45,
        center[1] + Math.sin(angle) * distance,
      ),
    );
  }
  coordinates.push(coordinates[0].slice());
  return coordinates;
}

/**
 * @param {function(): number} random Seeded generator.
 * @param {number} vertices Vertices in the outer ring.
 * @return {Array<Array<Array<number>>>} One outer ring.
 */
function polygonCoordinates(random, vertices) {
  return [ring(random, origin(random), 0.8 + random() * 3.2, vertices)];
}

/**
 * @param {function(): number} random Seeded generator.
 * @param {number} vertices Vertices in each outer ring.
 * @return {Array<Array<Array<Array<number>>>>} Three separated polygons.
 */
function multiPolygonCoordinates(random, vertices) {
  const anchor = origin(random);
  const polygons = [];
  for (let part = 0; part < 3; ++part) {
    const center = clampLonLat(
      anchor[0] + (part - 1) * 7,
      anchor[1] + (part === 1 ? 3.5 : -2),
    );
    polygons.push([ring(random, center, 0.7 + random() * 1.8, vertices)]);
  }
  return polygons;
}

/**
 * Dense point labels for measuring placement without geometry tessellation
 * dominating the result.
 * @param {import("../../../src/ol/tilecoord.js").TileCoord} tileCoord Tile coordinate.
 * @param {import("../../../src/ol/extent.js").Extent} extent Tile extent.
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
