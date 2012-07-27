goog.provide('ol.layer.OpenStreetMap');
goog.provide('ol.store.OpenStreetMap');

goog.require('ol.TileLayer');
goog.require('ol.TileUrlFunction');
goog.require('ol.tilestore.XYZ');



/**
 * @constructor
 * @extends {ol.TileLayer}
 * @param {Object.<string, *>=} opt_values Values.
 */
ol.layer.OpenStreetMap = function(opt_values) {
  var tileStore = new ol.store.OpenStreetMap();
  goog.base(this, tileStore, opt_values);
};
goog.inherits(ol.layer.OpenStreetMap, ol.TileLayer);



/**
 * @constructor
 * @extends {ol.tilestore.XYZ}
 */
ol.store.OpenStreetMap = function() {

  goog.base(this, 18, ol.TileUrlFunction.createFromTemplates([
    'http://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
    'http://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
    'http://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
  ]), [
    '&copy; <a href="http://www.openstreetmap.org">OpenStreetMap</a> ' +
        'contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA</a>'
  ]);

};
goog.inherits(ol.store.OpenStreetMap, ol.tilestore.XYZ);
