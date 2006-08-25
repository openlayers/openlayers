/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

/**
 * @class 
 * 
 * @requires OpenLayers/Layer/EventPane.js
 */
OpenLayers.Layer.VirtualEarth = Class.create();
OpenLayers.Layer.VirtualEarth.prototype = 
  Object.extend( new OpenLayers.Layer.EventPane(), {

    /** @type VEMap */
    vemap: null,
    
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

        // once our layer has been added to the map, we can load the vemap
        this.loadVEMap();
    },

    /** 
     * @param {OpenLayers.Bounds} bounds
     * @param {Boolean} zoomChanged
     * @param {Boolean} minor
     */
    moveTo:function(bounds, zoomChanged, minor) {

        if (this.vemap != null) {
            var olCenter = this.map.getCenter();
            var veCenter = this.getVELatLongFromOLLonLat(olCenter);
    
            if (zoomChanged) {
                var olZoom = this.map.getZoom();
                var veZoom = this.getVEZoomFromOLZoom(olZoom);
    
                this.vemap.SetCenterAndZoom(veCenter, veZoom);
            } else {
                this.vemap.PanToLatLong(veCenter);
            }
    
        }
    },


    /**
     * 
     */
    loadVEMap:function() {

        // create div and set to same size as map
        var veDiv = OpenLayers.Util.createDiv(this.name);
        var sz = this.map.getSize();
        veDiv.style.width = sz.w;
        veDiv.style.height = sz.h;
        this.div.appendChild(veDiv);

        try {

            // create VEMap, hide nav controls
            this.vemap = new VEMap(this.name);
        } catch (e) {
            // do nothing this is to keep from crashing
            // if the VE library was not loaded. 
        }

        
        if (this.vemap == null) {
            this.loadWarningMessage();
        } else {


            try {
                this.vemap.LoadMap();
            } catch (e) {
                // this is to catch a Mozilla bug without falling apart
            }

            this.vemap.HideDashboard();
        }
 
    },

    /** If we can't load the vemap, then display an error message to the 
     *   user and tell them where to go for help.
     * 
     * @private
     * 
     */
    loadWarningMessage:function() {

        this.div.style.backgroundColor = "darkblue";

        var html = "";
        html += "The VE Layer was unable to load correctly.<br>";
        html += "<br>";
        html += "To get rid of this message, click on the VE Layer's "
        html += "tab in the layer switcher in the upper-right corner.<br>";
        html += "<br>";
        html += "Most likely, this is because the VE library";
        html += " script was either not correctly included.<br>";
        html += "<br>";
        html += "Developers: For help getting this working correctly, ";
        html += "<a href='http://trac.openlayers.org/wiki/VirtualEarthLayer' "
        html +=  "target='_blank'>";
        html +=     "click here";
        html += "</a>";
        
        var viewSize = this.map.getSize();
        
        msgW = Math.min(viewSize.w, 300);
        msgH = Math.min(viewSize.h, 200);
        var size = new OpenLayers.Size(msgW, msgH);

        var centerPx = new OpenLayers.Pixel(viewSize.w/2, viewSize.h/2);

        var topLeft = centerPx.add(-size.w/2, -size.h/2);            

        var div = OpenLayers.Util.createDiv("veWarning", 
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
     *          OpenLayers.Pixel, translated into lon/lat by VE
     *          If vemap is not loaded, returns null.
     * @type OpenLayers.LonLat
     */
    getLonLatFromViewPortPx: function (viewPortPx) {
        var lonlat = null;
        if (this.vemap != null) {
            var pixel = this.getPixelFromOLPixel(viewPortPx);
            var zoom = this.vemap.GetZoomLevel();
            var veLatLong = this.vemap.PixelToLatLong(pixel.x, pixel.y, zoom);
            lonlat = this.getOLLonLatFromVELatLong(veLatLong);
        }
        return lonlat;
    },

 
    /**
     * @param {OpenLayers.LonLat} lonlat
     *
     * @returns An OpenLayers.Pixel which is the passed-in OpenLayers.LonLat, 
     *          translated into view port pixels BY VE
     *          If vemap is not loaded, returns null.
     * @type OpenLayers.Pixel
     */
    getViewPortPxFromLonLat: function (lonlat) {
        var viewPortPx = null;
        if (this.vemap != null) {
            var veLatLong = this.getVELatLongFromOLLonLat(lonlat);
            var pixel = this.vemap.LatLongToPixel(veLatLong);
            viewPortPx = this.getOLPixelFromPixel(pixel);
        }
        return viewPortPx;
    },


    /**
     * @param {OpenLayers.Bounds} bounds
     *
     * @returns Corresponding zoom level for a specified Bounds. 
     *          If vemap is not loaded, returns null.
     * @type int
     */
    getZoomForExtent: function (bounds) {

        var zoom = null;
        if (this.vemap != null) {
            var maxRes = this.map.getMaxResolution();
            var viewSize = this.map.getSize();
    
            var width = bounds.getWidth();
            var height = bounds.getHeight();
    
            var degPerPixel = (width > height) ? width / viewSize.w 
                                               : height / viewSize.h;
            
            var veZoom = Math.floor( (Math.log(maxRes/degPerPixel)) / 
                                     Math.log(2) );
    
            //make sure zoom is within bounds    
            var veZoom = Math.min(Math.max(veZoom, this.minZoomLevel), 
                                  this.maxZoomLevel);
    
            zoom = this.getOLZoomFromVEZoom(veZoom);         
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
     * @param {int} veZoom
     * 
     * @returns An OpenLayers Zoom level, translated from the passed in veZoom
     *          Returns null if null value is passed in
     * @type int
     */
    getOLZoomFromVEZoom: function(veZoom) {
        var zoom = null;
        if (veZoom != null) {
            zoom = veZoom - this.minZoomLevel;
        }
        return zoom;
    },
    
    /**
     * @param {int} olZoom
     * 
     * @returns A VEZoom level, translated from the passed in olZoom
     *          Returns null if null value is passed in
     * @type int
     */
    getVEZoomFromOLZoom: function(olZoom) {
        var zoom = null; 
        if (olZoom != null) {
            zoom = olZoom + this.minZoomLevel;
        }
        return zoom;
    },

  //
  // TRANSLATION: VELatLong <-> LonLat
  //

    /**
     * @param {VELatLong} veLatLong
     * 
     * @returns An OpenLayers.LonLat, translated from the passed in VELatLong
     *          Returns null if null value is passed in
     * @type OpenLayers.LonLat
     */
    getOLLonLatFromVELatLong: function(veLatLong) {
        var olLonLat = null;
        if (veLatLong != null) {
            olLonLat = new OpenLayers.LonLat(veLatLong.Longitude, 
                                             veLatLong.Latitude);
        }
        return olLonLat;
    },

    /**
     * @param {OpenLayers.LonLat} olLonLat
     * 
     * @returns A VELatLong, translated from the passed in OpenLayers.LonLat
     *          Returns null if null value is passed in
     * @type VELatLong
     */
    getVELatLongFromOLLonLat: function(olLonLat) {
        var veLatLong = null;
        if (olLonLat != null) {
            veLatLong = new VELatLong(olLonLat.lat, olLonLat.lon);
        }
        return veLatLong;
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
     *          VE-compatible Pixel is an x & y property, which every 
     *          OpenLayers.Pixel has by default. So just leave it as-is.
     * 
     * @type Pixel
     */
    getPixelFromOLPixel: function(olPixel) {
        var pixel = null;
        if (olPixel != null) {
            pixel = new Msn.VE.Pixel(olPixel.x, olPixel.y);
        }
        return pixel;
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.VirtualEarth"
});
