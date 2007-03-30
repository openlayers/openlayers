/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @class
 * 
 * A Linear Ring is a special LineString which is closed. It closes itself 
 * automatically on every addPoint/removePoint by adding a copy of the first
 * point as the last point. 
 * 
 * Also, as it is the first in the line family to close itself, a getArea()
 * function is defined to calculate the enclosed area of the linearRing
 * 
 * @requires OpenLayers/Geometry/LineString.js
 */
OpenLayers.Geometry.LinearRing = OpenLayers.Class.create();
OpenLayers.Geometry.LinearRing.prototype = 
    OpenLayers.Class.inherit(OpenLayers.Geometry.LineString, {

    /**
     * An array of class names representing the types of components that
     * the collection can include.  A null value means the component types
     * are not restricted.
     * @type Array(String)
     */
    componentTypes: ["OpenLayers.Geometry.Point"],

    /**
     * Linear rings are constructed with an array of points.  This array
     * can represent a closed or open ring.  If the ring is open (the last
     * point does not equal the first point), the constructor will close
     * the ring.  If the ring is already closed (the last point does equal
     * the first point), it will be left closed.
     * 
     * @constructor
     * @param {Array(OpenLayers.Geometry.Point)} points
     */
    initialize: function(points) {
        OpenLayers.Geometry.LineString.prototype.initialize.apply(this, 
                                                                  arguments);
    },

    /**
     * Adds a point to geometry components.  If the point is to be added to
     * the end of the components array and it is the same as the last point
     * already in that array, the duplicate point is not added.  This has the
     * effect of closing the ring if it is not already closed, and doing the
     * right thing if it is already closed.  This behavior can be overridden
     * by calling the method with a non-null index as the second argument.
     *
     * @param {OpenLayers.Geometry.Point} point
     * @param {int} index Index into the array to insert the component
     * @type Boolean
     * @return Point was successfully added
     */
    addComponent: function(point, index) {
        var added = false;

        //remove last point
        var lastPoint = this.components[this.components.length-1];
        OpenLayers.Geometry.Collection.prototype.removeComponent.apply(this, 
                                                              [lastPoint]);

        // given an index, add the point
        // without an index only add non-duplicate points
        if(index != null || !point.equals(lastPoint)) {
            added = OpenLayers.Geometry.Collection.prototype.addComponent.apply(this, 
                                                                        arguments);
        }

        //append copy of first point
        var firstPoint = this.components[0];
        OpenLayers.Geometry.Collection.prototype.addComponent.apply(this, 
                                                         [firstPoint.clone()]);

        return added;
    },
    
    /**
     * Removes a point from geometry components
     *
     * @param {OpenLayers.Geometry.Point} point
     */
    removeComponent: function(point) {
        if (this.components.length > 4) {

            //remove last point
            var lastPoint = this.components[this.components.length-1];
            OpenLayers.Geometry.Collection.prototype.removeComponent.apply(this, 
                                                                 [lastPoint]);
            
            //remove our point
            OpenLayers.Geometry.Collection.prototype.removeComponent.apply(this, 
                                                                    arguments);
            //append copy of first point
            var firstPoint = this.components[0];
            OpenLayers.Geometry.Collection.prototype.addComponent.apply(this, 
                                                         [firstPoint.clone()]);
        }
    },
    
    /** Note: The area is positive if the ring is oriented CW, otherwise
     *         it will be negative.
     * 
     * @returns The signed area for a ring.
     * @type float
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

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Geometry.LinearRing"
});
