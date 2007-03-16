/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @class
 * 
 * A Rectangle is a simple geometry. It is specified by a a point (x and y) 
 * and dimensions (width and height), all of which are directly accessible as 
 * properties.
 *
 * @requires OpenLayers/Geometry.js
 */

OpenLayers.Geometry.Rectangle = OpenLayers.Class.create();
OpenLayers.Geometry.Rectangle.prototype = 
  OpenLayers.Class.inherit(OpenLayers.Geometry, {

    /** @type float */
    x: null,

    /** @type float */
    y: null,

    /** @type float */
    width: null,

    /** @type float */
    height: null,

    /**
     * @constructor
     *
     * @param {array} points
     */
    initialize: function(x, y, width, height) {
        OpenLayers.Geometry.prototype.initialize.apply(this, arguments);
        
        this.x = x;
        this.y = y;

        this.width = width;
        this.height = height;
    },
    
    /**
     * 
     */
    calculateBounds: function() {
        this.bounds = new OpenLayers.Bounds(this.x, this.y,
                                            this.x + this.width, 
                                            this.y + this.height);
    },
    
    
    /**
     * @returns The length of the geometry
     * @type float
     */
    getLength: function() {
        var length = (2 * this.width) + (2 * this.height);
        return length;
    },

    /**
     * @returns The area of the geometry
     * @type float
     */
    getArea: function() {
        var area = this.width * this.height;
        return area;
    },    

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Geometry.Rectangle"
});
