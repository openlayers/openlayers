goog.provide('ol.proj.Units');

goog.require('ol.sphere.NORMAL');


/**
 * Projection units: `'degrees'`, `'ft'`, `'m'`, `'pixels'`, `'tile-pixels'` or
 * `'us-ft'`.
 * @enum {string}
 */
ol.proj.Units = {
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
 * @api stable
 */
ol.proj.Units.METERS_PER_UNIT = {};
ol.proj.Units.METERS_PER_UNIT[ol.proj.Units.DEGREES] =
    2 * Math.PI * ol.sphere.NORMAL.radius / 360;
ol.proj.Units.METERS_PER_UNIT[ol.proj.Units.FEET] = 0.3048;
ol.proj.Units.METERS_PER_UNIT[ol.proj.Units.METERS] = 1;
ol.proj.Units.METERS_PER_UNIT[ol.proj.Units.USFEET] = 1200 / 3937;
