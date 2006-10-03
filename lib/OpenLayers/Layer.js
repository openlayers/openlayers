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

    /** should the layer's name appear in the layer switcher?
     * 
     * @type boolean */
    displayInLayerSwitcher: true,

  // OPTIONS

    /** @type Array */
    options: null,

    /** @type String */
    projection: null,    
    
    /** @type String */
    units: null,

    /** @type Array */
    scales: null,

    /** @type Array */
    resolutions: null,
    
    /** @type OpenLayers.Bounds */
    maxExtent: null,
    
    /** @type OpenLayers.Bounds */
    minExtent: null,
    
    /** @type float */
    maxResolution: null,

    /** @type float */
    minResolution: null,

    /** @type int */
    numZoomLevels: null,
   
    /** @type float */
    minScale: null,
    
    /** @type float */
    maxScale: null,

    /** @type Boolean */
    displayOutsideMaxExtent: false,
    
    
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
            
            this.id = OpenLayers.Util.createUniqueID(this.CLASS_NAME + "_");
                    
            if (this.div == null) {
                this.div = OpenLayers.Util.createDiv();
                this.div.style.width = "100%";
                this.div.style.height = "100%";
                this.div.id = this.id;
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
     * 
     */
    onMapResize: function() {
        //this function can be implemented by subclasses  
    },

    /**
     * @param {OpenLayers.Bounds} bound
     * @param {Boolean} zoomChanged tells when zoom has changed, as layers 
     *                   have to do some init work in that case.
     * @param {Boolean} dragging
     */
    moveTo:function(bounds, zoomChanged, dragging) {
        //this function can be implemented by subclasses.
    },

    /** Set the map property for the layer. This is done through an accessor
     *   so that subclasses can override this and take special action once 
     *   they have their map variable set. 
     * 
     *  Here we take care to bring over any of the necessary default properties
     *   from the map. 
     * 
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {
        this.map = map;
        
        var properties = new Array(
          'projection', 'units',
          'scales', 'resolutions',
          'maxScale', 'minScale', 
          'maxResolution', 'minResolution', 
          'minExtent', 'maxExtent',
          'numZoomLevels'
        );
        if (this.map.maxZoomLevel && !this.numZoomLevels) {
            this.numZoomLevels = this.map.maxZoomLevel + 1;
        }
        for(var i=0; i < properties.length; i++) {
            if (this[properties[i]] == null) {
                this[properties[i]] = this.map[properties[i]];
            }    
        }
        if (this.isBaseLayer) {
            this.initResolutions();
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
                    this.moveTo(this.map.getExtent(), true);
                }
            }
            if ((this.map != null) && 
                ((noEvent == null) || (noEvent == false))) {
                this.map.events.triggerEvent("changelayer");
            }
        }
    },
    
    /** 
     * @param {Boolean} isBaseLayer 
     */
    setIsBaseLayer: function(isBaseLayer) {
        this.isBaseLayer = isBaseLayer;
        if (this.map != null) {
            this.map.events.triggerEvent("changelayer");
        }
    },

  /********************************************************/
  /*                                                      */
  /*                 Baselayer Functions                  */
  /*                                                      */
  /********************************************************/
  
    /** This method's responsibility is to set up the 'resolutions' array 
     *   for the layer -- this array is what the layer will use to interface
     *   between the zoom levels of the map and the resolution display of the
     *   layer.
     * 
     *  The user has several options that determine how the array is set up.
     *  
     *  For a detailed explanation, see the following wiki from the 
     *   openlayers.org homepage:
     * 
     *  http://trac.openlayers.org/wiki/SettingZoomLevels
     * 
     * @private
     */
    initResolutions: function() {
        
        if ((this.scales != null) || (this.resolutions != null)) {
          //preset levels
            if (this.scales != null) {
                this.resolutions = new Array();
                for(var i = 0; i < this.scales.length; i++) {
                    this.resolutions[i] = 
                       OpenLayers.Util.getResolutionFromScale(this.scales[i], 
                                                              this.units);
                }
            }
            this.numZoomLevels = this.resolutions.length;

        } else {
          //maxResolution and numZoomLevels
            
            this.resolutions = new Array();
            
            // determine maxResolution
            if (this.minScale) {
                this.maxResolution = 
                    OpenLayers.Util.getResolutionFromScale(this.minScale, 
                                                           this.units);
            } else if (this.maxResolution == "auto") {
                var viewSize = this.map.getSize();
                var wRes = this.maxExtent.getWidth() / viewSize.w;
                var hRes = this.maxExtent.getHeight()/ viewSize.h;
                this.maxResolution = Math.max(wRes, hRes);
            } 

            // determine minResolution
            if (this.maxScale != null) {           
                this.minResolution = 
                    OpenLayers.Util.getResolutionFromScale(this.maxScale);
            } else if ((this.minResolution == "auto") && 
                       (this.minExtent != null)){
                var viewSize = this.map.getSize();
                var wRes = this.minExtent.getWidth() / viewSize.w;
                var hRes = this.minExtent.getHeight()/ viewSize.h;
                this.minResolution = Math.max(wRes, hRes);
            } 

            // determine numZoomLevels
            if (this.minResolution != null) {
                var ratio = this.maxResolution / this.minResolution;
                this.numZoomLevels = 
                    Math.floor(Math.log(ratio) / Math.log(2)) + 1;
            }
            
            // now we have numZoomLevels and maxResolution, 
            //  we can populate the resolutions array
            for (var i=0; i < this.numZoomLevels; i++) {
                this.resolutions.push(this.maxResolution / Math.pow(2, i));
            }    
        }

        this.resolutions.sort( function ascend(a,b) { 
                                   return(b-a);
                               });
    },

    /**
     * @returns The currently selected resolution of the map, taken from the
     *          resolutions array, indexed by current zoom level.
     * @type float
     */
    getResolution: function() {
        var zoom = this.map.getZoom();
        return this.resolutions[zoom];
    },

    /** Calculates based on resolution, center, and mapsize
     * 
     * @param {float} resolution Specific resolution to get an extent for.
     *                           If null, this.getResolution() is called
     * @returns A Bounds object which represents the lon/lat bounds of the 
     *          current viewPort.
     * @type OpenLayers.Bounds
     */
    getExtent: function(resolution) {
        var extent = null;

        var center = this.map.getCenter();
        if (center != null) {

            if (resolution == null) {
                resolution = this.getResolution();
            }
            var size = this.map.getSize();
            var w_deg = size.w * resolution;
            var h_deg = size.h * resolution;

            extent = new OpenLayers.Bounds(center.lon - w_deg / 2,
                                           center.lat - h_deg / 2,
                                           center.lon + w_deg / 2,
                                           center.lat + h_deg / 2);

        }

        return extent;
    },

    /**
     * @param {OpenLayers.Bounds} bounds
     *
     * @returns The index of the zoomLevel (entry in the resolutions array) 
     *           that still contains the passed-in extent. We do this by 
     *           calculating the ideal resolution for the given exteng (based
     *           on the map size) and then find the smallest resolution that 
     *           is greater than this ideal resolution.
     * @type int
     */
    getZoomForExtent: function(extent) {
        var viewSize = this.map.getSize();
        var idealResolution = Math.max( extent.getWidth()  / viewSize.w,
                                        extent.getHeight() / viewSize.h );

        return this.getZoomForResolution(idealResolution);
    },
    
    /**
     * @param {float} resolution
     *
     * @returns The index of the zoomLevel (entry in the resolutions array) 
     *           that is the smallest resolution that is greater than the 
     *           passed-in resolution.
     * @type int
     */
    getZoomForResolution: function(resolution) {
        
        for(var i=1; i < this.resolutions.length; i++) {
            if ( this.resolutions[i] < resolution) {
                break;
            }
        }
        return (i - 1);
    },
    
    /**
     * @param {OpenLayers.Pixel} viewPortPx
     *
     * @returns An OpenLayers.LonLat which is the passed-in view port
     *          OpenLayers.Pixel, translated into lon/lat by the layer
     * @type OpenLayers.LonLat
     */
    getLonLatFromViewPortPx: function (viewPortPx) {
        var lonlat = null;
        if (viewPortPx != null) {
            var size = this.map.getSize();
            var center = this.map.getCenter();
            var res  = this.map.getResolution();
        
            var delta_x = viewPortPx.x - (size.w / 2);
            var delta_y = viewPortPx.y - (size.h / 2);
            
            lonlat = new OpenLayers.LonLat(center.lon + delta_x * res ,
                                         center.lat - delta_y * res); 
        }
        return lonlat;
    },

    /**
     * @param {OpenLayers.LonLat} lonlat
     *
     * @returns An OpenLayers.Pixel which is the passed-in OpenLayers.LonLat, 
     *          translated into view port pixels
     * @type OpenLayers.Pixel
     */
    getViewPortPxFromLonLat: function (lonlat) {
        var px = null; 
        if (lonlat != null) {
            var resolution = this.map.getResolution();
            var extent = this.map.getExtent();
            px = new OpenLayers.Pixel(
                           Math.round(1/resolution * (lonlat.lon - extent.left)),
                           Math.round(1/resolution * (extent.top - lonlat.lat))
                           );    
        }
        return px;
    },
    
    /**
     * Sets the opacity for the entire layer (all images)
     * @param {Float} opacity
     */
    setOpacity: function(opacity) {
        this.opacity = opacity;
        for(var i=0; i<this.div.childNodes.length; ++i) {
            var element = this.div.childNodes[i];
            OpenLayers.Util.modifyDOMElement(element, null, null, null, 
                                             null, null, null, opacity);
        }
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer"
};
