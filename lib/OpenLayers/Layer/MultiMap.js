/* Copyright (c) 2006-2007 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @requires OpenLayers/Layer/EventPane.js
 * @requires OpenLayers/Layer/FixedZoomLevels.js
 * 
 * Class: OpenLayers.Layer.MultiMap
 * 
 * Inherits:
 *  - <OpenLayers.Layers.EventPane>
 *  - <OpenLayers.Layers.FixedZoomLevels>
 */
OpenLayers.Layer.MultiMap = OpenLayers.Class(
  OpenLayers.Layer.EventPane, OpenLayers.Layer.FixedZoomLevels, {
    
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
    RESOLUTIONS: [9, 1.40625,0.703125,0.3515625,0.17578125,0.087890625,0.0439453125,0.02197265625,0.010986328125,0.0054931640625,0.00274658203125,0.001373291015625,0.0006866455078125,0.00034332275390625,0.000171661376953125,0.0000858306884765625,0.00004291534423828125],

    /**
     * APIProperty: type
     * {?}
     */
    type: null,

    /** 
     * Constructor: OpenLayers.Layer.MultiMap
     * 
     * Parameters:
     * name - {String}
     * options - {Object}
     */
    initialize: function(name, options) {
        OpenLayers.Layer.EventPane.prototype.initialize.apply(this, arguments);
        OpenLayers.Layer.FixedZoomLevels.prototype.initialize.apply(this, 
                                                                    arguments);
    },
    
    /**
     * Method: loadMapObject
     */
    loadMapObject:function() {
        try { //crash proofing
            this.mapObject = new MultimapViewer(this.div);
        } catch (e) { }
    },

    /** 
     * APIMethod: getWarningHTML
     * 
     * Return: 
     * {String} String with information on why layer is broken, how to get
     *          it working.
     */
    getWarningHTML:function() {

        var html = "";
        html += "The MM Layer was unable to load correctly.<br>";
        html += "<br>";
        html += "To get rid of this message, select a new BaseLayer "
        html += "in the layer switcher in the upper-right corner.<br>";
        html += "<br>";
        html += "Most likely, this is because the MM library";
        html += " script was either not correctly included.<br>";
        html += "<br>";
        html += "Demmlopers: For help getting this working correctly, ";
        html += "<a href='http://trac.openlayers.org/wiki/MultiMap' "
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

    /** 
     * APIMethod: setMapObjectCenter
     * Set the mapObject to the specified center and zoom
     * 
     * Parameters:
     * center - {Object} MapObject LonLat format
     * zoom - {int} MapObject zoom format
     */
    setMapObjectCenter: function(center, zoom) {
        this.mapObject.goToPosition(center, zoom); 
    },
   
    /**
     * APIMethod: getMapObjectCenter
     * 
     * Return: 
     * {Object} The mapObject's current center in Map Object format
     */
    getMapObjectCenter: function() {
        return this.mapObject.getCurrentPosition();
    },

    /** 
     * APIMethod: getMapObjectZoom
     * 
     * Return:
     * {Integer} The mapObject's current zoom, in Map Object format
     */
    getMapObjectZoom: function() {
        return this.mapObject.getZoomFactor();
    },


  // LonLat - Pixel Translation
  
    /**
     * APIMethod: getMapObjectLonLatFromMapObjectPixel
     * 
     * Parameters:
     * moPixel - {Object} MapObject Pixel format
     * 
     * Return:
     * {Object} MapObject LonLat translated from MapObject Pixel
     */
    getMapObjectLonLatFromMapObjectPixel: function(moPixel) {
        moPixel.x = moPixel.x - (this.map.getSize().w/2);
        moPixel.y = moPixel.y - (this.map.getSize().h/2);
        return this.mapObject.getMapPositionAt(moPixel);
    },

    /**
     * APIMethod: getMapObjectPixelFromMapObjectLonLat
     * 
     * Parameters:
     * moLonLat - {Object} MapObject LonLat format
     * 
     * Return:
     * {Object} MapObject Pixel transtlated from MapObject LonLat
     */
    getMapObjectPixelFromMapObjectLonLat: function(moLonLat) {
        return this.mapObject.geoPosToContainerPixels(moLonLat);
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
     * Return:
     * {Float} Longitude of the given MapObject LonLat
     */
    getLongitudeFromMapObjectLonLat: function(moLonLat) {
        return moLonLat.lon;
    },

    /**
     * APIMethod: getLatitudeFromMapObjectLonLat
     * 
     * Parameters:
     * moLonLat - {Object} MapObject LonLat format
     * 
     * Return:
     * {Float} Latitude of the given MapObject LonLat
     */
    getLatitudeFromMapObjectLonLat: function(moLonLat) {
        return moLonLat.lat;
    },

    /**
     * APIMethod: getMapObjectLonLatFromLonLat
     * 
     * Parameters:
     * lon - {Float}
     * lat - {Float}
     * 
     * Return:
     * {Object} MapObject LonLat built from lon and lat params
     */
    getMapObjectLonLatFromLonLat: function(lon, lat) {
        return new MMLatLon(lat, lon);
    },

  // Pixel
    
    /**
     * APIMethod: getXFromMapObjectPixel
     * 
     * Parameters:
     * moPixel - {Object} MapObject Pixel format
     * 
     * Return:
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
     * Return:
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
     * Return:
     * {Object} MapObject Pixel from x and y parameters
     */
    getMapObjectPixelFromXY: function(x, y) {
        return new MMPoint(x, y);
    },

    CLASS_NAME: "OpenLayers.Layer.MultiMap"
});
