/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Layer/Google.js
 */

/**
 * Constant: OpenLayers.Layer.Google.v2
 * 
 * Mixin providing functionality specific to the Google Maps API v2.
 */
OpenLayers.Layer.Google.v2 = {
    
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
     * Property: dragObject
     * {GDraggableObject} Since 2.93, Google has exposed the ability to get
     *     the maps GDraggableObject. We can now use this for smooth panning
     */
    dragObject: null, 
    
    /** 
     * Method: loadMapObject
     * Load the GMap and register appropriate event listeners. If we can't 
     *     load GMap2, then display a warning message.
     */
    loadMapObject:function() {
        if (!this.type) {
            this.type = G_NORMAL_MAP;
        }
        var mapObject, termsOfUse, poweredBy;
        var cache = OpenLayers.Layer.Google.cache[this.map.id];
        if (cache) {
            // there are already Google layers added to this map
            mapObject = cache.mapObject;
            termsOfUse = cache.termsOfUse;
            poweredBy = cache.poweredBy;
            // increment the layer count
            ++cache.count;
        } else {
            // this is the first Google layer for this map

            var container = this.map.viewPortDiv;
            var div = document.createElement("div");
            div.id = this.map.id + "_GMap2Container";
            div.style.position = "absolute";
            div.style.width = "100%";
            div.style.height = "100%";
            container.appendChild(div);

            // create GMap and shuffle elements
            try {
                mapObject = new GMap2(div);
                
                // move the ToS and branding stuff up to the container div
                termsOfUse = div.lastChild;
                container.appendChild(termsOfUse);
                termsOfUse.style.zIndex = "1100";
                termsOfUse.style.right = "";
                termsOfUse.style.bottom = "";
                termsOfUse.className = "olLayerGoogleCopyright";

                poweredBy = div.lastChild;
                container.appendChild(poweredBy);
                poweredBy.style.zIndex = "1100";
                poweredBy.style.right = "";
                poweredBy.style.bottom = "";
                poweredBy.className = "olLayerGooglePoweredBy gmnoprint";
                
            } catch (e) {
                throw(e);
                return;
            }
            // cache elements for use by any other google layers added to
            // this same map
            OpenLayers.Layer.Google.cache[this.map.id] = {
                mapObject: mapObject,
                termsOfUse: termsOfUse,
                poweredBy: poweredBy,
                count: 1
            };
        }

        this.mapObject = mapObject;
        this.termsOfUse = termsOfUse;
        this.poweredBy = poweredBy;
        
        // ensure this layer type is one of the mapObject types
        if (OpenLayers.Util.indexOf(this.mapObject.getMapTypes(),
                                    this.type) === -1) {
            this.mapObject.addMapType(this.type);
        }

        //since v 2.93 getDragObject is now available.
        if(typeof mapObject.getDragObject == "function") {
            this.dragObject = mapObject.getDragObject();
        } else {
            this.dragPanMapObject = null;
        }
        
        if(this.isBaseLayer === false) {
            this.setGMapVisibility(this.div.style.display !== "none");
        }

    },

    /**
     * APIMethod: onMapResize
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
                });
            }
            this._resized = true;
        }
    },

    /**
     * Method: setGMapVisibility
     * Display the GMap container and associated elements.
     * 
     * Parameters:
     * visible - {Boolean} Display the GMap elements.
     */
    setGMapVisibility: function(visible) {
        var cache = OpenLayers.Layer.Google.cache[this.map.id];
        if (cache) {
            var container = this.mapObject.getContainer();
            if (visible === true) {
                this.mapObject.setMapType(this.type);
                container.style.display = "";
                this.termsOfUse.style.left = "";
                this.termsOfUse.style.display = "";
                this.poweredBy.style.display = "";            
                cache.displayed = this.id;
            } else {
                if (cache.displayed === this.id) {
                    delete cache.displayed;
                }
                if (!cache.displayed) {
                    container.style.display = "none";
                    this.termsOfUse.style.display = "none";
                    // move ToU far to the left in addition to setting display
                    // to "none", because at the end of the GMap2 load
                    // sequence, display: none will be unset and ToU would be
                    // visible after loading a map with a google layer that is
                    // initially hidden. 
                    this.termsOfUse.style.left = "-9999px";
                    this.poweredBy.style.display = "none";
                }
            }
        }
    },
    
    /**
     * Method: getMapContainer
     * 
     * Returns:
     * {DOMElement} the GMap container's div
     */
    getMapContainer: function() {
        return this.mapObject.getContainer();
    },

  //
  // TRANSLATION: MapObject Bounds <-> OpenLayers.Bounds
  //

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
    }
    
};
