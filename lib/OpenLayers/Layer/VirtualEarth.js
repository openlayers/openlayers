/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

// @require: OpenLayers/Layer.js

/**
 * @class 
 */
OpenLayers.Layer.VirtualEarth = Class.create();
OpenLayers.Layer.VirtualEarth.prototype = 
  Object.extend( new OpenLayers.Layer(), {

    /** @type Boolean */
    isFixed: true,

    /** @type VEMap */
    vemap: null,
    
    /**
     * @constructor
     * 
     * @param {str} name
     */
    initialize:function(name) {
        OpenLayers.Layer.prototype.initialize.apply(this, arguments);
    },

    /** 
     * @param {OpenLayers.Map} map
     */
    setMap:function(map) {
        OpenLayers.Layer.prototype.setMap.apply(this, arguments);

        // once our layer has been added to the map, we can create the vemap
        this.map.events.register("addlayer", this, this.loadVEMap);
    },

    /** Virtual Earth layer is always a base class. 
     * @type Boolean
     */
    isBaseLayer: function() {
        return true;
    },

    /** 
     * @param {OpenLayers.Bounds} bounds
     * @param {Boolean} zoomChanged
     * @param {Boolean} minor
     */
    moveTo:function(bounds, zoomChanged, minor) {

        if (this.vemap != null) {
            var olCenter = this.map.getCenter();
            var olZoom = this.map.getZoom();
    
            var veCenter = this.getVELatLongFromOLLonLat(olCenter);
            var veZoom = this.getVEZoomFromOLZoom(olZoom);
    
            this.vemap.SetCenterAndZoom(veCenter, veZoom);
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
    
            // catch pans and zooms from VE Map
            this.vemap.AttachEvent("onendcontinuouspan", 
                                   this.catchPanZoom.bindAsEventListener(this)); 
            this.vemap.AttachEvent("onendzoom", 
                                   this.catchPanZoom.bindAsEventListener(this)); 
        }
 
    },

    /** If we can't load the vemap, then display an error message to the 
     *   user and tell them where to go for help.
     * 
     * @private
     * 
     */
    loadWarningMessage:function() {

        this.div.style.backgroundColor = "red";

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
        html += "<a href='http://trac.openlayers.org/wiki/VE' "
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
    
    /**
     * @param {event} e
     */
    catchPanZoom: function(e) { 
        
        var veCenter = this.vemap.GetCenter();
        var veZoom = this.vemap.GetZoomLevel();
        
        var olCenter = this.getOLLonLatFromVELatLong(veCenter);
        var olZoom = this.getOLZoomFromVEZoom(veZoom);
        
        this.map.setCenter(olCenter, olZoom);
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
            var gBounds = this.getVELatLongBoundsFromOLBounds(bounds);
            var gZoom = this.vemap.getBoundsZoomLevel(gBounds);
            zoom = this.getOLZoomFromGZoom(gZoom);
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
            zoom = veZoom - 1;
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
            zoom = olZoom + 1;
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

  //
  // TRANSLATION: VELatLongBounds <-> OpenLayers.Bounds
  //

    /**
     * @param {VELatLongBounds} veLatLongBounds
     * 
     * @returns An OpenLayers.Bounds, translated from veLatLongBounds
     *          Returns null if null value is passed in
     * @type OpenLayers.Bounds
     */
    getOLBoundsFromVELatLongBounds: function(veLatLongBounds) {
        var olBounds = null;
        if (veLatLongBounds != null) {
            var sw = veLatLongBounds.getSouthWest();
            var ne = veLatLongBounds.getNorthEast();
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
     * @returns A VELatLongBounds, translated from olBounds
     *          Returns null if null value is passed in
     * @type VELatLongBounds
     */
    getVELatLongBoundsFromOLBounds: function(olBounds) {
        var veLatLongBounds = null;
        if (olBounds != null) {
            var sw = new VELatLong(olBounds.bottom, olBounds.left);
            var ne = new VELatLong(olBounds.top, olBounds.right);
            veLatLongBounds = new VELatLongBounds(sw, ne);
        }
        return veLatLongBounds;
    },

    

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.VirtualEarth"
});