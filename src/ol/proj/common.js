goog.provide('ol.proj.common');

goog.require('ol.proj');


/**
 * Deprecated.  Transforms between EPSG:4326 and EPSG:3857 are now included by
 * default.  There is no need to call this function in application code and it
 * will be removed in a future major release.
 * @deprecated This function is no longer necessary.
 * @api
 */
ol.proj.common.add = ol.proj.addCommon;
