goog.provide('ol.geom.Collection');

goog.require('goog.array');
goog.require('ol.geom.Geometry');
goog.require('ol.Projection');

/**
 * Creates ol.geom.Collection objects. 
 * 
 * @extends {ol.geom.Geometry}
 * @param {Array.<ol.geom.Geometry>} components An array of components.
 * 
 * @constructor
 */
ol.geom.Collection = function(components) {
    /**
     * @private
     * @type {Array.<ol.geom.Geometry>}
     */
    this.components_ = components;
    
};

goog.inherits(ol.geom.Collection, ol.geom.Geometry);

/**
 * Sets the Collection's components.
 * 
 * @return {Array.<ol.geom.Geometry>} An array of components.
 */
ol.geom.Collection.prototype.getComponents = function() {
    return this.components_;
};

/**
 * Gets the Collection's components.
 * 
 * @param {Array.<ol.geom.Geometry>} components An array of components.
 */
ol.geom.Collection.prototype.setComponents = function(components) {
    this.components_ = components;
};

/**
 * Adds the given component to the list of components at the specified index.
 * 
 * @param {ol.geom.Geometry} component A component to be added.
 * @param {number} index The index where to add.
 */
ol.geom.Collection.prototype.addComponent = function(component, index) {
    goog.array.insertAt(this.components_,component,index);
};

/**
 * Removes the given component from the list of components.
 * 
 * @param {ol.geom.Geometry} component A component to be removed.
 */
ol.geom.Collection.prototype.removeComponent = function(component) {
    goog.array.remove(this.components_, component);
};
