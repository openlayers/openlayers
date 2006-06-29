/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */
// @require: OpenLayers/Layer.js

// load Google map control script
// this key was generated for: http://openlayers.python-hosting.com/testing/euzuro/
document.write("<script src='http://maps.google.com/maps?file=api&amp;v=2&amp;key=ABQIAAAAmQ3udCHPQVB_9T_edFZ7YRRRlP-tOiFgaSzksg_0w1dphL9c5BTfdJMKT91b0UJGibNcWEM0Q5-O1w'></script>");

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
        return true;
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
        
        // create div and set to same size as map
        var gDiv = OpenLayers.Util.createDiv(this.name);
        var sz = this.map.getSize();
        gDiv.style.width = sz.w;
        gDiv.style.height = sz.h;
        this.div.appendChild(gDiv);

        // create GMap, hide nav controls
        this.gmap = new GMap2(this.div);

        // this causes the GMap to set itself to Map's center/zoom
        this.moveTo();

        // catch pans and zooms from GMap
        GEvent.addListener(this.gmap, 
                           "moveend", 
                           this.catchPanZoom.bindAsEventListener(this)); 


        // attach to the drag start and end and we´ll set a flag so that
        //  we dont get recursivity. this is because the events fall through
        //  the gmaps div and into the main layer div
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
     * @type OpenLayers.LonLat
     */
    getLonLatFromViewPortPx: function (viewPortPx) {
        var gPoint = this.getGPointFromOLPixel(viewPortPx);
        var gLatLng = this.gmap.fromDivPixelToLatLng(gPoint)
        
        return this.getOLLonLatFromGLatLng(gLatLng);
    },

 
    /**
     * @param {OpenLayers.LonLat} lonlat
     *
     * @returns An OpenLayers.Pixel which is the passed-in OpenLayers.LonLat, 
     *          translated into view port pixels BY GMAPS
     * @type OpenLayers.Pixel
     */
    getViewPortPxFromLonLat: function (lonlat) {    
        var gLatLng = this.getGLatLngFromOLLonLat(lonlat);
        var gPoint = this.gmap.fromLatLngToDivPixel(gLatLng)
        
        return this.getOLPixelFromGPoint(gPoint);
    },

    /**
     * @param {OpenLayers.Bounds} bounds
     *
     * @return {int}
     */
    getZoomForExtent: function (bounds) {
        var gBounds = this.getGLatLngBoundsFromOLBounds(bounds);
        var gZoom = this.gmap.getBoundsZoomLevel(gBounds);

        return this.getOLZoomFromGZoom(gZoom);
    },

    /**
     * @returns A Bounds object which represents the lon/lat bounds of the 
     *          current viewPort.
     * @type OpenLayers.Bounds
     */
    getExtent: function () {
        if (this.gmap.getCenter() == null) {
            this.moveTo();
        }
        var gLatLngBounds = this.gmap.getBounds();
        return this.getOLBoundsFromGLatLngBounds(gLatLngBounds);
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
