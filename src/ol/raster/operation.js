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
 * an array of the same.  The operations are called with a second "data"
 * argument, which can be used for storage.  The data object is accessible
 * from raster events, where it can be initialized in "beforeoperations" and
 * accessed again in "afteroperations".
 *
 * @typedef {function((Array.<ol.raster.Pixel>|Array.<ImageData>), Object):
 *     (Array.<ol.raster.Pixel>|Array.<ImageData>)}
 * @api
 */
ol.raster.Operation;
