/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @class
 * 
 * A Curve is a MultiPoint, whose points are assumed to be connected. To 
 * this end, we provide a "getLength()" function, which iterates through 
 * the points, summing the distances between them. 
 *
 * @requires OpenLayers/Geometry/MultiPoint.js
 */
OpenLayers.Geometry.Curve = OpenLayers.Class.create();
OpenLayers.Geometry.Curve.prototype = 
  OpenLayers.Class.inherit(OpenLayers.Geometry.MultiPoint, {

    /**
     * @constructor
     *
     * @param {Array(OpenLayers.Geometry.Point)} points
     */
    initialize: function(points) {
        OpenLayers.Geometry.MultiPoint.prototype.initialize.apply(this, 
                                                                  arguments);
    },
    
    /**
     * @returns An exact clone of this OpenLayers.Feature
     * @type OpenLayers.Feature
     */
    clone: function (obj) {
        if (obj == null) {
            obj = new OpenLayers.Geometry.Curve();
        }
        
        obj = OpenLayers.Geometry.Collection.prototype.clone.apply(this, 
                                                                   [obj]);
        return obj;
    },
    
    /**
     * @returns The length of the curve
     * @type float
     */
    getLength: function() {
        var length = 0.0;
        if ( this.components && (this.components.length > 1)) {
            for(var i=1; i < this.components.length; i++) {
                length += this.components[i-1].distanceTo(this.components[i]);
            }
        }
        return length;
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Geometry.Curve"
});
