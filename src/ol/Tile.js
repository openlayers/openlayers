goog.provide('ol.Tile');

goog.require('ol.Bounds');

goog.require('goog.events.EventTarget');
goog.require('goog.events');
goog.require('goog.asserts');

/**
 * The Tile class.
 * @constructor
 * @extends {goog.events.EventTarget}
 * @param {string} url
 * @param {ol.Bounds|undefined} opt_bounds
 */
ol.Tile = function(url, opt_bounds) {

    /**
     * @private
     * @type {string}
     */
    this.url_ = url;

    /**
     * @private
     * @type {ol.Bounds|undefined}
     */
    this.bounds_ = opt_bounds;

    /**
     * @private
     * @type {boolean}
     */
    this.loaded_ = false;

    /**
     * @private
     * @type {boolean}
     */
    this.loading_ = false;

    /**
     * @private
     * @type {HTMLImageElement}
     */
    this.img_ = this.createImage();
    goog.events.listenOnce(this.img_, goog.events.EventType.LOAD,
                           this.handleImageLoad, false, this);
    goog.events.listenOnce(this.img_, goog.events.EventType.ERROR,
                           this.handleImageError, false, this);
};
goog.inherits(ol.Tile, goog.events.EventTarget);

/**
 * @protected
 * @return {HTMLImageElement}
 */
ol.Tile.prototype.createImage = function() {
    // overriden by subclasses
};

/**
 * Load the tile. A tile should loaded only once.
 */
ol.Tile.prototype.load = function() {
    goog.asserts.assert(!this.loaded_ && !this.loading_);
    this.loading_ = true;
    this.img_.src = this.url_;
};

/**
 * Get the tile url.
 * @return {string}
 */
ol.Tile.prototype.getUrl = function() {
    return this.url_;
};

/**
 * Get the tile bounds.
 * @return {ol.Bounds|undefined}
 */
ol.Tile.prototype.getBounds = function() {
    return this.bounds_;
};

/**
 * Get the tile image.
 * @return {HTMLImageElement}
 */
ol.Tile.prototype.getImg = function() {
    return this.img_;
};

/**
 * Handle load event on the image.
 * @param {goog.events.BrowserEvent} evt Event.
 */
ol.Tile.prototype.handleImageLoad = function(evt) {
    this.loading_ = false;
    this.loaded_ = true;
    this.img_.style.visibility = "inherit";
    this.img_.style.opacity = 1; // TODO: allow for layer opacity
    goog.events.dispatchEvent(this, 'load');
};

/**
 * Handle load error event on the image.
 * @param {goog.events.BrowserEvent} evt Event.
 */
ol.Tile.prototype.handleImageError = function(evt) {
    this.loading_ = false;
    goog.events.dispatchEvent(this, 'error');
};

/**
 * Is the tile loaded already?
 * @return {boolean}
 */
ol.Tile.prototype.isLoaded = function() {
    return this.loaded_;
};

/**
 * Is the tile being loaded?
 * @return {boolean}
 */
ol.Tile.prototype.isLoading = function() {
    return this.loading_;
};

/**
 *
 */
ol.Tile.prototype.destroy = function() {
    goog.events.dispatchEvent(this, 'destroy');
};

/**
 * Create a tile constructor, for specific width and height values
 * for the tiles.
 * @param {number} width
 * @param {number} height
 * @return {function(new:ol.Tile, string, ol.Bounds=)}
 */
ol.Tile.createConstructor = function(width, height) {
    /**
     * @constructor
     * @extends {ol.Tile}
     */
    var Tile = function(url, opt_bounds) {
        goog.base(this, url, opt_bounds);
    };
    goog.inherits(Tile, ol.Tile);
    /** @inheritDoc */
    Tile.prototype.createImage = (function() {
        var img = document.createElement("img");
        img.className = "olTile";
        img.style.position = "absolute";
        img.style.width = width + "px";
        img.style.height = height + "px";
        img.style.opacity = 0;
        img.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
        return function() {
            return img.cloneNode(false);
        };
    })();
    return Tile;
};
