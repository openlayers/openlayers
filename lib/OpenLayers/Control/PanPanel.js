/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
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
     *     on clicking the arrow buttons, defaults to 50.  If you want to pan
     *     by some ratio of the map dimensions, use <slideRatio> instead.
     */
    slideFactor: 50,

    /** 
     * APIProperty: slideRatio
     * {Number} The fraction of map width/height by which we'll pan the map            
     *     on clicking the arrow buttons.  Default is null.  If set, will
     *     override <slideFactor>. E.g. if slideRatio is .5, then Pan Up will
     *     pan up half the map height. 
     */
    slideRatio: null,

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
        var options = {
            slideFactor: this.slideFactor,
            slideRatio: this.slideRatio
        };
        this.addControls([
            new OpenLayers.Control.Pan(OpenLayers.Control.Pan.NORTH, options),
            new OpenLayers.Control.Pan(OpenLayers.Control.Pan.SOUTH, options),
            new OpenLayers.Control.Pan(OpenLayers.Control.Pan.EAST, options),
            new OpenLayers.Control.Pan(OpenLayers.Control.Pan.WEST, options)
        ]);
    },

    CLASS_NAME: "OpenLayers.Control.PanPanel"
});
