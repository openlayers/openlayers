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
OpenLayers.Control.DragPan = OpenLayers.Class.create();
OpenLayers.Control.DragPan.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Control, {

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
                            {"move": this.panMap, "up": this.panMapDone } );
    },

    /**
    * Method: panMap
    *
    * Parameters:
    * xy - {<OpenLayers.Pixel>} Pixel of the up position
    */
    panMap: function (xy) {
        var deltaX = this.handler.start.x - xy.x;
        var deltaY = this.handler.start.y - xy.y;
        var size = this.map.getSize();
        var newXY = new OpenLayers.Pixel(size.w / 2 + deltaX,
                                         size.h / 2 + deltaY);
        var newCenter = this.map.getLonLatFromViewPortPx( newXY ); 
        this.map.setCenter(newCenter, null, true);
        // this assumes xy won't be changed inside Handler.Drag
        // a safe bet for now, and saves us the extra call to clone().
        this.handler.start = xy;
    },
    
    /**
    * Method: panMapDone
    * 
    * Parameters:
    * xy - {<OpenLayers.Pixel>} Pixel of the up position
    */
    panMapDone: function (xy) {
        var deltaX = this.handler.start.x - xy.x;
        var deltaY = this.handler.start.y - xy.y;
        var size = this.map.getSize();
        var newXY = new OpenLayers.Pixel(size.w / 2 + deltaX,
                                         size.h / 2 + deltaY);
        var newCenter = this.map.getLonLatFromViewPortPx( newXY ); 
        this.map.setCenter(newCenter, null, false);
        // this assumes xy won't be changed inside Handler.Drag
        // a safe bet for now, and saves us the extra call to clone().
        this.handler.start = xy;
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control.DragPan"
});
