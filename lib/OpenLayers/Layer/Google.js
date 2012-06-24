/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */


/**
 * @requires OpenLayers/Layer/SphericalMercator.js
 * @requires OpenLayers/Layer/EventPane.js
 * @requires OpenLayers/Layer/FixedZoomLevels.js
 * @requires OpenLayers/Lang.js
 */

/**
 * Class: OpenLayers.Layer.Google
 * 
 * Provides a wrapper for Google's Maps API
 * Normally the Terms of Use for this API do not allow wrapping, but Google
 * have provided written consent to OpenLayers for this - see email in 
 * http://osgeo-org.1560.n6.nabble.com/Google-Maps-API-Terms-of-Use-changes-tp4910013p4911981.html
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
     * {Integer} 21
     */
    MAX_ZOOM_LEVEL: 21,

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
        0.00000268220901489257,
        0.0000013411045074462891,
        0.00000067055225372314453
    ],

    /**
     * APIProperty: type
     * {GMapType}
     */
    type: null,

    /**
     * APIProperty: wrapDateLine
     * {Boolean} Allow user to pan forever east/west.  Default is true.  
     *     Setting this to false only restricts panning if 
     *     <sphericalMercator> is true. 
     */
    wrapDateLine: true,

    /**
     * APIProperty: sphericalMercator
     * {Boolean} Should the map act as a mercator-projected map? This will
     *     cause all interactions with the map to be in the actual map 
     *     projection, which allows support for vector drawing, overlaying 
     *     other maps, etc. 
     */
    sphericalMercator: false, 
    
    /**
     * Property: version
     * {Number} The version of the Google Maps API
     */
    version: null,

    /** 
     * Constructor: OpenLayers.Layer.Google
     * 
     * Parameters:
     * name - {String} A name for the layer.
     * options - {Object} An optional object whose properties will be set
     *     on the layer.
     */
    initialize: function(name, options) {
        options = options || {};
        if(!options.version) {
            options.version = typeof GMap2 === "function" ? "2" : "3";
        }
        var mixin = OpenLayers.Layer.Google["v" +
            options.version.replace(/\./g, "_")];
        if (mixin) {
            OpenLayers.Util.applyDefaults(options, mixin);
        } else {
            throw "Unsupported Google Maps API version: " + options.version;
        }

        OpenLayers.Util.applyDefaults(options, mixin.DEFAULTS);
        if (options.maxExtent) {
            options.maxExtent = options.maxExtent.clone();
        }

        OpenLayers.Layer.EventPane.prototype.initialize.apply(this,
            [name, options]);
        OpenLayers.Layer.FixedZoomLevels.prototype.initialize.apply(this, 
            [name, options]);

        if (this.sphericalMercator) {
            OpenLayers.Util.extend(this, OpenLayers.Layer.SphericalMercator);
            this.initMercatorParameters();
        }    
    },

    /**
     * Method: clone
     * Create a clone of this layer
     *
     * Returns:
     * {<OpenLayers.Layer.Google>} An exact clone of this layer
     */
    clone: function() {
        /**
         * This method isn't intended to be called by a subclass and it
         * doesn't call the same method on the superclass.  We don't call
         * the super's clone because we don't want properties that are set
         * on this layer after initialize (i.e. this.mapObject etc.).
         */
        return new OpenLayers.Layer.Google(
            this.name, this.getOptions()
        );
    },

    /**
     * APIMethod: setVisibility
     * Set the visibility flag for the layer and hide/show & redraw 
     *     accordingly. Fire event unless otherwise specified
     * 
     * Note that visibility is no longer simply whether or not the layer's
     *     style.display is set to "block". Now we store a 'visibility' state 
     *     property on the layer class, this allows us to remember whether or 
     *     not we *desire* for a layer to be visible. In the case where the 
     *     map's resolution is out of the layer's range, this desire may be 
     *     subverted.
     * 
     * Parameters:
     * visible - {Boolean} Display the layer (if in range)
     */
    setVisibility: function(visible) {
        // sharing a map container, opacity has to be set per layer
        var opacity = this.opacity == null ? 1 : this.opacity;
        OpenLayers.Layer.EventPane.prototype.setVisibility.apply(this, arguments);
        this.setOpacity(opacity);
    },
    
    /** 
     * APIMethod: display
     * Hide or show the Layer
     * 
     * Parameters:
     * visible - {Boolean}
     */
    display: function(visible) {
        if (!this._dragging) {
            this.setGMapVisibility(visible);
        }
        OpenLayers.Layer.EventPane.prototype.display.apply(this, arguments);
    },
    
    /**
     * Method: moveTo
     * 
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     * zoomChanged - {Boolean} Tells when zoom has changed, as layers have to
     *     do some init work in that case.
     * dragging - {Boolean}
     */
    moveTo: function(bounds, zoomChanged, dragging) {
        this._dragging = dragging;
        OpenLayers.Layer.EventPane.prototype.moveTo.apply(this, arguments);
        delete this._dragging;
    },
    
    /**
     * APIMethod: setOpacity
     * Sets the opacity for the entire layer (all images)
     * 
     * Parameters:
     * opacity - {Float}
     */
    setOpacity: function(opacity) {
        if (opacity !== this.opacity) {
            if (this.map != null) {
                this.map.events.triggerEvent("changelayer", {
                    layer: this,
                    property: "opacity"
                });
            }
            this.opacity = opacity;
        }
        // Though this layer's opacity may not change, we're sharing a container
        // and need to update the opacity for the entire container.
        if (this.getVisibility()) {
            var container = this.getMapContainer();
            OpenLayers.Util.modifyDOMElement(
                container, null, null, null, null, null, null, opacity
            );
        }
    },

    /**
     * APIMethod: destroy
     * Clean up this layer.
     */
    destroy: function() {
        /**
         * We have to override this method because the event pane destroy
         * deletes the mapObject reference before removing this layer from
         * the map.
         */
        if (this.map) {
            this.setGMapVisibility(false);
            var cache = OpenLayers.Layer.Google.cache[this.map.id];
            if (cache && cache.count <= 1) {
                this.removeGMapElements();
            }            
        }
        OpenLayers.Layer.EventPane.prototype.destroy.apply(this, arguments);
    },
    
    /**
     * Method: removeGMapElements
     * Remove all elements added to the dom.  This should only be called if
     * this is the last of the Google layers for the given map.
     */
    removeGMapElements: function() {
        var cache = OpenLayers.Layer.Google.cache[this.map.id];
        if (cache) {
            // remove shared elements from dom
            var container = this.mapObject && this.getMapContainer();                
            if (container && container.parentNode) {
                container.parentNode.removeChild(container);
            }
            var termsOfUse = cache.termsOfUse;
            if (termsOfUse && termsOfUse.parentNode) {
                termsOfUse.parentNode.removeChild(termsOfUse);
            }
            var poweredBy = cache.poweredBy;
            if (poweredBy && poweredBy.parentNode) {
                poweredBy.parentNode.removeChild(poweredBy);
            }
        }
    },

    /**
     * APIMethod: removeMap
     * On being removed from the map, also remove termsOfUse and poweredBy divs
     * 
     * Parameters:
     * map - {<OpenLayers.Map>}
     */
    removeMap: function(map) {
        // hide layer before removing
        if (this.visibility && this.mapObject) {
            this.setGMapVisibility(false);
        }
        // check to see if last Google layer in this map
        var cache = OpenLayers.Layer.Google.cache[map.id];
        if (cache) {
            if (cache.count <= 1) {
                this.removeGMapElements();
                delete OpenLayers.Layer.Google.cache[map.id];
            } else {
                // decrement the layer count
                --cache.count;
            }
        }
        // remove references to gmap elements
        delete this.termsOfUse;
        delete this.poweredBy;
        delete this.mapObject;
        delete this.dragObject;
        OpenLayers.Layer.EventPane.prototype.removeMap.apply(this, arguments);
    },
    
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
    
    CLASS_NAME: "OpenLayers.Layer.Google"
});

/**
 * Property: OpenLayers.Layer.Google.cache
 * {Object} Cache for elements that should only be created once per map.
 */
OpenLayers.Layer.Google.cache = {};


/**
 * Constant: OpenLayers.Layer.Google.v2
 * 
 * Mixin providing functionality specific to the Google Maps API v2.
 * 
 * This API has been deprecated by Google.
 * Developers are encouraged to migrate to v3 of the API; support for this
 * is provided by <OpenLayers.Layer.Google.v3>
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
