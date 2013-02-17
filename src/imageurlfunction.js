goog.provide('ol.ImageUrlFunction');
goog.provide('ol.ImageUrlFunctionType');

goog.require('ol.Extent');
goog.require('ol.Size');


/**
 * @typedef {function(ol.Extent, ol.Size): (string|undefined)}
 */
ol.ImageUrlFunctionType;


/**
 * @param {string} baseUrl Base URL (may have query data).
 * @return {ol.ImageUrlFunctionType} Image URL function.
 */
ol.ImageUrlFunction.createBboxParam = function(baseUrl) {
  return function(extent, size) {
    // FIXME Projection dependant axis order.
    var bboxValue = [
      extent.minX, extent.minY, extent.maxX, extent.maxY
    ].join(',');
    return goog.uri.utils.appendParams(baseUrl,
        'BBOX', bboxValue,
        'HEIGHT', size.height,
        'WIDTH', size.width);
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
