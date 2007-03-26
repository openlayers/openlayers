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
     * @constructor
     *
     * @param {Array(OpenLayers.Geometry.Point)} points
     */
    initialize: function(points) {
        OpenLayers.Geometry.LineString.prototype.initialize.apply(this, 
                                                                  arguments);
    },
    
    /**
     * @returns An exact clone of this OpenLayers.Geometry.LinearRing
     * @type OpenLayers.Geometry.LinearRing
     */
    clone: function (obj) {
        if (obj == null) {
            obj = new OpenLayers.Geometry.LinearRing();
        }
        
        for (var i = 0; i < this.components.length; i++) {
            obj.addComponent(this.components[i].clone());
        }
        
        return obj;
    },
    
    /**
     * Adds a point to geometry components
     *
     * @param {OpenLayers.Geometry.Point} point
     * @param {int} index Index into the array to insert the component
     */ 
    addComponent: function(point, index) {
        //remove last point
        var lastPoint = this.components[this.components.length-1];
        OpenLayers.Geometry.Curve.prototype.removeComponent.apply(this, 
                                                                  [lastPoint]);
 
        //add our point
        OpenLayers.Geometry.LineString.prototype.addComponent.apply(this, 
                                                                    arguments);
        //append copy of first point
        var firstPoint = this.components[0];
        OpenLayers.Geometry.Curve.prototype.addComponent.apply(this, 
                                                         [firstPoint.clone()]);
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
            OpenLayers.Geometry.Curve.prototype.removeComponent.apply(this, 
                                                                 [lastPoint]);
            
            //remove our point
            OpenLayers.Geometry.LineString.prototype.removeComponent.apply(this, 
                                                                    arguments);
            //append copy of first point
            var firstPoint = this.components[0];
            OpenLayers.Geometry.Curve.prototype.addComponent.apply(this, 
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
