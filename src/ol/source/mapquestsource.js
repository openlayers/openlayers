goog.provide('ol.source.MapQuest');

goog.require('goog.asserts');
goog.require('ol');
goog.require('ol.Attribution');
goog.require('ol.source.OSM');
goog.require('ol.source.XYZ');



/**
 * @classdesc
 * Layer source for the MapQuest tile server.
 *
 * @constructor
 * @extends {ol.source.XYZ}
 * @param {olx.source.MapQuestOptions=} opt_options MapQuest options.
 * @api stable
 */
ol.source.MapQuest = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};
  goog.asserts.assert(options.layer in ol.source.MapQuestConfig);

  var layerConfig = ol.source.MapQuestConfig[options.layer];

  var protocol = ol.IS_HTTPS ? 'https:' : 'http:';
  var url = protocol + '//otile{1-4}-s.mqcdn.com/tiles/1.0.0/' +
      options.layer + '/{z}/{x}/{y}.jpg';

  goog.base(this, {
    attributions: layerConfig.attributions,
    crossOrigin: 'anonymous',
    logo: '//developer.mapquest.com/content/osm/mq_logo.png',
    maxZoom: layerConfig.maxZoom,
    opaque: true,
    tileLoadFunction: options.tileLoadFunction,
    url: url
  });

};
goog.inherits(ol.source.MapQuest, ol.source.XYZ);


/**
 * @const
 * @type {ol.Attribution}
 */
ol.source.MapQuest.TILE_ATTRIBUTION = new ol.Attribution({
  html: 'Tiles Courtesy of ' +
      '<a href="http://www.mapquest.com/" target="_blank">MapQuest</a>'
});


/**
 * @type {Object.<string, {maxZoom: number, attributions: (Array.<ol.Attribution>)}>}
 */
ol.source.MapQuestConfig = {
  'osm': {
    maxZoom: 28,
    attributions: [
      ol.source.MapQuest.TILE_ATTRIBUTION,
      ol.source.OSM.DATA_ATTRIBUTION
    ]
  },
  'sat': {
    maxZoom: 18,
    attributions: [
      ol.source.MapQuest.TILE_ATTRIBUTION,
      new ol.Attribution({
        html: 'Portions Courtesy NASA/JPL-Caltech and ' +
            'U.S. Depart. of Agriculture, Farm Service Agency'
      })
    ]
  },
  'hyb': {
    maxZoom: 18,
    attributions: [
      ol.source.MapQuest.TILE_ATTRIBUTION,
      ol.source.OSM.DATA_ATTRIBUTION
    ]
  }
};
