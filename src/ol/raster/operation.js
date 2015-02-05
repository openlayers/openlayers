goog.provide('ol.raster.IdentityOp');
goog.provide('ol.raster.Operation');


/**
 * A function that takes an array of {@link ol.raster.Pixel} as inputs, performs
 * some operation on them, and returns an array of {@link ol.raster.Pixel} as
 * outputs.
 *
 * @typedef {function(Array.<ol.raster.Pixel>): Array.<ol.raster.Pixel>}
 * @api
 */
ol.raster.Operation;


/**
 * The identity operation for pixels.  Returns the supplied input pixels as
 * outputs.
 * @param {Array.<ol.raster.Pixel>} inputs Input pixels.
 * @return {Array.<ol.raster.Pixel>} The input pixels as output.
 */
ol.raster.IdentityOp = function(inputs) {
  return inputs;
};
