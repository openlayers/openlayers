goog.provide('ol.Tile');

/**
 * @constructor
 */
ol.Tile = function() {

    /**
     * @private
     */
    this.img_ = ol.Tile.createImage();
};

/**
 * Load the tile for a given URL.
 * @param {string} src The src URL.
 */
ol.Tile.prototype.load = function(src) {
    this.setImgSrc(src);
};

/**
 * Set the image src.
 * @param {string|undefined} src The src URL.
 * @return {ol.Tile}
 */
ol.Tile.prototype.setImgSrc = function(src) {
    this.img_.src = src;
    return this;
};

/**
 * Get the image node.
 * @return {Element}
 */
ol.Tile.prototype.getImg = function() {
    return this.img_;
};

/**
 * Create an image node. This is done by cloning
 * an image template.
 * @return {Element}
 */
ol.Tile.createImage = (function() {
    var img = document.createElement("img");
    return function() {
        return img.cloneNode(false);
    };
})();
