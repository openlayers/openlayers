goog.provide('ol.geom.point'); 

goog.require('ol.geom.Point');
goog.require('ol.projection');

/**
 * @typedef {Array.<number>|Object} point Point.
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


/**
 * @export
 * @param {number=} opt_arg X.
 * @return {ol.geom.Point|number} Result.
 */
ol.geom.Point.prototype.x = function(opt_arg){
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        this.setX(opt_arg);
        return this;
    }
    else {
        return this.getX();
    }
};


/**
 * @export
 * @param {number=} opt_arg Y.
 * @return {ol.geom.Point|number} Result.
 */
ol.geom.Point.prototype.y = function(opt_arg){
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        this.setY(opt_arg);
        return this;
    }
    else {
        return this.getY();
    }
};


/**
 * @export
 * @param {number=} opt_arg Z.
 * @return {ol.geom.Point|number|undefined} Result.
 */
ol.geom.Point.prototype.z = function(opt_arg){
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        this.setZ(opt_arg);
        return this;
    }
    else {
        return this.getZ();
    }
};

/**
 * @export
 * @param {ol.Projection=} opt_arg Projection.
 * @return {ol.geom.Point|ol.Projection|undefined} Result.
 */
ol.geom.Point.prototype.projection = function(opt_arg){
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        this.setProjection(ol.projection(opt_arg));
        return this;
    }
    else {
        return this.getProjection();
    }
};