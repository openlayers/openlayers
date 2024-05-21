/**
 * @module ol/source/UTFGrid
 */

import EventType from '../events/EventType.js';
import Tile from '../Tile.js';
import TileSource from './Tile.js';
import TileState from '../TileState.js';
import {applyTransform, intersects} from '../extent.js';
import {createFromTemplates, nullTileUrlFunction} from '../tileurlfunction.js';
import {createXYZ, extentFromProjection} from '../tilegrid.js';
import {getKeyZXY} from '../tilecoord.js';
import {get as getProjection, getTransformFromProjections} from '../proj.js';
import {listenOnce} from '../events.js';
import {jsonp as requestJSONP} from '../net.js';

/**
 * @typedef {Object} UTFGridJSON
 * @property {Array<string>} grid The grid.
 * @property {Array<string>} keys The keys.
 * @property {Object<string, Object>} [data] Optional data.
 */

export class CustomTile extends Tile {
  /**
   * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @param {import("../TileState.js").default} state State.
   * @param {string} src Image source URI.
   * @param {import("../extent.js").Extent} extent Extent of the tile.
   * @param {boolean} preemptive Load the tile when visible (before it's needed).
   * @param {boolean} jsonp Load the tile as a script.
   */
  constructor(tileCoord, state, src, extent, preemptive, jsonp) {
    super(tileCoord, state);

    /**
     * @private
     * @type {string}
     */
    this.src_ = src;

    /**
     * @private
     * @type {import("../extent.js").Extent}
     */
    this.extent_ = extent;

    /**
     * @private
     * @type {boolean}
     */
    this.preemptive_ = preemptive;

    /**
     * @private
     * @type {Array<string>}
     */
    this.grid_ = null;

    /**
     * @private
     * @type {Array<string>}
     */
    this.keys_ = null;

    /**
     * @private
     * @type {Object<string, Object>|undefined}
     */
    this.data_ = null;

    /**
     * @private
     * @type {boolean}
     */
    this.jsonp_ = jsonp;
  }

  /**
   * Get the image element for this tile.
   * @return {HTMLImageElement} Image.
   */
  getImage() {
    return null;
  }

  /**
   * Synchronously returns data at given coordinate (if available).
   * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
   * @return {*} The data.
   */
  getData(coordinate) {
    if (!this.grid_ || !this.keys_) {
      return null;
    }
    const xRelative =
      (coordinate[0] - this.extent_[0]) / (this.extent_[2] - this.extent_[0]);
    const yRelative =
      (coordinate[1] - this.extent_[1]) / (this.extent_[3] - this.extent_[1]);

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
  }

  /**
   * Calls the callback (synchronously by default) with the available data
   * for given coordinate (or `null` if not yet loaded).
   * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
   * @param {function(*): void} callback Callback.
   * @param {boolean} [request] If `true` the callback is always async.
   *                               The tile data is requested if not yet loaded.
   */
  forDataAtCoordinate(coordinate, callback, request) {
    if (this.state == TileState.EMPTY && request === true) {
      this.state = TileState.IDLE;
      listenOnce(
        this,
        EventType.CHANGE,
        function (e) {
          callback(this.getData(coordinate));
        },
        this,
      );
      this.loadInternal_();
    } else {
      if (request === true) {
        setTimeout(() => {
          callback(this.getData(coordinate));
        }, 0);
      } else {
        callback(this.getData(coordinate));
      }
    }
  }

  /**
   * Return the key to be used for all tiles in the source.
   * @return {string} The key for all tiles.
   */
  getKey() {
    return this.src_;
  }

  /**
   * @private
   */
  handleError_() {
    this.state = TileState.ERROR;
    this.changed();
  }

  /**
   * @param {!UTFGridJSON} json UTFGrid data.
   * @private
   */
  handleLoad_(json) {
    this.grid_ = json['grid'];
    this.keys_ = json['keys'];
    this.data_ = json['data'];

    this.state = TileState.LOADED;
    this.changed();
  }

