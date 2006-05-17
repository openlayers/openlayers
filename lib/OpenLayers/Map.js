/**
* @class
*
*
*/

OpenLayers.Map = Class.create();
OpenLayers.Map.prototype = {
    // Hash: base z-indexes for different classes of thing 
    Z_INDEX_BASE: { Layer: 100, Popup: 200, Control: 250 },

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

    /* maxScale was determined empirically by finding the resolution
       of GMaps in degrees per pixel at zoom level 0. */
    // float
    maxResolution: .3515625, // degrees per pixel

    // DOMElement: the div that our map lives in
    div: null,

    // HTMLDivElement: the map's control layer
    controlDiv: null,

    // HTMLDivElement: the map's view port             
    viewPortDiv: null,

    // HTMLDivElement: the map's layer container
    layerContainerDiv: null,

    // Array(OpenLayers.Layer): ordered list of layers in the map
    layers: null,

    // Array(OpenLayers.Control)
    controls: null,

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
        this.viewPortDiv = OpenLayers.Util.createDiv(
                                div.id + "_OpenLayers_ViewPort" );
        this.viewPortDiv.style.width = "100%";
        this.viewPortDiv.style.height = "100%";
        this.viewPortDiv.style.overflow = "hidden";
        this.viewPortDiv.style.position = "relative";
        this.div.appendChild(this.viewPortDiv);

        // the controlDiv is the div that all the controls sit on
        this.controlDiv = OpenLayers.Util.createDiv(
                                div.id + "_OpenLayers_Control" );
        this.controlDiv.style.width="100%";
        this.controlDiv.style.height="100%";
        this.controlDiv.style.zIndex = this.Z_INDEX_BASE["Control"];
        this.viewPortDiv.appendChild(this.controlDiv);

        // the layerContainerDiv is the one that holds all the layers
        this.layerContainerDiv = OpenLayers.Util.createDiv(
                                div.id + "_OpenLayers_Container" );
        this.viewPortDiv.appendChild(this.layerContainerDiv);

        this.events = new OpenLayers.Events(this, div, this.EVENT_TYPES);

        this.layers = [];
        
        this.controls = [];
        this.addControl( new OpenLayers.Control.PanZoom() );

        this.events.register( "dblclick", this, this.defaultDblClick );
        this.events.register( "mousedown", this, this.defaultMouseDown );
        this.events.register( "mouseup", this, this.defaultMouseUp );
        this.events.register( "mousemove", this, this.defaultMouseMove );

        // always call map.destroy()
        Event.observe(window, 'unload', 
            this.destroy.bindAsEventListener(this));
    },

    /**
    */
    destroy:function() {
        for(var i=0; i< this.layers.length; i++) {
            this.layers[i].destroy();
        } 
        this.layers = null;
        for(var i=0; i< this.controls.length; i++) {
            this.controls[i].destroy();
        } 
        this.controls = null;
    },

    /**
    * @param {OpenLayers.Layer} layer
    */    
    addLayer: function (layer) {
        layer.map = this;
        layer.div.style.overflow = "";
        layer.div.style.zIndex = this.Z_INDEX_BASE['Layer'] + this.layers.length;
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
    */    
    addControl: function (control) {
        control.map = this;
        this.controls.push(control);
        this.controlDiv.appendChild( control.draw() );
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
        // should this be cached?
        return new OpenLayers.Size(
                    this.div.clientWidth, this.div.clientHeight);
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
        var deg_per_pixel = bounds.width / size.w;
        var zoom = Math.log(deg_per_pixel / this.maxResolution) / Math.log(2);
        return Math.floor(Math.max(zoom, 0)); 
    },
    
    /**
    * @param {OpenLayers.Pixel} point
    *
    * @return {OpenLayers.LonLat} 
    */
    getLonLatFromPixel: function (point) {
        var center = this.getCenter();        //map center lon/lat
        var res  = this.getResolution();
        var size = this.getSize();
    
        var delta_x = point.x - (size.w / 2);
        var delta_y = point.y - (size.h / 2);
        
        return new OpenLayers.LonLat(center.lon + delta_x * res ,
                                     center.lat - delta_y * res); 
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
    
    moveToNewExtent: function (zoomChanged) {
        if (zoomChanged != null) { // reset the layerContainerDiv's location
            this.layerContainerDiv.style.left = "0px";
            this.layerContainerDiv.style.top  = "0px";
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
        this.zoom = this.getZoomForExtent( fullExtent );
        this.setCenter(
          new OpenLayers.LonLat((fullExtent.minlon+fullExtent.maxlon)/2,
                                (fullExtent.minlat+fullExtent.maxlat)/2)
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

    /**
    * @param {Event} evt
    */
    defaultDblClick: function (evt) {
        var newCenter = this.getLonLatFromPixel( evt.xy ); 
        this.setCenter(newCenter, this.zoom + 1);
    },

    /**
    * @param {Event} evt
    */
    defaultMouseDown: function (evt) {
        this.mouseDragStart = evt.xy.copyOf();
        this.div.style.cursor = "move";
        Event.stop(evt);
    },

    /**
    * @param {Event} evt
    */
    defaultMouseMove: function (evt) {
        if (this.mouseDragStart != null) {
            var deltaX = this.mouseDragStart.x - evt.xy.x;
            var deltaY = this.mouseDragStart.y - evt.xy.y
            var size = this.getSize();
            var newXY = new OpenLayers.Pixel(size.w / 2 + deltaX,
                                             size.h / 2 + deltaY);
            var newCenter = this.getLonLatFromPixel( newXY ); 
            this.setCenter(newCenter);
            this.mouseDragStart = evt.xy.copyOf();
        }
    },

    /**
    * @param {Event} evt
    */
    defaultMouseUp: function (evt) {
        this.mouseDragStart = null;
        this.div.style.cursor = "default";
    }
};
