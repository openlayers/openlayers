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
     * @type {Array.<Function>}
     */
    this.typeBlacklist_ = [
        ol.geom.Collection
    ];
    
    /**
     * @private
     * @type {Array.<Function>}
     */
    this.typeWhitelist_ = [];
    
    /**
     * @private
     * @type {Array.<ol.geom.Geometry>}
     */
    this.components_ = [];
    
    if (arguments.length === 1 && goog.isDef(components)) {
        this.setComponents(components);
    }
};

goog.inherits(ol.geom.Collection, ol.geom.Geometry);

/**
 * Sets the list of disallowed types for the collection. 
 * @param {Array.<Function>} typeBlacklist Array of constructors to disallow.
 */
ol.geom.Collection.prototype.setTypeBlacklist = function(typeBlacklist){
    this.typeBlacklist_ = typeBlacklist;
};
/**
 * Gets the list of disallowed types for the collection. 
 * @return {Array.<Function>} Array of constructors to disallow.
 */
ol.geom.Collection.prototype.getTypeBlacklist = function(){
    return this.typeBlacklist_;
};

/**
 * Sets the list of always allowed types for the collection. 
 * @param {Array.<Function>} typeWhitelist Array of constructors to allow.
 */
ol.geom.Collection.prototype.setTypeWhitelist = function(typeWhitelist){
    this.typeWhitelist_ = typeWhitelist;
};
/**
 * Gets the list of always allowed types for the collection. 
 * @return {Array.<Function>} Array of constructors to allow.
 */
ol.geom.Collection.prototype.getTypeWhitelist = function(){
    return this.typeWhitelist_;
};


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
    var allValidTypes = goog.array.every(
        components, 
        this.isAllowedComponent,
        this
    );
    if (allValidTypes) {
        this.components_ = components;
    } else {
        throw new Error('ol.geom.Collection: at least one component passed to '
            + 'setComponents is not allowed.');
    }
};

/**
 * Adds the given component to the list of components at the specified index.
 * 
 * @param {ol.geom.Geometry} component A component to be added.
 * @param {number} index The index where to add.
 */
ol.geom.Collection.prototype.addComponent = function(component, index) {
    if (this.isAllowedComponent(component)) {
        goog.array.insertAt(this.components_, component, index);
    } else {
        throw new Error("ol.geom.Collection: The component is not allowed " 
            + "to be added.");
    }
};

/**
 * Checks whether the passed component is an instance of any of the constructors
 * listed in the passed list.
 * 
 * @param {ol.geom.Geometry} component The component to check.
 * @param {Array.<Function>} list The List of constructors to check the 
 *     component against.
 * 
 * @return {boolean} Whether the passed component is an instance of any of the 
 *     constructors listed in the passed list.
 * 
 * @private
 */
ol.geom.Collection.prototype.isOnList = function(component, list) {
    var isOnList = !goog.array.every(list, function(listedConstr){
        if (component instanceof listedConstr) {
            return false;
        } else {
            return true;
        }
    });
    return isOnList;
};

/**
 * Checks whether the passed component is allowed according to the black and 
 * whitelists.
 * 
 * @param {ol.geom.Geometry} component The component to check.
 * @return {boolean} Whether the passed component is allowed as part of this
 *     collection according to black- and whitelist.
 */
ol.geom.Collection.prototype.isAllowedComponent = function(component){
    var whitelist = this.getTypeWhitelist(),
        blacklist = this.getTypeBlacklist(),
        isOnWhitelist = this.isOnList(component, whitelist),
        isOnBlacklist = this.isOnList(component, blacklist);
    return (isOnWhitelist || !isOnBlacklist);
};

/**
 * Removes the given component from the list of components.
 * 
 * @param {ol.geom.Geometry} component A component to be removed.
 */
ol.geom.Collection.prototype.removeComponent = function(component) {
    goog.array.remove(this.components_, component);
};
