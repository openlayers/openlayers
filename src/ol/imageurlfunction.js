goog.provide('ol.ImageUrlFunction');
goog.provide('ol.ImageUrlFunctionType');

goog.require('goog.uri.utils');
goog.require('ol.Extent');
goog.require('ol.Size');


/**
 * @typedef {function(ol.Extent, ol.Size): (string|undefined)}
 */
ol.ImageUrlFunctionType;


/**
 * @param {string} baseUrl Base URL (may have query data).
 * @param {string} axisOrientation Axis orientation.
 * @return {ol.ImageUrlFunctionType} Image URL function.
 */
ol.ImageUrlFunction.createBboxParam = function(baseUrl, axisOrientation) {
  return function(extent, size) {
    var bboxValues = axisOrientation.substr(0, 2) == 'ne' ?
        [extent.minY, extent.minX, extent.maxY, extent.maxX] :
        [extent.minX, extent.minY, extent.maxX, extent.maxY];
    return goog.uri.utils.appendParams(baseUrl,
        'BBOX', bboxValues.join(','),
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