  /**
   * @private
   */
  loadInternal_() {
    if (this.state == TileState.IDLE) {
      this.state = TileState.LOADING;
      if (this.jsonp_) {
        requestJSONP(
          this.src_,
          this.handleLoad_.bind(this),
          this.handleError_.bind(this),
        );
      } else {
        const client = new XMLHttpRequest();
        client.addEventListener('load', this.onXHRLoad_.bind(this));
        client.addEventListener('error', this.onXHRError_.bind(this));
        client.open('GET', this.src_);
        client.send();
      }
    }
  }

  /**
   * @private
   * @param {Event} event The load event.
   */
  onXHRLoad_(event) {
    const client = /** @type {XMLHttpRequest} */ (event.target);
    // status will be 0 for file:// urls
    if (!client.status || (client.status >= 200 && client.status < 300)) {
      let response;
      try {
        response = /** @type {!UTFGridJSON} */ (
          JSON.parse(client.responseText)
        );
      } catch (err) {
        this.handleError_();
        return;
      }
      this.handleLoad_(response);
    } else {
      this.handleError_();
    }
  }

  /**
   * @private
   * @param {Event} event The error event.
   */
  onXHRError_(event) {
    this.handleError_();
  }

  /**
   */
  load() {
    if (this.preemptive_) {
      this.loadInternal_();
    } else {
      this.setState(TileState.EMPTY);
    }
  }
}

/**
 * @typedef {Object} Options
 * @property {boolean} [preemptive=true]
 * If `true` the UTFGrid source loads the tiles based on their "visibility".
 * This improves the speed of response, but increases traffic.
 * Note that if set to `false` (lazy loading), you need to pass `true` as
 * `request` to the `forDataAtCoordinateAndResolution` method otherwise no
 * data will ever be loaded.
 * @property {boolean} [jsonp=false] Use JSONP with callback to load the TileJSON.
 * Useful when the server does not support CORS..
 * @property {import("./TileJSON.js").Config} [tileJSON] TileJSON configuration for this source.
 * If not provided, `url` must be configured.
 * @property {string} [url] TileJSON endpoint that provides the configuration for this source.
 * Request will be made through JSONP. If not provided, `tileJSON` must be configured.
 * @property {boolean} [wrapX=true] Whether to wrap the world horizontally.
 * @property {number|import("../array.js").NearestDirectionFunction} [zDirection=0]
 * Choose whether to use tiles with a higher or lower zoom level when between integer
 * zoom levels. See {@link module:ol/tilegrid/TileGrid~TileGrid#getZForResolution}.
 */

/**
 * @classdesc
 * Layer source for UTFGrid interaction data loaded from TileJSON format.
 * @api
 */
