/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

/**
 * @class 
 * 
 * @requires OpenLayers/Layer/EventPane.js
 */
OpenLayers.Layer.Yahoo = Class.create();
OpenLayers.Layer.Yahoo.prototype = 
  Object.extend( new OpenLayers.Layer.EventPane(), {

    /** @type YMap */
    yahoomap: null,
    
    /** @type int */
    minZoomLevel: 0,

    /** @type int */
    maxZoomLevel: 15,
    
    /**
     * @constructor
     * 
     * @param {String} name
     */
    initialize:function(name) {
        OpenLayers.Layer.EventPane.prototype.initialize.apply(this, arguments);

        this.numZoomLevels = this.maxZoomLevel - this.minZoomLevel + 1;
    },

    /** 
     * @param {OpenLayers.Map} map
     */
    setMap:function(map) {
        OpenLayers.Layer.EventPane.prototype.setMap.apply(this, arguments);

        // once our layer has been added to the map, we can load the yahoomap
        this.loadYMap();
    },

    /** 
     * @param {OpenLayers.Bounds} bounds
     * @param {Boolean} zoomChanged
     * @param {Boolean} dragging
     */
    moveTo:function(bounds, zoomChanged, dragging) {

        if (this.yahoomap != null) {
            var olCenter = this.map.getCenter();
            var mmCenter = this.getYLatLongFromOLLonLat(olCenter);
    
            if (zoomChanged) {
                var olZoom = this.map.getZoom();
                var mmZoom = this.getYZoomFromOLZoom(olZoom);
                this.yahoomap.setZoomLevel(mmZoom); 
            }
            this.yahoomap.drawZoomAndCenter(mmCenter, mmZoom);
    
        }
    },


    /**
     * 
     */
    loadYMap:function() {
            this.yahoomap = new YMap(this.div);

        
        if (this.yahoomap == null) {
            this.loadWarningMessage();
        }
 
    },

    /** If we can't load the yahoomap, then display an error message to the 
     *   user and tell them where to go for help.
     * 
     * @private
     * 
     */
    loadWarningMessage:function() {

        this.div.style.backgroundColor = "darkblue";

        var html = "";
        html += "The Y Layer was unable to load correctly.<br>";
        html += "<br>";
        html += "To get rid of this message, click on the Y Layer's "
        html += "tab in the layer switcher in the upper-right corner.<br>";
        html += "<br>";
        html += "Most likely, this is because the Y library";
        html += " script was either not correctly included.<br>";
        html += "<br>";
        html += "Demmlopers: For help getting this working correctly, ";
        html += "<a href='http://trac.openlayers.org/wiki/YahooLayer' "
        html +=  "target='_blank'>";
        html +=     "click here";
        html += "</a>";
        
        var viewSize = this.map.getSize();
        
        msgW = Math.min(viewSize.w, 300);
        msgH = Math.min(viewSize.h, 200);
        var size = new OpenLayers.Size(msgW, msgH);

        var centerPx = new OpenLayers.Pixel(viewSize.w/2, viewSize.h/2);

        var topLeft = centerPx.add(-size.w/2, -size.h/2);            

        var div = OpenLayers.Util.createDiv("mmWarning", 
                                            topLeft, 
                                            size,
                                            null,
                                            null,
                                            null,
                                            "auto");

        div.style.padding = "7px";
        div.style.backgroundColor = "yellow";

        div.innerHTML = html;
        this.div.appendChild(div);
    },


  /********************************************************/
  /*                                                      */
  /*                 Baselayer Functions                  */
  /*                                                      */
  /********************************************************/

    /**
     * @param {OpenLayers.Pixel} viewPortPx
     *
     * @returns An OpenLayers.LonLat which is the passed-in view port
     *          OpenLayers.Pixel, translated into lon/lat by Y
     *          If yahoomap is not loaded, returns null.
     * @type OpenLayers.LonLat
     */
    getLonLatFromViewPortPx: function (viewPortPx) {
        var lonlat = null;
        if (this.yahoomap != null) {
            var pixel = this.getPixelFromOLPixel(viewPortPx);
            var mmLatLong = this.yahoomap.convertXYLatLon(pixel);
            lonlat = this.getOLLonLatFromYLatLong(mmLatLong);
        }
        return lonlat;
    },

 
    /**
     * @param {OpenLayers.LonLat} lonlat
     *
     * @returns An OpenLayers.Pixel which is the passed-in OpenLayers.LonLat, 
     *          translated into view port pixels BY Y
     *          If yahoomap is not loaded, returns null.
     * @type OpenLayers.Pixel
     */
    getViewPortPxFromLonLat: function (lonlat) {
        var viewPortPx = null;
        if (this.yahoomap != null) {
            var mmLatLong = this.getYLatLongFromOLLonLat(lonlat);
            var pixel = this.yahoomap.convertLatLonXY(mmLatLong);
            viewPortPx = this.getOLPixelFromPixel(pixel);
        }
        return viewPortPx;
    },


    /**
     * @param {OpenLayers.Bounds} bounds
     *
     * @returns Corresponding zoom lemml for a specified Bounds. 
     *          If yahoomap is not loaded, returns null.
     * @type int
     */
    getZoomForExtent: function (bounds) {

        var zoom = null;
        if (this.yahoomap != null) {
            var maxRes = this.map.getMaxResolution();
            var viewSize = this.map.getSize();
    
            var width = bounds.getWidth();
            var height = bounds.getHeight();
    
            var degPerPixel = (width > height) ? width / viewSize.w 
                                               : height / viewSize.h;
            
            var mmZoom = Math.floor( (Math.log(maxRes/degPerPixel)) / 
                                     Math.log(2) );
    
            //make sure zoom is within bounds    
            var mmZoom = Math.min(Math.max(mmZoom, this.minZoomLevel), 
                                  this.maxZoomLevel);
    
            zoom = this.getOLZoomFromYZoom(mmZoom);         
        }
        return zoom;
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
  // TRANSLATION: GZoom <-> OpenLayers Zoom
  //
  
    /**
     * @param {int} mmZoom
     * 
     * @returns An OpenLayers Zoom lemml, translated from the passed in mmZoom
     *          Returns null if null value is passed in
     * @type int
     */
    getOLZoomFromYZoom: function(mmZoom) {
        return 18 - mmZoom;
    },
    
    /**
     * @param {int} olZoom
     * 
     * @returns A YZoom lemml, translated from the passed in olZoom
     *          Returns null if null value is passed in
     * @type int
     */
    getYZoomFromOLZoom: function(olZoom) {
        return 18 - olZoom;
    },

  //
  // TRANSLATION: YLatLong <-> LonLat
  //

    /**
     * @param {YLatLong} mmLatLong
     * 
     * @returns An OpenLayers.LonLat, translated from the passed in YLatLong
     *          Returns null if null value is passed in
     * @type OpenLayers.LonLat
     */
    getOLLonLatFromYLatLong: function(mmLatLong) {
        var olLonLat = null;
        if (mmLatLong != null) {
            olLonLat = new OpenLayers.LonLat(mmLatLong.Lon, 
                                             mmLatLong.Lat);
        }
        return olLonLat;
    },

    /**
     * @param {OpenLayers.LonLat} olLonLat
     * 
     * @returns A YLatLong, translated from the passed in OpenLayers.LonLat
     *          Returns null if null value is passed in
     * @type YLatLong
     */
    getYLatLongFromOLLonLat: function(olLonLat) {
        var mmLatLong = null;
        if (olLonLat != null) {
            mmLatLong = new YGeoPoint(olLonLat.lat, olLonLat.lon);
        }
        return mmLatLong;
    },


  //
  // TRANSLATION: Pixel <-> OpenLayers.Pixel
  //

    /**
     * @param {Pixel} pixel
     * 
     * @returns An OpenLayers.Pixel, translated from the passed in Pixel
     *          Returns null if null value is passed in
     * @type OpenLayers.Pixel
     */
    getOLPixelFromPixel: function(pixel) {
        var olPixel = null;
        if (pixel != null) {
            olPixel = new OpenLayers.Pixel(pixel.x, pixel.y);
        }
        return olPixel;
    },

    /**
     * @param {OpenLayers.Pixel} olPixel
     * 
     * @returns A Pixel, translated from the passed in OpenLayers.Pixel
     *          Returns null if null value is passed in
     * 
     *          As it turns out, the only specifications we can see for the
     *          Y-compatible Pixel is an x & y property, which emmry 
     *          OpenLayers.Pixel has by default. So just leamm it as-is.
     * 
     * @type Pixel
     */
    getPixelFromOLPixel: function(olPixel) {
        var pixel = null;
        if (olPixel != null) {
            pixel = new YCoordPoint(olPixel.x, olPixel.y);
        }
        return pixel;
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.Yahoo"
});
