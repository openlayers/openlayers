goog.provide('ol.source.WMTS');
goog.provide('ol.source.WMTSRequestEncoding');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.math');
goog.require('goog.object');
goog.require('goog.uri.utils');
goog.require('ol.TileCoord');
goog.require('ol.TileUrlFunction');
goog.require('ol.TileUrlFunctionType');
goog.require('ol.extent');
goog.require('ol.proj');
goog.require('ol.source.TileImage');
goog.require('ol.tilegrid.WMTS');


/**
 * @enum {string}
 */
ol.source.WMTSRequestEncoding = {
  KVP: 'KVP',  // see spec §8
  REST: 'REST' // see spec §10
};



/**
 * @constructor
 * @extends {ol.source.TileImage}
 * @param {olx.source.WMTSOptions} options WMTS options.
 * @todo api
 */
ol.source.WMTS = function(options) {

  // TODO: add support for TileMatrixLimits

  var version = goog.isDef(options.version) ? options.version : '1.0.0';
  var format = goog.isDef(options.format) ? options.format : 'image/jpeg';

  /**
   * @private
   * @type {Object}
   */
  this.dimensions_ = goog.isDef(options.dimensions) ? options.dimensions : {};

  /**
   * @private
   * @type {string}
   */
  this.coordKeyPrefix_ = '';
  this.resetCoordKeyPrefix_();

  // FIXME: should we guess this requestEncoding from options.url(s)
  //        structure? that would mean KVP only if a template is not provided.
  var requestEncoding = goog.isDef(options.requestEncoding) ?
      options.requestEncoding : ol.source.WMTSRequestEncoding.KVP;

  // FIXME: should we create a default tileGrid?
  // we could issue a getCapabilities xhr to retrieve missing configuration
  var tileGrid = options.tileGrid;

  var context = {
    'Layer': options.layer,
    'style': options.style,
    'Style': options.style,
    'TileMatrixSet': options.matrixSet
  };

  if (requestEncoding == ol.source.WMTSRequestEncoding.KVP) {
    goog.object.extend(context, {
      'Service': 'WMTS',
      'Request': 'GetTile',
      'Version': version,
      'Format': format
    });
  }

  var dimensions = this.dimensions_;

  /**
   * @param {string} template Template.
   * @return {ol.TileUrlFunctionType} Tile URL function.
   */
  function createFromWMTSTemplate(template) {

    // TODO: we may want to create our own appendParams function so that params
    // order conforms to wmts spec guidance, and so that we can avoid to escape
    // special template params

    template = (requestEncoding == ol.source.WMTSRequestEncoding.KVP) ?
        goog.uri.utils.appendParamsFromMap(template, context) :
        template.replace(/\{(\w+?)\}/g, function(m, p) {
          return (p in context) ? context[p] : m;
        });

    return (
        /**
         * @param {ol.TileCoord} tileCoord Tile coordinate.
         * @param {number} pixelRatio Pixel ratio.
         * @param {ol.proj.Projection} projection Projection.
         * @return {string|undefined} Tile URL.
         */
        function(tileCoord, pixelRatio, projection) {
          if (goog.isNull(tileCoord)) {
            return undefined;
          } else {
            var localContext = {
              'TileMatrix': tileGrid.getMatrixId(tileCoord.z),
              'TileCol': tileCoord.x,
              'TileRow': tileCoord.y
            };
            goog.object.extend(localContext, dimensions);
            var url = template;
            if (requestEncoding == ol.source.WMTSRequestEncoding.KVP) {
              url = goog.uri.utils.appendParamsFromMap(url, localContext);
            } else {
              url = url.replace(/\{(\w+?)\}/g, function(m, p) {
                return localContext[p];
              });
            }
            return url;
          }
        });
  }

  var tileUrlFunction = ol.TileUrlFunction.nullTileUrlFunction;
  var urls = options.urls;
  if (!goog.isDef(urls) && goog.isDef(options.url)) {
    urls = ol.TileUrlFunction.expandUrl(options.url);
  }
  if (goog.isDef(urls)) {
    tileUrlFunction = ol.TileUrlFunction.createFromTileUrlFunctions(
        goog.array.map(urls, createFromWMTSTemplate));
  }

  var tmpExtent = ol.extent.createEmpty();
  var tmpTileCoord = new ol.TileCoord(0, 0, 0);
  tileUrlFunction = ol.TileUrlFunction.withTileCoordTransform(
      /**
       * @param {ol.TileCoord} tileCoord Tile coordinate.
       * @param {ol.proj.Projection} projection Projection.
       * @param {ol.TileCoord=} opt_tileCoord Tile coordinate.
       * @return {ol.TileCoord} Tile coordinate.
       */
      function(tileCoord, projection, opt_tileCoord) {
        goog.asserts.assert(!goog.isNull(tileGrid));
        if (tileGrid.getResolutions().length <= tileCoord.z) {
          return null;
        }
        var x = tileCoord.x;
        var y = -tileCoord.y - 1;
        var tileExtent = tileGrid.getTileCoordExtent(tileCoord);
        var projectionExtent = projection.getExtent();
        var extent = goog.isDef(options.extent) ?
            options.extent : projectionExtent;

        if (!goog.isNull(extent) && projection.isGlobal() &&
            extent[0] === projectionExtent[0] &&
            extent[2] === projectionExtent[2]) {
          var numCols = Math.ceil(
              ol.extent.getWidth(extent) /
              ol.extent.getWidth(tileExtent));
          x = goog.math.modulo(x, numCols);
          tmpTileCoord.z = tileCoord.z;
          tmpTileCoord.x = x;
          tmpTileCoord.y = tileCoord.y;
          tileExtent = tileGrid.getTileCoordExtent(tmpTileCoord, tmpExtent);
        }
        if (!ol.extent.intersects(tileExtent, extent) ||
            ol.extent.touches(tileExtent, extent)) {
          return null;
        }
        return new ol.TileCoord(tileCoord.z, x, y);
      },
      tileUrlFunction);

  goog.base(this, {
    attributions: options.attributions,
    crossOrigin: options.crossOrigin,
    extent: options.extent,
    logo: options.logo,
    projection: options.projection,
    tileGrid: tileGrid,
    tileLoadFunction: options.tileLoadFunction,
    tileUrlFunction: tileUrlFunction
  });

};
goog.inherits(ol.source.WMTS, ol.source.TileImage);


