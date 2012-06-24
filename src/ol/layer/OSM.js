goog.provide('ol.layer.OSM');

goog.require('ol.layer.XYZ');

/**
 * Class for OSM layers.
 *
 * @export
 * @constructor
 * @extends {ol.layer.XYZ}
 */
ol.layer.OSM = function() {
    
    //TODO Is this attribution still correct?
    /** @inheritDoc */
    this.attribution_ = "Data CC-By-SA by <a target='_blank' href='http://openstreetmap.org/'>OpenStreetMap</a>";
    
    goog.base(this, 'http://a.tile.openstreetmap.org/{z}/{x}/{y}.png');
};

goog.inherits(ol.layer.OSM, ol.layer.XYZ);
