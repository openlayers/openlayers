goog.provide('ol.sphere.NORMAL');

goog.require('ol.Sphere');


/**
 * The normal sphere. 10 metres different to the commonly used 6371007
 * for the WGS84 authalic radius.
 * @const
 * @type {ol.Sphere}
 */
ol.sphere.NORMAL = new ol.Sphere(6370997);
