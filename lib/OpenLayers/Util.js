/*
* @class
*/
OpenLayers.Util=new Object();




/**
* @class This class represents a screen coordinate, in x and y coordinates
*/
OpenLayers.Pixel = Class.create();
OpenLayers.Pixel.prototype = {
    
    /**
    * @param {int} x
    * @param {int} y
    */
    initialize: function(x, y) {
        this.x = x;
        this.y = y;
    },
    
    /**
    * @return {str} ex: "x=200,y=242"
    */
    toString:function() {
        return ("x="+this.x+",y="+this.y);
    },

    /**
    * @return {OpenLayers.Pixel}
    */
    copyOf:function() {
        return new OpenLayers.Pixel(this.x, this.y); 
    },
    
    /** returns a Size object with the difference 
    *    between the two points
    * 
    * @return {OpenLayers.Size}
    */
    diff:function(pt) {          // subtract pt from this
        return new OpenLayers.Size(this.x - pt.x, this.y - pt.y);
    },

    /** returns a Size object with the absolute difference 
    *    between the two points
    * 
    * @param {OpenLayers.Pixel} pt
    * 
    * @return {OpenLayers.Size}
    */
    absDiff:function(pt) {
        return new OpenLayers.Size(Math.abs(this.x - pt.x),
                                   Math.abs(this.y - pt.y));
    },

    /** returns a Pixel object with the difference 
    *    between the two points
    * 
    * @param {OpenLayers.Pixel} pt
    * 
    * @return {OpenLayers.Pixel}
    */
    diffPt:function(pt) {
        var sz = this.diff(pt);
        return new OpenLayers.Pixel(sz.w, sz.h);
    },
    
    /** returns whether or not the two points are equal
    * 
    * @param {OpenLayers.Pixel} pt
    * 
    * @return {bool}
    */
    equal:function(pt) {
        var d = this.diff(pt);
        return ((d.w==0) && (d.h==0));
    },

    /** Return a new Pixel with this pixel's x&y augmented by 
    *    the int values passed in.
    * 
    * @param {int} x
    * @param {int} y
    * 
    * @return {OpenLayers.Pixel}
    */
    add:function(x, y) {
        return new OpenLayers.Pixel(this.x + x, this.y + y);
    },

    CLASS_NAME: "OpenLayers.Pixel"
};

OpenLayers.Size = Class.create();
OpenLayers.Size.prototype = {
    initialize: function(w,h) {
        this.w=w;
        this.h=h;
    },
    toString:function(){
        return ("w="+this.w+",h="+this.h);
    },
    copyOf:function(){
        return new OpenLayers.Size(this.w, this.h);
    },
    sameSize:function(pt){
        return (this.w==pt.w && this.h==pt.h);
    }
};

OpenLayers.LatLon = Class.create();
OpenLayers.LatLon.prototype = {
    initialize: function(lat,lon) {
        this.lat=lat;
        this.lon=lon;
    },
    toString:function(){
        return ("lat="+this.lat+",lon="+this.lon);
    },
    copyOf:function(){
        return new OpenLayers.LatLon(this.lat, this.lon);
    },
    toShortString:function(){
        return (this.lat+", "+this.lon);
    },
    diff:function(pt){          // subtract pt from this
        return new OpenLayers.LatLon(this.lat - pt.lat,this.lon - pt.lon);
    },
    samePT:function(pt){
        return (this.lat==pt.lat && this.lon==pt.lon);
    }
};
OpenLayers.LatLon.fromString=function(str){
    var pairs=str.split(",");
    return new OpenLayers.LatLon(pairs[1],pairs[0]);
};
OpenLayers.Bounds = Class.create();
OpenLayers.Bounds.prototype = {
    initialize: function(minlat,minlon,maxlat,maxlon){
        this.minlat=minlat;
        this.minlon=minlon;
        this.maxlat=maxlat;
        this.maxlon=maxlon;
        this.width = Math.abs(this.maxlon - this.minlon);
        this.height = Math.abs(this.maxlat - this.minlat);
    },
    toString:function(){
        return ("Min lat/lon=" + this.minlat +"/"+ this.minlon
                + " Max lat/lon=" + this.maxlat +"/"+ this.maxlon
                + " width:" + this.width + " height:" + this.height);
    },
    copyOf:function(){
        return new OpenLayers.Bounds(this.minlat, this.minlon,
                                    this.maxlat, this.maxlon);
    },
    toBBOX:function(){
        return (this.minlon+","+this.minlat+","+this.maxlon+","+this.maxlat);
    },
    contains:function(pt){
        return (pt.lon >=this.minlon && pt.lon <=this.maxlon 
            && pt.lat >=this.minlat && pt.lat <= this.maxlat)
    }

};
/** Create bounds from coordinates in a string:-180.000000,-90.000000 180.000000,90.000000
*/
OpenLayers.Bounds.fromString=function(str){
    var pairs=str.split(" ");
    var min=pairs[0];
    var max=pairs[1];

    var latlon = min.split(",");
    var latlon2 = max.split(",");
    return new OpenLayers.Bounds(latlon[1],latlon[0],latlon2[1],latlon2[0]);
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
    return "img/";
};
