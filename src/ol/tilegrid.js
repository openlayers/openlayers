/**
 * @module ol/tilegrid
 */
import {DEFAULT_MAX_ZOOM, DEFAULT_TILE_SIZE} from './tilegrid/common.js';
import {toSize} from './size.js';
import {containsCoordinate, createOrUpdate, getCorner, getHeight, getWidth} from './extent.js';
import Corner from './extent/Corner.js';
import {assign} from './obj.js';
import {get as getProjection, METERS_PER_UNIT} from './proj.js';
import Units from './proj/Units.js';
import TileGrid from './tilegrid/TileGrid.js';


/**
 * @param {module:ol/proj/Projection} projection Projection.
 * @return {!module:ol/tilegrid/TileGrid} Default tile grid for the
 * passed projection.
 */
export function getForProjection(projection) {
  let tileGrid = projection.getDefaultTileGrid();
  if (!tileGrid) {
    tileGrid = createForProjection(projection);
    projection.setDefaultTileGrid(tileGrid);
  }
  return tileGrid;
}


/**
 * @param {module:ol/tilegrid/TileGrid} tileGrid Tile grid.
 * @param {module:ol/tilecoord~TileCoord} tileCoord Tile coordinate.
 * @param {module:ol/proj/Projection} projection Projection.
 * @return {module:ol/tilecoord~TileCoord} Tile coordinate.
 */
export function wrapX(tileGrid, tileCoord, projection) {
  const z = tileCoord[0];
  const center = tileGrid.getTileCoordCenter(tileCoord);
  const projectionExtent = extentFromProjection(projection);
  if (!containsCoordinate(projectionExtent, center)) {
    const worldWidth = getWidth(projectionExtent);
    const worldsAway = Math.ceil((projectionExtent[0] - center[0]) / worldWidth);
    center[0] += worldWidth * worldsAway;
    return tileGrid.getTileCoordForCoordAndZ(center, z);
  } else {
    return tileCoord;
  }
}


/**
 * @param {module:ol/extent~Extent} extent Extent.
 * @param {number=} opt_maxZoom Maximum zoom level (default is
 *     DEFAULT_MAX_ZOOM).
 * @param {number|module:ol/size~Size=} opt_tileSize Tile size (default uses
 *     DEFAULT_TILE_SIZE).
 * @param {module:ol/extent/Corner=} opt_corner Extent corner (default is `'top-left'`).
 * @return {!module:ol/tilegrid/TileGrid} TileGrid instance.
 */
export function createForExtent(extent, opt_maxZoom, opt_tileSize, opt_corner) {
  const corner = opt_corner !== undefined ? opt_corner : Corner.TOP_LEFT;

  const resolutions = resolutionsFromExtent(extent, opt_maxZoom, opt_tileSize);

  return new TileGrid({
    extent: extent,
    origin: getCorner(extent, corner),
    resolutions: resolutions,
    tileSize: opt_tileSize
  });
}


/**
 * @typedef {Object} XYZOptions
 * @property {module:ol/extent~Extent} [extent] Extent for the tile grid. The origin for an XYZ tile grid is the
 * top-left corner of the extent. The zero level of the grid is defined by the resolution at which one tile fits in the
 * provided extent. If not provided, the extent of the EPSG:3857 projection is used.
 * @property {number} [maxZoom] Maximum zoom. The default is `42`. This determines the number of levels
 * in the grid set. For example, a `maxZoom` of 21 means there are 22 levels in the grid set.
 * @property {number} [minZoom=0] Minimum zoom.
 * @property {number|module:ol/size~Size} [tileSize=[256, 256]] Tile size in pixels.
 */


/**
 * Creates a tile grid with a standard XYZ tiling scheme.
 * @param {module:ol/tilegrid~XYZOptions=} opt_options Tile grid options.
 * @return {!module:ol/tilegrid/TileGrid} Tile grid instance.
 * @api
 */
export function createXYZ(opt_options) {
  const options = /** @type {module:ol/tilegrid/TileGrid~Options} */ ({});
  assign(options, opt_options !== undefined ?
    opt_options : /** @type {module:ol/tilegrid~XYZOptions} */ ({}));
  if (options.extent === undefined) {
    options.extent = getProjection('EPSG:3857').getExtent();
  }
  options.resolutions = resolutionsFromExtent(
    options.extent, options.maxZoom, options.tileSize);
  delete options.maxZoom;

  return new TileGrid(options);
}


/**
 * Create a resolutions array from an extent.  A zoom factor of 2 is assumed.
 * @param {module:ol/extent~Extent} extent Extent.
 * @param {number=} opt_maxZoom Maximum zoom level (default is
 *     DEFAULT_MAX_ZOOM).
 * @param {number|module:ol/size~Size=} opt_tileSize Tile size (default uses
 *     DEFAULT_TILE_SIZE).
 * @return {!Array.<number>} Resolutions array.
 */
function resolutionsFromExtent(extent, opt_maxZoom, opt_tileSize) {
  const maxZoom = opt_maxZoom !== undefined ?
    opt_maxZoom : DEFAULT_MAX_ZOOM;

  const height = getHeight(extent);
  const width = getWidth(extent);

  const tileSize = toSize(opt_tileSize !== undefined ?
    opt_tileSize : DEFAULT_TILE_SIZE);
  const maxResolution = Math.max(
    width / tileSize[0], height / tileSize[1]);

  const length = maxZoom + 1;
  const resolutions = new Array(length);
  for (let z = 0; z < length; ++z) {
    resolutions[z] = maxResolution / Math.pow(2, z);
  }
  return resolutions;
}


/**
 * @param {module:ol/proj~ProjectionLike} projection Projection.
 * @param {number=} opt_maxZoom Maximum zoom level (default is
 *     DEFAULT_MAX_ZOOM).
 * @param {number|module:ol/size~Size=} opt_tileSize Tile size (default uses
 *     DEFAULT_TILE_SIZE).
 * @param {module:ol/extent/Corner=} opt_corner Extent corner (default is `'top-left'`).
 * @return {!module:ol/tilegrid/TileGrid} TileGrid instance.
 */
export function createForProjection(projection, opt_maxZoom, opt_tileSize, opt_corner) {
  const extent = extentFromProjection(projection);
  return createForExtent(extent, opt_maxZoom, opt_tileSize, opt_corner);
}


/**
 * Generate a tile grid extent from a projection.  If the projection has an
 * extent, it is used.  If not, a global extent is assumed.
 * @param {module:ol/proj~ProjectionLike} projection Projection.
 * @return {module:ol/extent~Extent} Extent.
 */
export function extentFromProjection(projection) {
  projection = getProjection(projection);
  let extent = projection.getExtent();
  if (!extent) {
    const half = 180 * METERS_PER_UNIT[Units.DEGREES] / projection.getMetersPerUnit();
    extent = createOrUpdate(-half, -half, half, half);
  }
  return extent;
}
