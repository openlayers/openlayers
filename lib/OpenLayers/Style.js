/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */


/**
 * @requires OpenLayers/BaseTypes/Class.js
 * @requires OpenLayers/Util.js
 * @requires OpenLayers/Feature/Vector.js
 */

/**
 * Class: OpenLayers.Style
 * This class represents a UserStyle obtained
 *     from a SLD, containing styling rules.
 */
OpenLayers.Style = OpenLayers.Class({

    /**
     * Property: id
     * {String} A unique id for this session.
     */
    id: null,
    
    /**
     * APIProperty: name
     * {String}
     */
    name: null,
    
    /**
     * Property: title
     * {String} Title of this style (set if included in SLD)
     */
    title: null,
    
    /**
     * Property: description
     * {String} Description of this style (set if abstract is included in SLD)
     */
    description: null,

    /**
     * APIProperty: layerName
     * {<String>} name of the layer that this style belongs to, usually
     * according to the NamedLayer attribute of an SLD document.
     */
    layerName: null,
    
    /**
     * APIProperty: isDefault
     * {Boolean}
     */
    isDefault: false,
     
    /** 
     * Property: rules 
     * {Array(<OpenLayers.Rule>)}
     */
    rules: null,
    
    /**
     * APIProperty: context
     * {Object} An optional object with properties that symbolizers' property
     * values should be evaluated against. If no context is specified,
     * feature.attributes will be used
     */
    context: null,

    /**
     * Property: defaultStyle
     * {Object} hash of style properties to use as default for merging
     * rule-based style symbolizers onto. If no rules are defined,
     * createSymbolizer will return this style. If <defaultsPerSymbolizer> is set to
     * true, the defaultStyle will only be taken into account if there are
     * rules defined.
     */
    defaultStyle: null,
    
    /**
     * Property: defaultsPerSymbolizer
     * {Boolean} If set to true, the <defaultStyle> will extend the symbolizer
     * of every rule. Properties of the <defaultStyle> will also be used to set
     * missing symbolizer properties if the symbolizer has stroke, fill or
     * graphic set to true. Default is false.
     */
    defaultsPerSymbolizer: false,
    
    /**
     * Property: propertyStyles
     * {Hash of Boolean} cache of style properties that need to be parsed for
     * propertyNames. Property names are keys, values won't be used.
     */
    propertyStyles: null,
    

    /** 
     * Constructor: OpenLayers.Style
     * Creates a UserStyle.
     *
     * Parameters:
     * style        - {Object} Optional hash of style properties that will be
     *                used as default style for this style object. This style
     *                applies if no rules are specified. Symbolizers defined in
     *                rules will extend this default style.
     * options - {Object} An optional object with properties to set on the
     *     style.
     *
     * Valid options:
     * rules - {Array(<OpenLayers.Rule>)} List of rules to be added to the
     *     style.
     * 
     * Returns:
     * {<OpenLayers.Style>}
     */
    initialize: function(style, options) {

        OpenLayers.Util.extend(this, options);
        this.rules = [];
        if(options && options.rules) {
            this.addRules(options.rules);
        }

        // use the default style from OpenLayers.Feature.Vector if no style
        // was given in the constructor
        this.setDefaultStyle(style ||
                             OpenLayers.Feature.Vector.style["default"]);

        this.id = OpenLayers.Util.createUniqueID(this.CLASS_NAME + "_");
    },

    /** 
     * APIMethod: destroy
     * nullify references to prevent circular references and memory leaks
     */
    destroy: function() {
        for (var i=0, len=this.rules.length; i<len; i++) {
            this.rules[i].destroy();
            this.rules[i] = null;
        }
        this.rules = null;
        this.defaultStyle = null;
    },
    
    /**
     * Method: createSymbolizer
     * creates a style by applying all feature-dependent rules to the base
     * style.
     * 
     * Parameters:
     * feature - {<OpenLayers.Feature>} feature to evaluate rules for
     * 
     * Returns:
     * {Object} symbolizer hash
     */
    createSymbolizer: function(feature) {
        var style = this.defaultsPerSymbolizer ? {} : this.createLiterals(
            OpenLayers.Util.extend({}, this.defaultStyle), feature);
        
        var rules = this.rules;

        var rule, context;
        var elseRules = [];
        var appliedRules = false;
        for(var i=0, len=rules.length; i<len; i++) {
            rule = rules[i];
            // does the rule apply?
            var applies = rule.evaluate(feature);
            
            if(applies) {
                if(rule instanceof OpenLayers.Rule && rule.elseFilter) {
                    elseRules.push(rule);
                } else {
                    appliedRules = true;
                    this.applySymbolizer(rule, style, feature);
                }
            }
        }
        
        // if no other rules apply, apply the rules with else filters
        if(appliedRules == false && elseRules.length > 0) {
            appliedRules = true;
            for(var i=0, len=elseRules.length; i<len; i++) {
                this.applySymbolizer(elseRules[i], style, feature);
            }
        }

        // don't display if there were rules but none applied
        if(rules.length > 0 && appliedRules == false) {
            style.display = "none";
        }
        
        if (style.label != null && typeof style.label !== "string") {
            style.label = String(style.label);
        }
        
        return style;
    },
    
    /**
     * Method: applySymbolizer
     *
     * Parameters:
     * rule - {<OpenLayers.Rule>}
     * style - {Object}
     * feature - {<OpenLayer.Feature.Vector>}
     *
     * Returns:
     * {Object} A style with new symbolizer applied.
     */
    applySymbolizer: function(rule, style, feature) {
        var symbolizerPrefix = feature.geometry ?
                this.getSymbolizerPrefix(feature.geometry) :
                OpenLayers.Style.SYMBOLIZER_PREFIXES[0];

        var symbolizer = rule.symbolizer[symbolizerPrefix] || rule.symbolizer;
        
        if(this.defaultsPerSymbolizer === true) {
            var defaults = this.defaultStyle;
            OpenLayers.Util.applyDefaults(symbolizer, {
                pointRadius: defaults.pointRadius
            });
            if(symbolizer.stroke === true || symbolizer.graphic === true) {
                OpenLayers.Util.applyDefaults(symbolizer, {
                    strokeWidth: defaults.strokeWidth,
                    strokeColor: defaults.strokeColor,
                    strokeOpacity: defaults.strokeOpacity,
                    strokeDashstyle: defaults.strokeDashstyle,
                    strokeLinecap: defaults.strokeLinecap
                });
            }
            if(symbolizer.fill === true || symbolizer.graphic === true) {
                OpenLayers.Util.applyDefaults(symbolizer, {
                    fillColor: defaults.fillColor,
                    fillOpacity: defaults.fillOpacity
                });
            }
            if(symbolizer.graphic === true) {
                OpenLayers.Util.applyDefaults(symbolizer, {
                    pointRadius: this.defaultStyle.pointRadius,
                    externalGraphic: this.defaultStyle.externalGraphic,
                    graphicName: this.defaultStyle.graphicName,
                    graphicOpacity: this.defaultStyle.graphicOpacity,
                    graphicWidth: this.defaultStyle.graphicWidth,
                    graphicHeight: this.defaultStyle.graphicHeight,
                    graphicXOffset: this.defaultStyle.graphicXOffset,
                    graphicYOffset: this.defaultStyle.graphicYOffset
                });
            }
        }

        // merge the style with the current style
        return this.createLiterals(
                OpenLayers.Util.extend(style, symbolizer), feature);
    },
    
    /**
     * Method: createLiterals
     * creates literals for all style properties that have an entry in
     * <this.propertyStyles>.
     * 
     * Parameters:
     * style   - {Object} style to create literals for. Will be modified
     *           inline.
     * feature - {Object}
     * 
     * Returns:
     * {Object} the modified style
     */
    createLiterals: function(style, feature) {
        var context = OpenLayers.Util.extend({}, feature.attributes || feature.data);
        OpenLayers.Util.extend(context, this.context);
        
        for (var i in this.propertyStyles) {
            style[i] = OpenLayers.Style.createLiteral(style[i], context, feature, i);
        }
        return style;
    },
    
    /**
     * Method: findPropertyStyles
     * Looks into all rules for this style and the defaultStyle to collect
     * all the style hash property names containing ${...} strings that have
     * to be replaced using the createLiteral method before returning them.
     * 
     * Returns:
     * {Object} hash of property names that need createLiteral parsing. The
     * name of the property is the key, and the value is true;
     */
    findPropertyStyles: function() {
        var propertyStyles = {};

        // check the default style
        var style = this.defaultStyle;
        this.addPropertyStyles(propertyStyles, style);

        // walk through all rules to check for properties in their symbolizer
        var rules = this.rules;
        var symbolizer, value;
        for (var i=0, len=rules.length; i<len; i++) {
            symbolizer = rules[i].symbolizer;
            for (var key in symbolizer) {
                value = symbolizer[key];
                if (typeof value == "object") {
                    // symbolizer key is "Point", "Line" or "Polygon"
                    this.addPropertyStyles(propertyStyles, value);
                } else {
                    // symbolizer is a hash of style properties
                    this.addPropertyStyles(propertyStyles, symbolizer);
                    break;
                }
            }
        }
        return propertyStyles;
    },
    
    /**
     * Method: addPropertyStyles
     * 
     * Parameters:
     * propertyStyles - {Object} hash to add new property styles to. Will be
     *                  modified inline
     * symbolizer     - {Object} search this symbolizer for property styles
     * 
     * Returns:
     * {Object} propertyStyles hash
     */
    addPropertyStyles: function(propertyStyles, symbolizer) {
        var property;
        for (var key in symbolizer) {
            property = symbolizer[key];
            if (typeof property == "string" &&
                    property.match(/\$\{\w+\}/)) {
                propertyStyles[key] = true;
            }
        }
        return propertyStyles;
    },
    
    /**
     * APIMethod: addRules
     * Adds rules to this style.
     * 
     * Parameters:
     * rules - {Array(<OpenLayers.Rule>)}
     */
    addRules: function(rules) {
        Array.prototype.push.apply(this.rules, rules);
        this.propertyStyles = this.findPropertyStyles();
    },
    
    /**
     * APIMethod: setDefaultStyle
     * Sets the default style for this style object.
     * 
     * Parameters:
     * style - {Object} Hash of style properties
     */
    setDefaultStyle: function(style) {
        this.defaultStyle = style; 
        this.propertyStyles = this.findPropertyStyles();
    },
        
    /**
     * Method: getSymbolizerPrefix
     * Returns the correct symbolizer prefix according to the
     * geometry type of the passed geometry
     * 
     * Parameters:
     * geometry - {<OpenLayers.Geometry>}
     * 
     * Returns:
     * {String} key of the according symbolizer
     */
    getSymbolizerPrefix: function(geometry) {
        var prefixes = OpenLayers.Style.SYMBOLIZER_PREFIXES;
        for (var i=0, len=prefixes.length; i<len; i++) {
            if (geometry.CLASS_NAME.indexOf(prefixes[i]) != -1) {
                return prefixes[i];
            }
        }
    },
    
    /**
     * APIMethod: clone
     * Clones this style.
     * 
     * Returns:
     * {<OpenLayers.Style>} Clone of this style.
     */
    clone: function() {
        var options = OpenLayers.Util.extend({}, this);
        // clone rules
        if(this.rules) {
            options.rules = [];
            for(var i=0, len=this.rules.length; i<len; ++i) {
                options.rules.push(this.rules[i].clone());
            }
        }
        // clone context
        options.context = this.context && OpenLayers.Util.extend({}, this.context);
        //clone default style
        var defaultStyle = OpenLayers.Util.extend({}, this.defaultStyle);
        return new OpenLayers.Style(defaultStyle, options);
    },
    
    CLASS_NAME: "OpenLayers.Style"
});


