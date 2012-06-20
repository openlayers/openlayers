goog.provide('ol.geom.point'); 

goog.require('ol.geom.Point');
goog.require('ol.projection');

/**
 * @typedef {ol.PointLike|Array.<number>|Object} point Point.
 */
ol.PointLike;

/**
 * @export
 * @param {ol.PointLike} opt_arg Point.
 * @return {ol.geom.Point} Point.
 */
ol.geom.point = function(opt_arg){
    
    if (opt_arg instanceof ol.geom.Point) {
        return opt_arg;
    }
    
    var x = 0;
    var y = 0;
    var z;
    var projection;
    
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        if (goog.isArray(opt_arg)) {
            x = opt_arg[0];
            y = opt_arg[1];
            z = opt_arg[2];
            projection = opt_arg[3];
            
        } else if (goog.isObject(opt_arg)) {
            x = opt_arg.x;
            y = opt_arg.y;
            z = opt_arg.z;
            projection = opt_arg.projection;
        } else {
            throw new Error('ol.geom.point');
        }
    }
    if (goog.isDef(projection)) {
        projection = ol.projection(projection);
    }
    
    var p = new ol.geom.Point(x,y,z,projection);
    return p;
};
goog.inherits(ol.geom.point, ol.geom.geometry);