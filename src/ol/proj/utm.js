/**
 * @module ol/proj/utm
 */

/**
 * Adapted from https://github.com/Turbo87/utm
 * Copyright (c) 2012-2017 Tobias Bieniek
 *
 * The functions here provide approximate transforms to and from UTM.
 * They are not appropriate for use beyond the validity extend of a UTM
 * zone, and the accuracy of the transform decreases toward the zone
 * edges.
 */

import {toDegrees, toRadians, wrap} from '../math.js';
import Projection from './Projection.js';

/**
 * @typedef {Object} UTMZone
 * @property {number} number The zone number (1 - 60).
 * @property {boolean} north The northern hemisphere.
 */

const K0 = 0.9996;

const E = 0.00669438;
const E2 = E * E;
const E3 = E2 * E;
const E_P2 = E / (1 - E);

const SQRT_E = Math.sqrt(1 - E);
const _E = (1 - SQRT_E) / (1 + SQRT_E);
const _E2 = _E * _E;
const _E3 = _E2 * _E;
const _E4 = _E3 * _E;
const _E5 = _E4 * _E;

const M1 = 1 - E / 4 - (3 * E2) / 64 - (5 * E3) / 256;
const M2 = (3 * E) / 8 + (3 * E2) / 32 + (45 * E3) / 1024;
const M3 = (15 * E2) / 256 + (45 * E3) / 1024;
const M4 = (35 * E3) / 3072;

const P2 = (3 / 2) * _E - (27 / 32) * _E3 + (269 / 512) * _E5;
const P3 = (21 / 16) * _E2 - (55 / 32) * _E4;
const P4 = (151 / 96) * _E3 - (417 / 128) * _E5;
const P5 = (1097 / 512) * _E4;

const R = 6378137;

/**
 * @param {number} easting Easting value of coordinate.
 * @param {number} northing Northing value of coordinate.
 * @param {UTMZone} zone The UTM zone.
 * @return {import("../coordinate.js").Coordinate} The transformed coordinate.
 */
function toLonLat(easting, northing, zone) {
  const x = easting - 500000;
  const y = zone.north ? northing : northing - 10000000;

  const m = y / K0;
  const mu = m / (R * M1);

  const pRad =
    mu +
    P2 * Math.sin(2 * mu) +
    P3 * Math.sin(4 * mu) +
    P4 * Math.sin(6 * mu) +
    P5 * Math.sin(8 * mu);

  const pSin = Math.sin(pRad);
  const pSin2 = pSin * pSin;

  const pCos = Math.cos(pRad);

  const pTan = pSin / pCos;
  const pTan2 = pTan * pTan;
  const pTan4 = pTan2 * pTan2;

  const epSin = 1 - E * pSin2;
  const epSinSqrt = Math.sqrt(1 - E * pSin2);

  const n = R / epSinSqrt;
  const r = (1 - E) / epSin;

  const c = E_P2 * pCos ** 2;
  const c2 = c * c;

  const d = x / (n * K0);
  const d2 = d * d;
  const d3 = d2 * d;
  const d4 = d3 * d;
  const d5 = d4 * d;
  const d6 = d5 * d;

  const latitude =
    pRad -
    (pTan / r) *
      (d2 / 2 - (d4 / 24) * (5 + 3 * pTan2 + 10 * c - 4 * c2 - 9 * E_P2)) +
    (d6 / 720) * (61 + 90 * pTan2 + 298 * c + 45 * pTan4 - 252 * E_P2 - 3 * c2);

  let longitude =
    (d -
      (d3 / 6) * (1 + 2 * pTan2 + c) +
      (d5 / 120) * (5 - 2 * c + 28 * pTan2 - 3 * c2 + 8 * E_P2 + 24 * pTan4)) /
    pCos;

  longitude = wrap(
    longitude + toRadians(zoneToCentralLongitude(zone.number)),
    -Math.PI,
    Math.PI,
  );

  return [toDegrees(longitude), toDegrees(latitude)];
}

const MIN_LATITUDE = -80;
const MAX_LATITUDE = 84;
const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;

/**
 * @param {number} longitude The longitude.
 * @param {number} latitude The latitude.
 * @param {UTMZone} zone The UTM zone.
 * @return {import('../coordinate.js').Coordinate} The UTM coordinate.
 */
