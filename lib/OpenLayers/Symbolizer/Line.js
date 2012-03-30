/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Symbolizer.js
 */

/**
 * Class: OpenLayers.Symbolizer.Line
 * A symbolizer used to render line features.
 */
OpenLayers.Symbolizer.Line = OpenLayers.Class(OpenLayers.Symbolizer, {

    /**
     * APIProperty: strokeColor
     * {String} Color for line stroke.  This is a RGB hex value (e.g. "#ff0000"
     *     for red).  
     * 
     * No default set here.  Use OpenLayers.Renderer.defaultRenderer for defaults.
     */
    
    /**
     * APIProperty: strokeOpacity
     * {Number} Stroke opacity (0-1).
     * 
     * No default set here.  Use OpenLayers.Renderer.defaultRenderer for defaults.
     */
    
    /**
     * APIProperty: strokeWidth
     * {Number} Pixel stroke width.
     * 
     * No default set here.  Use OpenLayers.Renderer.defaultRenderer for defaults.
     */
    
    /**
     * APIProperty: strokeLinecap
     * {String} Stroke cap type ("butt", "round", or "square").
     * 
     * No default set here.  Use OpenLayers.Renderer.defaultRenderer for defaults.
     */
    
    /**
     * Property: strokeDashstyle
     * {String} Stroke dash style according to the SLD spec. Note that the
     *     OpenLayers values for strokeDashstyle ("dot", "dash", "dashdot",
     *     "longdash", "longdashdot", or "solid") will not work in SLD, but
     *     most SLD patterns will render correctly in OpenLayers.
     * 
     * No default set here.  Use OpenLayers.Renderer.defaultRenderer for defaults.
     */

    /**
     * Constructor: OpenLayers.Symbolizer.Line
     * Create a symbolizer for rendering lines.
     *
     * Parameters:
     * config - {Object} An object containing properties to be set on the 
     *     symbolizer.  Any documented symbolizer property can be set at 
     *     construction.
     *
     * Returns:
     * A new line symbolizer.
     */
    initialize: function(config) {
        OpenLayers.Symbolizer.prototype.initialize.apply(this, arguments);
    },
    
    CLASS_NAME: "OpenLayers.Symbolizer.Line"
    
});

