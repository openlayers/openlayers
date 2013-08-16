goog.provide('ol.source.XAPI');

goog.require('goog.net.XhrIo');
goog.require('ol.proj');
goog.require('ol.source.Vector');

/**
 * @constructor
 * @extends {ol.source.Source}
 * @param {ol.source.XAPIOptions} options Vector source options.
 */
ol.source.XAPI = function(options) {

  /**
   * @private
   * @type {string|undefined}
   */
  this.url_ = goog.isDef(options.url) ?
      options.url : 'http://xapi.openstreetmap.org/api/0.6/';

  var attributions;
  if (goog.isDef(options.attributions)) {
    attributions = options.attributions;
  } else if (goog.isDef(options.attribution)) {
    attributions = [options.attribution];
  } else {
    attributions = ol.source.OSM.ATTRIBUTIONS;
  }

  goog.base(this, {
    attributions: attributions,
    projection: goog.isDef(options.projection) ?
        options.projection : ol.proj.get('EPSG:4326')
  });
};
goog.inherits(ol.source.XAPI, ol.source.Vector);
