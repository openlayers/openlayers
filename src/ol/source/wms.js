goog.provide('ol.source.IWMS');
goog.provide('ol.source.wms');

goog.require('ol.source.Source');


/**
 * @param {ol.source.Source} source Source.
 * @return {Object.<string,string|number>} base params.
 */
ol.source.wms.getBaseParams = function(source) {
  var options = source.options_;
  goog.asserts.assert(options);
  var version = goog.isDef(options.version) ? options.version : '1.3.0';
  var baseParams = {
    'SERVICE': 'WMS',
    'VERSION': version,
    'REQUEST': 'GetMap',
    'STYLES': '',
    'FORMAT': 'image/png',
    'TRANSPARENT': true
  };
  baseParams[version >= '1.3' ? 'CRS' : 'SRS'] =
      source.getProjection().getCode();
  goog.object.extend(baseParams, options.params);
  return baseParams;
};



/**
 * @interface
 */
ol.source.IWMS = function() {};


/**
 * @param {Object.<string, string|number>=} opt_params params.
 */
ol.source.IWMS.prototype.updateUrlFunction = function(opt_params) {};
