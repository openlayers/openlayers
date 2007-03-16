/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @class
 * 
 * Imlements a very simple button control.
 * @requires OpenLayers/Control.js
 */
OpenLayers.Control.ZoomToMaxExtent = OpenLayers.Class.create();
OpenLayers.Control.ZoomToMaxExtent.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Control, {
    /** @type OpenLayers.Control.TYPE_* */
    type: OpenLayers.Control.TYPE_BUTTON,
    
    trigger: function() {
        if (this.map) {
            this.map.zoomToMaxExtent();
        }    
    },
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control.ZoomToMaxExtent"
});
