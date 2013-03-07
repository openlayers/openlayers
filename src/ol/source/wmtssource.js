goog.provide('ol.source.WMTS');
goog.provide('ol.source.WMTSRequestEncoding');

goog.require('ol.Attribution');
goog.require('ol.Extent');
goog.require('ol.Projection');
goog.require('ol.TileCoord');
goog.require('ol.TileUrlFunction');
goog.require('ol.TileUrlFunctionType');
goog.require('ol.projection');
goog.require('ol.source.ImageTileSource');
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
 * @extends {ol.source.ImageTileSource}
 * @param {ol.source.WMTSOptions} wmtsOptions WMTS options.
 */
ol.source.WMTS = function(wmtsOptions) {

  // TODO: add support for TileMatrixLimits

  var version = goog.isDef(wmtsOptions.version) ?
      wmtsOptions.version : '1.0.0';
  var format = goog.isDef(wmtsOptions.format) ?
      wmtsOptions.format : 'image/jpeg';
  var dimensions = wmtsOptions.dimensions || {};

  // FIXME: should we guess this requestEncoding from wmtsOptions.url(s)
  //        structure? that would mean KVP only if a template is not provided.
  var requestEncoding = goog.isDef(wmtsOptions.requestEncoding) ?
      wmtsOptions.requestEncoding : ol.source.WMTSRequestEncoding.KVP;

  // FIXME: should we create a default tileGrid?
  // we could issue a getCapabilities xhr to retrieve missing configuration
  var tileGrid = wmtsOptions.tileGrid;

  var context = {
    'Layer': wmtsOptions.layer,
    'style': wmtsOptions.style,
    'TileMatrixSet': wmtsOptions.matrixSet
  };
  goog.object.extend(context, dimensions);
  var kvpParams;
  if (requestEncoding == ol.source.WMTSRequestEncoding.KVP) {
    kvpParams = {
      'Service': 'WMTS',
      'Request': 'GetTile',
      'Version': version,
      'Format': format,
      'TileMatrix': '{TileMatrix}',
      'TileRow': '{TileRow}',
      'TileCol': '{TileCol}'
    };
    goog.object.extend(kvpParams, context);
  }

  // TODO: factorize the code below so that it is usable by all sources
  var urls = wmtsOptions.urls;
  if (!goog.isDef(urls)) {
    urls = [];
    var url = wmtsOptions.url;
    goog.asserts.assert(goog.isDef(url));
    var match = /\{(\d)-(\d)\}/.exec(url) || /\{([a-z])-([a-z])\}/.exec(url);
    if (match) {
      var startCharCode = match[1].charCodeAt(0);
      var stopCharCode = match[2].charCodeAt(0);
      var charCode;
      for (charCode = startCharCode; charCode <= stopCharCode; ++charCode) {
        urls.push(url.replace(match[0], String.fromCharCode(charCode)));
      }
    } else {
      urls.push(url);
    }
  }

  /**
   * @param {string} template Template.
   * @return {ol.TileUrlFunctionType} Tile URL function.
   */
  function createFromWMTSTemplate(template) {
    return function(tileCoord) {
      if (goog.isNull(tileCoord)) {
        return undefined;
      } else {
        var localContext = {
          'TileMatrix': tileGrid.getMatrixId(tileCoord.z),
          'TileCol': tileCoord.x,
          'TileRow': tileCoord.y
        };
        if (requestEncoding != ol.source.WMTSRequestEncoding.KVP) {
          goog.object.extend(localContext, context);
        }
        var url = template;
        for (var key in localContext) {
          // FIXME: should we filter properties with hasOwnProperty?
          url = url.replace('{' + key + '}', localContext[key])
              .replace('%7B' + key + '%7D', localContext[key]);
        }
        return url;
      }
    };
  }

  // TODO: update createFromTileUrlFunctions so that if
  // tileUrlFunctions.length == 1, it returns the only tileUrlFunction
  var tileUrlFunction = ol.TileUrlFunction.createFromTileUrlFunctions(
      goog.array.map(urls, function(url) {
        if (goog.isDef(kvpParams)) {
          // TODO: we may want to create our own appendParams function
          // so that params order conforms to wmts spec guidance,
          // and so that we can avoid to escape special template params
          url = goog.uri.utils.appendParamsFromMap(url, kvpParams);
        }
        return createFromWMTSTemplate(url);
      }));

  tileUrlFunction = ol.TileUrlFunction.withTileCoordTransform(
      function(tileCoord, tileGrid, projection) {
        if (tileGrid.getResolutions().length <= tileCoord.z) {
          return null;
        }
        var x = tileCoord.x;
        var y = -tileCoord.y - 1;
        var tileExtent = tileGrid.getTileCoordExtent(tileCoord);
        var projectionExtent = projection.getExtent();
        var extent = goog.isDef(wmtsOptions.extent) ?
            wmtsOptions.extent : projectionExtent;

        if (!goog.isNull(extent) && projection.isGlobal() &&
            extent.minX === projectionExtent.minX &&
            extent.maxX === projectionExtent.maxX) {
          var numCols = Math.ceil(
              (extent.maxX - extent.minX) /
              (tileExtent.maxX - tileExtent.minX));
          x = goog.math.modulo(x, numCols);
          tileExtent = tileGrid.getTileCoordExtent(
              new ol.TileCoord(tileCoord.z, x, tileCoord.y));
        }
        if (!tileExtent.intersects(extent)) {
          return null;
        }
        return new ol.TileCoord(tileCoord.z, x, y);
      },
      tileUrlFunction);

  goog.base(this, {
    attributions: wmtsOptions.attributions,
    crossOrigin: wmtsOptions.crossOrigin,
    extent: wmtsOptions.extent,
    projection: wmtsOptions.projection,
    tileGrid: tileGrid,
    tileUrlFunction: tileUrlFunction
  });

};
goog.inherits(ol.source.WMTS, ol.source.ImageTileSource);


