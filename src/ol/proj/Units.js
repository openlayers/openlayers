/**
 * @module ol/proj/Units
 */
/**
 * Projection units: `'degrees'`, `'ft'`, `'m'`, `'pixels'`, `'tile-pixels'` or
 * `'us-ft'`.
 * @enum {string}
 */
const Units = {
  DEGREES: 'degrees',
  FEET: 'ft',
  METERS: 'm',
  PIXELS: 'pixels',
  TILE_PIXELS: 'tile-pixels',
  USFEET: 'us-ft'
};


/**
 * Meters per unit lookup table.
 * @const
 * @type {Object.<ol.proj.Units, number>}
 * @api
 */
Units.METERS_PER_UNIT = {};
// use the radius of the Normal sphere
Units.METERS_PER_UNIT[Units.DEGREES] =
    2 * Math.PI * 6370997 / 360;
Units.METERS_PER_UNIT[Units.FEET] = 0.3048;
Units.METERS_PER_UNIT[Units.METERS] = 1;
Units.METERS_PER_UNIT[Units.USFEET] = 1200 / 3937;
export default Units;
