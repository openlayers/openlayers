/*
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
    * @return a Pixel object with the difference between the two pixels
    * @type OpenLayers.Pixel
    */
    diff:function(px) {
        return new OpenLayers.Pixel(this.x - px.x, this.y - px.y);
    },

    /** 
    * @param {OpenLayers.Pixel} px
    * 
    * @return Pixel object with the absolute difference between the two pixels
    * @type OpenLayers.Pixel
    */
    diffABS:function(px) {
        return new OpenLayers.Pixel(Math.abs(this.x - px.x),
                                    Math.abs(this.y - px.y));
    },

    /** 
    * @param {OpenLayers.Pixel} px
    * 
    * @return whether or not the point passed in as parameter is equal to this
    * @type bool
    */
    equal:function(px) {
        var d = this.diff(px);
        return ((d.x == 0) && (d.y == 0));
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
    *         (ex. <i>"5,42"</i>)
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
    * @param {OpenLayers.LonLat} ll
    *
    * @return OpenLayers.LonLat object with difference between the two coords
    * @type OpenLayers.Pixel
    */
    diff:function(ll) {
        return new OpenLayers.LonLat(this.lon - ll.lon, this.lat - ll.lat);
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
    return new OpenLayers.LonLat(pair[0], pair[1]);
};




/**
* @class This class represents a bounding box. 
*        Data stored as Min and Max Longitudes and Latitudes
*/
OpenLayers.Bounds = Class.create();
OpenLayers.Bounds.prototype = {

    /** @type float */
    minlon: 0.0,

    /** @type float */
    minlat: 0.0,

    /** @type float */
    maxlon: 0.0,

    /** @type float */
    maxlat: 0.0,

    /** @type float */
    width: 0.0,

    /** @type float */
    height: 0.0,
    

    /** 
    * @constructor
    *
    * @param {float} minlon
    * @param {float} minlat
    * @param {float} maxlon
    * @param {float} maxlat
    */
    initialize: function(minlon, minlat, maxlon, maxlat) {
        this.minlon = minlon;
        this.minlat = minlat;
        this.maxlon = maxlon;
        this.maxlat = maxlat;
        this.width = Math.abs(this.maxlon - this.minlon);
        this.height = Math.abs(this.maxlat - this.minlat);
    },
    
    /** 
    * @return String representation of OpenLayers.Bounds object. 
    *         (ex.<i>"Min lon/lat=5/42 Max lon/lat=10/45 width=5 height=3"</i>)
    * @type String
    */
    toString:function(){
        return ("Min lon/lat=" + this.minlon +"/"+ this.minlat
                + " Max lon/lat=" + this.maxlon +"/"+ this.maxlat
                + " width=" + this.width + " height=" + this.height);
    },
    
    /** 
    * @return New OpenLayers.Bounds object with the same min/max lon/lat values
    * @type OpenLayers.Bounds
    */
    copyOf:function() {
        return new OpenLayers.Bounds(this.minlon, this.minlat,
                                     this.maxlon, this.maxlat);
    },

    /** 
    * @return Simple String representation of OpenLayers.Bounds object.
    *         (ex. <i>"5,42,10,45"</i>)
    * @type String
    */
    toBBOX:function(){
        return (this.minlon + "," + this.minlat + "," + 
                this.maxlon + "," + this.maxlat);
    },
    
    
    /** 
    * @return Whether or not the passed-in coordinate is within the area
    *         delineated by this OpenLayers.Bounds
    * @type Boolean
    */
    contains:function(ll) {
        return ((ll.lon >= this.minlon) && (ll.lon <= this.maxlon) 
                 && (ll.lat >= this.minlat) && (ll.lat <= this.maxlat));
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
    return new OpenLayers.Bounds(bounds[0],bounds[1],bounds[2],bounds[3]);
};

OpenLayers.Box = Class.create();
OpenLayers.Box.prototype = {
    initialize: function(x,y,w,h){
        this.xy=new OpenLayers.Pixel(x,y);
        this.sz=new OpenLayers.Size(w,h);
        this.c = new OpenLayers.Pixel(x+(w/2), y+(h/2));
        this.br = new OpenLayers.Pixel(x+w-1,y+h-1);
    },

    /* offset box by df
    * @df(OpenLayers.Size)
    */
    offset:function(df){
        this.xy=new OpenLayers.Pixel(this.xy.x+df.w,this.xy.y+df.h);
        this.c = new OpenLayers.Pixel(this.xy.x+(this.sz.w/2), this.xy.y+(this.sz.h/2));
        var x=this.xy.x;
        var y=this.xy.y;
        var w=this.sz.w;
        var h=this.sz.h;
        this.br = new OpenLayers.Pixel(x+w-1,y+h-1);
    },

    getOrigin:function(){return this.xy;},
    getSize:function(){return this.sz;},
    getCenter:function(){return this.c;},
    getBotRight:function(){return this.br;},
    getWidth:function(){return this.sz.w;},
    getHeight:function(){return this.sz.h;},
    getSize:function(){return this.sz;},

    toString:function(){
        return (this.xy.toString() + " " + this.sz.toString());
    },
    copyOf:function(){
        return new OpenLayers.Box(this.xy.x, this.xy.y, this.sz.w, this.sz.h);
    },
    toCoordsString:function(){
        var x1 = this.xy.x;
        var x2 = this.xy.x+this.sz.w-1;
        var y1 = this.xy.y;
        var y2 = this.xy.y+this.sz.h-1;
        return (x1+","+y1+","+x2+","+y2);
    },
    contains:function(pt){
        var returnVal = false;
        
        var lx=this.xy.x;
        var ly=this.xy.y;
        var rx=lx+this.sz.w-1;
        var ry=ly+this.sz.h-1;

        if (pt != null) {
            //upper left in
            returnVal =  (pt.x >=lx && pt.x <=rx && pt.y >=ly && pt.y <= ry);
        }
        return returnVal;
    },

    /**
    * @param {ol.Box} box
    * @param {bool} partial - if true, returns whether any part of the passed 
    *                         in box is within the calling box. otherwise box
    *                         must contain entire box to return true.
    *
    * @return {bool}
    */
    containsBox:function(box, partial) {
        var contains = false;
        
        var mainTop = this.xy.y;
        var mainLeft = this.xy.x;
        var mainBottom = this.xy.y + this.sz.h;
        var mainRight = this.xy.x + this.sz.w;

        var top = box.xy.y;
        var left = box.xy.x;
        var bottom = box.xy.y + box.sz.h;
        var right = box.xy.x + box.sz.w;

        var inTop = (top >= mainTop) && (top <= mainBottom);
        var inLeft = (left >= mainLeft) && (left <= mainRight);
        var inBottom = (bottom >= mainTop) && (bottom <= mainBottom);
        var inRight= (right >= mainLeft) && (right <= mainRight);
        
        if (partial) {
            contains = (inTop || inBottom) && (inLeft || inRight );
        } else {
            contains = (inTop && inLeft && inBottom && inRight);
        }
        
        return contains;      
    },

    // is this point the center of the box, +-2 pixels (@todo fix that number!)
    isCenter:function(pt){
        var size = this.c.absDiff(pt);
        return (size.w <= 2 && size.h <= 2);
    }
};


// Some other helpful things
String.prototype.startsWith = function(sStart){
    return (this.substr(0,sStart.length)==sStart);
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
