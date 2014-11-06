goog.provide('ol.renderer.webgl.Atlas');
goog.provide('ol.renderer.webgl.AtlasManager');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.object');


/**
 * @typedef {{offsetX: number, offsetY: number, image: HTMLCanvasElement}}
 */
ol.renderer.webgl.AtlasInfo;



/**
 * Manages the creation of texture atlases.
 *
 * Images added to this manager will be inserted into an atlas, which
 * will be used for rendering.
 * The `size` given in the constructor is the size for the first
 * atlas. After that, when new atlases are created, they will have
 * twice the size as the latest atlas (until `maxSize` is reached.)
 *
 * It is recommended to use `ol.has.WEBGL_MAX_TEXTURE_SIZE` as
 * `maxSize` value.
 *
 * @constructor
 * @struct
 * @param {number=} opt_size The size in pixels of the first atlas image
 *      (default: 256).
 * @param {number=} opt_maxSize The maximum size in pixels of atlas images
 *      (default: 2048).
 * @param {number=} opt_space The space in pixels between images
 *      (default: 1).
 */
ol.renderer.webgl.AtlasManager = function(opt_size, opt_maxSize, opt_space) {

  /**
   * The size in pixels of the latest atlas image.
   * @private
   * @type {number}
   */
  this.currentSize_ = goog.isDef(opt_size) ? opt_size : 256;

  /**
   * The maximum size in pixels of atlas images.
   * @private
   * @type {number}
   */
  this.maxSize_ = goog.isDef(opt_maxSize) ? opt_maxSize : 2048;

  /**
   * The size in pixels between images.
   * @private
   * @type {number}
   */
  this.space_ = goog.isDef(opt_space) ? opt_space : 1;

  /**
   * @private
   * @type {Array.<ol.renderer.webgl.Atlas>}
   */
  this.atlases_ = [new ol.renderer.webgl.Atlas(this.currentSize_, this.space_)];
};


/**
 * @param {string} id The identifier of the entry to check.
 * @return {ol.renderer.webgl.AtlasInfo}
 */
ol.renderer.webgl.AtlasManager.prototype.getInfo = function(id) {
  var atlas, info;
  for (var i = 0, ii = this.atlases_.length; i < ii; i++) {
    atlas = this.atlases_[i];
    info = atlas.get(id);
    if (info !== null) {
      return info;
    }
  }
  return null;
};


/**
 * Add an image to the atlas manager.
 *
 * If an entry for the given id already exists, the entry will
 * be overridden (but the space on the atlas graphic will not be freed).
 *
 * @param {string} id The identifier of the entry to add.
 * @param {number} width The width.
 * @param {number} height The height.
 * @param {function(*)} renderCallback Called to render the new sprite entry
 *  onto the sprite image.
 * @param {object=} opt_this Value to use as `this` when executing
 * `renderCallback`.
 * @return {ol.renderer.webgl.AtlasInfo}
 */
ol.renderer.webgl.AtlasManager.prototype.add =
    function(id, width, height, renderCallback, opt_this) {
  if (width + this.space_ > this.maxSize_ ||
      height + this.space_ > this.maxSize_) {
    return null;
  }

  var atlas, info;
  for (var i = 0, ii = this.atlases_.length; i < ii; i++) {
    atlas = this.atlases_[i];
    info = atlas.add(id, width, height, renderCallback, opt_this);
    if (info !== null) {
      return info;
    } else if (info === null && i === ii - 1) {
      // the entry could not be added to one of the existing atlases,
      // create a new atlas that is twice as big and try to add to this one.
      this.currentSize_ = Math.min(this.currentSize_ * 2, this.maxSize_);
      atlas = new ol.renderer.webgl.Atlas(this.currentSize_, this.space_);
      this.atlases_.push(atlas);
      ii++;
    }
  }
};



/**
 * This class facilitates the creation of texture atlases.
 *
 * Images added to an atlas will be rendered onto a single
 * atlas canvas. The distribution of images on the canvas are
 * managed with the bin packing algorithm described in:
 * http://www.blackpawn.com/texts/lightmaps/
 *
 * @constructor
 * @struct
 * @param {number} size The size in pixels of the sprite images.
 * @param {number} space The space in pixels between images.
 */
ol.renderer.webgl.Atlas = function(size, space) {

  /**
   * @private
   * @type {number} The space in pixels between images.
   * Because texture coordinates are float values, the edges of
   * texture might not be completely correct (in a way that the
   * edges overlap when being rendered). To avoid this we add a
   * padding around each image.
   */
  this.space_ = space;

  /**
   * @private
   * @type {Array.<ol.renderer.webgl.Atlas.Block>}
   */
  this.emptyBlocks_ = [{x: 0, y: 0, width: size, height: size}];

  /**
   * @private
   * @type {Object.<number, ol.renderer.webgl.AtlasInfo>}
   */
  this.entries_ = {};

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = /** @type {HTMLCanvasElement} */
      (goog.dom.createElement(goog.dom.TagName.CANVAS));
  this.canvas_.width = size;
  this.canvas_.height = size;

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.context_ = /** @type {CanvasRenderingContext2D} */
      (this.canvas_.getContext('2d'));
};


/**
 * @param {string} id The identifier of the entry to check.
 * @return {ol.renderer.webgl.AtlasInfo}
 */
ol.renderer.webgl.Atlas.prototype.get = function(id) {
  return goog.object.get(this.entries_, id, null);
};


/**
 * @param {string} id The identifier of the entry to add.
 * @param {number} width The width.
 * @param {number} height The height.
 * @param {function(*)} renderCallback Called to render the new sprite entry
 *  onto the sprite image.
 * @param {object=} opt_this Value to use as `this` when executing
 * `renderCallback`.
 * @return {ol.renderer.webgl.AtlasInfo}
 */
ol.renderer.webgl.Atlas.prototype.add =
    function(id, width, height, renderCallback, opt_this) {
  var block;
  for (var i = 0, ii = this.emptyBlocks_.length; i < ii; i++) {
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
 * @param {ol.renderer.webgl.Atlas.Block} block The block to split.
 * @param {number} width The width of the entry to insert.
 * @param {number} height The height of the entry to insert.
 */
ol.renderer.webgl.Atlas.prototype.split_ =
    function(index, block, width, height) {
  var deltaWidth = block.width - width;
  var deltaHeight = block.height - height;

  /** @type {ol.renderer.webgl.AtlasInfo} */
  var newBlock1, newBlock2;

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
 * @param {ol.renderer.webgl.Atlas.Block} newBlock1 The 1st block to add.
 * @param {ol.renderer.webgl.Atlas.Block} newBlock2 The 2nd block to add.
 */
ol.renderer.webgl.Atlas.prototype.updateBlocks_ =
    function(index, newBlock1, newBlock2) {
  var args = [index, 1];
  if (newBlock1.width > 0 && newBlock1.height > 0) {
    args.push(newBlock1);
  }
  if (newBlock2.width > 0 && newBlock2.height > 0) {
    args.push(newBlock2);
  }
  this.emptyBlocks_.splice.apply(this.emptyBlocks_, args);
};


/**
 * @typedef {{x: number, y: number, width: number, height: number}}
 */
ol.renderer.webgl.Atlas.Block;
