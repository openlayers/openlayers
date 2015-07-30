goog.provide('ol.source.WMTS');
goog.provide('ol.source.WMTSRequestEncoding');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.math');
goog.require('goog.object');
goog.require('goog.string');
goog.require('goog.uri.utils');
goog.require('ol.TileUrlFunction');
goog.require('ol.TileUrlFunctionType');
goog.require('ol.extent');
goog.require('ol.proj');
goog.require('ol.source.TileImage');
goog.require('ol.tilegrid.WMTS');


/**
 * Request encoding. One of 'KVP', 'REST'.
 * @enum {string}
 * @api
 */
ol.source.WMTSRequestEncoding = {
  KVP: 'KVP',  // see spec §8
  REST: 'REST' // see spec §10
};



/**
 * @classdesc
 * Layer source for tile data from WMTS servers.
 *
 * @constructor
 * @extends {ol.source.TileImage}
 * @param {olx.source.WMTSOptions} options WMTS options.
 * @api stable
 */
ol.source.WMTS = function(options) {

  // TODO: add support for TileMatrixLimits

  /**
   * @private
   * @type {string}
   */
  this.version_ = goog.isDef(options.version) ? options.version : '1.0.0';

  /**
   * @private
   * @type {string}
   */
  this.format_ = goog.isDef(options.format) ? options.format : 'image/jpeg';

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

  /**
   * @private
   * @type {string}
   */
  this.layer_ = options.layer;

  /**
   * @private
   * @type {?number}
   */
  this.pixelRatio_ = goog.isDef(options.tilePixelRatio) ?
      options.tilePixelRatio : 1;


  /**
   * @private
   * @type {string}
   */
  this.matrixSet_ = options.matrixSet;

  /**
   * @private
   * @type {string}
   */
  this.style_ = options.style;

  var urls = options.urls;
  if (!goog.isDef(urls) && goog.isDef(options.url)) {
    urls = ol.TileUrlFunction.expandUrl(options.url);
  }

  /**
   * @private
   * @type {!Array.<string>}
   */
  this.urls_ = goog.isDefAndNotNull(urls) ? urls : [];

  var getFeatureInfoOptions = options.getFeatureInfoOptions;
  if (!goog.isDef(getFeatureInfoOptions)) {
    getFeatureInfoOptions = { 'url': this.urls_[0],
      'requestEncoding': ol.source.WMTSRequestEncoding.KVP,
      'infoFormat': undefined };
  }

  /**
   * @private
   * @type {olx.source.WMTSGetFeatureInfoOptions}
   */
  this.getFeatureInfoOptions_ = getFeatureInfoOptions;

  // FIXME: should we guess this requestEncoding from options.url(s)
  //        structure? that would mean KVP only if a template is not provided.

  /**
   * @private
   * @type {ol.source.WMTSRequestEncoding}
   */
  this.requestEncoding_ = goog.isDef(options.requestEncoding) ?
      /** @type {ol.source.WMTSRequestEncoding} */ (options.requestEncoding) :
      ol.source.WMTSRequestEncoding.KVP;

  var requestEncoding = this.requestEncoding_;

  // FIXME: should we create a default tileGrid?
  // we could issue a getCapabilities xhr to retrieve missing configuration
  var tileGrid = options.tileGrid;

  // context property names are lower case to allow for a case insensitive
  // replacement as some services use different naming conventions
  var context = {
    'layer': this.layer_,
    'style': this.style_,
    'tilematrixset': this.matrixSet_
  };

  if (requestEncoding == ol.source.WMTSRequestEncoding.KVP) {
    goog.object.extend(context, {
      'Service': 'WMTS',
      'Request': 'GetTile',
      'Version': this.version_,
      'Format': this.format_
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
          return (p.toLowerCase() in context) ? context[p.toLowerCase()] : m;
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
              'TileMatrix': tileGrid.getMatrixId(tileCoord[0]),
              'TileCol': tileCoord[1],
              'TileRow': -tileCoord[2] - 1
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

  var tileUrlFunction = this.urls_.length > 0 ?
      ol.TileUrlFunction.createFromTileUrlFunctions(
          goog.array.map(this.urls_, createFromWMTSTemplate)) :
      ol.TileUrlFunction.nullTileUrlFunction;

  goog.base(this, {
    attributions: options.attributions,
    crossOrigin: options.crossOrigin,
    logo: options.logo,
    projection: options.projection,
    tileClass: options.tileClass,
    tileGrid: tileGrid,
    tileLoadFunction: options.tileLoadFunction,
    tilePixelRatio: options.tilePixelRatio,
    tileUrlFunction: tileUrlFunction,
    wrapX: goog.isDef(options.wrapX) ? options.wrapX : false
  });

};
goog.inherits(ol.source.WMTS, ol.source.TileImage);


/**
 * Get the dimensions, i.e. those passed to the constructor through the
 * "dimensions" option, and possibly updated using the updateDimensions
 * method.
 * @return {Object} Dimensions.
 * @api
 */
ol.source.WMTS.prototype.getDimensions = function() {
  return this.dimensions_;
};


/**
 * Return the image format of the WMTS source.
 * @return {string} Format.
 * @api
 */
ol.source.WMTS.prototype.getFormat = function() {
  return this.format_;
};


/**
 * @inheritDoc
 */
ol.source.WMTS.prototype.getKeyZXY = function(z, x, y) {
  return this.coordKeyPrefix_ + goog.base(this, 'getKeyZXY', z, x, y);
};


/**
 * Return the layer of the WMTS source.
 * @return {string} Layer.
 * @api
 */
ol.source.WMTS.prototype.getLayer = function() {
  return this.layer_;
};


/**
 * Return the matrix set of the WMTS source.
 * @return {string} MatrixSet.
 * @api
 */
ol.source.WMTS.prototype.getMatrixSet = function() {
  return this.matrixSet_;
};


/**
 * Return the request encoding, either "KVP" or "REST".
 * @return {ol.source.WMTSRequestEncoding} Request encoding.
 * @api
 */
ol.source.WMTS.prototype.getRequestEncoding = function() {
  return this.requestEncoding_;
};


/**
 * Return the style of the WMTS source.
 * @return {string} Style.
 * @api
 */
ol.source.WMTS.prototype.getStyle = function() {
  return this.style_;
};


/**
 * Return the URLs used for this WMTS source.
 * @return {!Array.<string>} URLs.
 * @api
 */
ol.source.WMTS.prototype.getUrls = function() {
  return this.urls_;
};


/**
 * Return the version of the WMTS source.
 * @return {string} Version.
 * @api
 */
ol.source.WMTS.prototype.getVersion = function() {
  return this.version_;
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
 * @api
 */
ol.source.WMTS.prototype.updateDimensions = function(dimensions) {
  goog.object.extend(this.dimensions_, dimensions);
  this.resetCoordKeyPrefix_();
  this.changed();
};


/**
 * @param {Object} wmtsCap An object representing the capabilities document.
 * @param {Object} config Configuration properties for the layer.  Defaults for
 *                  the layer will apply if not provided.
 *
 * Required config properties:
 * layer - {String} The layer identifier.
 *
 * Optional config properties:
 * matrixSet - {String} The matrix set identifier, required if there is
 *      more than one matrix set in the layer capabilities.
 * projection - {String} The desired CRS when no matrixSet is specified.
 *     eg: "EPSG:3857". If the desired projection is not available,
 *     an error is thrown.
 * requestEncoding - {String} url encoding format for the layer. Default is the
 *     first tile url format found in the GetCapabilities response.
 * style - {String} The name of the style
 * format - {String} Image format for the layer. Default is the first
 *     format returned in the GetCapabilities response.
 * featureInfoRequestEncoding - {String} url encoding format for the
 *     getFeatureInfo requests. Default is the first tile url format
 *     found in the GetCapabilities response.
 * @return {olx.source.WMTSOptions} WMTS source options object.
 * @api
 */
ol.source.WMTS.optionsFromCapabilities = function(wmtsCap, config) {

  /* jshint -W069 */

  // TODO: add support for TileMatrixLimits
  goog.asserts.assert(!goog.isNull(config['layer']),
      'config "layer" must not be null');

  var layers = wmtsCap['Contents']['Layer'];
  var l = goog.array.find(layers, function(elt, index, array) {
    return elt['Identifier'] == config['layer'];
  });
  goog.asserts.assert(!goog.isNull(l),
      'found a matching layer in Contents/Layer');

  goog.asserts.assert(l['TileMatrixSetLink'].length > 0,
      'layer has TileMatrixSetLink');
  var idx, matrixSet;
  if (l['TileMatrixSetLink'].length > 1) {
    idx = goog.array.findIndex(l['TileMatrixSetLink'],
        function(elt, index, array) {
          return elt['TileMatrixSet'] == config['matrixSet'];
        });
  } else if (goog.isDef(config['projection'])) {
    idx = goog.array.findIndex(l['TileMatrixSetLink'],
        function(elt, index, array) {
          return elt['TileMatrixSet']['SupportedCRS'].replace(
              /urn:ogc:def:crs:(\w+):(.*:)?(\w+)$/, '$1:$3'
                 ) == config['projection'];
        });
  } else {
    idx = 0;
  }
  if (idx < 0) {
    idx = 0;
  }
  matrixSet = /** @type {string} */
      (l['TileMatrixSetLink'][idx]['TileMatrixSet']);

  goog.asserts.assert(!goog.isNull(matrixSet),
      'TileMatrixSet must not be null');

  var format = /** @type {string} */ (l['Format'][0]);
  if (goog.isDef(config['format'])) {
    format = config['format'];
  }
  idx = goog.array.findIndex(l['Style'], function(elt, index, array) {
    if (goog.isDef(config['style'])) {
      return elt['Title'] == config['style'];
    } else {
      return elt['isDefault'];
    }
  });
  if (idx < 0) {
    idx = 0;
  }
  var style = /** @type {string} */ (l['Style'][idx]['Identifier']);

  var dimensions = {};
  if (goog.isDef(l['Dimension'])) {
    goog.array.forEach(l['Dimension'], function(elt, index, array) {
      var key = elt['Identifier'];
      var value = elt['default'];
      if (goog.isDef(value)) {
        goog.asserts.assert(goog.array.contains(elt['values'], value),
            'default value contained in values');
      } else {
        value = elt['values'][0];
      }
      goog.asserts.assert(goog.isDef(value), 'value could be found');
      dimensions[key] = value;
    });
  }

  var matrixSets = wmtsCap['Contents']['TileMatrixSet'];
  var matrixSetObj = goog.array.find(matrixSets, function(elt, index, array) {
    return elt['Identifier'] == matrixSet;
  });
  goog.asserts.assert(!goog.isNull(matrixSetObj),
      'found matrixSet in Contents/TileMatrixSet');

  var projection;
  if (goog.isDef(config['projection'])) {
    projection = ol.proj.get(config['projection']);
  } else {
    projection = ol.proj.get(matrixSetObj['SupportedCRS'].replace(
        /urn:ogc:def:crs:(\w+):(.*:)?(\w+)$/, '$1:$3'));
  }

  var wgs84BoundingBox = l['WGS84BoundingBox'];
  var extent, wrapX;
  if (goog.isDef(wgs84BoundingBox)) {
    var wgs84ProjectionExtent = ol.proj.get('EPSG:4326').getExtent();
    wrapX = (wgs84BoundingBox[0] == wgs84ProjectionExtent[0] &&
        wgs84BoundingBox[2] == wgs84ProjectionExtent[2]);
    extent = ol.proj.transformExtent(
        wgs84BoundingBox, 'EPSG:4326', projection);
    var projectionExtent = projection.getExtent();
    if (!goog.isNull(projectionExtent)) {
      // If possible, do a sanity check on the extent - it should never be
      // bigger than the validity extent of the projection of a matrix set.
      if (!ol.extent.containsExtent(projectionExtent, extent)) {
        extent = undefined;
      }
    }
  }

  var tileGrid = ol.tilegrid.WMTS.createFromCapabilitiesMatrixSet(
      matrixSetObj, extent);

  /** @type {!Array.<string>} */
  var urls = [];
  var encodings, gets, constraint;
  var requestEncoding = config['requestEncoding'];
  requestEncoding = goog.isDef(requestEncoding) ? requestEncoding : '';

  goog.asserts.assert(
      goog.array.contains(['REST', 'RESTful', 'KVP', ''], requestEncoding),
      'requestEncoding (%s) is one of "REST", "RESTful", "KVP" or ""',
      requestEncoding);

  if (!wmtsCap.hasOwnProperty('OperationsMetadata') ||
      !wmtsCap['OperationsMetadata'].hasOwnProperty('GetTile') ||
      goog.string.startsWith(requestEncoding, 'REST')) {
    // Add REST tile resource url
    requestEncoding = ol.source.WMTSRequestEncoding.REST;
    goog.array.forEach(l['ResourceURL'], function(elt, index, array) {
      if (elt['resourceType'] == 'tile') {
        format = elt['format'];
        urls.push(/** @type {string} */ (elt['template']));
      }
    });
  } else {
    gets = wmtsCap['OperationsMetadata']['GetTile']['DCP']['HTTP']['Get'];

    for (var i = 0, ii = gets.length; i < ii; ++i) {
      constraint = goog.array.find(gets[i]['Constraint'],
          function(elt, index, array) {
            return elt['name'] == 'GetEncoding';
          });
      encodings = constraint['AllowedValues']['Value'];
      if (encodings.length > 0 && goog.array.contains(encodings, 'KVP')) {
        requestEncoding = ol.source.WMTSRequestEncoding.KVP;
        urls.push(/** @type {string} */ (gets[i]['href']));
      }
    }
  }
  goog.asserts.assert(urls.length > 0, 'At least one URL found');

  var getFeatureInfoOptions =
      /** @type {olx.source.WMTSGetFeatureInfoOptions} */ ({});

  if (wmtsCap['OperationsMetadata'].hasOwnProperty('GetFeatureInfo') &&
          (config['featureInfoRequestEncoding'] !=
          ol.source.WMTSRequestEncoding.REST)) {
    getFeatureInfoOptions.requestEncoding =
        ol.source.WMTSRequestEncoding.KVP;
    gets =
        wmtsCap['OperationsMetadata']['GetFeatureInfo']['DCP']['HTTP']['Get'];
    for (var j = 0, jj = gets.length; j < jj; ++j) {
      constraint = goog.array.find(gets[j]['Constraint'],
          function(elt, index, array) {
            return elt['name'] == 'GetEncoding';
          });
      encodings = constraint['AllowedValues']['Value'];
      if (encodings.length > 0 && goog.array.contains(encodings, 'KVP')) {
        getFeatureInfoOptions.url = /** @type {string} */ (gets[j]['href']);
      }
    }
  } else {
    // Look for REST url
    getFeatureInfoOptions.requestEncoding =
        ol.source.WMTSRequestEncoding.REST;
    goog.array.forEach(l['ResourceURL'], function(elt, index, array) {
      if (elt['resourceType'] == 'FeatureInfo') {
        getFeatureInfoOptions.infoFormat =
            /** @type {string} */ (elt['format']);
        getFeatureInfoOptions.url = /** @type {string} */ (elt['template']);
      }
    });
  }

  return {
    urls: urls,
    layer: config['layer'],
    matrixSet: matrixSet,
    format: format,
    projection: projection,
    getFeatureInfoOptions: getFeatureInfoOptions,
    requestEncoding: requestEncoding,
    tileGrid: tileGrid,
    style: style,
    dimensions: dimensions,
    wrapX: wrapX
  };

  /* jshint +W069 */

};


/**
 * Return the GetFeatureInfo URL for the passed coordinate, resolution, and
 * projection. Return `undefined` if the GetFeatureInfo URL cannot be
 * constructed.
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {number} resolution Resolution.
 * @param {ol.proj.Projection} projection Projection.
 * @param {string=} opt_infoformat Optional GetFeatureInfo request
 *     output format. Must be specified if not specified in
 *     WMTS source getFeatureInfoOptions.
 * @return {string|undefined} GetFeatureInfo URL.
 * @api
 */
ol.source.WMTS.prototype.getGetFeatureInfoUrl =
    function(coordinate, resolution, projection, opt_infoformat) {

  goog.asserts.assert(goog.isDef(opt_infoformat) ||
      goog.isDef(this.getFeatureInfoOptions_.infoFormat),
      'INFOFORMAT specified in either the function params or in the WMTS ' +
      'source getFeatureInfoOptions');

  var pixelRatio = this.pixelRatio_;
  if (isNaN(pixelRatio)) {
    return undefined;
  }


  var tileGrid = /** @type {ol.tilegrid.WMTS} */ (this.tileGrid);


  var tileCoord = tileGrid.getTileCoordForCoordAndResolution(
      coordinate, resolution);

  var tmpExtent = ol.extent.createEmpty();
  var tmpTileCoord = [0, 0, 0];
  // TODO: this code is duplicated from createFromWMTSTemplate function
  var getTransformedTileCoord = function(tileCoord, tileGrid, projection) {
    goog.asserts.assert(!goog.isNull(tileGrid), 'tileGrid must not be null');
    if (tileGrid.getResolutions().length <= tileCoord[0]) {
      return null;
    }
    var x = tileCoord[1];
    var y = -tileCoord[2] - 1;
    var tileExtent = tileGrid.getTileCoordExtent(tileCoord, tmpExtent);
    var extent = projection.getExtent();

    if (!goog.isNull(extent) && projection.isGlobal()) {
      var numCols = Math.ceil(
          ol.extent.getWidth(extent) /
          ol.extent.getWidth(tileExtent));
      x = goog.math.modulo(x, numCols);
      tmpTileCoord[0] = tileCoord[0];
      tmpTileCoord[1] = x;
      tmpTileCoord[2] = tileCoord[2];
      tileExtent = tileGrid.getTileCoordExtent(tmpTileCoord, tmpExtent);
    }
    if (!ol.extent.intersects(tileExtent, extent) ||
        ol.extent.touches(tileExtent, extent)) {
      return null;
    }
    return ol.tilecoord.createOrUpdate(tileCoord[0], x, y);
  };

  var tileExtent = tileGrid.getTileCoordExtent(tileCoord);
  var transformedTileCoord = getTransformedTileCoord(tileCoord,
      tileGrid, projection);

  if (tileGrid.getResolutions().length <= tileCoord[0]) {
    return undefined;
  }

  var tileResolution = tileGrid.getResolution(tileCoord[0]);
  var tileMatrix = tileGrid.getMatrixIds()[tileCoord[0]];

  var baseParams = {
    'SERVICE': 'WMTS',
    'VERSION': '1.0.0',
    'REQUEST': 'GetFeatureInfo',
    'LAYER': this.layer_,
    'STYLE': this.style_,
    'FORMAT': this.format_,
    'TileCol': transformedTileCoord[1],
    'TileRow': transformedTileCoord[2],
    'TileMatrix': tileMatrix,
    'TileMatrixSet': this.matrixSet_
  };

  goog.object.extend(baseParams, this.dimensions_);
  if (goog.isDef(this.getFeatureInfoOptions_.infoFormat)) {
    baseParams['INFOFORMAT'] = this.getFeatureInfoOptions_.infoFormat;
  } else {
    baseParams['INFOFORMAT'] = opt_infoformat;
  }

  var x = Math.floor((coordinate[0] - tileExtent[0]) /
      (tileResolution / pixelRatio));
  var y = Math.floor((tileExtent[3] - coordinate[1]) /
      (tileResolution / pixelRatio));

  baseParams['I'] = x;
  baseParams['J'] = y;

  var url = (goog.isDef(this.getFeatureInfoOptions_.url)) ?
      this.getFeatureInfoOptions_.url : this.urls_[0];
  var featureInfoUrl;

  if (goog.isDef(this.getFeatureInfoOptions_.requestEncoding) &&
      this.getFeatureInfoOptions_.requestEncoding ==
      ol.source.WMTSRequestEncoding.REST) {
    featureInfoUrl = url.replace(/\{(\w+?)\}/g, function(m, p) {
      var val;
      val = (p.toUpperCase() in baseParams) ? baseParams[p.toUpperCase()] : m;
      return (p in baseParams) ? baseParams[p] : val;
    });
  } else {
    featureInfoUrl = goog.uri.utils.appendParamsFromMap(url, baseParams);
  }

  return featureInfoUrl;
};
