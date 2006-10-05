/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

/* OpenLayers.Class metaclass */
OpenLayers.Class = {
  create: function() {
    return function() {
      this.initialize.apply(this, arguments);
    }
  }
};

/*********************
 *                   *
 *      PIXEL        * 
 *                   * 
 *********************/

/**
 * @class 
 * 
 * This class represents a screen coordinate, in x and y coordinates
 */
OpenLayers.Pixel = OpenLayers.Class.create();
OpenLayers.Pixel.prototype = {
    
    /** @type float */
    x: 0.0,

    /** @type float */
    y: 0.0,
    
    /** 
    * @constructor
    *
    * @param {float} x
    * @param {float} y
    */
    initialize: function(x, y) {
        this.x = parseFloat(x);
        this.y = parseFloat(y);
    },
    
    /**
    * @return string representation of Pixel. ex: "x=200.4,y=242.2"
    * @type str
    */
    toString:function() {
        return ("x=" + this.x + ",y=" + this.y);
    },

    /**
     * @type OpenLayers.Pixel
     */
    clone:function() {
        return new OpenLayers.Pixel(this.x, this.y); 
    },
    
    /** 
    * @param {OpenLayers.Pixel} px
    * 
    * @return whether or not the point passed in as parameter is equal to this
    *          note that if px passed in is null, returns false
    * @type bool
    */
    equals:function(px) {
        var equals = false;
        if (px != null) {
            equals = ((this.x == px.x && this.y == px.y) ||
                      (isNaN(this.x) && isNaN(this.y) && isNaN(px.x) && isNaN(px.y)));
        }
        return equals;
    },

    /**
    * @param {int} x
    * @param {int} y
    * 
    * @return a new Pixel with this pixel's x&y augmented by the 
    *         values passed in.
    * @type OpenLayers.Pixel
    */
    add:function(x, y) {
        return new OpenLayers.Pixel(this.x + x, this.y + y);
    },

    /**
    * @param {OpenLayers.Pixel} px
    * 
    * @return a new Pixel with this pixel's x&y augmented by the 
    *         x&y values of the pixel passed in.
    * @type OpenLayers.Pixel
    */
    offset:function(px) {
        return this.add(px.x, px.y);                
    },
    
    /** @final @type str */
    CLASS_NAME: "OpenLayers.Pixel"
};


/*********************
 *                   *
 *      SIZE         * 
 *                   * 
 *********************/


