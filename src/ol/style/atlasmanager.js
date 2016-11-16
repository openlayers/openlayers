goog.provide('ol.style.AtlasManager');
goog.provide('ol.style.Atlas');

goog.require('ol');
goog.require('ol.dom');


/**
 * Manages the creation of image atlases.
 *
 * Images added to this manager will be inserted into an atlas, which
 * will be used for rendering.
 * The `size` given in the constructor is the size for the first
 * atlas. After that, when new atlases are created, they will have
 * twice the size as the latest atlas (until `maxSize` is reached).
 *
 * If an application uses many images or very large images, it is recommended
 * to set a higher `size` value to avoid the creation of too many atlases.
 *
 * @constructor
 * @struct
 * @api
 * @param {olx.style.AtlasManagerOptions=} opt_options Options.
 */
ol.style.AtlasManager = function(opt_options) {

  var options = opt_options || {};

  /**
   * The size in pixels of the latest atlas image.
   * @private
   * @type {number}
   */
  this.currentSize_ = options.initialSize !== undefined ?
      options.initialSize : ol.INITIAL_ATLAS_SIZE;

  /**
   * The maximum size in pixels of atlas images.
   * @private
   * @type {number}
   */
  this.maxSize_ = options.maxSize !== undefined ?
      options.maxSize : ol.MAX_ATLAS_SIZE != -1 ?
          ol.MAX_ATLAS_SIZE : ol.WEBGL_MAX_TEXTURE_SIZE !== undefined ?
              ol.WEBGL_MAX_TEXTURE_SIZE : 2048;

  /**
   * The size in pixels between images.
   * @private
   * @type {number}
   */
  this.space_ = options.space !== undefined ? options.space : 1;

  /**
   * @private
   * @type {Array.<ol.style.Atlas>}
   */
  this.atlases_ = [new ol.style.Atlas(this.currentSize_, this.space_)];

  /**
   * The size in pixels of the latest atlas image for hit-detection images.
   * @private
   * @type {number}
   */
  this.currentHitSize_ = this.currentSize_;

  /**
   * @private
   * @type {Array.<ol.style.Atlas>}
   */
  this.hitAtlases_ = [new ol.style.Atlas(this.currentHitSize_, this.space_)];
};


/**
 * @param {string} id The identifier of the entry to check.
 * @return {?ol.AtlasManagerInfo} The position and atlas image for the
 *    entry, or `null` if the entry is not part of the atlas manager.
 */
ol.style.AtlasManager.prototype.getInfo = function(id) {
  /** @type {?ol.AtlasInfo} */
  var info = this.getInfo_(this.atlases_, id);

  if (!info) {
    return null;
  }
  var hitInfo = /** @type {ol.AtlasInfo} */ (this.getInfo_(this.hitAtlases_, id));

  return this.mergeInfos_(info, hitInfo);
};


/**
 * @private
 * @param {Array.<ol.style.Atlas>} atlases The atlases to search.
 * @param {string} id The identifier of the entry to check.
 * @return {?ol.AtlasInfo} The position and atlas image for the entry,
 *    or `null` if the entry is not part of the atlases.
 */
ol.style.AtlasManager.prototype.getInfo_ = function(atlases, id) {
  var atlas, info, i, ii;
  for (i = 0, ii = atlases.length; i < ii; ++i) {
    atlas = atlases[i];
    info = atlas.get(id);
    if (info) {
      return info;
    }
  }
  return null;
};


/**
 * @private
 * @param {ol.AtlasInfo} info The info for the real image.
 * @param {ol.AtlasInfo} hitInfo The info for the hit-detection
 *    image.
 * @return {?ol.AtlasManagerInfo} The position and atlas image for the
 *    entry, or `null` if the entry is not part of the atlases.
 */
ol.style.AtlasManager.prototype.mergeInfos_ = function(info, hitInfo) {
  goog.DEBUG && console.assert(info.offsetX === hitInfo.offsetX,
      'in order to merge, offsetX of info and hitInfo must be equal');
  goog.DEBUG && console.assert(info.offsetY === hitInfo.offsetY,
      'in order to merge, offsetY of info and hitInfo must be equal');
  return /** @type {ol.AtlasManagerInfo} */ ({
    offsetX: info.offsetX,
    offsetY: info.offsetY,
    image: info.image,
    hitImage: hitInfo.image
  });
};


