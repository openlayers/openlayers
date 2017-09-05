import _ol_ from '../index';
import _ol_Attribution_ from '../attribution';
import _ol_Tile_ from '../tile';
import _ol_TileState_ from '../tilestate';
import _ol_TileUrlFunction_ from '../tileurlfunction';
import _ol_asserts_ from '../asserts';
import _ol_events_ from '../events';
import _ol_events_EventType_ from '../events/eventtype';
import _ol_extent_ from '../extent';
import _ol_net_ from '../net';
import _ol_proj_ from '../proj';
import _ol_source_State_ from '../source/state';
import _ol_source_Tile_ from '../source/tile';
import _ol_tilegrid_ from '../tilegrid';

/**
 * @classdesc
 * Layer source for UTFGrid interaction data loaded from TileJSON format.
 *
 * @constructor
 * @extends {ol.source.Tile}
 * @param {olx.source.TileUTFGridOptions} options Source options.
 * @api
 */
var _ol_source_TileUTFGrid_ = function(options) {
  _ol_source_Tile_.call(this, {
    projection: _ol_proj_.get('EPSG:3857'),
    state: _ol_source_State_.LOADING
  });

  /**
   * @private
   * @type {boolean}
   */
  this.preemptive_ = options.preemptive !== undefined ?
    options.preemptive : true;

  /**
   * @private
   * @type {!ol.TileUrlFunctionType}
   */
  this.tileUrlFunction_ = _ol_TileUrlFunction_.nullTileUrlFunction;

  /**
   * @private
   * @type {string|undefined}
   */
  this.template_ = undefined;

  /**
   * @private
   * @type {boolean}
   */
  this.jsonp_ = options.jsonp || false;

  if (options.url) {
    if (this.jsonp_) {
      _ol_net_.jsonp(options.url, this.handleTileJSONResponse.bind(this),
          this.handleTileJSONError.bind(this));
    } else {
      var client = new XMLHttpRequest();
      client.addEventListener('load', this.onXHRLoad_.bind(this));
      client.addEventListener('error', this.onXHRError_.bind(this));
      client.open('GET', options.url);
      client.send();
    }
  } else if (options.tileJSON) {
    this.handleTileJSONResponse(options.tileJSON);
  } else {
    _ol_asserts_.assert(false, 51); // Either `url` or `tileJSON` options must be provided
  }
};

_ol_.inherits(_ol_source_TileUTFGrid_, _ol_source_Tile_);


/**
 * @private
 * @param {Event} event The load event.
 */
_ol_source_TileUTFGrid_.prototype.onXHRLoad_ = function(event) {
  var client = /** @type {XMLHttpRequest} */ (event.target);
  // status will be 0 for file:// urls
  if (!client.status || client.status >= 200 && client.status < 300) {
    var response;
    try {
      response = /** @type {TileJSON} */(JSON.parse(client.responseText));
    } catch (err) {
      this.handleTileJSONError();
      return;
    }
    this.handleTileJSONResponse(response);
  } else {
    this.handleTileJSONError();
  }
};


/**
 * @private
 * @param {Event} event The error event.
 */
_ol_source_TileUTFGrid_.prototype.onXHRError_ = function(event) {
  this.handleTileJSONError();
};


/**
 * Return the template from TileJSON.
 * @return {string|undefined} The template from TileJSON.
 * @api
 */
_ol_source_TileUTFGrid_.prototype.getTemplate = function() {
  return this.template_;
};


/**
 * Calls the callback (synchronously by default) with the available data
 * for given coordinate and resolution (or `null` if not yet loaded or
 * in case of an error).
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {number} resolution Resolution.
 * @param {function(this: T, *)} callback Callback.
 * @param {T=} opt_this The object to use as `this` in the callback.
 * @param {boolean=} opt_request If `true` the callback is always async.
 *                               The tile data is requested if not yet loaded.
 * @template T
 * @api
 */
_ol_source_TileUTFGrid_.prototype.forDataAtCoordinateAndResolution = function(
    coordinate, resolution, callback, opt_this, opt_request) {
  if (this.tileGrid) {
    var tileCoord = this.tileGrid.getTileCoordForCoordAndResolution(
        coordinate, resolution);
    var tile = /** @type {!ol.source.TileUTFGrid.Tile_} */(this.getTile(
        tileCoord[0], tileCoord[1], tileCoord[2], 1, this.getProjection()));
    tile.forDataAtCoordinate(coordinate, callback, opt_this, opt_request);
  } else {
    if (opt_request === true) {
      setTimeout(function() {
        callback.call(opt_this, null);
      }, 0);
    } else {
      callback.call(opt_this, null);
    }
  }
};


/**
 * @protected
 */
