/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * Class: OpenLayers.Bounds
 * Instances of this class represent bounding boxes.  Data stored as left,
 * bottom, right, top floats
 */
OpenLayers.Bounds = OpenLayers.Class.create();
OpenLayers.Bounds.prototype = {

    /**
     * Property: left
     * {Number}
     */
    left: 0.0,

    /**
     * Property: bottom
     * {Number}
     */
    bottom: 0.0,

    /**
     * Property: right
     * {Number}
     */
    right: 0.0,

    /**
     * Property: top
     * {Number}
     */
    top: 0.0,    

    /**
     * Constructor: OpenLayers.Bounds
     * Construct a new bounds object.
     *
     * Parameters:
     * left - {Number} The left bounds of the box.  Note that for width
     *        calculations, this is assumed to be less than the right value.
     * bottom - {Number} The bottom bounds of the box.  Note that for height
     *          calculations, this is assumed to be more than the top value.
     * right - {Number} The right bounds.
     * top - {Number} The top bounds.
     */
    initialize: function(left, bottom, right, top) {
        this.left = parseFloat(left);
        this.bottom = parseFloat(bottom);
        this.right = parseFloat(right);
        this.top = parseFloat(top);
    },

    /**
     * Method: clone
     * Create a cloned instance of this bounds.
     *
     * Return:
     * {<OpenLayers.Bounds>} A fresh copy of the bounds
     */
    clone:function() {
        return new OpenLayers.Bounds(this.left, this.bottom, 
                                     this.right, this.top);
    },

    /**
     * Method: equals
     * Test a two bounds for equivalence
     *
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     *
     * Return:
     * {Boolean} The passed-in OpenLayers.Bounds object has the same left,
     *           right, top, bottom components as this.  Note that if bounds 
     *           passed in is null, returns false.
     */
    equals:function(bounds) {
        var equals = false;
        if (bounds != null) {
            equals = ((this.left == bounds.left) && 
                      (this.right == bounds.right) &&
                      (this.top == bounds.top) && 
                      (this.bottom == bounds.bottom));
        }
        return equals;
    },

    /** 
     * APIMethod: toString
     * 
     * Return:
     * {String} String representation of OpenLayers.Bounds object. 
     *          (ex.<i>"left-bottom=(5,42) right-top=(10,45)"</i>)
     */
    toString:function() {
        return ( "left-bottom=(" + this.left + "," + this.bottom + ")"
                 + " right-top=(" + this.right + "," + this.top + ")" );
    },

    /** 
     * APIMethod: toBBOX
     * 
     * Parameters:
     * decimal - {Integer} How many significant digits in the bbox coords?
     *                     Default is 6
     * 
     * Return:
     * {String} Simple String representation of OpenLayers.Bounds object.
     *          (ex. <i>"5,42,10,45"</i>)
     */
    toBBOX:function(decimal) {
        if (decimal== null) {
            decimal = 6; 
        }
        var mult = Math.pow(10, decimal);
        var bbox = Math.round(this.left * mult) / mult + "," + 
                   Math.round(this.bottom * mult) / mult + "," + 
                   Math.round(this.right * mult) / mult + "," + 
                   Math.round(this.top * mult) / mult;

        return bbox;
    },
    
    /**
     * APIMethod: getWidth
     * 
     * Return:
     * {Float} The width of the bounds
     */
    getWidth:function() {
        return (this.right - this.left);
    },

    /**
     * APIMethod: getHeight
     * 
     * Return:
     * {Float} The height of the bounds
     */
    getHeight:function() {
        return (this.top - this.bottom);
    },

    /**
     * APIMethod: getSize
     * 
     * Return:
     * {<OpenLayers.Size>} An <OpenLayers.Size> which represents the size of the box
     */
    getSize:function() {
        return new OpenLayers.Size(this.getWidth(), this.getHeight());
    },

    /**
     * APIMethod: getCenterPixel
     * 
     * Return:
     * {<OpenLayers.Pixel>} An <OpenLayers.Pixel> which represents the center 
     *                      of the bounds
     */
    getCenterPixel:function() {
        return new OpenLayers.Pixel( (this.left + this.right) / 2,
                                     (this.bottom + this.top) / 2);
    },

    /**
     * APIMethod: getCenterLonLat
     * 
     * Return:
     * {<OpenLayers.LonLat>} An <OpenLayers.LonLat> which represents the center 
     *                      of the bounds
     */
    getCenterLonLat:function() {
        return new OpenLayers.LonLat( (this.left + this.right) / 2,
                                      (this.bottom + this.top) / 2);
    },

    /**
     * APIMethod: add
     * 
     * Parameters:
     * x - {Float}
     * y - {Float}
     * 
     * Return:
     * {<OpenLayers.Bounds>} A new <OpenLayers.Bounds> whose coordinates are 
     *                       the same as this, but shifted by the passed-in 
     *                       x and y values
     */
    add:function(x, y) {
        if ( (x == null) || (y == null) ) {
            var msg = "You must pass both x and y values to the add function.";
            OpenLayers.Console.error(msg);
            return null;
        }
        return new OpenLayers.Bounds(this.left + x, this.bottom + y,
                                     this.right + x, this.top + y);
    },
    
    /**
     * APIMethod: extend
     * Extend the bounds to include the point, lonlat, or bounds specified.
     * Note: This function assumes that left<right and bottom<top.
     * 
     * 
     * Parameters: 
     * object - {Object} Can be LonLat, Point, or Bounds
     */
    extend:function(object) {
        var bounds = null;
        if (object) {
            switch(object.CLASS_NAME) {
                case "OpenLayers.LonLat":    
                    bounds = new OpenLayers.Bounds(object.lon, object.lat,
                                                    object.lon, object.lat);
                    break;
                case "OpenLayers.Geometry.Point":
                    bounds = new OpenLayers.Bounds(object.x, object.y,
                                                    object.x, object.y);
                    break;
                    
                case "OpenLayers.Bounds":    
                    bounds = object;
                    break;
            }
    
            if (bounds) {
               this.left = (bounds.left < this.left) ? bounds.left 
                                                     : this.left;
               this.bottom = (bounds.bottom < this.bottom) ? bounds.bottom 
                                                           : this.bottom;
               this.right = (bounds.right > this.right) ? bounds.right 
                                                        : this.right;
               this.top = (bounds.top > this.top) ? bounds.top 
                                                  : this.top;
            }
        }
    },

    /**
     * APIMethod: containsLonLat
     * 
     * Parameters:
     * ll - {<OpenLayers.LonLat>}
     * inclusive - {Boolean} Whether or not to include the border. 
     *                       Default is true.
     *
     * Return:
     * {Boolean} Whether or not the passed-in lonlat is within this bounds.
     */
    containsLonLat:function(ll, inclusive) {
        return this.contains(ll.lon, ll.lat, inclusive);
    },

    /**
     * APIMethod: containsPixel
     * 
     * Parameters:
     * px - {<OpenLayers.Pixel>}
     * inclusive - {Boolean} Whether or not to include the border. 
     *                       Default is true.
     *
     * Return:
     * {Boolean} Whether or not the passed-in pixel is within this bounds.
     */
    containsPixel:function(px, inclusive) {
        return this.contains(px.x, px.y, inclusive);
    },
    
    /**
     * APIMethod: contains
     * 
     * Parameters:
     * x - {Float}
     * y - {Float}
     * inclusive - {Boolean} Whether or not to include the border. 
     *                       Default is true.
     *
     * Return:
     * {Boolean} Whether or not the passed-in coordinates are within this
     *           bounds.
     */
    contains:function(x, y, inclusive) {
    
        //set default
        if (inclusive == null) {
            inclusive = true;
        }
        
        var contains = false;
        if (inclusive) {
            contains = ((x >= this.left) && (x <= this.right) && 
                        (y >= this.bottom) && (y <= this.top));
        } else {
            contains = ((x > this.left) && (x < this.right) && 
                        (y > this.bottom) && (y < this.top));
        }              
        return contains;
    },

    /**
     * APIMethod: intersectsBounds
     * 
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     * inclusive - {<Boolean>} Whether or not to include the border. 
     *                         Default is true.
     *
     * Return:
     * {Boolean} Whether or not the passed-in OpenLayers.Bounds object 
     *           intersects this bounds. Simple math just check if either 
     *           contains the other, allowing for partial.
     */
    intersectsBounds:function(bounds, inclusive) {

        if (inclusive == null) {
            inclusive = true;
        }
        var inBottom = (bounds.bottom == this.bottom && bounds.top == this.top) ?
                    true : (((bounds.bottom > this.bottom) && (bounds.bottom < this.top)) || 
                           ((this.bottom > bounds.bottom) && (this.bottom < bounds.top))); 
        var inTop = (bounds.bottom == this.bottom && bounds.top == this.top) ?
                    true : (((bounds.top > this.bottom) && (bounds.top < this.top)) ||
                           ((this.top > bounds.bottom) && (this.top < bounds.top))); 
        var inRight = (bounds.right == this.right && bounds.left == this.left) ?
                    true : (((bounds.right > this.left) && (bounds.right < this.right)) ||
                           ((this.right > bounds.left) && (this.right < bounds.right))); 
        var inLeft = (bounds.right == this.right && bounds.left == this.left) ?
                    true : (((bounds.left > this.left) && (bounds.left < this.right)) || 
                           ((this.left > bounds.left) && (this.left < bounds.right))); 

        return (this.containsBounds(bounds, true, inclusive) ||
                bounds.containsBounds(this, true, inclusive) ||
                ((inTop || inBottom ) && (inLeft || inRight )));
    },
    
    /**
     * APIMethod: containsBounds
     * 
     * bounds - {<OpenLayers.Bounds>}
     * partial - {<Boolean>} If true, only part of passed-in 
     *                       <OpenLayers.Bounds> needs be within this bounds. 
     *                       If false, the entire passed-in bounds must be
     *                       within. Default is false
     * inclusive - {<Boolean>} Whether or not to include the border. 
     *                         Default is true.
     *
     * Return:
     * {Boolean} Whether or not the passed-in OpenLayers.Bounds object is 
     *           contained within this bounds. 
     */
    containsBounds:function(bounds, partial, inclusive) {

        //set defaults
        if (partial == null) {
            partial = false;
        }
        if (inclusive == null) {
            inclusive = true;
        }

        var inLeft;
        var inTop;
        var inRight;
        var inBottom;
        
        if (inclusive) {
            inLeft = (bounds.left >= this.left) && (bounds.left <= this.right);
            inTop = (bounds.top >= this.bottom) && (bounds.top <= this.top);
            inRight= (bounds.right >= this.left) && (bounds.right <= this.right);
            inBottom = (bounds.bottom >= this.bottom) && (bounds.bottom <= this.top);
        } else {
            inLeft = (bounds.left > this.left) && (bounds.left < this.right);
            inTop = (bounds.top > this.bottom) && (bounds.top < this.top);
            inRight= (bounds.right > this.left) && (bounds.right < this.right);
            inBottom = (bounds.bottom > this.bottom) && (bounds.bottom < this.top);
        }
        
        return (partial) ? (inTop || inBottom ) && (inLeft || inRight ) 
                         : (inTop && inLeft && inBottom && inRight);
    },

    /** 
     * APIMethod: determineQuadrant
     * 
     * Parameters:
     * lonlat - {<OpenLayers.LonLat>}
     * 
     * Return:
     * {String} The quadrant ("br" "tr" "tl" "bl") of the bounds in which 
     *          the coordinate lies.
     */
    determineQuadrant: function(lonlat) {
    
        var quadrant = "";
        var center = this.getCenterLonLat();
        
        quadrant += (lonlat.lat < center.lat) ? "b" : "t";
        quadrant += (lonlat.lon < center.lon) ? "l" : "r";
    
        return quadrant; 
    },

    /**
     * APIMethod: wrapDateLine
     *  
     * Parameters:
     * maxExtent - {<OpenLayers.Bounds>}
     * options - {Object} Some possible options are:
     *                    leftTolerance - {float} Allow for a margin of error 
     *                                            with the 'left' value of this 
     *                                            bound.
     *                                            Default is 0.
     *                    rightTolerance - {float} Allow for a margin of error 
     *                                             with the 'right' value of 
     *                                             this bound.
     *                                             Default is 0.
     * 
     * Return:
     * {<OpenLayers.Bounds>} A copy of this bounds, but wrapped around the 
     *                       "dateline" (as specified by the borders of 
     *                       maxExtent). Note that this function only returns 
     *                       a different bounds value if this bounds is 
     *                       *entirely* outside of the maxExtent. If this 
     *                       bounds straddles the dateline (is part in/part 
     *                       out of maxExtent), the returned bounds will be 
     *                       merely a copy of this one.
     */
    wrapDateLine: function(maxExtent, options) {    
        options = options || new Object();
        
        var leftTolerance = options.leftTolerance || 0;
        var rightTolerance = options.rightTolerance || 0;

        var newBounds = this.clone();
    
        if (maxExtent) {

           //shift right?
           while ( newBounds.left < maxExtent.left && 
                   (newBounds.right - rightTolerance) <= maxExtent.left ) { 
                newBounds = newBounds.add(maxExtent.getWidth(), 0);
           }

           //shift left?
           while ( (newBounds.left + leftTolerance) >= maxExtent.right && 
                   newBounds.right > maxExtent.right ) { 
                newBounds = newBounds.add(-maxExtent.getWidth(), 0);
           }
        }
                
        return newBounds;
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Bounds"
};

/** 
 * APIFunction: fromString
 * Alternative constructor that builds a new OpenLayers.Bounds from a 
 *     parameter string
 * 
 * Parameters: 
 * str - {String}Comma-separated bounds string. (ex. <i>"5,42,10,45"</i>)
 * 
 * Return:
 * {<OpenLayers.Bounds>} New <OpenLayers.Bounds> object built from the 
 *                       passed-in String.
 */
OpenLayers.Bounds.fromString = function(str) {
    var bounds = str.split(",");
    return OpenLayers.Bounds.fromArray(bounds);
};

/** 
 * APIFunction: fromArray
 * Alternative constructor that builds a new OpenLayers.Bounds
 *     from an array
 * 
 * Parameters:
 * bbox - {Array} Array of bounds values (ex. <i>[5,42,10,45]</i>)
 *
 * Return:
 * {<OpenLayers.Bounds>} New <OpenLayers.Bounds> object built from the 
 *                       passed-in Array.
 */
OpenLayers.Bounds.fromArray = function(bbox) {
    return new OpenLayers.Bounds(parseFloat(bbox[0]),
                                 parseFloat(bbox[1]),
                                 parseFloat(bbox[2]),
                                 parseFloat(bbox[3]));
};

/** 
 * APIFunction: fromSize
 * Alternative constructor that builds a new OpenLayers.Bounds
 *     from a size
 * 
 * Parameters:
 * size - {<OpenLayers.Size>} 
 *
 * Return:
 * {<OpenLayers.Bounds>} New <OpenLayers.Bounds> object built from the 
 *                       passed-in size.
 */
OpenLayers.Bounds.fromSize = function(size) {
    return new OpenLayers.Bounds(0,
                                 size.h,
                                 size.w,
                                 0);
};

/**
 * Function: oppositeQuadrant
 * Get the opposite quadrant for a given quadrant string.
 *
 * Parameters:
 * quadrant - {String} two character quadrant shortstring
 *
 * Return:
 * {String} The opposing quadrant ("br" "tr" "tl" "bl"). For Example, if 
 *          you pass in "bl" it returns "tr", if you pass in "br" it 
 *          returns "tl", etc.
 */
OpenLayers.Bounds.oppositeQuadrant = function(quadrant) {
    var opp = "";
    
    opp += (quadrant.charAt(0) == 't') ? 'b' : 't';
    opp += (quadrant.charAt(1) == 'l') ? 'r' : 'l';
    
    return opp;
};
