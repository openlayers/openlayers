/**
 * @requires OpenLayers/Control/Panel.js
 * @requires OpenLayers/Control/Pan.js
 */

/**
 * Class: OpenLayers.Control.PanPanel
 * The PanPanel is visible control for panning the map North, South, East or
 * West in small steps. By default it is drawn in the top left corner of the
 * map.
 *
 * Note: 
 * If you wish to use this class with the default images and you want 
 *       it to look nice in ie6, you should add the following, conditionally
 *       added css stylesheet to your HTML file:
 * 
 * (code)
 * <!--[if lte IE 6]>
 *   <link rel="stylesheet" href="../theme/default/ie6-style.css" type="text/css" />
 * <![endif]-->
 * (end)
 *
 * Inherits from:
 *  - <OpenLayers.Control.Panel> 
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