/**
 * Add an image to the atlas manager.
 *
 * If an entry for the given id already exists, the entry will
 * be overridden (but the space on the atlas graphic will not be freed).
 *
 * If `renderHitCallback` is provided, the image (or the hit-detection version
 * of the image) will be rendered into a separate hit-detection atlas image.
 *
 * @param {string} id The identifier of the entry to add.
 * @param {number} width The width.
 * @param {number} height The height.
 * @param {function(CanvasRenderingContext2D, number, number)} renderCallback
 *    Called to render the new image onto an atlas image.
 * @param {function(CanvasRenderingContext2D, number, number)=}
 *    opt_renderHitCallback Called to render a hit-detection image onto a hit
 *    detection atlas image.
 * @param {Object=} opt_this Value to use as `this` when executing
 *    `renderCallback` and `renderHitCallback`.
 * @return {?ol.AtlasManagerInfo}  The position and atlas image for the
 *    entry, or `null` if the image is too big.
 */
ol.style.AtlasManager.prototype.add = function(id, width, height,
        renderCallback, opt_renderHitCallback, opt_this) {
  if (width + this.space_ > this.maxSize_ ||
      height + this.space_ > this.maxSize_) {
    return null;
  }

  /** @type {?ol.AtlasInfo} */
  var info = this.add_(false,
      id, width, height, renderCallback, opt_this);
  if (!info) {
    return null;
  }

  // even if no hit-detection entry is requested, we insert a fake entry into
  // the hit-detection atlas, to make sure that the offset is the same for
  // the original image and the hit-detection image.
  var renderHitCallback = opt_renderHitCallback !== undefined ?
      opt_renderHitCallback : ol.nullFunction;

  var hitInfo = /** @type {ol.AtlasInfo} */ (this.add_(true,
      id, width, height, renderHitCallback, opt_this));

  return this.mergeInfos_(info, hitInfo);
};


/**
 * @private
 * @param {boolean} isHitAtlas If the hit-detection atlases are used.
 * @param {string} id The identifier of the entry to add.
 * @param {number} width The width.
 * @param {number} height The height.
 * @param {function(CanvasRenderingContext2D, number, number)} renderCallback
 *    Called to render the new image onto an atlas image.
 * @param {Object=} opt_this Value to use as `this` when executing
 *    `renderCallback` and `renderHitCallback`.
 * @return {?ol.AtlasInfo}  The position and atlas image for the entry,
 *    or `null` if the image is too big.
 */
ol.style.AtlasManager.prototype.add_ = function(isHitAtlas, id, width, height,
        renderCallback, opt_this) {
  var atlases = (isHitAtlas) ? this.hitAtlases_ : this.atlases_;
  var atlas, info, i, ii;
  for (i = 0, ii = atlases.length; i < ii; ++i) {
    atlas = atlases[i];
    info = atlas.add(id, width, height, renderCallback, opt_this);
    if (info) {
      return info;
    } else if (!info && i === ii - 1) {
      // the entry could not be added to one of the existing atlases,
      // create a new atlas that is twice as big and try to add to this one.
      var size;
      if (isHitAtlas) {
        size = Math.min(this.currentHitSize_ * 2, this.maxSize_);
        this.currentHitSize_ = size;
      } else {
        size = Math.min(this.currentSize_ * 2, this.maxSize_);
        this.currentSize_ = size;
      }
      atlas = new ol.style.Atlas(size, this.space_);
      atlases.push(atlas);
      // run the loop another time
      ++ii;
    }
  }
  goog.DEBUG && console.assert(false, 'Failed to add to atlasmanager');
  return null;
};


/**
 * This class facilitates the creation of image atlases.
 *
 * Images added to an atlas will be rendered onto a single
 * atlas canvas. The distribution of images on the canvas is
 * managed with the bin packing algorithm described in:
 * http://www.blackpawn.com/texts/lightmaps/
 *
 * @constructor
 * @struct
 * @param {number} size The size in pixels of the sprite image.
 * @param {number} space The space in pixels between images.
 *    Because texture coordinates are float values, the edges of
 *    images might not be completely correct (in a way that the
 *    edges overlap when being rendered). To avoid this we add a
 *    padding around each image.
 */
