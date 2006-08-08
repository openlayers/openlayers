/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */
// @require: OpenLayers/Layer.js

// load Yahoo map control script
document.write("<script src='http://api.maps.yahoo.com/ajaxymap?v=3.0&appid=euzuro-openlayers'></script>");

/**
 * @class
 */
OpenLayers.Layer.Yahoo = Class.create();
OpenLayers.Layer.Yahoo.prototype = Object.extend( new OpenLayers.Layer(), {

    /** Yahoo layer is always a base layer.
     * 
     * @type Boolean
     */
    isBaseLayer: true,
    
    /** @type Boolean */
    isFixed: true,

    /** @type GMap2 gmap stores the Google Map element */
    ymap:null,
   
    /** @type Boolean */
    dragging:false,
    
    /** 
     * @constructor
     * 
     * @param {String} name
     */
    initialize: function(name) {
        OpenLayers.Layer.prototype.initialize.apply(this, [name]);
    },
    
     /** 
     * @param {OpenLayers.Map} map
     */
    setMap:function(map) {
        OpenLayers.Layer.prototype.setMap.apply(this, arguments);

        // once our layer has been added to the map, we can create the vemap
        this.map.events.register("addlayer", this, this.loadYMap);
    },

    /** 
     * @param {OpenLayers.Bounds} bounds
     * @param {Boolean} zoomChanged
     * @param {Boolean} minor
     */
    moveTo:function(bounds, zoomChanged, minor) {

        if ((this.ymap != null) && (!this.dragging)) {

            var olCenter = this.map.getCenter();
            var yCenter = this.getYMapCenter();
            
            var olZoom = this.map.getZoom();
            var yZoom = this.ymap.getZoomLevel();
            
            if ((!olCenter.equals(yCenter)) || (( 16 - olZoom) != yZoom)) {
                this.ymap.drawZoomAndCenter(new YGeoPoint(olCenter.lat, olCenter.lon), 
                                    16 - olZoom);
            }
        }
    },

    /**
     * 
     */
    loadYMap:function() {
        // create div and set to same size as map
        var yDiv = OpenLayers.Util.createDiv(this.name);
        var sz = this.map.getSize();
        yDiv.style.width = sz.w;
        yDiv.style.height = sz.h;
        this.div.appendChild(yDiv);

        // create GMap, hide nav controls
        this.ymap = new YMap(this.div);

        // catch pans and zooms from GMap
        YEvent.Capture(this.ymap, 
                       EventsList.endPan, 
                       this.catchPanZoom, 
                       this); 

        // catch pans and zooms from GMap
        YEvent.Capture(this.ymap, 
                       EventsList.endAutoPan, 
                       this.catchPanZoom, 
                       this); 


        // attach to the drag start and end and we´ll set a flag so that
        //  we dont get recursivity. this is because the events fall through
        //  the gmaps div and into the main layer div
        YEvent.Capture(this.ymap, 
                       EventsList.startPan, 
                       this.dragStart,
                       this); 

    },

    /** 
     * @private
     */
    dragStart: function() {
        this.dragging = true;
    },
    
    /**
     * @private 
     * 
     * @param {event} e
     */
    catchPanZoom: function(e) { 
        this.dragging = false;

        var olCenter = this.getYMapCenter();
        var yZoom = this.ymap.getZoomLevel();

        this.map.setCenter(olCenter, 16 - yZoom);
        
    },

    /**
     * @private
     * 
     * @returns An OpenLayers.LonLat with the center of the ymap, or null if 
     *           the YMap has not been centered yet
     * @type OpenLayers.LonLat
     */
    getYMapCenter:function() {
        var olCenter = null;
        var yCenter = this.ymap.getCenterLatLon();
        if (yCenter != null) {
            olCenter = new OpenLayers.LonLat(yCenter.Lon, yCenter.Lat);
        }
        return olCenter;
    },
 
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.Yahoo"
});
