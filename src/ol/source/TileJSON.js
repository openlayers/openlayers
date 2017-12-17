/**
 * @module ol/source/TileJSON
 */
// FIXME check order of async callbacks

/**
 * @see http://mapbox.com/developers/api/
 */

import {inherits} from '../index.js';
import {createFromTemplates} from '../tileurlfunction.js';
import _ol_asserts_ from '../asserts.js';
import {applyTransform, intersects} from '../extent.js';
import _ol_net_ from '../net.js';
import {get as getProjection, getTransformFromProjections} from '../proj.js';
import _ol_source_State_ from '../source/State.js';
import _ol_source_TileImage_ from '../source/TileImage.js';
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
var _ol_source_TileJSON_ = function(options) {

  /**
   * @type {TileJSON}
   * @private
   */
  this.tileJSON_ = null;

  _ol_source_TileImage_.call(this, {
    attributions: options.attributions,
    cacheSize: options.cacheSize,
    crossOrigin: options.crossOrigin,
    projection: getProjection('EPSG:3857'),
    reprojectionErrorThreshold: options.reprojectionErrorThreshold,
    state: _ol_source_State_.LOADING,
    tileLoadFunction: options.tileLoadFunction,
    wrapX: options.wrapX !== undefined ? options.wrapX : true,
    transition: options.transition
  });

  if (options.url) {
    if (options.jsonp) {
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

inherits(_ol_source_TileJSON_, _ol_source_TileImage_);


/**
 * @private
 * @param {Event} event The load event.
 */
_ol_source_TileJSON_.prototype.onXHRLoad_ = function(event) {
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
_ol_source_TileJSON_.prototype.onXHRError_ = function(event) {
  this.handleTileJSONError();
};


/**
 * @return {TileJSON} The tilejson object.
 * @api
 */
_ol_source_TileJSON_.prototype.getTileJSON = function() {
  return this.tileJSON_;
};


/**
 * @protected
 * @param {TileJSON} tileJSON Tile JSON.
 */
_ol_source_TileJSON_.prototype.handleTileJSONResponse = function(tileJSON) {

  var epsg4326Projection = getProjection('EPSG:4326');

  var sourceProjection = this.getProjection();
  var extent;
  if (tileJSON.bounds !== undefined) {
    var transform = getTransformFromProjections(
        epsg4326Projection, sourceProjection);
    extent = applyTransform(tileJSON.bounds, transform);
  }

  var minZoom = tileJSON.minzoom || 0;
  var maxZoom = tileJSON.maxzoom || 22;
  var tileGrid = _ol_tilegrid_.createXYZ({
    extent: _ol_tilegrid_.extentFromProjection(sourceProjection),
    maxZoom: maxZoom,
    minZoom: minZoom
  });
  this.tileGrid = tileGrid;

  this.tileUrlFunction = createFromTemplates(tileJSON.tiles, tileGrid);

  if (tileJSON.attribution !== undefined && !this.getAttributions()) {
    var attributionExtent = extent !== undefined ?
      extent : epsg4326Projection.getExtent();

    this.setAttributions(function(frameState) {
      if (intersects(attributionExtent, frameState.extent)) {
        return [tileJSON.attribution];
      }
      return null;
    });

  }
  this.tileJSON_ = tileJSON;
  this.setState(_ol_source_State_.READY);

};


/**
 * @protected
 */
_ol_source_TileJSON_.prototype.handleTileJSONError = function() {
  this.setState(_ol_source_State_.ERROR);
};
export default _ol_source_TileJSON_;
