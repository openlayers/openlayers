// FIXME load from URL

goog.provide('ol.source.GeoJSON');

goog.require('goog.asserts');
goog.require('ol.proj');
goog.require('ol.reader.GeoJSON');
goog.require('ol.source.Vector');



/**
 * @constructor
 * @extends {ol.source.Vector}
 * @param {ol.source.GeoJSONOptions=} opt_options Options.
 */
ol.source.GeoJSON = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  var projection = goog.isDef(options.projection) ?
      options.projection : ol.proj.get('EPSG:3857');

  goog.base(this, {
    attributions: options.attributions,
    logo: options.logo,
    projection: projection
  });

  if (goog.isDef(options.geoJSON)) {
    ol.reader.GeoJSON.readObject(options.geoJSON, this.addFeature, this);
  }
  if (goog.isDef(options.string)) {
    ol.reader.GeoJSON.readString(options.string, this.addFeature, this);
  }

};
goog.inherits(ol.source.GeoJSON, ol.source.Vector);