function fromLonLat(longitude, latitude, zone) {
  longitude = wrap(longitude, MIN_LONGITUDE, MAX_LONGITUDE);

  if (latitude < MIN_LATITUDE) {
    latitude = MIN_LATITUDE;
  } else if (latitude > MAX_LATITUDE) {
    latitude = MAX_LATITUDE;
  }

  const latRad = toRadians(latitude);
  const latSin = Math.sin(latRad);
  const latCos = Math.cos(latRad);

  const latTan = latSin / latCos;
  const latTan2 = latTan * latTan;
  const latTan4 = latTan2 * latTan2;

  const lonRad = toRadians(longitude);
  const centralLon = zoneToCentralLongitude(zone.number);
  const centralLonRad = toRadians(centralLon);

  const n = R / Math.sqrt(1 - E * latSin ** 2);
  const c = E_P2 * latCos ** 2;

  const a = latCos * wrap(lonRad - centralLonRad, -Math.PI, Math.PI);
  const a2 = a * a;
  const a3 = a2 * a;
  const a4 = a3 * a;
  const a5 = a4 * a;
  const a6 = a5 * a;

  const m =
    R *
    (M1 * latRad -
      M2 * Math.sin(2 * latRad) +
      M3 * Math.sin(4 * latRad) -
      M4 * Math.sin(6 * latRad));

  const easting =
    K0 *
      n *
      (a +
        (a3 / 6) * (1 - latTan2 + c) +
        (a5 / 120) * (5 - 18 * latTan2 + latTan4 + 72 * c - 58 * E_P2)) +
    500000;

  let northing =
    K0 *
    (m +
      n *
        latTan *
        (a2 / 2 +
          (a4 / 24) * (5 - latTan2 + 9 * c + 4 * c ** 2) +
          (a6 / 720) * (61 - 58 * latTan2 + latTan4 + 600 * c - 330 * E_P2)));

  if (!zone.north) {
    northing += 10000000;
  }

  return [easting, northing];
}

/**
 * @param {number} zone The zone number.
 * @return {number} The central longitude in degrees.
 */
function zoneToCentralLongitude(zone) {
  return (zone - 1) * 6 - 180 + 3;
}

/**
 * @type {Array<RegExp>}
 */
const epsgRegExes = [
  /^EPSG:(\d+)$/,
  /^urn:ogc:def:crs:EPSG::(\d+)$/,
  /^http:\/\/www\.opengis\.net\/def\/crs\/EPSG\/0\/(\d+)$/,
];

/**
 * @param {string} code The projection code.
 * @return {UTMZone|null} The UTM zone info (or null if not UTM).
 */
export function zoneFromCode(code) {
  let epsgId = 0;
  for (const re of epsgRegExes) {
    const match = code.match(re);
    if (match) {
      epsgId = parseInt(match[1]);
      break;
    }
  }
  if (!epsgId) {
    return null;
  }

  let number = 0;
  let north = false;
  if (epsgId > 32700 && epsgId < 32761) {
    number = epsgId - 32700;
  } else if (epsgId > 32600 && epsgId < 32661) {
    north = true;
    number = epsgId - 32600;
  }
  if (!number) {
    return null;
  }

  return {number, north};
}

/**
 * @param {function(number, number, UTMZone): import('../coordinate.js').Coordinate} transformer The transformer.
 * @param {UTMZone} zone The UTM zone.
 * @return {import('../proj.js').TransformFunction} The transform function.
 */
function makeTransformFunction(transformer, zone) {
  return function (input, output, dimension, stride) {
    const length = input.length;
    dimension = dimension > 1 ? dimension : 2;
    stride = stride ?? dimension;
    if (!output) {
      if (dimension > 2) {
        output = input.slice();
      } else {
        output = new Array(length);
      }
    }
    for (let i = 0; i < length; i += stride) {
      const x = input[i];
      const y = input[i + 1];
      const coord = transformer(x, y, zone);
      output[i] = coord[0];
      output[i + 1] = coord[1];
    }
    return output;
  };
}

/**
 * @param {string} code The projection code.
 * @return {import('./Projection.js').default|null} A projection or null if unable to create one.
 */
export function makeProjection(code) {
  const zone = zoneFromCode(code);
  if (!zone) {
    return null;
  }
  return new Projection({code, units: 'm'});
}

/**
 * @param {import('./Projection.js').default} projection The projection.
 * @return {import('../proj.js').Transforms|null} The transforms lookup or null if unable to handle projection.
 */
export function makeTransforms(projection) {
  const zone = zoneFromCode(projection.getCode());
  if (!zone) {
    return null;
  }

  return {
    forward: makeTransformFunction(fromLonLat, zone),
    inverse: makeTransformFunction(toLonLat, zone),
  };
}
