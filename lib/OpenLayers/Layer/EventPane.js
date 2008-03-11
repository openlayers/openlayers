/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Layer.js
 * @requires OpenLayers/Util.js
 */

/**
 * Class: OpenLayers.Layer.EventPane
 * Base class for 3rd party layers.  Create a new event pane layer with the
 * <OpenLayers.Layer.EventPane> constructor.
 * 
 * Inherits from:
 *  - <OpenLayers.Layer>
 */
OpenLayers.Layer.EventPane = OpenLayers.Class(OpenLayers.Layer, {
    
    /**
     * APIProperty: smoothDragPan
     * {Boolean} smoothDragPan determines whether non-public/internal API
     *     methods are used for better performance while dragging EventPane 
     *     layers. When not in sphericalMercator mode, the smoother dragging 
     *     doesn't actually move north/south directly with the number of 
     *     pixels moved, resulting in a slight offset when you drag your mouse 
     *     north south with this option on. If this visual disparity bothers 
     *     you, you should turn this option off, or use spherical mercator. 
     *     Default is on.
     */
    smoothDragPan: true,

    /**
     * Property: isBaseLayer
     * {Boolean} EventPaned layers are always base layers, by necessity.
     */ 
    isBaseLayer: true,

    /**
     * APIProperty: isFixed
     * {Boolean} EventPaned layers are fixed by default.
     */ 
    isFixed: true,

    /**
     * Property: pane
     * {DOMElement} A reference to the element that controls the events.
     */
    pane: null,


    /**
     * Property: mapObject
     * {Object} This is the object which will be used to load the 3rd party library
     * in the case of the google layer, this will be of type GMap, 
     * in the case of the ve layer, this will be of type VEMap
     */ 
    mapObject: null,


    /**
     * Constructor: OpenLayers.Layer.EventPane
     * Create a new event pane layer
     *
     * Parameters:
     * name - {String}
     * options - {Object} Hashtable of extra options to tag onto the layer
     */
    initialize: function(name, options) {
        OpenLayers.Layer.prototype.initialize.apply(this, arguments);
        if (this.pane == null) {
            this.pane = OpenLayers.Util.createDiv(this.div.id + "_EventPane");
        }
    },
    
    /**
     * APIMethod: destroy
     * Deconstruct this layer.
     */
    destroy: function() {
        this.mapObject = null;
        OpenLayers.Layer.prototype.destroy.apply(this, arguments); 
    },

    
    /**
     * Method: setMap
     * Set the map property for the layer. This is done through an accessor
     * so that subclasses can override this and take special action once 
     * they have their map variable set. 
     *
     * Parameters:
     * map - {<OpenLayers.Map>}
     */
    setMap: function(map) {
        OpenLayers.Layer.prototype.setMap.apply(this, arguments);
        
        this.pane.style.zIndex = parseInt(this.div.style.zIndex) + 1;
        this.pane.style.display = this.div.style.display;
        this.pane.style.width="100%";
        this.pane.style.height="100%";
        if (OpenLayers.Util.getBrowserName() == "msie") {
            this.pane.style.background = 
                "url(" + OpenLayers.Util.getImagesLocation() + "blank.gif)";
        }

        if (this.isFixed) {
            this.map.viewPortDiv.appendChild(this.pane);
        } else {
            this.map.layerContainerDiv.appendChild(this.pane);
        }

        // once our layer has been added to the map, we can load it
        this.loadMapObject();
    
        // if map didn't load, display warning
        if (this.mapObject == null) {
            this.loadWarningMessage();
        }
    },

    /**
     * APIMethod: removeMap
     * On being removed from the map, we'll like to remove the invisible 'pane'
     *     div that we added to it on creation. 
     * 
     * Parameters:
     * map - {<OpenLayers.Map>}
     */
    removeMap: function(map) {
        if (this.pane && this.pane.parentNode) {
            this.pane.parentNode.removeChild(this.pane);
            this.pane = null;
        }
        OpenLayers.Layer.prototype.removeMap.apply(this, arguments);
    },
  
    /**
     * Method: loadWarningMessage
     * If we can't load the map lib, then display an error message to the 
     *     user and tell them where to go for help.
     * 
     *     This function sets up the layout for the warning message. Each 3rd
     *     party layer must implement its own getWarningHTML() function to 
     *     provide the actual warning message.
     */
    loadWarningMessage:function() {

        this.div.style.backgroundColor = "darkblue";

        var viewSize = this.map.getSize();
        
        var msgW = Math.min(viewSize.w, 300);
        var msgH = Math.min(viewSize.h, 200);
        var size = new OpenLayers.Size(msgW, msgH);

        var centerPx = new OpenLayers.Pixel(viewSize.w/2, viewSize.h/2);

        var topLeft = centerPx.add(-size.w/2, -size.h/2);            

        var div = OpenLayers.Util.createDiv(this.name + "_warning", 
                                            topLeft, 
                                            size,
                                            null,
                                            null,
                                            null,
                                            "auto");

        div.style.padding = "7px";
        div.style.backgroundColor = "yellow";

        div.innerHTML = this.getWarningHTML();
        this.div.appendChild(div);
    },
  
    /** 
     * Method: getWarningHTML
     * To be implemented by subclasses.
     * 
     * Returns:
     * {String} String with information on why layer is broken, how to get
     *          it working.
     */
    getWarningHTML:function() {
        //should be implemented by subclasses
        return "";
    },
  
    /**
     * Method: display
     * Set the display on the pane
     *
     * Parameters:
     * display - {Boolean}
     */
    display: function(display) {
        OpenLayers.Layer.prototype.display.apply(this, arguments);
        this.pane.style.display = this.div.style.display;
    },
  
    /**
     * Method: setZIndex
     * Set the z-index order for the pane.
     * 
     * Parameters:
     * zIndex - {int}
     */
    setZIndex: function (zIndex) {
        OpenLayers.Layer.prototype.setZIndex.apply(this, arguments);
        this.pane.style.zIndex = parseInt(this.div.style.zIndex) + 1;
    },

    /**
     * Method: moveTo
     * Handle calls to move the layer.
     * 
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     * zoomChanged - {Boolean}
     * dragging - {Boolean}
     */
    moveTo:function(bounds, zoomChanged, dragging) {
        OpenLayers.Layer.prototype.moveTo.apply(this, arguments);

        if (this.mapObject != null) {

            var newCenter = this.map.getCenter();
            var newZoom = this.map.getZoom();

            if (newCenter != null) {

                var moOldCenter = this.getMapObjectCenter();
                var oldCenter = this.getOLLonLatFromMapObjectLonLat(moOldCenter);

                var moOldZoom = this.getMapObjectZoom();
                var oldZoom= this.getOLZoomFromMapObjectZoom(moOldZoom);

                if ( !(newCenter.equals(oldCenter)) || 
                     !(newZoom == oldZoom) ) {

                    if (dragging && this.dragPanMapObject && 
                        this.smoothDragPan) {
                        var oldPx = this.map.getViewPortPxFromLonLat(oldCenter);
                        var newPx = this.map.getViewPortPxFromLonLat(newCenter);
                        this.dragPanMapObject(newPx.x-oldPx.x, oldPx.y-newPx.y);
                    } else {
                        var center = this.getMapObjectLonLatFromOLLonLat(newCenter);
                        var zoom = this.getMapObjectZoomFromOLZoom(newZoom);
                        this.setMapObjectCenter(center, zoom, dragging);
                    }
                }
            }
        }
    },


  /********************************************************/
  /*                                                      */
  /*                 Baselayer Functions                  */
  /*                                                      */
  /********************************************************/

    /**
     * Method: getLonLatFromViewPortPx
     * Get a map location from a pixel location
     * 
     * Parameters:
     * viewPortPx - {<OpenLayers.Pixel>}
     *
     * Returns:
     *  {<OpenLayers.LonLat>} An OpenLayers.LonLat which is the passed-in view
     *  port OpenLayers.Pixel, translated into lon/lat by map lib
     *  If the map lib is not loaded or not centered, returns null
     */
    getLonLatFromViewPortPx: function (viewPortPx) {
        var lonlat = null;
        if ( (this.mapObject != null) && 
             (this.getMapObjectCenter() != null) ) {
            var moPixel = this.getMapObjectPixelFromOLPixel(viewPortPx);
            var moLonLat = this.getMapObjectLonLatFromMapObjectPixel(moPixel);
            lonlat = this.getOLLonLatFromMapObjectLonLat(moLonLat);
        }
        return lonlat;
    },

 
    /**
     * Method: getViewPortPxFromLonLat
     * Get a pixel location from a map location
     *
     * Parameters:
     * lonlat - {<OpenLayers.LonLat>}
     *
     * Returns:
     * {<OpenLayers.Pixel>} An OpenLayers.Pixel which is the passed-in
     * OpenLayers.LonLat, translated into view port pixels by map lib
     * If map lib is not loaded or not centered, returns null
     */
    getViewPortPxFromLonLat: function (lonlat) {
        var viewPortPx = null;
        if ( (this.mapObject != null) && 
             (this.getMapObjectCenter() != null) ) {

            var moLonLat = this.getMapObjectLonLatFromOLLonLat(lonlat);
            var moPixel = this.getMapObjectPixelFromMapObjectLonLat(moLonLat);
        
            viewPortPx = this.getOLPixelFromMapObjectPixel(moPixel);
        }
        return viewPortPx;
    },

  /********************************************************/
  /*                                                      */
  /*               Translation Functions                  */
  /*                                                      */
  /*   The following functions translate Map Object and   */
  /*            OL formats for Pixel, LonLat              */
  /*                                                      */
  /********************************************************/

  //
  // TRANSLATION: MapObject LatLng <-> OpenLayers.LonLat
  //

    /**
     * Method: getOLLonLatFromMapObjectLonLat
     * Get an OL style map location from a 3rd party style map location
     *
     * Parameters
     * moLonLat - {Object}
     * 
     * Returns:
     * {<OpenLayers.LonLat>} An OpenLayers.LonLat, translated from the passed in 
     *          MapObject LonLat
     *          Returns null if null value is passed in
     */
    getOLLonLatFromMapObjectLonLat: function(moLonLat) {
        var olLonLat = null;
        if (moLonLat != null) {
            var lon = this.getLongitudeFromMapObjectLonLat(moLonLat);
            var lat = this.getLatitudeFromMapObjectLonLat(moLonLat);
            olLonLat = new OpenLayers.LonLat(lon, lat);
        }
        return olLonLat;
    },

    /**
     * Method: getMapObjectLonLatFromOLLonLat
     * Get a 3rd party map location from an OL map location.
     *
     * Parameters:
     * olLonLat - {<OpenLayers.LonLat>}
     * 
     * Returns:
     * {Object} A MapObject LonLat, translated from the passed in 
     *          OpenLayers.LonLat
     *          Returns null if null value is passed in
     */
    getMapObjectLonLatFromOLLonLat: function(olLonLat) {
        var moLatLng = null;
        if (olLonLat != null) {
            moLatLng = this.getMapObjectLonLatFromLonLat(olLonLat.lon,
                                                         olLonLat.lat);
        }
        return moLatLng;
    },


  //
  // TRANSLATION: MapObject Pixel <-> OpenLayers.Pixel
  //

    /**
     * Method: getOLPixelFromMapObjectPixel
     * Get an OL pixel location from a 3rd party pixel location.
     *
     * Parameters:
     * moPixel - {Object}
     * 
     * Returns:
     * {<OpenLayers.Pixel>} An OpenLayers.Pixel, translated from the passed in 
     *          MapObject Pixel
     *          Returns null if null value is passed in
     */
    getOLPixelFromMapObjectPixel: function(moPixel) {
        var olPixel = null;
        if (moPixel != null) {
            var x = this.getXFromMapObjectPixel(moPixel);
            var y = this.getYFromMapObjectPixel(moPixel);
            olPixel = new OpenLayers.Pixel(x, y);
        }
        return olPixel;
    },

    /**
     * Method: getMapObjectPixelFromOLPixel
     * Get a 3rd party pixel location from an OL pixel location
     *
     * Parameters:
     * olPixel - {<OpenLayers.Pixel>}
     * 
     * Returns:
     * {Object} A MapObject Pixel, translated from the passed in 
     *          OpenLayers.Pixel
     *          Returns null if null value is passed in
     */
    getMapObjectPixelFromOLPixel: function(olPixel) {
        var moPixel = null;
        if (olPixel != null) {
            moPixel = this.getMapObjectPixelFromXY(olPixel.x, olPixel.y);
        }
        return moPixel;
    },

    CLASS_NAME: "OpenLayers.Layer.EventPane"
});
