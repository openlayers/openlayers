/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
  * full text of the license. */

/**
 * @requires OpenLayers/Filter.js
 */

/**
 * Class: OpenLayers.Filter.Comparison
 * This class represents a comparison filter.
 * 
 * Inherits from
 * - <OpenLayers.Filter>
 */
OpenLayers.Filter.Comparison = OpenLayers.Class(OpenLayers.Filter, {

    /**
     * APIProperty: type
     * {String} type: type of the comparison. This is one of
     * - OpenLayers.Filter.Comparison.EQUAL_TO                 = "==";
     * - OpenLayers.Filter.Comparison.NOT_EQUAL_TO             = "!=";
     * - OpenLayers.Filter.Comparison.LESS_THAN                = "<";
     * - OpenLayers.Filter.Comparison.GREATER_THAN             = ">";
     * - OpenLayers.Filter.Comparison.LESS_THAN_OR_EQUAL_TO    = "<=";
     * - OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO = ">=";
     * - OpenLayers.Filter.Comparison.BETWEEN                  = "..";
     * - OpenLayers.Filter.Comparison.LIKE                     = "~"; 
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
     * Constructor: OpenLayers.Filter.Comparison
     * Creates a comparison rule.
     *
     * Parameters:
     * options - {Object} An optional object with properties to set on the
     *           rule
     * 
     * Returns:
     * {<OpenLayers.Filter.Comparison>}
     */
    initialize: function(options) {
        OpenLayers.Filter.prototype.initialize.apply(this, [options]);
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
            case OpenLayers.Filter.Comparison.EQUAL_TO:
            case OpenLayers.Filter.Comparison.LESS_THAN:
            case OpenLayers.Filter.Comparison.GREATER_THAN:
            case OpenLayers.Filter.Comparison.LESS_THAN_OR_EQUAL_TO:
            case OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO:
                return this.binaryCompare(context, this.property, this.value);
            
            case OpenLayers.Filter.Comparison.BETWEEN:
                var result =
                        context[this.property] >= this.lowerBoundary;
                result = result &&
                        context[this.property] <= this.upperBoundary;
                return result;
            case OpenLayers.Filter.Comparison.LIKE:
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
                    "OpenLayers.Filter.Comparison";
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
     * {Boolean}
     */
    binaryCompare: function(context, property, value) {
        switch (this.type) {
            case OpenLayers.Filter.Comparison.EQUAL_TO:
                return context[property] == value;
            case OpenLayers.Filter.Comparison.NOT_EQUAL_TO:
                return context[property] != value;
            case OpenLayers.Filter.Comparison.LESS_THAN:
                return context[property] < value;
            case OpenLayers.Filter.Comparison.GREATER_THAN:
                return context[property] > value;
            case OpenLayers.Filter.Comparison.LESS_THAN_OR_EQUAL_TO:
                return context[property] <= value;
            case OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO:
                return context[property] >= value;
        }      
    },
    
    CLASS_NAME: "OpenLayers.Filter.Comparison"
});


OpenLayers.Filter.Comparison.EQUAL_TO                 = "==";
OpenLayers.Filter.Comparison.NOT_EQUAL_TO             = "!=";
OpenLayers.Filter.Comparison.LESS_THAN                = "<";
OpenLayers.Filter.Comparison.GREATER_THAN             = ">";
OpenLayers.Filter.Comparison.LESS_THAN_OR_EQUAL_TO    = "<=";
OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO = ">=";
OpenLayers.Filter.Comparison.BETWEEN                  = "..";
OpenLayers.Filter.Comparison.LIKE                     = "~";
