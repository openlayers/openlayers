/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
  * full text of the license. */


/**
 * @requires OpenLayers/Filter.js
 */

/**
 * Class: OpenLayers.Filter.Logical
 * This class represents ogc:And, ogc:Or and ogc:Not rules.
 * 
 * Inherits from
 * - <OpenLayers.Filter>
 */
OpenLayers.Filter.Logical = OpenLayers.Class(OpenLayers.Filter, {

    /**
     * APIProperty: filters
     * {Array(<OpenLayers.Filter>)} Child filters for this filter.
     */
    filters: null, 
     
    /**
     * APIProperty: type
     * {String} type of logical operator. Available types are:
     * - OpenLayers.Filter.Locical.AND = "&&";
     * - OpenLayers.Filter.Logical.OR  = "||";
     * - OpenLayers.Filter.Logical.NOT = "!";
     */
    type: null,

    /** 
     * Constructor: OpenLayers.Filter.Logical
     * Creates a logical filter (And, Or, Not).
     *
     * Parameters:
     * options - {Object} An optional object with properties to set on the
     *     filter.
     * 
     * Returns:
     * {<OpenLayers.Filter.Logical>}
     */
    initialize: function(options) {
        this.filters = [];
        OpenLayers.Filter.prototype.initialize.apply(this, [options]);
    },
    
    /** 
     * APIMethod: destroy
     * Remove reference to child filters.
     */
    destroy: function() {
        this.filters = null;
        OpenLayers.Filter.prototype.destroy.apply(this);
    },

    /**
     * APIMethod: evaluate
     * Evaluates this filter in a specific context.  Should be implemented by
     *     subclasses.
     * 
     * Parameters:
     * context - {Object} Context to use in evaluating the filter.
     * 
     * Returns:
     * {Boolean} The filter applies.
     */
    evaluate: function(context) {
        switch(this.type) {
            case OpenLayers.Filter.Logical.AND:
                for (var i=0; i<this.filters.length; i++) {
                    if (this.filters[i].evaluate(context) == false) {
                        return false;
                    }
                }
                return true;
                
            case OpenLayers.Filter.Logical.OR:
                for (var i=0; i<this.filters.length; i++) {
                    if (this.filters[i].evaluate(context) == true) {
                        return true;
                    }
                }
                return false;
            
            case OpenLayers.Filter.Logical.NOT:
                return (!this.filters[0].evaluate(context));
        }
    },
    
    CLASS_NAME: "OpenLayers.Filter.Logical"
});


OpenLayers.Filter.Logical.AND = "&&";
OpenLayers.Filter.Logical.OR  = "||";
OpenLayers.Filter.Logical.NOT = "!";
