/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */
/**
* @class
*/
OpenLayers.Util = new Object();

/**
* @class This class represents a screen coordinate, in x and y coordinates
*/
OpenLayers.Pixel = Class.create();
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
        this.x = x;
        this.y = y;
    },
    
    /**
    * @return string representation of Pixel. ex: "x=200.4,y=242.2"
    * @type str
    */
    toString:function() {
        return ("x=" + this.x + ",y=" + this.y);
    },

    /**
     * @deprecated
     * 
     * @type OpenLayers.Pixel
     */
    copyOf:function() {
        return this.clone();
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
            equals = ((this.x == px.x) && (this.y == px.y));
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


/**
* @class This class represents a width and height pair
*/
OpenLayers.Size = Class.create();
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
        this.w = w;
        this.h = h;
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
     * @deprecated
     * 
     * @return New OpenLayers.Size object with the same w and h values
     * @type OpenLayers.Size
     */
    copyOf:function() {
        return this.clone();
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
            equals = ((this.w == sz.w) && (this.h == sz.h));
        }
        return equals;
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Size"
};

/**
* @class This class represents a longitude and latitude pair
*/
OpenLayers.LonLat = Class.create();
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
        this.lon = lon;
        this.lat = lat;
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
     * @deprecated
     * 
     * @return New OpenLayers.LonLat object with the same lon and lat values
     * @type OpenLayers.LonLat
     */
    copyOf:function() {
        return this.clone();
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
            equals = ((this.lon == ll.lon) && (this.lat == ll.lat));
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




/**
* @class This class represents a bounding box. 
*        Data stored as left, bottom, right, top floats
*/
OpenLayers.Bounds = Class.create();
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
        this.left = left;
        this.bottom = bottom;
        this.right = right;
        this.top = top;
    },

    /**
     * @deprecated
     * 
     * @returns A fresh copy of the bounds
     * @type OpenLayers.Bounds
     */
    copyOf:function() {
        return this.clone();
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
    * @return Simple String representation of OpenLayers.Bounds object.
    *         (ex. <i>"5,42,10,45"</i>)
    * @type String
    */
    toBBOX:function() {
        return (this.left + "," + this.bottom + ","
                + this.right + "," + this.top);
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
        return new OpenLayers.Box(this.left + x, this.bottom + y,
                                  this.right + x, this.top + y);
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
        
        return (partial) ? (inTop || inBottom) && (inLeft || inRight )
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

// Some other helpful things

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

/** Remove an object from an array. Iterates through the array
*    to find the item, then removes it.
*
* @param {Object} item
* 
* @returns A reference to the array
* @type Array
*/
Array.prototype.remove = function(item) {
    for(var i=0; i < this.length; i++) {
        if(this[i] == item) {
            this.splice(i,1);
            //break;more than once??
        }
    }
    return this;
}

/**
 * @deprecated
 * 
 * @returns A fresh copy of the array
 * @type Array
 */
Array.prototype.copyOf = function() {
    return this.clone();
};

/**
* @returns A fresh copy of the array
* @type Array
*/
Array.prototype.clone = function() {
  var clone = new Array();
  for (var i = 0; i < this.length; i++) {
      clone[i] = this[i];
  }
  return clone;
};

/**
*/
Array.prototype.clear = function() {
    this.length = 0;
};


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

/**
 * @param {String} id
 * @param {OpenLayers.Pixel} px
 * @param {OpenLayers.Size} sz
 * @param {String} position
 * @param {String} border
 * @param {String} overflow
 */
OpenLayers.Util.modifyDOMElement = function(element, id, px, sz, position, 
                                            border, overflow) {

    if (id) {
        element.id = id;
    }
    if (px) {
        element.style.left = px.x + "px";
        element.style.top = px.y + "px";
    }
    if (sz) {
        element.style.width = sz.w + "px";
        element.style.height = sz.h + "px";
    }
    if (position) {
        element.style.position = position;
    }
    if (border) {
        element.style.border = border;
    }
    if (overflow) {
        element.style.overflow = overflow;
    }
};

/** 
* zIndex is NOT set
*
* @param {String} id
* @param {OpenLayers.Pixel} px
* @param {OpenLayers.Size} sz
* @param {String} imgURL
* @param {String} position
* @param {String} border
* @param {String} overflow
*
* @returns A DOM Div created with the specified attributes.
* @type DOMElement
*/
OpenLayers.Util.createDiv = function(id, px, sz, imgURL, position, 
                                     border, overflow) {

    var dom = document.createElement('div');

    //set specific properties
    dom.style.padding = "0";
    dom.style.margin = "0";
    if (imgURL) {
        dom.style.backgroundImage = 'url(' + imgURL + ')';
    }

    //set generic properties
    if (!id) {
        id = OpenLayers.Util.createUniqueID("OpenLayersDiv");
    }
    if (!position) {
        position = "absolute";
    }
    OpenLayers.Util.modifyDOMElement(dom, id, px, sz, 
                                     position, border, overflow);

    return dom;
};

/** 
* @param {String} id
* @param {OpenLayers.Pixel} px
* @param {OpenLayers.Size} sz
* @param {String} imgURL
* @param {String} position
* @param {String} border
* @param {Boolean} delayDisplay
*
* @returns A DOM Image created with the specified attributes.
* @type DOMElement
*/
OpenLayers.Util.createImage = function(id, px, sz, imgURL, position, border, 
                                       delayDisplay) {

    image = document.createElement("img");

    if(delayDisplay) {
        image.style.display = "none";
        Event.observe(image, "load", 
                      OpenLayers.Util.onImageLoad.bindAsEventListener(image));
        Event.observe(image, "error", 
                      OpenLayers.Util.onImageLoadError.bindAsEventListener(image));
        
    }
    
    //set special properties
    image.style.alt = id;
    image.galleryImg = "no";
    if (imgURL) {
        image.src = imgURL;
    }

    //set generic properties
    if (!id) {
        id = OpenLayers.Util.createUniqueID("OpenLayersDiv");
    }
    if (!position) {
        position = "relative";
    }
    OpenLayers.Util.modifyDOMElement(image, id, px, sz, position, border);

        
    return image;
};


OpenLayers.Util.onImageLoad = function() {
    this.style.backgroundColor = null;
    this.style.display = "";  
};

OpenLayers.Util.onImageLoadError = function() {
    this.style.backgroundColor = "pink";
};


OpenLayers.Util.alphaHack = function() {
    var arVersion = navigator.appVersion.split("MSIE");
    var version = parseFloat(arVersion[1]);
    
    return ( (document.body.filters) &&
                      (version >= 5.5) && (version < 7) );
}

/** 
* @param {DOMElement} div Div containing Alpha-adjusted Image
* @param {String} id
* @param {OpenLayers.Pixel} px
* @param {OpenLayers.Size} sz
* @param {String} imgURL
* @param {String} position
* @param {String} border
* @param {String} sizing 'crop', 'scale', or 'image'. Default is "scale"
*/ 
OpenLayers.Util.modifyAlphaImageDiv = function(div, id, px, sz, imgURL, 
                                               position, border, sizing) {

    OpenLayers.Util.modifyDOMElement(div, id, px, sz);

    var img = div.childNodes[0];

    if (imgURL) {
        img.src = imgURL;
    }
    OpenLayers.Util.modifyDOMElement(img, div.id + "_innerImage", null, sz, 
                                     "relative", border);

    if (OpenLayers.Util.alphaHack()) {
        div.style.display = "inline-block";
        if (sizing == null) {
            sizing = "scale";
        }
        div.style.filter = "progid:DXImageTransform.Microsoft" +
                           ".AlphaImageLoader(src='" + img.src + "', " +
                           "sizingMethod='" + sizing + "')";
        img.style.filter = "progid:DXImageTransform.Microsoft" +
                                ".Alpha(opacity=0)";
    }
};

/** 
* @param {String} id
* @param {OpenLayers.Pixel} px
* @param {OpenLayers.Size} sz
* @param {String} imgURL
* @param {String} position
* @param {String} border
* @param {String} sizing 'crop', 'scale', or 'image'. Default is "scale"
* @param {Boolean} delayDisplay
*
* @returns A DOM Div created with a DOM Image inside it. If the hack is 
*           needed for transparency in IE, it is added.
* @type DOMElement
*/ 
OpenLayers.Util.createAlphaImageDiv = function(id, px, sz, imgURL, 
                                               position, border, sizing, delayDisplay) {
    
    var div = OpenLayers.Util.createDiv();
    var img = OpenLayers.Util.createImage(null, null, null, null, null, null, 
                                          false);
    div.appendChild(img);

    if (delayDisplay) {
        img.style.display = "none";
        Event.observe(img, "load",
                      OpenLayers.Util.onImageLoad.bindAsEventListener(div));
        Event.observe(img, "error",
                      OpenLayers.Util.onImageLoadError.bindAsEventListener(div));
    }

    OpenLayers.Util.modifyAlphaImageDiv(div, id, px, sz, imgURL, 
                                        position, border, sizing);
    
    return div;
};


/** Creates a new hashtable and copies over all the keys from the 
*    passed-in object, but storing them under an uppercased
*    version of the key at which they were stored.
* 
* @param {Object} object
*
* @returns A new Object with all the same keys but uppercased
* @type Object
*/
OpenLayers.Util.upperCaseObject = function (object) {
    var uObject = new Object();
    for (var key in object) {
        uObject[key.toUpperCase()] = object[key];
    }
    return uObject;
};

/** Takes a hashtable and copies any keys that don't exist from
*   another hashtable, by analogy with Object.extend() from
*   Prototype.js.
*
* @param {Object} to
* @param {Object} from
*
* @type Object
*/
OpenLayers.Util.applyDefaults = function (to, from) {
    for (var key in from) {
        if (to[key] == null) {
            to[key] = from[key];
        }
    }
    return to;
};

/**
* @param {Object} params
*
* @returns a concatenation of the properties of an object in 
*    http parameter notation. 
*    (ex. <i>"key1=value1&key2=value2&key3=value3"</i>)
* @type String
*/
OpenLayers.Util.getParameterString = function(params) {
    paramsArray = new Array();
    
    for (var key in params) {
        var value = params[key];
        if ((value != null) && (typeof value != 'function')) {
            paramsArray.push(key + "=" + value);
        }
    }
    
    return paramsArray.join("&");
};

/** 
* @returns The fully formatted image location string
* @type String
*/
OpenLayers.Util.getImagesLocation = function() {
    return OpenLayers._getScriptLocation() + "img/";
};



/** These could/should be made namespace aware?
*
* @param {} p
* @param {str} tagName
*
* @return {Array}
*/
OpenLayers.Util.getNodes=function(p, tagName) {
    var nodes = Try.these(
        function () {
            return OpenLayers.Util._getNodes(p.documentElement.childNodes,
                                            tagName);
        },
        function () {
            return OpenLayers.Util._getNodes(p.childNodes, tagName);
        }
    );
    return nodes;
};

/**
* @param {Array} nodes
* @param {str} tagName
*
* @return {Array}
*/
OpenLayers.Util._getNodes=function(nodes, tagName) {
    var retArray = new Array();
    for (var i=0;i<nodes.length;i++) {
        if (nodes[i].nodeName==tagName) {
            retArray.push(nodes[i]);
        }
    }

    return retArray;
};



/**
* @param {} parent
* @param {str} item
* @param {int} index
*
* @return {str}
*/
OpenLayers.Util.getTagText = function (parent, item, index) {
    var result = OpenLayers.Util.getNodes(parent, item);
    if (result && (result.length > 0))
    {
        if (!index) {
            index=0;
        }
        if (result[index].childNodes.length > 1) {
            return result.childNodes[1].nodeValue; 
        }
        else if (result[index].childNodes.length == 1) {
            return result[index].firstChild.nodeValue; 
        }
    } else { 
        return ""; 
    }
};

/** 
* @param {Event} evt
* @param {HTMLDivElement} div
*
* @return {boolean}
*/
OpenLayers.Util.mouseLeft = function (evt, div) {
    // start with the element to which the mouse has moved
    var target = (evt.relatedTarget) ? evt.relatedTarget : evt.toElement;
    // walk up the DOM tree.
    while (target != div && target != null) {
        target = target.parentNode;
    }
    // if the target we stop at isn't the div, then we've left the div.
    return (target != div);
};

OpenLayers.Util.rad = function(x) {return x*Math.PI/180;};
OpenLayers.Util.distVincenty=function(p1, p2) {
    var a = 6378137, b = 6356752.3142,  f = 1/298.257223563;
    var L = OpenLayers.Util.rad(p2.lon - p1.lon);
    var U1 = Math.atan((1-f) * Math.tan(OpenLayers.Util.rad(p1.lat)));
    var U2 = Math.atan((1-f) * Math.tan(OpenLayers.Util.rad(p2.lat)));
    var sinU1 = Math.sin(U1), cosU1 = Math.cos(U1);
    var sinU2 = Math.sin(U2), cosU2 = Math.cos(U2);
    var lambda = L, lambdaP = 2*Math.PI;
    var iterLimit = 20;
    while (Math.abs(lambda-lambdaP) > 1e-12 && --iterLimit>0) {
        var sinLambda = Math.sin(lambda), cosLambda = Math.cos(lambda);
        var sinSigma = Math.sqrt((cosU2*sinLambda) * (cosU2*sinLambda) +
        (cosU1*sinU2-sinU1*cosU2*cosLambda) * (cosU1*sinU2-sinU1*cosU2*cosLambda));
        if (sinSigma==0) return 0;  // co-incident points
        var cosSigma = sinU1*sinU2 + cosU1*cosU2*cosLambda;
        var sigma = Math.atan2(sinSigma, cosSigma);
        var alpha = Math.asin(cosU1 * cosU2 * sinLambda / sinSigma);
        var cosSqAlpha = Math.cos(alpha) * Math.cos(alpha);
        var cos2SigmaM = cosSigma - 2*sinU1*sinU2/cosSqAlpha;
        var C = f/16*cosSqAlpha*(4+f*(4-3*cosSqAlpha));
        lambdaP = lambda;
        lambda = L + (1-C) * f * Math.sin(alpha) *
        (sigma + C*sinSigma*(cos2SigmaM+C*cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)));
    }
    if (iterLimit==0) return NaN  // formula failed to converge
    var uSq = cosSqAlpha * (a*a - b*b) / (b*b);
    var A = 1 + uSq/16384*(4096+uSq*(-768+uSq*(320-175*uSq)));
    var B = uSq/1024 * (256+uSq*(-128+uSq*(74-47*uSq)));
    var deltaSigma = B*sinSigma*(cos2SigmaM+B/4*(cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)-
        B/6*cos2SigmaM*(-3+4*sinSigma*sinSigma)*(-3+4*cos2SigmaM*cos2SigmaM)));
    var s = b*A*(sigma-deltaSigma);
    var d = s.toFixed(3)/1000; // round to 1mm precision
    return d;
};
    
