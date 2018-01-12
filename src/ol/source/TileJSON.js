/**
 * @module ol/source/TileJSON
 */
// FIXME check order of async callbacks

/**
 * @see http://mapbox.com/developers/api/
 */

import {inherits} from '../index.js';
import {createFromTemplates} from '../tileurlfunction.js';
import {assert} from '../asserts.js';
import {applyTransform, intersects} from '../extent.js';
import _ol_net_ from '../net.js';
import {get as getProjection, getTransformFromProjections} from '../proj.js';
import SourceState from '../source/State.js';
import TileImage from '../source/TileImage.js';
import _ol_tilegrid_ from '../tilegrid.js';

/**
 * @classdesc
 * Layer source for tile data in TileJSON format.
 *
 * @constructor
 * @extends {ol.source.TileImage}
 * @param {olx.source.TileJSONOptions} options TileJSON options.
 * @api
 */
const TileJSON = function(options) {

  /**
   * @type {TileJSON}
   * @private
   */
  this.tileJSON_ = null;

  TileImage.call(this, {
    attributions: options.attributions,
    cacheSize: options.cacheSize,
    crossOrigin: options.crossOrigin,
    projection: getProjection('EPSG:3857'),
    reprojectionErrorThreshold: options.reprojectionErrorThreshold,
    state: SourceState.LOADING,
    tileLoadFunction: options.tileLoadFunction,
    wrapX: options.wrapX !== undefined ? options.wrapX : true,
    transition: options.transition
  });

  if (options.url) {
    if (options.jsonp) {
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

inherits(TileJSON, TileImage);


/**
 * @private
 * @param {Event} event The load event.
 */
TileJSON.prototype.onXHRLoad_ = function(event) {
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
TileJSON.prototype.onXHRError_ = function(event) {
  this.handleTileJSONError();
};


/**
 * @return {TileJSON} The tilejson object.
 * @api
 */
TileJSON.prototype.getTileJSON = function() {
  return this.tileJSON_;
};


/**
 * @protected
 * @param {TileJSON} tileJSON Tile JSON.
 */
TileJSON.prototype.handleTileJSONResponse = function(tileJSON) {

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

  this.tileUrlFunction = createFromTemplates(tileJSON.tiles, tileGrid);

  if (tileJSON.attribution !== undefined && !this.getAttributions()) {
    const attributionExtent = extent !== undefined ?
      extent : epsg4326Projection.getExtent();

    this.setAttributions(function(frameState) {
      if (intersects(attributionExtent, frameState.extent)) {
        return [tileJSON.attribution];
      }
      return null;
    });

  }
  this.tileJSON_ = tileJSON;
  this.setState(SourceState.READY);

};


/**
 * @protected
 */
TileJSON.prototype.handleTileJSONError = function() {
  this.setState(SourceState.ERROR);
};
export default TileJSON;
