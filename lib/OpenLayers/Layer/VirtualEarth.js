/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @class
 * 
 * @requires OpenLayers/Layer/EventPane.js
 * @requires OpenLayers/Layer/FixedZoomLevels.js
 */
OpenLayers.Layer.VirtualEarth = OpenLayers.Class.create();
OpenLayers.Layer.VirtualEarth.prototype =
  OpenLayers.Class.inherit( OpenLayers.Layer.EventPane, 
                            OpenLayers.Layer.FixedZoomLevels, {
    
    /** @final @type int */
    MIN_ZOOM_LEVEL: 1,
    
    /** @final @type int */
    MAX_ZOOM_LEVEL: 17,

    /** Hardcode these resolutions so that they are more closely
     *   tied with the standard wms projection
     * 
     * @final @type Array(float) */
    RESOLUTIONS: [1.40625,0.703125,0.3515625,0.17578125,0.087890625,0.0439453125,0.02197265625,0.010986328125,0.0054931640625,0.00274658203125,0.001373291015625,0.0006866455078125,0.00034332275390625,0.000171661376953125,0.0000858306884765625,0.00004291534423828125],

    /** @type VEMapType */
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

        // create div and set to same size as map
        var veDiv = OpenLayers.Util.createDiv(this.name);
        var sz = this.map.getSize();
        veDiv.style.width = sz.w;
        veDiv.style.height = sz.h;
        this.div.appendChild(veDiv);

        try { // crash prevention
            this.mapObject = new VEMap(this.name);
        } catch (e) { }

        if (this.mapObject != null) {
            try { // this is to catch a Mozilla bug without falling apart
                this.mapObject.LoadMap(null, null, this.type);
            } catch (e) { }
            this.mapObject.HideDashboard();
        }
    },

    /** 
     * @return String with information on why layer is broken, how to get
     *          it working.
     * @type String
     */
    getWarningHTML:function() {

        var html = "";
        html += "The VE Layer was unable to load correctly.<br>";
        html += "<br>";
        html += "To get rid of this message, select a new BaseLayer "
        html += "in the layer switcher in the upper-right corner.<br>";
        html += "<br>";
        html += "Most likely, this is because the VE library";
        html += " script was either not correctly included.<br>";
        html += "<br>";
        html += "Developers: For help getting this working correctly, ";
        html += "<a href='http://trac.openlayers.org/wiki/VirtualEarth' "
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
        this.mapObject.SetCenterAndZoom(center, zoom); 
    },
   
    /**
     * @returns the mapObject's current center in Map Object format
     * @type Object
     */
    getMapObjectCenter: function() {
        return this.mapObject.GetCenter();
    },

    /** 
     * @returns the mapObject's current zoom, in Map Object format
     * @type int
     */
    getMapObjectZoom: function() {
        return this.mapObject.GetZoomLevel();
    },


  // LonLat - Pixel Translation
  
    /** 
     * @param {Object} moPixel MapObject Pixel format
     * 
     * @returns MapObject LonLat translated from MapObject Pixel
     * @type Object
     */
    getMapObjectLonLatFromMapObjectPixel: function(moPixel) {
        return this.mapObject.PixelToLatLong(moPixel.x, moPixel.y);
    },

    /** 
     * @param {Object} moPixel MapObject Pixel format
     * 
     * @returns MapObject Pixel translated from MapObject LonLat
     * @type Object
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
     * @param {Object} moLonLat MapObject LonLat format
     * 
     * @returns Longitude of the given MapObject LonLat
     * @type float
     */
    getLongitudeFromMapObjectLonLat: function(moLonLat) {
        return moLonLat.Longitude;
    },

    /**
     * @param {Object} moLonLat MapObject LonLat format
     * 
     * @returns Latitude of the given MapObject LonLat
     * @type float
     */
    getLatitudeFromMapObjectLonLat: function(moLonLat) {
        return moLonLat.Latitude;
    },

    /**
     * @param {int} lon float
     * @param {int} lat float
     * 
     * @returns MapObject LonLat built from lon and lat params
     * @type Object
     */
    getMapObjectLonLatFromLonLat: function(lon, lat) {
        return new VELatLong(lat, lon);
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
        return new Msn.VE.Pixel(x, y);
    },


    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.VirtualEarth"
});
