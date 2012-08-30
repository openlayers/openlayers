// FIXME Configure minZoom when supported by TileGrid

goog.provide('ol3.layer.Stamen');
goog.provide('ol3.store.Stamen');

goog.require('ol3.TileUrlFunction');
goog.require('ol3.layer.XYZ');


/**
 * @enum {string}
 */
ol3.StamenProvider = {
  TERRAIN: 'terrain',
  TONER: 'toner',
  WATERCOLOR: 'watercolor'
};


/**
 * @enum {string}
 */
ol3.StamenFlavor = {
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
 * @type {Object.<ol3.StamenProvider,
 *                {type: string, minZoom: number, maxZoom: number}>}
 */
ol3.StamenProviderConfig = {};
ol3.StamenProviderConfig[ol3.StamenProvider.TERRAIN] = {
  type: 'jpg',
  minZoom: 4,
  maxZoom: 18
};
ol3.StamenProviderConfig[ol3.StamenProvider.TONER] = {
  type: 'png',
  minZoom: 0,
  maxZoom: 20
};
ol3.StamenProviderConfig[ol3.StamenProvider.WATERCOLOR] = {
  type: 'jpg',
  minZoom: 3,
  maxZoom: 16
};



/**
 * @constructor
 * @extends {ol3.layer.XYZ}
 * @param {ol3.StamenProvider} provider Provider.
 * @param {ol3.StamenFlavor=} opt_flavor Flavor.
 * @param {Object.<string, *>=} opt_values Values.
 */
ol3.layer.Stamen = function(provider, opt_flavor, opt_values) {

  var config = ol3.StamenProviderConfig[provider];

  var layer = provider;
  if (goog.isDef(opt_flavor)) {
    layer += '-' + opt_flavor;
  }
  var tileUrlFunction = ol3.TileUrlFunction.createFromTemplate(
      'http://{a-d}.tile.stamen.com/' + layer + '/{z}/{x}/{y}.' + config.type);

  var attribution = new ol3.Attribution(
      'Map tiles by <a href="http://stamen.com">Stamen Design</a>, ' +
      'under ' +
      '<a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. ' +
      'Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, ' +
      'under ' +
      '<a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.');

  goog.base(this, config.maxZoom, tileUrlFunction, [attribution]);

};
goog.inherits(ol3.layer.Stamen, ol3.layer.XYZ);
