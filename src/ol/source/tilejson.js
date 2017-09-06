// FIXME check order of async callbacks

/**
 * @see http://mapbox.com/developers/api/
 */

import _ol_ from '../index';
import _ol_Attribution_ from '../attribution';
import _ol_TileUrlFunction_ from '../tileurlfunction';
import _ol_asserts_ from '../asserts';
import _ol_extent_ from '../extent';
import _ol_net_ from '../net';
import _ol_proj_ from '../proj';
import _ol_source_State_ from '../source/state';
import _ol_source_TileImage_ from '../source/tileimage';
import _ol_tilegrid_ from '../tilegrid';

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
    projection: _ol_proj_.get('EPSG:3857'),
    reprojectionErrorThreshold: options.reprojectionErrorThreshold,
    state: _ol_source_State_.LOADING,
    tileLoadFunction: options.tileLoadFunction,
    wrapX: options.wrapX !== undefined ? options.wrapX : true
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

_ol_.inherits(_ol_source_TileJSON_, _ol_source_TileImage_);


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

  this.tileUrlFunction =
      _ol_TileUrlFunction_.createFromTemplates(tileJSON.tiles, tileGrid);

  if (tileJSON.attribution !== undefined && !this.getAttributions()) {
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
