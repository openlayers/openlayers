/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */


/**
 * @requires OpenLayers/Filter.js
 */

/**
 * Class: OpenLayers.Filter.Logical
 * This class represents ogc:And, ogc:Or and ogc:Not rules.
 * 
 * Inherits from:
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
     * - OpenLayers.Filter.Logical.AND = "&&";
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
     * Evaluates this filter in a specific context.
     * 
     * Parameters:
     * context - {Object} Context to use in evaluating the filter.  A vector
     *     feature may also be provided to evaluate feature attributes in 
     *     comparison filters or geometries in spatial filters.
     * 
     * Returns:
     * {Boolean} The filter applies.
     */
    evaluate: function(context) {
        var i, len;
        switch(this.type) {
            case OpenLayers.Filter.Logical.AND:
                for (i=0, len=this.filters.length; i<len; i++) {
                    if (this.filters[i].evaluate(context) == false) {
                        return false;
                    }
                }
                return true;
                
            case OpenLayers.Filter.Logical.OR:
                for (i=0, len=this.filters.length; i<len; i++) {
                    if (this.filters[i].evaluate(context) == true) {
                        return true;
                    }
                }
                return false;
            
            case OpenLayers.Filter.Logical.NOT:
                return (!this.filters[0].evaluate(context));
        }
        return undefined;
    },
    
    /**
     * APIMethod: clone
     * Clones this filter.
     * 
     * Returns:
     * {<OpenLayers.Filter.Logical>} Clone of this filter.
     */
    clone: function() {
        var filters = [];        
        for(var i=0, len=this.filters.length; i<len; ++i) {
            filters.push(this.filters[i].clone());
        }
        return new OpenLayers.Filter.Logical({
            type: this.type,
            filters: filters
        });
    },
    
    CLASS_NAME: "OpenLayers.Filter.Logical"
});


OpenLayers.Filter.Logical.AND = "&&";
OpenLayers.Filter.Logical.OR  = "||";
OpenLayers.Filter.Logical.NOT = "!";
