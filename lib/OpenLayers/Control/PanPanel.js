/**
 * @requires OpenLayers/Control/Panel.js
 * @requires OpenLayers/Control/Pan.js
 */

/**
 * Class: OpenLayers.Control.PanPanel
 */
OpenLayers.Control.PanPanel = OpenLayers.Class(OpenLayers.Control.Panel, {

    /**
     * Constructor: OpenLayers.Control.PanPanel 
     * Add the four directional pan buttons.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be used
     *     to extend the control.
     */
    initialize: function(options) {
        OpenLayers.Control.Panel.prototype.initialize.apply(this, [options]);
        this.addControls([
            new OpenLayers.Control.Pan(OpenLayers.Control.Pan.NORTH),
            new OpenLayers.Control.Pan(OpenLayers.Control.Pan.SOUTH),
            new OpenLayers.Control.Pan(OpenLayers.Control.Pan.EAST),
            new OpenLayers.Control.Pan(OpenLayers.Control.Pan.WEST)
        ]);
    },

    CLASS_NAME: "OpenLayers.Control.PanPanel"
});
