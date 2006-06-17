// @require: OpenLayers/Layer.js

// load Yahoo map control script
document.write("<script src='http://maps.google.com/maps?file=api&amp;v=2&amp;key=ABQIAAAAmQ3udCHPQVB_9T_edFZ7YRRRlP-tOiFgaSzksg_0w1dphL9c5BTfdJMKT91b0UJGibNcWEM0Q5-O1w'></script>");

/**
 * @class
 */
OpenLayers.Layer.Yahoo = Class.create();
OpenLayers.Layer.Yahoo.prototype = Object.extend( new OpenLayers.Layer(), {

    /** @type Boolean */
    viewPortLayer: true,

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
     * @param {int} zoomChanged
     */
    moveTo:function(bounds,zoomChanged) {

        if ((this.ymap != null) && (!this.dragging)) {

            var olCenter = this.map.getCenter();
            var gCenter = this.getYMapCenter();
            
            var olZoom = this.map.getZoom();
            var gZoom = this.ymap.getZoomLevel();
            
            if ((!olCenter.equals(yCenter)) || ((olZoom +1) != yZoom)) {
                this.ymap.drawZoomAndCenter(new YGeoPoint(olCenter.lat, olCenter.lon), 
                                    olZoom + 1);
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
        this.moveTo();  

        // catch pans and zooms from GMap
        var e = new YEvent(this.ymap, 
                           "endpan", 
                           catchPanZoom, 
                           this); 


/**
        // attach to the drag start and end and we´ll set a flag so that
        //  we dont get recursivity. this is because the events fall through
        //  the gmaps div and into the main layer div
        GEvent.addListener(this.gmap, 
                           "dragstart", 
                           this.dragStart.bindAsEventListener(this)); 

        GEvent.addListener(this.gmap, 
                           "dragend", 
                           this.dragEnd.bindAsEventListener(this)); 
 */

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
        var olCenter = this.getYMapCenter();
        var yZoom = this.ymap.getZoomLevel();

        this.map.setCenter(olCenter, yZoom - 1);
        
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
