// @require: OpenLayers/Layer.js

// load VE map control script
document.write("<script src='http://dev.virtualearth.net/mapcontrol/v3/mapcontrol.js'></script>");


/**
 * @class 
 */
OpenLayers.Layer.VirtualEarth = Class.create();
OpenLayers.Layer.VirtualEarth.prototype = 
  Object.extend( new OpenLayers.Layer(), {

    /** @type Boolean */
    viewPortLayer: true,

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

    /** 
     * @param {OpenLayers.Bounds} bounds
     * @param {int} zoomChanged
     */
    moveTo:function(bounds,zoomChanged) {

        if (this.vemap != null) {
            var olCenter = this.map.getCenter();
            var olZoom = this.map.getZoom();
    
            this.vemap.SetCenterAndZoom(new VELatLong(olCenter.lat, olCenter.lon),
                                        olZoom + 1);
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

        // create VEMap, hide nav controls
        this.vemap = new VEMap(this.name);
        this.vemap.LoadMap();
        this.vemap.HideDashboard();

        // catch pans and zooms from VE Map
        this.vemap.AttachEvent("onendcontinuouspan", 
                               this.catchPanZoom.bindAsEventListener(this)); 
        this.vemap.AttachEvent("onendzoom", 
                               this.catchPanZoom.bindAsEventListener(this)); 
        

    },

    /**
     * @param {event} e
     */
    catchPanZoom: function(e) { 
        var veCenter = this.vemap.GetCenter();
        var veZoom = this.vemap.GetZoomLevel();
        
        var olCenter = new OpenLayers.LonLat(veCenter.Longitude,
                                             veCenter.Latitude);
                                             
        this.map.setCenter(olCenter, veZoom - 1);
        
    },


    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.VirtualEarth"
});