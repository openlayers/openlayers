/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */


/**
 * @requires OpenLayers/BaseTypes/Class.js
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
     * This class represents a generic filter.
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
     * Evaluates this filter in a specific context.  Instances or subclasses
     * are supposed to override this method.
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
     * Clones this filter. Should be implemented by subclasses.
     * 
     * Returns:
     * {<OpenLayers.Filter>} Clone of this filter.
     */
    clone: function() {
        return null;
    },
    
    /**
     * APIMethod: toString
     *
     * Returns:
     * {String} Include <OpenLayers.Format.CQL> in your build to get a CQL
     *     representation of the filter returned. Otherwise "[Object object]"
     *     will be returned.
     */
    toString: function() {
        var string;
        if (OpenLayers.Format && OpenLayers.Format.CQL) {
            string = OpenLayers.Format.CQL.prototype.write(this);
        } else {
            string = Object.prototype.toString.call(this);
        }
        return string;
    },
    
    CLASS_NAME: "OpenLayers.Filter"
});
