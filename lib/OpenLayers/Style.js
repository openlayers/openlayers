/* Copyright (c) 2006-2007 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
  * full text of the license. */


/**
 * @requires OpenLayers/Util.js
 * @requires OpenLayers/Feature/Vector.js
 *
 * Class: OpenLayers.Style
 * 
 * This class represents a UserStyle obtained
 * from a SLD, containing styling rules.
 */
OpenLayers.Style = OpenLayers.Class({

    /**
     * APIProperty: name
     * {String}
     */
    name: null,
    
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
     * Array({<OpenLayers.Rule>}) 
     */
    rules: null,
    
    /**
     * Property: defaultStyle
     * {Object} hash of style properties to use as default for merging
     * rule-based style symbolizers onto. If no rules are defined, createStyle
     * will return this style.
     */
    defaultStyle: null,
    
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
     * options      - {Object} An optional object with properties to set on the
     *                userStyle
     * 
     * Return:
     * {<OpenLayers.Style>}
     */
    initialize: function(style, options) {
        this.rules = [];

        // use the default style from OpenLayers.Feature.Vector if no style
        // was given in the constructor
        this.setDefaultStyle(style || 
                OpenLayers.Feature.Vector.style["default"]);
        
        OpenLayers.Util.extend(this, options);
    },

    /** 
     * APIMethod: destroy
     * nullify references to prevent circular references and memory leaks
     */
    destroy: function() {
        for (var i=0; i<this.rules.length; i++) {
            this.rules[i].destroy();
            this.rules[i] = null;
        }
        this.rules = null;
        this.defaultStyle = null;
    },
    
    /**
     * APIMethod: createStyle
     * creates a style by applying all feature-dependent rules to the base
     * style.
     * 
     * Parameters:
     * feature - {<OpenLayers.Feature>} feature to evaluate rules for
     * baseStyle - {Object} hash of styles feature styles to extend
     * 
     * Returns:
     * {<OpenLayers.Feature.Vector.style>} hash of feature styles
     */
    createStyle: function(feature, baseStyle) {
        if (!baseStyle) {
            baseStyle = this.defaultStyle;
        }
        var style = OpenLayers.Util.extend({}, baseStyle);
        
        var draw = true;

        for (var i=0; i<this.rules.length; i++) {
            // does the rule apply?        
            var applies = this.rules[i].evaluate(feature);
            if (applies) {
                // check if within minScale/maxScale bounds
                var scale = feature.layer.map.getScale();
                if (this.rules[i].minScale) {
                    draw = scale > OpenLayers.Style.createLiteral(
                            this.rules[i].minScale, feature);
                }
                if (draw && this.rules[i].maxScale) {
                    draw = scale < OpenLayers.Style.createLiteral(
                            this.rules[i].maxScale, feature);
                }
                
                // determine which symbolizer (Point, Line, Polygon) to use
                var symbolizerPrefix = feature.geometry ?
                        this.getSymbolizerPrefix(feature.geometry) :
                        OpenLayers.Style.SYMBOLIZER_PREFIXES[0];

                // now merge the style with the current style
                var symbolizer = this.rules[i].symbolizer[symbolizerPrefix];
                OpenLayers.Util.extend(style, symbolizer);
            }
        }

        style.display = draw ? "" : "none";

        // calculate literals for all styles in the propertyStyles cache
        for (var i in this.propertyStyles) {
            style[i] = OpenLayers.Style.createLiteral(style[i], feature);
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
        for (var i in style) {
            if (typeof style[i] == "string" && style[i].match(/\$\{\w+\}/)) {  
                propertyStyles[i] = true;
            }
        }

        // walk through all rules to check for properties in their symbolizer
        var rules = this.rules;
        var prefixes = OpenLayers.Style.SYMBOLIZER_PREFIXES;
        for (var i in rules) {
            for (var s=0; s<prefixes.length; s++) {
                style = rules[i].symbolizer[prefixes[s]];
                for (var j in style) {
                    if (typeof style[j] == "string" &&
                            style[j].match(/\$\{\w+\}/)) {
                        propertyStyles[j] = true;
                    }
                }
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
        this.rules = this.rules.concat(rules);
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
     * geometry {<OpenLayers.Geometry>}
     * 
     * Returns:
     * {String} key of the according symbolizer
     */
    getSymbolizerPrefix: function(geometry) {
        var prefixes = OpenLayers.Style.SYMBOLIZER_PREFIXES;
        for (var i=0; i<prefixes.length; i++) {
            if (geometry.CLASS_NAME.indexOf(prefixes[i]) != -1) {
                return prefixes[i];
            }
        }
    },
    
    CLASS_NAME: "OpenLayers.Style"
});


/**
 * Function: createLiteral
 * converts a style value holding a combination of PropertyName and Literal
 * into a Literal, taking the property values from the passed features.
 * 
 * Parameters:
 * value   {String} value to parse. If this string contains a construct like
 *         "foo ${bar}", then "foo " will be taken as literal, and "${bar}"
 *         will be replaced by the value of the "bar" attribute of the passed
 *         feature.
 * feature {<OpenLayers.Feature>} feature to take attribute values from
 * 
 * Returns:
 * {String} the parsed value. In the example of the value parameter above, the
 * result would be "foo valueOfBar", assuming that the passed feature has an
 * attribute named "bar" with the value "valueOfBar".
 */
OpenLayers.Style.createLiteral = function(value, feature) {
    if (typeof value == "string" && value.indexOf("${") != -1) {
        var attributes = feature.attributes || feature.data;
        value = OpenLayers.String.format(value, attributes)
        value = isNaN(value) ? value : parseFloat(value);
    }
    return value;
}
    
/**
 * Constant: OpenLayers.Style.SYMBOLIZER_PREFIXES
 * {Array} prefixes of the sld symbolizers. These are the
 * same as the main geometry types
 */
OpenLayers.Style.SYMBOLIZER_PREFIXES = ['Point', 'Line', 'Polygon'];
