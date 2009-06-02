/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Layer/SphericalMercator.js
 * @requires OpenLayers/Layer/EventPane.js
 * @requires OpenLayers/Layer/FixedZoomLevels.js
 * @requires OpenLayers/Console.js
 */

/**
 * Class: OpenLayers.Layer.Google
 * 
 * Inherits from:
 *  - <OpenLayers.Layer.SphericalMercator>
 *  - <OpenLayers.Layer.EventPane>
 *  - <OpenLayers.Layer.FixedZoomLevels>
 */
OpenLayers.Layer.Google = OpenLayers.Class(
    OpenLayers.Layer.EventPane, 
    OpenLayers.Layer.FixedZoomLevels, {
    
    /** 
     * Constant: MIN_ZOOM_LEVEL
     * {Integer} 0 
     */
    MIN_ZOOM_LEVEL: 0,
    
    /** 
     * Constant: MAX_ZOOM_LEVEL
     * {Integer} 19
     */
    MAX_ZOOM_LEVEL: 19,

    /** 
     * Constant: RESOLUTIONS
     * {Array(Float)} Hardcode these resolutions so that they are more closely
     *                tied with the standard wms projection
     */
    RESOLUTIONS: [
        1.40625, 
        0.703125, 
        0.3515625, 
        0.17578125, 
        0.087890625, 
        0.0439453125,
        0.02197265625, 
        0.010986328125, 
        0.0054931640625, 
        0.00274658203125,
        0.001373291015625, 
        0.0006866455078125, 
        0.00034332275390625,
        0.000171661376953125, 
        0.0000858306884765625, 
        0.00004291534423828125,
        0.00002145767211914062, 
        0.00001072883605957031,
        0.00000536441802978515, 
        0.00000268220901489257
    ],

    /**
     * APIProperty: type
     * {GMapType}
     */
    type: null,

    /**
     * APIProperty: sphericalMercator
     * {Boolean} Should the map act as a mercator-projected map? This will
     *     cause all interactions with the map to be in the actual map 
     *     projection, which allows support for vector drawing, overlaying 
     *     other maps, etc. 
     */
    sphericalMercator: false, 
    
    /**
     * Property: dragObject
     * {GDraggableObject} Since 2.93, Google has exposed the ability to get
     *     the maps GDraggableObject. We can now use this for smooth panning
     */
    dragObject: null, 

    /**
     * Property: termsOfUse
     * {DOMElement} Div for Google's copyright and terms of use link
     */
    termsOfUse: null, 

    /**
     * Property: poweredBy
     * {DOMElement} Div for Google's powered by logo and link
     */
    poweredBy: null, 

    /** 
     * Constructor: OpenLayers.Layer.Google
     * 
     * Parameters:
     * name - {String} A name for the layer.
     * options - {Object} An optional object whose properties will be set
     *     on the layer.
     */
    initialize: function(name, options) {
        OpenLayers.Layer.EventPane.prototype.initialize.apply(this, arguments);
        OpenLayers.Layer.FixedZoomLevels.prototype.initialize.apply(this, 
                                                                    arguments);
        this.addContainerPxFunction();
        if (this.sphericalMercator) {
            OpenLayers.Util.extend(this, OpenLayers.Layer.SphericalMercator);
            this.initMercatorParameters();
        }    
    },
    
    /** 
     * Method: loadMapObject
     * Load the GMap and register appropriate event listeners. If we can't 
     *     load GMap2, then display a warning message.
     */
    loadMapObject:function() {
        
        //has gmaps library has been loaded?
        try {
            // create GMap, hide nav controls
            this.mapObject = new GMap2( this.div );
            
            //since v 2.93 getDragObject is now available.
            if(typeof this.mapObject.getDragObject == "function") {
                this.dragObject = this.mapObject.getDragObject();
            } else {
                this.dragPanMapObject = null;
            }

            // move the ToS and branding stuff up to the container div
            this.termsOfUse = this.div.lastChild;
            this.div.removeChild(this.termsOfUse);
            if (this.isFixed) {
                this.map.viewPortDiv.appendChild(this.termsOfUse);
            } else {
                this.map.layerContainerDiv.appendChild(this.termsOfUse);
            }
            this.termsOfUse.style.zIndex = "1100";
            this.termsOfUse.style.display = this.div.style.display;
            this.termsOfUse.style.right = "";
            this.termsOfUse.style.bottom = "";
            this.termsOfUse.className = "olLayerGoogleCopyright";

            this.poweredBy = this.div.lastChild;
            this.div.removeChild(this.poweredBy);
            if (this.isFixed) {
                this.map.viewPortDiv.appendChild(this.poweredBy);
            } else {
                this.map.layerContainerDiv.appendChild(this.poweredBy);
            }
            this.poweredBy.style.zIndex = "1100";
            this.poweredBy.style.display = this.div.style.display;
            this.poweredBy.style.right = "";
            this.poweredBy.style.bottom = "";
            this.poweredBy.className = "olLayerGooglePoweredBy gmnoprint"; 

        } catch (e) {
            OpenLayers.Console.error(e);
        }
               
    },

    /** 
     * APIMethod: setMap
     * Overridden from EventPane because if a map type has been specified, 
     *     we need to attach a listener for the first moveend -- this is how 
     *     we will know that the map has been centered. Only once the map has 
     *     been centered is it safe to change the gmap object's map type. 
     * 
     * Parameters:
     * map - {<OpenLayers.Map>}
     */
    setMap: function(map) {
        OpenLayers.Layer.EventPane.prototype.setMap.apply(this, arguments);

        if (this.type != null) {
            this.map.events.register("moveend", this, this.setMapType);
        }
    },
    
    /** 
     * Method: setMapType
     * The map has been centered, and a map type was specified, so we 
     *     set the map type on the gmap object, then unregister the listener
     *     so that we dont keep doing this every time the map moves.
     */
    setMapType: function() {
        if (this.mapObject.getCenter() != null) {
            
            // Support for custom map types.
            if (OpenLayers.Util.indexOf(this.mapObject.getMapTypes(),
                                        this.type) == -1) {
                this.mapObject.addMapType(this.type);
            }    

            this.mapObject.setMapType(this.type);
            this.map.events.unregister("moveend", this, this.setMapType);
        }
    },

    /**
     * APIMethod: onMapResize
     * 
     * Parameters:
     * evt - {Event}
     */
    onMapResize: function() {
        // workaround for resizing of invisible or not yet fully loaded layers
        // where GMap2.checkResize() does not work. We need to load the GMap
        // for the old div size, then checkResize(), and then call
        // layer.moveTo() to trigger GMap.setCenter() (which will finish
        // the GMap initialization).
        if(this.visibility && this.mapObject.isLoaded()) {
            this.mapObject.checkResize();
        } else {
            if(!this._resized) {
                var layer = this;
                var handle = GEvent.addListener(this.mapObject, "load", function() {
                    GEvent.removeListener(handle);
                    delete layer._resized;
                    layer.mapObject.checkResize();
                    layer.moveTo(layer.map.getCenter(), layer.map.getZoom());
                })
            }
            this._resized = true;
        }
    },

    /**
     * Method: display
     * Hide or show the layer
     *
     * Parameters:
     * display - {Boolean}
     */
    display: function(display) {
        OpenLayers.Layer.EventPane.prototype.display.apply(this, arguments);
        this.termsOfUse.style.display = this.div.style.display;
        this.poweredBy.style.display = this.div.style.display;
    },

    /**
     * APIMethod: removeMap
     * On being removed from the map, also remove termsOfUse and poweredBy divs
     * 
     * Parameters:
     * map - {<OpenLayers.Map>}
     */
    removeMap: function(map) {
        if (this.termsOfUse && this.termsOfUse.parentNode) {
            this.termsOfUse.parentNode.removeChild(this.termsOfUse);
            this.termsOfUse = null;
        }
        if (this.poweredBy && this.poweredBy.parentNode) {
            this.poweredBy.parentNode.removeChild(this.poweredBy);
            this.poweredBy = null;
        }
        OpenLayers.Layer.EventPane.prototype.removeMap.apply(this, arguments);
    },
    
    /**
     * APIMethod: getZoomForExtent
     * 
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     *  
     * Returns:
     * {Integer} Corresponding zoom level for a specified Bounds. 
     *           If mapObject is not loaded or not centered, returns null
     *
    getZoomForExtent: function (bounds) {
        var zoom = null;
        if (this.mapObject != null) {
            var moBounds = this.getMapObjectBoundsFromOLBounds(bounds);
            var moZoom = this.getMapObjectZoomFromMapObjectBounds(moBounds);

            //make sure zoom is within bounds    
            var moZoom = Math.min(Math.max(moZoom, this.minZoomLevel), 
                                 this.maxZoomLevel);

            zoom = this.getOLZoomFromMapObjectZoom(moZoom);
        }
        return zoom;
    },
    
    */
    
  //
  // TRANSLATION: MapObject Bounds <-> OpenLayers.Bounds
  //

    /**
     * APIMethod: getOLBoundsFromMapObjectBounds
     * 
     * Parameters:
     * moBounds - {Object}
     * 
     * Returns:
     * {<OpenLayers.Bounds>} An <OpenLayers.Bounds>, translated from the 
     *                       passed-in MapObject Bounds.
     *                       Returns null if null value is passed in.
     */
    getOLBoundsFromMapObjectBounds: function(moBounds) {
        var olBounds = null;
        if (moBounds != null) {
            var sw = moBounds.getSouthWest();
            var ne = moBounds.getNorthEast();
            if (this.sphericalMercator) {
                sw = this.forwardMercator(sw.lng(), sw.lat());
                ne = this.forwardMercator(ne.lng(), ne.lat());
            } else {
                sw = new OpenLayers.LonLat(sw.lng(), sw.lat()); 
                ne = new OpenLayers.LonLat(ne.lng(), ne.lat()); 
            }    
            olBounds = new OpenLayers.Bounds(sw.lon, 
                                             sw.lat, 
                                             ne.lon, 
                                             ne.lat );
        }
        return olBounds;
    },

    /**
     * APIMethod: getMapObjectBoundsFromOLBounds
     * 
     * Parameters:
     * olBounds - {<OpenLayers.Bounds>}
     * 
     * Returns:
     * {Object} A MapObject Bounds, translated from olBounds
     *          Returns null if null value is passed in
     */
    getMapObjectBoundsFromOLBounds: function(olBounds) {
        var moBounds = null;
        if (olBounds != null) {
            var sw = this.sphericalMercator ? 
              this.inverseMercator(olBounds.bottom, olBounds.left) : 
              new OpenLayers.LonLat(olBounds.bottom, olBounds.left);
            var ne = this.sphericalMercator ? 
              this.inverseMercator(olBounds.top, olBounds.right) : 
              new OpenLayers.LonLat(olBounds.top, olBounds.right);
            moBounds = new GLatLngBounds(new GLatLng(sw.lat, sw.lon),
                                         new GLatLng(ne.lat, ne.lon));
        }
        return moBounds;
    },

    /** 
     * Method: addContainerPxFunction
     * Hack-on function because GMAPS does not give it to us
     * 
     * Parameters: 
     * gLatLng - {GLatLng}
     * 
     * Returns:
     * {GPoint} A GPoint specifying gLatLng translated into "Container" coords
     */
    addContainerPxFunction: function() {
        if ( (typeof GMap2 != "undefined") && 
             !GMap2.prototype.fromLatLngToContainerPixel) {
          
            GMap2.prototype.fromLatLngToContainerPixel = function(gLatLng) {
          
                // first we translate into "DivPixel"
                var gPoint = this.fromLatLngToDivPixel(gLatLng);
      
                // locate the sliding "Div" div
                var div = this.getContainer().firstChild.firstChild;
  
                // adjust by the offset of "Div" and voila!
                gPoint.x += div.offsetLeft;
                gPoint.y += div.offsetTop;
    
                return gPoint;
            };
        }
    },

    /** 
     * APIMethod: getWarningHTML
     * 
     * Returns: 
     * {String} String with information on why layer is broken, how to get
     *          it working.
     */
    getWarningHTML:function() {
        return OpenLayers.i18n("googleWarning");
    },


    /************************************
     *                                  *
     *   MapObject Interface Controls   *
     *                                  *
     ************************************/


  // Get&Set Center, Zoom

    /** 
     * APIMethod: setMapObjectCenter
     * Set the mapObject to the specified center and zoom
     * 
     * Parameters:
     * center - {Object} MapObject LonLat format
     * zoom - {int} MapObject zoom format
     */
    setMapObjectCenter: function(center, zoom) {
        this.mapObject.setCenter(center, zoom); 
    },
   
    /**
     * APIMethod: dragPanMapObject
     * 
     * Parameters:
     * dX - {Integer}
     * dY - {Integer}
     */
    dragPanMapObject: function(dX, dY) {
        this.dragObject.moveBy(new GSize(-dX, dY));
    },

    /**
     * APIMethod: getMapObjectCenter
     * 
     * Returns: 
     * {Object} The mapObject's current center in Map Object format
     */
    getMapObjectCenter: function() {
        return this.mapObject.getCenter();
    },

    /** 
     * APIMethod: getMapObjectZoom
     * 
     * Returns:
     * {Integer} The mapObject's current zoom, in Map Object format
     */
    getMapObjectZoom: function() {
        return this.mapObject.getZoom();
    },


  // LonLat - Pixel Translation
  
    /**
     * APIMethod: getMapObjectLonLatFromMapObjectPixel
     * 
     * Parameters:
     * moPixel - {Object} MapObject Pixel format
     * 
     * Returns:
     * {Object} MapObject LonLat translated from MapObject Pixel
     */
    getMapObjectLonLatFromMapObjectPixel: function(moPixel) {
        return this.mapObject.fromContainerPixelToLatLng(moPixel);
    },

    /**
     * APIMethod: getMapObjectPixelFromMapObjectLonLat
     * 
     * Parameters:
     * moLonLat - {Object} MapObject LonLat format
     * 
     * Returns:
     * {Object} MapObject Pixel transtlated from MapObject LonLat
     */
    getMapObjectPixelFromMapObjectLonLat: function(moLonLat) {
        return this.mapObject.fromLatLngToContainerPixel(moLonLat);
    },

  
  // Bounds
  
    /** 
     * APIMethod: getMapObjectZoomFromMapObjectBounds
     * 
     * Parameters:
     * moBounds - {Object} MapObject Bounds format
     * 
     * Returns:
     * {Object} MapObject Zoom for specified MapObject Bounds
     */
    getMapObjectZoomFromMapObjectBounds: function(moBounds) {
        return this.mapObject.getBoundsZoomLevel(moBounds);
    },

    /************************************
     *                                  *
     *       MapObject Primitives       *
     *                                  *
     ************************************/


  // LonLat
    
    /**
     * APIMethod: getLongitudeFromMapObjectLonLat
     * 
     * Parameters:
     * moLonLat - {Object} MapObject LonLat format
     * 
     * Returns:
     * {Float} Longitude of the given MapObject LonLat
     */
    getLongitudeFromMapObjectLonLat: function(moLonLat) {
        return this.sphericalMercator ? 
          this.forwardMercator(moLonLat.lng(), moLonLat.lat()).lon :
          moLonLat.lng();  
    },

    /**
     * APIMethod: getLatitudeFromMapObjectLonLat
     * 
     * Parameters:
     * moLonLat - {Object} MapObject LonLat format
     * 
     * Returns:
     * {Float} Latitude of the given MapObject LonLat
     */
    getLatitudeFromMapObjectLonLat: function(moLonLat) {
        var lat = this.sphericalMercator ? 
          this.forwardMercator(moLonLat.lng(), moLonLat.lat()).lat :
          moLonLat.lat(); 
        return lat;  
    },
    
    /**
     * APIMethod: getMapObjectLonLatFromLonLat
     * 
     * Parameters:
     * lon - {Float}
     * lat - {Float}
     * 
     * Returns:
     * {Object} MapObject LonLat built from lon and lat params
     */
    getMapObjectLonLatFromLonLat: function(lon, lat) {
        var gLatLng;
        if(this.sphericalMercator) {
            var lonlat = this.inverseMercator(lon, lat);
            gLatLng = new GLatLng(lonlat.lat, lonlat.lon);
        } else {
            gLatLng = new GLatLng(lat, lon);
        }
        return gLatLng;
    },

  // Pixel
    
    /**
     * APIMethod: getXFromMapObjectPixel
     * 
     * Parameters:
     * moPixel - {Object} MapObject Pixel format
     * 
     * Returns:
     * {Integer} X value of the MapObject Pixel
     */
    getXFromMapObjectPixel: function(moPixel) {
        return moPixel.x;
    },

    /**
     * APIMethod: getYFromMapObjectPixel
     * 
     * Parameters:
     * moPixel - {Object} MapObject Pixel format
     * 
     * Returns:
     * {Integer} Y value of the MapObject Pixel
     */
    getYFromMapObjectPixel: function(moPixel) {
        return moPixel.y;
    },

    /**
     * APIMethod: getMapObjectPixelFromXY
     * 
     * Parameters:
     * x - {Integer}
     * y - {Integer}
     * 
     * Returns:
     * {Object} MapObject Pixel from x and y parameters
     */
    getMapObjectPixelFromXY: function(x, y) {
        return new GPoint(x, y);
    },

    CLASS_NAME: "OpenLayers.Layer.Google"
});
