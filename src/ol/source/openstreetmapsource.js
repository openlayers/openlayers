goog.provide('ol.source.OpenStreetMap');

goog.require('ol.Attribution');
goog.require('ol.source.XYZ');



/**
 * @constructor
 * @extends {ol.source.XYZ}
 */
ol.source.OpenStreetMap = function() {

  var attribution = new ol.Attribution(
      '&copy; <a href="http://www.openstreetmap.org">OpenStreetMap</a> ' +
      'contributors, ' +
      '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA</a>');

  goog.base(this, {
    attributions: [attribution],
    crossOrigin: 'anonymous',
    opaque: true,
    maxZoom: 18,
    url: 'http://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  });

};
goog.inherits(ol.source.OpenStreetMap, ol.source.XYZ);
