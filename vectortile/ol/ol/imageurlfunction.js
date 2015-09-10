goog.provide('ol.ImageUrlFunction');
goog.provide('ol.ImageUrlFunctionType');

goog.require('ol.Size');


/**
 * @typedef {function(this:ol.source.Image, ol.Extent, ol.Size,
 *     ol.proj.Projection): (string|undefined)}
 */
ol.ImageUrlFunctionType;


/**
 * @param {string} baseUrl Base URL (may have query data).
 * @param {Object.<string,*>} params to encode in the URL.
 * @param {function(string, Object.<string,*>, ol.Extent, ol.Size,
 *     ol.proj.Projection): (string|undefined)} paramsFunction params function.
 * @return {ol.ImageUrlFunctionType} Image URL function.
 */
ol.ImageUrlFunction.createFromParamsFunction =
    function(baseUrl, params, paramsFunction) {
  return (
      /**
       * @this {ol.source.Image}
       * @param {ol.Extent} extent Extent.
       * @param {ol.Size} size Size.
       * @param {ol.proj.Projection} projection Projection.
       * @return {string|undefined} URL.
       */
      function(extent, size, projection) {
        return paramsFunction(baseUrl, params, extent, size, projection);
      });
};


/**
 * @this {ol.source.Image}
 * @param {ol.Extent} extent Extent.
 * @param {ol.Size} size Size.
 * @return {string|undefined} Image URL.
 */
ol.ImageUrlFunction.nullImageUrlFunction =
    function(extent, size) {
  return undefined;
};
