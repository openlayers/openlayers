goog.provide('ol.source.wms');


/**
 * @param {string} baseUrl WMS base url.
 * @param {Object.<string, string|number>} params Request parameters.
 * @param {ol.Extent} extent Extent.
 * @param {ol.Size} size Size.
 * @param {ol.Projection} projection Projection.
 * @param {string=} opt_version WMS version. Default is '1.3.0'.
 * @return {string} WMS GetMap request URL.
 */
ol.source.wms.getUrl =
    function(baseUrl, params, extent, size, projection, opt_version) {
  var version = goog.isDef(opt_version) ? opt_version : '1.3.0';
  var wms13 = version >= '1.3';
  var axisOrientation = projection.getAxisOrientation();
  var bboxValues = (wms13 && axisOrientation.substr(0, 2) == 'ne') ?
      [extent.minY, extent.minX, extent.maxY, extent.maxX] :
      [extent.minX, extent.minY, extent.maxX, extent.maxY];
  var baseParams = {
    'SERVICE': 'WMS',
    'VERSION': version,
    'REQUEST': 'GetMap',
    'FORMAT': 'image/png',
    'TRANSPARENT': true,
    'WIDTH': size.width,
    'HEIGHT': size.height,
    'BBOX': bboxValues.join(',')
  };
  goog.object.extend(baseParams, params);
  baseParams[wms13 ? 'CRS' : 'SRS'] = projection.getCode();
  //TODO: Provide our own appendParams function to avoid this empty string hack
  var stylesParam = 'STYLES';
  baseParams[stylesParam] = params[stylesParam] || new String('');
  return goog.uri.utils.appendParamsFromMap(baseUrl, baseParams);
};
