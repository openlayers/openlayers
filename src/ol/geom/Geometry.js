goog.provide('ol.geom.Geometry'); 

goog.require('ol.Bounds');

/**
 * Creates ol.Geometry objects.
 * 
 * @constructor
 */
ol.geom.Geometry = function() {
    
    /**
     * @private
     * @type {ol.Bounds|undefined}
     */
    this.bounds_ = undefined;
};





/**
 * @return {ol.Bounds|undefined} The ol.Bounds.
 */
ol.geom.Geometry.prototype.getBounds = function() {
    return this.bounds_;
};

/**
 * @param {ol.Bounds} bounds The new ol.Bounds.
 * @return {ol.geom.Geometry} This.
 */
ol.geom.Geometry.prototype.setBounds = function(bounds) {
    this.bounds_ = bounds;
    return this;
};

/**
 * @export
 * @param {ol.Bounds=} opt_arg new Bounds.
 * @return {ol.geom.Geometry|ol.Bounds|undefined} either a Geometry (when used as 
 *     setter) or a Bounds/undefined (if used as getter).
 */
ol.geom.Geometry.prototype.bounds = function(opt_arg){
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        return this.setBounds(opt_arg);
    } else {
        return this.getBounds();
    }
};