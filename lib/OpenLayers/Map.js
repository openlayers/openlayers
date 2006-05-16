/**
* @class
*
*
*/

OpenLayers.Map = Class.create();
OpenLayers.Map.prototype = {
    // Hash: base z-indexes for different classes of thing 
    Z_INDEX_BASE: { Layer: 100, Popup: 200, Control: 250 },

    // int: zoom levels, used to draw zoom dragging control and limit zooming
    maxZoomLevel: 16,

    // OpenLayers.Bounds
    maxExtent: new OpenLayers.Bounds(-90, -180, 90, 180),

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

    // OpenLayers.LatLon
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

        this.div = $(div);

        this.viewPortDiv = OpenLayers.Util.createDiv(
                                div.id + "_OpenLayers_ViewPort" );
        this.viewPortDiv.style.width = "100%";
        this.viewPortDiv.style.height = "100%";
        this.viewPortDiv.style.overflow = "hidden";
        this.viewPortDiv.style.position = "relative";
        this.div.appendChild(this.viewPortDiv);

        this.controlDiv = OpenLayers.Util.createDiv(
                                div.id + "_OpenLayers_Control" );
        this.controlDiv.style.zIndex = this.Z_INDEX_BASE["Control"];
        this.viewPortDiv.appendChild(this.controlDiv);

        this.layerContainerDiv = OpenLayers.Util.createDiv(
                                div.id + "_OpenLayers_Container" );
        this.viewPortDiv.appendChild(this.layerContainerDiv);

        this.layers = [];
        
        this.controls = [];
        this.addControl( new OpenLayers.Control.PanZoom() );

        this.events = new OpenLayers.Events(this, div);
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
    * @return {OpenLayers.LatLon}
    */
    getCenter: function () {
        return this.center;
    },

    /**
    * @return {OpenLayers.Bounds}
    */
    getExtent: function () {
        var res = this.getResolution();
        var size = this.getSize();
        var w_deg = size.w * res;
        var h_deg = size.h * res;
        return new OpenLayers.Bounds(
            this.center.lat - h_deg / 2,
            this.center.lon - w_deg / 2, 
            this.center.lat + h_deg / 2,
            this.center.lon + w_deg / 2);
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
    * @return {OpenLayers.LatLon} 
    */
    getLatLonFromPixel: function (point) {
        var center = this.getCenter();        //map center lat/lon
        var res  = this.getResolution();
        var size = this.getSize();
    
        var delta_x = point.x - (size.w / 2);
        var delta_y = point.y - (size.h / 2);
        
        return new OpenLayers.LatLon( 
            center.lat - delta_y * res, 
            center.lon + delta_x * res );
    },

    /**
    * @param {OpenLayers.LatLon} latlon
    * @param {int} zoom
    */
    setCenter: function (latlon, zoom) {
        if (this.center) { // otherwise there's nothing to move yet
            this.moveLayerContainer(latlon);
        }
        this.center = latlon.copyOf();
        var zoomChanged = false;
        if (zoom != null) {
            if (this.zoom && zoom != this.zoom)
                zoomChanged = true;
            this.zoom = zoom;
        }

        this.moveToNewExtent(zoomChanged);
    },
    
    moveToNewExtent: function (zoomChanged) {
        if (zoomChanged) {
            this.layerContainerDiv.style.left = "0px";
            this.layerContainerDiv.style.top  = "0px";
        }
        var bounds = this.getExtent();
        for (var i = 0; i < this.layers.length; i++) {
            this.layers[i].moveTo(bounds, zoomChanged);
        }
    },

    /**
     * zoomIn
     * Increase zoom level by one.
     */
    zoomIn: function() {
        if (this.zoom != null && this.zoom <= this.getZoomLevels()) {
            this.zoom += 1;
            this.moveToNewExtent(true);
        }
        
    },
    
    /**
     * zoomTo
     * Set Zoom To int
     */
    zoomTo: function(zoom) {
       if (zoom >= 0 && zoom <= this.getZoomLevels()) {
            this.zoom = zoom;
            this.moveToNewExtent(true);
       }
    },

    /**
     * zoomOut
     * Decrease zoom level by one.
     */
    zoomOut: function() {
        if (this.zoom != null && this.zoom > 0) {
            this.zoom -= 1;
            this.moveToNewExtent(true);
        }
    },
    
    zoomExtent: function() {
        var fullExtent = this.getFullExtent();
        
        this.zoom = this.getZoomForExtent( fullExtent );
        this.setCenter(
          new OpenLayers.LatLon(
            (fullExtent.minlat+fullExtent.maxlat)/2, 
            (fullExtent.minlon+fullExtent.maxlon)/2
          )
        );
        this.moveToNewExtent(true);
        
    },

    /**
    * @param {OpenLayers.LatLon} latlon
    */
    moveLayerContainer: function (latlon) {
        var container = this.layerContainerDiv;
        var resolution = this.getResolution();

        var deltaX = Math.round((this.center.lon - latlon.lon) / resolution);
        var deltaY = Math.round((this.center.lat - latlon.lat) / resolution);
     
        var offsetLeft = parseInt(container.style.left);
        var offsetTop  = parseInt(container.style.top);

        container.style.left = (offsetLeft + deltaX) + "px";
        container.style.top  = (offsetTop  - deltaY) + "px";
    },

    /**
    * @param {Event} evt
    */
    defaultDblClick: function (evt) {
        var newCenter = this.getLatLonFromPixel( evt.xy ); 
        this.zoomIn();
        this.setCenter(newCenter);
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
            var newCenter = this.getLatLonFromPixel( newXY ); 
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
