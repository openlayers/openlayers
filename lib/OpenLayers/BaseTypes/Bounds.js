/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * Class: OpenLayers.Bounds
 * Instances of this class represent bounding boxes.  Data stored as left,
 * bottom, right, top floats. All values are initialized to null, however,
 * you should make sure you set them before using the bounds for anything.
 * 
 * Possible use case:
 * > bounds = new OpenLayers.Bounds();
 * > bounds.extend(new OpenLayers.LonLat(4,5));
 * > bounds.extend(new OpenLayers.LonLat(5,6));
 * > bounds.toBBOX(); // returns 4,5,5,6
 */
OpenLayers.Bounds = OpenLayers.Class({

    /**
     * Property: left
     * {Number} Minimum horizontal coordinate.
     */
    left: null,

    /**
     * Property: bottom
     * {Number} Minimum vertical coordinate.
     */
    bottom: null,

    /**
     * Property: right
     * {Number} Maximum horizontal coordinate.
     */
    right: null,

    /**
     * Property: top
     * {Number} Maximum vertical coordinate.
     */
    top: null,    

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
        if (left != null) {
            this.left = parseFloat(left);
        }
        if (bottom != null) {
            this.bottom = parseFloat(bottom);
        }
        if (right != null) {
            this.right = parseFloat(right);
        }
        if (top != null) {
            this.top = parseFloat(top);
        }
    },

    /**
     * Method: clone
     * Create a cloned instance of this bounds.
     *
     * Returns:
     * {<OpenLayers.Bounds>} A fresh copy of the bounds
     */
    clone:function() {
        return new OpenLayers.Bounds(this.left, this.bottom, 
                                     this.right, this.top);
    },

    /**
     * Method: equals
     * Test a two bounds for equivalence.
     *
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     *
     * Returns:
     * {Boolean} The passed-in bounds object has the same left,
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
     * Returns:
     * {String} String representation of bounds object. 
     *          (ex.<i>"left-bottom=(5,42) right-top=(10,45)"</i>)
     */
    toString:function() {
        return ( "left-bottom=(" + this.left + "," + this.bottom + ")"
                 + " right-top=(" + this.right + "," + this.top + ")" );
    },

    /**
     * APIMethod: toArray
     *
     * Returns:
     * {Array} array of left, bottom, right, top
     */
    toArray: function() {
        return [this.left, this.bottom, this.right, this.top];
    },    

    /** 
     * APIMethod: toBBOX
     * 
     * Parameters:
     * decimal - {Integer} How many significant digits in the bbox coords?
     *                     Default is 6
     * 
     * Returns:
     * {String} Simple String representation of bounds object.
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
     * APIMethod: toGeometry
     * Create a new polygon geometry based on this bounds.
     *
     * Returns:
     * {<OpenLayers.Geometry.Polygon>} A new polygon with the coordinates
     *     of this bounds.
     */
    toGeometry: function() {
        return new OpenLayers.Geometry.Polygon([
            new OpenLayers.Geometry.LinearRing([
                new OpenLayers.Geometry.Point(this.left, this.bottom),
                new OpenLayers.Geometry.Point(this.right, this.bottom),
                new OpenLayers.Geometry.Point(this.right, this.top),
                new OpenLayers.Geometry.Point(this.left, this.top)
            ])
        ]);
    },
    
    /**
     * APIMethod: getWidth
     * 
     * Returns:
     * {Float} The width of the bounds
     */
    getWidth:function() {
        return (this.right - this.left);
    },

    /**
     * APIMethod: getHeight
     * 
     * Returns:
     * {Float} The height of the bounds (top minus bottom).
     */
    getHeight:function() {
        return (this.top - this.bottom);
    },

    /**
     * APIMethod: getSize
     * 
     * Returns:
     * {<OpenLayers.Size>} The size of the box.
     */
    getSize:function() {
        return new OpenLayers.Size(this.getWidth(), this.getHeight());
    },

    /**
     * APIMethod: getCenterPixel
     * 
     * Returns:
     * {<OpenLayers.Pixel>} The center of the bounds in pixel space.
     */
    getCenterPixel:function() {
        return new OpenLayers.Pixel( (this.left + this.right) / 2,
                                     (this.bottom + this.top) / 2);
    },

    /**
     * APIMethod: getCenterLonLat
     * 
     * Returns:
     * {<OpenLayers.LonLat>} The center of the bounds in map space.
     */
    getCenterLonLat:function() {
        return new OpenLayers.LonLat( (this.left + this.right) / 2,
                                      (this.bottom + this.top) / 2);
    },

    /**
     * Method: scale
     * Scales the bounds around a pixel or lonlat. Note that the new 
     *     bounds may return non-integer properties, even if a pixel
     *     is passed. 
     * 
     * Parameters:
     * ratio - {Float} 
     * origin - {<OpenLayers.Pixel> or <OpenLayers.LonLat>}
     *          Default is center.
     *
     * Returns:
     * {<OpenLayers.Bound>} A new bounds that is scaled by ratio
     *                      from origin.
     */

    scale: function(ratio, origin){
        if(origin == null){
            origin = this.getCenterLonLat();
        }

        var bounds = [];
        
        var origx,origy;

        // get origin coordinates
        if(origin.CLASS_NAME == "OpenLayers.LonLat"){
            origx = origin.lon;
            origy = origin.lat;
        } else {
            origx = origin.x;
            origy = origin.y;
        }

        var left = (this.left - origx) * ratio + origx;
        var bottom = (this.bottom - origy) * ratio + origy;
        var right = (this.right - origx) * ratio + origx;
        var top = (this.top - origy) * ratio + origy;

        return new OpenLayers.Bounds(left, bottom, right, top);
    },

    /**
     * APIMethod: add
     * 
     * Parameters:
     * x - {Float}
     * y - {Float}
     * 
     * Returns:
     * {<OpenLayers.Bounds>} A new bounds whose coordinates are the same as
     *     this, but shifted by the passed-in x and y values.
     */
    add:function(x, y) {
        if ( (x == null) || (y == null) ) {
            var msg = OpenLayers.i18n("boundsAddError");
            OpenLayers.Console.error(msg);
            return null;
        }
        return new OpenLayers.Bounds(this.left + x, this.bottom + y,
                                     this.right + x, this.top + y);
    },
    
    /**
     * APIMethod: extend
     * Extend the bounds to include the point, lonlat, or bounds specified.
     *     Note, this function assumes that left < right and bottom < top.
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
                if ( (this.left == null) || (bounds.left < this.left)) {
                    this.left = bounds.left;
                }
                if ( (this.bottom == null) || (bounds.bottom < this.bottom) ) {
                    this.bottom = bounds.bottom;
                } 
                if ( (this.right == null) || (bounds.right > this.right) ) {
                    this.right = bounds.right;
                }
                if ( (this.top == null) || (bounds.top > this.top) ) { 
                    this.top = bounds.top;
                }
            }
        }
    },

    /**
     * APIMethod: containsLonLat
     * 
     * Parameters:
     * ll - {<OpenLayers.LonLat>}
     * inclusive - {Boolean} Whether or not to include the border.
     *     Default is true.
     *
     * Returns:
     * {Boolean} The passed-in lonlat is within this bounds.
     */
    containsLonLat:function(ll, inclusive) {
        return this.contains(ll.lon, ll.lat, inclusive);
    },

    /**
     * APIMethod: containsPixel
     * 
     * Parameters:
     * px - {<OpenLayers.Pixel>}
     * inclusive - {Boolean} Whether or not to include the border. Default is
     *     true.
     *
     * Returns:
     * {Boolean} The passed-in pixel is within this bounds.
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
     * inclusive - {Boolean} Whether or not to include the border. Default is
     *     true.
     *
     * Returns:
     * {Boolean} Whether or not the passed-in coordinates are within this
     *     bounds.
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
     * inclusive - {Boolean} Whether or not to include the border.  Default
     *     is true.
     *
     * Returns:
     * {Boolean} The passed-in OpenLayers.Bounds object intersects this bounds.
     *     Simple math just check if either contains the other, allowing for
     *     partial.
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
     * partial - {Boolean} If true, only part of passed-in bounds needs be
     *     within this bounds.  If false, the entire passed-in bounds must be
     *     within. Default is false
     * inclusive - {Boolean} Whether or not to include the border. Default is
     *     true.
     *
     * Returns:
     * {Boolean} The passed-in bounds object is contained within this bounds. 
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
     * Returns:
     * {String} The quadrant ("br" "tr" "tl" "bl") of the bounds in which the
     *     coordinate lies.
     */
    determineQuadrant: function(lonlat) {
    
        var quadrant = "";
        var center = this.getCenterLonLat();
        
        quadrant += (lonlat.lat < center.lat) ? "b" : "t";
        quadrant += (lonlat.lon < center.lon) ? "l" : "r";
    
        return quadrant; 
    },
    
    /**
     * APIMethod: transform
     * Transform the Bounds object from source to dest. 
     *
     * Parameters: 
     * source - {<OpenLayers.Projection>} Source projection. 
     * dest   - {<OpenLayers.Projection>} Destination projection. 
     *
     * Returns:
     * {<OpenLayers.Bounds>} Itself, for use in chaining operations.
     */
    transform: function(source, dest) {
        var ll = OpenLayers.Projection.transform(
            {'x': this.left, 'y': this.bottom}, source, dest);
        var lr = OpenLayers.Projection.transform(
            {'x': this.right, 'y': this.bottom}, source, dest);
        var ul = OpenLayers.Projection.transform(
            {'x': this.left, 'y': this.top}, source, dest);
        var ur = OpenLayers.Projection.transform(
            {'x': this.right, 'y': this.top}, source, dest);
        this.left   = Math.min(ll.x, ul.x);
        this.bottom = Math.min(ll.y, lr.y);
        this.right  = Math.max(lr.x, ur.x);
        this.top    = Math.max(ul.y, ur.y);
        return this;
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
     * Returns:
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
        options = options || {};
        
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

    CLASS_NAME: "OpenLayers.Bounds"
});

/** 
 * APIFunction: fromString
 * Alternative constructor that builds a new OpenLayers.Bounds from a 
 *     parameter string
 * 
 * Parameters: 
 * str - {String}Comma-separated bounds string. (ex. <i>"5,42,10,45"</i>)
 * 
 * Returns:
 * {<OpenLayers.Bounds>} New bounds object built from the 
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
 * bbox - {Array(Float)} Array of bounds values (ex. <i>[5,42,10,45]</i>)
 *
 * Returns:
 * {<OpenLayers.Bounds>} New bounds object built from the passed-in Array.
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
 * Returns:
 * {<OpenLayers.Bounds>} New bounds object built from the passed-in size.
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
 * Returns:
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
