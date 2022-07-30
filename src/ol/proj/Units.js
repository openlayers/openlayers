/**
 * @module ol/proj/Units
 */

/**
 * @typedef {'radians' | 'degrees' | 'ft' | 'm' | 'pixels' | 'tile-pixels' | 'us-ft'} Units
 * Projection units.
 */

/**
 * See http://duff.ess.washington.edu/data/raster/drg/docs/geotiff.txt
 * @type {Object<number, Units>}
 */
const unitByCode = {
  '9001': 'm',
  '9002': 'ft',
  '9003': 'us-ft',
  '9101': 'radians',
  '9102': 'degrees',
};

/**
 * @param {number} code Unit code.
 * @return {Units} Units.
 */
export function fromCode(code) {
  return unitByCode[code];
}

/**
 * @typedef {Object} MetersPerUnitLookup
 * @property {number} radians Radians
 * @property {number} degrees Degrees
 * @property {number} ft  Feet
 * @property {number} m Meters
 * @property {number} us-ft US feet
 */

/**
 * Meters per unit lookup table.
 * @const
 * @type {MetersPerUnitLookup}
 * @api
 */
export const METERS_PER_UNIT = {
  // use the radius of the Normal sphere
  'radians': 6370997 / (2 * Math.PI),
  'degrees': (2 * Math.PI * 6370997) / 360,
  'ft': 0.3048,
  'm': 1,
  'us-ft': 1200 / 3937,
};
