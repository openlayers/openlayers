goog.provide('ol.feature');

goog.require('ol.base');
goog.require('ol.Feature');
goog.require('ol.geom.Geometry');


/**
 * @typedef {ol.Feature|Object|string}
 */
ol.FeatureLike;


/**
 * @export
 * @param {ol.FeatureLike=} opt_arg Argument.
 * @return {ol.Feature} Feature.
 */
ol.feature = function(opt_arg){

    /** @type {Object|undefined} */
    var properties;
    /** @type {ol.geom.Geometry|undefined} */
    var geometry;
    /** @type {string|undefined} */
    var type;
   
    if (arguments.length == 1) {
        if (opt_arg instanceof ol.Feature) {
            return opt_arg;
        }
        else if (goog.isObject(opt_arg)) {
            ol.base.checkKeys(opt_arg, ['geometry', 'properties', 'type']);
            properties = opt_arg['properties'];
            geometry = opt_arg['geometry'];
            type = opt_arg['type'];
        }
        else {
            throw new Error('ol.feature');
        }
    }
    
    var feature = new ol.Feature();
    if (goog.isDef(type) && type == 'Feature') {
        //this means it is a GeoJSON object
        //format.read(opt_arg);
        
    } else {
        if (goog.isDef(properties)) {
            feature.setAttributes(properties);
        }
        if (goog.isDef(geometry)) {
            feature.setGeometry(geometry);
        }
    }
    return feature;
    
};

/**
 * @export
 * @param {!string} attr The name of the attribute to be set.
 * @param {string|number|boolean} value The value of the attribute to be set.
 * @returns {ol.Feature} The feature so calls can be chained
 */
ol.Feature.prototype.set = function(attr, value) {
    this.setAttribute(attr, value);
    return this;
};

/**
 * @export
 * @param {!string} attr The name of the attribute to be set.
 * @returns {string|number|boolean|undefined} The attribute value requested.
 */
ol.Feature.prototype.get = function(attr) {
    return this.getAttribute(attr);
};

/**
 * @export
 * @param {ol.geom.Geometry=} opt_arg
 * @returns {ol.Feature|ol.geom.Geometry|undefined} get or set the geometry on a feature
 */
ol.Feature.prototype.geometry = function(opt_arg) {
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        this.setGeometry(opt_arg);
        return this;
    } else {
        return this.getGeometry();
    }
};
