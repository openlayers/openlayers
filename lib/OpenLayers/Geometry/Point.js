/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt
 * for the full text of the license. */

/**
 * @class
 * 
 * @requires OpenLayers/Geometry.js
 */
OpenLayers.Geometry.Point = OpenLayers.Class.create();
OpenLayers.Geometry.Point.prototype =
    OpenLayers.Class.inherit(OpenLayers.Geometry, {

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
        
        this.x = parseFloat(x);
        this.y = parseFloat(y);
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

    /** Create a new Bounds based on the lon/lat
     * 
     */
    calculateBounds: function () {
        this.bounds = new OpenLayers.Bounds(this.x, this.y,
                                            this.x, this.y);
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
    * @param {OpenLayers.Geometry} xy
    * @returns Boolean value indicating whether the passed-in 
    *          OpenLayers.Geometryobject has the same  components as this
    *          note that if ll passed in is null, returns false
    *
    * @type bool
    */
    equals:function(geom) {
        var equals = false;
        if (geom != null) {
            equals = ((this.x == geom.x && this.y == geom.y) ||
                      (isNaN(this.x) && isNaN(this.y) && isNaN(geom.x) && isNaN(geom.y)));
        }
        return equals;
    },
    
    /**
     * @return Shortened String representation of Point object. 
     *         (ex. <i>"5, 42"</i>)
     * @type String
     */
    toShortString: function() {
        return (this.x + ", " + this.y);
    },
    
    /**
     * Moves a point in place
     * @param {Float} x
     * @param {Float} y
     */
    move: function(x, y) {
        this.x = this.x + x;
        this.y = this.y + y;
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Geometry.Point"
});
