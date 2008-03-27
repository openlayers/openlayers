/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
  * full text of the license. */

/**
 * @requires OpenLayers/Rule.js
 */

/**
 * Class: OpenLayers.Rule.Comparison
 * This class represents the comparison rules, as being used for rule-based 
 * SLD styling
 * 
 * Inherits from
 * - <OpenLayers.Rule>
 */
OpenLayers.Rule.Comparison = OpenLayers.Class(OpenLayers.Rule, {

    /**
     * APIProperty: type
     * {String} type: type of the comparison. This is one of
     * - OpenLayers.Rule.Comparison.EQUAL_TO                 = "==";
     * - OpenLayers.Rule.Comparison.NOT_EQUAL_TO             = "!=";
     * - OpenLayers.Rule.Comparison.LESS_THAN                = "<";
     * - OpenLayers.Rule.Comparison.GREATER_THAN             = ">";
     * - OpenLayers.Rule.Comparison.LESS_THAN_OR_EQUAL_TO    = "<=";
     * - OpenLayers.Rule.Comparison.GREATER_THAN_OR_EQUAL_TO = ">=";
     * - OpenLayers.Rule.Comparison.BETWEEN                  = "..";
     * - OpenLayers.Rule.Comparison.LIKE                     = "~"; 
     */
    type: null,
    
    /**
     * APIProperty: property
     * {String}
     * name of the context property to compare
     */
    property: null,
    
    /**
     * APIProperty: value
     * {Number} or {String}
     * comparison value for binary comparisons. In the case of a String, this
     * can be a combination of text and propertyNames in the form
     * "literal ${propertyName}"
     */
    value: null,
    
    /**
     * APIProperty: lowerBoundary
     * {Number} or {String}
     * lower boundary for between comparisons. In the case of a String, this
     * can be a combination of text and propertyNames in the form
     * "literal ${propertyName}"
     */
    lowerBoundary: null,
    
    /**
     * APIProperty: upperBoundary
     * {Number} or {String}
     * upper boundary for between comparisons. In the case of a String, this
     * can be a combination of text and propertyNames in the form
     * "literal ${propertyName}"
     */
    upperBoundary: null,

    /** 
     * Constructor: OpenLayers.Rule.Comparison
     * Creates a comparison rule.
     *
     * Parameters:
     * params  - {Object} Hash of parameters for this rule:
     *              - 
     *              - value: 
     * options - {Object} An optional object with properties to set on the
     *           rule
     * 
     * Returns:
     * {<OpenLayers.Rule.Comparison>}
     */
    initialize: function(options) {
        OpenLayers.Rule.prototype.initialize.apply(this, [options]);
    },

    /**
     * APIMethod: evaluate
     * evaluates this rule for a specific context
     * 
     * Parameters:
     * context - {Object} context to apply the rule to.
     * 
     * Returns:
     * {boolean} true if the rule applies, false if it does not
     */
    evaluate: function(feature) {
        if (!OpenLayers.Rule.prototype.evaluate.apply(this, arguments)) {
            return false;
        }
        var context = this.getContext(feature);
        switch(this.type) {
            case OpenLayers.Rule.Comparison.EQUAL_TO:
            case OpenLayers.Rule.Comparison.LESS_THAN:
            case OpenLayers.Rule.Comparison.GREATER_THAN:
            case OpenLayers.Rule.Comparison.LESS_THAN_OR_EQUAL_TO:
            case OpenLayers.Rule.Comparison.GREATER_THAN_OR_EQUAL_TO:
                return this.binaryCompare(context, this.property, this.value);
            
            case OpenLayers.Rule.Comparison.BETWEEN:
                var result =
                        context[this.property] >= this.lowerBoundary;
                result = result &&
                        context[this.property] <= this.upperBoundary;
                return result;
            case OpenLayers.Rule.Comparison.LIKE:
                var regexp = new RegExp(this.value,
                                "gi");
                return regexp.test(context[this.property]); 
        }
    },
    
    /**
     * APIMethod: value2regex
     * Converts the value of this rule into a regular expression string,
     * according to the wildcard characters specified. This method has to
     * be called after instantiation of this class, if the value is not a
     * regular expression already.
     * 
     * Parameters:
     * wildCard   - {<Char>} wildcard character in the above value, default
     *              is "*"
     * singleChar - {<Char>) single-character wildcard in the above value
     *              default is "."
     * escape     - {<Char>) escape character in the above value, default is
     *              "!"
     * 
     * Returns:
     * {String} regular expression string
     */
    value2regex: function(wildCard, singleChar, escapeChar) {
        if (wildCard == ".") {
            var msg = "'.' is an unsupported wildCard character for "+
                    "OpenLayers.Rule.Comparison";
            OpenLayers.Console.error(msg);
            return null;
        }
        
        // set UMN MapServer defaults for unspecified parameters
        wildCard = wildCard ? wildCard : "*";
        singleChar = singleChar ? singleChar : ".";
        escapeChar = escapeChar ? escapeChar : "!";
        
        this.value = this.value.replace(
                new RegExp("\\"+escapeChar, "g"), "\\");
        this.value = this.value.replace(
                new RegExp("\\"+singleChar, "g"), ".");
        this.value = this.value.replace(
                new RegExp("\\"+wildCard, "g"), ".*");
        this.value = this.value.replace(
                new RegExp("\\\\.\\*", "g"), "\\"+wildCard);
        this.value = this.value.replace(
                new RegExp("\\\\\\.", "g"), "\\"+singleChar);
        
        return this.value;
    },
    
    /**
     * Method: regex2value
     * Convert the value of this rule from a regular expression string into an
     *     ogc literal string using a wildCard of *, a singleChar of ., and an
     *     escape of !.  Leaves the <value> property unmodified.
     * 
     * Returns:
     * {String} A string value.
     */
    regex2value: function() {
        
        var value = this.value;
        
        // replace ! with !!
        value = value.replace(/!/g, "!!");

        // replace \. with !. (watching out for \\.)
        value = value.replace(/(\\)?\\\./g, function($0, $1) {
            return $1 ? $0 : "!.";
        });
        
        // replace \* with #* (watching out for \\*)
        value = value.replace(/(\\)?\\\*/g, function($0, $1) {
            return $1 ? $0 : "!*";
        });
        
        // replace \\ with \
        value = value.replace(/\\\\/g, "\\");

        // convert .* to * (the sequence #.* is not allowed)
        value = value.replace(/\.\*/g, "*");
        
        return value;
    },

    /**
     * Function: binaryCompare
     * Compares a feature property to a rule value
     * 
     * Parameters:
     * context  - {Object}
     * property - {String} or {Number}
     * value    - {String} or {Number}, same as property
     * 
     * Returns:
     * {boolean}
     */
    binaryCompare: function(context, property, value) {
        switch (this.type) {
            case OpenLayers.Rule.Comparison.EQUAL_TO:
                return context[property] == value;
            case OpenLayers.Rule.Comparison.NOT_EQUAL_TO:
                return context[property] != value;
            case OpenLayers.Rule.Comparison.LESS_THAN:
                return context[property] < value;
            case OpenLayers.Rule.Comparison.GREATER_THAN:
                return context[property] > value;
            case OpenLayers.Rule.Comparison.LESS_THAN_OR_EQUAL_TO:
                return context[property] <= value;
            case OpenLayers.Rule.Comparison.GREATER_THAN_OR_EQUAL_TO:
                return context[property] >= value;
        }      
    },
    
    CLASS_NAME: "OpenLayers.Rule.Comparison"
});


OpenLayers.Rule.Comparison.EQUAL_TO                 = "==";
OpenLayers.Rule.Comparison.NOT_EQUAL_TO             = "!=";
OpenLayers.Rule.Comparison.LESS_THAN                = "<";
OpenLayers.Rule.Comparison.GREATER_THAN             = ">";
OpenLayers.Rule.Comparison.LESS_THAN_OR_EQUAL_TO    = "<=";
OpenLayers.Rule.Comparison.GREATER_THAN_OR_EQUAL_TO = ">=";
OpenLayers.Rule.Comparison.BETWEEN                  = "..";
OpenLayers.Rule.Comparison.LIKE                     = "~";
