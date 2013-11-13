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
 * @param {ol.source.ZoomifyOptions} options Zoomify options.
 * @todo stability experimental
 */
ol.source.Zoomify = function(options) {

  /**
   * Prefix of URL template.
   * @private
   * @type {!string}
   */
  this.url_ = options.url;

  /**
   * Size of the image.
   * @private
   * @type {ol.Size}
   */
  this.size_ = options.size;

  /**
   * Depth of the Zoomify pyramid, number of tiers (zoom levels).
   * @private
   * @type {number}
   */
  this.numberOfTiers_ = 0;

  /**
   * Number of tiles up to the given tier of pyramid.
   * @private
   * @type {Array.<number>}
   */
  this.tileCountUpToTier_ = null;

  /**
   * Size (in tiles) for each tier of pyramid.
   * @private
   * @type {Array.<ol.Size>}
   */
  this.tierSizeInTiles_ = null;

  /**
   * Image size in pixels for each pyramid tier.
   * @private
   * @type {Array.<ol.Size>}
   */
  this.tierImageSize_ = null;

  var imageSize = [].concat(this.size_);
  var tiles = [
    Math.ceil(this.size_[0] / ol.DEFAULT_TILE_SIZE),
    Math.ceil(this.size_[1] / ol.DEFAULT_TILE_SIZE)
  ];
  this.tierSizeInTiles_ = [tiles];
  this.tierImageSize_ = [imageSize];

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
    this.tierSizeInTiles_.push(tiles);
    this.tierImageSize_.push(imageSize);
  }

  this.tierSizeInTiles_.reverse();
  this.tierImageSize_.reverse();
  this.numberOfTiers_ = this.tierSizeInTiles_.length;
  var resolutions = [1];
  this.tileCountUpToTier_ = [0];
  for (var i = 1; i < this.numberOfTiers_; i++) {
    resolutions.unshift(Math.pow(2, i));
    this.tileCountUpToTier_.push(
        this.tierSizeInTiles_[i - 1][0] * this.tierSizeInTiles_[i - 1][1] +
        this.tileCountUpToTier_[i - 1]
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
                (tileCoord.y * this.tierSizeInTiles_[tileCoord.z][0]) +
                this.tileCountUpToTier_[tileCoord.z];
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
            image = new Image() ;
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
      tileGrid.createTileCoordTransform(),
      createFromUrl(this.url_));


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
