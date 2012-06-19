goog.provide('ol.loc');

goog.require('ol.Loc');
goog.require('ol.projection');


/**
 * @typedef {ol.Loc|Array.<number>|Object} loc Location.
 */
ol.LocLike;



/**
 * @export
 * @param {ol.LocLike} opt_arg Location.
 * @return {ol.Loc} Location.
 */
ol.loc = function(opt_arg){

    if (opt_arg instanceof ol.Loc) {
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
            x = opt_arg['x'];
            y = opt_arg['y'];
            z = opt_arg['z'];
            projection = opt_arg['projection'];
        } else {
            throw new Error('ol.loc');
        }
    }

    if (goog.isDef(projection)) {
        projection = ol.projection(projection);
    }
    
    var loc = new ol.Loc();
    loc.setX(x);
    loc.setY(y);
    loc.setZ(z);
    loc.setProjection(projection);
    return loc;
    
};


/**
 * @export
 * @param {ol.Projection=} opt_arg Projection.
 * @return {ol.Loc|ol.Projection|undefined} Result.
 */
ol.Loc.prototype.projection = function(opt_arg){
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        return this.setProjection(ol.projection(opt_arg));
    }
    else {
        return this.getProjection();
    }
};


/**
 * @export
 * @param {number=} opt_arg X.
 * @return {ol.Loc|number} Result.
 */
ol.Loc.prototype.x = function(opt_arg){
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        return this.setX(opt_arg);
    }
    else {
        return this.getX();
    }
};


/**
 * @export
 * @param {number=} opt_arg Y.
 * @return {ol.Loc|number} Result.
 */
ol.Loc.prototype.y = function(opt_arg){
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        return this.setY(opt_arg);
    }
    else {
        return this.getY();
    }
};


/**
 * @export
 * @param {number=} opt_arg Z.
 * @return {ol.Loc|number|undefined} Result.
 */
ol.Loc.prototype.z = function(opt_arg){
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        return this.setZ(opt_arg);
    }
    else {
        return this.getZ();
    }
};
