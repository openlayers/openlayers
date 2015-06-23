goog.provide('ol.format.TWKB');

goog.require('ol.Feature');
goog.require('ol.ext.twkb');
goog.require('ol.format.Feature');
goog.require('ol.format.FormatType');
goog.require('ol.format.GeoJSON');



/**
 * @classdesc
 * Geometry format for reading data in the TWKB
 * format.
 *
 * @constructor
 * @extends {ol.format.Feature}
 * @api stable
 */
ol.format.TWKB = function() {
  goog.base(this);
};
goog.inherits(ol.format.TWKB, ol.format.Feature);


/**
 * Read all features from a WKT source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {Array.<ol.Feature>} Features.
 * @api stable
 */
ol.format.TWKB.prototype.readFeatures = function(source, opt_options) {
  var format = new ol.format.GeoJSON();
  var geojson = new ol.ext.twkb(
      new Uint8Array(/** @type {ArrayBuffer} */ (source))).toGeoJSON();
  var features = format.readFeatures(geojson);
  return features;
};


/**
 * @inheritDoc
 */
ol.format.TWKB.prototype.getType = function() {
  return ol.format.FormatType.BINARY;
};
