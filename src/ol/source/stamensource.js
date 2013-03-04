// FIXME Configure minZoom when supported by TileGrid

goog.provide('ol.source.Stamen');
goog.provide('ol.source.StamenFlavor');
goog.provide('ol.source.StamenProvider');

goog.require('ol.Attribution');
goog.require('ol.source.XYZ');


/**
 * @enum {string}
 */
ol.source.StamenFlavor = {
  TERRAIN_BACKGROUND: 'background',
  TERRAIN_LABELS: 'labels',
  TERRAIN_LINES: 'lines',
  TONER_2010: '2010',
  TONER_2011: '2011',
  TONER_2011_LABELS: '2011-labels',
  TONER_2011_LINES: '2011-lines',
  TONER_2011_LITE: '2011-lite',
  TONER_BACKGROUND: 'background',
  TONER_HYBRID: 'hybrid',
  TONER_LABELS: 'labels',
  TONER_LINES: 'lines',
  TONER_LITE: 'lite'
};


/**
 * @enum {string}
 */
ol.source.StamenProvider = {
  TERRAIN: 'terrain',
  TONER: 'toner',
  WATERCOLOR: 'watercolor'
};


/**
 * @type {Object.<string, {type: string, minZoom: number, maxZoom: number}>}
 */
ol.source.StamenProviderConfig = {};
ol.source.StamenProviderConfig[ol.source.StamenProvider.TERRAIN] = {
  type: 'jpg',
  minZoom: 4,
  maxZoom: 18
};
ol.source.StamenProviderConfig[ol.source.StamenProvider.TONER] = {
  type: 'png',
  minZoom: 0,
  maxZoom: 20
};
ol.source.StamenProviderConfig[ol.source.StamenProvider.WATERCOLOR] = {
  type: 'jpg',
  minZoom: 3,
  maxZoom: 16
};



/**
 * @constructor
 * @extends {ol.source.XYZ}
 * @param {ol.source.StamenOptions} stamenOptions Stamen options.
 */
ol.source.Stamen = function(stamenOptions) {

  var attribution = new ol.Attribution(
      'Map tiles by <a href="http://stamen.com">Stamen Design</a>, ' +
      'under ' +
      '<a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. ' +
      'Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, ' +
      'under ' +
      '<a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.');

  var layer = stamenOptions.provider;
  if (goog.isDef(stamenOptions.flavor)) {
    layer += '-' + stamenOptions.flavor;
  }

  var config = ol.source.StamenProviderConfig[stamenOptions.provider];

  goog.base(this, {
    attributions: [attribution],
    maxZoom: config.maxZoom,
    opaque: false,
    url: 'http://{a-d}.tile.stamen.com/' + layer + '/{z}/{x}/{y}.' + config.type
  });

};
goog.inherits(ol.source.Stamen, ol.source.XYZ);