/**
 * @param {Object} wmtsCap An object representing the capabilities document.
 * @param {string} layer The layer identifier that we want the grid for.
 * @param {string|null=} opt_crossOrigin Optional crossOrigin value.
 * @param {string=} opt_matrixSet Optional tileMatrixSet name. If not provided,
 *     it defaults to the first matrixSet found.
 * @param {ol.source.WMTSRequestEncoding=} opt_requestEncoding Optional
 *     requestEncoding. If not provided, it defaults to the first value found.
 * @param {string=} opt_format Optional format name. If not provided, it
 *     defaults to the first format found.
 * @param {string=} opt_style Optional style name. If not provided, it defaults
 *     to the first style found.
 * @param {Object=} opt_dimensions Optional object for setting dimensions
 *     values.
 * @param {ol.Extent=} opt_extent Optional extent.
 * @return {ol.source.WMTS} TileGrid instance.
 */
ol.source.WMTS.createFromCapabilities = function(wmtsCap, layer,
    opt_crossOrigin, opt_matrixSet, opt_requestEncoding, opt_format,
    opt_style, opt_dimensions, opt_extent) {

  // TODO: add support for TileMatrixLimits

  var layers = wmtsCap['contents']['layers'];
  var matrixSet = opt_matrixSet;
  var l = goog.array.find(layers, function(elt, index, array) {
    return elt['identifier'] == layer;
  });
  goog.asserts.assert(!goog.isNull(l));

  var format = goog.isDef(opt_format) ?
      opt_format : /** @type {string} */ (l['formats'][0]);
  var idx = goog.array.findIndex(l['styles'], function(elt, index, array) {
    if (goog.isDef(opt_style)) {
      return elt['identifier'] == opt_style;
    } else {
      return elt['isDefault'];
    }
  });
  if (idx < 0) {
    goog.asserts.assert(!goog.isDef(opt_style)); // opt_style was not correct
    idx = 0;
  }
  var style = /** @type {string} */ (l['styles'][idx]['identifier']);

  var dimensions = {};
  goog.array.forEach(l['dimensions'], function(elt, index, array) {
    var key = elt['identifier'];
    // With the special value 'default', the server should automatically
    // select the default value for this dimension.
    var value = (goog.isDef(opt_dimensions) &&
        opt_dimensions.hasOwnProperty(key)) ?
            opt_dimensions[key] : elt['default'];
    if (goog.isDef(value)) {
      goog.asserts.assert(goog.array.indexOf(elt['values'], value) >= 0);
    } else {
      value = elt['values'][0];
    }
    goog.asserts.assert(goog.isDef(value));
    dimensions[key] = value;
  });

  if (goog.isDef(matrixSet)) {
    goog.asserts.assert(0 < goog.array.findIndex(
        l['tileMatrixSetLinks'], function(elt, index, arr) {
          return elt['tileMatrixSet'] == matrixSet;
        }));
  } else {
    goog.asserts.assert(l['tileMatrixSetLinks'].length > 0);
    matrixSet = /** @type {string} */
        (l['tileMatrixSetLinks'][0]['tileMatrixSet']);
  }
  var matrixSets = wmtsCap['contents']['tileMatrixSets'];
  goog.asserts.assert(matrixSet in matrixSets);
  var matrixSetObj = matrixSets[matrixSet];

  var tileGrid = ol.tilegrid.WMTS.createFromCapabilitiesMatrixSet(
      matrixSetObj);

  var projection = ol.projection.get(matrixSetObj['supportedCRS']);

  var gets = wmtsCap['operationsMetadata']['GetTile']['dcp']['http']['get'];
  var encodings = goog.object.getKeys(
      gets[0]['constraints']['GetEncoding']['allowedValues']);
  goog.asserts.assert(encodings.length > 0);
  var requestEncoding = goog.isDef(opt_requestEncoding) ?
      opt_requestEncoding :  /** @type {ol.source.WMTSRequestEncoding} */
      (encodings[0]);
  // TODO: arcgis support, quote from ol2:
  // The OGC documentation is not clear if we should use REST or RESTful,
  // ArcGis use RESTful, and OpenLayers use REST.

  var urls;
  switch (requestEncoding) {
    case ol.source.WMTSRequestEncoding.REST:
      goog.asserts.assert(l['resourceUrls'].hasOwnProperty('tile'));
      goog.asserts.assert(l['resourceUrls']['tile'].hasOwnProperty(format));
      urls = /** @type {Array.<string>} */
          (l['resourceUrls']['tile'][format]);
      break;
    case ol.source.WMTSRequestEncoding.KVP:
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
      goog.asserts.assert(false);
  }

  return new ol.source.WMTS({
    urls: urls,
    layer: layer,
    matrixSet: matrixSet,
    format: format,
    projection: projection,
    requestEncoding: requestEncoding,
    tileGrid: tileGrid,
    style: style,
    crossOrigin: opt_crossOrigin,
    extent: opt_extent,
    dimensions: dimensions
  });
};
