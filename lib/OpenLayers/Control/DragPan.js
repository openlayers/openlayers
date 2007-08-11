/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Handler/Drag.js
 *
 * Class: OpenLayers.Control.DragPan
 * DragPan control.
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.DragPan = OpenLayers.Class(OpenLayers.Control, {

    /** 
     * Property: type
     * {OpenLayers.Control.TYPES}
     */
    type: OpenLayers.Control.TYPE_TOOL,
    
    /**
     * Method: draw
     * Creates a Drag handler, using <OpenLayers.Control.PanMap.panMap> and
     * <OpenLayers.Control.PanMap.panMapDone> as callbacks.
     */    
    draw: function() {
        this.handler = new OpenLayers.Handler.Drag( this,
                            {"move": this.panMap, "up": this.panMap} );
    },

    /**
    * Method: panMap
    *
    * Parameters:
    * xy - {<OpenLayers.Pixel>} Pixel of the up position
    */
    panMap: function (xy) {
        var deltaX = this.handler.last.x - xy.x;
        var deltaY = this.handler.last.y - xy.y;
        var size = this.map.getSize();
        var newXY = new OpenLayers.Pixel(size.w / 2 + deltaX,
                                         size.h / 2 + deltaY);
        var newCenter = this.map.getLonLatFromViewPortPx( newXY ); 
        this.map.setCenter(newCenter, null, this.handler.dragging);
    },

    CLASS_NAME: "OpenLayers.Control.DragPan"
});
