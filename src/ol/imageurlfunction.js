goog.provide('ol.ImageUrlFunction');
goog.provide('ol.ImageUrlFunctionType');

goog.require('ol.Extent');
goog.require('ol.Size');


/**
 * @typedef {function(this:ol.source.Source, ol.Extent, ol.Size, ol.Projection):
 *     (string|undefined)}
 */
ol.ImageUrlFunctionType;


/**
 * @param {string} baseUrl Base URL (may have query data).
 * @param {Object.<string,*>} params to encode in the url.
 * @param {function(string, Object.<string,*>, ol.Extent, ol.Size,
 *     ol.Projection)} paramsFunction params function.
 * @return {ol.ImageUrlFunctionType} Image URL function.
 */
ol.ImageUrlFunction.createFromParamsFunction =
    function(baseUrl, params, paramsFunction) {
  return function(extent, size, projection) {
    return paramsFunction(
        baseUrl, params, extent, size, projection);
  };
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {ol.Size} size Size.
 * @return {string|undefined} Image URL.
 */
ol.ImageUrlFunction.nullImageUrlFunction =
    function(extent, size) {
  return undefined;
};
