goog.provide('ol.map');

goog.require('ol.Loc');
goog.require('ol.Map');
goog.require('ol.Projection');
goog.require('ol.loc');
goog.require('ol.projection');


/**
 * @typedef {ol.Map|Object|string}
 */
ol.MapLike;


/**
 * @param {ol.MapLike=} opt_arg Argument.
 * @return {ol.Map} Map.
 */
ol.map = function(opt_arg){

    /** @type {ol.Loc|undefined} */
    var center;
    /** @type {number|undefined} */
    var zoom;
    /** @type {number|undefined} */
    var numZoomLevels;
    /** @type {ol.Projection|undefined} */
    var projection;
    /** @type {ol.Projection|undefined} */
    var userProjection;
    
    if (arguments.length == 1) {
        if (opt_arg instanceof ol.Map) {
            return opt_arg;
        }
        else if (goog.isObject(opt_arg)) {
            center = opt_arg['center'];
            zoom = opt_arg['zoom'];
            numZoomLevels = opt_arg['numZoomLevels'];
            projection = opt_arg['projection'];
            userProjection = opt_arg['userProjection'];
        }
        else {
            throw new Error('ol.map');
        }
    }
    
    var map = new ol.Map();
    if (goog.isDef(center)) {
        map.setCenter(ol.loc(center));
    }
    if (goog.isDef(zoom)) {
        map.setZoom(zoom);
    }
    if (goog.isDef(numZoomLevels)) {
        map.setNumZoomLevels(numZoomLevels);
    }
    if (goog.isDef(projection)) {
        map.setProjection(projection);
    }
    if (goog.isDef(userProjection)) {
        map.setUserProjection(userProjection);
    }
    return map;
    
};

/**
 * @param {ol.LocLike=} opt_arg
 * @returns {ol.Map|ol.Loc|undefined} Map center.
 */
ol.Map.prototype.center = function(opt_arg) {
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        return this.setCenter(ol.loc(opt_arg));
    } else {
        return this.getCenter();
    }
};

/**
 * @param {ol.ProjectionLike=} opt_arg
 * @returns {ol.Map|ol.Projection|undefined}
 */
ol.Map.prototype.projection = function(opt_arg) {
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        return this.setProjection(ol.projection(opt_arg));
    } else {
        return this.getProjection();
    }
};

/**
 * @param {ol.ProjectionLike=} opt_arg
 * @returns {ol.Map|ol.Projection|undefined}
 */
ol.Map.prototype.userProjection = function(opt_arg) {
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        return this.setUserProjection(ol.projection(opt_arg));
    } else {
        return this.getUserProjection();
    }
};

/**
 * @param {number=} opt_arg
 * @returns {ol.Map|number|undefined} Map center.
 */
ol.Map.prototype.zoom = function(opt_arg) {
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        return this.setZoom(opt_arg);
    } else {
        return this.getZoom();
    }
};

/**
 * @param {number=} opt_arg
 * @returns {ol.Map|number|undefined} Map center.
 */
ol.Map.prototype.numZoomLevels = function(opt_arg) {
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        return this.setNumZoomLevels(opt_arg);
    } else {
        return this.getNumZoomLevels();
    }
};
