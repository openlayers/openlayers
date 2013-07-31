goog.provide('ol.source.WMSGetFeatureInfoMethod');
goog.provide('ol.source.wms');

goog.require('goog.net.XhrIo');
goog.require('goog.object');
goog.require('goog.uri.utils');


/**
 * Method to use to get WMS feature info.
 * @enum {string}
 */
ol.source.WMSGetFeatureInfoMethod = {
  /**
   * Load the info in an IFRAME. Only works with 'text/html and 'text/plain' as
   * `INFO_FORMAT`.
   */
  IFRAME: 'iframe',
  /**
   * Use an asynchronous GET request. Requires CORS headers or a server at the
   * same origin as the application script.
   */
  XHR_GET: 'xhr_get'
};


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


/**
 * @param {string} url URL as provided by the url function, with added I, J, X
 *     and Y params.
 * @param {Object} options Options as defined in the source.
 * @param {function(string)} success Callback function for successful queries.
 * @param {function()=} opt_error Optional callback function for unsuccessful
 *     queries.
 */
ol.source.wms.getFeatureInfo = function(url, options, success, opt_error) {
  options = goog.isDef(options) ? goog.object.clone(options) : {};
  goog.object.extend(options, {
    method: ol.source.WMSGetFeatureInfoMethod.IFRAME,
    params: {}
  });
  var params = {
    'INFO_FORMAT': 'text/html'
  };
  goog.object.extend(params, options.params);
  url = goog.uri.utils.appendParamsFromMap(url, params);
  // TODO: This could be done in a smarter way if the url function was not a
  // closure
  url = url.replace('REQUEST=GetMap', 'REQUEST=GetFeatureInfo')
      .replace(/LAYERS=([^&]+)/, 'LAYERS=$1&QUERY_LAYERS=$1');
  if (options.method == ol.source.WMSGetFeatureInfoMethod.IFRAME) {
    goog.global.setTimeout(function() {
      success('<iframe seamless src="' + url + '"></iframe>');
    }, 0);
  } else if (options.method == ol.source.WMSGetFeatureInfoMethod.XHR_GET) {
    goog.net.XhrIo.send(url, function(event) {
      var xhr = event.target;
      if (xhr.isSuccess()) {
        success(xhr.getResponseText());
      } else if (goog.isDef(opt_error)) {
        opt_error();
      }
    });
  }
};
