goog.provide('ol.sphere.WGS84');

goog.require('ol.Sphere');


/**
 * A sphere with radius equal to the semi-major axis of the WGS84 ellipsoid.
 * This is the same radius as used for the EPSG:3857 projection.
 * @const
 * @type {ol.Sphere}
 */
ol.sphere.WGS84 = new ol.Sphere(6378137);
