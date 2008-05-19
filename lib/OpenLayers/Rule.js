/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @requires OpenLayers/Util.js
 * @requires OpenLayers/Style.js
 */

/**
 * Class: OpenLayers.Rule
 * This class represents an SLD Rule, as being used for rule-based SLD styling.
 */
OpenLayers.Rule = OpenLayers.Class({
    
    /**
     * Property: id
     * {String} A unique id for this session.
     */
    id: null,
    
    /**
     * APIProperty: name
     * {String} name of this rule
     */
    name: 'default',
    
    /**
     * Property: title
     * {String} Title of this rule (set if included in SLD)
     */
    title: null,
    
    /**
     * Property: description
     * {String} Description of this rule (set if abstract is included in SLD)
     */
    description: null,

    /**
     * Property: context
     * {Object} An optional object with properties that the rule should be
     * evaluated against. If no context is specified, feature.attributes will
     * be used.
     */
    context: null,
    
    /**
     * Property: filter
     * {<OpenLayers.Filter>} Optional filter for the rule.
     */
    filter: null,

    /**
     * Property: elseFilter
     * {Boolean} Determines whether this rule is only to be applied only if
     * no other rules match (ElseFilter according to the SLD specification). 
     * Default is false.  For instances of OpenLayers.Rule, if elseFilter is
     * false, the rule will always apply.  For subclasses, the else property is 
     * ignored.
     */
    elseFilter: false,
    
    /**
     * Property: symbolizer
     * {Object} Symbolizer or hash of symbolizers for this rule. If hash of
     * symbolizers, keys are one or more of ["Point", "Line", "Polygon"]. The
     * latter if useful if it is required to style e.g. vertices of a line
     * with a point symbolizer. Note, however, that this is not implemented
     * yet in OpenLayers, but it is the way how symbolizers are defined in
     * SLD.
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
        this.id = OpenLayers.Util.createUniqueID(this.CLASS_NAME + "_");
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
     * {Boolean} true if the rule applies, false if it does not.
     * This rule is the default rule and always returns true.
     */
    evaluate: function(feature) {
        var context = this.getContext(feature);
        var applies = true;

        if (this.minScaleDenominator || this.maxScaleDenominator) {
            var scale = feature.layer.map.getScale();
        }
        
        // check if within minScale/maxScale bounds
        if (this.minScaleDenominator) {
            applies = scale >= OpenLayers.Style.createLiteral(
                    this.minScaleDenominator, context);
        }
        if (applies && this.maxScaleDenominator) {
            applies = scale < OpenLayers.Style.createLiteral(
                    this.maxScaleDenominator, context);
        }
        
        // check if optional filter applies
        if(applies && this.filter) {
            // feature id filters get the feature, others get the context
            if(this.filter.CLASS_NAME == "OpenLayers.Filter.FeatureId") {
                applies = this.filter.evaluate(feature);
            } else {
                applies = this.filter.evaluate(context);
            }
        }

        return applies;
    },
    
    /**
     * Method: getContext
     * Gets the context for evaluating this rule
     * 
     * Paramters:
     * feature - {<OpenLayers.Feature>} feature to take the context from if
     *           none is specified.
     */
    getContext: function(feature) {
        var context = this.context;
        if (!context) {
            context = feature.attributes || feature.data;
        }
        if (typeof this.context == "function") {
            context = this.context(feature);
        }
        return context;
    },
        
    CLASS_NAME: "OpenLayers.Rule"
});