/**
 * @module ol/source/XYZ
 */
import {inherits} from '../index.js';
import TileImage from '../source/TileImage.js';
import _ol_tilegrid_ from '../tilegrid.js';

/**
 * @classdesc
 * Layer source for tile data with URLs in a set XYZ format that are
 * defined in a URL template. By default, this follows the widely-used
 * Google grid where `x` 0 and `y` 0 are in the top left. Grids like
 * TMS where `x` 0 and `y` 0 are in the bottom left can be used by
 * using the `{-y}` placeholder in the URL template, so long as the
 * source does not have a custom tile grid. In this case,
 * {@link ol.source.TileImage} can be used with a `tileUrlFunction`
 * such as:
 *
 *  tileUrlFunction: function(coordinate) {
 *    return 'http://mapserver.com/' + coordinate[0] + '/' +
 *        coordinate[1] + '/' + coordinate[2] + '.png';
 *    }
 *
 *
 * @constructor
 * @extends {ol.source.TileImage}
 * @param {olx.source.XYZOptions=} opt_options XYZ options.
 * @api
 */
const XYZ = function(opt_options) {
  const options = opt_options || {};
  const projection = options.projection !== undefined ?
    options.projection : 'EPSG:3857';

  const tileGrid = options.tileGrid !== undefined ? options.tileGrid :
    _ol_tilegrid_.createXYZ({
      extent: _ol_tilegrid_.extentFromProjection(projection),
      maxZoom: options.maxZoom,
      minZoom: options.minZoom,
      tileSize: options.tileSize
    });

  TileImage.call(this, {
    attributions: options.attributions,
    cacheSize: options.cacheSize,
    crossOrigin: options.crossOrigin,
    opaque: options.opaque,
    projection: projection,
    reprojectionErrorThreshold: options.reprojectionErrorThreshold,
    tileGrid: tileGrid,
    tileLoadFunction: options.tileLoadFunction,
    tilePixelRatio: options.tilePixelRatio,
    tileUrlFunction: options.tileUrlFunction,
    url: options.url,
    urls: options.urls,
    wrapX: options.wrapX !== undefined ? options.wrapX : true,
    transition: options.transition
  });

};

inherits(XYZ, TileImage);
export default XYZ;
