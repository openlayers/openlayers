// @require: OpenLayers/Util.js
/**
* @class
*
*
*/

OpenLayers.Map = Class.create();
OpenLayers.Map.prototype = {
    // Hash: base z-indexes for different classes of thing 
    Z_INDEX_BASE: { Layer: 100, Popup: 200, Control: 1000 },

    // Array: supported application event types
    EVENT_TYPES: [ 
        "addlayer", "removelayer", "movestart", "move", "moveend",
        "zoomend", "layerchanged", "popupopen", "popupclose",
        "addmarker", "removemarker", "clearmarkers", "mouseover",
        "mouseout", "mousemove", "dragstart", "drag", "dragend" ],

    // int: zoom levels, used to draw zoom dragging control and limit zooming
    maxZoomLevel: 16,

    // OpenLayers.Bounds
    maxExtent: new OpenLayers.Bounds(-180, -90, 180, 90),

    /* projection */
    projection: "EPSG:4326",

    // float
    maxResolution: null, // degrees per pixel

    // DOMElement: the div that our map lives in
    div: null,

    // HTMLDivElement: the map's view port             
    viewPortDiv: null,

    // HTMLDivElement: the map's layer container
    layerContainerDiv: null,

    // Array(OpenLayers.Layer): ordered list of layers in the map
    layers: null,

    // Array(OpenLayers.Control)
    controls: null,

    // Array(OpenLayers.Popup)
    popups: null,

    // OpenLayers.LonLat
    center: null,

    // int
    zoom: null,

    // OpenLayers.Events
    events: null,

    // OpenLayers.Pixel
    mouseDragStart: null,

    /**
    * @param {DOMElement} div
    */    
    initialize: function (div, options) {
        Object.extend(this, options);

        this.div = div = $(div);

        // the viewPortDiv is the outermost div we modify
        var id = div.id + "_OpenLayers_ViewPort";
        this.viewPortDiv = OpenLayers.Util.createDiv(id, null, null, null,
                                                     "relative", null,
                                                     "hidden");
        this.viewPortDiv.style.width = "100%";
        this.viewPortDiv.style.height = "100%";
        this.div.appendChild(this.viewPortDiv);

        // the layerContainerDiv is the one that holds all the layers
        id = div.id + "_OpenLayers_Container";
        this.layerContainerDiv = OpenLayers.Util.createDiv(id);
        this.viewPortDiv.appendChild(this.layerContainerDiv);

        this.events = new OpenLayers.Events(this, div, this.EVENT_TYPES);

        this.updateSize();
        // make the entire maxExtent fix in zoom level 0 by default
        if (this.maxResolution == null) {
            this.maxResolution = Math.max(
                this.maxExtent.getWidth()  / this.size.w,
                this.maxExtent.getHeight() / this.size.h );
        }
        // update the internal size register whenever the div is resized
        this.events.register("resize", this, this.updateSize);

        this.layers = [];
        
        if (!this.controls) {
            this.controls = [];
            this.addControl(new OpenLayers.Control.MouseDefaults());
            this.addControl(new OpenLayers.Control.PanZoom());
        }

        this.popups = new Array();

        // always call map.destroy()
        Event.observe(window, 'unload', 
            this.destroy.bindAsEventListener(this));
    },

    /**
    */
    destroy:function() {
        if (this.layers != null) {
            for(var i=0; i< this.layers.length; i++) {
                this.layers[i].destroy();
            } 
            this.layers = null;
        }
        if (this.controls != null) {
            for(var i=0; i< this.controls.length; i++) {
                this.controls[i].destroy();
            } 
            this.controls = null;
        }
    },

    /**
    * @param {OpenLayers.Layer} layer
    */    
    addLayer: function (layer, zIndex) {
        layer.setMap(this);
        layer.div.style.overflow = "";
        if (zIndex) {
            layer.div.style.zIndex = zIndex;
        } else {
            layer.div.style.zIndex = this.Z_INDEX_BASE['Layer'] + this.layers.length;
        }
        this.layerContainerDiv.appendChild(layer.div);
        this.layers.push(layer);
        this.events.triggerEvent("addlayer");
    },

    /**
    * @param {Array(OpenLayers.Layer)} layers
    */    
    addLayers: function (layers) {
        for (var i = 0; i <  layers.length; i++) {
            this.addLayer(layers[i]);
        }
    },

    /**
    * @param {OpenLayers.Control} control
    * @param {OpenLayers.Pixel} px
    */    
    addControl: function (control, px) {
        control.map = this;
        this.controls.push(control);
        var div = control.draw(px);
        if (div) {
            div.style.zIndex = this.Z_INDEX_BASE['Control'] +
                                this.controls.length;
            this.viewPortDiv.appendChild( div );
        }
    },

    /** 
    * @param {OpenLayers.Popup} popup
    */
    addPopup: function(popup) {
        popup.map = this;
        this.popups.push(popup);
        var popupDiv = popup.draw();
        if (popupDiv) {
            popupDiv.style.zIndex = this.Z_INDEX_BASE['Popup'] +
                                    this.popups.length;
            this.layerContainerDiv.appendChild(popupDiv);
        }
    },
    
    /** 
    * @param {OpenLayers.Popup} popup
    */
    removePopup: function(popup) {
        this.popups.remove(popup);
        if (popup.div) {
            this.layerContainerDiv.removeChild(popup.div);
        }
    },
        
    /**
    * @return {float}
    */
    getResolution: function () {
        // return degrees per pixel
        return this.maxResolution / Math.pow(2, this.zoom);
    },

    /**
    * @return {int}
    */
    getZoom: function () {
        return this.zoom;
    },

    /**
    * @returns {OpenLayers.Size}
    */
    getSize: function () {
        return this.size;
    },

    updateSize: function() {
        this.size = new OpenLayers.Size(
                    this.div.clientWidth, this.div.clientHeight);
        this.events.div.offsets = null;
        // Workaround for the fact that hidden elements return 0 for size.
        if (this.size.w == 0 && this.size.h == 0) {
            this.size.w = parseInt(this.div.style.width);
            this.size.h = parseInt(this.div.style.height);
        }
    },
    /**
    * @return {OpenLayers.LonLat}
    */
    getCenter: function () {
        return this.center;
    },

    /**
    * @return {OpenLayers.Bounds}
    */
    getExtent: function () {
        if (this.center) {
            var res = this.getResolution();
            var size = this.getSize();
            var w_deg = size.w * res;
            var h_deg = size.h * res;
            return new OpenLayers.Bounds(
                this.center.lon - w_deg / 2, 
                this.center.lat - h_deg / 2,
                this.center.lon + w_deg / 2,
                this.center.lat + h_deg / 2);
        } else {
            return null;
        }
    },

    /**
    * @return {OpenLayers.Bounds}
    */
    getFullExtent: function () {
        return this.maxExtent;
    },
    
    getZoomLevels: function() {
        return this.maxZoomLevel;
    },

    /**
    * @param {OpenLayers.Bounds} bounds
    *
    * @return {int}
    */
    getZoomForExtent: function (bounds) {
        var size = this.getSize();
        var width = bounds.getWidth();
        var height = bounds.getHeight();
        var deg_per_pixel = (width > height ? width / size.w : height / size.h);
        var zoom = Math.log(this.maxResolution / deg_per_pixel) / Math.log(2);
        return Math.floor(Math.max(zoom, 0)); 
    },
    
    /**
     * @param {OpenLayers.Pixel} layerPx
     * 
     * @returns px translated into screen pixel coordinates
     * @type OpenLayers.Pixel
     */
    getScreenPxFromLayerPx:function(layerPx) {
        var screenPx = layerPx.copyOf();

        screenPx.x += parseInt(this.layerContainerDiv.style.left);
        screenPx.y += parseInt(this.layerContainerDiv.style.top);

        return screenPx;
    },
    
    /**
     * @param {OpenLayers.Pixel} screenPx
     * 
     * @returns px translated into screen pixel coordinates
     * @type OpenLayers.Pixel
     */
    getLayerPxFromScreenPx:function(screenPx) {
        var layerPx = screenPx.copyOf();

        layerPx.x -= parseInt(this.layerContainerDiv.style.left);
        layerPx.y -= parseInt(this.layerContainerDiv.style.top);

        return layerPx;
    },


    /**
    * @param {OpenLayers.Pixel} px
    *
    * @return {OpenLayers.LonLat} 
    */
    getLonLatFromLayerPx: function (px) {
       //adjust for displacement of layerContainerDiv
       px = this.getScreenPxFromLayerPx(px);
       return this.getLonLatFromScreenPx(px);         
    },
    
    /**
    * @param {OpenLayers.Pixel} screenPx
    *
    * @returns An OpenLayers.LonLat which is the passed-in screen 
    *          OpenLayers.Pixel, translated into lon/lat given the 
    *          current extent and resolution
    * @type OpenLayers.LonLat
    */
    getLonLatFromScreenPx: function (screenPx) {
        var center = this.getCenter();        //map center lon/lat
        var res  = this.getResolution();
        var size = this.getSize();
    
        var delta_x = screenPx.x - (size.w / 2);
        var delta_y = screenPx.y - (size.h / 2);
        
        return new OpenLayers.LonLat(center.lon + delta_x * res ,
                                     center.lat - delta_y * res); 
    },

    /**
    * @param {OpenLayers.LonLat} lonlat
    *
    * @returns An OpenLayers.Pixel which is the passed-in OpenLayers.LonLat, 
    *          translated into layer pixels given the current extent 
    *          and resolution
    * @type OpenLayers.Pixel
    */
    getLayerPxFromLonLat: function (lonlat) {
       //adjust for displacement of layerContainerDiv
       var px = this.getScreenPxFromLonLat(lonlat);
       return this.getLayerPxFromScreenPx(px);         
    },

    /**
    * @param {OpenLayers.LonLat} lonlat
    *
    * @returns An OpenLayers.Pixel which is the passed-in OpenLayers.LonLat, 
    *          translated into screen pixels given the current extent 
    *          and resolution
    * @type OpenLayers.Pixel
    */
    getScreenPxFromLonLat: function (lonlat) {
        var resolution = this.getResolution();
        var extent = this.getExtent();
        return new OpenLayers.Pixel(
                       Math.round(1/resolution * (lonlat.lon - extent.left)),
                       Math.round(1/resolution * (extent.top - lonlat.lat))
                       );    
    },

    /**
    * @param {OpenLayers.LonLat} lonlat
    * @param {int} zoom
    */
    setCenter: function (lonlat, zoom) {
        if (this.center) { // otherwise there's nothing to move yet
            this.moveLayerContainer(lonlat);
        }
        this.center = lonlat.copyOf();
        var zoomChanged = null;
        if (zoom != null && zoom != this.zoom 
            && zoom >= 0 && zoom <= this.getZoomLevels()) {
            zoomChanged = (this.zoom == null ? 0 : this.zoom);
            this.zoom = zoom;
        }

        this.events.triggerEvent("movestart");
        this.moveToNewExtent(zoomChanged);
        this.events.triggerEvent("moveend");
    },
    
    /**
     * ZOOM TO BOUNDS FUNCTION
     */

    moveToNewExtent: function (zoomChanged) {
        if (zoomChanged != null) { // reset the layerContainerDiv's location
            this.layerContainerDiv.style.left = "0px";
            this.layerContainerDiv.style.top  = "0px";

            //redraw popups
            for (var i = 0; i < this.popups.length; i++) {
                this.popups[i].updatePosition();
            }

        }
        var bounds = this.getExtent();
        for (var i = 0; i < this.layers.length; i++) {
            this.layers[i].moveTo(bounds, (zoomChanged != null));
        }
        this.events.triggerEvent("move");
        if (zoomChanged != null)
            this.events.triggerEvent("zoomend", 
                {oldZoom: zoomChanged, newZoom: this.zoom});
    },

    /**
     * zoomIn
     * Increase zoom level by one.
     */
    zoomIn: function() {
        if (this.zoom != null && this.zoom <= this.getZoomLevels()) {
            this.zoomTo( this.zoom += 1 );
        }
        
    },
    
    /**
     * zoomTo
     * Set Zoom To int
     */
    zoomTo: function(zoom) {
       if (zoom >= 0 && zoom <= this.getZoomLevels()) {
            var oldZoom = this.zoom;
            this.zoom = zoom;
            this.moveToNewExtent(oldZoom);
       }
    },

    /**
     * zoomOut
     * Decrease zoom level by one.
     */
    zoomOut: function() {
        if (this.zoom != null && this.zoom > 0) {
            this.zoomTo( this.zoom - 1 );
        }
    },
    
    zoomExtent: function() {
        var fullExtent = this.getFullExtent();
        var oldZoom = this.zoom;
        this.setCenter(
          new OpenLayers.LonLat((fullExtent.left+fullExtent.right)/2,
                                (fullExtent.bottom+fullExtent.top)/2),
                                0
                               );
    },

    /**
    * @param {OpenLayers.LonLat} lonlat
    */
    moveLayerContainer: function (lonlat) {
        var container = this.layerContainerDiv;
        var resolution = this.getResolution();

        var deltaX = Math.round((this.center.lon - lonlat.lon) / resolution);
        var deltaY = Math.round((this.center.lat - lonlat.lat) / resolution);
     
        var offsetLeft = parseInt(container.style.left);
        var offsetTop  = parseInt(container.style.top);

        container.style.left = (offsetLeft + deltaX) + "px";
        container.style.top  = (offsetTop  - deltaY) + "px";
    },

    CLASS_NAME: "OpenLayers.Map"
};
