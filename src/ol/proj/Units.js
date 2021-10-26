/**
 * @module ol/proj/Units
 */

/**
 * Projection units: `'degrees'`, `'ft'`, `'m'`, `'pixels'`, `'tile-pixels'` or
 * `'us-ft'`.
 * @enum {string}
 */
const Units = {
  /**
   * Radians
   * @api
   */
  RADIANS: 'radians',
  /**
   * Degrees
   * @api
   */
  DEGREES: 'degrees',
  /**
   * Feet
   * @api
   */
  FEET: 'ft',
  /**
   * Meters
   * @api
   */
  METERS: 'm',
  /**
   * Pixels
   * @api
   */
  PIXELS: 'pixels',
  /**
   * Tile Pixels
   * @api
   */
  TILE_PIXELS: 'tile-pixels',
  /**
   * US Feet
   * @api
   */
  USFEET: 'us-ft',
};

/**
 * See http://duff.ess.washington.edu/data/raster/drg/docs/geotiff.txt
 * @type {Object<number, Units>}
 */
const unitByCode = {
  '9001': Units.METERS,
  '9002': Units.FEET,
  '9003': Units.USFEET,
  '9101': Units.RADIANS,
  '9102': Units.DEGREES,
};

/**
 * @param {number} code Unit code.
 * @return {Units} Units.
 */
export function fromCode(code) {
  return unitByCode[code];
}

/**
 * Meters per unit lookup table.
 * @const
 * @type {Object<Units, number>}
 * @api
 */
export const METERS_PER_UNIT = {};
// use the radius of the Normal sphere
METERS_PER_UNIT[Units.RADIANS] = 6370997 / (2 * Math.PI);
METERS_PER_UNIT[Units.DEGREES] = (2 * Math.PI * 6370997) / 360;
METERS_PER_UNIT[Units.FEET] = 0.3048;
METERS_PER_UNIT[Units.METERS] = 1;
METERS_PER_UNIT[Units.USFEET] = 1200 / 3937;

export default Units;
