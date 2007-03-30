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
     * An array of class names representing the types of components that
     * the collection can include.  A null value means the component types
     * are not restricted.
     * @type Array(String)
     */
    componentTypes: ["OpenLayers.Geometry.LinearRing"],

    /**
     * @constructor
     *
     * @param {Array(OpenLayers.Geometry.LinearRing)}
     */
    initialize: function(components) {
        OpenLayers.Geometry.Collection.prototype.initialize.apply(this, 
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
