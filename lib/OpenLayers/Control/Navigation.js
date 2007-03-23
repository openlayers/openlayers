/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @class
 * 
 * @requires OpenLayers/Control/ZoomBox.js
 * @requires OpenLayers/Control/DragPan.js
 * @requires OpenLayers/Handler/MouseWheel.js
 */
OpenLayers.Control.Navigation = OpenLayers.Class.create();
OpenLayers.Control.Navigation.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Control, {

    /** @type OpenLayers.Control.ZoomBox */
    dragPan: null,

    /** @type OpenLayers.Control.ZoomBox */
    zoomBox: null,

    /** @type OpenLayers.Handler.MouseWheel */
    wheelHandler: null,

    activate: function() {
        this.dragPan.activate();
        this.wheelHandler.activate();
        this.zoomBox.activate();
        return OpenLayers.Control.prototype.activate.apply(this,arguments);
    },

    deactivate: function() {
        this.zoomBox.deactivate();
        this.dragPan.deactivate();
        this.wheelHandler.deactivate();
        return OpenLayers.Control.prototype.deactivate.apply(this,arguments);
    },
    
    draw: function() {
        this.map.events.register( "dblclick", this, this.defaultDblClick );
        this.dragPan = new OpenLayers.Control.DragPan({map: this.map});
        this.zoomBox = new OpenLayers.Control.ZoomBox(
                    {map: this.map, keyMask: OpenLayers.Handler.MOD_SHIFT});
        this.dragPan.draw();
        this.zoomBox.draw();
        this.wheelHandler = new OpenLayers.Handler.MouseWheel(
                                    this, {"up"  : this.wheelUp,
                                           "down": this.wheelDown} );
        this.activate();
    },

    /**
    * @param {Event} evt
    */
    defaultDblClick: function (evt) {
        var newCenter = this.map.getLonLatFromViewPortPx( evt.xy ); 
        this.map.setCenter(newCenter, this.map.zoom + 1);
        OpenLayers.Event.stop(evt);
        return false;
    },

    wheelChange: function(evt, deltaZ) {
        console.log("wheel " + deltaZ);
        var newZoom = this.map.getZoom() + deltaZ;
        if (!this.map.isValidZoomLevel(newZoom)) return;

        var size    = this.map.getSize();
        var deltaX  = size.w/2 - evt.xy.x;
        var deltaY  = size.h/2 - evt.xy.y;
        var newRes  = map.baseLayer.resolutions[newZoom];
        var zoomPoint = this.map.getLonLatFromPixel(evt.xy);
        var newCenter = new OpenLayers.LonLat(
                            zoomPoint.lon + deltaX * newRes,
                            zoomPoint.lat - deltaY * newRes );
        console.log(newCenter.toString());
        this.map.setCenter( newCenter, newZoom );
    },

    /** User spun scroll wheel up
     * 
     */
    wheelUp: function(evt) {
        this.wheelChange(evt, 1);
    },

    /** User spun scroll wheel down
     * 
     */
    wheelDown: function(evt) {
        this.wheelChange(evt, -1);
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control.Navigation"
});
