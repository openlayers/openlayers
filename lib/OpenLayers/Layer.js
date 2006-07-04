/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */
/**
 * @class
 */
OpenLayers.Layer = Class.create();
OpenLayers.Layer.prototype = {

    /** @type String */
    name: null,

    /** @type DOMElement */
    div: null,

    /** This variable is set when the layer is added to the map, via the 
     *  accessor function setMap()
     * 
     * @type OpenLayers.Map */
    map: null,
    

  // OPTIONS

    /** @type Array */
    options: null,

    /** @type String */
    projection: null,    
        
    /** @type OpenLayers.Bounds */
    maxExtent: null,
    
    /** @type float */
    maxResolution: null,

    /** @type int */
    minZoomLevel: null,
    
    /** @type int */
    maxZoomLevel: null,
    
    
    /**
     * @constructor
     * 
     * @param {String} name
     * @param {Object} options Hash of extra options to tag onto the layer
     */
    initialize: function(name, options) {
        if (arguments.length > 0) {

            //store a copy of the custom options for later cloning
            this.options = (options == null) ? new Object : options;
            
            //add options to layer
            Object.extend(this, this.options);

            this.name = name;
            if (this.div == null) {
                this.div = OpenLayers.Util.createDiv();
                this.div.style.width = "100%";
                this.div.style.height = "100%";
            }
        }
    },
    
    /**
     * Destroy is a destructor: this is to alleviate cyclic references which
     * the Javascript garbage cleaner can not take care of on its own.
     */
    destroy: function() {
        if (this.map != null) {
            this.map.removeLayer(this);
        }
        this.map = null;
        this.name = null;
        this.div = null;
        this.options = null;
    },
    
   /**
    * @returns An exact clone of this OpenLayers.Layer
    * @type OpenLayers.Layer
    */
    clone: function () {
        var clone = new OpenLayers.Layer(this.name, 
                                         this.options);

        return clone;
    },
    
    /** 
     * @param {String} newName
     */
    setName: function(newName) {
        this.name = newName;
    },    
    
   /**
    * @param {Hash} newOptions
    */
    addOptions: function (newOptions) {

        if (newOptions != null) {
            Object.extend(this.options, newOptions);
        }

    },
    

    /**
    * @params {OpenLayers.Bounds} bound
    * @params {Boolean} zoomChanged tells when zoom has changed, as layers 
    *                   have to do some init work in that case.
    */
    moveTo: function (bound, zoomChanged) {
        //this function should be implemented by all subclasses.
    },
    
    /** Set the map property for the layer. This is done through an accessor
     *   so that subclasses can override this and take special action once 
     *   they have their map variable set. 
     * 
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {
        this.map = map;
    },
  
    /**
     * @returns Whether or not the layer is a base layer. This should be 
     *          determined individually by all subclasses. Default is false
     * @type Boolean
     */
    isBaseLayer: function() {
        //this function should be implemented by all subclasses.
        return false;
    },
    
    /**
    * @returns Whether or not the layer is visible
    * @type Boolean
    */
    getVisibility: function() {
        return (this.div.style.display != "none");
    },

    /** 
    * @param {bool} visible
    */
    setVisibility: function(visible) {
        this.div.style.display = (visible) ? "block" : "none";
        if ((visible) && (this.map != null)) {
            this.moveTo(this.map.getExtent());
        }
    },
    
    
  /********************************************************/
  /*                                                      */
  /*                 Layer Options                        */
  /*                                                      */
  /*    Accessor functions to Layer Options parameters    */
  /*                                                      */
  /********************************************************/
    
    /**
     * @type String
     */
    getProjection: function() {
        return this.projection;
    },    
    
    /**
     * @type OpenLayers.Bounds
     */
    getMaxExtent: function() {
        return this.maxExtent;
    }, 

    /** 
     * @type float
     */
    getMaxResolution: function() {
        return this.maxResolution;
    },
    
    /**
     * @returns The minimum zoom level that can be reached in this layer
     * @type int
     */
    getMinZoomLevel: function() {
        return this.minZoomLevel;
    },

    /**
     * @returns The maximum zoom level that can be reached in this layer
     * @type int
     */
    getMaxZoomLevel: function() {
        return this.maxZoomLevel;
    },

  /********************************************************/
  /*                                                      */
  /*                 Baselayer Functions                  */
  /*                                                      */
  /*    The following functions must all be implemented   */
  /*                  by all base layers                  */
  /*                                                      */
  /********************************************************/
    
    /** 
     * @returns Degrees per Pixel
     * @type float
     */
    getResolution: function() {
        var viewSize = this.map.getSize();
        var extent = this.map.getExtent();
        return Math.max( extent.getWidth()  / viewSize.w,
                         extent.getHeight() / viewSize.h );
    },
    
    /**
    * @param {OpenLayers.Pixel} viewPortPx
    *
    * @returns An OpenLayers.LonLat which is the passed-in view port
    *          OpenLayers.Pixel, translated into lon/lat by the layer
    * @type OpenLayers.LonLat
    */
    getLonLatFromViewPortPx: function (viewPortPx) {
        var size = this.map.getSize();
        var center = this.map.getCenter();        //map center lon/lat
        var res  = this.map.getResolution();
    
        var delta_x = viewPortPx.x - (size.w / 2);
        var delta_y = viewPortPx.y - (size.h / 2);
        
        return new OpenLayers.LonLat(center.lon + delta_x * res ,
                                     center.lat - delta_y * res); 
    },

    /**
    * @param {OpenLayers.LonLat} lonlat
    *
    * @returns An OpenLayers.Pixel which is the passed-in OpenLayers.LonLat, 
    *          translated into view port pixels
    * @type OpenLayers.Pixel
    */
    getViewPortPxFromLonLat: function (lonlat) {
        var resolution = this.map.getResolution();
        var extent = this.map.getExtent();
        return new OpenLayers.Pixel(
                       Math.round(1/resolution * (lonlat.lon - extent.left)),
                       Math.round(1/resolution * (extent.top - lonlat.lat))
                       );    
    },
    
    /**
    * @param {OpenLayers.Bounds} bounds
    *
    * @return {int}
    */
    getZoomForExtent: function (bounds) {
        // this should be implemented by subclasses
    },

    /**
     * @returns A Bounds object which represents the lon/lat bounds of the 
     *          current viewPort.
     * @type OpenLayers.Bounds
     */
    getExtent: function () {
        // this should be implemented by subclasses
        var extent = null;

        var center = this.map.getCenter();
        if (center != null) {

 	            var res = this.getResolution();
 	            var size = this.map.getSize();
 	            var w_deg = size.w * res;
 	            var h_deg = size.h * res;

 	            return new OpenLayers.Bounds(center.lon - w_deg / 2,
                         	                 center.lat - h_deg / 2,
                         	                 center.lon + w_deg / 2,
                          	                 center.lat + h_deg / 2);

        }

        return extent;
/** ALT CALCULATION FOR GETEXTENT 

            var size = this.getSize();
            
            var tlPx = new OpenLayers.Pixel(0,0);
            var tlLL = this.getLonLatFromViewPortPx(tlPx);
    
            var brPx = new OpenLayers.Pixel(size.w, size.h);
            var brLL = this.getLonLatFromViewPortPx(brPx);
            
            extent = new OpenLayers.Bounds(tlLL.lon, 
                                           brLL.lat, 
                                           brLL.lon, 
                                           tlLL.lat);
**/
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer"
};
