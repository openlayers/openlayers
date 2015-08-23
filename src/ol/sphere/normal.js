goog.provide('ol.sphere.NORMAL');

goog.require('ol.Sphere');


/**
 * The "normal" sphere.
 * Radius of a sphere of equal area or 'Authalic' to
 * the NAD27 / Clarke 1866 ellipsoid.
 * NAD27 is commonly used in the USA.
 * @const
 * @type {ol.Sphere}
 */
ol.sphere.NORMAL = new ol.Sphere(6370997);
