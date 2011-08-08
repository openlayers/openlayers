/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Filter.js
 * @requires OpenLayers/Console.js
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
     * Property: matchCase
     * {Boolean} Force case sensitive searches for EQUAL_TO and NOT_EQUAL_TO
     *     comparisons.  The Filter Encoding 1.1 specification added a matchCase
     *     attribute to ogc:PropertyIsEqualTo and ogc:PropertyIsNotEqualTo
     *     elements.  This property will be serialized with those elements only
     *     if using the v1.1.0 filter format. However, when evaluating filters
     *     here, the matchCase property will always be respected (for EQUAL_TO
     *     and NOT_EQUAL_TO).  Default is true. 
     */
    matchCase: true,
    
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
        // since matchCase on PropertyIsLike is not schema compliant, we only
        // want to use this if explicitly asked for
        if (this.type === OpenLayers.Filter.Comparison.LIKE 
            && options.matchCase === undefined) {
                this.matchCase = null;
        }
    },

    /**
     * APIMethod: evaluate
     * Evaluates this filter in a specific context.
     * 
     * Parameters:
     * context - {Object} Context to use in evaluating the filter.  If a vector
     *     feature is provided, the feature.attributes will be used as context.
     * 
     * Returns:
     * {Boolean} The filter applies.
     */
    evaluate: function(context) {
        if (context instanceof OpenLayers.Feature.Vector) {
            context = context.attributes;
        }
        var result = false;
        var got = context[this.property];
        var exp;
        switch(this.type) {
            case OpenLayers.Filter.Comparison.EQUAL_TO:
                exp = this.value;
                if(!this.matchCase &&
                   typeof got == "string" && typeof exp == "string") {
                    result = (got.toUpperCase() == exp.toUpperCase());
                } else {
                    result = (got == exp);
                }
                break;
            case OpenLayers.Filter.Comparison.NOT_EQUAL_TO:
                exp = this.value;
                if(!this.matchCase &&
                   typeof got == "string" && typeof exp == "string") {
                    result = (got.toUpperCase() != exp.toUpperCase());
                } else {
                    result = (got != exp);
                }
                break;
            case OpenLayers.Filter.Comparison.LESS_THAN:
                result = got < this.value;
                break;
            case OpenLayers.Filter.Comparison.GREATER_THAN:
                result = got > this.value;
                break;
            case OpenLayers.Filter.Comparison.LESS_THAN_OR_EQUAL_TO:
                result = got <= this.value;
                break;
            case OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO:
                result = got >= this.value;
                break;
            case OpenLayers.Filter.Comparison.BETWEEN:
                result = (got >= this.lowerBoundary) &&
                    (got <= this.upperBoundary);
                break;
            case OpenLayers.Filter.Comparison.LIKE:
                var regexp = new RegExp(this.value, "gi");
                result = regexp.test(got);
                break;
        }
        return result;
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
                new RegExp("\\"+escapeChar+"(.|$)", "g"), "\\$1");
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
     * APIMethod: clone
     * Clones this filter.
     * 
     * Returns:
     * {<OpenLayers.Filter.Comparison>} Clone of this filter.
     */
    clone: function() {
        return OpenLayers.Util.extend(new OpenLayers.Filter.Comparison(), this);
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
