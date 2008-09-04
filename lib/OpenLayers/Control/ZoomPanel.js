/**
 * @requires OpenLayers/Control/Panel.js
 * @requires OpenLayers/Control/ZoomIn.js
 * @requires OpenLayers/Control/ZoomOut.js
 * @requires OpenLayers/Control/ZoomToMaxExtent.js
 */

/**
 * Class: OpenLayers.Control.ZoomPanel
 */
OpenLayers.Control.ZoomPanel = OpenLayers.Class(OpenLayers.Control.Panel, {

    /**
     * Constructor: OpenLayers.Control.ZoomPanel 
     * Add the three zooming controls.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be used
     *     to extend the control.
     */
    initialize: function(options) {
        OpenLayers.Control.Panel.prototype.initialize.apply(this, [options]);
        this.addControls([
            new OpenLayers.Control.ZoomIn(),
            new OpenLayers.Control.ZoomToMaxExtent(),
            new OpenLayers.Control.ZoomOut()
        ]);
    },

    CLASS_NAME: "OpenLayers.Control.ZoomPanel"
});
