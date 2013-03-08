goog.provide('ol.ImageUrlFunction');
goog.provide('ol.ImageUrlFunctionType');

goog.require('ol.Extent');
goog.require('ol.Size');
goog.require('ol.source.wms');


/**
 * @typedef {function(ol.Extent, ol.Size, ol.Projection): (string|undefined)}
 */
ol.ImageUrlFunctionType;


/**
 * @param {string} baseUrl Base URL (may have query data).
 * @param {Object.<string, string|number>} params WMS parameters.
 * @return {ol.ImageUrlFunctionType} Image URL function.
 */
ol.ImageUrlFunction.createWMSParams =
    function(baseUrl, params) {
  return function(extent, size, projection) {
    return ol.source.wms.getUrl(
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
