/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @requires OpenLayers/Util.js
 * @requires OpenLayers/Style.js
 */

/**
 * Class: OpenLayers.Rule
 * This class represents a OGC Rule, as being used for rule-based SLD styling.
 */
OpenLayers.Rule = OpenLayers.Class({
    
    /**
     * APIProperty: name
     * {String} name of this rule
     */
    name: 'default',

    /**
     * Property: symbolizer
     * {Object} Hash of styles for this rule. Contains hashes of feature
     * styles. Keys are one or more of ["Point", "Line", "Polygon"]
     */
    symbolizer: null,
    
    /**
     * APIProperty: minScaleDenominator
     * {Number} or {String} minimum scale at which to draw the feature.
     * In the case of a String, this can be a combination of text and
     * propertyNames in the form "literal ${propertyName}"
     */
    minScaleDenominator: null,

    /**
     * APIProperty: maxScaleDenominator
     * {Number} or {String} maximum scale at which to draw the feature.
     * In the case of a String, this can be a combination of text and
     * propertyNames in the form "literal ${propertyName}"
     */
    maxScaleDenominator: null,
    
    /** 
     * Constructor: OpenLayers.Rule
     * Creates a Rule.
     *
     * Parameters:
     * options - {Object} An optional object with properties to set on the
     *           rule
     * 
     * Returns:
     * {<OpenLayers.Rule>}
     */
    initialize: function(options) {
        this.symbolizer = {};

        OpenLayers.Util.extend(this, options);
    },

    /** 
     * APIMethod: destroy
     * nullify references to prevent circular references and memory leaks
     */
    destroy: function() {
        for (var i in this.symbolizer) {
            this.symbolizer[i] = null;
        }
        this.symbolizer = null;
    },
    
    /**
     * APIMethod: evaluate
     * evaluates this rule for a specific feature
     * 
     * Parameters:
     * feature - {<OpenLayers.Feature>} feature to apply the rule to.
     * 
     * Returns:
     * {boolean} true if the rule applies, false if it does not.
     * This rule is the default rule and always returns true.
     */
    evaluate: function(feature) {
        // Default rule always applies. Subclasses will want to override this.
        return true;
    },
    
    CLASS_NAME: "OpenLayers.Rule"
});