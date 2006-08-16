/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

/**
 * @class
 */
OpenLayers.Layer = Class.create();
OpenLayers.Layer.prototype = {

    /** @type String */
    id: null,

    /** @type String */
    name: null,

    /** @type DOMElement */
    div: null,

    /** This variable is set when the layer is added to the map, via the 
     *  accessor function setMap()
     * 
     * @type OpenLayers.Map */
    map: null,
    
    /** Whether or not the layer is a base layer. This should be set 
     *   individually by all subclasses. 
     *   Default is false
     * 
     * @type Boolean
     */
    isBaseLayer: false,
 
    /** asserts whether or not the layer's images have an alpha channel 
     * 
     * @type boolean */
    alpha: false,

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
   
    /** @type float */
    minScale: null,
    
    /** @type float */
    maxScale: null,
    
    /** @type String */
    units: null,
    
    /**
     * @constructor
     * 
     * @param {String} name
     * @param {Object} options Hashtable of extra options to tag onto the layer
     */
    initialize: function(name, options) {
        if (arguments.length > 0) {

            //store a copy of the custom options for later cloning
            this.options = Object.extend(new Object(), options);
            
            //add options to layer
            Object.extend(this, this.options);

            this.name = name;
            
            //generate unique id based on name
            this.id = OpenLayers.Util.createUniqueID("Layer_");
            
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
    clone: function (obj) {
        
        if (obj == null) {
            obj = new OpenLayers.Layer(this.name, this.options);
        } 
        
        // catch any randomly tagged-on properties
        OpenLayers.Util.applyDefaults(obj, this);
        
        // a cloned layer should never have its map property set
        //  because it has not been added to a map yet. 
        obj.map = null;
        
        return obj;
    },
    
    /** 
     * @param {String} newName
     */
    setName: function(newName) {
        this.name = newName;
        if (this.map != null)
            this.map.events.triggerEvent("changelayer");
    },    
    
   /**
    * @param {Object} newOptions
    */
    addOptions: function (newOptions) {
        
        // update our copy for clone
        Object.extend(this.options, newOptions);

        // add new options to this
        Object.extend(this, this.options);
    },
    

    /**
     * @param {OpenLayers.Bounds} bound
     * @param {Boolean} zoomChanged tells when zoom has changed, as layers 
     *                   have to do some init work in that case.
     * @param {Boolean} minor
     */
    moveTo:function(bounds, zoomChanged, minor) {
        //this function can be implemented by subclasses.
    },

    /** Set the map property for the layer. This is done through an accessor
     *   so that subclasses can override this and take special action once 
     *   they have their map variable set. 
     * 
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {
        this.map = map;
        
        var properties = new Array(
          'projection', 'minExtent', 'maxExtent',
          'minScale', 'maxScale',
          'maxResolution', 'minResolution', 
          'minZoomLevel', 'maxZoomLevel', 'units',
          'scales', 'resolutions'
          
        );
        for(var i=0; i < properties.length; i++) {
            if (this[properties[i]] == null) {
                this[properties[i]] = this.map[properties[i]];
            }    
        }
    },
  
    /**
    * @returns Whether or not the layer is visible
    * @type Boolean
    */
    getVisibility: function() {
        return (this.div.style.display != "none");
    },

    /** 
     * @param {Boolean} visible
     * @param {Boolean} noEvent
     */
    setVisibility: function(visible, noEvent) {
        if (visible != this.getVisibility()) {
            this.div.style.display = (visible) ? "block" : "none";
            if ((visible) && (this.map != null)) {
                var extent = this.map.getExtent();
                if (extent != null) {
                    this.moveTo(this.map.getExtent());
                }
            }
            if ((this.map != null) && 
                ((noEvent == null) || (noEvent == false))) {
                this.map.events.triggerEvent("changelayer");
            }
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
    
    /** Calculates using px-> lonlat translation functions on tl and br 
     *   corners of viewport
     * 
     * @returns A Bounds object which represents the lon/lat bounds of the 
     *          current viewPort.
     * @type OpenLayers.Bounds
     */
    getExtent: function () {
        var extent = null;
        
        
        var size = this.map.getSize();
        
        var tlPx = new OpenLayers.Pixel(0,0);
        var tlLL = this.getLonLatFromViewPortPx(tlPx);

        var brPx = new OpenLayers.Pixel(size.w, size.h);
        var brLL = this.getLonLatFromViewPortPx(brPx);
        
        if ((tlLL != null) && (brLL != null)) {
            extent = new OpenLayers.Bounds(tlLL.lon, 
                                       brLL.lat, 
                                       brLL.lon, 
                                       tlLL.lat);
        }

        return extent;
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



    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer"
};
