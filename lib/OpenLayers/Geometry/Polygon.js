/* Copyright (c) 2006-2007 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @requires OpenLayers/Geometry/Collection.js
 * 
 * Class: OpenLayers.Geometry.Polygon 
 * Polygon is a collection of Geometry.LinearRings. 
 * 
 * Inherits from:
 *  - <OpenLayers.Geometry.Collection> 
 *  - <OpenLayers.Geometry> 
 */
OpenLayers.Geometry.Polygon = OpenLayers.Class(
  OpenLayers.Geometry.Collection, {

    /**
     * Property: componentTypes
     * {Array(String)} An array of class names representing the types of
     * components that the collection can include.  A null value means the
     * component types are not restricted.
     */
    componentTypes: ["OpenLayers.Geometry.LinearRing"],

    /**
     * Constructor: OpenLayers.Geometry.Polygon
     * Constructor for a Polygon geometry. 
     * The first ring (this.component[0])is the outer bounds of the polygon and 
     * all subsequent rings (this.component[1-n]) are internal holes.
     *
     *
     * Parameters:
     * components - Array({<OpenLayers.Geometry.LinearRing>}) 
     */
    initialize: function(components) {
        OpenLayers.Geometry.Collection.prototype.initialize.apply(this, 
                                                                  arguments);
    },
    
    /** 
     * APIMethod: getArea
     * Calculated by subtracting the areas of the internal holes from the 
     *   area of the outer hole.
     * 
     * Return:
     * {float} The area of the geometry
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

    CLASS_NAME: "OpenLayers.Geometry.Polygon"
});
