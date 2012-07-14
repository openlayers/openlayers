goog.provide('ol.createMap');

goog.require('goog.object');
goog.require('ol.Array');
goog.require('ol.Projection');
goog.require('ol.dom');
goog.require('ol.dom.Map');
goog.require('ol.webgl');
goog.require('ol.webgl.Map');


/**
 * @define {string} Default projection code.
 */
ol.DEFAULT_PROJECTION_CODE = 'EPSG:3857';


/**
 * @define {boolean} Whether to enable DOM.
 */
ol.ENABLE_DOM = true;


/**
 * @define {boolean} Whether to enable WebGL.
 */
ol.ENABLE_WEBGL = true;


/**
 * @param {!HTMLDivElement} target Target.
 * @param {Object.<string, *>=} opt_values Values.
 * @return {ol.Map} Map.
 */
ol.createMap = function(target, opt_values) {

  var values = {};
  if (goog.isDef(opt_values)) {
    goog.object.extend(values, opt_values);
  }

  if (!goog.object.containsKey(values, ol.MapProperty.LAYERS)) {
    values[ol.MapProperty.LAYERS] = new ol.Array();
  }

  if (!goog.object.containsKey(values, ol.MapProperty.PROJECTION)) {
    values[ol.MapProperty.PROJECTION] =
        ol.Projection.createFromCode(ol.DEFAULT_PROJECTION_CODE);
  }

  if (ol.ENABLE_WEBGL && ol.webgl.isSupported()) {
    return new ol.webgl.Map(target, values);
  }

  if (ol.ENABLE_DOM && ol.dom.isSupported()) {
    return new ol.dom.Map(target, values);
  }

  return null;

};
