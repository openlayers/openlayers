goog.provide('ol.layer.WMS');

goog.require('goog.Uri');
goog.require('ol.layer.TileLayer');

/**
 * Class for WMS layers.
 *
 * @export
 * @constructor
 * @extends {ol.layer.TileLayer}
 * @param {string} url The WMS URL.
 * @param {Array.<string>} layers List of layers.
 * @param {string|undefined} format Image format (e.g. "image/jpeg")
 */
ol.layer.WMS = function(url, layers, format) {
    goog.base(this);
    this.setUrl(url);

    /**
     * @private
     * @type {Array.<string>}
     */
    this.layers_ = layers;

    /**
     * @private
     * @type {string|undefined}
     */
    this.format_ = format;
};

goog.inherits(ol.layer.WMS, ol.layer.TileLayer);

/**
 * @const
 * @type {Object}
 */
ol.layer.WMS.prototype.DEFAULT_PARAMS = {
    "SERVICE": "WMS",
    "VERSION": "1.1.1",
    "REQUEST": "GetMap",
    "STYLES": "",
    "FORMAT": "image/png"
};

/**
 * @inheritDoc
 */
ol.layer.WMS.prototype.getTileUrl = function(x, y, z) {
    var tileOrigin = this.getTileOrigin(),
        tileOriginX = tileOrigin[0],
        tileOriginY = tileOrigin[1];
    var resolution = this.getResolutions()[z];
    var tileWidth = this.tileWidth_ * resolution,
        tileHeight = this.tileHeight_ * resolution;
    var minX = tileOriginX + (x * tileWidth),
        maxY = tileOriginY - (y * tileHeight),
        maxX = minX + tileWidth,
        minY = maxY - tileHeight;

    var qd = new goog.Uri.QueryData();
    qd.extend(this.DEFAULT_PARAMS);
    qd.set('WIDTH', this.tileWidth_);
    qd.set('HEIGHT', this.tileHeight_);
    qd.set('BBOX', [minX, minY, maxX, maxY].join(','));
    qd.set('LAYERS', [this.layers_].join(','));
    // FIXME this requires a projection in the layer, which should
    // not be required
    qd.set('SRS', this.projection_.getCode());
    var uri = new goog.Uri(this.getUrl());
    uri.setQueryData(qd);
    return uri.toString();
};
