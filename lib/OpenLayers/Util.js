/**
* @class
*/
OpenLayers.Util=new Object();




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
    * @type OpenLayers.Pixel
    */
    copyOf:function() {
        return new OpenLayers.Pixel(this.x, this.y); 
    },
    
    /** 
    * @param {OpenLayers.Pixel} px
    * 
    * @return whether or not the point passed in as parameter is equal to this
    * @type bool
    */
    equals:function(px) {
        return ((this.x == px.x) && (this.y == px.y));
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
    * @return New OpenLayers.Size object with the same w and h values
    * @type OpenLayers.Size
    */
    copyOf:function() {
        return new OpenLayers.Size(this.w, this.h);
    },

    /** 
    * @param {OpenLayers.Size} sz
    * @returns Boolean value indicating whether the passed-in OpenLayers.Size 
    *          object has the same w and h components as this
    *
    * @type bool
    */
    equals:function(sz) {
        return ((this.w == sz.w) && (this.h == sz.h));
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
    * @return New OpenLayers.LonLat object with the same lon and lat values
    * @type OpenLayers.LonLat
    */
    copyOf:function() {
        return new OpenLayers.LonLat(this.lon, this.lat);
    },

    /** 
    * @param {float} lon
    * @param {float} lat
    *
    * @return A new OpenLayers.LonLat object with the lon and lat passed-in
    *         added to this's. 
    * @type OpenLayers.Pixel
    */
    add:function(lon, lat) {
        return new OpenLayers.LonLat(this.lon + lon, this.lat + lat);
    },

    /** 
    * @param {OpenLayers.LonLat} ll
    * @returns Boolean value indicating whether the passed-in OpenLayers.LonLat
    *          object has the same lon and lat components as this
    *
    * @type bool
    */
    equals:function(ll) {
        return ((this.lon == ll.lon) && (this.lat == ll.lat));
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
    * @returns A fresh copy of the bounds
    * @type OpenLayers.Bounds
    */
    copyOf:function() {
        return new OpenLayers.Bounds(this.left, this.bottom, 
                                     this.right, this.top);
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
        return new OpenLayers.Pixel(this.left + (this.getWidth() / 2),
                                    this.bottom + (this.getHeight() / 2));
    },

    /**
    * @returns An OpenLayers.LonLat which represents the center of the bounds
    * @type OpenLayers.LonLat
    */
    getCenterLonLat:function() {
        return new OpenLayers.LonLat(this.left + (this.getWidth() / 2),
                                    this.bottom + (this.getHeight() / 2));
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
    return new OpenLayers.Bounds(parseFloat(bounds[0]),
                                 parseFloat(bounds[1]),
                                 parseFloat(bounds[2]),
                                 parseFloat(bounds[3]));
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
String.prototype.trim = function() {
    var b=0,e=this.length -1;
    while(this.substr(b,1) == " ") {b++;}
    while(this.substr(e,1) == " ") {e--;}
    return this.substring(b,e+1);
};
Array.prototype.remove = function(rem) {
    for(var i=0; i<this.length; i++) {
        if(this[i]==rem) {
            this.splice(i,1);
            //break;more than once??
        }
    }
    return this;
}
Array.prototype.copy = function() {
  var copy = new Array();
  for (var i = 0; i < this.length; i++) {
      copy[i] = this[i];
  }
  return copy;
};

Array.prototype.prepend = function(the_item) {
    this.splice(0,0,the_item);
};
Array.prototype.append=function(the_item){
    this[this.length]=the_item;
};
Array.prototype.clear=function() {this.length=0;};



/** Create a child element (a div currently) that
* is a proper child of the supplied parent, is invisible,
* positioned as requested within the parent, etc
*
* zIndex is NOT set
*
* @param {str} id - HTML ID of new element, if empty something is made up
* @param {OpenLayers.Pixel} pt - x,y point if missing 0,0 is used
* @param {OpenLayers.Size} sz - size else size of parent is used
* @param {str} overflow - behavior of clipped/overflow content
* @param {str} img - background image url
* @param {str} position - relative or absolute?
*
* @return {DOM}
*/
OpenLayers.Util.createDiv = function(id, pt, sz, overflow, img, position) {
    var x,y,w,h;

    if (pt){
        x = pt.x;
        y = pt.y;
    } else {
        x = y = 0;
    }

    if (!position){
        position = "absolute";
    }

    if (!id){
        id = "OpenLayersDiv" + (Math.random()*10000%10000);
    }

    var dom = document.createElement('div');
    dom.id = id;
    if (overflow){
        dom.style.overflow = overflow;
    }
    if (sz) {
        dom.style.width = sz.w+"px";
        dom.style.height = sz.h+"px";
    }
    dom.style.position = position;
    dom.style.top = y;
    dom.style.left = x;
    dom.style.padding = "0";
    dom.style.margin = "0";
    dom.style.cursor = "inherit";
    
    if (img){
        dom.style.backgroundImage = 'url(' + img + ')';
    }

    return dom;
};


OpenLayers.Util.ImageHTML=function(img,sz,alt){
    return "<img src='" + img + "' padding='0' border='0' alt='" + alt + "' width=" + sz.w + "px height=" + sz.h + "px/>";
};

/** 
* @param {str} img - src URL 
* @param {OpenLayers.Size} sz
* @param {OpenLayers.Pixel} xy
* @param {str} position
* @param {str} id
* @param {int} border
*/
OpenLayers.Util.createImage = function(img, sz, xy, position, id, border) {
    image = document.createElement("img");
    if (id) {
        image.id = id;
        image.style.alt = id;
    }
    if (xy) {
        image.style.left = xy.x;
        image.style.top = xy.y;
    }
    if (sz) {
        image.style.width = sz.w;
        image.style.height = sz.h;
    }
    if (position) {
        image.style.position = position;
    } else {
        image.style.position = "relative";
    }
    if (border) {
        image.style.border = border + "px solid";
    } else {
        image.style.border = 0;
    }
    image.style.cursor = "inherit";
    image.src = img;
    image.galleryImg = "no";
    return image;
};


/** returns a concatenation of the properties of an object in 
*    http parameter notation. ex:
*
*    "key1=value1&key2=value2&key3=value3"
*
* @param {Object} params
*
* @return {str}
*/
OpenLayers.getParameterString = function(params) {
    paramsArray = new Array();
    
    for (var key in params) {
        var value = params[key];
        //skip functions
        if (typeof value == 'function') continue;
    
        paramsArray.push(key + "=" + value);
    }
    
    return paramsArray.join("&");
};

OpenLayers.Util.getImagesLocation = function () {
    return OpenLayers._getScriptLocation() + "img/";
};

/** Takes a hash and copies any keys that don't exist from
*   another hash, by analogy with Object.extend() from
*   Prototype.js.
*
* @param {Object} to
* @param {Object} from
* @return {Object}
*/
OpenLayers.Util.applyDefaults = function (to, from) {
    for (var key in from) {
        if (to[key] == null) {
            to[key] = from[key];
        }
    }
    return to;
};
