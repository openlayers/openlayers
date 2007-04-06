/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @class
 *
 * A Collection is exactly what it sounds like: A collection of different 
 * Geometries. These are stored in the local parameter "components" (which
 * can be passed as a parameter to the constructor). 
 * 
 * As new geometries are added to the collection, they are NOT cloned. 
 * When removing geometries, they need to be specified by reference (ie you 
 * have to pass in the *exact* geometry to be removed).
 * 
 * The getArea() and getLength() functions here merely iterate through
 * the components, summing their respective areas and lengths.
 * 
 * @requires OpenLayers/Geometry.js
 */
OpenLayers.Geometry.Collection = OpenLayers.Class.create();
OpenLayers.Geometry.Collection.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Geometry, {

    /** @type Array(OpenLayers.Geometry) */
    components: null,
    
    /**
     * An array of class names representing the types of components that
     * the collection can include.  A null value means the component types
     * are not restricted.
     * @type Array(String)
     */
    componentTypes: null,

    /**
     * @constructor
     * 
     * @param {Array(OpenLayers.Geometry)} components
     */
    initialize: function (components) {
        OpenLayers.Geometry.prototype.initialize.apply(this, arguments);
        this.components = new Array();
        if (components != null) {
            this.addComponents(components);
        }
    },

    /**
     * 
     */
    destroy: function () {
        this.components.length = 0;
        this.components = null;
    },

    /**
     * @returns An exact clone of this collection
     * @type OpenLayers.Geometry.Collection
     */
    clone: function() {
        var geometry = eval("new " + this.CLASS_NAME + "()");
        for(var i=0; i<this.components.length; i++) {
            geometry.addComponent(this.components[i].clone());
        }
        
        // catch any randomly tagged-on properties
        OpenLayers.Util.applyDefaults(geometry, this);
        
        return geometry;
    },

    /**
     * @returns the components of the geometry
     * @type String
     */
    getComponentsString: function(){
        var strings = [];
        for(var i = 0; i < this.components.length; i++) {
            strings.push(this.components[i].toShortString()); 
        }
        return strings.join(",");
    },

    /** Recalculate the bounds by iterating through the components and 
     *   calling calling extendBounds() on each item
     * 
     */
    calculateBounds: function() {
        this.bounds = null;
        if ( !this.components || (this.components.length > 0)) {
            this.setBounds(this.components[0].getBounds());
            for (var i = 1; i < this.components.length; i++) {
                this.extendBounds(this.components[i].getBounds());
            }
        }
    },

    /**
     * @param {Array(OpenLayers.Geometry)} components
     * 
     */
    addComponents: function(components){
        if(!(components instanceof Array)) {
            components = [components];
        }
        for(var i=0; i < components.length; i++) {
            this.addComponent(components[i]);
        }
    },

    /**
     * Add a new component (geometry) to the collection.  If this.componentTypes
     * is set, then the component class name must be in the componentTypes array.
     * 
     * The bounds cache is reset.
     * 
     * @param {OpenLayers.Geometry} component
     * @param {int} index Index into the array to insert the component
     * @type Boolean
     * @return Component was successfully added
    */    
    addComponent: function(component, index) {
        var added = false;
        if(component) {
            if(this.componentTypes == null ||
               (OpenLayers.Util.indexOf(this.componentTypes,
                                        component.CLASS_NAME) > -1)) {

                if(index != null && (index < this.components.length)) {
                    var components1 = this.components.slice(0, index);
                    var components2 = this.components.slice(index, 
                                                           this.components.length);
                    components1.push(component);
                    this.components = components1.concat(components2);
                } else {
                    this.components.push(component);
                }
                component.parent = this;
                this.clearBounds();
                added = true;
            }
        }
        return added;
    },
    
    /**
     * @param {Array(OpenLayers.Geometry)} components
     */
    removeComponents: function(components) {
        if(!(components instanceof Array)) {
            components = [components];
        }
        for (var i = 0; i < components.length; i++) {
            this.removeComponent(components[i]);
        }
    },
    
    /**
     * @param {OpenLayers.Geometry} component
     */
    removeComponent: function(component) {
        
        OpenLayers.Util.removeItem(this.components, component);
        
        // clearBounds() so that it gets recalculated on the next call
        // to this.getBounds();
        this.clearBounds();
    },

    /**
     * @returns The length of the geometry
     * @type float 
     */
    getLength: function() {
        var length = 0.0;
        for (var i = 0; i < this.components.length; i++) {
            length += this.components[i].getLength();
        }
        return length;
    },
    
    /** Note how this function is overridden in Polygon
     * 
     * @returns the area of the collection by summing its parts
     * @type float
     */
    getArea: function() {
        var area = 0.0;
        for (var i = 0; i < this.components.length; i++) {
            area += this.components[i].getArea();
        }
        return area;
    },

    /**
     * Moves a collection in place
     * @param {Float} x
     * @param {Float} y
     */
    move: function(x, y) {
        for(var i = 0; i < this.components.length; i++) {
            this.components[i].move(x, y);
        }
    },

    /**
     * Tests for equivalent geometries
     * @param {OpenLayers.Geometry}
     * @type Boolean
     * @return The coordinates are equivalent
     */
    equals: function(geometry) {
        var equivalent = true;
        if(!geometry.CLASS_NAME || (this.CLASS_NAME != geometry.CLASS_NAME)) {
            equivalent = false;
        } else if(!(geometry.components instanceof Array) ||
                  (geometry.components.length != this.components.length)) {
            equivalent = false;
        } else {
            for(var i=0; i<this.components.length; ++i) {
                if(!this.components[i].equals(geometry.components[i])) {
                    equivalent = false;
                    break;
                }
            }
        }
        return equivalent;
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Geometry.Collection"
});
