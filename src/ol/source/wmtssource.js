goog.provide('ol.source.WMTS');
goog.provide('ol.source.WMTSRequestEncoding');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');
goog.require('goog.uri.utils');
goog.require('ol.TileUrlFunction');
goog.require('ol.TileUrlFunctionType');
goog.require('ol.array');
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
  this.version_ = options.version !== undefined ? options.version : '1.0.0';

  /**
   * @private
   * @type {string}
   */
  this.format_ = options.format !== undefined ? options.format : 'image/jpeg';

  /**
   * @private
   * @type {Object}
   */
  this.dimensions_ = options.dimensions !== undefined ? options.dimensions : {};

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
   * @type {string}
   */
  this.matrixSet_ = options.matrixSet;

  /**
   * @private
   * @type {string}
   */
  this.style_ = options.style;

  var urls = options.urls;
  if (urls === undefined && options.url !== undefined) {
    urls = ol.TileUrlFunction.expandUrl(options.url);
  }

  /**
   * @private
   * @type {!Array.<string>}
   */
  this.urls_ = urls || [];

  // FIXME: should we guess this requestEncoding from options.url(s)
  //        structure? that would mean KVP only if a template is not provided.

  /**
   * @private
   * @type {ol.source.WMTSRequestEncoding}
   */
  this.requestEncoding_ = options.requestEncoding !== undefined ?
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
          if (!tileCoord) {
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
          this.urls_.map(createFromWMTSTemplate)) :
      ol.TileUrlFunction.nullTileUrlFunction;

  goog.base(this, {
    attributions: options.attributions,
    crossOrigin: options.crossOrigin,
    logo: options.logo,
    projection: options.projection,
    reprojectionErrorThreshold: options.reprojectionErrorThreshold,
    tileClass: options.tileClass,
    tileGrid: tileGrid,
    tileLoadFunction: options.tileLoadFunction,
    tilePixelRatio: options.tilePixelRatio,
    tileUrlFunction: tileUrlFunction,
    wrapX: options.wrapX !== undefined ? options.wrapX : false
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
 * Generate source options from a capabilities object.
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
 * @return {olx.source.WMTSOptions} WMTS source options object.
 * @api
 */
ol.source.WMTS.optionsFromCapabilities = function(wmtsCap, config) {

  // TODO: add support for TileMatrixLimits
  goog.asserts.assert(config['layer'],
      'config "layer" must not be null');

  var layers = wmtsCap['Contents']['Layer'];
  var l = goog.array.find(layers, function(elt, index, array) {
    return elt['Identifier'] == config['layer'];
  });
  goog.asserts.assert(l, 'found a matching layer in Contents/Layer');

  goog.asserts.assert(l['TileMatrixSetLink'].length > 0,
      'layer has TileMatrixSetLink');
  var tileMatrixSets = wmtsCap['Contents']['TileMatrixSet'];
  var idx, matrixSet;
  if (l['TileMatrixSetLink'].length > 1) {
    if ('projection' in config) {
      idx = goog.array.findIndex(l['TileMatrixSetLink'],
          function(elt, index, array) {
            var tileMatrixSet = goog.array.find(tileMatrixSets, function(el) {
              return el['Identifier'] == elt['TileMatrixSet'];
            });
            return tileMatrixSet['SupportedCRS'].replace(
                /urn:ogc:def:crs:(\w+):(.*:)?(\w+)$/, '$1:$3'
                   ) == config['projection'];
          });
    } else {
      idx = goog.array.findIndex(l['TileMatrixSetLink'],
          function(elt, index, array) {
            return elt['TileMatrixSet'] == config['matrixSet'];
          });
    }
  } else {
    idx = 0;
  }
  if (idx < 0) {
    idx = 0;
  }
  matrixSet = /** @type {string} */
      (l['TileMatrixSetLink'][idx]['TileMatrixSet']);

  goog.asserts.assert(matrixSet, 'TileMatrixSet must not be null');

  var format = /** @type {string} */ (l['Format'][0]);
  if ('format' in config) {
    format = config['format'];
  }
  idx = goog.array.findIndex(l['Style'], function(elt, index, array) {
    if ('style' in config) {
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
  if ('Dimension' in l) {
    l['Dimension'].forEach(function(elt, index, array) {
      var key = elt['Identifier'];
      var value = elt['Default'];
      if (value !== undefined) {
        goog.asserts.assert(ol.array.includes(elt['Value'], value),
            'default value contained in values');
      } else {
        value = elt['Value'][0];
      }
      goog.asserts.assert(value !== undefined, 'value could be found');
      dimensions[key] = value;
    });
  }

  var matrixSets = wmtsCap['Contents']['TileMatrixSet'];
  var matrixSetObj = goog.array.find(matrixSets, function(elt, index, array) {
    return elt['Identifier'] == matrixSet;
  });
  goog.asserts.assert(matrixSetObj,
      'found matrixSet in Contents/TileMatrixSet');

  var projection;
  if ('projection' in config) {
    projection = ol.proj.get(config['projection']);
  } else {
    projection = ol.proj.get(matrixSetObj['SupportedCRS'].replace(
        /urn:ogc:def:crs:(\w+):(.*:)?(\w+)$/, '$1:$3'));
  }

  var wgs84BoundingBox = l['WGS84BoundingBox'];
  var extent, wrapX;
  if (wgs84BoundingBox !== undefined) {
    var wgs84ProjectionExtent = ol.proj.get('EPSG:4326').getExtent();
    wrapX = (wgs84BoundingBox[0] == wgs84ProjectionExtent[0] &&
        wgs84BoundingBox[2] == wgs84ProjectionExtent[2]);
    extent = ol.proj.transformExtent(
        wgs84BoundingBox, 'EPSG:4326', projection);
    var projectionExtent = projection.getExtent();
    if (projectionExtent) {
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
  var requestEncoding = config['requestEncoding'];
  requestEncoding = requestEncoding !== undefined ? requestEncoding : '';

  goog.asserts.assert(
      ol.array.includes(['REST', 'RESTful', 'KVP', ''], requestEncoding),
      'requestEncoding (%s) is one of "REST", "RESTful", "KVP" or ""',
      requestEncoding);

  if (!wmtsCap.hasOwnProperty('OperationsMetadata') ||
      !wmtsCap['OperationsMetadata'].hasOwnProperty('GetTile') ||
      requestEncoding.indexOf('REST') === 0) {
    // Add REST tile resource url
    requestEncoding = ol.source.WMTSRequestEncoding.REST;
    l['ResourceURL'].forEach(function(elt, index, array) {
      if (elt['resourceType'] == 'tile') {
        format = elt['format'];
        urls.push(/** @type {string} */ (elt['template']));
      }
    });
  } else {
    var gets = wmtsCap['OperationsMetadata']['GetTile']['DCP']['HTTP']['Get'];

    for (var i = 0, ii = gets.length; i < ii; ++i) {
      var constraint = goog.array.find(gets[i]['Constraint'],
          function(elt, index, array) {
            return elt['name'] == 'GetEncoding';
          });
      var encodings = constraint['AllowedValues']['Value'];
      if (encodings.length > 0 && ol.array.includes(encodings, 'KVP')) {
        requestEncoding = ol.source.WMTSRequestEncoding.KVP;
        urls.push(/** @type {string} */ (gets[i]['href']));
      }
    }
  }
  goog.asserts.assert(urls.length > 0, 'At least one URL found');

  return {
    urls: urls,
    layer: config['layer'],
    matrixSet: matrixSet,
    format: format,
    projection: projection,
    requestEncoding: requestEncoding,
    tileGrid: tileGrid,
    style: style,
    dimensions: dimensions,
    wrapX: wrapX
  };

};
