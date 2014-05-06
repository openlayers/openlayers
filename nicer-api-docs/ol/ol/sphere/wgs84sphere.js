goog.provide('ol.sphere.WGS84');

goog.require('ol.Sphere');


/**
 * A sphere with radius equal to the semi-major axis of the WGS84 ellipsoid.
 * @const
 * @type {ol.Sphere}
 * @todo api
 */
ol.sphere.WGS84 = new ol.Sphere(6378137);
