/**
 * @module ol/source/Stamen
 */
import {inherits} from '../index.js';
import OSM from '../source/OSM.js';
import XYZ from '../source/XYZ.js';

/**
 * @classdesc
 * Layer source for the Stamen tile server.
 *
 * @constructor
 * @extends {ol.source.XYZ}
 * @param {olx.source.StamenOptions} options Stamen options.
 * @api
 */
const Stamen = function(options) {
  const i = options.layer.indexOf('-');
  const provider = i == -1 ? options.layer : options.layer.slice(0, i);
  const providerConfig = Stamen.ProviderConfig[provider];

  const layerConfig = Stamen.LayerConfig[options.layer];

  const url = options.url !== undefined ? options.url :
    'https://stamen-tiles-{a-d}.a.ssl.fastly.net/' + options.layer +
      '/{z}/{x}/{y}.' + layerConfig.extension;

  XYZ.call(this, {
    attributions: Stamen.ATTRIBUTIONS,
    cacheSize: options.cacheSize,
    crossOrigin: 'anonymous',
    maxZoom: options.maxZoom != undefined ? options.maxZoom : providerConfig.maxZoom,
    minZoom: options.minZoom != undefined ? options.minZoom : providerConfig.minZoom,
    opaque: layerConfig.opaque,
    reprojectionErrorThreshold: options.reprojectionErrorThreshold,
    tileLoadFunction: options.tileLoadFunction,
    url: url,
    wrapX: options.wrapX
  });
};

inherits(Stamen, XYZ);


/**
 * @const
 * @type {Array.<string>}
 */
Stamen.ATTRIBUTIONS = [
  'Map tiles by <a href="https://stamen.com/">Stamen Design</a>, ' +
        'under <a href="https://creativecommons.org/licenses/by/3.0/">CC BY' +
        ' 3.0</a>.',
  OSM.ATTRIBUTION
];

/**
 * @type {Object.<string, {extension: string, opaque: boolean}>}
 */
Stamen.LayerConfig = {
  'terrain': {
    extension: 'jpg',
    opaque: true
  },
  'terrain-background': {
    extension: 'jpg',
    opaque: true
  },
  'terrain-labels': {
    extension: 'png',
    opaque: false
  },
  'terrain-lines': {
    extension: 'png',
    opaque: false
  },
  'toner-background': {
    extension: 'png',
    opaque: true
  },
  'toner': {
    extension: 'png',
    opaque: true
  },
  'toner-hybrid': {
    extension: 'png',
    opaque: false
  },
  'toner-labels': {
    extension: 'png',
    opaque: false
  },
  'toner-lines': {
    extension: 'png',
    opaque: false
  },
  'toner-lite': {
    extension: 'png',
    opaque: true
  },
  'watercolor': {
    extension: 'jpg',
    opaque: true
  }
};

/**
 * @type {Object.<string, {minZoom: number, maxZoom: number}>}
 */
Stamen.ProviderConfig = {
  'terrain': {
    minZoom: 4,
    maxZoom: 18
  },
  'toner': {
    minZoom: 0,
    maxZoom: 20
  },
  'watercolor': {
    minZoom: 1,
    maxZoom: 16
  }
};
export default Stamen;
