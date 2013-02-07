/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/BaseTypes/Class.js
 */

/**
 * Class: OpenLayers.Symbolizer
 * Base class representing a symbolizer used for feature rendering.
 */
OpenLayers.Symbolizer = OpenLayers.Class({
    

    /**
     * APIProperty: zIndex
     * {Number} The zIndex determines the rendering order for a symbolizer.
     *     Symbolizers with larger zIndex values are rendered over symbolizers
     *     with smaller zIndex values.  Default is 0.
     */
    zIndex: 0,
    
    /**
     * Constructor: OpenLayers.Symbolizer
     * Instances of this class are not useful.  See one of the subclasses.
     *
     * Parameters:
     * config - {Object} An object containing properties to be set on the 
     *     symbolizer.  Any documented symbolizer property can be set at 
     *     construction.
     *
     * Returns:
     * A new symbolizer.
     */
    initialize: function(config) {
        OpenLayers.Util.extend(this, config);
    },
    
    /** 
     * APIMethod: clone
     * Create a copy of this symbolizer.
     *
     * Returns a symbolizer of the same type with the same properties.
     */
    clone: function() {
        var Type = eval(this.CLASS_NAME);
        return new Type(OpenLayers.Util.extend({}, this));
    },
    
    CLASS_NAME: "OpenLayers.Symbolizer"
    
});

