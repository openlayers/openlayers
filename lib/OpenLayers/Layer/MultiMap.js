/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

/**
 * @class 
 * 
 * @requires OpenLayers/Layer/EventPane.js
 */
OpenLayers.Layer.MultiMap = Class.create();
OpenLayers.Layer.MultiMap.prototype = 
  Object.extend( new OpenLayers.Layer.EventPane(), {

    /** @type MMMap */
    multimap: null,
    
    /** @type int */
    minZoomLevel: 1,

    /** @type int */
    maxZoomLevel: 17,
    
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

        // once our layer has been added to the map, we can load the multimap
        this.loadMMMap();
    },

    /** 
     * @param {OpenLayers.Bounds} bounds
     * @param {Boolean} zoomChanged
     * @param {Boolean} minor
     */
    moveTo:function(bounds, zoomChanged, minor) {

        if (this.multimap != null) {
            var olCenter = this.map.getCenter();
            var mmCenter = this.getMMLatLongFromOLLonLat(olCenter);
    
            if (zoomChanged) {
                var olZoom = this.map.getZoom();
                var mmZoom = this.getMMZoomFromOLZoom(olZoom);
    
                this.multimap.goToPosition(mmCenter, mmZoom);
            } else {
                this.multimap.goToPosition(mmCenter);
            }
    
        }
    },


    /**
     * 
     */
    loadMMMap:function() {

        try {
            // create MMMap, hide nav controls
            this.multimap = new MultimapViewer(this.div);
        } catch (e) {
            // do nothing this is to keep from crashing
            // if the MM library was not loaded. 
        }

        
        if (this.multimap == null) {
            this.loadWarningMessage();
        }
 
    },

    /** If we can't load the multimap, then display an error message to the 
     *   user and tell them where to go for help.
     * 
     * @private
     * 
     */
    loadWarningMessage:function() {

        this.div.style.backgroundColor = "darkblue";

        var html = "";
        html += "The MM Layer was unable to load correctly.<br>";
        html += "<br>";
        html += "To get rid of this message, click on the MM Layer's "
        html += "tab in the layer switcher in the upper-right corner.<br>";
        html += "<br>";
        html += "Most likely, this is because the MM library";
        html += " script was either not correctly included.<br>";
        html += "<br>";
        html += "Demmlopers: For help getting this working correctly, ";
        html += "<a href='http://trac.openlayers.org/wiki/MultiMapLayer' "
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
     *          OpenLayers.Pixel, translated into lon/lat by MM
     *          If multimap is not loaded, returns null.
     * @type OpenLayers.LonLat
     */
    getLonLatFromViewPortPx: function (viewPortPx) {
        var lonlat = null;
        if (this.multimap != null) {
            var pixel = this.getPixelFromOLPixel(viewPortPx);
            var zoom = this.multimap.getZoomFactor();
            pixel.x = pixel.x - (this.map.getSize().w/2);
            pixel.y = pixel.y - (this.map.getSize().h/2);
            var mmLatLong = this.multimap.getMapPositionAt(pixel);
            lonlat = this.getOLLonLatFromMMLatLong(mmLatLong);
        }
        return lonlat;
    },

 
    /**
     * @param {OpenLayers.LonLat} lonlat
     *
     * @returns An OpenLayers.Pixel which is the passed-in OpenLayers.LonLat, 
     *          translated into view port pixels BY MM
     *          If multimap is not loaded, returns null.
     * @type OpenLayers.Pixel
     */
    getViewPortPxFromLonLat: function (lonlat) {
        var viewPortPx = null;
        if (this.multimap != null) {
            var mmLatLong = this.getMMLatLongFromOLLonLat(lonlat);
            var pixel = this.multimap.geoPosToContainerPixels(mmLatLong);
            viewPortPx = this.getOLPixelFromPixel(pixel);
        }
        return viewPortPx;
    },


    /**
     * @param {OpenLayers.Bounds} bounds
     *
     * @returns Corresponding zoom lemml for a specified Bounds. 
     *          If multimap is not loaded, returns null.
     * @type int
     */
    getZoomForExtent: function (bounds) {

        var zoom = null;
        if (this.multimap != null) {
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
    
            zoom = this.getOLZoomFromMMZoom(mmZoom);         
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
    getOLZoomFromMMZoom: function(mmZoom) {
        if (mmZoom) return mmZoom - 1;
        return null;
    },
    
    /**
     * @param {int} olZoom
     * 
     * @returns A MMZoom lemml, translated from the passed in olZoom
     *          Returns null if null value is passed in
     * @type int
     */
    getMMZoomFromOLZoom: function(olZoom) {
        if (olZoom) return olZoom + 1;
        return null;
    },

  //
  // TRANSLATION: MMLatLong <-> LonLat
  //

    /**
     * @param {MMLatLong} mmLatLong
     * 
     * @returns An OpenLayers.LonLat, translated from the passed in MMLatLong
     *          Returns null if null value is passed in
     * @type OpenLayers.LonLat
     */
    getOLLonLatFromMMLatLong: function(mmLatLong) {
        var olLonLat = null;
        if (mmLatLong != null) {
            olLonLat = new OpenLayers.LonLat(mmLatLong.lon, 
                                             mmLatLong.lat);
        }
        return olLonLat;
    },

    /**
     * @param {OpenLayers.LonLat} olLonLat
     * 
     * @returns A MMLatLong, translated from the passed in OpenLayers.LonLat
     *          Returns null if null value is passed in
     * @type MMLatLong
     */
    getMMLatLongFromOLLonLat: function(olLonLat) {
        var mmLatLong = null;
        if (olLonLat != null) {
            mmLatLong = new MMLatLon(olLonLat.lat, olLonLat.lon);
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
     *          MM-compatible Pixel is an x & y property, which emmry 
     *          OpenLayers.Pixel has by default. So just leamm it as-is.
     * 
     * @type Pixel
     */
    getPixelFromOLPixel: function(olPixel) {
        var pixel = null;
        if (olPixel != null) {
            pixel = new MMPoint(olPixel.x, olPixel.y);
        }
        return pixel;
    },

    destroy: function() {
        this.multimap = null;
        OpenLayers.Layer.EventPane.prototype.destroy.apply(this, arguments); 
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.MultiMap"
});
