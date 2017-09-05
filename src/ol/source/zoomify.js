import _ol_ from '../index';
import _ol_ImageTile_ from '../imagetile';
import _ol_TileState_ from '../tilestate';
import _ol_TileUrlFunction_ from '../tileurlfunction';
import _ol_asserts_ from '../asserts';
import _ol_dom_ from '../dom';
import _ol_extent_ from '../extent';
import _ol_source_TileImage_ from '../source/tileimage';
import _ol_tilegrid_TileGrid_ from '../tilegrid/tilegrid';

/**
 * @classdesc
 * Layer source for tile data in Zoomify format.
 *
 * @constructor
 * @extends {ol.source.TileImage}
 * @param {olx.source.ZoomifyOptions=} opt_options Options.
 * @api
 */
var _ol_source_Zoomify_ = function(opt_options) {

  var options = opt_options || {};

  var size = options.size;
  var tierSizeCalculation = options.tierSizeCalculation !== undefined ?
    options.tierSizeCalculation :
    _ol_source_Zoomify_.TierSizeCalculation_.DEFAULT;

  var imageWidth = size[0];
  var imageHeight = size[1];
  var tierSizeInTiles = [];
  var tileSize = _ol_.DEFAULT_TILE_SIZE;

  switch (tierSizeCalculation) {
    case _ol_source_Zoomify_.TierSizeCalculation_.DEFAULT:
      while (imageWidth > tileSize || imageHeight > tileSize) {
        tierSizeInTiles.push([
          Math.ceil(imageWidth / tileSize),
          Math.ceil(imageHeight / tileSize)
        ]);
        tileSize += tileSize;
      }
      break;
    case _ol_source_Zoomify_.TierSizeCalculation_.TRUNCATED:
      var width = imageWidth;
      var height = imageHeight;
      while (width > tileSize || height > tileSize) {
        tierSizeInTiles.push([
          Math.ceil(width / tileSize),
          Math.ceil(height / tileSize)
        ]);
        width >>= 1;
        height >>= 1;
      }
      break;
    default:
      _ol_asserts_.assert(false, 53); // Unknown `tierSizeCalculation` configured
      break;
  }

  tierSizeInTiles.push([1, 1]);
  tierSizeInTiles.reverse();

  var resolutions = [1];
  var tileCountUpToTier = [0];
  var i, ii;
  for (i = 1, ii = tierSizeInTiles.length; i < ii; i++) {
    resolutions.push(1 << i);
    tileCountUpToTier.push(
        tierSizeInTiles[i - 1][0] * tierSizeInTiles[i - 1][1] +
        tileCountUpToTier[i - 1]
    );
  }
  resolutions.reverse();

  var extent = [0, -size[1], size[0], 0];
  var tileGrid = new _ol_tilegrid_TileGrid_({
    extent: extent,
    origin: _ol_extent_.getTopLeft(extent),
    resolutions: resolutions
  });

  var url = options.url;
  if (url && url.indexOf('{TileGroup}') == -1) {
    url += '{TileGroup}/{z}-{x}-{y}.jpg';
  }
  var urls = _ol_TileUrlFunction_.expandUrl(url);

  /**
   * @param {string} template Template.
   * @return {ol.TileUrlFunctionType} Tile URL function.
   */
  function createFromTemplate(template) {

    return (
      /**
       * @param {ol.TileCoord} tileCoord Tile Coordinate.
       * @param {number} pixelRatio Pixel ratio.
       * @param {ol.proj.Projection} projection Projection.
       * @return {string|undefined} Tile URL.
       */
      function(tileCoord, pixelRatio, projection) {
        if (!tileCoord) {
          return undefined;
        } else {
          var tileCoordZ = tileCoord[0];
          var tileCoordX = tileCoord[1];
          var tileCoordY = -tileCoord[2] - 1;
          var tileIndex =
              tileCoordX +
              tileCoordY * tierSizeInTiles[tileCoordZ][0] +
              tileCountUpToTier[tileCoordZ];
          var tileGroup = (tileIndex / _ol_.DEFAULT_TILE_SIZE) | 0;
          var localContext = {
            'z': tileCoordZ,
            'x': tileCoordX,
            'y': tileCoordY,
            'TileGroup': 'TileGroup' + tileGroup
          };
          return template.replace(/\{(\w+?)\}/g, function(m, p) {
            return localContext[p];
          });
        }
      }
    );
  }

  var tileUrlFunction = _ol_TileUrlFunction_.createFromTileUrlFunctions(urls.map(createFromTemplate));

  _ol_source_TileImage_.call(this, {
    attributions: options.attributions,
    cacheSize: options.cacheSize,
    crossOrigin: options.crossOrigin,
    logo: options.logo,
    projection: options.projection,
    reprojectionErrorThreshold: options.reprojectionErrorThreshold,
    tileClass: _ol_source_Zoomify_.Tile_,
    tileGrid: tileGrid,
    tileUrlFunction: tileUrlFunction
  });

};

_ol_.inherits(_ol_source_Zoomify_, _ol_source_TileImage_);


/**
 * @constructor
 * @extends {ol.ImageTile}
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.TileState} state State.
 * @param {string} src Image source URI.
 * @param {?string} crossOrigin Cross origin.
 * @param {ol.TileLoadFunctionType} tileLoadFunction Tile load function.
 * @private
 */
_ol_source_Zoomify_.Tile_ = function(
    tileCoord, state, src, crossOrigin, tileLoadFunction) {

  _ol_ImageTile_.call(this, tileCoord, state, src, crossOrigin, tileLoadFunction);

  /**
   * @private
   * @type {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement}
   */
  this.zoomifyImage_ = null;

};
_ol_.inherits(_ol_source_Zoomify_.Tile_, _ol_ImageTile_);


/**
 * @inheritDoc
 */
_ol_source_Zoomify_.Tile_.prototype.getImage = function() {
  if (this.zoomifyImage_) {
    return this.zoomifyImage_;
  }
  var tileSize = _ol_.DEFAULT_TILE_SIZE;
  var image = _ol_ImageTile_.prototype.getImage.call(this);
  if (this.state == _ol_TileState_.LOADED) {
    if (image.width == tileSize && image.height == tileSize) {
      this.zoomifyImage_ = image;
      return image;
    } else {
      var context = _ol_dom_.createCanvasContext2D(tileSize, tileSize);
      context.drawImage(image, 0, 0);
      this.zoomifyImage_ = context.canvas;
      return context.canvas;
    }
  } else {
    return image;
  }
};


/**
 * @enum {string}
 * @private
 */
_ol_source_Zoomify_.TierSizeCalculation_ = {
  DEFAULT: 'default',
  TRUNCATED: 'truncated'
};
export default _ol_source_Zoomify_;
