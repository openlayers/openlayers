/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Symbolizer.js
 */

/**
 * Class: OpenLayers.Symbolizer.Text
 * A symbolizer used to render text labels for features.
 */
OpenLayers.Symbolizer.Text = OpenLayers.Class(OpenLayers.Symbolizer, {
    
    /** 
     * APIProperty: label
     * {String} The text for the label.
     * 
     * No default set here.  Use OpenLayers.Renderer.defaultRenderer for defaults.
     */
    
    /** 
     * APIProperty: fontFamily
     * {String} The font family for the label.
     * 
     * No default set here.  Use OpenLayers.Renderer.defaultRenderer for defaults.
     */

    /** 
     * APIProperty: fontSize
     * {String} The font size for the label.
     * 
     * No default set here.  Use OpenLayers.Renderer.defaultRenderer for defaults.
     */

    /** 
     * APIProperty: fontWeight
     * {String} The font weight for the label.
     * 
     * No default set here.  Use OpenLayers.Renderer.defaultRenderer for defaults.
     */
    
    /**
     * Property: fontStyle
     * {String} The font style for the label.
     * 
     * No default set here.  Use OpenLayers.Renderer.defaultRenderer for defaults.
     */

    /**
     * Constructor: OpenLayers.Symbolizer.Text
     * Create a symbolizer for rendering text labels.
     *
     * Parameters:
     * config - {Object} An object containing properties to be set on the 
     *     symbolizer.  Any documented symbolizer property can be set at 
     *     construction.
     *
     * Returns:
     * A new text symbolizer.
     */
    initialize: function(config) {
        OpenLayers.Symbolizer.prototype.initialize.apply(this, arguments);
    },
    
    CLASS_NAME: "OpenLayers.Symbolizer.Text"
    
});