OpenLayers.Util.getArgs = function() {
    var args = new Object();
    var query = location.search.substring(1);  // Get query string.
    var pairs = query.split("&");              // Break at ampersand. //+pjl

    for(var i = 0; i < pairs.length; i++) {
        var pos = pairs[i].indexOf('=');       // Look for "name=value".
        if (pos == -1) continue;               // If not found, skip.
        var argname = pairs[i].substring(0,pos);  // Extract the name.
        var value = pairs[i].substring(pos+1); // Extract the value.
        args[argname] = unescape(value);          // Store as a property.
    }
    return args;                               // Return the object.
};

/**
 * @param {String} prefix String to prefix random id. If null, default
 *                         is "id_"
 * 
 * @returns A unique id string, built on the passed in prefix
 * @type String
 */
OpenLayers.Util.createUniqueID = function(prefix) {
    if (prefix == null) {
        prefix = "id_";
    }
    return prefix + Math.round(Math.random() * 10000);        
};

/** Constant inches per unit 
 *    -- borrowed from MapServer mapscale.c
 * 
 * @type Object */
OpenLayers.INCHES_PER_UNIT = { 
    'inches': 1.0,
    'ft': 12.0,
    'mi': 63360.0,
    'm': 39.3701,
    'km': 39370.1,
    'dd': 4374754,
};
OpenLayers.INCHES_PER_UNIT["in"]= OpenLayers.INCHES_PER_UNIT.inches;
OpenLayers.INCHES_PER_UNIT["degrees"] = OpenLayers.INCHES_PER_UNIT.dd;

/** A sensible default 
 * @type int */
OpenLayers.DOTS_PER_INCH = 72;

/**
 * @param {float} scale
 * 
 * @returns A normalized scale value, in 1 / X format. 
 *          This means that if a value less than one ( already 1/x) is passed
 *          in, it just returns scale directly. Otherwise, it returns 
 *          1 / scale
 * @type float
 */
OpenLayers.Util.normalizeScale = function (scale) {
    var normScale = (scale > 1.0) ? (1.0 / scale) 
                                  : scale;
    return normScale;
};

/**
 * @param {float} scale
 * @param {String} units Index into OpenLayers.INCHES_PER_UNIT hashtable.
 *                       Default is degrees
 * 
 * @returns The corresponding resolution given passed-in scale and unit 
 *          parameters.
 * @type float
 */
OpenLayers.Util.getResolutionFromScale = function (scale, units) {

    if (units == null) {
        units = "degrees";
    }

    normScale = OpenLayers.Util.normalizeScale(scale);

    var resolution = 1 / (normScale * OpenLayers.INCHES_PER_UNIT[units]
                                * OpenLayers.DOTS_PER_INCH);
    return resolution;
};