/**
 * Get the dimensions, i.e. those passed to the constructor through the
 * "dimensions" option, and possibly updated using the updateDimensions
 * method.
 * @return {Object} Dimensions.
 * @todo api
 */
ol.source.WMTS.prototype.getDimensions = function() {
  return this.dimensions_;
};


/**
 * @inheritDoc
 */
ol.source.WMTS.prototype.getKeyZXY = function(z, x, y) {
  return this.coordKeyPrefix_ + goog.base(this, 'getKeyZXY', z, x, y);
};


/**
 * @private
 */
ol.source.WMTS.prototype.resetCoordKeyPrefix_ = function() {
  var i = 0;
  var res = [];
  for (var key in this.dimensions_) {
    res[i++] = key + '-' + this.dimensions_[key];
  }
  this.coordKeyPrefix_ = res.join('/');
};


/**
 * Update the dimensions.
 * @param {Object} dimensions Dimensions.
 * @todo api
 */
ol.source.WMTS.prototype.updateDimensions = function(dimensions) {
  goog.object.extend(this.dimensions_, dimensions);
  this.resetCoordKeyPrefix_();
  this.dispatchChangeEvent();
};


/**
 * @param {Object} wmtsCap An object representing the capabilities document.
 * @param {string} layer The layer identifier.
 * @return {olx.source.WMTSOptions} WMTS source options object.
 * @todo api
 */
ol.source.WMTS.optionsFromCapabilities = function(wmtsCap, layer) {

  /* jshint -W069 */

  // TODO: add support for TileMatrixLimits

  var layers = wmtsCap['contents']['layers'];
  var l = goog.array.find(layers, function(elt, index, array) {
    return elt['identifier'] == layer;
  });
  goog.asserts.assert(!goog.isNull(l));
  goog.asserts.assert(l['tileMatrixSetLinks'].length > 0);
  var matrixSet = /** @type {string} */
      (l['tileMatrixSetLinks'][0]['tileMatrixSet']);
  var format = /** @type {string} */ (l['formats'][0]);
  var idx = goog.array.findIndex(l['styles'], function(elt, index, array) {
    return elt['isDefault'];
  });
  if (idx < 0) {
    idx = 0;
  }
  var style = /** @type {string} */ (l['styles'][idx]['identifier']);

  var dimensions = {};
  goog.array.forEach(l['dimensions'], function(elt, index, array) {
    var key = elt['identifier'];
    var value = elt['default'];
    if (goog.isDef(value)) {
      goog.asserts.assert(goog.array.contains(elt['values'], value));
    } else {
      value = elt['values'][0];
    }
    goog.asserts.assert(goog.isDef(value));
    dimensions[key] = value;
  });

  var matrixSets = wmtsCap['contents']['tileMatrixSets'];
  goog.asserts.assert(matrixSet in matrixSets);
  var matrixSetObj = matrixSets[matrixSet];

  var tileGrid = ol.tilegrid.WMTS.createFromCapabilitiesMatrixSet(
      matrixSetObj);

  var projection = ol.proj.get(matrixSetObj['supportedCRS']);

  var gets = wmtsCap['operationsMetadata']['GetTile']['dcp']['http']['get'];
  var encodings = goog.object.getKeys(
      gets[0]['constraints']['GetEncoding']['allowedValues']);
  goog.asserts.assert(encodings.length > 0);

  var urls;
  var requestEncoding;
  switch (encodings[0]) {
    case 'REST':
    case 'RESTful':
      // The OGC documentation is not clear if we should use REST or RESTful,
      // ArcGis use RESTful, and OpenLayers use REST.
      requestEncoding = ol.source.WMTSRequestEncoding.REST;
      goog.asserts.assert(l['resourceUrls'].hasOwnProperty('tile'));
      goog.asserts.assert(l['resourceUrls']['tile'].hasOwnProperty(format));
      urls = /** @type {Array.<string>} */
          (l['resourceUrls']['tile'][format]);
      break;
    case 'KVP':
      requestEncoding = ol.source.WMTSRequestEncoding.KVP;
      urls = [];
      goog.array.forEach(gets, function(elt, index, array) {
        if (elt['constraints']['GetEncoding']['allowedValues'].hasOwnProperty(
            ol.source.WMTSRequestEncoding.KVP)) {
          urls.push(/** @type {string} */ (elt['url']));
        }
      });
      goog.asserts.assert(urls.length > 0);
      break;
    default:
      goog.asserts.fail();
  }

  return {
    urls: urls,
    layer: layer,
    matrixSet: matrixSet,
    format: format,
    projection: projection,
    requestEncoding: requestEncoding,
    tileGrid: tileGrid,
    style: style,
    dimensions: dimensions
  };

  /* jshint +W069 */

};
