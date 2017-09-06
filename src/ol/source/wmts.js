import _ol_ from '../index';
import _ol_TileUrlFunction_ from '../tileurlfunction';
import _ol_array_ from '../array';
import _ol_extent_ from '../extent';
import _ol_obj_ from '../obj';
import _ol_proj_ from '../proj';
import _ol_source_TileImage_ from '../source/tileimage';
import _ol_source_WMTSRequestEncoding_ from '../source/wmtsrequestencoding';
import _ol_tilegrid_WMTS_ from '../tilegrid/wmts';
import _ol_uri_ from '../uri';

/**
 * @classdesc
 * Layer source for tile data from WMTS servers.
 *
 * @constructor
 * @extends {ol.source.TileImage}
 * @param {olx.source.WMTSOptions} options WMTS options.
 * @api
 */
var _ol_source_WMTS_ = function(options) {

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
   * @type {!Object}
   */
  this.dimensions_ = options.dimensions !== undefined ? options.dimensions : {};

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
    urls = _ol_TileUrlFunction_.expandUrl(options.url);
  }

  // FIXME: should we guess this requestEncoding from options.url(s)
  //        structure? that would mean KVP only if a template is not provided.

  /**
   * @private
   * @type {ol.source.WMTSRequestEncoding}
   */
  this.requestEncoding_ = options.requestEncoding !== undefined ?
    /** @type {ol.source.WMTSRequestEncoding} */ (options.requestEncoding) :
    _ol_source_WMTSRequestEncoding_.KVP;

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

  if (requestEncoding == _ol_source_WMTSRequestEncoding_.KVP) {
    _ol_obj_.assign(context, {
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

    template = (requestEncoding == _ol_source_WMTSRequestEncoding_.KVP) ?
      _ol_uri_.appendParams(template, context) :
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
          _ol_obj_.assign(localContext, dimensions);
          var url = template;
          if (requestEncoding == _ol_source_WMTSRequestEncoding_.KVP) {
            url = _ol_uri_.appendParams(url, localContext);
          } else {
            url = url.replace(/\{(\w+?)\}/g, function(m, p) {
              return localContext[p];
            });
          }
          return url;
        }
      }
    );
  }

  var tileUrlFunction = (urls && urls.length > 0) ?
    _ol_TileUrlFunction_.createFromTileUrlFunctions(
        urls.map(createFromWMTSTemplate)) :
    _ol_TileUrlFunction_.nullTileUrlFunction;

  _ol_source_TileImage_.call(this, {
    attributions: options.attributions,
    cacheSize: options.cacheSize,
    crossOrigin: options.crossOrigin,
    logo: options.logo,
    projection: options.projection,
    reprojectionErrorThreshold: options.reprojectionErrorThreshold,
    tileClass: options.tileClass,
    tileGrid: tileGrid,
    tileLoadFunction: options.tileLoadFunction,
    tilePixelRatio: options.tilePixelRatio,
    tileUrlFunction: tileUrlFunction,
    urls: urls,
    wrapX: options.wrapX !== undefined ? options.wrapX : false
  });

  this.setKey(this.getKeyForDimensions_());

};

_ol_.inherits(_ol_source_WMTS_, _ol_source_TileImage_);


/**
 * Get the dimensions, i.e. those passed to the constructor through the
 * "dimensions" option, and possibly updated using the updateDimensions
 * method.
 * @return {!Object} Dimensions.
 * @api
 */
_ol_source_WMTS_.prototype.getDimensions = function() {
  return this.dimensions_;
};


/**
 * Return the image format of the WMTS source.
 * @return {string} Format.
 * @api
 */
_ol_source_WMTS_.prototype.getFormat = function() {
  return this.format_;
};


/**
 * Return the layer of the WMTS source.
 * @return {string} Layer.
 * @api
 */
_ol_source_WMTS_.prototype.getLayer = function() {
  return this.layer_;
};


/**
 * Return the matrix set of the WMTS source.
 * @return {string} MatrixSet.
 * @api
 */
_ol_source_WMTS_.prototype.getMatrixSet = function() {
  return this.matrixSet_;
};


/**
 * Return the request encoding, either "KVP" or "REST".
 * @return {ol.source.WMTSRequestEncoding} Request encoding.
 * @api
 */
_ol_source_WMTS_.prototype.getRequestEncoding = function() {
  return this.requestEncoding_;
};


/**
 * Return the style of the WMTS source.
 * @return {string} Style.
 * @api
 */
_ol_source_WMTS_.prototype.getStyle = function() {
  return this.style_;
};


/**
 * Return the version of the WMTS source.
 * @return {string} Version.
 * @api
 */
_ol_source_WMTS_.prototype.getVersion = function() {
  return this.version_;
};


/**
 * @private
 * @return {string} The key for the current dimensions.
 */
_ol_source_WMTS_.prototype.getKeyForDimensions_ = function() {
  var i = 0;
  var res = [];
  for (var key in this.dimensions_) {
    res[i++] = key + '-' + this.dimensions_[key];
  }
  return res.join('/');
};


/**
 * Update the dimensions.
 * @param {Object} dimensions Dimensions.
 * @api
 */
_ol_source_WMTS_.prototype.updateDimensions = function(dimensions) {
  _ol_obj_.assign(this.dimensions_, dimensions);
  this.setKey(this.getKeyForDimensions_());
};


