/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @class
 * 
 * @requires OpenLayers/Layer/EventPane.js
 * @requires OpenLayers/Layer/FixedZoomLevels.js
 */
OpenLayers.Layer.Yahoo = OpenLayers.Class.create();
OpenLayers.Layer.Yahoo.prototype =
  OpenLayers.Class.inherit( OpenLayers.Layer.EventPane, 
                            OpenLayers.Layer.FixedZoomLevels, {
    
    /** @final @type int */
    MIN_ZOOM_LEVEL: 0,
    
    /** @final @type int */
    MAX_ZOOM_LEVEL: 15,

    /** Hardcode these resolutions so that they are more closely
     *   tied with the standard wms projection
     * 
     * @final @type Array(float) */
    RESOLUTIONS: [1.40625,0.703125,0.3515625,0.17578125,0.087890625,0.0439453125,0.02197265625,0.010986328125,0.0054931640625,0.00274658203125,0.001373291015625,0.0006866455078125,0.00034332275390625,0.000171661376953125,0.0000858306884765625,0.00004291534423828125],

    /** @type YahooMapType */
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
    },
    
    /**
     * 
     */
    loadMapObject:function() {
        try { //do not crash! 
            this.mapObject = new YMap(this.div, this.type);
        } catch(e) {}
    },
    
    
    /** Overridden from EventPane because we need to remove this yahoo event
     *   pane which prohibits our drag and drop, and we can only do this 
     *   once the map has been loaded and centered.
     * 
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {
        OpenLayers.Layer.EventPane.prototype.setMap.apply(this, arguments);

        this.map.events.register("moveend", this, this.fixYahooEventPane);
    },

    /** The map has been centered, so the mysterious yahoo eventpane has been
     *   added. we remove it so that it doesnt mess with *our* event pane.
     * 
     * @private
     */
    fixYahooEventPane: function() {
        var yahooEventPane = OpenLayers.Util.getElement("ygddfdiv");
        if (yahooEventPane != null) {
            if (yahooEventPane.parentNode != null)
                yahooEventPane.parentNode.removeChild(yahooEventPane);

            this.map.events.unregister("moveend", this, 
                                       this.fixYahooEventPane);
        }
    },

    /** 
     * @return String with information on why layer is broken, how to get
     *          it working.
     * @type String
     */
    getWarningHTML:function() {

        var html = "";
        html += "The Yahoo Layer was unable to load correctly.<br>";
        html += "<br>";
        html += "To get rid of this message, select a new BaseLayer "
        html += "in the layer switcher in the upper-right corner.<br>";
        html += "<br>";
        html += "Most likely, this is because the Yahoo library";
        html += " script was either not correctly included.<br>";
        html += "<br>";
        html += "Developers: For help getting this working correctly, ";
        html += "<a href='http://trac.openlayers.org/wiki/Yahoo' "
        html +=  "target='_blank'>";
        html +=     "click here";
        html += "</a>";

        return html;
    },

  /********************************************************/
  /*                                                      */
  /*             Translation Functions                    */
  /*                                                      */
  /*    The following functions translate GMaps and OL    */ 
  /*     formats for Pixel, LonLat, Bounds, and Zoom      */
  /*                                                      */
  /********************************************************/


  //
  // TRANSLATION: MapObject Zoom <-> OpenLayers Zoom
  //
  
    /**
     * @param {int} gZoom
     * 
     * @returns An OpenLayers Zoom level, translated from the passed in gZoom
     *          Returns null if null value is passed in
     * @type int
     */
    getOLZoomFromMapObjectZoom: function(moZoom) {
        var zoom = null;
        if (moZoom != null) {
            zoom = OpenLayers.Layer.FixedZoomLevels.prototype.getOLZoomFromMapObjectZoom.apply(this, [moZoom]);
            zoom = 18 - zoom;
        }
        return zoom;
    },
    
    /**
     * @param {int} olZoom
     * 
     * @returns A MapObject level, translated from the passed in olZoom
     *          Returns null if null value is passed in
     * @type int
     */
    getMapObjectZoomFromOLZoom: function(olZoom) {
        var zoom = null; 
        if (olZoom != null) {
            zoom = OpenLayers.Layer.FixedZoomLevels.prototype.getMapObjectZoomFromOLZoom.apply(this, [olZoom]);
            zoom = 18 - zoom;
        }
        return zoom;
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
        this.mapObject.drawZoomAndCenter(center, zoom); 
    },
   
    /**
     * @returns the mapObject's current center in Map Object format
     * @type Object
     */
    getMapObjectCenter: function() {
        return this.mapObject.getCenterLatLon();
    },

    /** 
     * @returns the mapObject's current zoom, in Map Object format
     * @type int
     */
    getMapObjectZoom: function() {
        return this.mapObject.getZoomLevel();
    },


  // LonLat - Pixel Translation
  
    /** 
     * @param {Object} moPixel MapObject Pixel format
     * 
     * @returns MapObject LonLat translated from MapObject Pixel
     * @type Object
     */
    getMapObjectLonLatFromMapObjectPixel: function(moPixel) {
        return this.mapObject.convertXYLatLon(moPixel);
    },

    /** 
     * @param {Object} moPixel MapObject Pixel format
     * 
     * @returns MapObject Pixel translated from MapObject LonLat
     * @type Object
     */
    getMapObjectPixelFromMapObjectLonLat: function(moLonLat) {
        return this.mapObject.convertLatLonXY(moLonLat);
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
        return moLonLat.Lon;
    },

    /**
     * @param {Object} moLonLat MapObject LonLat format
     * 
     * @returns Latitude of the given MapObject LonLat
     * @type float
     */
    getLatitudeFromMapObjectLonLat: function(moLonLat) {
        return moLonLat.Lat;
    },

    /**
     * @param {int} lon float
     * @param {int} lat float
     * 
     * @returns MapObject LonLat built from lon and lat params
     * @type Object
     */
    getMapObjectLonLatFromLonLat: function(lon, lat) {
        return new YGeoPoint(lat, lon);
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
        return new YCoordPoint(x, y);
    },


    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.Yahoo"
});
