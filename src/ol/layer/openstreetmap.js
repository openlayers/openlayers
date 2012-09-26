goog.provide('ol.layer.OpenStreetMap');
goog.provide('ol.source.OpenStreetMap');

goog.require('ol.TileUrlFunction');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.XYZ');



/**
 * @constructor
 * @extends {ol.layer.TileLayer}
 * @param {Object.<string, *>=} opt_values Values.
 */
ol.layer.OpenStreetMap = function(opt_values) {
  var tileSource = new ol.source.OpenStreetMap();
  goog.base(this, tileSource, opt_values);
};
goog.inherits(ol.layer.OpenStreetMap, ol.layer.TileLayer);



/**
 * @constructor
 * @extends {ol.source.XYZ}
 */
ol.source.OpenStreetMap = function() {

  var tileUrlFunction = ol.TileUrlFunction.createFromTemplate(
      'http://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png');

  var attribution = new ol.Attribution(
      '&copy; <a href="http://www.openstreetmap.org">OpenStreetMap</a> ' +
      'contributors, ' +
      '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA</a>');

  goog.base(this, 18, tileUrlFunction, [attribution]);

};
goog.inherits(ol.source.OpenStreetMap, ol.source.XYZ);
