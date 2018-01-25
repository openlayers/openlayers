/**
 * @module ol/source/TileUTFGrid
 */
import {inherits} from '../index.js';
import Tile from '../Tile.js';
import TileState from '../TileState.js';
import {createFromTemplates, nullTileUrlFunction} from '../tileurlfunction.js';
import {assert} from '../asserts.js';
import {listenOnce} from '../events.js';
import EventType from '../events/EventType.js';
import {applyTransform, intersects} from '../extent.js';
import _ol_net_ from '../net.js';
import {get as getProjection, getTransformFromProjections} from '../proj.js';
import SourceState from '../source/State.js';
import TileSource from '../source/Tile.js';
import _ol_tilecoord_ from '../tilecoord.js';
import _ol_tilegrid_ from '../tilegrid.js';

/**
 * @classdesc
 * Layer source for UTFGrid interaction data loaded from TileJSON format.
 *
 * @constructor
 * @extends {ol.source.Tile}
 * @param {olx.source.TileUTFGridOptions} options Source options.
 * @api
 */
const UTFGrid = function(options) {
  TileSource.call(this, {
    projection: getProjection('EPSG:3857'),
    state: SourceState.LOADING
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
  this.tileUrlFunction_ = nullTileUrlFunction;

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
      const client = new XMLHttpRequest();
      client.addEventListener('load', this.onXHRLoad_.bind(this));
      client.addEventListener('error', this.onXHRError_.bind(this));
      client.open('GET', options.url);
      client.send();
    }
  } else if (options.tileJSON) {
    this.handleTileJSONResponse(options.tileJSON);
  } else {
    assert(false, 51); // Either `url` or `tileJSON` options must be provided
  }
};

inherits(UTFGrid, TileSource);


/**
 * @private
 * @param {Event} event The load event.
 */
