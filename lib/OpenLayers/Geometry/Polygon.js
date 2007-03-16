/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @class
 * 
 * Polygon is a collection of Geometry.LinearRings. 
 * 
 * The first ring (this.component[0])is the outer bounds of the polygon and 
 * all subsequent rings (this.component[1-n]) are internal holes.
 *
 * @requires OpenLayers/Geometry/Collection.js
 */
OpenLayers.Geometry.Polygon = OpenLayers.Class.create();
OpenLayers.Geometry.Polygon.prototype =
    OpenLayers.Class.inherit(OpenLayers.Geometry.Collection, {

    /**
     * @constructor
     *
     * @param {Array(OpenLayers.Geometry.LinearRing)}
     */
    initialize: function(components) {
    	OpenLayers.Geometry.Collection.prototype.initialize.apply(this, 
    	                                                          arguments);
    },

    /**
     * adds a component to the Polygon, checking type
     *
     * @param {OpenLayers.Geometry.LinearRing} point to add
     * @param {int} index Index into the array to insert the component
     */
    addComponent: function(component, index) {
        if (!(component instanceof OpenLayers.Geometry.LinearRing)) {
            var throwStr = "component should be an " +
                           "OpenLayers.Geometry.LinearRing but is a " + 
                           component.CLASS_NAME;
            throw throwStr;
                           
        }
        OpenLayers.Geometry.Collection.prototype.addComponent.apply(this, 
                                                                    arguments);
    },
    
    /** Calculated by subtracting the areas of the internal holes from the 
     *   area of the outer hole.
     * 
     * @returns The area of the geometry
     * @type float 
     */
    getArea: function() {
        var area = 0.0;
        if ( this.components && (this.components.length > 0)) {
            area += Math.abs(this.components[0].getArea());
            for (var i = 1; i < this.components.length; i++) {
                area -= Math.abs(this.components[i].getArea());
            }
        }
        return area;
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Geometry.Polygon"
});
