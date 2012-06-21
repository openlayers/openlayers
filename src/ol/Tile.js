goog.provide('ol.Tile');

goog.require('goog.events');
goog.require('ol.Bounds');
goog.require('ol.event.Events');

/**
 * The Tile class.
 * @constructor
 * @param {string} url
 * @param {ol.Bounds} bounds
 */
ol.Tile = function(url, bounds) {

    /**
     * @private
     * @type {string}
     */
    this.url_ = url;

    /**
     * @private
     * @type {ol.Bounds}
     */
    this.bounds_ = bounds;

    /**
     * @private
     * @type {boolean}
     */
    this.loaded_ = false;

    /**
     * @private
     * @type {HTMLImageElement}
     */
    this.img_ = ol.Tile.createImage();
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
 * Load the tile.
 */
ol.Tile.prototype.load = function() {
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
 * @return {ol.Bounds}
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
    this.loaded_ = true;
    this.events_.triggerEvent('load');
};

/**
 * Handle load error event on the image.
 * @param {goog.events.BrowserEvent} evt Event.
 */
ol.Tile.prototype.handleImageError = function(evt) {
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
