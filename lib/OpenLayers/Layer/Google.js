/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

if (typeof GMap2 != "undefined") {
    
    /** Hack-on function because GMAPS does not give it to us
     * 
     * @param {GLatLng} gLatLng 
     *
     * @returns A GPoint specifying gLatLng translated into "Container" coords
     * @type GPoint
     */
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

/**
 * @class
 * 
 * @requires OpenLayers/Layer.js
 */
OpenLayers.Layer.Google = Class.create();
OpenLayers.Layer.Google.prototype =
    Object.extend( new OpenLayers.Layer.EventPane(), {
    
    /** @type Boolean */
    isFixed: true,

    /** @type GMap2 gmap stores the Google Map element */
    gmap:null,

    /** @type GMapType */
    type: null,
   
    /** @type Boolean */
    dragging:false,

    /** @type Boolean */
    dontListen:false,
    
  // OPTIONS

    /** @type int */
    minZoomLevel: -1,
    
    /** @type int */
    maxZoomLevel: 16,

    
    /** 
     * @constructor
     * 
     * @param {String} name
     */
    initialize: function(name, options) {
        OpenLayers.Layer.EventPane.prototype.initialize.apply(this, arguments);
        if (this.maxExtent == null) {
            this.maxExtent = new OpenLayers.Bounds(-180, -90, 180, 90);
        }
    },
    
    /**
     * 
     */
    destroy: function() {
        this.gmap = null;
        OpenLayers.Layer.EventPane.prototype.destroy.apply(this, arguments); 
    },

     /** 
     * @param {OpenLayers.Map} map
     */
    setMap:function(map) {
        OpenLayers.Layer.EventPane.prototype.setMap.apply(this, arguments);

        // once our layer has been added to the map, we can load it
        this.loadGMap();
    },
    
    /** Assuming we are not dragging (in which case GMaps is moving itself, 
     *   and the dragging flag is set) we need to move the gmap to the 
     *   new center/zoom
     * 
     * @param {OpenLayers.Bounds} bounds
     * @param {Boolean} zoomChanged
     * @param {Boolean} minor
     */
    moveTo:function(bounds, zoomChanged, minor) {

        if ((this.gmap != null) && (!this.dragging)) {

            var newCenter = this.map.getCenter();
            var newZoom = this.map.getZoom();

            if (newCenter != null) {
                var gCenter = this.gmap.getCenter();
                var gZoom = this.gmap.getZoom();

                var currentCenter = this.getOLLonLatFromGLatLng(gCenter);
                var currentZoom = this.getOLZoomFromGZoom(gZoom);
                
                if ( (!newCenter.equals(currentCenter)) || 
                     (newZoom != currentZoom) ) {
    
                    this.dontListen = true;
                    this.gmap.setCenter(this.getGLatLngFromOLLonLat(newCenter), 
                                        this.getGZoomFromOLZoom(newZoom));
                    
                    if (this.type != null) {
                        this.gmap.setMapType(this.type);
                        this.type = null;
                    }

                    this.dontListen = false;
                }
            }
        }
    },

    /** Load the GMap and register appropriate event listeners. If we can't 
     *   load GMap2, then display a warning message.
     * 
     * @private
     * 
     */
    loadGMap:function() {
        
        //has gmaps library has been loaded?
        try {
            // create GMap, hide nav controls
            this.gmap = new GMap2(this.div );
            
            // this causes the GMap to set itself to Map's center/zoom
            this.moveTo();


            // catch pans and zooms from GMap
            GEvent.addListener(this.gmap, 
                               "moveend", 
                               this.catchPanZoom.bindAsEventListener(this)); 
    
    
            // attach to the drag start and end and we´ll set a flag so that
            //  we dont get recursivity. this is because when we call setCenter(),
            //  it calls moveTo() on all layers
            GEvent.addListener(this.gmap, 
                               "dragstart", 
                               this.dragStart.bindAsEventListener(this)); 
    
            GEvent.addListener(this.gmap, 
                               "dragend", 
                               this.dragEnd.bindAsEventListener(this)); 
    
            // catch pans and zooms from GMap
            GEvent.addListener(this.gmap, 
                               "drag", 
                               this.catchPanZoom.bindAsEventListener(this)); 
        } catch (e) {
            this.loadWarningMessage();
        }
    },

    /** If we can't load the GMap, then display an error message to the 
     *   user and tell them where to go for help.
     * 
     * @private
     * 
     */
    loadWarningMessage:function() {

        this.div.style.backgroundColor = "darkblue";

        var html = "";
        html += "The Google Layer was unable to load correctly.<br>";
        html += "<br>";
        html += "To get rid of this message, click on the Google Layer's "
        html += "tab in the layer switcher in the upper-right corner.<br>";
        html += "<br>";
        html += "Most likely, this is because the Google Maps library";
        html += " script was either not included, or does not contain the";
        html += " correct API key for your site.<br>";
        html += "<br>";
        html += "Developers: For help getting this working correctly, ";
        html += "<a href='http://trac.openlayers.org/wiki/GoogleMapsLayer' "
        html +=  "target='_blank'>";
        html +=     "click here";
        html += "</a>";
        
        var viewSize = this.map.getSize();
        
        msgW = Math.min(viewSize.w, 300);
        msgH = Math.min(viewSize.h, 200);
        var size = new OpenLayers.Size(msgW, msgH);

        var centerPx = new OpenLayers.Pixel(viewSize.w/2, viewSize.h/2);

        var topLeft = centerPx.add(-size.w/2, -size.h/2);            

        var div = OpenLayers.Util.createDiv("gmapsWarning", 
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
     * @private
     */
    dragStart: function() {
        this.dragging = true;
    },
    
    /** 
     * @private
     */
    dragEnd: function() {
        this.dragging = false;
    },
    
    /** When GMap recenters itself (when user doubleclicks or draggs it) we 
     *   need to update our Map -- and all the other layers
     * 
     * @private 
     * 
     * @param {Event} e
     */
    catchPanZoom: function(e) { 
    
        if (!this.dontListen) {
        
            var gCenter = this.gmap.getCenter();
            var gZoom = this.gmap.getZoom();
    
            var olCenter = this.getOLLonLatFromGLatLng(gCenter);
            var olZoom = this.getOLZoomFromGZoom(gZoom);
    
            this.map.setCenter(olCenter, olZoom, this.dragging);
        }
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
     *          OpenLayers.Pixel, translated into lon/lat by GMAPS
     *          If gmap is not loaded or not centered, returns null
     * @type OpenLayers.LonLat
     */
    getLonLatFromViewPortPx: function (viewPortPx) {
        var lonlat = null;
        if ((this.gmap != null) && (this.gmap.getCenter() != null)) {
            var gPoint = this.getGPointFromOLPixel(viewPortPx);
            var gLatLng = this.gmap.fromContainerPixelToLatLng(gPoint)
            lonlat = this.getOLLonLatFromGLatLng(gLatLng);
        }
        return lonlat;
    },

 
    /**
     * @param {OpenLayers.LonLat} lonlat
     *
     * @returns An OpenLayers.Pixel which is the passed-in OpenLayers.LonLat, 
     *          translated into view port pixels BY GMAPS
     *          If gmap is not loaded or not centered, returns null
     * @type OpenLayers.Pixel
     */
    getViewPortPxFromLonLat: function (lonlat) {
        var viewPortPx = null;
        if ((this.gmap != null) && (this.gmap.getCenter() != null)) {
            var gLatLng = this.getGLatLngFromOLLonLat(lonlat);
        
            // note we use special hacked function here
            var gPoint = this.gmap.fromLatLngToContainerPixel(gLatLng);
        
            viewPortPx = this.getOLPixelFromGPoint(gPoint);
        }
        return viewPortPx;
    },


    /**
     * @param {OpenLayers.Bounds} bounds
     *
     * @returns Corresponding zoom level for a specified Bounds. 
     *          If gmap is not loaded or not centered, returns null
     * @type int
     */
    getZoomForExtent: function (bounds) {
        var zoom = null;
        if ((this.gmap != null) && (this.gmap.getCenter() != null)) {
            var gBounds = this.getGLatLngBoundsFromOLBounds(bounds);
            var gZoom = this.gmap.getBoundsZoomLevel(gBounds);
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
     * @param {int} gZoom
     * 
     * @returns An OpenLayers Zoom level, translated from the passed in gZoom
     *          Returns null if null value is passed in
     * @type int
     */
    getOLZoomFromGZoom: function(gZoom) {
        var zoom = null;
        if (gZoom != null) {
            zoom = gZoom;
        }
        return zoom;
    },
    
    /**
     * @param {int} olZoom
     * 
     * @returns A GZoom level, translated from the passed in olZoom
     *          Returns null if null value is passed in
     * @type int
     */
    getGZoomFromOLZoom: function(olZoom) {
        var zoom = null; 
        if (olZoom != null) {
            zoom = olZoom;
        }
        return zoom;
    },

  //
  // TRANSLATION: GLatLng <-> LonLat
  //

    /**
     * @param {GLatLng} gLatLng
     * 
     * @returns An OpenLayers.LonLat, translated from the passed in GLatLng
     *          Returns null if null value is passed in
     * @type OpenLayers.LonLat
     */
    getOLLonLatFromGLatLng: function(gLatLng) {
        var olLonLat = null;
        if (gLatLng != null) {
            olLonLat = new OpenLayers.LonLat(gLatLng.lng(), gLatLng.lat());
        }
        return olLonLat;
    },

    /**
     * @param {OpenLayers.LonLat} olLonLat
     * 
     * @returns A GLatLng, translated from the passed in OpenLayers.LonLat
     *          Returns null if null value is passed in
     * @type GLatLng
     */
    getGLatLngFromOLLonLat: function(olLonLat) {
        var gLatLng = null;
        if (olLonLat != null) {
            gLatLng = new GLatLng(olLonLat.lat, olLonLat.lon);
        }
        return gLatLng;
    },


  //
  // TRANSLATION: GPoint <-> OpenLayers.Pixel
  //

    /**
     * @param {GPoint} gPoint
     * 
     * @returns An OpenLayers.Pixel, translated from the passed in GPoint
     *          Returns null if null value is passed in
     * @type OpenLayers.Pixel
     */
    getOLPixelFromGPoint: function(gPoint) {
        var olPixel = null;
        if (gPoint != null) {
            olPixel = new OpenLayers.Pixel(gPoint.x, gPoint.y);
        }
        return olPixel;
    },

    /**
     * @param {OpenLayers.Pixel} olPixel
     * 
     * @returns A GPoint, translated from the passed in OpenLayers.Pixel
     *          Returns null if null value is passed in
     * @type GPoint
     */
    getGPointFromOLPixel: function(olPixel) {
        var gPoint = null;
        if (olPixel != null) {
            gPoint = new GPoint(olPixel.x, olPixel.y);
        }
        return gPoint;
    },

  //
  // TRANSLATION: GLatLngBounds <-> OpenLayers.Bounds
  //

    /**
     * @param {GLatLngBounds} gLatLngBounds
     * 
     * @returns An OpenLayers.Bounds, translated from gLatLngBounds
     *          Returns null if null value is passed in
     * @type OpenLayers.Bounds
     */
    getOLBoundsFromGLatLngBounds: function(gLatLngBounds) {
        var olBounds = null;
        if (gLatLngBounds != null) {
            var sw = gLatLngBounds.getSouthWest();
            var ne = gLatLngBounds.getNorthEast();
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
     * @returns A GLatLngBounds, translated from olBounds
     *          Returns null if null value is passed in
     * @type GLatLngBounds
     */
    getGLatLngBoundsFromOLBounds: function(olBounds) {
        var gLatLngBounds = null;
        if (olBounds != null) {
            var sw = new GLatLng(olBounds.bottom, olBounds.left);
            var ne = new GLatLng(olBounds.top, olBounds.right);
            gLatLngBounds = new GLatLngBounds(sw, ne);
        }
        return gLatLngBounds;
    },


    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.Google"
});
