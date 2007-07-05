/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt
 * for the full text of the license. */

/**
 * @requires OpenLayers/Geometry.js
 *
 * Class: OpenLayers.Geometry.Point
 * Point geometry class. 
 * 
 * Inherits from:
 *  - <OpenLayers.Geometry> 
 */
OpenLayers.Geometry.Point = OpenLayers.Class.create();
OpenLayers.Geometry.Point.prototype =
    OpenLayers.Class.inherit(OpenLayers.Geometry, {

    /** 
     * APIProperty: x 
     * {float} 
     */
    x: null,

    /** 
     * APIProperty: y 
     * {float} 
     */
    y: null,

    /**
     * Constructor: OpenLayers.Geometry.Point
     * Construct a point geometry.
     *
     * Parameters:
     * x - {float} 
     * y - {float}
     * 
     */
    initialize: function(x, y) {
        OpenLayers.Geometry.prototype.initialize.apply(this, arguments);
        
        this.x = parseFloat(x);
        this.y = parseFloat(y);
    },

    /**
     * APIMethod: clone
     * 
     * Return:
     * {<OpenLayers.Geometry.Point>} An exact clone of this OpenLayers.Geometry.Point
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
     * Method: calculateBounds
     * Create a new Bounds based on the lon/lat
     */
    calculateBounds: function () {
        this.bounds = new OpenLayers.Bounds(this.x, this.y,
                                            this.x, this.y);
    },

    /**
     * APIMethod: distanceTo
     * 
     * Parameters:
     * point - {<OpenLayers.Geometry.Point>} 
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
    * APIMethod: equals
    * 
    * Parameters:
    * xy - {<OpenLayers.Geometry>} 
    *
    * Return:
    * {Boolean} Boolean value indicating whether the passed-in 
    *          {<OpenLayers.Geometry>} object has the same  components as this
    *          note that if ll passed in is null, returns false
    *
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
     * Method: toShortString
     *
     * Return:
     * {String} Shortened String representation of Point object. 
     *         (ex. <i>"5, 42"</i>)
     */
    toShortString: function() {
        return (this.x + ", " + this.y);
    },
    
    /**
     * APIMethod: move
     * Moves a point in place
     *
     * Parameters:
     * x - {Float} 
     * y - {Float} 
     */
    move: function(x, y) {
        this.x = this.x + x;
        this.y = this.y + y;
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Geometry.Point"
});
