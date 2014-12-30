goog.provide('ol.source.GeoJSON');

goog.require('ol.format.GeoJSON');
goog.require('ol.source.StaticVector');



/**
 * @classdesc
 * Static vector source in GeoJSON format.  
 * Note, although the {@link ol.format.GeoJSON} format class, used by this source,
 * allows to read features and geometries, the source limits this to only allow to read
 * <em>features</em>, (see definition of source at {@link ol.source.Vector}). So
 * next is a valid GeoJSON to pass to this source:
 *
 *     {
 *       "type": "Feature",
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [0,0]
 *       }
 *     }
 *
 * while the next will throw an assertion error (in debug mode):
 *
 *     {
 *       "type": "Point",
 *       "coordinates": [0,0]
 *     }
 *
 * @constructor
 * @extends {ol.source.StaticVector}
 * @fires ol.source.VectorEvent
 * @param {olx.source.GeoJSONOptions=} opt_options Options.
 * @api
 */
ol.source.GeoJSON = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this, {
    attributions: options.attributions,
    extent: options.extent,
    format: new ol.format.GeoJSON({
      defaultDataProjection: options.defaultProjection
    }),
    logo: options.logo,
    object: options.object,
    projection: options.projection,
    text: options.text,
    url: options.url,
    urls: options.urls
  });

};
goog.inherits(ol.source.GeoJSON, ol.source.StaticVector);
