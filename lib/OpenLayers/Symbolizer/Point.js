/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Symbolizer.js
 */

/**
 * Class: OpenLayers.Symbolizer.Point
 * A symbolizer used to render point features.
 */
OpenLayers.Symbolizer.Point = OpenLayers.Class(OpenLayers.Symbolizer, {
    
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
     * APIProperty: fillColor
     * {String} RGB hex fill color (e.g. "#ff0000" for red).
     * 
     * No default set here.  Use OpenLayers.Renderer.defaultRenderer for defaults.
     */
    
    /**
     * APIProperty: fillOpacity
     * {Number} Fill opacity (0-1).
     * 
     * No default set here.  Use OpenLayers.Renderer.defaultRenderer for defaults.
     */

    /**
     * APIProperty: pointRadius
     * {Number} Pixel point radius.
     * 
     * No default set here.  Use OpenLayers.Renderer.defaultRenderer for defaults.
     */

    /**
     * APIProperty: externalGraphic
     * {String} Url to an external graphic that will be used for rendering 
     *     points.
     * 
     * No default set here.  Use OpenLayers.Renderer.defaultRenderer for defaults.
     */
    
    /**
     * APIProperty: graphicWidth
     * {Number} Pixel width for sizing an external graphic.
     * 
     * No default set here.  Use OpenLayers.Renderer.defaultRenderer for defaults.
     */
    
    /**
     * APIProperty: graphicHeight
     * {Number} Pixel height for sizing an external graphic.
     * 
     * No default set here.  Use OpenLayers.Renderer.defaultRenderer for defaults.
     */
    
    /**
     * APIProperty: graphicOpacity
     * {Number} Opacity (0-1) for an external graphic.
     * 
     * No default set here.  Use OpenLayers.Renderer.defaultRenderer for defaults.
     */
    
    /**
     * APIProperty: graphicXOffset
     * {Number} Pixel offset along the positive x axis for displacing an 
     *     external graphic.
     * 
     * No default set here.  Use OpenLayers.Renderer.defaultRenderer for defaults.
     */
    
    /**
     * APIProperty: graphicYOffset
     * {Number} Pixel offset along the positive y axis for displacing an 
     *     external graphic.
     * 
     * No default set here.  Use OpenLayers.Renderer.defaultRenderer for defaults.
     */

    /**
     * APIProperty: rotation
     * {Number} The rotation of a graphic in the clockwise direction about its 
     *     center point (or any point off center as specified by 
     *     <graphicXOffset> and <graphicYOffset>).
     * 
     * No default set here.  Use OpenLayers.Renderer.defaultRenderer for defaults.
     */
    
    /**
     * APIProperty: graphicName
     * {String} Named graphic to use when rendering points.  Supported values 
     *     include "circle", "square", "star", "x", "cross", and "triangle".
     * 
     * No default set here.  Use OpenLayers.Renderer.defaultRenderer for defaults.
     */
    
    /**
     * Constructor: OpenLayers.Symbolizer.Point
     * Create a symbolizer for rendering points.
     *
     * Parameters:
     * config - {Object} An object containing properties to be set on the 
     *     symbolizer.  Any documented symbolizer property can be set at 
     *     construction.
     *
     * Returns:
     * A new point symbolizer.
     */
    initialize: function(config) {
        OpenLayers.Symbolizer.prototype.initialize.apply(this, arguments);
    },
    
    CLASS_NAME: "OpenLayers.Symbolizer.Point"
    
});

