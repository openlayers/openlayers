goog.provide('ol.map');

goog.require('ol.Loc');
goog.require('ol.Map');
goog.require('ol.Projection');
goog.require('ol.loc');
goog.require('ol.projection');
goog.require('ol.error');


/**
 * @typedef {ol.Map|Object|string}
 */
ol.MapLike;


/**
 * @export
 * @param {ol.MapLike=} opt_arg Argument.
 * @return {ol.Map} Map.
 */
ol.map = function(opt_arg) {

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
    /** @type {ol.Bounds|undefined} */
    var maxExtent;
    /** @type {ol.Bounds|undefined} */
    var maxRes;
    /** @type {Array.<number>|undefined} */
    var resolutions;
    /** @type {Element|string|undefined} */
    var renderTo;
    /** @type {Array|undefined} */
    var layers;
    /** @type {Array|undefined} */
    var controls;
   
    if (arguments.length == 1) {
        if (opt_arg instanceof ol.Map) {
            return opt_arg;
        }
        else if (goog.isObject(opt_arg)) {
            ol.base.checkKeys(opt_arg, ['center', 'zoom', 'numZoomLevels', 'projection', 'userProjection', 'maxExtent', 'maxRes', 'resolutions', 'renderTo', 'layers', 'controls']);
            center = opt_arg['center'];
            zoom = opt_arg['zoom'];
            numZoomLevels = opt_arg['numZoomLevels'];
            projection = opt_arg['projection'];
            userProjection = opt_arg['userProjection'];
            maxExtent = opt_arg['maxExtent'];
            maxRes = opt_arg['maxRes'];
            resolutions = opt_arg['resolutions'];
            renderTo = opt_arg['renderTo'];
            layers = opt_arg['layers'];
            controls = opt_arg['controls'];
        }
        else {
            throw new Error('ol.map');
        }
    }

    
    var map = new ol.Map();
    if (goog.isDef(center)) {
        map.center(center);
    }
    if (goog.isDef(zoom)) {
        map.setZoom(zoom);
    }
    if (goog.isDef(numZoomLevels)) {
        map.setNumZoomLevels(numZoomLevels);
    }
    if (goog.isDef(projection)) {
        map.setProjection(ol.projection(projection));
    }
    if (goog.isDef(userProjection)) {
        map.setUserProjection(ol.projection(userProjection));
    }
    if (goog.isDef(maxExtent)) {
        map.setMaxExtent(ol.bounds(maxExtent));
    }
    if (goog.isDef(maxRes)) {
        map.setMaxResolution(maxRes);
    }
    if (goog.isDef(resolutions)) {
        map.setResolutions(resolutions);
    }
    if (goog.isDef(layers)) {
        map.setLayers(layers);
    }
    if (goog.isDef(controls)) {
        map.setControls(controls);
    }
    if (goog.isDef(renderTo)) {
        map.renderTo(renderTo);
    }
    return map;
    
};

/**
 * @export
 * @param {ol.LocLike=} opt_arg
 * @returns {ol.Map|ol.Loc|undefined} Map center.
 */
ol.Map.prototype.center = function(opt_arg) {
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        var loc = ol.loc(opt_arg);
        var proj = loc.getProjection();
        if (goog.isNull(proj)) {
            proj = this.getUserProjection();
            loc.setProjection(proj);
        }
        this.setCenter(loc);
        return this;
    } else {
        var proj = this.getUserProjection();
        return this.getCenter().doTransform(proj);
    }
};

/**
 * @export
 * @param {ol.ProjectionLike=} opt_arg
 * @returns {ol.Map|ol.Projection|undefined}
 */
ol.Map.prototype.projection = function(opt_arg) {
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        this.setProjection(ol.projection(opt_arg));
        return this;
    } else {
        return this.getProjection();
    }
};

/**
 * @export
 * @param {ol.ProjectionLike=} opt_arg
 * @returns {ol.Map|ol.Projection|undefined}
 */
ol.Map.prototype.userProjection = function(opt_arg) {
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        this.setUserProjection(ol.projection(opt_arg));
        return this;
    } else {
        return this.getUserProjection();
    }
};

/**
 * @export
 * @param {number=} opt_arg
 * @returns {ol.Map|number|undefined} Map center.
 */
ol.Map.prototype.zoom = function(opt_arg) {
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        this.setZoom(opt_arg);
        return this;
    } else {
        return this.getZoom();
    }
};

/**
 * @export
 * @param {number=} opt_arg
 * @returns {ol.Map|number|undefined} Map center.
 */
ol.Map.prototype.numZoomLevels = function(opt_arg) {
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        this.setNumZoomLevels(opt_arg);
        return this;
    } else {
        return this.getNumZoomLevels();
    }
};

/**
 * @export
 * @param {Array=} opt_arg  
 * @returns {ol.Map|Array|undefined} Map center.
 */
ol.Map.prototype.resolutions = function(opt_arg) {
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        this.setResolutions(opt_arg);
        return this;
    } else {
        return this.getResolutions();
    }
};

/**
 * @export
 * @param {Array=} opt_arg  
 * @returns {ol.Map|Array|undefined} Map center.
 */
ol.Map.prototype.layers = function(opt_arg) {
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        this.setLayers(opt_arg);
        return this;
    } else {
        return this.getLayers();
    }
};

/**
 * @export
 * @param {Array=} opt_arg  
 * @returns {ol.Map|Array|undefined} Map center.
 */
ol.Map.prototype.controls = function(opt_arg) {
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        this.setControls(opt_arg);
        return this;
    } else {
        return this.getControls();
    }
};

/**
 * @export
 * @param {Array=} opt_arg  
 * @returns {ol.Map|ol.Bounds|undefined} Map max extent.
 */
ol.Map.prototype.maxExtent = function(opt_arg) {
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        this.setMaxExtent(ol.bounds(opt_arg));
        return this;
    } else {
        return this.getMaxExtent();
    }
};

/**
 * @param {string|Element} arg Render the map to a container
 * @returns {ol.Map}
 */
ol.Map.prototype.renderTo = function(arg) {
    this.setContainer(goog.dom.getElement(arg));
    return this;
};
