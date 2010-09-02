/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

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
     * APIProperty: slideFactor
     * {Integer} Number of pixels by which we'll pan the map in any direction 
     *     on clicking the arrow buttons, defaults to 50.
     */
    slideFactor: 50,

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
            new OpenLayers.Control.Pan(OpenLayers.Control.Pan.NORTH,
                                       {slideFactor: this.slideFactor}),
            new OpenLayers.Control.Pan(OpenLayers.Control.Pan.SOUTH,
                                       {slideFactor: this.slideFactor}),
            new OpenLayers.Control.Pan(OpenLayers.Control.Pan.EAST,
                                       {slideFactor: this.slideFactor}),
            new OpenLayers.Control.Pan(OpenLayers.Control.Pan.WEST,
                                       {slideFactor: this.slideFactor})
        ]);
    },

    CLASS_NAME: "OpenLayers.Control.PanPanel"
});