ol.style.Atlas = function(size, space) {

  /**
   * @private
   * @type {number}
   */
  this.space_ = space;

  /**
   * @private
   * @type {Array.<ol.AtlasBlock>}
   */
  this.emptyBlocks_ = [{x: 0, y: 0, width: size, height: size}];

  /**
   * @private
   * @type {Object.<string, ol.AtlasInfo>}
   */
  this.entries_ = {};

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.context_ = ol.dom.createCanvasContext2D(size, size);

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = this.context_.canvas;
};


/**
 * @param {string} id The identifier of the entry to check.
 * @return {?ol.AtlasInfo} The atlas info.
 */
ol.style.Atlas.prototype.get = function(id) {
  return this.entries_[id] || null;
};


/**
 * @param {string} id The identifier of the entry to add.
 * @param {number} width The width.
 * @param {number} height The height.
 * @param {function(CanvasRenderingContext2D, number, number)} renderCallback
 *    Called to render the new image onto an atlas image.
 * @param {Object=} opt_this Value to use as `this` when executing
 *    `renderCallback`.
 * @return {?ol.AtlasInfo} The position and atlas image for the entry.
 */
ol.style.Atlas.prototype.add = function(id, width, height, renderCallback, opt_this) {
  var block, i, ii;
  for (i = 0, ii = this.emptyBlocks_.length; i < ii; ++i) {
    block = this.emptyBlocks_[i];
    if (block.width >= width + this.space_ &&
        block.height >= height + this.space_) {
      // we found a block that is big enough for our entry
      var entry = {
        offsetX: block.x + this.space_,
        offsetY: block.y + this.space_,
        image: this.canvas_
      };
      this.entries_[id] = entry;

      // render the image on the atlas image
      renderCallback.call(opt_this, this.context_,
          block.x + this.space_, block.y + this.space_);

      // split the block after the insertion, either horizontally or vertically
      this.split_(i, block, width + this.space_, height + this.space_);

      return entry;
    }
  }

  // there is no space for the new entry in this atlas
  return null;
};


/**
 * @private
 * @param {number} index The index of the block.
 * @param {ol.AtlasBlock} block The block to split.
 * @param {number} width The width of the entry to insert.
 * @param {number} height The height of the entry to insert.
 */
ol.style.Atlas.prototype.split_ = function(index, block, width, height) {
  var deltaWidth = block.width - width;
  var deltaHeight = block.height - height;

  /** @type {ol.AtlasBlock} */
  var newBlock1;
  /** @type {ol.AtlasBlock} */
  var newBlock2;

  if (deltaWidth > deltaHeight) {
    // split vertically
    // block right of the inserted entry
    newBlock1 = {
      x: block.x + width,
      y: block.y,
      width: block.width - width,
      height: block.height
    };

    // block below the inserted entry
    newBlock2 = {
      x: block.x,
      y: block.y + height,
      width: width,
      height: block.height - height
    };
    this.updateBlocks_(index, newBlock1, newBlock2);
  } else {
    // split horizontally
    // block right of the inserted entry
    newBlock1 = {
      x: block.x + width,
      y: block.y,
      width: block.width - width,
      height: height
    };

    // block below the inserted entry
    newBlock2 = {
      x: block.x,
      y: block.y + height,
      width: block.width,
      height: block.height - height
    };
    this.updateBlocks_(index, newBlock1, newBlock2);
  }
};


/**
 * Remove the old block and insert new blocks at the same array position.
 * The new blocks are inserted at the same position, so that splitted
 * blocks (that are potentially smaller) are filled first.
 * @private
 * @param {number} index The index of the block to remove.
 * @param {ol.AtlasBlock} newBlock1 The 1st block to add.
 * @param {ol.AtlasBlock} newBlock2 The 2nd block to add.
 */
ol.style.Atlas.prototype.updateBlocks_ = function(index, newBlock1, newBlock2) {
  var args = [index, 1];
  if (newBlock1.width > 0 && newBlock1.height > 0) {
    args.push(newBlock1);
  }
  if (newBlock2.width > 0 && newBlock2.height > 0) {
    args.push(newBlock2);
  }
  this.emptyBlocks_.splice.apply(this.emptyBlocks_, args);
};
