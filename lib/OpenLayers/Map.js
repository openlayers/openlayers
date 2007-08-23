/* Copyright (c) 2006-2007 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @requires OpenLayers/Util.js
 * @requires OpenLayers/Events.js
 * 
 * Class: OpenLayers.Map
 * Instances of OpenLayers.Map are interactive maps embedded in a web page.
 * Create a new map with the <OpenLayers.Map> constructor.
 * 
 * On their own maps do not provide much functionality.  To extend a map
 * it's necessary to add controls (<OpenLayers.Control>) and 
 * layers (<OpenLayers.Layer>) to the map. 
 */
OpenLayers.Map = OpenLayers.Class({
    
    /**
     * Constant: Z_INDEX_BASE
     * {Object} Base z-indexes for different classes of thing 
     */
    Z_INDEX_BASE: { BaseLayer: 100, Overlay: 325, Popup: 750, Control: 1000 },

    /**
     * Constant: EVENT_TYPES
     * {Array(String)} supported application event types
     */
    EVENT_TYPES: [ 
        "addlayer", "removelayer", "changelayer", "movestart", "move", 
        "moveend", "zoomend", "popupopen", "popupclose",
        "addmarker", "removemarker", "clearmarkers", "mouseover",
        "mouseout", "mousemove", "dragstart", "drag", "dragend",
        "changebaselayer"],

    /**
     * Property: id
     * {String} Unique identifier for the map
     */
    id: null,
    
    /**
     * APIProperty: events
     * {<OpenLayers.Events>} An events object that handles all 
     *                       events on the map
     */
    events: null,

    /**
     * APIProperty: div
     * {DOMElement} The element that contains the map
     */
    div: null,

    /**
     * Property: size
     * {<OpenLayers.Size>} Size of the main div (this.div)
     */
    size: null,
    
    /**
     * Property: viewPortDiv
     * {HTMLDivElement} The element that represents the map viewport
     */
    viewPortDiv: null,

    /**
     * Property: layerContainerOrigin
     * {<OpenLayers.LonLat>} The lonlat at which the later container was
     *                       re-initialized (on-zoom)
     */
    layerContainerOrigin: null,

    /**
     * Property: layerContainerDiv
     * {HTMLDivElement} The element that contains the layers.
     */
    layerContainerDiv: null,

    /**
     * Property: layers
     * {Array(<OpenLayers.Layer>)} Ordered list of layers in the map
     */
    layers: null,

    /**
     * Property: controls
     * {Array(<OpenLayers.Control>)} List of controls associated with the map
     */
    controls: null,

    /**
     * Property: popups
     * {Array(<OpenLayers.Popup>)} List of popups associated with the map
     */
    popups: null,

    /**
     * APIProperty: baseLayer
     * {<OpenLayers.Layer>} The currently selected base layer.  This determines
     * min/max zoom level, projection, etc.
     */
    baseLayer: null,
    
    /**
     * Property: center
     * {<OpenLayers.LonLat>} The current center of the map
     */
    center: null,

    /**
     * Property: zoom
     * {Integer} The current zoom level of the map
     */
    zoom: 0,    

    /**
     * Property: viewRequestID
     * {String} Used to store a unique identifier that changes when the map 
     *          view changes. viewRequestID should be used when adding data 
     *          asynchronously to the map: viewRequestID is incremented when 
     *          you initiate your request (right now during changing of 
     *          baselayers and changing of zooms). It is stored here in the 
     *          map and also in the data that will be coming back 
     *          asynchronously. Before displaying this data on request 
     *          completion, we check that the viewRequestID of the data is 
     *          still the same as that of the map. Fix for #480
     */
    viewRequestID: 0,

  // Options

    /**
     * APIProperty: tileSize
     * {<OpenLayers.Size>} Set in the map options to override the default tile
     *                     size for this map.
     */
    tileSize: null,

    /**
     * APIProperty: projection
     * {String} Set in the map options to override the default projection 
     *          string this map - also set maxExtent, maxResolution, and 
     *          units if appropriate.
     */
    projection: "EPSG:4326",    
        
    /**
     * APIProperty: units
     * {String} The map units.  Defaults to 'degrees'.  Possible values are
     *          'degrees' (or 'dd'), 'm', 'ft', 'km', 'mi', 'inches'.
     */
    units: 'degrees',

    /**
     * APIProperty: resolutions
     * {Array(Float)} A list of map resolutions (map units per pixel) in 
     *     descending order.  If this is not set in the layer constructor, it 
     *     will be set based on other resolution related properties 
     *     (maxExtent, maxResolution, maxScale, etc.).
     */
    resolutions: null,

    /**
     * APIProperty: maxResolution
     * {Float} Default max is 360 deg / 256 px, which corresponds to
     *          zoom level 0 on gmaps.  Specify a different value in the map 
     *          options if you are not using a geographic projection and 
     *          displaying the whole world.
     */
    maxResolution: 1.40625,

    /**
     * APIProperty: minResolution
     * {Float}
     */
    minResolution: null,

    /**
     * APIProperty: maxScale
     * {Float}
     */
    maxScale: null,

    /**
     * APIProperty: minScale
     * {Float}
     */
    minScale: null,

    /**
     * APIProperty: maxExtent
     * {<OpenLayers.Bounds>} The maximum extent for the map.  Defaults to the
     *                       whole world in decimal degrees 
     *                       (-180, -90, 180, 90).  Specify a different
     *                        extent in the map options if you are not using a 
     *                        geographic projection and displaying the whole 
     *                        world.
     */
    maxExtent: null,
    
    /**
     * APIProperty: minExtent
     * {<OpenLayers.Bounds>}
     */
    minExtent: null,
    
    /**
     * APIProperty: numZoomLevels
     * {Integer} Number of zoom levels for the map.  Defaults to 16.  Set a
     *           different value in the map options if needed.
     */
    numZoomLevels: 16,

    /**
     * APIProperty: theme
     * {String} Relative path to a CSS file from which to load theme styles.
     *          Specify null in the map options (e.g. {theme: null}) if you 
     *          want to get cascading style declarations - by putting links to 
     *          stylesheets or style declarations directly in your page.
     */
    theme: null,

    /**
     * APIProperty: fallThrough
     * {Boolean} Should OpenLayers allow events on the map to fall through to
     *           other elements on the page, or should it swallow them? (#457)
     *           Default is to swallow them.
     */
    fallThrough: false,

    /**
     * Constructor: OpenLayers.Map
     * Constructor for a new OpenLayers.Map instance.
     *
     * Parameters:
     * div - {String} Id of an element in your page that will contain the map.
     * options - {Object} Optional object with properties to tag onto the map.
     *
     * Examples:
     * (code)
     * // create a map with default options in an element with the id "map1"
     * var map = new OpenLayers.Map("map1");
     *
     * // create a map with non-default options in an element with id "map2"
     * var options = {
     *     maxExtent: new OpenLayers.Bounds(-200000, -200000, 200000, 200000),
     *     maxResolution: 156543,
     *     units: 'meters',
     *     projection: "EPSG:41001"
     * };
     * var map = new OpenLayers.Map("map2", options);
     * (end)
     */    
    initialize: function (div, options) {
        
        //set the default options
        this.setOptions(options);

        this.id = OpenLayers.Util.createUniqueID("OpenLayers.Map_");

        this.div = OpenLayers.Util.getElement(div);

        // the viewPortDiv is the outermost div we modify
        var id = this.div.id + "_OpenLayers_ViewPort";
        this.viewPortDiv = OpenLayers.Util.createDiv(id, null, null, null,
                                                     "relative", null,
                                                     "hidden");
        this.viewPortDiv.style.width = "100%";
        this.viewPortDiv.style.height = "100%";
        this.viewPortDiv.className = "olMapViewport";
        this.div.appendChild(this.viewPortDiv);

        // the layerContainerDiv is the one that holds all the layers
        id = this.div.id + "_OpenLayers_Container";
        this.layerContainerDiv = OpenLayers.Util.createDiv(id);
        this.layerContainerDiv.style.zIndex=this.Z_INDEX_BASE['Popup']-1;
        
        this.viewPortDiv.appendChild(this.layerContainerDiv);

        this.events = new OpenLayers.Events(this, 
                                            this.div, 
                                            this.EVENT_TYPES, 
                                            this.fallThrough);
        this.updateSize();
 
        // update the map size and location before the map moves
        this.events.register("movestart", this, this.updateSize);

        // Because Mozilla does not support the "resize" event for elements 
        // other than "window", we need to put a hack here. 
        if (navigator.appName.contains("Microsoft")) {
            // If IE, register the resize on the div
            this.events.register("resize", this, this.updateSize);
        } else {
            // Else updateSize on catching the window's resize
            //  Note that this is ok, as updateSize() does nothing if the 
            //  map's size has not actually changed.
            OpenLayers.Event.observe(window, 'resize', 
                          this.updateSize.bind(this));
        }
        
        // only append link stylesheet if the theme property is set
        if(this.theme) {
            // check existing links for equivalent url
            var addNode = true;
            var nodes = document.getElementsByTagName('link');
            for(var i=0; i<nodes.length; ++i) {
                if(OpenLayers.Util.isEquivalentUrl(nodes.item(i).href,
                                                   this.theme)) {
                    addNode = false;
                    break;
                }
            }
            // only add a new node if one with an equivalent url hasn't already
            // been added
            if(addNode) {
                var cssNode = document.createElement('link');
                cssNode.setAttribute('rel', 'stylesheet');
                cssNode.setAttribute('type', 'text/css');
                cssNode.setAttribute('href', this.theme);
                document.getElementsByTagName('head')[0].appendChild(cssNode);
            }
        }

        this.layers = [];
        
        if (this.controls == null) {
            if (OpenLayers.Control != null) { // running full or lite?
                this.controls = [ new OpenLayers.Control.Navigation(),
                                  new OpenLayers.Control.PanZoom(),
                                  new OpenLayers.Control.ArgParser()
                                ];
            } else {
                this.controls = [];
            }
        }

        for(var i=0; i < this.controls.length; i++) {
            this.addControlToMap(this.controls[i]);
        }

        this.popups = [];

        this.unloadDestroy = this.destroy.bind(this);
        

        // always call map.destroy()
        OpenLayers.Event.observe(window, 'unload', this.unloadDestroy);

    },

    /**
     * Method: unloadDestroy
     * Function that is called to destroy the map on page unload. stored here
     *     so that if map is manually destroyed, we can unregister this.
     */
    unloadDestroy: null,

    /**
     * APIMethod: destroy
     * Destroy this map
     */
    destroy:function() {
        // if unloadDestroy is null, we've already been destroyed
        if (!this.unloadDestroy) {
            return false;
        }

        // map has been destroyed. dont do it again!
        OpenLayers.Event.stopObserving(window, 'unload', this.unloadDestroy);
        this.unloadDestroy = null;

        if (this.layers != null) {
            for (var i = this.layers.length - 1; i>=0; --i) {
                //pass 'false' to destroy so that map wont try to set a new 
                // baselayer after each baselayer is removed
                this.layers[i].destroy(false);
            } 
            this.layers = null;
        }
        if (this.controls != null) {
            for (var i = this.controls.length - 1; i>=0; --i) {
                this.controls[i].destroy();
            } 
            this.controls = null;
        }
        if (this.viewPortDiv) {
            this.div.removeChild(this.viewPortDiv);
        }
        this.viewPortDiv = null;

        this.events.destroy();
        this.events = null;

    },

    /**
     * APIMethod: setOptions
     * Change the map options
     *
     * Parameters:
     * options - {Object} Hashtable of options to tag to the map
     */
    setOptions: function(options) {

        // Simple-type defaults are set in class definition. 
        //  Now set complex-type defaults 
        this.tileSize = new OpenLayers.Size(OpenLayers.Map.TILE_WIDTH,
                                            OpenLayers.Map.TILE_HEIGHT);
        
        this.maxExtent = new OpenLayers.Bounds(-180, -90, 180, 90);

        this.theme = OpenLayers._getScriptLocation() + 
                             'theme/default/style.css'; 

        // now add the options declared by the user
        //  (these will override defaults)
        OpenLayers.Util.extend(this, options);
    },

    /**
     * APIMethod: getTileSize
     * Get the tile size for the map
     *
     * Return:
     * {<OpenLayers.Size>}
     */
     getTileSize: function() {
         return this.tileSize;
     },

  /********************************************************/
  /*                                                      */
  /*                  Layer Functions                     */
  /*                                                      */
  /*     The following functions deal with adding and     */
  /*        removing Layers to and from the Map           */
  /*                                                      */
  /********************************************************/         

    /**
     * APIMethod: getLayer
     * Get a layer based on its id
     *
     * Parameter:
     * id - {String} A layer id
     *
     * Return:
     * {<OpenLayers.Layer>} The Layer with the corresponding id from the map's 
     *                      layer collection, or null if not found.
     */
    getLayer: function(id) {
        var foundLayer = null;
        for (var i = 0; i < this.layers.length; i++) {
            var layer = this.layers[i];
            if (layer.id == id) {
                foundLayer = layer;
            }
        }
        return foundLayer;
    },

    /**
    * Method: setLayerZIndex
    * 
    * Parameters:
    * layer - {<OpenLayers.Layer>} 
    * zIdx - {int} 
    */    
    setLayerZIndex: function (layer, zIdx) {
        layer.setZIndex(
            this.Z_INDEX_BASE[layer.isBaseLayer ? 'BaseLayer' : 'Overlay']
            + zIdx * 5 );
    },

    /**
    * APIMethod: addLayer
    *
    * Parameters:
    * layer - {<OpenLayers.Layer>} 
    */    
    addLayer: function (layer) {
        for(var i=0; i < this.layers.length; i++) {
            if (this.layers[i] == layer) {
                var msg = "You tried to add the layer: " + layer.name + 
                          " to the map, but it has already been added";
                OpenLayers.Console.warn(msg);
                return false;
            }
        }    
        
        layer.div.style.overflow = "";
        this.setLayerZIndex(layer, this.layers.length);

        if (layer.isFixed) {
            this.viewPortDiv.appendChild(layer.div);
        } else {
            this.layerContainerDiv.appendChild(layer.div);
        }
        this.layers.push(layer);
        layer.setMap(this);

        if (layer.isBaseLayer)  {
            if (this.baseLayer == null) {
                // set the first baselaye we add as the baselayer
                this.setBaseLayer(layer);
            } else {
                layer.setVisibility(false);
            }
        } else {
            layer.redraw();
        }

        this.events.triggerEvent("addlayer");
    },

    /**
    * APIMethod: addLayers 
    *
    * Parameters:
    * layers - Array({<OpenLayers.Layer>}) 
    */    
    addLayers: function (layers) {
        for (var i = 0; i <  layers.length; i++) {
            this.addLayer(layers[i]);
        }
    },

    /** 
     * APIMethod: removeLayer
     * Removes a layer from the map by removing its visual element (the 
     *   layer.div property), then removing it from the map's internal list 
     *   of layers, setting the layer's map property to null. 
     * 
     *   a "removelayer" event is triggered.
     * 
     *   very worthy of mention is that simply removing a layer from a map
     *   will not cause the removal of any popups which may have been created
     *   by the layer. this is due to the fact that it was decided at some
     *   point that popups would not belong to layers. thus there is no way 
     *   for us to know here to which layer the popup belongs.
     *    
     *     A simple solution to this is simply to call destroy() on the layer.
     *     the default OpenLayers.Layer class's destroy() function
     *     automatically takes care to remove itself from whatever map it has
     *     been attached to. 
     * 
     *     The correct solution is for the layer itself to register an 
     *     event-handler on "removelayer" and when it is called, if it 
     *     recognizes itself as the layer being removed, then it cycles through
     *     its own personal list of popups, removing them from the map.
     * 
     * Parameters:
     * layer - {<OpenLayers.Layer>} 
     * setNewBaseLayer - {Boolean} Default is true
     */
    removeLayer: function(layer, setNewBaseLayer) {
        if (setNewBaseLayer == null) {
            setNewBaseLayer = true;
        }

        if (layer.isFixed) {
            this.viewPortDiv.removeChild(layer.div);
        } else {
            this.layerContainerDiv.removeChild(layer.div);
        }
        layer.map = null;
        OpenLayers.Util.removeItem(this.layers, layer);

        // if we removed the base layer, need to set a new one
        if (setNewBaseLayer && (this.baseLayer == layer)) {
            this.baseLayer = null;
            for(i=0; i < this.layers.length; i++) {
                var iLayer = this.layers[i];
                if (iLayer.isBaseLayer) {
                    this.setBaseLayer(iLayer);
                    break;
                }
            }
        }
        this.events.triggerEvent("removelayer");
    },

    /**
     * APIMethod: getNumLayers
     * 
     * Return: {Int} The number of layers attached to the map.
     */
    getNumLayers: function () {
        return this.layers.length;
    },

    /** 
     * APIMethod: getLayerIndex
     *
     * Parameters:
     * layer - {<OpenLayers.Layer>}
     *
     * Return:
     * {Integer} The current (zero-based) index of the given layer in the map's
     *           layer stack. Returns -1 if the layer isn't on the map.
     */
    getLayerIndex: function (layer) {
        return OpenLayers.Util.indexOf(this.layers, layer);
    },
    
    /** 
     * APIMethod: setLayerIndex
     * Move the given layer to the specified (zero-based) index in the layer
     *     list, changing its z-index in the map display. Use
     *     map.getLayerIndex() to find out the current index of a layer. Note
     *     that this cannot (or at least should not) be effectively used to
     *     raise base layers above overlays.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer>} 
     * idx - {int} 
     */
    setLayerIndex: function (layer, idx) {
        var base = this.getLayerIndex(layer);
        if (idx < 0) 
            idx = 0;
        else if (idx > this.layers.length)
            idx = this.layers.length;
        if (base != idx) {
            this.layers.splice(base, 1);
            this.layers.splice(idx, 0, layer);
            for (var i = 0; i < this.layers.length; i++)
                this.setLayerZIndex(this.layers[i], i);
            this.events.triggerEvent("changelayer");
        }
    },

    /** 
     * APIMethod: raiseLayer
     * Change the index of the given layer by delta. If delta is positive, 
     *     the layer is moved up the map's layer stack; if delta is negative,
     *     the layer is moved down.  Again, note that this cannot (or at least
     *     should not) be effectively used to raise base layers above overlays.
     *
     * Paremeters:
     * layer - {<OpenLayers.Layer>} 
     * idx - {int} 
     */
    raiseLayer: function (layer, delta) {
        var idx = this.getLayerIndex(layer) + delta;
        this.setLayerIndex(layer, idx);
    },
    
    /** 
     * APIMethod: setBaseLayer
     * Allows user to specify one of the currently-loaded layers as the Map's
     *     new base layer.
     * 
     * Parameters:
     * newBaseLayer - {<OpenLayers.Layer>}
     * noEvent - {Boolean}
     */
    setBaseLayer: function(newBaseLayer, noEvent) {
        var oldExtent = null;
        if(this.baseLayer) {
            oldExtent = this.baseLayer.getExtent();
        }

        if (newBaseLayer != this.baseLayer) {
          
            // is newBaseLayer an already loaded layer?m
            if (OpenLayers.Util.indexOf(this.layers, newBaseLayer) != -1) {

                // make the old base layer invisible 
                if (this.baseLayer != null) {
                    this.baseLayer.setVisibility(false, noEvent);
                }

                // set new baselayer and make it visible
                this.baseLayer = newBaseLayer;
                
                // Increment viewRequestID since the baseLayer is 
                // changing. This is used by tiles to check if they should 
                // draw themselves.
                this.viewRequestID++;
                this.baseLayer.visibility = true;

                //redraw all layers
                var center = this.getCenter();
                if (center != null) {
                    if (oldExtent == null) {
                        // simply set center but force zoom change
                        this.setCenter(center, this.getZoom(), false, true);
                    } else {
                        // zoom to oldExtent *and* force zoom change
                        this.setCenter(oldExtent.getCenterLonLat(), 
                                       this.getZoomForExtent(oldExtent),
                                       false, true);
                    }
                }

                if ((noEvent == null) || (noEvent == false)) {
                    this.events.triggerEvent("changebaselayer");
                }
            }        
        }
    },


  /********************************************************/
  /*                                                      */
  /*                 Control Functions                    */
  /*                                                      */
  /*     The following functions deal with adding and     */
  /*        removing Controls to and from the Map         */
  /*                                                      */
  /********************************************************/         

    /**
     * APIMethod: addControl
     * 
     * Parameters:
     * control - {<OpenLayers.Control>}
     * px - {<OpenLayers.Pixel>}
     */    
    addControl: function (control, px) {
        this.controls.push(control);
        this.addControlToMap(control, px);
    },

    /**
     * Method: addControlToMap
     * 
     * Parameters:
     * 
     * control - {<OpenLayers.Control>}
     * px - {<OpenLayers.Pixel>}
     */    
    addControlToMap: function (control, px) {
        // If a control doesn't have a div at this point, it belongs in the
        // viewport.
        control.outsideViewport = (control.div != null);
        control.setMap(this);
        var div = control.draw(px);
        if (div) {
            if(!control.outsideViewport) {
                div.style.zIndex = this.Z_INDEX_BASE['Control'] +
                                    this.controls.length;
                this.viewPortDiv.appendChild( div );
            }
        }
    },
    
    /**
     * APIMethod: getControl
     * 
     * Parameters:
     * id - {String} ID of the control to return.
     * 
     * Return:
     * {<OpenLayers.Control>} The control from the map's list of controls 
     *                        which has a matching 'id'. If none found, 
     *                        returns null.
     */    
    getControl: function (id) {
        var returnControl = null;
        for(var i=0; i < this.controls.length; i++) {
            var control = this.controls[i];
            if (control.id == id) {
                returnControl = control;
                break;
            }
        }
        return returnControl;
    },
    
    /** 
     * APIMethod: removeControl
     * Remove a control from the map. Removes the control both from the map 
     *     object's internal array of controls, as well as from the map's 
     *     viewPort (assuming the control was not added outsideViewport)
     * 
     * Parameters:
     * control - {<OpenLayers.Control>} The control to remove.
     */    
    removeControl: function (control) {
        //make sure control is non-null and actually part of our map
        if ( (control) && (control == this.getControl(control.id)) ) {
            if (!control.outsideViewport) {
                this.viewPortDiv.removeChild(control.div)
            }
            OpenLayers.Util.removeItem(this.controls, control);
        }
    },

  /********************************************************/
  /*                                                      */
  /*                  Popup Functions                     */
  /*                                                      */
  /*     The following functions deal with adding and     */
  /*        removing Popups to and from the Map           */
  /*                                                      */
  /********************************************************/         

    /** 
     * APIMethod: addPopup
     * 
     * Parameters:
     * popup - {<OpenLayers.Popup>}
     * exclusive - {Boolean} If true, closes all other popups first
     */
    addPopup: function(popup, exclusive) {

        if (exclusive) {
            //remove all other popups from screen
            for(var i=0; i < this.popups.length; i++) {
                this.removePopup(this.popups[i]);
            }
        }

        popup.map = this;
        this.popups.push(popup);
        var popupDiv = popup.draw();
        if (popupDiv) {
            popupDiv.style.zIndex = this.Z_INDEX_BASE['Popup'] +
                                    this.popups.length;
            this.layerContainerDiv.appendChild(popupDiv);
        }
    },
    
    /** 
    * APIMethod: removePopup
    * 
    * Parameters:
    * popup - {<OpenLayers.Popup>}
    */
    removePopup: function(popup) {
        OpenLayers.Util.removeItem(this.popups, popup);
        if (popup.div) {
            try { this.layerContainerDiv.removeChild(popup.div); }
            catch (e) { } // Popups sometimes apparently get disconnected
                      // from the layerContainerDiv, and cause complaints.
        }
        popup.map = null;
    },

  /********************************************************/
  /*                                                      */
  /*              Container Div Functions                 */
  /*                                                      */
  /*   The following functions deal with the access to    */
  /*    and maintenance of the size of the container div  */
  /*                                                      */
  /********************************************************/     

    /**
     * APIMethod: getSize
     * 
     * Return:
     * {<OpenLayers.Size>} An <OpenLayers.Size> object that represents the 
     *                     size, in pixels, of the div into which OpenLayers 
     *                     has been loaded. 
     *                     Note - A clone() of this locally cached variable is
     *                     returned, so as not to allow users to modify it.
     */
    getSize: function () {
        var size = null;
        if (this.size != null) {
            size = this.size.clone();
        }
        return size;
    },

    /**
     * APIMethod: updateSize
     * This function should be called by any external code which dynamically
     *     changes the size of the map div (because mozilla wont let us catch 
     *     the "onresize" for an element)
     */
    updateSize: function() {
        // the div might have moved on the page, also
        this.events.element.offsets = null;
        var newSize = this.getCurrentSize();
        var oldSize = this.getSize();
        if (oldSize == null)
            this.size = oldSize = newSize;
        if (!newSize.equals(oldSize)) {
            
            // store the new size
            this.size = newSize;

            //notify layers of mapresize
            for(var i=0; i < this.layers.length; i++) {
                this.layers[i].onMapResize();                
            }

            if (this.baseLayer != null) {
                var center = new OpenLayers.Pixel(newSize.w /2, newSize.h / 2);
                var centerLL = this.getLonLatFromViewPortPx(center);
                var zoom = this.getZoom();
                this.zoom = null;
                this.setCenter(this.getCenter(), zoom);
            }

        }
    },
    
    /**
     * Method: getCurrentSize
     * 
     * Return:
     * {<OpenLayers.Size>} A new <OpenLayers.Size> object with the dimensions 
     *                     of the map div
     */
    getCurrentSize: function() {

        var size = new OpenLayers.Size(this.div.clientWidth, 
                                       this.div.clientHeight);

        // Workaround for the fact that hidden elements return 0 for size.
        if (size.w == 0 && size.h == 0 || isNaN(size.w) && isNaN(size.h)) {
            var dim = OpenLayers.Element.getDimensions(this.div);
            size.w = dim.width;
            size.h = dim.height;
        }
        if (size.w == 0 && size.h == 0 || isNaN(size.w) && isNaN(size.h)) {
            size.w = parseInt(this.div.style.width);
            size.h = parseInt(this.div.style.height);
        }
        return size;
    },

    /** 
     * Method: calculateBounds
     * 
     * Parameters:
     * center - {<OpenLayers.LonLat>} Default is this.getCenter()
     * resolution - {float} Default is this.getResolution() 
     * 
     * Return:
     * {<OpenLayers.Bounds>} A bounds based on resolution, center, and 
     *                       current mapsize.
     */
    calculateBounds: function(center, resolution) {

        var extent = null;
        
        if (center == null) {
            center = this.getCenter();
        }                
        if (resolution == null) {
            resolution = this.getResolution();
        }
    
        if ((center != null) && (resolution != null)) {

            var size = this.getSize();
            var w_deg = size.w * resolution;
            var h_deg = size.h * resolution;
        
            extent = new OpenLayers.Bounds(center.lon - w_deg / 2,
                                           center.lat - h_deg / 2,
                                           center.lon + w_deg / 2,
                                           center.lat + h_deg / 2);
        
        }

        return extent;
    },


  /********************************************************/
  /*                                                      */
  /*            Zoom, Center, Pan Functions               */
  /*                                                      */
  /*    The following functions handle the validation,    */
  /*   getting and setting of the Zoom Level and Center   */
  /*       as well as the panning of the Map              */
  /*                                                      */
  /********************************************************/
    /**
     * APIMethod: getCenter
     * 
     * Return:
     * {<OpenLayers.LonLat>}
     */
    getCenter: function () {
        return this.center;
    },


    /**
     * APIMethod: getZoom
     * 
     * Return:
     * {Integer}
     */
    getZoom: function () {
        return this.zoom;
    },
    
    /** 
     * APIMethod: pan
     * Allows user to pan by a value of screen pixels
     * 
     * Parameters:
     * dx - {Integer}
     * dy - {Integer}
     */
    pan: function(dx, dy) {

        // getCenter
        var centerPx = this.getViewPortPxFromLonLat(this.getCenter());

        // adjust
        var newCenterPx = centerPx.add(dx, dy);
        
        // only call setCenter if there has been a change
        if (!newCenterPx.equals(centerPx)) {
            var newCenterLonLat = this.getLonLatFromViewPortPx(newCenterPx);
            this.setCenter(newCenterLonLat);
        }

   },

    /**
     * APIMethod: setCenter
     * 
     * Parameters:
     * lonlat - {<OpenLayers.LonLat>}
     * zoom - {Integer}
     * dragging - {Boolean} Specifies whether or not to trigger 
     *                      movestart/end events
     * forceZoomChange - {Boolean} Specifies whether or not to trigger zoom 
     *                             change events (needed on baseLayer change)
     *
     * TBD: reconsider forceZoomChange in 3.0
     */
    setCenter: function (lonlat, zoom, dragging, forceZoomChange) {
        
        if (!this.center && !this.isValidLonLat(lonlat)) {
            lonlat = this.maxExtent.getCenterLonLat();
        }
        
        var zoomChanged = forceZoomChange || (
                            (this.isValidZoomLevel(zoom)) && 
                            (zoom != this.getZoom()) );

        var centerChanged = (this.isValidLonLat(lonlat)) && 
                            (!lonlat.equals(this.center));


        // if neither center nor zoom will change, no need to do anything
        if (zoomChanged || centerChanged || !dragging) {

            if (!dragging) { this.events.triggerEvent("movestart"); }

            if (centerChanged) {
                if ((!zoomChanged) && (this.center)) { 
                    // if zoom hasnt changed, just slide layerContainer
                    //  (must be done before setting this.center to new value)
                    this.centerLayerContainer(lonlat);
                }
                this.center = lonlat.clone();
            }

            // (re)set the layerContainerDiv's location
            if ((zoomChanged) || (this.layerContainerOrigin == null)) {
                this.layerContainerOrigin = this.center.clone();
                this.layerContainerDiv.style.left = "0px";
                this.layerContainerDiv.style.top  = "0px";
            }

            if (zoomChanged) {
                this.zoom = zoom;
                    
                //redraw popups
                for (var i = 0; i < this.popups.length; i++) {
                    this.popups[i].updatePosition();
                }

                // zoom level has changed, increment viewRequestID.
                this.viewRequestID++;
            }    
            
            var bounds = this.getExtent();
            
            //send the move call to the baselayer and all the overlays    
            this.baseLayer.moveTo(bounds, zoomChanged, dragging);
            for (var i = 0; i < this.layers.length; i++) {
                var layer = this.layers[i];
                if (!layer.isBaseLayer) {
                    
                    var moveLayer;
                    var inRange = layer.calculateInRange();
                    if (layer.inRange != inRange) {
                        // Layer property has changed. We are going 
                        // to call moveLayer so that the layer can be turned
                        // off or on.   
                        layer.inRange = inRange;
                        moveLayer = true;
                        this.events.triggerEvent("changelayer");
                    } else {
                        // If nothing has changed, then we only move the layer
                        // if it is visible and inrange.
                        moveLayer = (layer.visibility && layer.inRange);
                    }

                    if (moveLayer) {
                        layer.moveTo(bounds, zoomChanged, dragging);
                    }
                }                
            }
            
            this.events.triggerEvent("move");
    
            if (zoomChanged) { this.events.triggerEvent("zoomend"); }
        }

        // even if nothing was done, we want to notify of this
        if (!dragging) { this.events.triggerEvent("moveend"); }
    },

    /** 
     * Method: centerLayerContainer
     * This function takes care to recenter the layerContainerDiv.
     * 
     * Parameters:
     * lonlat - {<OpenLayers.LonLat>}
     */
    centerLayerContainer: function (lonlat) {

        var originPx = this.getViewPortPxFromLonLat(this.layerContainerOrigin);
        var newPx = this.getViewPortPxFromLonLat(lonlat);

        if ((originPx != null) && (newPx != null)) {
            this.layerContainerDiv.style.left = (originPx.x - newPx.x) + "px";
            this.layerContainerDiv.style.top  = (originPx.y - newPx.y) + "px";
        }
    },

    /**
     * Method: isValidZoomLevel
     * 
     * Parameters:
     * zoomLevel - {Integer}
     * 
     * Return:
     * {Boolean} Whether or not the zoom level passed in is non-null and 
     *           within the min/max range of zoom levels.
     */
    isValidZoomLevel: function(zoomLevel) {
       return ( (zoomLevel != null) &&
                (zoomLevel >= 0) && 
                (zoomLevel < this.getNumZoomLevels()) );
    },
    
    /**
     * Method: isValidLonLat
     * 
     * Parameters:
     * lonlat - {<OpenLayers.LonLat>}
     * 
     * Return:
     * {Boolean} Whether or not the lonlat passed in is non-null and within
     *           the maxExtent bounds
     */
    isValidLonLat: function(lonlat) {
        var valid = false;
        if (lonlat != null) {
            var maxExtent = this.getMaxExtent();
            valid = maxExtent.containsLonLat(lonlat);        
        }
        return valid;
    },

  /********************************************************/
  /*                                                      */
  /*                 Layer Options                        */
  /*                                                      */
  /*    Accessor functions to Layer Options parameters    */
  /*                                                      */
  /********************************************************/
    
    /**
     * APIMethod: getProjection
     * 
     * Return:
     * {String} The Projection of the base layer.
     */
    getProjection: function() {
        var projection = null;
        if (this.baseLayer != null) {
            projection = this.baseLayer.projection;
        }
        return projection;
    },
    
    /**
     * APIMethod: getMaxResolution
     * 
     * Return:
     * {String} The Map's Maximum Resolution
     */
    getMaxResolution: function() {
        var maxResolution = null;
        if (this.baseLayer != null) {
            maxResolution = this.baseLayer.maxResolution;
        }
        return maxResolution;
    },
        
    /**
     * APIMethod: getMaxExtent
     * 
     * Return:
     * {<OpenLayers.Bounds>}
     */
    getMaxExtent: function () {
        var maxExtent = null;
        if (this.baseLayer != null) {
            maxExtent = this.baseLayer.maxExtent;
        }        
        return maxExtent;
    },
    
    /**
     * APIMethod: getNumZoomLevels
     * 
     * Return:
     * {Integer} The total number of zoom levels that can be displayed by the 
     *           current baseLayer.
     */
    getNumZoomLevels: function() {
        var numZoomLevels = null;
        if (this.baseLayer != null) {
            numZoomLevels = this.baseLayer.numZoomLevels;
        }
        return numZoomLevels;
    },

  /********************************************************/
  /*                                                      */
  /*                 Baselayer Functions                  */
  /*                                                      */
  /*    The following functions, all publicly exposed     */
  /*       in the API?, are all merely wrappers to the    */
  /*       the same calls on whatever layer is set as     */
  /*                the current base layer                */
  /*                                                      */
  /********************************************************/

    /**
     * APIMethod: getExtent
     * 
     * Return:
     * {<OpenLayers.Bounds>} A Bounds object which represents the lon/lat 
     *                       bounds of the current viewPort. 
     *                       If no baselayer is set, returns null.
     */
    getExtent: function () {
        var extent = null;
        if (this.baseLayer != null) {
            extent = this.baseLayer.getExtent();
        }
        return extent;
    },

    /**
     * APIMethod: getResolution
     * 
     * Return:
     * {Float} The current resolution of the map. 
     *         If no baselayer is set, returns null.
     */
    getResolution: function () {
        var resolution = null;
        if (this.baseLayer != null) {
            resolution = this.baseLayer.getResolution();
        }
        return resolution;
    },

     /**
      * APIMethod: getScale
      * 
      * Return:
      * {Float} The current scale denominator of the map. 
      *         If no baselayer is set, returns null.
      */
    getScale: function () {
        var scale = null;
        if (this.baseLayer != null) {
            var res = this.getResolution();
            var units = this.baseLayer.units;
            scale = OpenLayers.Util.getScaleFromResolution(res, units);
        }
        return scale;
    },


    /**
     * APIMethod: getZoomForExteng
     * 
     * Parameters: 
     * bounds - {<OpenLayers.Bounds>}
     * 
     * Return:
     * {Integer} A suitable zoom level for the specified bounds.
     *           If no baselayer is set, returns null.
     */
    getZoomForExtent: function (bounds) {
        var zoom = null;
        if (this.baseLayer != null) {
            zoom = this.baseLayer.getZoomForExtent(bounds);
        }
        return zoom;
    },

    /**
     * APIMethod: getZoomForResolution
     * 
     * Parameter:
     * resolution - {Float}
     * 
     * Return:
     * {Integer} A suitable zoom level for the specified resolution.
     *           If no baselayer is set, returns null.
     */
    getZoomForResolution: function(resolution) {
        var zoom = null;
        if (this.baseLayer != null) {
            zoom = this.baseLayer.getZoomForResolution(resolution);
        }
        return zoom;
    },

  /********************************************************/
  /*                                                      */
  /*                  Zooming Functions                   */
  /*                                                      */
  /*    The following functions, all publicly exposed     */
  /*       in the API, are all merely wrappers to the     */
  /*               the setCenter() function               */
  /*                                                      */
  /********************************************************/
  
    /** 
     * APIMethod: zoomTo
     * Zoom to a specific zoom level
     * 
     * Parameters:
     * zoom - {Integer}
     */
    zoomTo: function(zoom) {
        if (this.isValidZoomLevel(zoom)) {
            this.setCenter(null, zoom);
        }
    },
    
    /**
     * APIMethod: zoomIn
     * 
     * Parameters:
     * zoom - {int}
     */
    zoomIn: function() {
        this.zoomTo(this.getZoom() + 1);
    },
    
    /**
     * APIMethod: zoomOut
     * 
     * Parameters:
     * zoom - {int}
     */
    zoomOut: function() {
        this.zoomTo(this.getZoom() - 1);
    },

    /**
     * APIMethod: zoomToExtent
     * Zoom to the passed in bounds, recenter
     * 
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     */
    zoomToExtent: function(bounds) {
        var center = bounds.getCenterLonLat();
        if (this.baseLayer.wrapDateLine) {
            var maxExtent = this.getMaxExtent();

            //fix straddling bounds (in the case of a bbox that straddles the 
            // dateline, it's left and right boundaries will appear backwards. 
            // we fix this by allowing a right value that is greater than the
            // max value at the dateline -- this allows us to pass a valid 
            // bounds to calculate zoom)
            //
            bounds = bounds.clone();
            while (bounds.right < bounds.left) {
                bounds.right += maxExtent.getWidth();
            }
            //if the bounds was straddling (see above), then the center point 
            // we got from it was wrong. So we take our new bounds and ask it
            // for the center. Because our new bounds is at least partially 
            // outside the bounds of maxExtent, the new calculated center 
            // might also be. We don't want to pass a bad center value to 
            // setCenter, so we have it wrap itself across the date line.
            //
            center = bounds.getCenterLonLat().wrapDateLine(maxExtent);
        }
        this.setCenter(center, this.getZoomForExtent(bounds));
    },

    /** 
     * APIMethod: zoomToMaxExtent
     * Zoom to the full extent and recenter.
     */
    zoomToMaxExtent: function() {
        this.zoomToExtent(this.getMaxExtent());
    },

    /** 
     * APIMethod: zoomToScale
     * Zoom to a specified scale 
     * 
     * Parameters:
     * scale - {float}
     */
    zoomToScale: function(scale) {
        var res = OpenLayers.Util.getResolutionFromScale(scale, 
                                                         this.baseLayer.units);
        var size = this.getSize();
        var w_deg = size.w * res;
        var h_deg = size.h * res;
        var center = this.getCenter();

        var extent = new OpenLayers.Bounds(center.lon - w_deg / 2,
                                           center.lat - h_deg / 2,
                                           center.lon + w_deg / 2,
                                           center.lat + h_deg / 2);
        this.zoomToExtent(extent);
    },
    
  /********************************************************/
  /*                                                      */
  /*             Translation Functions                    */
  /*                                                      */
  /*      The following functions translate between       */
  /*           LonLat, LayerPx, and ViewPortPx            */
  /*                                                      */
  /********************************************************/
      
  //
  // TRANSLATION: LonLat <-> ViewPortPx
  //

    /**
     * APIMethod: getLonLatFromViewPortPx
     * 
     * Parameters:
     * viewPortPx - {<OpenLayers.Pixel>}
     * 
     * Return:
     * {<OpenLayers.LonLat>} An OpenLayers.LonLat which is the passed-in view 
     *                       port <OpenLayers.Pixel>, translated into lon/lat
     *                       by the current base layer.
     */
    getLonLatFromViewPortPx: function (viewPortPx) {
        var lonlat = null; 
        if (this.baseLayer != null) {
            lonlat = this.baseLayer.getLonLatFromViewPortPx(viewPortPx);
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
     * {<OpenLayers.Pixel>} An OpenLayers.Pixel which is the passed-in 
     *                      <OpenLayers.LonLat>, translated into view port 
     *                      pixels by the current base layer.
     */
    getViewPortPxFromLonLat: function (lonlat) {
        var px = null; 
        if (this.baseLayer != null) {
            px = this.baseLayer.getViewPortPxFromLonLat(lonlat);
        }
        return px;
    },

    
  //
  // CONVENIENCE TRANSLATION FUNCTIONS FOR API
  //

    /**
     * APIMethod: getLonLatFromPixel
     * 
     * Parameters:
     * px - {<OpenLayers.Pixel>}
     *
     * Return:
     * {<OpenLayers.LonLat>} An OpenLayers.LonLat corresponding to the given
     *                       OpenLayers.Pixel, translated into lon/lat by the 
     *                       current base layer
     */
    getLonLatFromPixel: function (px) {
        return this.getLonLatFromViewPortPx(px);
    },

    /**
     * APIMethod: getPixelFromLonLat
     * 
     * Parameters:
     * lonlat - {<OpenLayers.LonLat>}
     * 
     * Return: 
     * {<OpenLayers.Pixel>} An OpenLayers.Pixel corresponding to the 
     *                      <OpenLayers.LonLat> translated into view port 
     *                      pixels by the current base layer.
     */
    getPixelFromLonLat: function (lonlat) {
        return this.getViewPortPxFromLonLat(lonlat);
    },



  //
  // TRANSLATION: ViewPortPx <-> LayerPx
  //

    /**
     * APIMethod: getViewPortPxFromLayerPx
     * 
     * Parameters:
     * layerPx - {<OpenLayers.Pixel>}
     * 
     * Return:
     * {<OpenLayers.Pixel>} Layer Pixel translated into ViewPort Pixel 
     *                      coordinates
     */
    getViewPortPxFromLayerPx:function(layerPx) {
        var viewPortPx = null;
        if (layerPx != null) {
            var dX = parseInt(this.layerContainerDiv.style.left);
            var dY = parseInt(this.layerContainerDiv.style.top);
            viewPortPx = layerPx.add(dX, dY);            
        }
        return viewPortPx;
    },
    
    /**
     * APIMethod: getLayerPxFromViewPortPx
     * 
     * Parameters:
     * viewPortPx - {<OpenLayers.Pixel>}
     * 
     * Return:
     * {<OpenLayers.Pixel>} ViewPort Pixel translated into Layer Pixel 
     *                      coordinates
     */
    getLayerPxFromViewPortPx:function(viewPortPx) {
        var layerPx = null;
        if (viewPortPx != null) {
            var dX = -parseInt(this.layerContainerDiv.style.left);
            var dY = -parseInt(this.layerContainerDiv.style.top);
            layerPx = viewPortPx.add(dX, dY);
            if (isNaN(layerPx.x) || isNaN(layerPx.y)) {
                layerPx = null;
            }
        }
        return layerPx;
    },
    
  //
  // TRANSLATION: LonLat <-> LayerPx
  //

    /**
     * APIMethod: getLonLatFromLayerPx
     * 
     * Parameters:
     * px - {<OpenLayers.Pixel>}
     *
     * Return:
     * {<OpenLayers.LonLat>}
     */
    getLonLatFromLayerPx: function (px) {
       //adjust for displacement of layerContainerDiv
       px = this.getViewPortPxFromLayerPx(px);
       return this.getLonLatFromViewPortPx(px);         
    },
    
    /**
     * APIMethod: getLayerPxFromLonLat
     * 
     * Parameters:
     * lonlat - {<OpenLayers.LonLat>} lonlat
     *
     * Return:
     * {<OpenLayers.Pixel>} An OpenLayers.Pixel which is the passed-in 
     *                      <OpenLayers.LonLat>, translated into layer pixels 
     *                      by the current base layer
     */
    getLayerPxFromLonLat: function (lonlat) {
       //adjust for displacement of layerContainerDiv
       var px = this.getViewPortPxFromLonLat(lonlat);
       return this.getLayerPxFromViewPortPx(px);         
    },


    /** @final @type String */
    CLASS_NAME: "OpenLayers.Map"
});

/**
 * Constant: TILE_WIDTH
 * {Integer} 256 Default tile width (unless otherwise specified)
 */
OpenLayers.Map.TILE_WIDTH = 256;
/**
 * Constant: TILE_HEIGHT
 * {Integer} 256 Default tile height (unless otherwise specified)
 */
OpenLayers.Map.TILE_HEIGHT = 256;
