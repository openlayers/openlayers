/* Copyright (c) 2006-2007 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @requires OpenLayers/Geometry/LineString.js
 * 
 * Class: OpenLayers.Geometry.LinearRing
 * 
 * A Linear Ring is a special LineString which is closed. It closes itself 
 * automatically on every addPoint/removePoint by adding a copy of the first
 * point as the last point. 
 * 
 * Also, as it is the first in the line family to close itself, a getArea()
 * function is defined to calculate the enclosed area of the linearRing
 * 
 * Inherits:
 *  - <OpenLayers.Geometry.LineString>
 */
OpenLayers.Geometry.LinearRing = OpenLayers.Class(
  OpenLayers.Geometry.LineString, {

    /**
     * Property: componentTypes
     * {Array(String)} An array of class names representing the types of 
     *                 components that the collection can include.  A null 
     *                 value means the component types are not restricted.
     */
    componentTypes: ["OpenLayers.Geometry.Point"],

    /**
     * Constructor: OpenLayers.Geometry.LinearRing
     * Linear rings are constructed with an array of points.  This array
     *     can represent a closed or open ring.  If the ring is open (the last
     *     point does not equal the first point), the constructor will close
     *     the ring.  If the ring is already closed (the last point does equal
     *     the first point), it will be left closed.
     * 
     * Parameters:
     * points - {Array(<OpenLayers.Geometry.Point>)} points
     */
    initialize: function(points) {
        OpenLayers.Geometry.LineString.prototype.initialize.apply(this, 
                                                                  arguments);
    },

    /**
     * APIMethod: addComponent
     * Adds a point to geometry components.  If the point is to be added to
     *     the end of the components array and it is the same as the last point
     *     already in that array, the duplicate point is not added.  This has 
     *     the effect of closing the ring if it is not already closed, and 
     *     doing the right thing if it is already closed.  This behavior can 
     *     be overridden by calling the method with a non-null index as the 
     *     second argument.
     *
     * Parameter:
     * point - {<OpenLayers.Geometry.Point>}
     * index - {Integer} Index into the array to insert the component
     * 
     * Returns:
     * {Boolean} Was the Point successfully added?
     */
    addComponent: function(point, index) {
        var added = false;

        //remove last point
        var lastPoint = this.components.pop();

        // given an index, add the point
        // without an index only add non-duplicate points
        if(index != null || !point.equals(lastPoint)) {
            added = OpenLayers.Geometry.Collection.prototype.addComponent.apply(this, 
                                                                    arguments);
        }

        //append copy of first point
        var firstPoint = this.components[0];
        OpenLayers.Geometry.Collection.prototype.addComponent.apply(this, 
                                                                [firstPoint]);
        
        return added;
    },
    
    /**
     * APIMethod: removeComponent
     * Removes a point from geometry components.
     *
     * Parameters:
     * point - {<OpenLayers.Geometry.Point>}
     */
    removeComponent: function(point) {
        if (this.components.length > 4) {

            //remove last point
            this.components.pop();
            
            //remove our point
            OpenLayers.Geometry.Collection.prototype.removeComponent.apply(this, 
                                                                    arguments);
            //append copy of first point
            var firstPoint = this.components[0];
            OpenLayers.Geometry.Collection.prototype.addComponent.apply(this, 
                                                                [firstPoint]);
        }
    },
    
    /**
     * APIMethod: move
     * Moves a collection in place
     *
     * Parameters:
     * x - {Float} The x-displacement (in map units)
     * y - {Float} The y-displacement (in map units)
     */
    move: function(x, y) {
        for(var i = 0; i < this.components.length - 1; i++) {
            this.components[i].move(x, y);
        }
    },

    /**
     * APIMethod: rotate
     * Rotate a geometry around some origin
     *
     * Parameters:
     * angle - {Float} Rotation angle in radians (measured counterclockwise
     *                 from the positive x-axis)
     * origin - {<OpenLayers.Geometry.Point>} Center point for the rotation
     */
    rotate: function(angle, origin) {
        for(var i=0; i<this.components.length - 1; ++i) {
            this.components[i].rotate(angle, origin);
        }
    },

    /**
     * APIMethod: resize
     * Resize a geometry relative to some origin.  Use this method to apply
     *     a uniform scaling to a geometry.
     *
     * Parameters:
     * scale - {Float} Factor by which to scale the geometry.  A scale of 2
     *                 doubles the size of the geometry in each dimension
     *                 (lines, for example, will be twice as long, and polygons
     *                 will have four times the area).
     * origin - {<OpenLayers.Geometry.Point>} Point of origin for resizing
     */
    resize: function(scale, origin) {
        for(var i=0; i<this.components.length - 1; ++i) {
            this.components[i].resize(scale, origin);
        }
    },

    /**
     * APIMethod: getArea
     * Note - The area is positive if the ring is oriented CW, otherwise
     *         it will be negative.
     * 
     * Returns:
     * {Float} The signed area for a ring.
     */
    getArea: function() {
        var area = 0.0;
        if ( this.components && (this.components.length > 2)) {
            var sum = 0.0;
            for (var i = 0; i < this.components.length - 1; i++) {
                var b = this.components[i];
                var c = this.components[i+1];
                sum += (b.x + c.x) * (c.y - b.y);
            }
            area = - sum / 2.0;
        }
        return area;
    },

    CLASS_NAME: "OpenLayers.Geometry.LinearRing"
});
