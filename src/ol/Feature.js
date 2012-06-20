goog.provide('ol.Feature');

goog.require('ol.geom.Geometry');



/**
 * @constructor
 */
ol.Feature = function() {

    /**
     * @private
     * @type {ol.geom.Geometry}
     */
    this.geometry_ = null;

    /**
     * @private
     * @type {Object}
     */
     this.attributes_ = {};

};

/**
 * @return {ol.geom.Geometry} The geometry associated with the feature.
 */
ol.Feature.prototype.getGeometry = function() {
    return this.geometry_;
};

/**
 * @param {ol.geom.Geometry} geom the geometry for the feature.
 */
ol.Feature.prototype.setGeometry = function(geom) {
    this.geometry_ = geom;
};


/**
 * @param {!string} name the attribute value to retrieve.
  @return {string|number|boolean} the attribute value.
 */
ol.Feature.prototype.getAttribute = function(name) {
    return this.attributes_[name];
};


/**
 * @param {!string} name of the attribute to set.
 * @param {string|number|boolean} value the attribute value to set.
 */
ol.Feature.prototype.setAttribute = function(name, value) {
    this.attributes_[name] = value;
};


/**
 * @param {Object} attrs An json structure containing key/value pairs.
 */
ol.Feature.prototype.setAttributes = function(attrs) {
    for (var key in attrs) {
        this.setAttribute(key, attrs[key]);
    }
};


/**
*/
ol.Feature.prototype.destroy = function() {
    //remove attributes and geometry, etc.
    for (var key in this) {
        delete this[key];
    }
};