/**
* @class 
* 
* This class represents a width and height pair
*/
OpenLayers.Size = OpenLayers.Class.create();
OpenLayers.Size.prototype = {

    /** @type float */
    w: 0.0,
    
    /** @type float */
    h: 0.0,


    /** 
    * @constructor
    * 
    * @param {float} w 
    * @param {float} h 
    */
    initialize: function(w, h) {
        this.w = parseFloat(w);
        this.h = parseFloat(h);
    },

    /** 
    * @return String representation of OpenLayers.Size object. 
    *         (ex. <i>"w=55,h=66"</i>)
    * @type String
    */
    toString:function() {
        return ("w=" + this.w + ",h=" + this.h);
    },

    /** 
     * @return New OpenLayers.Size object with the same w and h values
     * @type OpenLayers.Size
     */
    clone:function() {
        return new OpenLayers.Size(this.w, this.h);
    },

    /** 
    * @param {OpenLayers.Size} sz
    * @returns Boolean value indicating whether the passed-in OpenLayers.Size 
    *          object has the same w and h components as this
    *          note that if sz passed in is null, returns false
    *
    * @type bool
    */
    equals:function(sz) {
        var equals = false;
        if (sz != null) {
            equals = ((this.w == sz.w && this.h == sz.h) ||
                      (isNaN(this.w) && isNaN(this.h) && isNaN(sz.w) && isNaN(sz.h)));
        }
        return equals;
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Size"
};

/*********************
 *                   *
 *      LONLAT       * 
 *                   * 
 *********************/


/**
* @class 
* 
* This class represents a longitude and latitude pair
*/
OpenLayers.LonLat = OpenLayers.Class.create();
OpenLayers.LonLat.prototype = {

    /** @type float */
    lon: 0.0,
    
    /** @type float */
    lat: 0.0,

    /**
    * @constructor
    * 
    * @param {float} lon
    * @param {float} lat
    */
    initialize: function(lon, lat) {
        this.lon = parseFloat(lon);
        this.lat = parseFloat(lat);
    },
    
    /** 
    * @return String representation of OpenLayers.LonLat object. 
    *         (ex. <i>"lon=5,lat=42"</i>)
    * @type String
    */
    toString:function() {
        return ("lon=" + this.lon + ",lat=" + this.lat);
    },

    /** 
    * @return Shortened String representation of OpenLayers.LonLat object. 
    *         (ex. <i>"5, 42"</i>)
    * @type String
    */
    toShortString:function() {
        return (this.lon + ", " + this.lat);
    },

    /** 
     * @return New OpenLayers.LonLat object with the same lon and lat values
     * @type OpenLayers.LonLat
     */
    clone:function() {
        return new OpenLayers.LonLat(this.lon, this.lat);
    },

    /** 
    * @param {float} lon
    * @param {float} lat
    *
    * @return A new OpenLayers.LonLat object with the lon and lat passed-in
    *         added to this's. 
    * @type OpenLayers.LonLat
    */
    add:function(lon, lat) {
        return new OpenLayers.LonLat(this.lon + lon, this.lat + lat);
    },

    /** 
    * @param {OpenLayers.LonLat} ll
    * @returns Boolean value indicating whether the passed-in OpenLayers.LonLat
    *          object has the same lon and lat components as this
    *          note that if ll passed in is null, returns false
    *
    * @type bool
    */
    equals:function(ll) {
        var equals = false;
        if (ll != null) {
            equals = ((this.lon == ll.lon && this.lat == ll.lat) ||
                      (isNaN(this.lon) && isNaN(this.lat) && isNaN(ll.lon) && isNaN(ll.lat)));
        }
        return equals;
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.LonLat"
};

/** Alternative constructor that builds a new OpenLayers.LonLat from a 
*    parameter string
* 
* @constructor
* 
* @param {String} str Comma-separated Lon,Lat coordinate string. 
*                     (ex. <i>"5,40"</i>)
*
* @returns New OpenLayers.LonLat object built from the passed-in String.
* @type OpenLayers.LonLat
*/
OpenLayers.LonLat.fromString = function(str) {
    var pair = str.split(",");
    return new OpenLayers.LonLat(parseFloat(pair[0]), 
                                 parseFloat(pair[1]));
};



/*********************
 *                   *
 *      BOUNDS       * 
 *                   * 
 *********************/




/**
* @class 
* 
* This class represents a bounding box. 
* Data stored as left, bottom, right, top floats
*/
OpenLayers.Bounds = OpenLayers.Class.create();
OpenLayers.Bounds.prototype = {

    /** @type float */
    left: 0.0,

    /** @type float */
    bottom: 0.0,

    /** @type float */
    right: 0.0,

    /** @type float */
    top: 0.0,    

    /**
    * @constructor
    *
    * @param {float} left
    * @param {float} bottom
    * @param {float} right
    * @param {float} top
    *
    */
    initialize: function(left, bottom, right, top) {
        this.left = parseFloat(left);
        this.bottom = parseFloat(bottom);
        this.right = parseFloat(right);
        this.top = parseFloat(top);
    },

    /**
     * @returns A fresh copy of the bounds
     * @type OpenLayers.Bounds
     */
    clone:function() {
        return new OpenLayers.Bounds(this.left, this.bottom, 
                                     this.right, this.top);
    },

    /** 
    * @param {OpenLayers.Bounds} bounds
    * @returns Boolean value indicating whether the passed-in OpenLayers.Bounds
    *          object has the same left, right, top, bottom components as this
    *           note that if bounds passed in is null, returns false
    *
    * @type bool
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
    * @return String representation of OpenLayers.Bounds object. 
    *         (ex.<i>"left-bottom=(5,42) right-top=(10,45)"</i>)
    * @type String
    */
    toString:function(){
        return ( "left-bottom=(" + this.left + "," + this.bottom + ")"
                 + " right-top=(" + this.right + "," + this.top + ")" );
    },

    /** 
     * @param {int} decimal How many significant digits in the bbox coords?
     *                      Default is 6
     * 
     * @returns Simple String representation of OpenLayers.Bounds object.
     *         (ex. <i>"5,42,10,45"</i>)
     * @type String
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
    * @returns The width of the bounds
    * @type float
    */
    getWidth:function() {
        return (this.right - this.left);
    },

    /**
    * @returns The height of the bounds
    * @type float
    */
    getHeight:function() {
        return (this.top - this.bottom);
    },

    /**
    * @returns An OpenLayers.Size which represents the size of the box
    * @type OpenLayers.Size
    */
    getSize:function() {
        return new OpenLayers.Size(this.getWidth(), this.getHeight());
    },

    /**
    * @returns An OpenLayers.Pixel which represents the center of the bounds
    * @type OpenLayers.Pixel
    */
    getCenterPixel:function() {
        return new OpenLayers.Pixel( (this.left + this.right) / 2,
                                     (this.bottom + this.top) / 2);
    },

    /**
    * @returns An OpenLayers.LonLat which represents the center of the bounds
    * @type OpenLayers.LonLat
    */
    getCenterLonLat:function() {
        return new OpenLayers.LonLat( (this.left + this.right) / 2,
                                      (this.bottom + this.top) / 2);
    },

    /**
    * @param {float} x
    * @param {float} y
    *
    * @returns A new OpenLayers.Bounds whose coordinates are the same as this, 
    *          but shifted by the passed-in x and y values
    * @type OpenLayers.Bounds
    */
    add:function(x, y){
        return new OpenLayers.Bounds(this.left + x, this.bottom + y,
                                     this.right + x, this.top + y);
    },

    /**
     * @param {OpenLayers.LonLat} ll
     * @param {Boolean} inclusive Whether or not to include the border. 
     *                            Default is true
     *
     * @return Whether or not the passed-in lonlat is within this bounds
     * @type Boolean
     */
    containsLonLat:function(ll, inclusive) {
        return this.contains(ll.lon, ll.lat, inclusive);
    },

    /**
     * @param {OpenLayers.Pixel} px
     * @param {Boolean} inclusive Whether or not to include the border. 
     *                            Default is true
     *
     * @return Whether or not the passed-in pixel is within this bounds
     * @type Boolean
     */
    containsPixel:function(px, inclusive) {
        return this.contains(px.x, px.y, inclusive);
    },
    
    /**
    * @param {float} x
    * @param {float} y
    * @param {Boolean} inclusive Whether or not to include the border. 
    *                            Default is true
    *
    * @return Whether or not the passed-in coordinates are within this bounds
    * @type Boolean
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
     * @param {OpenLayers.Bounds} bounds
     * @param {Boolean} inclusive Whether or not to include the border. 
     *                            Default is true
     *
     * @return Whether or not the passed-in OpenLayers.Bounds object intersects
     *         this bounds. Simple math just check if either contains the other, 
     *         allowing for partial.
     * @type Boolean
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
    * @param {OpenLayers.Bounds} bounds
    * @param {Boolean} partial If true, only part of passed-in 
    *                          OpenLayers.Bounds needs be within this bounds. 
    *                          If false, the entire passed-in bounds must be
    *                          within. Default is false
    * @param {Boolean} inclusive Whether or not to include the border. 
    *                            Default is true
    *
    * @return Whether or not the passed-in OpenLayers.Bounds object is 
    *         contained within this bounds. 
    * @type Boolean
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
     * @param {OpenLayers.LonLat} lonlat
     *
     * @returns The quadrant ("br" "tr" "tl" "bl") of the bounds in which 
     *           the coordinate lies.
     * @type String
     */
    determineQuadrant: function(lonlat) {
    
        var quadrant = "";
        var center = this.getCenterLonLat();
        
        quadrant += (lonlat.lat < center.lat) ? "b" : "t";
        quadrant += (lonlat.lon < center.lon) ? "l" : "r";
    
        return quadrant; 
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Bounds"
};

/** Alternative constructor that builds a new OpenLayers.Bounds from a 
*    parameter string
* 
* @constructor
* 
* @param {String} str Comma-separated bounds string. (ex. <i>"5,42,10,45"</i>)
*
* @returns New OpenLayers.Bounds object built from the passed-in String.
* @type OpenLayers.Bounds
*/
OpenLayers.Bounds.fromString = function(str) {
    var bounds = str.split(",");
    return OpenLayers.Bounds.fromArray(bounds);
};

/** Alternative constructor that builds a new OpenLayers.Bounds
*    from an array
* 
* @constructor
* 
* @param {Array} bbox Array of bounds values (ex. <i>[5,42,10,45]</i>)
*
* @returns New OpenLayers.Bounds object built from the passed-in Array.
* @type OpenLayers.Bounds
*/
OpenLayers.Bounds.fromArray = function(bbox) {
    return new OpenLayers.Bounds(parseFloat(bbox[0]),
                                 parseFloat(bbox[1]),
                                 parseFloat(bbox[2]),
                                 parseFloat(bbox[3]));
};

/** Alternative constructor that builds a new OpenLayers.Bounds
*    from an OpenLayers.Size
* 
* @constructor
* 
* @param {OpenLayers.Size} size
*            
* @returns New OpenLayers.Bounds object built with top and left set to 0 and
*           bottom right taken from the passed-in OpenLayers.Size.
* @type OpenLayers.Bounds
*/
OpenLayers.Bounds.fromSize = function(size) {
    return new OpenLayers.Bounds(0,
                                 size.h,
                                 size.w,
                                 0);
};
/**
 * @param {String} quadrant 
 * 
 * @returns The opposing quadrant ("br" "tr" "tl" "bl"). For Example, if 
 *           you pass in "bl" it returns "tr", if you pass in "br" it 
 *           returns "tl", etc.
 * @type String
 */
OpenLayers.Bounds.oppositeQuadrant = function(quadrant) {
    var opp = "";
    
    opp += (quadrant.charAt(0) == 't') ? 'b' : 't';
    opp += (quadrant.charAt(1) == 'l') ? 'r' : 'l';
    
    return opp;
};


/*********************
 *                   *
 *      ELEMENT      * 
 *                   * 
 *********************/

OpenLayers.Element = {
  visible: function(element) {
    return $(element).style.display != 'none';
  },

  toggle: function() {
    for (var i = 0; i < arguments.length; i++) {
      var element = $(arguments[i]);
      OpenLayers.Element[OpenLayers.Element.visible(element) ? 'hide' : 'show'](element);
    }
  },

  hide: function() {
    for (var i = 0; i < arguments.length; i++) {
      var element = $(arguments[i]);
      element.style.display = 'none';
    }
  },

  show: function() {
    for (var i = 0; i < arguments.length; i++) {
      var element = $(arguments[i]);
      element.style.display = '';
    }
  },

  remove: function(element) {
    element = $(element);
    element.parentNode.removeChild(element);
  },

  getHeight: function(element) {
    element = $(element);
    return element.offsetHeight;
  },

  getDimensions: function(element) {
    element = $(element);
    if (OpenLayers.Element.getStyle(element, 'display') != 'none')
      return {width: element.offsetWidth, height: element.offsetHeight};

    // All *Width and *Height properties give 0 on elements with display none,
    // so enable the element temporarily
    var els = element.style;
    var originalVisibility = els.visibility;
    var originalPosition = els.position;
    els.visibility = 'hidden';
    els.position = 'absolute';
    els.display = '';
    var originalWidth = element.clientWidth;
    var originalHeight = element.clientHeight;
    els.display = 'none';
    els.position = originalPosition;
    els.visibility = originalVisibility;
    return {width: originalWidth, height: originalHeight};
  },

  getStyle: function(element, style) {
    element = $(element);
    var value = element.style[style.camelize()];
    if (!value) {
      if (document.defaultView && document.defaultView.getComputedStyle) {
        var css = document.defaultView.getComputedStyle(element, null);
        value = css ? css.getPropertyValue(style) : null;
      } else if (element.currentStyle) {
        value = element.currentStyle[style.camelize()];
      }
    }

    if (window.opera && ['left', 'top', 'right', 'bottom'].include(style))
      if (OpenLayers.Element.getStyle(element, 'position') == 'static') value = 'auto';

    return value == 'auto' ? null : value;
  }

};

/*********************
 *                   *
 *      STRING       * 
 *                   * 
 *********************/

/**
* @param {String} sStart
* 
* @returns Whether or not this string starts with the string passed in.
* @type Boolean
*/
String.prototype.startsWith = function(sStart){
    return (this.substr(0,sStart.length) == sStart);
};

/**
* @param {String} str
* 
* @returns Whether or not this string contains with the string passed in.
* @type Boolean
*/
String.prototype.contains = function(str){
    return (this.indexOf(str) != -1);
};

/**
* @returns A trimmed version of the string - all leading and 
*          trailing spaces removed
* @type String
*/
String.prototype.trim = function() {
    
    var b = 0;
    while(this.substr(b,1) == " ") {
        b++;
    }
    
    var e = this.length - 1;
    while(this.substr(e,1) == " ") {
        e--;
    }
    
    return this.substring(b, e+1);
};


String.indexOf = function(object) {
 for (var i = 0; i < this.length; i++)
     if (this[i] == object) return i;
 return -1;
};

String.prototype.camelize = function() {
    var oStringList = this.split('-');
    if (oStringList.length == 1) return oStringList[0];

    var camelizedString = this.indexOf('-') == 0
      ? oStringList[0].charAt(0).toUpperCase() + oStringList[0].substring(1)
      : oStringList[0];

    for (var i = 1, len = oStringList.length; i < len; i++) {
      var s = oStringList[i];
      camelizedString += s.charAt(0).toUpperCase() + s.substring(1);
    }

    return camelizedString;
};


/*********************
 *                   *
 *      NUMBER       * 
 *                   * 
 *********************/

/** NOTE: Works only with integer values does *not* work with floats!
 * 
 * @param {int} sig
 * 
 * @returns The number, rounded to the specified number of significant digits.
 *          If null, 0, or negaive value passed in, returns 0
 * @type int
 */
Number.prototype.limitSigDigs = function(sig) {
    var number = (sig > 0) ? this.toString() : 0;
    if (sig < number.length) {
        var exp = number.length - sig;
        number = Math.round( this / Math.pow(10, exp)) * Math.pow(10, exp);
    }
    return parseInt(number);
}


/*********************
 *                   *
 *      FUNCTION     * 
 *                   * 
 *********************/

Function.prototype.bind = function() {
  var __method = this, args = [], object = arguments[0];
  for (var i = 1; i < arguments.length; i++)
    args.push(arguments[i]);
  return function(moreargs) {
    for (var i = 0; i < arguments.length; i++)
      args.push(arguments[i]);
    return __method.apply(object, args);
  }
};

Function.prototype.bindAsEventListener = function(object) {
  var __method = this;
  return function(event) {
    return __method.call(object, event || window.event);
  }
};
