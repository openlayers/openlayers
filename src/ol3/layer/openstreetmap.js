goog.provide('ol3.layer.OpenStreetMap');
goog.provide('ol3.store.OpenStreetMap');

goog.require('ol3.TileLayer');
goog.require('ol3.TileUrlFunction');
goog.require('ol3.tilestore.XYZ');



/**
 * @constructor
 * @extends {ol3.TileLayer}
 * @param {Object.<string, *>=} opt_values Values.
 */
ol3.layer.OpenStreetMap = function(opt_values) {
  var tileStore = new ol3.store.OpenStreetMap();
  goog.base(this, tileStore, opt_values);
};
goog.inherits(ol3.layer.OpenStreetMap, ol3.TileLayer);



/**
 * @constructor
 * @extends {ol3.tilestore.XYZ}
 */
ol3.store.OpenStreetMap = function() {

  var tileUrlFunction = ol3.TileUrlFunction.createFromTemplate(
      'http://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png');

  var attribution = new ol3.Attribution(
      '&copy; <a href="http://www.openstreetmap.org">OpenStreetMap</a> ' +
      'contributors, ' +
      '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA</a>');

  goog.base(this, 18, tileUrlFunction, [attribution]);

};
goog.inherits(ol3.store.OpenStreetMap, ol3.tilestore.XYZ);
