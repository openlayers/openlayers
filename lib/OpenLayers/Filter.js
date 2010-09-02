/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Util.js
 * @requires OpenLayers/Style.js
 */

/**
 * Class: OpenLayers.Filter
 * This class represents an OGC Filter.
 */
OpenLayers.Filter = OpenLayers.Class({
    
    /** 
     * Constructor: OpenLayers.Filter
     * This is an abstract class.  Create an instance of a filter subclass.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     * 
     * Returns:
     * {<OpenLayers.Filter>}
     */
    initialize: function(options) {
        OpenLayers.Util.extend(this, options);
    },

    /** 
     * APIMethod: destroy
     * Remove reference to anything added.
     */
    destroy: function() {
    },

    /**
     * APIMethod: evaluate
     * Evaluates this filter in a specific context.  Should be implemented by
     *     subclasses.
     * 
     * Parameters:
     * context - {Object} Context to use in evaluating the filter.  If a vector
     *     feature is provided, the feature.attributes will be used as context.
     * 
     * Returns:
     * {Boolean} The filter applies.
     */
    evaluate: function(context) {
        return true;
    },
    
    /**
     * APIMethod: clone
     * Clones this filter. Should be implementted by subclasses.
     * 
     * Returns:
     * {<OpenLayers.Filter>} Clone of this filter.
     */
    clone: function() {
        return null;
    },
    
    CLASS_NAME: "OpenLayers.Filter"
});
