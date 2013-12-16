goog.provide('ol.source.Zoomify');

goog.require('goog.array');
goog.require('ol.Image');
goog.require('ol.TileCoord');
goog.require('ol.TileUrlFunction');
goog.require('ol.proj');
goog.require('ol.source.TileImage');
goog.require('ol.tilegrid.Zoomify');



/**
 * @constructor
 * @extends {ol.source.TileImage}
 * @param {olx.source.ZoomifyOptions=} opt_options Options.
 * @todo stability experimental
 */
ol.source.Zoomify = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  var size = options.size;

  var imageSize = size.slice();
  var tiles = [
    Math.ceil(imageSize[0] / ol.DEFAULT_TILE_SIZE),
    Math.ceil(imageSize[1] / ol.DEFAULT_TILE_SIZE)
  ];
  var tierSizeInTiles = [tiles];
  var tierImageSize = [imageSize];

  while (imageSize[0] > ol.DEFAULT_TILE_SIZE ||
      imageSize[1] > ol.DEFAULT_TILE_SIZE) {

    imageSize = [
      Math.floor(imageSize[0] / 2),
      Math.floor(imageSize[1] / 2)
    ];
    tiles = [
      Math.ceil(imageSize[0] / ol.DEFAULT_TILE_SIZE),
      Math.ceil(imageSize[1] / ol.DEFAULT_TILE_SIZE)
    ];
    tierSizeInTiles.push(tiles);
    tierImageSize.push(imageSize);
  }

  tierSizeInTiles.reverse();
  tierImageSize.reverse();
  var numberOfTiers = tierSizeInTiles.length;
  var resolutions = [1];
  var tileCountUpToTier = [0];
  var i;
  for (i = 1; i < numberOfTiers; i++) {
    resolutions.unshift(Math.pow(2, i));
    tileCountUpToTier.push(
        tierSizeInTiles[i - 1][0] * tierSizeInTiles[i - 1][1] +
        tileCountUpToTier[i - 1]
    );
  }

  var createFromUrl = function(url) {
    var template = url + '{tileIndex}/{z}-{x}-{y}.jpg';
    return (
        /**
         * @this {ol.source.TileImage}
         * @param {ol.TileCoord} tileCoord Tile Coordinate.
         * @param {ol.proj.Projection} projection Projection.
         * @return {string|undefined} Tile URL.
         */
        function(tileCoord, projection) {
          if (goog.isNull(tileCoord)) {
            return undefined;
          } else {
            var tileIndex = tileCoord.x +
                (tileCoord.y * tierSizeInTiles[tileCoord.z][0]) +
                tileCountUpToTier[tileCoord.z];
            return template.replace('{tileIndex}', 'TileGroup' +
                Math.floor((tileIndex) / ol.DEFAULT_TILE_SIZE))
                           .replace('{z}', '' + tileCoord.z)
                           .replace('{x}', '' + tileCoord.x)
                           .replace('{y}', '' + tileCoord.y);
          }
        }
    );
  };

  /**
   * Resize small tiles. Warning : needs a good crossOrigin handling.
   *
   * @param  {ol.ImageTile} imageTile Current tile
   * @param  {String} src Src url
   */
  var tileLoadFunction = function(imageTile, src) {
    var image = imageTile.getImage();

    // Bad image size (only if correct crossOrigin handling)
    if (image.crossOrigin) {
      image.onload = function() {
        if (this.width < ol.DEFAULT_TILE_SIZE ||
            this.height < ol.DEFAULT_TILE_SIZE) {
          // Copy image data into the canvas
          var canvas = document.createElement('canvas');
          if (canvas.getContext) {
            canvas.width = ol.DEFAULT_TILE_SIZE;
            canvas.height = ol.DEFAULT_TILE_SIZE;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(this, 0, 0);

            // Change original image
            image = new Image();
            image.src = canvas.toDataURL();
          }
        }
      };
    }
    image.src = src;
  };

  var tileGrid = new ol.tilegrid.Zoomify({
    resolutions: resolutions
  });
  var tileUrlFunction = ol.TileUrlFunction.withTileCoordTransform(
      tileGrid.createTileCoordTransform({extent: [0, 0, size[0], size[1]]}),
      createFromUrl(options.url));

  goog.base(this, {
    attributions: options.attributions,
    crossOrigin: options.crossOrigin,
    logo: options.logo,
    tileGrid: tileGrid,
    tileUrlFunction: tileUrlFunction,
    tileLoadFunction: tileLoadFunction
  });

};
goog.inherits(ol.source.Zoomify, ol.source.TileImage);