/**
 * Function: createLiteral
 * converts a style value holding a combination of PropertyName and Literal
 * into a Literal, taking the property values from the passed features.
 * 
 * Parameters:
 * value - {String} value to parse. If this string contains a construct like
 *         "foo ${bar}", then "foo " will be taken as literal, and "${bar}"
 *         will be replaced by the value of the "bar" attribute of the passed
 *         feature.
 * context - {Object} context to take attribute values from
 * feature - {<OpenLayers.Feature.Vector>} optional feature to pass to
 *           <OpenLayers.String.format> for evaluating functions in the
 *           context.
 * property - {String} optional, name of the property for which the literal is
 *            being created for evaluating functions in the context.
 * 
 * Returns:
 * {String} the parsed value. In the example of the value parameter above, the
 * result would be "foo valueOfBar", assuming that the passed feature has an
 * attribute named "bar" with the value "valueOfBar".
 */
OpenLayers.Style.createLiteral = function(value, context, feature, property) {
    if (typeof value == "string" && value.indexOf("${") != -1) {
        value = OpenLayers.String.format(value, context, [feature, property]);
        value = (isNaN(value) || !value) ? value : parseFloat(value);
    }
    return value;
};
    
/**
 * Constant: OpenLayers.Style.SYMBOLIZER_PREFIXES
 * {Array} prefixes of the sld symbolizers. These are the
 * same as the main geometry types
 */
OpenLayers.Style.SYMBOLIZER_PREFIXES = ['Point', 'Line', 'Polygon', 'Text',
    'Raster'];
