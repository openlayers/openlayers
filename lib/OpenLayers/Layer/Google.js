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
    viewPortLayer: true,

    /** @type GMap2 gmap stores the Google Map element */
    gmap:null,
   
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
        this.map.events.register("addlayer", this, this.loadGMap);
    },

    /** 
     * @param {OpenLayers.Bounds} bounds
     * @param {int} zoomChanged
     */
    moveTo:function(bounds,zoomChanged) {

        if ((this.gmap != null) && (!this.dragging)) {

            var olCenter = this.map.getCenter();
            var gCenter = this.getGMapCenter();
            
            var olZoom = this.map.getZoom();
            var gZoom = this.gmap.getZoom();
            
            if ((!olCenter.equals(gCenter)) || ((olZoom +1) != gZoom)) {
                this.gmap.setCenter(new GLatLng(olCenter.lat, olCenter.lon), 
                                    olZoom + 1);
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
        var olCenter = this.getGMapCenter();
        var gZoom = this.gmap.getZoom();

        this.map.setCenter(olCenter, gZoom - 1);
        
    },

    /**
     * @private
     * 
     * @returns An OpenLayers.LonLat with the center of the gmap, or null if 
     *           the GMap has not been centered yet
     * @type OpenLayers.LonLat
     */
    getGMapCenter:function() {
        var olCenter = null;
        var gCenter = this.gmap.getCenter();
        if (gCenter != null) {
            olCenter = new OpenLayers.LonLat(gCenter.lng(), gCenter.lat());
        }
        return olCenter;
    },
 
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.Google"
});
