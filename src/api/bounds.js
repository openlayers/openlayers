goog.provide('ol.bounds');

goog.require('ol.Bounds');
goog.require('ol.projection');


/**
 * @typedef {ol.Bounds|Array.<number>|Object} bounds Location.
 */
ol.LocLike;



/**
 * @export
 * @param {ol.LocLike} opt_arg Location.
 * @return {ol.Bounds} Location.
 */
ol.bounds = function(opt_arg){

    if (opt_arg instanceof ol.Bounds) {
        return opt_arg;
    }

    var minX = 0;
    var minY = 0;
    var maxX = 0;
    var maxY = 0;
    var projection;

    if (goog.isArray(opt_arg)) {
        minX = opt_arg[0];
        minY = opt_arg[1];
        maxX = opt_arg[2];
        maxY = opt_arg[3];
    } else if (goog.isObject(opt_arg)) {
        minX = opt_arg['minX'];
        minY = opt_arg['minY'];
        maxX = opt_arg['maxX'];
        maxY = opt_arg['maxY'];
        projection = ol.projection(opt_arg['projection']);
    }
    else {
        throw new Error('ol.bounds');
    }

    var bounds = new ol.Bounds(minX, minY, maxX, maxY, projection);
    return bounds;

};


/**
 * @export
 * @param {ol.Projection=} opt_arg Projection.
 * @return {ol.Bounds|ol.Projection|undefined} Result.
 */
ol.Bounds.prototype.projection = function(opt_arg){
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        return this.setProjection(opt_arg);
    }
    else {
        return this.getProjection();
    }
};


/**
 * @export
 * @param {number=} opt_arg Minimum X.
 * @return {ol.Bounds|number} Result.
 */
ol.Bounds.prototype.minX = function(opt_arg){
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        return this.setMinX(opt_arg);
    }
    else {
        return this.getMinX();
    }
};


/**
 * @export
 * @param {number=} opt_arg Minimum Y.
 * @return {ol.Bounds|number} Result.
 */
ol.Bounds.prototype.minY = function(opt_arg){
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        return this.setMinY(opt_arg);
    }
    else {
        return this.getMinY();
    }
};


/**
 * @export
 * @param {number=} opt_arg Maximum X.
 * @return {ol.Bounds|number} Result.
 */
ol.Bounds.prototype.maxX = function(opt_arg){
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        return this.setMaxX(opt_arg);
    }
    else {
        return this.getMaxX();
    }
};


/**
 * @export
 * @param {number=} opt_arg Maximum Y.
 * @return {ol.Bounds|number} Result.
 */
ol.Bounds.prototype.maxY = function(opt_arg){
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        return this.setMaxY(opt_arg);
    }
    else {
        return this.getMaxY();
    }
};
