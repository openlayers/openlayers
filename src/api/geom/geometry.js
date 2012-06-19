goog.provide('ol.geom.geometry'); 

goog.require('ol.geom.Geometry');

/**
 * @export
 * @return {ol.geom.Geometry} Geometry..
 */
ol.geom.geometry = function(){
    var g = new ol.geom.Geometry();
    return g;
};
