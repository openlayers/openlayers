goog.provide('ol.source.wms');

goog.require('goog.object');
goog.require('goog.uri.utils');


/**
 * @param {string} baseUrl WMS base url.
 * @param {Object.<string, string|number>} params Request parameters.
 * @param {ol.Extent} extent Extent.
 * @param {ol.Size} size Size.
 * @param {ol.Projection} projection Projection.
 * @return {string} WMS GetMap request URL.
 */
ol.source.wms.getUrl =
    function(baseUrl, params, extent, size, projection) {
  var baseParams = {
    'SERVICE': 'WMS',
    'VERSION': '1.3.0',
    'REQUEST': 'GetMap',
    'FORMAT': 'image/png',
    'TRANSPARENT': true,
    'WIDTH': Math.round(size[0]),
    'HEIGHT': Math.round(size[1])
  };
  goog.object.extend(baseParams, params);

  //TODO: Provide our own appendParams function to avoid this empty string hack
  var stylesParam = 'STYLES';
  baseParams[stylesParam] = params[stylesParam] || new String('');

  var wms13 = baseParams['VERSION'] > '1.3';
  baseParams[wms13 ? 'CRS' : 'SRS'] = projection.getCode();

  var axisOrientation = projection.getAxisOrientation();
  var bboxValues = (wms13 && axisOrientation.substr(0, 2) == 'ne') ?
      [extent[2], extent[0], extent[3], extent[1]] :
      [extent[0], extent[2], extent[1], extent[3]];
  baseParams['BBOX'] = bboxValues.join(',');

  return goog.uri.utils.appendParamsFromMap(baseUrl, baseParams);
};
