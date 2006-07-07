/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */
// @require: OpenLayers/Layer.js

/**
 * @class
 */
OpenLayers.Layer.Google = Class.create();
OpenLayers.Layer.Google.prototype = Object.extend( new OpenLayers.Layer(), {

    /** @type Boolean */
    isFixed: true,

    /** @type GMap2 gmap stores the Google Map element */
    gmap:null,
   
    /** @type Boolean */
    dragging:false,
    
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
        OpenLayers.Layer.prototype.initialize.apply(this, arguments);
        
        if (this.maxExtent == null) {
            this.maxExtent = new OpenLayers.Bounds(-180, -90, 180, 90);
        }
    },
    
     /** 
     * @param {OpenLayers.Map} map
     */
    setMap:function(map) {
        OpenLayers.Layer.prototype.setMap.apply(this, arguments);

        // once our layer has been added to the map, we can create the vemap
        this.map.events.register("addlayer", this, this.loadGMap);
    },
    
    /** Google layer is always a base class.
     * @type Boolean
     */
    isBaseLayer: function() {
        return (this.gmap != null);
    },
    
    /** 
     * @param {OpenLayers.Bounds} bounds
     * @param {Boolean} zoomChanged
     */
    moveTo:function(bounds, zoomChanged) {

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
    
                    this.gmap.setCenter(this.getGLatLngFromOLLonLat(newCenter), 
                                        this.getGZoomFromOLZoom(newZoom));
    
                }
            }
        }
    },

    /**
     * 
     */
    loadGMap:function() {
        
        //test if the gmaps library has been loaded
        var gmapsLoaded = (typeof GMap2) != "undefined";
        if (gmapsLoaded) {
         
            // create GMap, hide nav controls
            this.gmap = new GMap2(this.div);
    
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
        }
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
    
    /**
     * @private 
     * 
     * @param {event} e
     */
    catchPanZoom: function(e) { 
        
        var gCenter = this.gmap.getCenter();
        var gZoom = this.gmap.getZoom();

        var olCenter = this.getOLLonLatFromGLatLng(gCenter);
        var olZoom = this.getOLZoomFromGZoom(gZoom);

        this.map.setCenter(olCenter, olZoom);
    },
    

    /**
     * @param {OpenLayers.Pixel} viewPortPx
     *
     * @returns An OpenLayers.LonLat which is the passed-in view port
     *          OpenLayers.Pixel, translated into lon/lat by GMAPS
     *          If gmap is not loaded, returns null.
     * @type OpenLayers.LonLat
     */
    getLonLatFromViewPortPx: function (viewPortPx) {
        var lonlat = null;
        if (this.gmap != null) {
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
     *          If gmap is not loaded, returns null.
     * @type OpenLayers.Pixel
     */
    getViewPortPxFromLonLat: function (lonlat) {
        var viewPortPx = null;
        if (this.gmap != null) {
            var gLatLng = this.getGLatLngFromOLLonLat(lonlat);
        
            // note we use special hacked function here, 
            // because GMaps doesnt give it to us
            var gPoint = this.fromLatLngToContainerPixel(gLatLng);
        
            viewPortPx = this.getOLPixelFromGPoint(gPoint);
        }
        return viewPortPx;
    },

    /** Hacked function because GMAPS does not give us 
     *  a fromLatLngToContainerPixel. Cheers sde for the 
     *  firstChild.firstChild find.
     * 
     * @param {GLatLng} gLatLng 
     *
     * @returns A GPoint specifying gLatLng translated into "Container" 
     *          coordinates
     * @type GPoint
     */
    fromLatLngToContainerPixel: function(gLatLng) {
    
        // first we translate into "DivPixel"
        var gPoint = this.gmap.fromLatLngToDivPixel(gLatLng);
    
        // locate the sliding "Div" div
        var div = this.div.firstChild.firstChild;
    
        // adjust by the offset of "Div" and voila!
        gPoint.x += div.offsetLeft;
        gPoint.y += div.offsetTop;
    
        return gPoint;
    },


    /**
     * @param {OpenLayers.Bounds} bounds
     *
     * @returns Corresponding zoom level for a specified Bounds. 
     *          If gmap is not loaded, returns null.
     * @type int
     */
    getZoomForExtent: function (bounds) {
        var zoom = null;
        if (this.gmap != null) {
            var gBounds = this.getGLatLngBoundsFromOLBounds(bounds);
            var gZoom = this.gmap.getBoundsZoomLevel(gBounds);
            zoom = this.getOLZoomFromGZoom(gZoom);
        }
        return zoom;
    },

    /**
     * @returns A Bounds object which represents the lon/lat bounds of the 
     *          current viewPort.
     *          If gmap is not loaded, returns null
     * @type OpenLayers.Bounds
     */
    getExtent: function () {
        var extent = null;
        if (this.gmap != null) {
            if (this.gmap.getCenter() == null) {
                this.moveTo();
            }
            var gLatLngBounds = this.gmap.getBounds();
            extent = this.getOLBoundsFromGLatLngBounds(gLatLngBounds);
        }
        return extent;
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
     * @type int
     */
    getOLZoomFromGZoom: function(gZoom) {
        return (gZoom - 1);
    },
    
    /**
     * @param {int} olZoom
     * 
     * @returns A GZoom level, translated from the passed in olZoom
     * @type int
     */
    getGZoomFromOLZoom: function(olZoom) {
        return (olZoom + 1);
    },

  //
  // TRANSLATION: GLatLng <-> LonLat
  //

    /**
     * @param {GLatLng} gLatLng
     * 
     * @returns An OpenLayers.LonLat, translated from the passed in GLatLng
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
