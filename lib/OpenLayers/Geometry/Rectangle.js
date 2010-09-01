/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Geometry.js
 */

/**
 * Class: OpenLayers.Geometry.Rectangle
 * This class is *not supported*, and probably isn't what you're looking for.
 *     Instead, most users probably want something like:
 *     (code)
 *     var poly = new OpenLayers.Bounds(0,0,10,10).toGeometry();
 *     (end)
 *     This will create a rectangular Polygon geometry. 
 * 
 * Inherits:
 *  - <OpenLayers.Geometry>
 */

OpenLayers.Geometry.Rectangle = OpenLayers.Class(OpenLayers.Geometry, {

    /** 
     * Property: x
     * {Float}
     */
    x: null,

    /** 
     * Property: y
     * {Float}
     */
    y: null,

    /** 
     * Property: width
     * {Float}
     */
    width: null,

    /** 
     * Property: height
     * {Float}
     */
    height: null,

    /**
     * Constructor: OpenLayers.Geometry.Rectangle
     * 
     * Parameters:
     * points - {Array(<OpenLayers.Geometry.Point>}
     */
    initialize: function(x, y, width, height) {
        OpenLayers.Geometry.prototype.initialize.apply(this, arguments);
        
        this.x = x;
        this.y = y;

        this.width = width;
        this.height = height;
    },
    
    /**
     * Method: calculateBounds
     * Recalculate the bounds for the geometry.
     */
    calculateBounds: function() {
        this.bounds = new OpenLayers.Bounds(this.x, this.y,
                                            this.x + this.width, 
                                            this.y + this.height);
    },
    
    
    /**
     * APIMethod: getLength
     * 
     * Returns:
     * {Float} The length of the geometry
     */
    getLength: function() {
        var length = (2 * this.width) + (2 * this.height);
        return length;
    },

    /**
     * APIMethod: getArea
     * 
     * Returns:
     * {Float} The area of the geometry
     */
    getArea: function() {
        var area = this.width * this.height;
        return area;
    },    

    CLASS_NAME: "OpenLayers.Geometry.Rectangle"
});
