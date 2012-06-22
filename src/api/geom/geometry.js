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

/**
 * @export
 * @param {ol.Bounds=} opt_arg new Bounds.
 * @return {ol.geom.Geometry|ol.Bounds|undefined} either a Geometry (when used as 
 *     setter) or a Bounds/undefined (if used as getter).
 */
ol.geom.Geometry.prototype.bounds = function(opt_arg) {
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        return this.setBounds(opt_arg);
    } else {
        return this.getBounds();
    }
};