/**
 * Generate source options from a capabilities object.
 * @param {Object} wmtsCap An object representing the capabilities document.
 * @param {Object} config Configuration properties for the layer.  Defaults for
 *                  the layer will apply if not provided.
 *
 * Required config properties:
 *  - layer - {string} The layer identifier.
 *
 * Optional config properties:
 *  - matrixSet - {string} The matrix set identifier, required if there is
 *       more than one matrix set in the layer capabilities.
 *  - projection - {string} The desired CRS when no matrixSet is specified.
 *       eg: "EPSG:3857". If the desired projection is not available,
 *       an error is thrown.
 *  - requestEncoding - {string} url encoding format for the layer. Default is
 *       the first tile url format found in the GetCapabilities response.
 *  - style - {string} The name of the style
 *  - format - {string} Image format for the layer. Default is the first
 *       format returned in the GetCapabilities response.
 *  - crossOrigin - {string|null|undefined} Cross origin. Default is `undefined`.
 * @return {?olx.source.WMTSOptions} WMTS source options object or `null` if the layer was not found.
 * @api
 */
_ol_source_WMTS_.optionsFromCapabilities = function(wmtsCap, config) {
  var layers = wmtsCap['Contents']['Layer'];
  var l = _ol_array_.find(layers, function(elt, index, array) {
    return elt['Identifier'] == config['layer'];
  });
  if (l === null) {
    return null;
  }
  var tileMatrixSets = wmtsCap['Contents']['TileMatrixSet'];
  var idx, matrixSet, matrixLimits;
  if (l['TileMatrixSetLink'].length > 1) {
    if ('projection' in config) {
      idx = _ol_array_.findIndex(l['TileMatrixSetLink'],
          function(elt, index, array) {
            var tileMatrixSet = _ol_array_.find(tileMatrixSets, function(el) {
              return el['Identifier'] == elt['TileMatrixSet'];
            });
            var supportedCRS = tileMatrixSet['SupportedCRS'].replace(/urn:ogc:def:crs:(\w+):(.*:)?(\w+)$/, '$1:$3');
            var proj1 = _ol_proj_.get(supportedCRS);
            var proj2 = _ol_proj_.get(config['projection']);
            if (proj1 && proj2) {
              return _ol_proj_.equivalent(proj1, proj2);
            } else {
              return supportedCRS == config['projection'];
            }
          });
    } else {
      idx = _ol_array_.findIndex(l['TileMatrixSetLink'],
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
  matrixLimits = /** @type {Array.<Object>} */
    (l['TileMatrixSetLink'][idx]['TileMatrixSetLimits']);

  var format = /** @type {string} */ (l['Format'][0]);
  if ('format' in config) {
    format = config['format'];
  }
  idx = _ol_array_.findIndex(l['Style'], function(elt, index, array) {
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
      if (value === undefined) {
        value = elt['Value'][0];
      }
      dimensions[key] = value;
    });
  }

  var matrixSets = wmtsCap['Contents']['TileMatrixSet'];
  var matrixSetObj = _ol_array_.find(matrixSets, function(elt, index, array) {
    return elt['Identifier'] == matrixSet;
  });

  var projection;
  if ('projection' in config) {
    projection = _ol_proj_.get(config['projection']);
  } else {
    projection = _ol_proj_.get(matrixSetObj['SupportedCRS'].replace(
        /urn:ogc:def:crs:(\w+):(.*:)?(\w+)$/, '$1:$3'));
  }

  var wgs84BoundingBox = l['WGS84BoundingBox'];
  var extent, wrapX;
  if (wgs84BoundingBox !== undefined) {
    var wgs84ProjectionExtent = _ol_proj_.get('EPSG:4326').getExtent();
    wrapX = (wgs84BoundingBox[0] == wgs84ProjectionExtent[0] &&
        wgs84BoundingBox[2] == wgs84ProjectionExtent[2]);
    extent = _ol_proj_.transformExtent(
        wgs84BoundingBox, 'EPSG:4326', projection);
    var projectionExtent = projection.getExtent();
    if (projectionExtent) {
      // If possible, do a sanity check on the extent - it should never be
      // bigger than the validity extent of the projection of a matrix set.
      if (!_ol_extent_.containsExtent(projectionExtent, extent)) {
        extent = undefined;
      }
    }
  }

  var tileGrid = _ol_tilegrid_WMTS_.createFromCapabilitiesMatrixSet(
      matrixSetObj, extent, matrixLimits);

  /** @type {!Array.<string>} */
  var urls = [];
  var requestEncoding = config['requestEncoding'];
  requestEncoding = requestEncoding !== undefined ? requestEncoding : '';

  if ('OperationsMetadata' in wmtsCap && 'GetTile' in wmtsCap['OperationsMetadata']) {
    var gets = wmtsCap['OperationsMetadata']['GetTile']['DCP']['HTTP']['Get'];

    for (var i = 0, ii = gets.length; i < ii; ++i) {
      var constraint = _ol_array_.find(gets[i]['Constraint'], function(element) {
        return element['name'] == 'GetEncoding';
      });
      var encodings = constraint['AllowedValues']['Value'];

      if (requestEncoding === '') {
        // requestEncoding not provided, use the first encoding from the list
        requestEncoding = encodings[0];
      }
      if (requestEncoding === _ol_source_WMTSRequestEncoding_.KVP) {
        if (_ol_array_.includes(encodings, _ol_source_WMTSRequestEncoding_.KVP)) {
          urls.push(/** @type {string} */ (gets[i]['href']));
        }
      } else {
        break;
      }
    }
  }
  if (urls.length === 0) {
    requestEncoding = _ol_source_WMTSRequestEncoding_.REST;
    l['ResourceURL'].forEach(function(element) {
      if (element['resourceType'] === 'tile') {
        format = element['format'];
        urls.push(/** @type {string} */ (element['template']));
      }
    });
  }

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
    wrapX: wrapX,
    crossOrigin: config['crossOrigin']
  };
};
export default _ol_source_WMTS_;
