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
    
    /** @type {number|undefined} */
    var x;

    /** @type {number|undefined} */
    var y;

    /** @type {number|undefined} */
    var z;

    /** @type {Object|undefined} */
    var projection;
    
    var usage = 'ol.loc accepts a coordinate array or an object with x, y, and (optional) z properties';

    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        if (goog.isArray(opt_arg)) {
            x = opt_arg[0];
            y = opt_arg[1];
            z = opt_arg[2];
            projection = opt_arg[3];
        } else if (goog.isObject(opt_arg)) {
            ol.base.checkKeys(opt_arg, ['projection', 'x', 'y', 'z']);
            x = opt_arg['x'];
            y = opt_arg['y'];
            z = opt_arg['z'];
            projection = opt_arg['projection'];
        } else {
            throw new Error(usage);
        }
    }
    
    if (!goog.isNumber(x) || !goog.isNumber(y)) {
        throw new Error(usage);
    }

    if (goog.isDef(projection)) {
        projection = ol.projection(projection);
    }
    
    var loc = new ol.Loc(x, y, z, projection);
    return loc;
    
};

/**
 * Transform this location to another coordinate reference system.  This 
 * requires that this location has a projection set already (if not, an error
 * will be thrown).  Returns a new location object and does not modify this
 * location.
 *
 * @export
 * @param {string|ol.Projection} proj The destination projection.  Can be 
 *     supplied as a projection instance of a string identifier.
 * @returns {ol.Loc} A new location.
 */
ol.Loc.prototype.transform = function(proj) {
    if (goog.isString(proj)) {
        proj = new ol.Projection(proj);
    }
    return this.doTransform(proj);
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
 * @return {ol.Loc|number} Result.
 */
ol.Loc.prototype.y = function(opt_arg){
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
