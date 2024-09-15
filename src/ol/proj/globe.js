/**
 * @module ol/proj/globe
 */
import Projection from './Projection.js';
import {toDegrees, toRadians} from '../math.js';

/**
 * Semi-major radius of the WGS84 ellipsoid.
 *
 * @const
 * @type {number}
 */
export const RADIUS = 6378137;

/**
 * @const
 * @type {import("../extent.js").Extent}
 */
export const EXTENT = [-180, -90, 180, 90];

/**
 * @const
 * @type {number}
 */
export const METERS_PER_UNIT = (Math.PI * RADIUS) / 180;

/**
 * @classdesc
 * Projection object for WGS84 geographic coordinates for globe.
 *
 * OpenLayers treats globe as a pseudo-projection, with x,y coordinates.
 */
class GlobeProjection extends Projection {
  /**
   * @param {string} code Code.
   */
  constructor(code) {
    super({
      code: code,
      units: 'degrees',
      extent: EXTENT,
      global: true,
      metersPerUnit: METERS_PER_UNIT,
      worldExtent: EXTENT,
      subjective: true,
    });
  }
}

/**
 * Projections equal to EPSG:4326.
 *
 * @const
 * @type {Array<import("./Projection.js").default>}
 */
export const PROJECTIONS = [new GlobeProjection('globe')];

/**
 * @param {Array<number>} a 3D coordinate A.
 * @param {Array<number>} b 3D coordinate B.
 * @return {number} distance
 */
function distance3D(a, b) {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2,
  );
}

const globeRadius = 100; // in px
const SCALE = (255 / 180) * globeRadius; // XXX:

/**
 * Transformation from EPSG:4326 to Globe.
 *
 * @param {Array<number>} input Input array of coordinate values.
 * @param {Array<number>} [output] Output array of coordinate values.
 * @param {number} [dimension] Dimension (default is `2`).
 * @param {number} [stride] Stride (default is `dimension`).
 * @param {import("../View.js").State} [viewState] View state.
 * @return {Array<number>} Output array of coordinate values.
 */
export function fromEPSG4326(input, output, dimension, stride, viewState) {
  const center = viewState?.center || [0, 0];

  const length = input.length;
  dimension = dimension > 1 ? dimension : 2;
  stride = stride ?? dimension;
  if (output === undefined) {
    if (dimension > 2) {
      // preserve values beyond second dimension
      output = input.slice();
    } else {
      output = new Array(length);
    }
  }
  const FOV = viewState.fov;
  const zoomFactor = 1 / Math.pow(2, viewState?.zoom);
  const f = zoomFactor / Math.tan(toRadians(FOV / 2));

  const n = viewState?.tilt || 0; // already in radians
  const lng0 = toRadians(center[0]);
  const lat0 = toRadians(center[1]);
  const sinTilt = Math.sin(n);
  const cosTilt = Math.cos(n);
  const sinTiltDelta = Math.sin(lat0 - n);
  const cosTiltDelta = Math.cos(lat0 - n);

  const org = [0, -sinTilt, -cosTilt];
  const eye = [0, 0, f];

  const cullDist = Math.sqrt(distance3D(org, eye) ** 2 - 1);

  for (let i = 0; i < length; i += stride) {
    const lng = toRadians(input[i]);
    const lat = toRadians(input[i + 1]);

    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);

    const cosLngDelta = Math.cos(lng - lng0);
    const sinLngDelta = Math.sin(lng - lng0);

    // XYZ coordinate
    const x0 = cosLat * sinLngDelta;
    const y0 = sinLat;
    const z0 = cosLat * cosLngDelta;

    // Tilt
    const xt = x0;
    const yt = y0 * cosTiltDelta - z0 * sinTiltDelta - sinTilt;
    const zt = y0 * sinTiltDelta + z0 * cosTiltDelta - cosTilt;

    // Perspective
    const s = zt / f;
    const x = xt / (1 - s);
    const y = yt / (1 - s);

    // Cull
    if (distance3D([xt, yt, zt], eye) > cullDist || s > 1) {
      output[i] = NaN;
      output[i + 1] = NaN;
      continue;
    }

    output[i] = x * SCALE + center[0];
    output[i + 1] = y * SCALE + center[1];
  }

  return output;
}

/**
 * Transformation from Globe to EPSG:4326.
 *
 * @param {Array<number>} input Input array of coordinate values.
 * @param {Array<number>} [output] Output array of coordinate values.
 * @param {number} [dimension] Dimension (default is `2`).
 * @param {number} [stride] Stride (default is `dimension`).
 * @param {import("../View.js").State} [viewState] View state.
 * @return {Array<number>} Output array of coordinate values.
 */
export function toEPSG4326(input, output, dimension, stride, viewState) {
  const center = viewState?.center || [0, 0];

  const length = input.length;
  dimension = dimension > 1 ? dimension : 2;
  stride = stride ?? dimension;
  if (output === undefined) {
    if (dimension > 2) {
      // preserve values beyond second dimension
      output = input.slice();
    } else {
      output = new Array(length);
    }
  }

  const FOV = 20;
  const zoomFactor = 1 / Math.pow(2, viewState?.zoom);
  const f = zoomFactor / Math.tan(toRadians(FOV / 2));

  const n = viewState?.tilt || 0; // already in radians
  const lat0 = toRadians(center[1]);
  const sinTilt = Math.sin(n);
  const cosTilt = Math.cos(n);
  const sinTiltDelta = Math.sin(lat0 - n);
  const cosTiltDelta = Math.cos(lat0 - n);
  const sinLat0 = Math.sin(lat0);
  const cosLat0 = Math.cos(lat0);

  const f2 = f * f;

  const Q_termX2_Y2 = -f2 - 2 * f * cosTilt;
  const Q_termY2 = sinTilt ** 2;
  const Q_termY = -2 * f2 * sinTilt - f * Math.sin(2 * n);
  const Q_bias = f2 * cosTilt ** 2;
  const N_termY = sinTilt;
  const N_bias = -f * cosTilt;

  for (let i = 0; i < length; i += stride) {
    let x = (input[i] - center[0]) / SCALE;
    let y = (input[i + 1] - center[1]) / SCALE;

    const x2 = x * x;
    const y2 = y * y;
    const x2_y2 = x2 + y2;

    const Q = x2_y2 * Q_termX2_Y2 + y2 * Q_termY2 + y * Q_termY + Q_bias;
    if (Q < 0) {
      output[i] = NaN;
      output[i + 1] = NaN;
      continue;
    }
    const N = x2_y2 + Math.sqrt(Q) + y * N_termY + N_bias;
    const S = N / (f2 + x2_y2);
    const z = f * S;

    x -= x * S;
    y -= y * S;

    const xt = x;
    const yt = y * cosTiltDelta + z * sinTiltDelta + sinLat0;
    const zt = -y * sinTiltDelta + z * cosTiltDelta + cosLat0;

    output[i] = toDegrees(Math.atan2(xt, zt));
    output[i + 1] = toDegrees(Math.asin(yt) - lat0);
  }

  return output;
}