_ol_source_TileUTFGrid_.prototype.handleTileJSONError = function() {
  this.setState(_ol_source_State_.ERROR);
};


/**
 * TODO: very similar to ol.source.TileJSON#handleTileJSONResponse
 * @protected
 * @param {TileJSON} tileJSON Tile JSON.
 */
_ol_source_TileUTFGrid_.prototype.handleTileJSONResponse = function(tileJSON) {

  var epsg4326Projection = _ol_proj_.get('EPSG:4326');

  var sourceProjection = this.getProjection();
  var extent;
  if (tileJSON.bounds !== undefined) {
    var transform = _ol_proj_.getTransformFromProjections(
        epsg4326Projection, sourceProjection);
    extent = _ol_extent_.applyTransform(tileJSON.bounds, transform);
  }

  var minZoom = tileJSON.minzoom || 0;
  var maxZoom = tileJSON.maxzoom || 22;
  var tileGrid = _ol_tilegrid_.createXYZ({
    extent: _ol_tilegrid_.extentFromProjection(sourceProjection),
    maxZoom: maxZoom,
    minZoom: minZoom
  });
  this.tileGrid = tileGrid;

  this.template_ = tileJSON.template;

  var grids = tileJSON.grids;
  if (!grids) {
    this.setState(_ol_source_State_.ERROR);
    return;
  }

  this.tileUrlFunction_ =
      _ol_TileUrlFunction_.createFromTemplates(grids, tileGrid);

  if (tileJSON.attribution !== undefined) {
    var attributionExtent = extent !== undefined ?
      extent : epsg4326Projection.getExtent();
    /** @type {Object.<string, Array.<ol.TileRange>>} */
    var tileRanges = {};
    var z, zKey;
    for (z = minZoom; z <= maxZoom; ++z) {
      zKey = z.toString();
      tileRanges[zKey] =
          [tileGrid.getTileRangeForExtentAndZ(attributionExtent, z)];
    }
    this.setAttributions([
      new _ol_Attribution_({
        html: tileJSON.attribution,
        tileRanges: tileRanges
      })
    ]);
  }

  this.setState(_ol_source_State_.READY);

};


/**
 * @inheritDoc
 */
_ol_source_TileUTFGrid_.prototype.getTile = function(z, x, y, pixelRatio, projection) {
  var tileCoordKey = this.getKeyZXY(z, x, y);
  if (this.tileCache.containsKey(tileCoordKey)) {
    return /** @type {!ol.Tile} */ (this.tileCache.get(tileCoordKey));
  } else {
    var tileCoord = [z, x, y];
    var urlTileCoord =
        this.getTileCoordForTileUrlFunction(tileCoord, projection);
    var tileUrl = this.tileUrlFunction_(urlTileCoord, pixelRatio, projection);
    var tile = new _ol_source_TileUTFGrid_.Tile_(
        tileCoord,
        tileUrl !== undefined ? _ol_TileState_.IDLE : _ol_TileState_.EMPTY,
        tileUrl !== undefined ? tileUrl : '',
        this.tileGrid.getTileCoordExtent(tileCoord),
        this.preemptive_,
        this.jsonp_);
    this.tileCache.set(tileCoordKey, tile);
    return tile;
  }
};


/**
 * @inheritDoc
 */
_ol_source_TileUTFGrid_.prototype.useTile = function(z, x, y) {
  var tileCoordKey = this.getKeyZXY(z, x, y);
  if (this.tileCache.containsKey(tileCoordKey)) {
    this.tileCache.get(tileCoordKey);
  }
};


/**
 * @constructor
 * @extends {ol.Tile}
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.TileState} state State.
 * @param {string} src Image source URI.
 * @param {ol.Extent} extent Extent of the tile.
 * @param {boolean} preemptive Load the tile when visible (before it's needed).
 * @param {boolean} jsonp Load the tile as a script.
 * @private
 */
_ol_source_TileUTFGrid_.Tile_ = function(tileCoord, state, src, extent, preemptive, jsonp) {

  _ol_Tile_.call(this, tileCoord, state);

  /**
   * @private
   * @type {string}
   */
  this.src_ = src;

  /**
   * @private
   * @type {ol.Extent}
   */
  this.extent_ = extent;

  /**
   * @private
   * @type {boolean}
   */
  this.preemptive_ = preemptive;

  /**
   * @private
   * @type {Array.<string>}
   */
  this.grid_ = null;

  /**
   * @private
   * @type {Array.<string>}
   */
  this.keys_ = null;

  /**
   * @private
   * @type {Object.<string, Object>|undefined}
   */
  this.data_ = null;


  /**
   * @private
   * @type {boolean}
   */
  this.jsonp_ = jsonp;

};
_ol_.inherits(_ol_source_TileUTFGrid_.Tile_, _ol_Tile_);


