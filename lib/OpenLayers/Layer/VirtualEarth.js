/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Layer/EventPane.js
 * @requires OpenLayers/Layer/FixedZoomLevels.js
 */

/**
 * Class: OpenLayers.Layer.VirtualEarth
 * 
 * Inherits from:
 *  - <OpenLayers.Layer.EventPane>
 *  - <OpenLayers.Layer.FixedZoomLevels>
 */
OpenLayers.Layer.VirtualEarth = OpenLayers.Class(
    OpenLayers.Layer.EventPane,
    OpenLayers.Layer.FixedZoomLevels, {
    
    /** 
     * Constant: MIN_ZOOM_LEVEL
     * {Integer} 1 
     */
    MIN_ZOOM_LEVEL: 1,
    
    /** 
     * Constant: MAX_ZOOM_LEVEL
     * {Integer} 17
     */
    MAX_ZOOM_LEVEL: 17,

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
        0.00002145767211914062
    ],

    /**
     * APIProperty: type
     * {VEMapType}
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
     * Constructor: OpenLayers.Layer.VirtualEarth
     * 
     * Parameters:
     * name - {String}
     * options - {Object}
     */
    initialize: function(name, options) {
        OpenLayers.Layer.EventPane.prototype.initialize.apply(this, arguments);
        OpenLayers.Layer.FixedZoomLevels.prototype.initialize.apply(this, 
                                                                    arguments);
        if(this.sphericalMercator) {
            OpenLayers.Util.extend(this, OpenLayers.Layer.SphericalMercator);
            this.initMercatorParameters();
        }
    },
    
    /**
     * Method: loadMapObject
     */
    loadMapObject:function() {

        // create div and set to same size as map
        var veDiv = OpenLayers.Util.createDiv(this.name);
        var sz = this.map.getSize();
        veDiv.style.width = sz.w + "px";
        veDiv.style.height = sz.h + "px";
        this.div.appendChild(veDiv);

        try { // crash prevention
            this.mapObject = new VEMap(this.name);
        } catch (e) { }

        if (this.mapObject != null) {
            try { // this is to catch a Mozilla bug without falling apart

                // The fourth argument is whether the map is 'fixed' -- not 
                // draggable. See: 
                // http://blogs.msdn.com/virtualearth/archive/2007/09/28/locking-a-virtual-earth-map.aspx
                //
                this.mapObject.LoadMap(null, null, this.type, true);
                this.mapObject.AttachEvent("onmousedown", function() {return true; });

            } catch (e) { }
            this.mapObject.HideDashboard();
        }

        //can we do smooth panning? this is an unpublished method, so we need 
        // to be careful
        if ( !this.mapObject ||
             !this.mapObject.vemapcontrol ||
             !this.mapObject.vemapcontrol.PanMap ||
             (typeof this.mapObject.vemapcontrol.PanMap != "function")) {

            this.dragPanMapObject = null;
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
        return OpenLayers.i18n(
            "getLayerWarning", {'layerType':'VE', 'layerLib':'VirtualEarth'}
        );
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
        this.mapObject.SetCenterAndZoom(center, zoom); 
    },
   
    /**
     * APIMethod: getMapObjectCenter
     * 
     * Returns: 
     * {Object} The mapObject's current center in Map Object format
     */
    getMapObjectCenter: function() {
        return this.mapObject.GetCenter();
    },

    /**
     * APIMethod: dragPanMapObject
     * 
     * Parameters:
     * dX - {Integer}
     * dY - {Integer}
     */
    dragPanMapObject: function(dX, dY) {
        this.mapObject.vemapcontrol.PanMap(dX, -dY);
    },

    /** 
     * APIMethod: getMapObjectZoom
     * 
     * Returns:
     * {Integer} The mapObject's current zoom, in Map Object format
     */
    getMapObjectZoom: function() {
        return this.mapObject.GetZoomLevel();
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
        //the conditional here is to test if we are running the v6 of VE
        return (typeof VEPixel != 'undefined') 
            ? this.mapObject.PixelToLatLong(moPixel)
            : this.mapObject.PixelToLatLong(moPixel.x, moPixel.y);
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
        return this.mapObject.LatLongToPixel(moLonLat);
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
            this.forwardMercator(moLonLat.Longitude, moLonLat.Latitude).lon :
            moLonLat.Longitude;
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
        return this.sphericalMercator ? 
            this.forwardMercator(moLonLat.Longitude, moLonLat.Latitude).lat :
            moLonLat.Latitude;
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
        var veLatLong;
        if(this.sphericalMercator) {
            var lonlat = this.inverseMercator(lon, lat);
            veLatLong = new VELatLong(lonlat.lat, lonlat.lon);
        } else {
            veLatLong = new VELatLong(lat, lon);
        }
        return veLatLong;
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
        //the conditional here is to test if we are running the v6 of VE
        return (typeof VEPixel != 'undefined') ? new VEPixel(x, y)
                         : new Msn.VE.Pixel(x, y);
    },

    CLASS_NAME: "OpenLayers.Layer.VirtualEarth"
});
