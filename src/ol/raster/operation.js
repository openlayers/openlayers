goog.provide('ol.raster.IdentityOp');
goog.provide('ol.raster.Operation');
goog.provide('ol.raster.OperationType');


/**
 * Raster operation type. Supported values are `'pixel'` and `'image'`.
 * @enum {string}
 * @api
 */
ol.raster.OperationType = {
  PIXEL: 'pixel',
  IMAGE: 'image'
};


/**
 * A function that takes an array of input data, performs some operation, and
 * returns an array of ouput data.  For `'pixel'` type operations, functions
 * will be called with an array of {@link ol.raster.Pixel} data and should
 * return an array of the same.  For `'image'` type operations, functions will
 * be called with an array of {@link ImageData
 * https://developer.mozilla.org/en-US/docs/Web/API/ImageData} and should return
 * an array of the same.
 *
 * @typedef {function((Array.<ol.raster.Pixel>|Array.<ImageData>)):
 *     (Array.<ol.raster.Pixel>|Array.<ImageData>)}
 * @api
 */
ol.raster.Operation;


/**
 * The identity operation.  Returns the supplied input data as output.
 * @param {(Array.<ol.raster.Pixel>|Array.<ImageData>)} inputs Input data.
 * @return {(Array.<ol.raster.Pixel>|Array.<ImageData>)} The output data.
 */
ol.raster.IdentityOp = function(inputs) {
  return inputs;
};
