goog.provide('ol.layer.XYZ');

goog.require('ol.layer.TileLayer');
goog.require('ol.Projection');
goog.require('ol.TileSet');

/**
 * Class for XYZ layers.
 *
 * @export
 * @constructor
 * @extends {ol.layer.TileLayer}
 * @param {string} url URL template. E.g.
 *     http://a.tile.openstreetmap.org/{z}/{x}/{y}.png.
 */
ol.layer.XYZ = function(url) {

    goog.base(this);

    this.setUrl(url);
    this.setProjection(new ol.Projection("EPSG:3857"));
    this.setNumZoomLevels(22);
};

goog.inherits(ol.layer.XYZ, ol.layer.TileLayer);

