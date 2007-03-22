/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt
 * for the full text of the license. */

/**
 * @class
 *
 * The Point class is a subclass of Geometry and also a subclass of the
 * non-vector OpenLayers.LonLat class. The basic functionality that this adds
 * is the ability to switch between lon/lat and x/y at will, as well some 
 * convenience functions to create a Bounds from a point and measure the 
 * distance between two points. 
 * 
 * getX() and setX() should be used to access the x or lon variables.
 * 
 * @requires OpenLayers/BaseTypes.js
 * @requires OpenLayers/Geometry.js
 */
OpenLayers.Geometry.Point = OpenLayers.Class.create();
OpenLayers.Geometry.Point.prototype =
    OpenLayers.Class.inherit(OpenLayers.Geometry, OpenLayers.LonLat, {

    /** @type float */
    x: null,

    /** @type float */
    y: null,

    /**
     * @constructor
     *
     * @param {float} x
     * @param {float} y
     */
    initialize: function(x, y) {
    	OpenLayers.Geometry.prototype.initialize.apply(this, arguments);
    	OpenLayers.LonLat.prototype.initialize.apply(this, arguments);
    	
    	this.x = this.lon;
    	this.y = this.lat;
    },

    /**
     * @returns An exact clone of this OpenLayers.Geometry.Point
     * @type OpenLayers.Geometry.Point
     */
    clone: function(obj) {
        if (obj == null) {
            obj = new OpenLayers.Geometry.Point(this.x, this.y);
        }

        // catch any randomly tagged-on properties
        OpenLayers.Util.applyDefaults(obj, this);

        return obj;
    },

    /**
     * Sets the x coordinate
     *
     * @param {float} x
     */
    setX: function(x) {
    	this.lon = x;
    	this.x = x;
    },

    /**
     * Sets the y coordinate
     *
     * @param {float} y
     */
    setY: function(y) {
    	this.lat = y;
    	this.y = y;
    },

    /**
     * @type float
     */
    getX: function() {
	   return this.lon;
    },

    /**
     * @type float
     */
    getY: function() {
	   return this.lat;
    },

    /** Create a new Bounds based on the lon/lat
     * 
     */
    calculateBounds: function () {
        this.bounds = new OpenLayers.Bounds(this.lon, this.lat,
                                            this.lon, this.lat);
    },

    /**
     * @param {OpenLayers.Geometry.Point} point
     */
    distanceTo: function(point) {
        var distance = 0.0;
        if ( (this.x != null) && (this.y != null) && 
             (point != null) && (point.x != null) && (point.y != null) ) {
             
             var dx2 = Math.pow(this.x - point.x, 2);
             var dy2 = Math.pow(this.y - point.y, 2);
             distance = Math.sqrt( dx2 + dy2 );
        }
        return distance;
    },

    /**
     * @returns the coordinates as a string
     * @type String
     */
    toString: function() {
	   return this.toShortString();
    },
    
    /**
     * Moves a point in place
     * @param {Float} x
     * @param {Float} y
     */
    move: function(x, y) {
        this.setX(this.x + x);
        this.setY(this.y + y);
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Geometry.Point"
});
