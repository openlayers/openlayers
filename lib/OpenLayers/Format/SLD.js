/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @requires OpenLayers/Format/XML.js
 * @requires OpenLayers/Style.js
 * @requires OpenLayers/Rule/FeatureId.js
 * @requires OpenLayers/Rule/Logical.js
 * @requires OpenLayers/Rule/Comparison.js
 */

/**
 * Class: OpenLayers.Format.SLD
 * Read/Wite SLD. Create a new instance with the <OpenLayers.Format.SLD>
 *     constructor.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.SLD = OpenLayers.Class(OpenLayers.Format.XML, {
    
    /**
     * APIProperty: sldns
     * Namespace used for sld.
     */
    sldns: "http://www.opengis.net/sld",
    
    /**
     * APIProperty: ogcns
     * Namespace used for ogc.
     */
    ogcns: "http://www.opengis.net/ogc",
    
    /**
     * APIProperty: gmlns
     * Namespace used for gml.
     */
    gmlns: "http://www.opengis.net/gml",
    
    /**
     * APIProperty: defaultStyle.
     * {Object}
     * A simple style, preset with the SLD defaults.
     */
    defaultStyle: {
            fillColor: "#808080",
            fillOpacity: 1,
            strokeColor: "#000000",
            strokeOpacity: 1,
            strokeWidth: 1,
            pointRadius: 6
    },
    
    /**
     * Property: withNamedLayer
     * {Boolean} Option set during <read>.  Default is false.  If true, the
     *     return from <read> will be a two item array ([styles, namedLayer]): 
     *         - styles - {Array(<OpenLayers.Style>)}
     *         - namedLayer - {Object} hash of userStyles, keyed by
     *             sld:NamedLayer/Name, each again keyed by 
     *             sld:UserStyle/Name. Each entry of namedLayer is a
     *             StyleMap for a layer, with the userStyle names as style
     *             keys.
     */
    withNamedLayer: false,
     
    /**
     * APIProperty: overrideDefaultStyleKey
     * {Boolean} Store styles with key of "default" instead of user style name.
     *     If true, userStyles with sld:IsDefault==1 will be stored with
     *     key "default" instead of the sld:UserStyle/Name in the style map.
     *     Default is true.
     */
    overrideDefaultStyleKey: true,


    /**
     * Constructor: OpenLayers.Format.SLD
     * Create a new parser for SLD.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.XML.prototype.initialize.apply(this, [options]);
    },

    /**
     * APIMethod: read
     * Read data from a string, and return a list of features. 
     * 
     * Parameters:
     * data - {String} or {XMLNode} data to read/parse.
     * options - {Object} Object that sets optional read configuration values.
     *     These include <withNamedLayer>, and <overrideDefaultStyleKey>.
     *
     * Returns:
     * {Array(<OpenLayers.Style>)} List of styles.  If <withNamedLayer> is
     *     true, return will be a two item array where the first item is
     *     a list of styles and the second is the namedLayer object.
     */
    read: function(data, options) {
        if (typeof data == "string") { 
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }
        
        options = options || {};
        OpenLayers.Util.applyDefaults(options, {
            withNamedLayer: false,
            overrideDefaultStyleKey: true
        });
        
        var userStyles = this.getElementsByTagNameNS(
            data, this.sldns, "UserStyle"
        );
        var result = {};
        if (userStyles.length > 0) {
            var namedLayer = {};
            var styles = new Array(userStyles.length);
            var styleName, userStyle, style;
            for (var i=0; i<userStyles.length; i++) {
                userStyle = userStyles[i];
                styleName = this.parseProperty(
                    userStyle, this.sldns, "Name"
                );
                style = this.parseUserStyle(userStyle, styleName);
    
                if (options.overrideDefaultStyleKey && style.isDefault == true) {
                    styleName = "default";
                }
    
                if (!namedLayer[style.layerName]) {
                    namedLayer[style.layerName] = {};
                }
                namedLayer[style.layerName][styleName] = style;
                styles[i] = style;
            }
            result = options.withNamedLayer ? [styles, namedLayer] : styles;
        }
        return result;
    },

    /**
     * Method: parseUserStyle
     * parses a sld userStyle for rules
     * 
     * Parameters:
     * xmlNode - {DOMElement} xml node to read the style from
     * name - {String} name of the style
     * 
     * Returns:
     * {<OpenLayers.Style>}
     */
    parseUserStyle: function(xmlNode, name) {
        var userStyle = new OpenLayers.Style(this.defaultStyle, {name: name});
        
        userStyle.isDefault = (
            this.parseProperty(xmlNode, this.sldns, "IsDefault") == 1
        );
        
        // get the name of the layer if we have a NamedLayer
        var namedLayerNode = xmlNode.parentNode;
        var nameNodes = this.getElementsByTagNameNS(
            namedLayerNode, this.sldns, "Name"
        );
        if (namedLayerNode.nodeName.indexOf("NamedLayer") != -1 &&
                nameNodes &&
                nameNodes.length > 0 &&
                nameNodes[0].parentNode == namedLayerNode) {
            userStyle.layerName = this.getChildValue(nameNodes[0]);
        }
         
        var ruleNodes = this.getElementsByTagNameNS(
            xmlNode, this.sldns, "Rule"
        );

        if (ruleNodes.length > 0) {
            var rules = userStyle.rules;
            var ruleName;
            for (var i=0; i<ruleNodes.length; i++) {
                ruleName = this.parseProperty(ruleNodes[i], this.sldns, "Name");
                rules.push(this.parseRule(ruleNodes[i], ruleName));
            }
        }

        return userStyle;
    },        
    
    /**
     * Method: parseRule
     * This function is the core of the SLD parsing code in OpenLayers.
     *     It creates the rule with its constraints and symbolizers.
     *
     * Parameters:
     * xmlNode - {<DOMElement>}
     * 
     * Returns:
     * {Object} Hash of rule properties
     */
    parseRule: function(xmlNode, name) {

        // FILTERS
        
        var filter = this.getElementsByTagNameNS(xmlNode, this.ogcns, "Filter");
        if (filter && filter.length > 0) {
            var rule = this.parseFilter(filter[0]);
        } else {
            // start with an empty rule that always applies
            var rule = new OpenLayers.Rule();
            // and check if the rule is an ElseFilter
            var elseFilter = this.getElementsByTagNameNS(xmlNode, this.ogcns,
                "ElseFilter");
            if (elseFilter && elseFilter.length > 0) {
                rule.elseFilter = true;
            }
        }
        
        rule.name = name;
        
        // SCALE DENOMINATORS
        
        // MinScaleDenominator
        var minScale = this.getElementsByTagNameNS(
            xmlNode, this.sldns, "MinScaleDenominator"
        );
        if (minScale && minScale.length > 0) {
            rule.minScaleDenominator = 
                parseFloat(this.getChildValue(minScale[0]));
        }
        
        // MaxScaleDenominator
        var maxScale = this.getElementsByTagNameNS(
            xmlNode, this.sldns, "MaxScaleDenominator"
        );
        if (maxScale && maxScale.length > 0) {
            rule.maxScaleDenominator =
                parseFloat(this.getChildValue(maxScale[0]));
        }
        
        // STYLES
        
        // walk through all symbolizers
        var prefixes = OpenLayers.Style.SYMBOLIZER_PREFIXES;
        for (var s=0; s<prefixes.length; s++) {
            
            // symbolizer type
            var symbolizer = this.getElementsByTagNameNS(
                xmlNode, this.sldns, prefixes[s]+"Symbolizer"
            );
            
            if (symbolizer && symbolizer.length > 0) {
            
                var style = {};
            
                // externalGraphic
                var graphic = this.getElementsByTagNameNS(
                    symbolizer[0], this.sldns, "Graphic"
                );
                if (graphic && graphic.length > 0) {
                    style.externalGraphic = this.parseProperty(
                        graphic[0], this.sldns, "OnlineResource", "xlink:href"
                    );
                    style.pointRadius = this.parseProperty(
                        graphic[0], this.sldns, "Size"
                    );
                    style.graphicOpacity = this.parseProperty(
                        graphic[0], this.sldns, "Opacity"
                    );
                }
                
                // fill
                var fill = this.getElementsByTagNameNS(
                    symbolizer[0], this.sldns, "Fill"
                );
                if (fill && fill.length > 0) {
                    style.fillColor = this.parseProperty(
                        fill[0], this.sldns, "CssParameter", "name", "fill"
                    );
                    style.fillOpacity = this.parseProperty(
                        fill[0], this.sldns, "CssParameter",
                        "name", "fill-opacity"
                    ) || 1;
                }
            
                // stroke
                var stroke = this.getElementsByTagNameNS(
                    symbolizer[0], this.sldns, "Stroke"
                );
                if (stroke && stroke.length > 0) {
                    style.strokeColor = this.parseProperty(
                        stroke[0], this.sldns, "CssParameter", "name", "stroke"
                    );
                    style.strokeOpacity = this.parseProperty(
                        stroke[0], this.sldns, "CssParameter",
                        "name", "stroke-opacity"
                    ) || 1;
                    style.strokeWidth = this.parseProperty(
                        stroke[0], this.sldns, "CssParameter",
                        "name", "stroke-width"
                    );
                    style.strokeLinecap = this.parseProperty(
                        stroke[0], this.sldns, "CssParameter",
                        "name", "stroke-linecap"
                    );
                }
                
                // set the [point|line|polygon]Symbolizer property of the rule
                rule.symbolizer[prefixes[s]] = style;
            }
        }

        return rule;
    },
    
    /**
     * Method: parseFilter
     * Parses ogc fiters.
     *
     * Parameters:
     * xmlNode - {<DOMElement>}
     * 
     * Returns:
     * {<OpenLayers.Rule>} rule representing the filter
     */
    parseFilter: function(xmlNode) {
        // ogc:FeatureId filter
        var filter = this.getNodeOrChildrenByTagName(xmlNode, "FeatureId");
        if (filter) {
            var rule = new OpenLayers.Rule.FeatureId();
            for (var i=0; i<filter.length; i++) {
                rule.fids.push(filter[i].getAttribute("fid"));
            }
            return rule;
        }
        
        // ogc:And filter
        filter = this.getNodeOrChildrenByTagName(xmlNode, "And");
        if (filter) {
            var rule = new OpenLayers.Rule.Logical(
                    {type: OpenLayers.Rule.Logical.AND});
            var filters = filter[0].childNodes; 
            for (var i=0; i<filters.length; i++) {
                if (filters[i].nodeType == 1) {
                    rule.rules.push(this.parseFilter(filters[i]));
                }
            }
            return rule;
        }

        // ogc:Or filter
        filter = this.getNodeOrChildrenByTagName(xmlNode, "Or");
        if (filter) {
            var rule = new OpenLayers.Rule.Logical(
                    {type: OpenLayers.Rule.Logical.OR})
            var filters = filter[0].childNodes; 
            for (var i=0; i<filters.length; i++) {
                if (filters[i].nodeType == 1) {
                    rule.rules.push(this.parseFilter(filters[i]));
                }
            }
            return rule;
        }

        // ogc:Not filter
        filter = this.getNodeOrChildrenByTagName(xmlNode, "Not");
        if (filter) {
            var rule = new OpenLayers.Rule.Logical(
                    {type: OpenLayers.Rule.Logical.NOT});
            var filters = filter[0].childNodes; 
            for (var i=0; i<filters.length; i++) {
                if (filters[i].nodeType == 1) {
                    rule.rules.push(this.parseFilter(filters[i]));
                }
            }
            return rule;
        }
        
        // Comparison filters
        for (var type in this.TYPES) {
            var filter = this.getNodeOrChildrenByTagName(xmlNode, type);
            if (filter) {
                filter = filter[0];
                var rule = new OpenLayers.Rule.Comparison({
                        type: OpenLayers.Rule.Comparison[this.TYPES[type]],
                        property: this.parseProperty(
                                filter, this.ogcns, "PropertyName")});
                // ogc:PropertyIsBetween
                if (this.TYPES[type] == "BETWEEN") {
                    rule.lowerBoundary = this.parseProperty(
                            filter, this.ogcns, "LowerBoundary");
                    rule.upperBoudary = this.parseProperty(
                            filter, this.ogcns, "UpperBoundary");
                } else {
                    rule.value = this.parseProperty(
                            filter, this.ogcns, "Literal");
                    // ogc:PropertyIsLike
                    if (this.TYPES[type] == "LIKE") {
                        var wildCard = filter.getAttribute("wildCard");
                        var singleChar = filter.getAttribute("singleChar");
                        var escape = filter.getAttribute("escape");
                        rule.value2regex(wildCard, singleChar, escape);
                    }
                }
                return rule;
            }
        }
        
        // if we get here, the filter was empty
        return new OpenLayers.Rule();
    },
    
    /**
     * Method: getNodeOrChildrenByTagName
     * Convenience method to get a node or its child nodes, but only
     *     those matching a tag name.
     * 
     * Returns:
     * {Array(<DOMElement>)} or null if no matching content is found
     */
    getNodeOrChildrenByTagName: function(xmlNode, tagName) {
        var nodeName = (xmlNode.prefix) ?
               xmlNode.nodeName.split(":")[1] :
               xmlNode.nodeName;

        if (nodeName == tagName) {
            return [xmlNode];
        } else {
            var nodelist = this.getElementsByTagNameNS(
                    xmlNode, this.ogcns, tagName);
        }

        // make a new list which only contains matching child nodes
        if (nodelist.length > 0) {
            var node;
            var list = [];
            for (var i=0; i<nodelist.length; i++) {
                node = nodelist[i];
                if (node.parentNode == xmlNode) {
                    list.push(node);
                }
            }
            return list.length > 0 ? list : null;
        }
        
        return null;
    },
    
    /**
     * Method: parseProperty
     * Convenience method to parse the different kinds of properties
     *     found in the sld and ogc namespace.
     *
     * Parses an ogc node that can either contain a value directly,
     *     or inside a <Literal> property. The parsing can also be limited
     *     to nodes with certain attribute names and/or values.
     *
     * Parameters:
     * xmlNode        - {<DOMElement>}
     * namespace      - {String} namespace of the node to find
     * propertyName   - {String} name of the property to parse
     * attributeName  - {String} optional name of the property to match
     * attributeValue - {String} optional value of the specified attribute
     * 
     * Returns:
     * {String} The value for the requested property.
     */    
    parseProperty: function(xmlNode, namespace, propertyName, attributeName,
                                                              attributeValue) {
        var result = null;
        var propertyNodeList = this.getElementsByTagNameNS(
                xmlNode, namespace, propertyName);
                
        if (propertyNodeList && propertyNodeList.length > 0) {
            var propertyNode = attributeName ?
                    this.getNodeWithAttribute(propertyNodeList, 
                            attributeName) :
                    propertyNodeList[0];

            // strip namespace from attribute name for Opera browsers
            if (window.opera && attributeName) {
                var nsDelimiterPos = attributeName.indexOf(":");
                if (nsDelimiterPos != -1) {
                    attributeName = attributeName.substring(++nsDelimiterPos);
                }
            }
            
            // get the property value from the node matching attributeName
            // and attributeValue, eg.:
            // <CssParameter name="stroke">
            //     <ogc:Literal>red</ogc:Literal>
            // </CssParameter>
            // or:
            // <CssParameter name="stroke">red</CssParameter>
            if (attributeName && attributeValue) {
                propertyNode = this.getNodeWithAttribute(propertyNodeList,
                        attributeName, attributeValue);
                result = this.parseParameter(propertyNode);
            }

            // get the attribute value and use it as result, eg.:
            // <sld:OnlineResource xlink:href="../img/marker.png"/>
            if (attributeName && !attributeValue) {
                var propertyNode = this.getNodeWithAttribute(propertyNodeList,
                        attributeName);
                result = propertyNode.getAttribute(attributeName);                
            }
            
            // get the property value directly or from an ogc:propertyName,
            // ogc:Literal or any other property at the level of the property
            // node, eg.:
            // <sld:Opacity>0.5</sld:Opacity>
            if (!attributeName) {
                var result = this.parseParameter(propertyNode);
            }
        }
        
        // adjust the result to be a trimmed string or a number
        if (result) {
            result = OpenLayers.String.trim(result);
            if (!isNaN(result)) {
                result = parseFloat(result);
            }
        }
        
        return result;
    },
    
    /**
     * Method: parseParameter
     * parses a property for propertyNames, Literals and textContent and
     * creates the according value string.
     * 
     * Parameters:
     * xmlNode - {<DOMElement>}
     * 
     * Returns:
     * {String} a string holding a value suitable for OpenLayers.Style.value
     */
    parseParameter: function(xmlNode) {
        if (!xmlNode) {
            return null;
        }
        var childNodes = xmlNode.childNodes;
        if (!childNodes) {
            return null;
        }

        var value = new Array(childNodes.length);
        for (var i=0; i<childNodes.length; i++) {
            if (childNodes[i].nodeName.indexOf("Literal") != -1) {
                value[i] = this.getChildValue(childNodes[i]);
            } else
            if (childNodes[i].nodeName.indexOf("propertyName") != -1) {
                value[i] = "${" + this.getChildValue(childNodes[i]) + "}";
            } else
            if (childNodes[i].nodeType == 3) {
                value[i] = childNodes[i].text || childNodes[i].textContent;
            }
        }
        return value.join("");
    },
        
    /**
     * Method: getNodeWithAttribute
     * Walks through a list of xml nodes and returns the fist node that has an
     * attribute with the name and optional value specified.
     * 
     * Parameters:
     * xmlNodeList    - {Array(<DOMElement>)} list to search
     * attributeName  - {String} name of the attribute to match
     * attributeValue - {String} optional value of the attribute
     */
    getNodeWithAttribute: function(xmlNodeList, attributeName, attributeValue) {
        for (var i=0; i<xmlNodeList.length; i++) {
            var currentAttributeValue =
                    xmlNodeList[i].getAttribute(attributeName);
            if (currentAttributeValue) {
                if (!attributeValue) {
                    return xmlNodeList[i];
                } else if (currentAttributeValue == attributeValue) {
                    return xmlNodeList[i];
                }
            }
        }
    },
    
    /**
     * Constant: TYPES
     * {Object} Mapping between SLD rule names and rule type constants.
     * 
     */
    TYPES: {'PropertyIsEqualTo': 'EQUAL_TO',
            'PropertyIsNotEqualTo': 'NOT_EQUAL_TO',
            'PropertyIsLessThan': 'LESS_THAN',
            'PropertyIsGreaterThan': 'GREATER_THAN',
            'PropertyIsLessThanOrEqualTo': 'LESS_THAN_OR_EQUAL_TO',
            'PropertyIsGreaterThanOrEqualTo': 'GREATER_THAN_OR_EQUAL_TO',
            'PropertyIsBetween': 'BETWEEN',
            'PropertyIsLike': 'LIKE'},

    CLASS_NAME: "OpenLayers.Format.SLD" 
});
