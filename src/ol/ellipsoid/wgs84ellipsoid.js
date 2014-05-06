goog.provide('ol.ellipsoid.WGS84');

goog.require('ol.Ellipsoid');


/**
 * @const
 * @type {ol.Ellipsoid}
 * @todo api
 */
ol.ellipsoid.WGS84 = new ol.Ellipsoid(6378137, 1 / 298.257223563);