/**
 * Get the image element for this tile.
 * @return {Image} Image.
 */
_ol_source_TileUTFGrid_.Tile_.prototype.getImage = function() {
  return null;
};


/**
 * Synchronously returns data at given coordinate (if available).
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {*} The data.
 */
_ol_source_TileUTFGrid_.Tile_.prototype.getData = function(coordinate) {
  if (!this.grid_ || !this.keys_) {
    return null;
  }
  var xRelative = (coordinate[0] - this.extent_[0]) /
      (this.extent_[2] - this.extent_[0]);
  var yRelative = (coordinate[1] - this.extent_[1]) /
      (this.extent_[3] - this.extent_[1]);

  var row = this.grid_[Math.floor((1 - yRelative) * this.grid_.length)];

  if (typeof row !== 'string') {
    return null;
  }

  var code = row.charCodeAt(Math.floor(xRelative * row.length));
  if (code >= 93) {
    code--;
  }
  if (code >= 35) {
    code--;
  }
  code -= 32;

  var data = null;
  if (code in this.keys_) {
    var id = this.keys_[code];
    if (this.data_ && id in this.data_) {
      data = this.data_[id];
    } else {
      data = id;
    }
  }
  return data;
};


/**
 * Calls the callback (synchronously by default) with the available data
 * for given coordinate (or `null` if not yet loaded).
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {function(this: T, *)} callback Callback.
 * @param {T=} opt_this The object to use as `this` in the callback.
 * @param {boolean=} opt_request If `true` the callback is always async.
 *                               The tile data is requested if not yet loaded.
 * @template T
 */
_ol_source_TileUTFGrid_.Tile_.prototype.forDataAtCoordinate = function(coordinate, callback, opt_this, opt_request) {
  if (this.state == _ol_TileState_.IDLE && opt_request === true) {
    _ol_events_.listenOnce(this, _ol_events_EventType_.CHANGE, function(e) {
      callback.call(opt_this, this.getData(coordinate));
    }, this);
    this.loadInternal_();
  } else {
    if (opt_request === true) {
      setTimeout(function() {
        callback.call(opt_this, this.getData(coordinate));
      }.bind(this), 0);
    } else {
      callback.call(opt_this, this.getData(coordinate));
    }
  }
};


/**
 * @inheritDoc
 */
_ol_source_TileUTFGrid_.Tile_.prototype.getKey = function() {
  return this.src_;
};


/**
 * @private
 */
_ol_source_TileUTFGrid_.Tile_.prototype.handleError_ = function() {
  this.state = _ol_TileState_.ERROR;
  this.changed();
};


/**
 * @param {!UTFGridJSON} json UTFGrid data.
 * @private
 */
_ol_source_TileUTFGrid_.Tile_.prototype.handleLoad_ = function(json) {
  this.grid_ = json.grid;
  this.keys_ = json.keys;
  this.data_ = json.data;

  this.state = _ol_TileState_.EMPTY;
  this.changed();
};


/**
 * @private
 */
_ol_source_TileUTFGrid_.Tile_.prototype.loadInternal_ = function() {
  if (this.state == _ol_TileState_.IDLE) {
    this.state = _ol_TileState_.LOADING;
    if (this.jsonp_) {
      _ol_net_.jsonp(this.src_, this.handleLoad_.bind(this),
          this.handleError_.bind(this));
    } else {
      var client = new XMLHttpRequest();
      client.addEventListener('load', this.onXHRLoad_.bind(this));
      client.addEventListener('error', this.onXHRError_.bind(this));
      client.open('GET', this.src_);
      client.send();
    }
  }
};


/**
 * @private
 * @param {Event} event The load event.
 */
_ol_source_TileUTFGrid_.Tile_.prototype.onXHRLoad_ = function(event) {
  var client = /** @type {XMLHttpRequest} */ (event.target);
  // status will be 0 for file:// urls
  if (!client.status || client.status >= 200 && client.status < 300) {
    var response;
    try {
      response = /** @type {!UTFGridJSON} */(JSON.parse(client.responseText));
    } catch (err) {
      this.handleError_();
      return;
    }
    this.handleLoad_(response);
  } else {
    this.handleError_();
  }
};


/**
 * @private
 * @param {Event} event The error event.
 */
_ol_source_TileUTFGrid_.Tile_.prototype.onXHRError_ = function(event) {
  this.handleError_();
};


/**
 * @override
 */
_ol_source_TileUTFGrid_.Tile_.prototype.load = function() {
  if (this.preemptive_) {
    this.loadInternal_();
  }
};
export default _ol_source_TileUTFGrid_;
