/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */


/**
 * @requires OpenLayers/Layer/Google.js
 */

/**
 * Constant: OpenLayers.Layer.Google.v3
 * 
 * Mixin providing functionality specific to the Google Maps API v3.
 * 
 * To use this layer, you must include the GMaps v3 API in your html.
 * 
 * Note that this layer configures the google.maps.map object with the
 * "disableDefaultUI" option set to true. Using UI controls that the Google
 * Maps API provides is not supported by the OpenLayers API.
 */
OpenLayers.Layer.Google.v3 = {
    
    /**
     * Constant: DEFAULTS
     * {Object} It is not recommended to change the properties set here. Note
     * that Google.v3 layers only work when sphericalMercator is set to true.
     * 
     * (code)
     * {
     *     sphericalMercator: true,
     *     projection: "EPSG:900913"
     * }
     * (end)
     */
    DEFAULTS: {
        sphericalMercator: true,
        projection: "EPSG:900913"
    },

    /**
     * APIProperty: animationEnabled
     * {Boolean} If set to true, the transition between zoom levels will be
     *     animated (if supported by the GMaps API for the device used). Set to
     *     false to match the zooming experience of other layer types. Default
     *     is true. Note that the GMaps API does not give us control over zoom
     *     animation, so if set to false, when zooming, this will make the
     *     layer temporarily invisible, wait until GMaps reports the map being
     *     idle, and make it visible again. The result will be a blank layer
     *     for a few moments while zooming.
     */
    animationEnabled: true, 

    /** 
     * Method: loadMapObject
     * Load the GMap and register appropriate event listeners.
     */
    loadMapObject: function() {
        if (!this.type) {
            this.type = google.maps.MapTypeId.ROADMAP;
        }
        var mapObject;
        var cache = OpenLayers.Layer.Google.cache[this.map.id];
        if (cache) {
            // there are already Google layers added to this map
            mapObject = cache.mapObject;
            // increment the layer count
            ++cache.count;
        } else {
            // this is the first Google layer for this map
            // create GMap
            var center = this.map.getCenter();
            var container = document.createElement('div');
            container.className = "olForeignContainer";
            container.style.width = '100%';
            container.style.height = '100%';
            mapObject = new google.maps.Map(container, {
                center: center ?
                    new google.maps.LatLng(center.lat, center.lon) :
                    new google.maps.LatLng(0, 0),
                zoom: this.map.getZoom() || 0,
                mapTypeId: this.type,
                disableDefaultUI: true,
                keyboardShortcuts: false,
                draggable: false,
                disableDoubleClickZoom: true,
                scrollwheel: false,
                streetViewControl: false
            });
            var googleControl = document.createElement('div');
            googleControl.style.width = '100%';
            googleControl.style.height = '100%';
            mapObject.controls[google.maps.ControlPosition.TOP_LEFT].push(googleControl);
            
            // cache elements for use by any other google layers added to
            // this same map
            cache = {
                googleControl: googleControl,
                mapObject: mapObject,
                count: 1
            };
            OpenLayers.Layer.Google.cache[this.map.id] = cache;
        }
        this.mapObject = mapObject;
        this.setGMapVisibility(this.visibility);
    },
    
    /**
     * APIMethod: onMapResize
     */
    onMapResize: function() {
        if (this.visibility) {
            google.maps.event.trigger(this.mapObject, "resize");
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
        var map = this.map;
        if (cache) {
            var type = this.type;
            var layers = map.layers;
            var layer;
            for (var i=layers.length-1; i>=0; --i) {
                layer = layers[i];
                if (layer instanceof OpenLayers.Layer.Google &&
                            layer.visibility === true && layer.inRange === true) {
                    type = layer.type;
                    visible = true;
                    break;
                }
            }
            var container = this.mapObject.getDiv();
            if (visible === true) {
                if (container.parentNode !== map.div) {
                    if (!cache.rendered) {
                        var me = this;
                        google.maps.event.addListenerOnce(this.mapObject, 'tilesloaded', function() {
                            cache.rendered = true;
                            me.setGMapVisibility(me.getVisibility());
                            me.moveTo(me.map.getCenter());
                        });
                    } else {
                        map.div.appendChild(container);
                        cache.googleControl.appendChild(map.viewPortDiv);
                        google.maps.event.trigger(this.mapObject, 'resize');
                    }
                }
                this.mapObject.setMapTypeId(type);                
            } else if (cache.googleControl.hasChildNodes()) {
                map.div.appendChild(map.viewPortDiv);
                map.div.removeChild(container);
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
        return this.mapObject.getDiv();
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
            moBounds = new google.maps.LatLngBounds(
                new google.maps.LatLng(sw.lat, sw.lon),
                new google.maps.LatLng(ne.lat, ne.lon)
            );
        }
        return moBounds;
    },


    /************************************
     *                                  *
     *   MapObject Interface Controls   *
     *                                  *
     ************************************/


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
        var size = this.map.getSize();
        var lon = this.getLongitudeFromMapObjectLonLat(this.mapObject.center);
        var lat = this.getLatitudeFromMapObjectLonLat(this.mapObject.center);
        var res = this.map.getResolution();

        var delta_x = moPixel.x - (size.w / 2);
        var delta_y = moPixel.y - (size.h / 2);
    
        var lonlat = new OpenLayers.LonLat(
            lon + delta_x * res,
            lat - delta_y * res
        ); 

        if (this.wrapDateLine) {
            lonlat = lonlat.wrapDateLine(this.maxExtent);
        }
        return this.getMapObjectLonLatFromLonLat(lonlat.lon, lonlat.lat);
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
        var lon = this.getLongitudeFromMapObjectLonLat(moLonLat);
        var lat = this.getLatitudeFromMapObjectLonLat(moLonLat);
        var res = this.map.getResolution();
        var extent = this.map.getExtent();
        return this.getMapObjectPixelFromXY((1/res * (lon - extent.left)),
                                            (1/res * (extent.top - lat)));
    },

  
    /** 
     * APIMethod: setMapObjectCenter
     * Set the mapObject to the specified center and zoom
     * 
     * Parameters:
     * center - {Object} MapObject LonLat format
     * zoom - {int} MapObject zoom format
     */
    setMapObjectCenter: function(center, zoom) {
        if (this.animationEnabled === false && zoom != this.mapObject.zoom) {
            var mapContainer = this.getMapContainer();
            google.maps.event.addListenerOnce(
                this.mapObject, 
                "idle", 
                function() {
                    mapContainer.style.visibility = "";
                }
            );
            mapContainer.style.visibility = "hidden";
        }
        this.mapObject.setOptions({
            center: center,
            zoom: zoom
        });
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
            gLatLng = new google.maps.LatLng(lonlat.lat, lonlat.lon);
        } else {
            gLatLng = new google.maps.LatLng(lat, lon);
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
        return new google.maps.Point(x, y);
    }
    
};