class UTFGrid extends TileSource {
  /**
   * @param {Options} options Source options.
   */
  constructor(options) {
    super({
      projection: getProjection('EPSG:3857'),
      state: 'loading',
      wrapX: options.wrapX !== undefined ? options.wrapX : true,
      zDirection: options.zDirection,
    });

    /**
     * @private
     * @type {boolean}
     */
    this.preemptive_ =
      options.preemptive !== undefined ? options.preemptive : true;

    /**
     * @private
     * @type {!import("../Tile.js").UrlFunction}
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
        requestJSONP(
          options.url,
          this.handleTileJSONResponse.bind(this),
          this.handleTileJSONError.bind(this),
        );
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
      throw new Error('Either `url` or `tileJSON` options must be provided');
    }
  }

  /**
   * @private
   * @param {Event} event The load event.
   */
  onXHRLoad_(event) {
    const client = /** @type {XMLHttpRequest} */ (event.target);
    // status will be 0 for file:// urls
    if (!client.status || (client.status >= 200 && client.status < 300)) {
      let response;
      try {
        response = /** @type {import("./TileJSON.js").Config} */ (
          JSON.parse(client.responseText)
        );
      } catch (err) {
        this.handleTileJSONError();
        return;
      }
      this.handleTileJSONResponse(response);
    } else {
      this.handleTileJSONError();
    }
  }

  /**
   * @private
   * @param {Event} event The error event.
   */
  onXHRError_(event) {
    this.handleTileJSONError();
  }

  /**
   * Return the template from TileJSON.
   * @return {string|undefined} The template from TileJSON.
   * @api
   */
  getTemplate() {
    return this.template_;
  }

  /**
   * Calls the callback (synchronously by default) with the available data
   * for given coordinate and resolution (or `null` if not yet loaded or
   * in case of an error).
   * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
   * @param {number} resolution Resolution.
   * @param {function(*): void} callback Callback.
   * @param {boolean} [request] If `true` the callback is always async.
   *                               The tile data is requested if not yet loaded.
   * @api
   */
  forDataAtCoordinateAndResolution(coordinate, resolution, callback, request) {
    if (this.tileGrid) {
      const z = this.tileGrid.getZForResolution(resolution, this.zDirection);
      const tileCoord = this.tileGrid.getTileCoordForCoordAndZ(coordinate, z);
      const tile = /** @type {!CustomTile} */ (
        this.getTile(
          tileCoord[0],
          tileCoord[1],
          tileCoord[2],
          1,
          this.getProjection(),
        )
      );
      tile.forDataAtCoordinate(coordinate, callback, request);
    } else {
      if (request === true) {
        setTimeout(function () {
          callback(null);
        }, 0);
      } else {
        callback(null);
      }
    }
  }

  /**
   * @protected
   */
  handleTileJSONError() {
    this.setState('error');
  }

  /**
   * TODO: very similar to ol/source/TileJSON#handleTileJSONResponse
   * @protected
   * @param {import("./TileJSON.js").Config} tileJSON Tile JSON.
   */
  handleTileJSONResponse(tileJSON) {
    const epsg4326Projection = getProjection('EPSG:4326');

    const sourceProjection = this.getProjection();
    let extent;
    if (tileJSON['bounds'] !== undefined) {
      const transform = getTransformFromProjections(
        epsg4326Projection,
        sourceProjection,
      );
      extent = applyTransform(tileJSON['bounds'], transform);
    }

    const gridExtent = extentFromProjection(sourceProjection);
    const minZoom = tileJSON['minzoom'] || 0;
    const maxZoom = tileJSON['maxzoom'] || 22;
    const tileGrid = createXYZ({
      extent: gridExtent,
      maxZoom: maxZoom,
      minZoom: minZoom,
    });
    this.tileGrid = tileGrid;

    this.template_ = tileJSON['template'];

    const grids = tileJSON['grids'];
    if (!grids) {
      this.setState('error');
      return;
    }

    this.tileUrlFunction_ = createFromTemplates(grids, tileGrid);

    if (tileJSON['attribution']) {
      const attributionExtent = extent !== undefined ? extent : gridExtent;
      this.setAttributions(function (frameState) {
        if (intersects(attributionExtent, frameState.extent)) {
          return [tileJSON['attribution']];
        }
        return null;
      });
    }

    this.setState('ready');
  }

  /**
   * @param {number} z Tile coordinate z.
   * @param {number} x Tile coordinate x.
   * @param {number} y Tile coordinate y.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {!CustomTile} Tile.
   */
  getTile(z, x, y, pixelRatio, projection) {
    const tileCoordKey = getKeyZXY(z, x, y);
    if (this.tileCache.containsKey(tileCoordKey)) {
      return this.tileCache.get(tileCoordKey);
    }
    const tileCoord = [z, x, y];
    const urlTileCoord = this.getTileCoordForTileUrlFunction(
      tileCoord,
      projection,
    );
    const tileUrl = this.tileUrlFunction_(urlTileCoord, pixelRatio, projection);
    const tile = new CustomTile(
      tileCoord,
      tileUrl !== undefined ? TileState.IDLE : TileState.EMPTY,
      tileUrl !== undefined ? tileUrl : '',
      this.tileGrid.getTileCoordExtent(tileCoord),
      this.preemptive_,
      this.jsonp_,
    );
    this.tileCache.set(tileCoordKey, tile);
    return tile;
  }

  /**
   * Marks a tile coord as being used, without triggering a load.
   * @param {number} z Tile coordinate z.
   * @param {number} x Tile coordinate x.
   * @param {number} y Tile coordinate y.
   */
  useTile(z, x, y) {
    const tileCoordKey = getKeyZXY(z, x, y);
    if (this.tileCache.containsKey(tileCoordKey)) {
      this.tileCache.get(tileCoordKey);
    }
  }
}

export default UTFGrid;
