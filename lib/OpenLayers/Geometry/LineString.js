/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @class
 * 
 * A LineString is a Curve which, once two points have been added to it, can 
 * never be less than two points long.
 *
 * @requires OpenLayers/Geometry/Curve.js
 */
OpenLayers.Geometry.LineString = OpenLayers.Class.create();
OpenLayers.Geometry.LineString.prototype =
    OpenLayers.Class.inherit(OpenLayers.Geometry.Curve, {

    /**
     * @constructor
     * 
     * @param {Array(OpenLayers.Geometry.Point)} points
     */
    initialize: function(points) {
        OpenLayers.Geometry.Curve.prototype.initialize.apply(this, 
                                                                  arguments);        
    },

    /**
     * @returns An exact clone of this OpenLayers.Feature
     * @type OpenLayers.Feature
     */
    clone: function (obj) {
        if (obj == null) {
            obj = new OpenLayers.Geometry.LineString();
        }
        
        for (var i = 0; i < this.components.length; i++) {
            obj.addComponent(this.components[i].clone());
        }
        
        return obj;
    },

    /** Only allows removal of a point if there are three or more points in 
     *   the linestring. (otherwise the result would be just a single point)
     * 
     * @param {OpenLayers.Geometry.Point} point
     */
    removeComponent: function(point) {
        if ( this.components && (this.components.length > 2)) {
            OpenLayers.Geometry.Curve.prototype.removeComponent.apply(this, 
                                                                  arguments);
        }
    },
       
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Geometry.LineString"
});
