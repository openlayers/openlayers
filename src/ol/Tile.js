goog.provide('ol.Tile');

goog.require('goog.events');
goog.require('goog.asserts');
goog.require('ol.Bounds');
goog.require('ol.event.Events');

/**
 * The Tile class.
 * @constructor
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

    /**
     * @private
     * @type {ol.event.Events}
     */
    this.events_ = new ol.event.Events(this);
};

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
    goog.asserts.assert(!this.loaded && !this.loading_);
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
    this.events_.triggerEvent('load');
};

/**
 * Handle load error event on the image.
 * @param {goog.events.BrowserEvent} evt Event.
 */
ol.Tile.prototype.handleImageError = function(evt) {
    this.loading_ = false;
    this.events_.triggerEvent('error');
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
    this.events_.triggerEvent('destroy');
};

/**
 * Create an image node. This is done by cloning
 * the same image element.
 * @return {HTMLImageElement}
 */
ol.Tile.createImage = (function() {
    var img = document.createElement("img");
    img.className = "olTile";
    return function() {
        return img.cloneNode(false);
    };
})();

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
        img.style.width = width + "px";
        img.style.height = height + "px";
        return function() {
            return img.cloneNode(false);
        };
    })();
    return Tile;
};
