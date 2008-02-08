/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
  * full text of the license. */


/**
 * @requires OpenLayers/Rule.js
 */

/**
 * Class: OpenLayers.Rule.Logical
 * This class represents ogc:And, ogc:Or and ogc:Not rules.
 * 
 * Inherits from
 * - <OpenLayers.Rule>
 */
OpenLayers.Rule.Logical = OpenLayers.Class(OpenLayers.Rule, {

    /**
     * APIProperty: children
     * {Array(<OpenLayers.Rule>)} child rules for this rule
     */
    rules: null, 
     
    /**
     * APIProperty: type
     * {String} type of logical operator. Available types are:
     * - OpenLayers.Rule.Locical.AND = "&&";
     * - OpenLayers.Rule.Logical.OR  = "||";
     * - OpenLayers.Rule.Logical.NOT = "!";
     */
    type: null,

    /** 
     * Constructor: OpenLayers.Rule.Logical
     * Creates a logical rule (And, Or, Not).
     *
     * Parameters:
     * options - {Object} An optional object with properties to set on the
     *           rule
     * 
     * Returns:
     * {<OpenLayers.Rule.Logical>}
     */
    initialize: function(options) {
        this.rules = [];
        OpenLayers.Rule.prototype.initialize.apply(this, [options]);
    },
    
    /** 
     * APIMethod: destroy
     * nullify references to prevent circular references and memory leaks
     */
    destroy: function() {
        for (var i=0; i<this.rules.length; i++) {
            this.rules[i].destroy();
        }
        this.rules = null;
        OpenLayers.Rule.prototype.destroy.apply(this, arguments);
    },

    /**
     * APIMethod: evaluate
     * evaluates this rule for a specific feature
     * 
     * Parameters:
     * feature - {<OpenLayers.Feature>} feature to apply the rule to.
     * 
     * Returns:
     * {boolean} true if the rule applies, false if it does not
     */
    evaluate: function(feature) {
        if (!OpenLayers.Rule.prototype.evaluate.apply(this, arguments)) {
            return false;
        }
        switch(this.type) {
            case OpenLayers.Rule.Logical.AND:
                for (var i=0; i<this.rules.length; i++) {
                    if (this.rules[i].evaluate(feature) == false) {
                        return false;
                    }
                }
                return true;
                
            case OpenLayers.Rule.Logical.OR:
                for (var i=0; i<this.rules.length; i++) {
                    if (this.rules[i].evaluate(feature) == true) {
                        return true;
                    }
                }
                return false;
            
            case OpenLayers.Rule.Logical.NOT:
                return (!this.rules[0].evaluate(feature));
        }
    },
    
    CLASS_NAME: "OpenLayers.Rule.Logical"
});


OpenLayers.Rule.Logical.AND = "&&";
OpenLayers.Rule.Logical.OR  = "||";
OpenLayers.Rule.Logical.NOT = "!";
