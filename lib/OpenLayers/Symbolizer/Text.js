/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
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
     */
    label: null,
    
    /** 
     * APIProperty: fontFamily
     * {String} The font family for the label.
     */
    fontFamily: null,

    /** 
     * APIProperty: fontSize
     * {String} The font size for the label.
     */
    fontSize: null,

    /** 
     * APIProperty: fontWeight
     * {String} The font weight for the label.
     */
    fontWeight: null,
    
    /**
     * Property: fontStyle
     * {String} The font style for the label.
     */
    fontStyle: null,

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

