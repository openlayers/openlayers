/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

/**
 * @class
 * 
 * @requires OpenLayers/Layer/EventPane.js
 * @requires OpenLayers/Layer/FixedZoomLevels.js
 */
OpenLayers.Layer.Google = OpenLayers.Class.create();
OpenLayers.Layer.Google.prototype =
  OpenLayers.Class.inherit( OpenLayers.Layer.EventPane, 
                            OpenLayers.Layer.FixedZoomLevels, {
    
    /** @final @type int */
    MIN_ZOOM_LEVEL: 0,
    
    /** @final @type int */
    MAX_ZOOM_LEVEL: 17,

    /** Hardcode these resolutions so that they are more closely
     *   tied with the standard wms projection
     * 
     * @final @type Array(float) */
    RESOLUTIONS: [1.40625,0.703125,0.3515625,0.17578125,0.087890625,0.0439453125,0.02197265625,0.010986328125,0.0054931640625,0.00274658203125,0.001373291015625,0.0006866455078125,0.00034332275390625,0.000171661376953125,0.0000858306884765625,0.00004291534423828125],

    /** @type GMapType */
    type: null,

    /** 
     * @constructor
     * 
     * @param {String} name
     */
    initialize: function(name, options) {
        OpenLayers.Layer.EventPane.prototype.initialize.apply(this, arguments);
        OpenLayers.Layer.FixedZoomLevels.prototype.initialize.apply(this, 
                                                                    arguments);
        this.addContainerPxFunction();
    },
    
    /** Load the GMap and register appropriate event listeners. If we can't 
     *   load GMap2, then display a warning message.
     * 
     * @private
     */
    loadMapObject:function() {
        
        //has gmaps library has been loaded?
        try {
            // create GMap, hide nav controls
            this.mapObject = new GMap2( this.div );

            // move the ToS and branding stuff up to the pane
            // thanks a *mil* Erik for thinking of this
            var poweredBy = this.div.lastChild;
            this.div.removeChild(poweredBy);
            this.pane.appendChild(poweredBy);
            poweredBy.className = "olLayerGooglePoweredBy gmnoprint";
            poweredBy.style.left = "";
            poweredBy.style.bottom = "";

            var termsOfUse = this.div.lastChild;
            this.div.removeChild(termsOfUse);
            this.pane.appendChild(termsOfUse);
            termsOfUse.className = "olLayerGoogleCopyright";
            termsOfUse.style.right = "";
            termsOfUse.style.bottom = "";

        } catch (e) {
            // do not crash
        }
               
    },

    /** Overridden from EventPane because if a map type has been specified, 
     *   we need to attach a listener for the first moveend -- this is how 
     *   we will know that the map has been centered. Only once the map has 
     *   been centered is it safe to change the gmap object's map type. 
     * 
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {
        OpenLayers.Layer.EventPane.prototype.setMap.apply(this, arguments);

        if (this.type != null) {
            this.map.events.register("moveend", this, this.setMapType);
        }
    },
    
    /** The map has been centered, and a map type was specified, so we 
     *   set the map type on the gmap object, then unregister the listener
     *   so that we dont keep doing this every time the map moves.
     * 
     * @private
     */
    setMapType: function() {
        if (this.mapObject.getCenter() != null) {
            this.mapObject.setMapType(this.type);
            this.map.events.unregister("moveend", this, this.setMapType);
        }
    },

    /**
     * @param {Event} evt
     */
    onMapResize: function() {
        this.mapObject.checkResize();  
    },


    /**
     * @param {OpenLayers.Bounds} bounds
     *
     * @returns Corresponding zoom level for a specified Bounds. 
     *          If mapObject is not loaded or not centered, returns null
     * @type int
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
     * @param {Object} moBounds
     * 
     * @returns An OpenLayers.Bounds, translated from the passed-in
     *          MapObject Bounds
     *          Returns null if null value is passed in
     * @type OpenLayers.Bounds
     */
    getOLBoundsFromMapObjectBounds: function(moBounds) {
        var olBounds = null;
        if (moBounds != null) {
            var sw = moBounds.getSouthWest();
            var ne = moBounds.getNorthEast();
            olBounds = new OpenLayers.Bounds(sw.lng(), 
                                             sw.lat(), 
                                             ne.lng(), 
                                             ne.lat() );
        }
        return olBounds;
    },

    /**
     * @param {OpenLayers.Bounds} olBounds
     * 
     * @returns A MapObject Bounds, translated from olBounds
     *          Returns null if null value is passed in
     * @type Object
     */
    getMapObjectBoundsFromOLBounds: function(olBounds) {
        var moBounds = null;
        if (olBounds != null) {
            var sw = new GLatLng(olBounds.bottom, olBounds.left);
            var ne = new GLatLng(olBounds.top, olBounds.right);
            moBounds = new GLatLngBounds(sw, ne);
        }
        return moBounds;
    },
    




    /** Hack-on function because GMAPS does not give it to us
     * 
     * @param {GLatLng} gLatLng 
     *
     * @returns A GPoint specifying gLatLng translated into "Container" coords
     * @type GPoint
     */
    addContainerPxFunction: function() {
        if (typeof GMap2 != "undefined" && !GMap2.fromLatLngToContainerPixel) {
          
            GMap2.prototype.fromLatLngToContainerPixel = function(gLatLng) {
          
                // first we translate into "DivPixel"
                    var gPoint = this.fromLatLngToDivPixel(gLatLng);
      
                    // locate the sliding "Div" div
                //  it seems like "b" is the main div
                    var div = this.b.firstChild.firstChild;
      
                    // adjust by the offset of "Div" and voila!
                gPoint.x += div.offsetLeft;
                gPoint.y += div.offsetTop;
    
                return gPoint;
            };
        }
    },

    /** 
     * @return String with information on why layer is broken, how to get
     *          it working.
     * @type String
     */
    getWarningHTML:function() {

        var html = "";
        html += "The Google Layer was unable to load correctly.<br>";
        html += "<br>";
        html += "To get rid of this message, select a new BaseLayer "
        html += "in the layer switcher in the upper-right corner.<br>";
        html += "<br>";
        html += "Most likely, this is because the Google Maps library";
        html += " script was either not included, or does not contain the";
        html += " correct API key for your site.<br>";
        html += "<br>";
        html += "Developers: For help getting this working correctly, ";
        html += "<a href='http://trac.openlayers.org/wiki/Google' "
        html +=  "target='_blank'>";
        html +=     "click here";
        html += "</a>";
        
        return html;
    },


    /************************************
     *                                  *
     *   MapObject Interface Controls   *
     *                                  *
     ************************************/


  // Get&Set Center, Zoom

    /** Set the mapObject to the specified center and zoom
     * 
     * @param {Object} center MapObject LonLat format
     * @param {int} zoom MapObject zoom format
     */
    setMapObjectCenter: function(center, zoom) {
        this.mapObject.setCenter(center, zoom); 
    },
   
    /**
     * @returns the mapObject's current center in Map Object format
     * @type Object
     */
    getMapObjectCenter: function() {
        return this.mapObject.getCenter();
    },

    /** 
     * @returns the mapObject's current zoom, in Map Object format
     * @type int
     */
    getMapObjectZoom: function() {
        return this.mapObject.getZoom();
    },


  // LonLat - Pixel Translation
  
    /** 
     * @param {Object} moPixel MapObject Pixel format
     * 
     * @returns MapObject LonLat translated from MapObject Pixel
     * @type Object
     */
    getMapObjectLonLatFromMapObjectPixel: function(moPixel) {
        return this.mapObject.fromContainerPixelToLatLng(moPixel);
    },

    /** 
     * @param {Object} moPixel MapObject Pixel format
     * 
     * @returns MapObject Pixel translated from MapObject LonLat
     * @type Object
     */
    getMapObjectPixelFromMapObjectLonLat: function(moLonLat) {
        return this.mapObject.fromLatLngToContainerPixel(moLonLat);
    },

  
  // Bounds
  
    /** 
     * @param {Object} moBounds MapObject Bounds format
     * 
     * @returns MapObject Zoom for specified MapObject Bounds
     * @type Object
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
     * @param {Object} moLonLat MapObject LonLat format
     * 
     * @returns Longitude of the given MapObject LonLat
     * @type float
     */
    getLongitudeFromMapObjectLonLat: function(moLonLat) {
        return moLonLat.lng();  
    },

    /**
     * @param {Object} moLonLat MapObject LonLat format
     * 
     * @returns Latitude of the given MapObject LonLat
     * @type float
     */
    getLatitudeFromMapObjectLonLat: function(moLonLat) {
        return moLonLat.lat();  
    },
    
    /**
     * @param {int} lon float
     * @param {int} lat float
     * 
     * @returns MapObject LonLat built from lon and lat params
     * @type Object
     */
    getMapObjectLonLatFromLonLat: function(lon, lat) {
        return new GLatLng(lat, lon);
    },

  // Pixel
    
    /** 
     * @param {Object} moPixel MapObject Pixel format
     * 
     * @returns X value of the MapObject Pixel
     * @type int
     */
    getXFromMapObjectPixel: function(moPixel) {
        return moPixel.x;
    },

    /** 
     * @param {Object} moPixel MapObject Pixel format
     * 
     * @returns Y value of the MapObject Pixel
     * @type int
     */
    getYFromMapObjectPixel: function(moPixel) {
        return moPixel.y;
    },

    /** 
     * @param {int} x
     * @param {int} y
     * 
     * @returns MapObject Pixel from x and y parameters
     * @type Object
     */
    getMapObjectPixelFromXY: function(x, y) {
        return new GPoint(x, y);
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.Google"
});
