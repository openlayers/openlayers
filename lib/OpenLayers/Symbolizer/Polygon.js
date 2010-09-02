/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Symbolizer.js
 */

/**
 * Class: OpenLayers.Symbolizer.Polygon
 * A symbolizer used to render line features.
 */
OpenLayers.Symbolizer.Polygon = OpenLayers.Class(OpenLayers.Symbolizer, {
    
    /**
     * APIProperty: strokeColor
     * {String} Color for line stroke.  This is a RGB hex value (e.g. "#ff0000"
     *     for red).
     */
    strokeColor: null,
    
    /**
     * APIProperty: strokeOpacity
     * {Number} Stroke opacity (0-1).
     */
    strokeOpacity: null,
    
    /**
     * APIProperty: strokeWidth
     * {Number} Pixel stroke width.
     */
    strokeWidth: null,
    
    /**
     * APIProperty: strokeLinecap
     * {String} Stroke cap type ("butt", "round", or "square").
     */
    strokeLinecap: null,
    
    /**
     * Property: strokeDashstyle
     * {String} Stroke dash style according to the SLD spec. Note that the
     *     OpenLayers values for strokeDashstyle ("dot", "dash", "dashdot",
     *     "longdash", "longdashdot", or "solid") will not work in SLD, but
     *     most SLD patterns will render correctly in OpenLayers.
     */
    strokeDashstyle: null,

    /**
     * APIProperty: fillColor
     * {String} RGB hex fill color (e.g. "#ff0000" for red).
     */
    fillColor: null,
    
    /**
     * APIProperty: fillOpacity
     * {Number} Fill opacity (0-1).
     */
    fillOpacity: null, 

    /**
     * Constructor: OpenLayers.Symbolizer.Polygon
     * Create a symbolizer for rendering polygons.
     *
     * Parameters:
     * config - {Object} An object containing properties to be set on the 
     *     symbolizer.  Any documented symbolizer property can be set at 
     *     construction.
     *
     * Returns:
     * A new polygon symbolizer.
     */
    initialize: function(config) {
        OpenLayers.Symbolizer.prototype.initialize.apply(this, arguments);
    },
    
    CLASS_NAME: "OpenLayers.Symbolizer.Polygon"
    
});

