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
    var target;
    
    var map = new ol.Map();
    
    if (arguments.length == 1) {
        if (opt_arg instanceof ol.Map) {
            return opt_arg;
        }
        else 
            if (goog.isObject(opt_arg)) {
                var config = opt_arg;
                if (goog.isDef(config.center)) {
                    center = ol.loc(config.center);
                    map.setCenter(center);
                }
                if (goog.isDef(config.zoom)) {
                    zoom = config.zoom;
                    map.setZoom(zoom);
                }
                if (goog.isDef(config.numZoomLevels)) {
                    numZoomLevels = config.numZoomLevels;
                    map.setNumZoomLevels(numZoomLevels);
                }
                if (goog.isDef(config.projection)) {
                    projection = config.projection;
                    map.setProjection(projection);
                }
                if (goog.isDef(config.target)) {
                    target = config.target;
                }
            }
            else {
                throw new Error('ol.map');
            }
    }
    
    return map;
    
};

/**
 * @param {ol.LocLike=} opt_arg Get or set the map center.
 * @returns {ol.Map|ol.Loc|undefined} The map center, or the map on set.
 */
ol.Map.prototype.center = function(opt_arg) {
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        return this.setCenter(ol.loc(opt_arg));
    } else {
        return this.getCenter();
    }
};

/**
 * @param {ol.Projection|string|undefined} opt_arg Get or set the map projection.
 * @returns {ol.Map|number|undefined} the current zoom level, or the map on set.
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
 * @returns {ol.Map|ol.Loc|undefined}
 */
ol.Map.prototype.userProjection = function(opt_arg) {
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        return this.setUserProjection(ol.projection(opt_arg));
    } else {
        return this.getUserProjection();
    }
};

/**
 * @param {number|undefined} opt_arg Get or set the current zoom level.
 * @returns {ol.Map|number|undefined} current zoom level on get or the map.
 */
ol.Map.prototype.zoom = function(opt_arg) {
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        return this.setZoom(opt_arg);
    } else {
        return this.getZoom();
    }
};

/**
 * @param {number|undefined} opt_arg Get or set the number of zoom levels.
 * @returns {ol.Map|number|undefined} the number of zoom levels, or the map on set.
 */
ol.Map.prototype.numZoomLevels = function(opt_arg) {
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        return this.setNumZoomLevels(opt_arg);
    } else {
        return this.getNumZoomLevels();
    }
};