UTFGrid.prototype.onXHRLoad_ = function(event) {
  const client = /** @type {XMLHttpRequest} */ (event.target);
  // status will be 0 for file:// urls
  if (!client.status || client.status >= 200 && client.status < 300) {
    let response;
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
UTFGrid.prototype.onXHRError_ = function(event) {
  this.handleTileJSONError();
};


/**
 * Return the template from TileJSON.
 * @return {string|undefined} The template from TileJSON.
 * @api
 */
UTFGrid.prototype.getTemplate = function() {
  return this.template_;
};


/**
 * Calls the callback (synchronously by default) with the available data
 * for given coordinate and resolution (or `null` if not yet loaded or
 * in case of an error).
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {number} resolution Resolution.
 * @param {function(*)} callback Callback.
 * @param {boolean=} opt_request If `true` the callback is always async.
 *                               The tile data is requested if not yet loaded.
 * @api
 */
UTFGrid.prototype.forDataAtCoordinateAndResolution = function(
  coordinate, resolution, callback, opt_request) {
  if (this.tileGrid) {
    const tileCoord = this.tileGrid.getTileCoordForCoordAndResolution(
      coordinate, resolution);
    const tile = /** @type {!ol.source.TileUTFGrid.Tile_} */(this.getTile(
      tileCoord[0], tileCoord[1], tileCoord[2], 1, this.getProjection()));
    tile.forDataAtCoordinate(coordinate, callback, null, opt_request);
  } else {
    if (opt_request === true) {
      setTimeout(function() {
        callback(null);
      }, 0);
    } else {
      callback(null);
    }
  }
};


/**
 * @protected
 */
UTFGrid.prototype.handleTileJSONError = function() {
  this.setState(SourceState.ERROR);
};


/**
 * TODO: very similar to ol.source.TileJSON#handleTileJSONResponse
 * @protected
 * @param {TileJSON} tileJSON Tile JSON.
 */
UTFGrid.prototype.handleTileJSONResponse = function(tileJSON) {

  const epsg4326Projection = getProjection('EPSG:4326');

  const sourceProjection = this.getProjection();
  let extent;
  if (tileJSON.bounds !== undefined) {
    const transform = getTransformFromProjections(
      epsg4326Projection, sourceProjection);
    extent = applyTransform(tileJSON.bounds, transform);
  }

  const minZoom = tileJSON.minzoom || 0;
  const maxZoom = tileJSON.maxzoom || 22;
  const tileGrid = _ol_tilegrid_.createXYZ({
    extent: _ol_tilegrid_.extentFromProjection(sourceProjection),
    maxZoom: maxZoom,
    minZoom: minZoom
  });
  this.tileGrid = tileGrid;

  this.template_ = tileJSON.template;

  const grids = tileJSON.grids;
  if (!grids) {
    this.setState(SourceState.ERROR);
    return;
  }

  this.tileUrlFunction_ = createFromTemplates(grids, tileGrid);

  if (tileJSON.attribution !== undefined) {
    const attributionExtent = extent !== undefined ?
      extent : epsg4326Projection.getExtent();

    this.setAttributions(function(frameState) {
      if (intersects(attributionExtent, frameState.extent)) {
        return [tileJSON.attribution];
      }
      return null;
    });
  }

  this.setState(SourceState.READY);

};


/**
 * @inheritDoc
 */
UTFGrid.prototype.getTile = function(z, x, y, pixelRatio, projection) {
  const tileCoordKey = _ol_tilecoord_.getKeyZXY(z, x, y);
  if (this.tileCache.containsKey(tileCoordKey)) {
    return /** @type {!ol.Tile} */ (this.tileCache.get(tileCoordKey));
  } else {
    const tileCoord = [z, x, y];
    const urlTileCoord =
        this.getTileCoordForTileUrlFunction(tileCoord, projection);
    const tileUrl = this.tileUrlFunction_(urlTileCoord, pixelRatio, projection);
    const tile = new UTFGrid.Tile_(
      tileCoord,
      tileUrl !== undefined ? TileState.IDLE : TileState.EMPTY,
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
UTFGrid.prototype.useTile = function(z, x, y) {
  const tileCoordKey = _ol_tilecoord_.getKeyZXY(z, x, y);
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
UTFGrid.Tile_ = function(tileCoord, state, src, extent, preemptive, jsonp) {

  Tile.call(this, tileCoord, state);

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
inherits(UTFGrid.Tile_, Tile);


/**
 * Get the image element for this tile.
 * @return {Image} Image.
 */
UTFGrid.Tile_.prototype.getImage = function() {
  return null;
};


/**
 * Synchronously returns data at given coordinate (if available).
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {*} The data.
 */
UTFGrid.Tile_.prototype.getData = function(coordinate) {
  if (!this.grid_ || !this.keys_) {
    return null;
  }
  const xRelative = (coordinate[0] - this.extent_[0]) /
      (this.extent_[2] - this.extent_[0]);
  const yRelative = (coordinate[1] - this.extent_[1]) /
      (this.extent_[3] - this.extent_[1]);

  const row = this.grid_[Math.floor((1 - yRelative) * this.grid_.length)];

  if (typeof row !== 'string') {
    return null;
  }

  let code = row.charCodeAt(Math.floor(xRelative * row.length));
  if (code >= 93) {
    code--;
  }
  if (code >= 35) {
    code--;
  }
  code -= 32;

  let data = null;
  if (code in this.keys_) {
    const id = this.keys_[code];
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
UTFGrid.Tile_.prototype.forDataAtCoordinate = function(coordinate, callback, opt_this, opt_request) {
  if (this.state == TileState.IDLE && opt_request === true) {
    listenOnce(this, EventType.CHANGE, function(e) {
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
UTFGrid.Tile_.prototype.getKey = function() {
  return this.src_;
};


/**
 * @private
 */
UTFGrid.Tile_.prototype.handleError_ = function() {
  this.state = TileState.ERROR;
  this.changed();
};


/**
 * @param {!UTFGridJSON} json UTFGrid data.
 * @private
 */
UTFGrid.Tile_.prototype.handleLoad_ = function(json) {
  this.grid_ = json.grid;
  this.keys_ = json.keys;
  this.data_ = json.data;

  this.state = TileState.EMPTY;
  this.changed();
};


/**
 * @private
 */
UTFGrid.Tile_.prototype.loadInternal_ = function() {
  if (this.state == TileState.IDLE) {
    this.state = TileState.LOADING;
    if (this.jsonp_) {
      _ol_net_.jsonp(this.src_, this.handleLoad_.bind(this),
        this.handleError_.bind(this));
    } else {
      const client = new XMLHttpRequest();
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
UTFGrid.Tile_.prototype.onXHRLoad_ = function(event) {
  const client = /** @type {XMLHttpRequest} */ (event.target);
  // status will be 0 for file:// urls
  if (!client.status || client.status >= 200 && client.status < 300) {
    let response;
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
UTFGrid.Tile_.prototype.onXHRError_ = function(event) {
  this.handleError_();
};


/**
 * @override
 */
UTFGrid.Tile_.prototype.load = function() {
  if (this.preemptive_) {
    this.loadInternal_();
  }
};
export default UTFGrid;
