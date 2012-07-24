goog.provide('ol.tilelayer.createOpenStreetMap');

goog.require('ol.Layer');
goog.require('ol.TileLayer');
goog.require('ol.tilestore.createXYZ');


/**
 * @param {Object.<string, *>=} opt_values Values.
 * @return {ol.Layer} Layer.
 */
ol.tilelayer.createOpenStreetMap = function(opt_values) {
  var store = ol.tilestore.createXYZ(
      18,
      [
        'http://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'http://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'http://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
      ],
      '&copy; ' +
      '<a href="http://www.openstreetmap.org">OpenStreetMap</a> ' +
      'contributors, ' +
      '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA</a>');
  return new ol.TileLayer(store, opt_values);
};
