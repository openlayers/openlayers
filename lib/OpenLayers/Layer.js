/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @requires OpenLayers/Map.js
 * 
 * Class: OpenLayers.Layer
 */
OpenLayers.Layer = OpenLayers.Class.create();
OpenLayers.Layer.prototype = {

    /**
     * APIProperty: id
     * {String}
     */
    id: null,

    /** 
     * APIProperty: name
     * {String}
     */
    name: null,

    /** 
     * APIProperty: div
     * {DOMElement}
     */
    div: null,

    /** 
     * Constant: EVENT_TYPES
     * {Array(String)} Supported application event types
     */
    EVENT_TYPES: [ "loadstart", "loadend", "loadcancel"],
        
    /**
     * APIProperty: events``
     * {<OpenLayers.Events>}
     */
    events: null,

    /**
     * APIProperty: map
     * {<OpenLayers.Map>} This variable is set when the layer is added to 
     *                    the map, via the accessor function setMap().
     */
    map: null,
    
    /**
     * APIProperty: isBaseLayer
     * {Boolean} Whether or not the layer is a base layer. This should be set 
     *           individually by all subclasses. 
     *           Default is false
     */
    isBaseLayer: false,
 
    /**
     * Property: alpha
     * {Boolean} Whether or not the layer's images have an alpha channel 
     */
    alpha: false,

    /** 
     * APIProperty: displayInLayerSwitcher
     * {Boolean} Should the layer's name appear in the layer switcher?
     */
    displayInLayerSwitcher: true,

    /**
     * APIProperty: visibility
     * {Boolean} Whether or not the layer should be displayed in the map
     */
    visibility: true,

    /** 
     * APIProperty: inRange
     * {Boolean} Whether or not the map's current resolution is within this 
     *           layer's min/max range -- this is set in map's setCenter() 
     *           whenever zoom changes.
     */
    inRange: false,
    
    /**
     * Propery: imageSize
     * {<OpenLayers.Size>} For layers with a gutter, the image is larger than 
     *                     the tile by twice the gutter in each dimension.
     */
    imageSize: null,
    
    /**
     * Property: imageOffset
     * {<OpenLayers.Pixel>} For layers with a gutter, the image offset 
     * represents displacement due to the gutter.
     */
    imageOffset: null,

  // OPTIONS

    /** 
     * Property: options
     * {Object} 
     */
    options: null,

    /**
     * Property: gutter
     * {Integer} Determines the width (in pixels) of the gutter around image
     *           tiles to ignore.  By setting this property to a non-zero 
     *           value, images will be requested that are wider and taller 
     *           than the tile size by a value of 2 x gutter.  This allows 
     *           artifacts of rendering at tile edges to be ignored.  Set a 
     *           gutter value that is equal to half the size of the widest 
     *           symbol that needs to be displayed.  Defaults to zero.
     *           Non-tiled layers always have zero gutter.
     */ 
    gutter: 0, 

    /**
     * Property: projection
     * {String} Set in the layer options to override the default projection
     *          string this layer - also set maxExtent, maxResolution, and 
     *          units if appropriate.
     */
    projection: null,    
    
    /**
     * Property: units
     * {String} The layer map units.  Defaults to 'degrees'.  Possible values
     *          are 'degrees' (or 'dd'), 'm', 'ft', 'km', 'mi', 'inches'.
     */
    units: null,

    /**
     * Property: scales
     * {Array}
     */
    scales: null,

    /**
     * Property: resolutions
     * {Array}
     */
    resolutions: null,
    
    /**
     * Property: maxExtent
     * {<OpenLayers.Bounds>}
     */
    maxExtent: null,
    
    /**
     * Property: minExtent
     * {<OpenLayers.Bounds>}
     */
    minExtent: null,
    
    /**
     * Property: maxResolution
     * {Float} Default max is 360 deg / 256 px, which corresponds to
     *         zoom level 0 on gmaps.  Specify a different value in the layer 
     *         options if you are not using a geographic projection and 
     *         displaying the whole world.
     */
    maxResolution: null,

    /**
     * Property: minResolution
     * {Float}
     */
    minResolution: null,

    /**
     * Property: numZoomLevels
     * {Integer}
     */
    numZoomLevels: null,
   
    /**
     * Property: minScale
     * {Float}
     */
    minScale: null,
    
    /**
     * Property: maxScale
     * {Float}
     */
    maxScale: null,

    /**
     * Property: displayOutsideMaxExtent
     * {Boolean} Request map tiles that are completely outside of the max extent
     *           for this layer.  Defaults to false
     */
    displayOutsideMaxExtent: false,

    /**
     * Property: wrapDateLine
     * {Boolean} #487 for more info.   
     */
    wrapDateLine: false,
    
    
    /**
     * Constructor: OpenLayers.Layer
     *
     * Parameters:
     * name - {String} The layer name
     * options - {Object} Hashtable of extra options to tag onto the layer
     */
    initialize: function(name, options) {

        this.addOptions(options);

        this.name = name;
        
        if (this.id == null) {

            this.id = OpenLayers.Util.createUniqueID(this.CLASS_NAME + "_");

            this.div = OpenLayers.Util.createDiv();
            this.div.style.width = "100%";
            this.div.style.height = "100%";
            this.div.id = this.id;

            this.events = new OpenLayers.Events(this, this.div, 
                                                this.EVENT_TYPES);
        }

        if (this.wrapDateLine) {
            this.displayOutsideMaxExtent = true;
        }
    },
    
    /**
     * Method: destroy
     * Destroy is a destructor: this is to alleviate cyclic references which
     *     the Javascript garbage cleaner can not take care of on its own.
     *
     * Parameters:
     * setNewBaseLayer - {Boolean} Should a new baselayer be selected when
     *                             this has been removed? 
     *                             Default is true.
     */
    destroy: function(setNewBaseLayer) {
        if (setNewBaseLayer == null) {
            setNewBaseLayer = true;
        }
        if (this.map != null) {
            this.map.removeLayer(this, setNewBaseLayer);
        }
        this.map = null;
        this.name = null;
        this.div = null;
        this.options = null;

        if (this.events) {
            this.events.destroy();
        }
        this.events = null;
    },
    
   /**
    * Method: clone
    *
    * Parameters:
    * obj - {<OpenLayers.Layer>} The layer to be cloned
    *
    * Return:
    * {<OpenLayers.Layer>} An exact clone of this <OpenLayers.Layer>
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
     * APIMethod: setName
     * 
     * Parameters:
     * newName - {String}
     */
    setName: function(newName) {
        if (newName != this.name) {
            this.name = newName;
            if (this.map != null) {
                this.map.events.triggerEvent("changelayer");
            }
        }
    },    
    
   /**
    * APIMethod: addOptions
    * 
    * Parameters:
    * newOptions - {Object}
    */
    addOptions: function (newOptions) {
        
        if (this.options == null) {
            this.options = new Object();
        }
        
        // update our copy for clone
        OpenLayers.Util.extend(this.options, newOptions);

        // add new options to this
        OpenLayers.Util.extend(this, newOptions);
    },
    
    /**
     * APIMethod: onMapResize
     * This function can be implemented by subclasses
     */
    onMapResize: function() {
        //this function can be implemented by subclasses  
    },

    /**
     * Method: moveTo
     * 
     * Parameters:
     * bound - {<OpenLayers.Bounds>}
     * zoomChanged - {Boolean} Tells when zoom has changed, as layers 
     *                         have to do some init work in that case.
     * dragging - {Boolean}
     */
    moveTo:function(bounds, zoomChanged, dragging) {
        var display = this.visibility;
        if (!this.isBaseLayer) {
            display = display && this.inRange;
        }
        this.display(display);
    },

    /**
     * Method: setMap
     * Set the map property for the layer. This is done through an accessor
     *     so that subclasses can override this and take special action once 
     *     they have their map variable set. 
     * 
     *     Here we take care to bring over any of the necessary default properties
     *     from the map. 
     * 
     * Parameters:
     * map - {<OpenLayers.Map>}
     */
    setMap: function(map) {
        if (this.map == null) {
        
            this.map = map;
            
            // grab some essential layer data from the map if it hasn't already
            //  been set
            this.maxExtent = this.maxExtent || this.map.maxExtent;
            this.projection = this.projection || this.map.projection;
            this.units = this.units || this.map.units;
            
            this.initResolutions();
            
            if (!this.isBaseLayer) {
                this.inRange = this.calculateInRange();
                var show = ((this.visibility) && (this.inRange));
                this.div.style.display = show ? "" : "none";
            }
            
            // deal with gutters
            this.setTileSize();
        }
    },
    
    /**  
     * @returns The size that the image should be, taking into account gutters 
     * @tile OpenLayers.Size 
     */ 
    getImageSize: function() { 
        return (this.imageSize || this.tileSize); 
    },    
  
    /**
     * APIMethod: setTileSize
     * Set the tile size based on the map size.  This also sets layer.imageSize
     *     and layer.imageOffset for use by Tile.Image.
     * 
     * Parameters:
     * size - {<OpenLayers.Size>}
     */
    setTileSize: function(size) {
        var tileSize = (size) ? size :
                                ((this.tileSize) ? this.tileSize :
                                                   this.map.getTileSize());
        this.tileSize = tileSize;
        if(this.gutter) {
            // layers with gutters need non-null tile sizes
            //if(tileSize == null) {
            //    OpenLayers.console.error("Error in layer.setMap() for " +
            //                              this.name + ": layers with gutters " +
            //                              "need non-null tile sizes");
            //}
            this.imageOffset = new OpenLayers.Pixel(-this.gutter, -this.gutter); 
            this.imageSize = new OpenLayers.Size(tileSize.w + (2 * this.gutter), 
                                                 tileSize.h + (2 * this.gutter)); 
        }
    },

    /**
     * APIMethod: getVisibility
     * 
     * Return:
     * {Boolean} Whether or not the layer should be displayed (if in range)
     */
    getVisibility: function() {
        return this.visibility;
    },

    /** 
     * APIMethod: setVisibility
     * Set the visibility flag for the layer and hide/show&redraw accordingly. 
     *     Fire event unless otherwise specified
     * 
     *     Note that visibility is no longer simply whether or not the layer's
     *     style.display is set to "block". Now we store a 'visibility' state 
     *     property on the layer class, this allows us to remember whether or 
     *     not we *desire* for a layer to be visible. In the case where the 
     *     map's resolution is out of the layer's range, this desire may be 
     *     subverted.
     * 
     * Parameters:
     * visible - {Boolean} Whether or not to display the layer (if in range)
     * noEvent - {Boolean}
     */
    setVisibility: function(visibility, noEvent) {
        if (visibility != this.visibility) {
            this.visibility = visibility;
            this.display(visibility);
            if (visibility && this.map != null) {
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

    /** 
     * APIMethod: display
     * Hide or show the Layer
     * 
     * Parameters:
     * display - {Boolean}
     */
    display: function(display) {
        if (display != (this.div.style.display != "none")) {
            this.div.style.display = (display) ? "block" : "none";
        }
    },

    /**
     * Method: calculateInRange
     * 
     * Return:
     * {Boolean} Whether or not the layer is displayable at the current map's
     *           current resolution
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
     * APIMethod: setIsBaseLayer
     * 
     * Parameters:
     * isBaseLayer - {Boolean}
     */
    setIsBaseLayer: function(isBaseLayer) {
        if (isBaseLayer != this.isBaseLayer) {
            this.isBaseLayer = isBaseLayer;
            if (this.map != null) {
                this.map.events.triggerEvent("changelayer");
            }
        }
    },

  /********************************************************/
  /*                                                      */
  /*                 Baselayer Functions                  */
  /*                                                      */
  /********************************************************/
  
    /** 
     * Method: initResolutions
     * This method's responsibility is to set up the 'resolutions' array 
     *     for the layer -- this array is what the layer will use to interface
     *     between the zoom levels of the map and the resolution display 
     *     of the layer.
     * 
     *     The user has several options that determine how the array is set up.
     *  
     *     For a detailed explanation, see the following wiki from the 
     *     openlayers.org homepage:
     * 
     *     http://trac.openlayers.org/wiki/SettingZoomLevels
     */
    initResolutions: function() {

        // These are the relevant options which are used for calculating 
        //  resolutions information.
        //
        var props = new Array(
          'projection', 'units',
          'scales', 'resolutions',
          'maxScale', 'minScale', 
          'maxResolution', 'minResolution', 
          'minExtent', 'maxExtent',
          'numZoomLevels', 'maxZoomLevel'
        );

        // First we create a new object where we will store all of the 
        //  resolution-related properties that we find in either the layer's
        //  'options' array or from the map.
        //
        var confProps = new Object();        
        for(var i=0; i < props.length; i++) {
            var property = props[i];
            confProps[property] = this.options[property] || this.map[property];
        }

        // If numZoomLevels hasn't been set and the maxZoomLevel *has*, 
        //  then use maxZoomLevel to calculate numZoomLevels
        //
        if ( (!confProps.numZoomLevels) && (confProps.maxZoomLevel) ) {
            confProps.numZoomLevels = confProps.maxZoomLevel + 1;
        }

        // First off, we take whatever hodge-podge of values we have and 
        //  calculate/distill them down into a resolutions[] array
        //
        if ((confProps.scales != null) || (confProps.resolutions != null)) {
          //preset levels
            if (confProps.scales != null) {
                confProps.resolutions = new Array();
                for(var i = 0; i < confProps.scales.length; i++) {
                    var scale = confProps.scales[i];
                    confProps.resolutions[i] = 
                       OpenLayers.Util.getResolutionFromScale(scale, 
                                                              confProps.units);
                }
            }
            confProps.numZoomLevels = confProps.resolutions.length;

        } else {
          //maxResolution and numZoomLevels based calculation
            
            confProps.resolutions = new Array();
            
            // determine maxResolution
            if (confProps.minScale) {
                confProps.maxResolution = 
                    OpenLayers.Util.getResolutionFromScale(confProps.minScale, 
                                                           confProps.units);
            } else if (confProps.maxResolution == "auto") {
                var viewSize = this.map.getSize();
                var wRes = confProps.maxExtent.getWidth() / viewSize.w;
                var hRes = confProps.maxExtent.getHeight()/ viewSize.h;
                confProps.maxResolution = Math.max(wRes, hRes);
            } 

            // determine minResolution
            if (confProps.maxScale != null) {           
                confProps.minResolution = 
                    OpenLayers.Util.getResolutionFromScale(confProps.maxScale);
            } else if ( (confProps.minResolution == "auto") && 
                        (confProps.minExtent != null) ) {
                var viewSize = this.map.getSize();
                var wRes = confProps.minExtent.getWidth() / viewSize.w;
                var hRes = confProps.minExtent.getHeight()/ viewSize.h;
                confProps.minResolution = Math.max(wRes, hRes);
            } 

            // determine numZoomLevels
            if (confProps.minResolution != null) {
                var ratio = confProps.maxResolution / confProps.minResolution;
                confProps.numZoomLevels = 
                    Math.floor(Math.log(ratio) / Math.log(2)) + 1;
            }
            
            // now we have numZoomLevels and maxResolution, 
            //  we can populate the resolutions array
            for (var i=0; i < confProps.numZoomLevels; i++) {
                var res = confProps.maxResolution / Math.pow(2, i)
                confProps.resolutions.push(res);
            }    
        }
        
        //sort resolutions array ascendingly
        //
        confProps.resolutions.sort( function(a, b) { return(b-a); } );

        // now set our newly calculated values back to the layer 
        //  Note: We specifically do *not* set them to layer.options, which we 
        //        will preserve as it was when we added this layer to the map. 
        //        this way cloned layers reset themselves to new map div 
        //        dimensions)
        //

        this.resolutions = confProps.resolutions;
        this.maxResolution = confProps.resolutions[0];
        var lastIndex = confProps.resolutions.length - 1;
        this.minResolution = confProps.resolutions[lastIndex];
        
        this.scales = new Array();
        for(var i = 0; i < confProps.resolutions.length; i++) {
            this.scales[i] = 
               OpenLayers.Util.getScaleFromResolution(confProps.resolutions[i], 
                                                      confProps.units);
        }
        this.minScale = this.scales[0];
        this.maxScale = this.scales[this.scales.length - 1];
        
        this.numZoomLevels = confProps.numZoomLevels;
    },

    /**
     * APIMethod: getResolution
     * 
     * Return:
     * {Float} The currently selected resolution of the map, taken from the
     *         resolutions array, indexed by current zoom level.
     */
    getResolution: function() {
        var zoom = this.map.getZoom();
        return this.resolutions[zoom];
    },

    /** 
     * APIMethod: getExtent
     * 
     * Return:
     * {<OpenLayers.Bounds>} A Bounds object which represents the lon/lat 
     *                       bounds of the current viewPort.
     */
    getExtent: function() {
        // just use stock map calculateBounds function -- passing no arguments
        //  means it will user map's current center & resolution
        //
        return this.map.calculateBounds();
    },

    /**
     * APIMethod: getZoomForExtent
     * 
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     *
     * Return:
     * {Integer} The index of the zoomLevel (entry in the resolutions array) 
     *           that still contains the passed-in extent. We do this by 
     *           calculating the ideal resolution for the given exteng (based
     *           on the map size) and then find the smallest resolution that 
     *           is greater than this ideal resolution.
     */
    getZoomForExtent: function(extent) {
        var viewSize = this.map.getSize();
        var idealResolution = Math.max( extent.getWidth()  / viewSize.w,
                                        extent.getHeight() / viewSize.h );

        return this.getZoomForResolution(idealResolution);
    },
    
    /**
     * APIMethod: getZoomForResolution
     * 
     * Parameters:
     * resolution - {Float}
     * 
     * Return:
     * {Integer} The index of the zoomLevel (entry in the resolutions array) 
     *           that is the smallest resolution that is greater than the 
     *           passed-in resolution.
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
     * APIMethod: getLonLatFromViewPortPx
     * 
     * Parameters:
     * viewPortPx - {<OpenLayers.Pixel>}
     *
     * Return:
     * {<OpenLayers.LonLat>} An OpenLayers.LonLat which is the passed-in 
     *                       view port <OpenLayers.Pixel>, translated into 
     *                       lon/lat by the layer
     */
    getLonLatFromViewPortPx: function (viewPortPx) {
        var lonlat = null;
        if (viewPortPx != null) {
            var size = this.map.getSize();
            var center = this.map.getCenter();
            if (center) {
                var res  = this.map.getResolution();
        
                var delta_x = viewPortPx.x - (size.w / 2);
                var delta_y = viewPortPx.y - (size.h / 2);
            
                lonlat = new OpenLayers.LonLat(center.lon + delta_x * res ,
                                             center.lat - delta_y * res); 

                if (this.wrapDateLine) {
                    lonlat = lonlat.wrapDateLine(this.maxExtent);
                }
            } // else { DEBUG STATEMENT }
        }
        return lonlat;
    },

    /**
     * APIMethod: getViewPortPxFromLonLat
     * 
     * Parameters:
     * lonlat - {<OpenLayers.LonLat>}
     *
     * Return: 
     * {<OpenLayers.Pixel>} An <OpenLayers.Pixel> which is the passed-in 
     *                      <OpenLayers.LonLat>,translated into view 
     *                      port pixels.
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
     * APIMethod: setOpacity
     * Sets the opacity for the entire layer (all images)
     * 
     * Parameter:
     * opacity - {Float}
     */
    setOpacity: function(opacity) {
        if (opacity != this.opacity) {
            this.opacity = opacity;
            for(var i=0; i<this.div.childNodes.length; ++i) {
                var element = this.div.childNodes[i].firstChild;
                OpenLayers.Util.modifyDOMElement(element, null, null, null, 
                                                 null, null, null, opacity);
            }
        }
    },

    /**
     * Method: setZIndex
     * 
     * Parameters: 
     * zIndex - {Integer}
     */    
    setZIndex: function (zIndex) {
        this.div.style.zIndex = zIndex;
    },

    /**
     * Method: adjustBounds
     * This function will take a bounds, and if wrapDateLine option is set
     *     on the layer, it will return a bounds which is wrapped around the 
     *     world. We do not wrap for bounds which *cross* the 
     *     maxExtent.left/right, only bounds which are entirely to the left 
     *     or entirely to the right.
     * 
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     */
    adjustBounds: function (bounds) {

        if (this.gutter) {
            // Adjust the extent of a bounds in map units by the 
            // layer's gutter in pixels.
            var mapGutter = this.gutter * this.map.getResolution();
            bounds = new OpenLayers.Bounds(bounds.left - mapGutter,
                                           bounds.bottom - mapGutter,
                                           bounds.right + mapGutter,
                                           bounds.top + mapGutter);
        }

        if (this.wrapDateLine) {
            // wrap around the date line, within the limits of rounding error
            var wrappingOptions = { 
                'rightTolerance':this.getResolution()
            };    
            bounds = bounds.wrapDateLine(this.maxExtent, wrappingOptions);
                              
        }
        return bounds;
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer"
};
