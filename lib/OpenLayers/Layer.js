/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

/**
 * @class
 */
OpenLayers.Layer = OpenLayers.Class.create();
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

    /** Whether or not the layer should be displayed in the map
     * 
     * @type Boolean
     */
    visibility: true,

    /** Whether or not the map's current resolution is within this layer's
     *   min/max range -- this is set in map's setCenter() whenever zoom
     *   changes
     * 
     * @type Boolean
     */
    inRange: false,

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
        //store a copy of the custom options for later cloning
        this.options = OpenLayers.Util.extend(new Object(), options);
        
        //add options to layer
        OpenLayers.Util.extend(this, this.options);

        this.name = name;
        
        this.id = OpenLayers.Util.createUniqueID(this.CLASS_NAME + "_");
                
        if (this.div == null) {
            this.div = OpenLayers.Util.createDiv();
            this.div.style.width = "100%";
            this.div.style.height = "100%";
            this.div.id = this.id;
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
        OpenLayers.Util.extend(this.options, newOptions);

        // add new options to this
        OpenLayers.Util.extend(this, this.options);
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
        this.display(this.visibility && this.inRange);
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
        this.initResolutions();
        
        this.inRange = this.calculateInRange();
        
    },
  
    /**
    * @returns Whether or not the layer should be displayed (if in range)
    * @type Boolean
    */
    getVisibility: function() {
        return this.visibility;
    },

    /** Set the visibility flag for the layer and hide/show&redraw accordingly. 
     *   Fire event unless otherwise specified
     * 
     * Note that visibility is no longer simply whether or not the layer's
     *  style.display is set to "block". Now we store a 'visibility' state 
     *  property on the layer class, this allows us to remember whether or not
     *  we *desire* for a layer to be visible. In the case where the map's 
     *  resolution is out of the layer's range, this desire may be subverted.
     *  
     * @param {Boolean} visible Whether or not to display the layer 
     *                          (if in range)
     * @param {Boolean} noEvent
     */
    setVisibility: function(visibility, noEvent) {
        if (visibility != this.visibility) {
            this.visibility = visibility;
            this.display(visibility);
            if (this.map != null) {
                var extent = this.map.getExtent();
                if (extent != null) {
                    this.moveTo(extent, true);
                }
            }
            if ((this.map != null) && 
                ((noEvent == null) || (noEvent == false))) {
                this.map.events.triggerEvent("changelayer");
            }
        }
    },

    /** Hide or show the Layer
     * 
     * @param {Boolean} display
     */
    display: function(display) {
        if (display != (this.div.style.display != "none")) {
            this.div.style.display = (display) ? "block" : "none";
        }
    },

    /**
     * @returns Whether or not the layer is displayable at the current map's
     *          current resolution
     * @type Boolean
     */
    calculateInRange: function() {
        var inRange = false;
        if (this.map) {
            var resolution = this.map.getResolution();
            inRange = ( (resolution >= this.minResolution) &&
                        (resolution <= this.maxResolution) );
        }
        return inRange;
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

        this.resolutions.sort( function(a,b) { 
                                   return(b-a);
                               });

        this.minResolution = this.resolutions[this.resolutions.length - 1];
        this.maxResolution = this.resolutions[0];
        
        this.minScale = 
            OpenLayers.Util.getScaleFromResolution(this.maxResolution, 
                                                   this.units);
        this.maxScale = 
            OpenLayers.Util.getScaleFromResolution(this.minResolution, 
                                                   this.units);
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

    /**
    * @param {int} zIdx
    * @private
    */    
    setZIndex: function (zIdx) {
        this.div.style.zIndex = zIdx;
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer"
};
