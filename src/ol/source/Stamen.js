/**
 * @module ol/source/Stamen
 */
import {inherits} from '../index.js';
import _ol_source_OSM_ from '../source/OSM.js';
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
var _ol_source_Stamen_ = function(options) {
  var i = options.layer.indexOf('-');
  var provider = i == -1 ? options.layer : options.layer.slice(0, i);
  var providerConfig = _ol_source_Stamen_.ProviderConfig[provider];

  var layerConfig = _ol_source_Stamen_.LayerConfig[options.layer];

  var url = options.url !== undefined ? options.url :
    'https://stamen-tiles-{a-d}.a.ssl.fastly.net/' + options.layer +
      '/{z}/{x}/{y}.' + layerConfig.extension;

  XYZ.call(this, {
    attributions: _ol_source_Stamen_.ATTRIBUTIONS,
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

inherits(_ol_source_Stamen_, XYZ);


/**
 * @const
 * @type {Array.<string>}
 */
_ol_source_Stamen_.ATTRIBUTIONS = [
  'Map tiles by <a href="https://stamen.com/">Stamen Design</a>, ' +
        'under <a href="https://creativecommons.org/licenses/by/3.0/">CC BY' +
        ' 3.0</a>.',
  _ol_source_OSM_.ATTRIBUTION
];

/**
 * @type {Object.<string, {extension: string, opaque: boolean}>}
 */
_ol_source_Stamen_.LayerConfig = {
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
_ol_source_Stamen_.ProviderConfig = {
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
export default _ol_source_Stamen_;
