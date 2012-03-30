/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/BaseTypes/Class.js
 */

/**
 * Class: OpenLayers.Bounds
 * Instances of this class represent bounding boxes.  Data stored as left,
 * bottom, right, top floats. All values are initialized to null, however,
 * you should make sure you set them before using the bounds for anything.
 * 
 * Possible use case:
 * (code)
 *     bounds = new OpenLayers.Bounds();
 *     bounds.extend(new OpenLayers.LonLat(4,5));
 *     bounds.extend(new OpenLayers.LonLat(5,6));
 *     bounds.toBBOX(); // returns 4,5,5,6
 * (end)
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
     * Property: centerLonLat
     * {<OpenLayers.LonLat>} A cached center location.  This should not be
     *     accessed directly.  Use <getCenterLonLat> instead.
     */
    centerLonLat: null,

    /**
     * Constructor: OpenLayers.Bounds
     * Construct a new bounds object. Coordinates can either be passed as four
     * arguments, or as a single argument.
     *
     * Parameters (four arguments):
     * left - {Number} The left bounds of the box.  Note that for width
     *        calculations, this is assumed to be less than the right value.
     * bottom - {Number} The bottom bounds of the box.  Note that for height
     *          calculations, this is assumed to be more than the top value.
     * right - {Number} The right bounds.
     * top - {Number} The top bounds.
     *
     * Parameters (single argument):
     * bounds - {Array(Number)} [left, bottom, right, top]
     */
    initialize: function(left, bottom, right, top) {
        if (OpenLayers.Util.isArray(left)) {
            top = left[3];
            right = left[2];
            bottom = left[1];
            left = left[0];
        }
        if (left != null) {
            this.left = OpenLayers.Util.toFloat(left);
        }
        if (bottom != null) {
            this.bottom = OpenLayers.Util.toFloat(bottom);
        }
        if (right != null) {
            this.right = OpenLayers.Util.toFloat(right);
        }
        if (top != null) {
            this.top = OpenLayers.Util.toFloat(top);
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
     */
    toString:function() {
        return [this.left, this.bottom, this.right, this.top].join(",");
    },

    /**
     * APIMethod: toArray
     *
     * Parameters:
     * reverseAxisOrder - {Boolean} Should we reverse the axis order?
     *
     * Returns:
     * {Array} array of left, bottom, right, top
     */
    toArray: function(reverseAxisOrder) {
        if (reverseAxisOrder === true) {
            return [this.bottom, this.left, this.top, this.right];
        } else {
            return [this.left, this.bottom, this.right, this.top];
        }
    },    

    /** 
     * APIMethod: toBBOX
     * 
     * Parameters:
     * decimal - {Integer} How many significant digits in the bbox coords?
     *                     Default is 6
     * reverseAxisOrder - {Boolean} Should we reverse the axis order?
     * 
     * Returns:
     * {String} Simple String representation of bounds object.
     *          (e.g. <i>"5,42,10,45"</i>)
     */
    toBBOX:function(decimal, reverseAxisOrder) {
        if (decimal== null) {
            decimal = 6; 
        }
        var mult = Math.pow(10, decimal);
        var xmin = Math.round(this.left * mult) / mult;
        var ymin = Math.round(this.bottom * mult) / mult;
        var xmax = Math.round(this.right * mult) / mult;
        var ymax = Math.round(this.top * mult) / mult;
        if (reverseAxisOrder === true) {
            return ymin + "," + xmin + "," + ymax + "," + xmax;
        } else {
            return xmin + "," + ymin + "," + xmax + "," + ymax;
        }
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
        if(!this.centerLonLat) {
            this.centerLonLat = new OpenLayers.LonLat(
                (this.left + this.right) / 2, (this.bottom + this.top) / 2
            );
        }
        return this.centerLonLat;
    },

    /**
     * APIMethod: scale
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
     * {<OpenLayers.Bounds>} A new bounds that is scaled by ratio
     *                      from origin.
     */
    scale: function(ratio, origin){
        if(origin == null){
            origin = this.getCenterLonLat();
        }
        
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
            throw new TypeError('Bounds.add cannot receive null values');
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
            // clear cached center location
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
                this.centerLonLat = null;
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
     * ll - {<OpenLayers.LonLat>|Object} OpenLayers.LonLat or an
     *     object with a 'lon' and 'lat' properties.
     * options - {Object} Optional parameters
     *
     * Acceptable options:
     * inclusive - {Boolean} Whether or not to include the border.
     *     Default is true.
     * worldBounds - {<OpenLayers.Bounds>} If a worldBounds is provided, the
     *     ll will be considered as contained if it exceeds the world bounds,
     *     but can be wrapped around the dateline so it is contained by this
     *     bounds.
     *
     * Returns:
     * {Boolean} The passed-in lonlat is within this bounds.
     */
    containsLonLat: function(ll, options) {
        if (typeof options === "boolean") {
            options =  {inclusive: options};
        }
        options = options || {};
        var contains = this.contains(ll.lon, ll.lat, options.inclusive),
            worldBounds = options.worldBounds;
        if (worldBounds && !contains) {
            var worldWidth = worldBounds.getWidth();
            var worldCenterX = (worldBounds.left + worldBounds.right) / 2;
            var worldsAway = Math.round((ll.lon - worldCenterX) / worldWidth);
            contains = this.containsLonLat({
                lon: ll.lon - worldsAway * worldWidth,
                lat: ll.lat
            }, {inclusive: options.inclusive});
        }
        return contains;
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

        if (x == null || y == null) {
            return false;
        }

        x = OpenLayers.Util.toFloat(x);
        y = OpenLayers.Util.toFloat(y);

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
     * Determine whether the target bounds intersects this bounds.  Bounds are
     *     considered intersecting if any of their edges intersect or if one
     *     bounds contains the other.
     * 
     * Parameters:
     * bounds - {<OpenLayers.Bounds>} The target bounds.
     * options - {Object} Optional parameters.
     * 
     * Acceptable options:
     * inclusive - {Boolean} Treat coincident borders as intersecting.  Default
     *     is true.  If false, bounds that do not overlap but only touch at the
     *     border will not be considered as intersecting.
     * worldBounds - {<OpenLayers.Bounds>} If a worldBounds is provided, two
     *     bounds will be considered as intersecting if they intersect when 
     *     shifted to within the world bounds.  This applies only to bounds that
     *     cross or are completely outside the world bounds.
     *
     * Returns:
     * {Boolean} The passed-in bounds object intersects this bounds.
     */
    intersectsBounds:function(bounds, options) {
        if (typeof options === "boolean") {
            options =  {inclusive: options};
        }
        options = options || {};
        if (options.worldBounds) {
            var self = this.wrapDateLine(options.worldBounds);
            bounds = bounds.wrapDateLine(options.worldBounds);
        } else {
            self = this;
        }
        if (options.inclusive == null) {
            options.inclusive = true;
        }
        var intersects = false;
        var mightTouch = (
            self.left == bounds.right ||
            self.right == bounds.left ||
            self.top == bounds.bottom ||
            self.bottom == bounds.top
        );
        
        // if the two bounds only touch at an edge, and inclusive is false,
        // then the bounds don't *really* intersect.
        if (options.inclusive || !mightTouch) {
            // otherwise, if one of the boundaries even partially contains another,
            // inclusive of the edges, then they do intersect.
            var inBottom = (
                ((bounds.bottom >= self.bottom) && (bounds.bottom <= self.top)) ||
                ((self.bottom >= bounds.bottom) && (self.bottom <= bounds.top))
            );
            var inTop = (
                ((bounds.top >= self.bottom) && (bounds.top <= self.top)) ||
                ((self.top > bounds.bottom) && (self.top < bounds.top))
            );
            var inLeft = (
                ((bounds.left >= self.left) && (bounds.left <= self.right)) ||
                ((self.left >= bounds.left) && (self.left <= bounds.right))
            );
            var inRight = (
                ((bounds.right >= self.left) && (bounds.right <= self.right)) ||
                ((self.right >= bounds.left) && (self.right <= bounds.right))
            );
            intersects = ((inBottom || inTop) && (inLeft || inRight));
        }
        // document me
        if (options.worldBounds && !intersects) {
            var world = options.worldBounds;
            var width = world.getWidth();
            var selfCrosses = !world.containsBounds(self);
            var boundsCrosses = !world.containsBounds(bounds);
            if (selfCrosses && !boundsCrosses) {
                bounds = bounds.add(-width, 0);
                intersects = self.intersectsBounds(bounds, {inclusive: options.inclusive});
            } else if (boundsCrosses && !selfCrosses) {
                self = self.add(-width, 0);
                intersects = bounds.intersectsBounds(self, {inclusive: options.inclusive});                
            }
        }
        return intersects;
    },
    
    /**
     * APIMethod: containsBounds
     * Determine whether the target bounds is contained within this bounds.
     * 
     * bounds - {<OpenLayers.Bounds>} The target bounds.
     * partial - {Boolean} If any of the target corners is within this bounds
     *     consider the bounds contained.  Default is false.  If false, the
     *     entire target bounds must be contained within this bounds.
     * inclusive - {Boolean} Treat shared edges as contained.  Default is
     *     true.
     *
     * Returns:
     * {Boolean} The passed-in bounds object is contained within this bounds. 
     */
    containsBounds:function(bounds, partial, inclusive) {
        if (partial == null) {
            partial = false;
        }
        if (inclusive == null) {
            inclusive = true;
        }
        var bottomLeft  = this.contains(bounds.left, bounds.bottom, inclusive);
        var bottomRight = this.contains(bounds.right, bounds.bottom, inclusive);
        var topLeft  = this.contains(bounds.left, bounds.top, inclusive);
        var topRight = this.contains(bounds.right, bounds.top, inclusive);
        
        return (partial) ? (bottomLeft || bottomRight || topLeft || topRight)
                         : (bottomLeft && bottomRight && topLeft && topRight);
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
        // clear cached center location
        this.centerLonLat = null;
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
     *
     * Allowed Options:
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
     *                       out of maxExtent), the returned bounds will always 
     *                       cross the left edge of the given maxExtent.
     *.
     */
    wrapDateLine: function(maxExtent, options) {    
        options = options || {};
        
        var leftTolerance = options.leftTolerance || 0;
        var rightTolerance = options.rightTolerance || 0;

        var newBounds = this.clone();
    
        if (maxExtent) {
            var width = maxExtent.getWidth();

            //shift right?
            while (newBounds.left < maxExtent.left && 
                   newBounds.right - rightTolerance <= maxExtent.left ) { 
                newBounds = newBounds.add(width, 0);
            }

            //shift left?
            while (newBounds.left + leftTolerance >= maxExtent.right && 
                   newBounds.right > maxExtent.right ) { 
                newBounds = newBounds.add(-width, 0);
            }
           
            // crosses right only? force left
            var newLeft = newBounds.left + leftTolerance;
            if (newLeft < maxExtent.right && newLeft > maxExtent.left && 
                   newBounds.right - rightTolerance > maxExtent.right) {
                newBounds = newBounds.add(-width, 0);
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
 * str - {String}Comma-separated bounds string. (e.g. <i>"5,42,10,45"</i>)
 * reverseAxisOrder - {Boolean} Does the string use reverse axis order?
 * 
 * Returns:
 * {<OpenLayers.Bounds>} New bounds object built from the 
 *                       passed-in String.
 */
OpenLayers.Bounds.fromString = function(str, reverseAxisOrder) {
    var bounds = str.split(",");
    return OpenLayers.Bounds.fromArray(bounds, reverseAxisOrder);
};

/** 
 * APIFunction: fromArray
 * Alternative constructor that builds a new OpenLayers.Bounds
 *     from an array
 * 
 * Parameters:
 * bbox - {Array(Float)} Array of bounds values (e.g. <i>[5,42,10,45]</i>)
 * reverseAxisOrder - {Boolean} Does the array use reverse axis order?
 *
 * Returns:
 * {<OpenLayers.Bounds>} New bounds object built from the passed-in Array.
 */
OpenLayers.Bounds.fromArray = function(bbox, reverseAxisOrder) {
    return reverseAxisOrder === true ?
           new OpenLayers.Bounds(bbox[1], bbox[0], bbox[3], bbox[2]) :
           new OpenLayers.Bounds(bbox[0], bbox[1], bbox[2], bbox[3]);
};

/** 
 * APIFunction: fromSize
 * Alternative constructor that builds a new OpenLayers.Bounds
 *     from a size
 * 
 * Parameters:
 * size - {<OpenLayers.Size>|Object} OpenLayers.Size or an object with
 *     a 'w' and 'h' properties.
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
