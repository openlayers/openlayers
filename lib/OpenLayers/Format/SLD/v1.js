/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Rule.js
 * @requires OpenLayers/Filter.js
 * @requires OpenLayers/Filter/FeatureId.js
 * @requires OpenLayers/Filter/Logical.js
 * @requires OpenLayers/Filter/Comparison.js
 * @requires OpenLayers/Format/SLD.js
 */

/**
 * Class: OpenLayers.Format.SLD.v1
 * Superclass for SLD version 1 parsers.
 *
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.SLD.v1 = OpenLayers.Class(OpenLayers.Format.XML, {
    
    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
        sld: "http://www.opengis.net/sld",
        ogc: "http://www.opengis.net/ogc",
        xlink: "http://www.w3.org/1999/xlink",
        xsi: "http://www.w3.org/2001/XMLSchema-instance"
    },
    
    /**
     * Property: defaultPrefix
     */
    defaultPrefix: "sld",

    /**
     * Property: schemaLocation
     * {String} Schema location for a particular minor version.
     */
    schemaLocation: null,

    /**
     * APIProperty: defaultSymbolizer.
     * {Object} A symbolizer with the SLD defaults.
     */
    defaultSymbolizer: {
        fillColor: "#808080",
        fillOpacity: 1,
        strokeColor: "#000000",
        strokeOpacity: 1,
        strokeWidth: 1,
        pointRadius: 6
    },
    
    /**
     * Constructor: OpenLayers.Format.SLD.v1
     * Instances of this class are not created directly.  Use the
     *     <OpenLayers.Format.SLD> constructor instead.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.XML.prototype.initialize.apply(this, [options]);
    },
    
    /**
     * Method: read
     *
     * Parameters:
     * data - {DOMElement} An SLD document element.
     *
     * Returns:
     * {Object} An object representing the SLD.
     */
    read: function(data) {        
        var sld = {
            namedLayers: {}
        };
        this.readChildNodes(data, sld);
        return sld;
    },
    
    /**
     * Property: readers
     * Contains public functions, grouped by namespace prefix, that will
     *     be applied when a namespaced node is found matching the function
     *     name.  The function will be applied in the scope of this parser
     *     with two arguments: the node being read and a context object passed
     *     from the parent.
     */
    readers: {
        "sld": {
            "StyledLayerDescriptor": function(node, sld) {
                sld.version = node.getAttribute("version");
                this.readChildNodes(node, sld);
            },
            "Name": function(node, obj) {
                obj.name = this.getChildValue(node);
            },
            "Title": function(node, obj) {
                obj.title = this.getChildValue(node);
            },
            "Abstract": function(node, obj) {
                obj.description = this.getChildValue(node);
            },
            "NamedLayer": function(node, sld) {
                var layer = {
                    userStyles: [],
                    namedStyles: []
                };
                this.readChildNodes(node, layer);
                // give each of the user styles this layer name
                for(var i=0; i<layer.userStyles.length; ++i) {
                    layer.userStyles[i].layerName = layer.name;
                }
                sld.namedLayers[layer.name] = layer;
            },
            "NamedStyle": function(node, layer) {
                layer.namedStyles.push(
                    this.getChildName(node.firstChild)
                );
            },
            "UserStyle": function(node, layer) {
                var style = new OpenLayers.Style(this.defaultSymbolizer);
                this.readChildNodes(node, style);
                layer.userStyles.push(style);
            },
            "IsDefault": function(node, style) {
                if(this.getChildValue(node) == "1") {
                    style.isDefault = true;
                }
            },
            "FeatureTypeStyle": function(node, style) {
                // OpenLayers doesn't have a place for FeatureTypeStyle
                // Name, Title, Abstract, FeatureTypeName, or
                // SemanticTypeIdentifier so, we make a temporary object
                // and later just use the Rule(s).
                var obj = {
                    rules: []
                };
                this.readChildNodes(node, obj);
                style.rules = obj.rules;
            },
            "Rule": function(node, obj) {
                var rule = new OpenLayers.Rule();
                this.readChildNodes(node, rule);
                obj.rules.push(rule);
            },
            "ElseFilter": function(node, rule) {
                rule.elseFilter = true;
            },
            "MinScaleDenominator": function(node, rule) {
                rule.minScaleDenominator = this.getChildValue(node);
            },
            "MaxScaleDenominator": function(node, rule) {
                rule.maxScaleDenominator = this.getChildValue(node);
            },
            "LineSymbolizer": function(node, rule) {
                // OpenLayers doens't do painter's order, instead we extend
                var symbolizer = rule.symbolizer["Line"] || {};
                this.readChildNodes(node, symbolizer);
                // in case it didn't exist before
                rule.symbolizer["Line"] = symbolizer;
            },
            "PolygonSymbolizer": function(node, rule) {
                // OpenLayers doens't do painter's order, instead we extend
                var symbolizer = rule.symbolizer["Polygon"] || {};
                this.readChildNodes(node, symbolizer);
                // in case it didn't exist before
                rule.symbolizer["Polygon"] = symbolizer;
            },
            "PointSymbolizer": function(node, rule) {
                // OpenLayers doens't do painter's order, instead we extend
                var symbolizer = rule.symbolizer["Point"] || {};
                this.readChildNodes(node, symbolizer);
                // in case it didn't exist before
                rule.symbolizer["Point"] = symbolizer;
            },
            "Stroke": function(node, symbolizer) {
                this.readChildNodes(node, symbolizer);
            },
            "Fill": function(node, symbolizer) {
                this.readChildNodes(node, symbolizer);
            },
            "CssParameter": function(node, symbolizer) {
                var cssProperty = node.getAttribute("name");
                var symProperty = this.cssMap[cssProperty];
                if(symProperty) {
                    // Limited support for parsing of OGC expressions
                    var value = this.readOgcExpression(node);
                    // always string, could be an empty string
                    if(value) {
                        symbolizer[symProperty] = value;
                    }
                }
            },
            "Graphic": function(node, symbolizer) {
                var graphic = {};
                // painter's order not respected here, clobber previous with next
                this.readChildNodes(node, graphic);
                // directly properties with names that match symbolizer properties
                var properties = [
                    "strokeColor", "strokeWidth", "strokeOpacity",
                    "strokeLinecap", "fillColor", "fillOpacity",
                    "graphicName", "rotation", "graphicFormat"
                ];
                var prop, value;
                for(var i=0; i<properties.length; ++i) {
                    prop = properties[i];
                    value = graphic[prop];
                    if(value != undefined) {
                        symbolizer[prop] = value;
                    }
                }
                // set other generic properties with specific graphic property names
                if(graphic.opacity != undefined) {
                    symbolizer.graphicOpacity = graphic.opacity;
                }
                if(graphic.size != undefined) {
                    symbolizer.pointRadius = graphic.size / 2;
                }
                if(graphic.href != undefined) {
                    symbolizer.externalGraphic = graphic.href;
                }
                if(graphic.rotation != undefined) {
                    symbolizer.rotation = graphic.rotation;
                }
            },
            "ExternalGraphic": function(node, graphic) {
                this.readChildNodes(node, graphic);
            },
            "Mark": function(node, graphic) {
                this.readChildNodes(node, graphic);
            },
            "WellKnownName": function(node, graphic) {
                graphic.graphicName = this.getChildValue(node);
            },
            "Opacity": function(node, obj) {
                // No support for parsing of OGC expressions
                var opacity = this.getChildValue(node);
                // always string, could be empty string
                if(opacity) {
                    obj.opacity = opacity;
                }
            },
            "Size": function(node, obj) {
                // No support for parsing of OGC expressions
                var size = this.getChildValue(node);
                // always string, could be empty string
                if(size) {
                    obj.size = size;
                }
            },
            "Rotation": function(node, obj) {
                // No support for parsing of OGC expressions
                var rotation = this.getChildValue(node);
                // always string, could be empty string
                if(rotation) {
                    obj.rotation = rotation;
                }
            },
            "OnlineResource": function(node, obj) {
                obj.href = this.getAttributeNS(
                    node, this.namespaces.xlink, "href"
                );
            },
            "Format": function(node, graphic) {
                graphic.graphicFormat = this.getChildValue(node);
            }
        },
        "ogc": {
            "Filter": function(node, rule) {
                // Filters correspond to subclasses of OpenLayers.Filter.
                // Since they contain information we don't persist, we
                // create a temporary object and then pass on the filter
                // (ogc:Filter) to the parent rule (sld:Rule).
                var obj = {
                    fids: [],
                    filters: []
                };
                this.readChildNodes(node, obj);
                if(obj.fids.length > 0) {
                    rule.filter = new OpenLayers.Filter.FeatureId({
                        fids: obj.fids
                    });
                } else if(obj.filters.length > 0) {
                    rule.filter = obj.filters[0];
                }
            },
            "FeatureId": function(node, obj) {
                var fid = node.getAttribute("fid");
                if(fid) {
                    obj.fids.push(fid);
                }
            },
            "And": function(node, obj) {
                var filter = new OpenLayers.Filter.Logical({
                    type: OpenLayers.Filter.Logical.AND
                });
                this.readChildNodes(node, filter);
                obj.filters.push(filter);
            },
            "Or": function(node, obj) {
                var filter = new OpenLayers.Filter.Logical({
                    type: OpenLayers.Filter.Logical.OR
                });
                this.readChildNodes(node, filter);
                obj.filters.push(filter);
            },
            "Not": function(node, obj) {
                var filter = new OpenLayers.Filter.Logical({
                    type: OpenLayers.Filter.Logical.NOT
                });
                this.readChildNodes(node, filter);
                obj.filters.push(filter);
            },
            "PropertyIsEqualTo": function(node, obj) {
                var filter = new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.EQUAL_TO
                });
                this.readChildNodes(node, filter);
                obj.filters.push(filter);
            },
            "PropertyIsNotEqualTo": function(node, obj) {
                var filter = new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.NOT_EQUAL_TO
                });
                this.readChildNodes(node, filter);
                obj.filters.push(filter);
            },
            "PropertyIsLessThan": function(node, obj) {
                var filter = new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.LESS_THAN
                });
                this.readChildNodes(node, filter);
                obj.filters.push(filter);
            },
            "PropertyIsGreaterThan": function(node, obj) {
                var filter = new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.GREATER_THAN
                });
                this.readChildNodes(node, filter);
                obj.filters.push(filter);
            },
            "PropertyIsLessThanOrEqualTo": function(node, obj) {
                var filter = new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.LESS_THAN_OR_EQUAL_TO
                });
                this.readChildNodes(node, filter);
                obj.filters.push(filter);
            },
            "PropertyIsGreaterThanOrEqualTo": function(node, obj) {
                var filter = new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO
                });
                this.readChildNodes(node, filter);
                obj.filters.push(filter);
            },
            "PropertyIsBetween": function(node, obj) {
                var filter = new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.BETWEEN
                });
                this.readChildNodes(node, filter);
                obj.filters.push(filter);
            },
            "PropertyIsLike": function(node, obj) {
                var filter = new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.LIKE
                });
                this.readChildNodes(node, filter);
                var wildCard = node.getAttribute("wildCard");
                var singleChar = node.getAttribute("singleChar");
                var esc = node.getAttribute("escape");
                filter.value2regex(wildCard, singleChar, esc);
                obj.filters.push(filter);
            },
            "Literal": function(node, obj) {
                obj.value = this.getChildValue(node);
            },
            "PropertyName": function(node, filter) {
                filter.property = this.getChildValue(node);
            },
            "LowerBoundary": function(node, filter) {
                filter.lowerBoundary = this.readOgcExpression(node);
            },
            "UpperBoundary": function(node, filter) {
                filter.upperBoundary = this.readOgcExpression(node);
            }
        }
    },
    
    /**
     * Method: readOgcExpression
     * Limited support for OGC expressions.
     *
     * Parameters:
     * node - {DOMElement} A DOM element that contains an ogc:expression.
     *
     * Returns:
     * {String} A value to be used in a symbolizer.
     */
    readOgcExpression: function(node) {
        var obj = {};
        this.readChildNodes(node, obj);
        var value = obj.value;
        if(!value) {
            value = this.getChildValue(node);
        }
        return value;
    },
    
    /**
     * Property: cssMap
     * {Object} Object mapping supported css property names to OpenLayers
     *     symbolizer property names.
     */
    cssMap: {
        "stroke": "strokeColor",
        "stroke-opacity": "strokeOpacity",
        "stroke-width": "strokeWidth",
        "stroke-linecap": "strokeLinecap",
        "fill": "fillColor",
        "fill-opacity": "fillOpacity",
        "font-family": "fontFamily",
        "font-size": "fontSize"
    },
    
    /**
     * Method: getCssProperty
     * Given a symbolizer property, get the corresponding CSS property
     *     from the <cssMap>.
     *
     * Parameters:
     * sym - {String} A symbolizer property name.
     *
     * Returns:
     * {String} A CSS property name or null if none found.
     */
    getCssProperty: function(sym) {
        var css = null;
        for(var prop in this.cssMap) {
            if(this.cssMap[prop] == sym) {
                css = prop;
                break;
            }
        }
        return css;
    },
    
    /**
     * Method: getGraphicFormat
     * Given a href for an external graphic, try to determine the mime-type.
     *     This method doesn't try too hard, and will fall back to
     *     <defautlGraphicFormat> if one of the known <graphicFormats> is not
     *     the file extension of the provided href.
     *
     * Parameters:
     * href - {String}
     *
     * Returns:
     * {String} The graphic format.
     */
    getGraphicFormat: function(href) {
        var format, regex;
        for(var key in this.graphicFormats) {
            if(this.graphicFormats[key].test(href)) {
                format = key;
                break;
            }
        }
        return format || this.defautlGraphicFormat;
    },
    
    /**
     * Property: defaultGraphicFormat
     * {String} If none other can be determined from <getGraphicFormat>, this
     *     default will be returned.
     */
    defaultGraphicFormat: "image/png",
    
    /**
     * Property: graphicFormats
     * {Object} Mapping of image mime-types to regular extensions matching 
     *     well-known file extensions.
     */
    graphicFormats: {
        "image/jpeg": /\.jpe?g$/i,
        "image/gif": /\.gif$/i,
        "image/png": /\.png$/i
    },

    /**
     * Method: write
     *
     * Parameters:
     * sld - {Object} An object representing the SLD.
     *
     * Returns:
     * {DOMElement} The root of an SLD document.
     */
    write: function(sld) {
        return this.writers.sld.StyledLayerDescriptor.apply(this, [sld]);
    },
    
    /**
     * Property: writers
     * As a compliment to the readers property, this structure contains public
     *     writing functions grouped by namespace alias and named like the
     *     node names they produce.
     */
    writers: {
        "sld": {
            "StyledLayerDescriptor": function(sld) {
                var root = this.createElementNSPlus(
                    "StyledLayerDescriptor",
                    {attributes: {
                        "version": this.VERSION,
                        "xsi:schemaLocation": this.schemaLocation
                    }}
                );
                // add in optional name
                if(sld.name) {
                    this.writeNode(root, "Name", sld.name);
                }
                // add in optional title
                if(sld.title) {
                    this.writeNode(root, "Title", sld.title);
                }
                // add in optional description
                if(sld.description) {
                    this.writeNode(root, "Abstract", sld.description);
                }
                // add in named layers
                for(var name in sld.namedLayers) {
                    this.writeNode(root, "NamedLayer", sld.namedLayers[name]);
                }
                return root;
            },
            "Name": function(name) {
                return this.createElementNSPlus("Name", {value: name});
            },
            "Title": function(title) {
                return this.createElementNSPlus("Title", {value: title});
            },
            "Abstract": function(description) {
                return this.createElementNSPlus(
                    "Abstract", {value: description}
                );
            },
            "NamedLayer": function(layer) {
                var node = this.createElementNSPlus("NamedLayer");

                // add in required name
                this.writeNode(node, "Name", layer.name);

                // optional sld:LayerFeatureConstraints here

                // add in named styles
                if(layer.namedStyles) {
                    for(var i=0; i<layer.namedStyles.length; ++i) {
                        this.writeNode(
                            node, "NamedStyle", layer.namedStyles[i]
                        );
                    }
                }
                
                // add in user styles
                if(layer.userStyles) {
                    for(var i=0; i<layer.userStyles.length; ++i) {
                        this.writeNode(
                            node, "UserStyle", layer.userStyles[i]
                        );
                    }
                }
                
                return node;
            },
            "NamedStyle": function(name) {
                var node = this.createElementNSPlus("NamedStyle");
                this.writeNode(node, "Name", name);
                return node;
            },
            "UserStyle": function(style) {
                var node = this.createElementNSPlus("UserStyle");

                // add in optional name
                if(style.name) {
                    this.writeNode(node, "Name", style.name);
                }
                // add in optional title
                if(style.title) {
                    this.writeNode(node, "Title", style.title);
                }
                // add in optional description
                if(style.description) {
                    this.writeNode(node, "Abstract", style.description);
                }
                
                // add isdefault
                if(style.isDefault) {
                    this.writeNode(node, "IsDefault", style.isDefault);
                }
                
                // add FeatureTypeStyles
                this.writeNode(node, "FeatureTypeStyle", style);
                
                return node;
            },
            "IsDefault": function(bool) {
                return this.createElementNSPlus(
                    "IsDefault", {value: (bool) ? "1" : "0"}
                );
            },
            "FeatureTypeStyle": function(style) {
                var node = this.createElementNSPlus("FeatureTypeStyle");
                
                // OpenLayers currently stores no Name, Title, Abstract,
                // FeatureTypeName, or SemanticTypeIdentifier information
                // related to FeatureTypeStyle
                
                // add in rules
                for(var i=0; i<style.rules.length; ++i) {
                    this.writeNode(node, "Rule", style.rules[i]);
                }
                
                return node;
            },
            "Rule": function(rule) {
                var node = this.createElementNSPlus("Rule");

                // add in optional name
                if(rule.name) {
                    this.writeNode(node, "Name", rule.name);
                }
                // add in optional title
                if(rule.title) {
                    this.writeNode(node, "Title", rule.title);
                }
                // add in optional description
                if(rule.description) {
                    this.writeNode(node, "Abstract", rule.description);
                }
                
                // add in LegendGraphic here
                
                // add in optional filters
                if(rule.elseFilter) {
                    this.writeNode(node, "ElseFilter");
                } else if(rule.filter) {
                    this.writeNode(node, "ogc:Filter", rule.filter);
                }
                
                // add in scale limits
                if(rule.minScaleDenominator != undefined) {
                    this.writeNode(
                        node, "MinScaleDenominator", rule.minScaleDenominator
                    );
                }
                if(rule.maxScaleDenominator != undefined) {
                    this.writeNode(
                        node, "MaxScaleDenominator", rule.maxScaleDenominator
                    );
                }
                
                // add in symbolizers (relies on geometry type keys)
                var types = OpenLayers.Style.SYMBOLIZER_PREFIXES;
                var type, symbolizer;
                for(var i=0; i<types.length; ++i) {
                    type = types[i];
                    symbolizer = rule.symbolizer[type];
                    if(symbolizer) {
                        this.writeNode(
                            node, type + "Symbolizer", symbolizer
                        );
                    }
                }
                return node;

            },
            "ElseFilter": function() {
                return this.createElementNSPlus("ElseFilter");
            },
            "MinScaleDenominator": function(scale) {
                return this.createElementNSPlus(
                    "MinScaleDenominator", {value: scale}
                );
            },
            "MaxScaleDenominator": function(scale) {
                return this.createElementNSPlus(
                    "MaxScaleDenominator", {value: scale}
                );
            },
            "LineSymbolizer": function(symbolizer) {
                var node = this.createElementNSPlus("LineSymbolizer");
                this.writeNode(node, "Stroke", symbolizer);
                return node;
            },
            "Stroke": function(symbolizer) {
                var node = this.createElementNSPlus("Stroke");

                // GraphicFill here
                // GraphicStroke here

                // add in CssParameters
                if(symbolizer.strokeColor != undefined) {
                    this.writeNode(
                        node, "CssParameter",
                        {symbolizer: symbolizer, key: "strokeColor"}
                    );
                }
                if(symbolizer.strokeOpacity != undefined) {
                    this.writeNode(
                        node, "CssParameter",
                        {symbolizer: symbolizer, key: "strokeOpacity"}
                    );
                }
                if(symbolizer.strokeWidth != undefined) {
                    this.writeNode(
                        node, "CssParameter",
                        {symbolizer: symbolizer, key: "strokeWidth"}
                    );
                }
                return node;
            },
            "CssParameter": function(obj) {
                // not handling ogc:expressions for now
                return this.createElementNSPlus("CssParameter", {
                    attributes: {name: this.getCssProperty(obj.key)},
                    value: obj.symbolizer[obj.key]
                });
            },
            "TextSymbolizer": function(symbolizer) {
                var node = this.createElementNSPlus("TextSymbolizer");
                // add in optional Label
                if(symbolizer.label != null) {
                    this.writeNode(node, "Label", symbolizer.label);
                }
                // add in optional Font
                if(symbolizer.fontFamily != null ||
                   symbolizer.fontSize != null) {
                    this.writeNode(node, "Font", symbolizer);
                }
                // add in optional Fill
                if(symbolizer.fillColor != null ||
                   symbolizer.fillOpacity != null) {
                    this.writeNode(node, "Fill", symbolizer);
                }
                return node;
            },
            "Font": function(symbolizer) {
                var node = this.createElementNSPlus("Font");
                // add in CssParameters
                if(symbolizer.fontFamily) {
                    this.writeNode(
                        node, "CssParameter",
                        {symbolizer: symbolizer, key: "fontFamily"}
                    );
                }
                if(symbolizer.fontSize) {
                    this.writeNode(
                        node, "CssParameter",
                        {symbolizer: symbolizer, key: "fontSize"}
                    );
                }
                return node;
            },
            "Label": function(label) {
                // only the simplest of ogc:expression handled
                // {label: "some text and a ${propertyName}"}
                var node = this.createElementNSPlus("Label");
                var tokens = label.split("${");
                node.appendChild(this.createTextNode(tokens[0]));
                var item, last;
                for(var i=1; i<tokens.length; i++) {
                    item = tokens[i];
                    last = item.indexOf("}"); 
                    if(last > 0) {
                        this.writeNode(
                            node, "ogc:PropertyName",
                            {property: item.substring(0, last)}
                        );
                        node.appendChild(
                            this.createTextNode(item.substring(++last))
                        );
                    } else {
                        // no ending }, so this is a literal ${
                        node.appendChild(
                            this.createTextNode("${" + item)
                        );
                    }
                }
                return node;
            },
            "PolygonSymbolizer": function(symbolizer) {
                var node = this.createElementNSPlus("PolygonSymbolizer");
                this.writeNode(node, "Fill", symbolizer);
                this.writeNode(node, "Stroke", symbolizer);
                return node;
            },
            "Fill": function(symbolizer) {
                var node = this.createElementNSPlus("Fill");
                
                // GraphicFill here
                
                // add in CssParameters
                if(symbolizer.fillColor) {
                    this.writeNode(
                        node, "CssParameter",
                        {symbolizer: symbolizer, key: "fillColor"}
                    );
                }
                if(symbolizer.fillOpacity) {
                    this.writeNode(
                        node, "CssParameter",
                        {symbolizer: symbolizer, key: "fillOpacity"}
                    );
                }
                return node;
            },
            "PointSymbolizer": function(symbolizer) {
                var node = this.createElementNSPlus("PointSymbolizer");
                this.writeNode(node, "Graphic", symbolizer);
                return node;
            },
            "Graphic": function(symbolizer) {
                var node = this.createElementNSPlus("Graphic");
                if(symbolizer.externalGraphic != undefined) {
                    this.writeNode(node, "ExternalGraphic", symbolizer);
                } else if(symbolizer.graphicName) {
                    this.writeNode(node, "Mark", symbolizer);
                }
                
                if(symbolizer.graphicOpacity != undefined) {
                    this.writeNode(node, "Opacity", symbolizer.graphicOpacity);
                }
                if(symbolizer.pointRadius != undefined) {
                    this.writeNode(node, "Size", symbolizer.pointRadius * 2);
                }
                if(symbolizer.rotation != undefined) {
                    this.writeNode(node, "Rotation", symbolizer.rotation);
                }
                return node;
            },
            "ExternalGraphic": function(symbolizer) {
                var node = this.createElementNSPlus("ExternalGraphic");
                this.writeNode(
                    node, "OnlineResource", symbolizer.externalGraphic
                );
                var format = symbolizer.graphicFormat ||
                             this.getGraphicFormat(symbolizer.externalGraphic);
                this.writeNode(node, "Format", format);
                return node;
            },
            "Mark": function(symbolizer) {
                var node = this.createElementNSPlus("Mark");
                this.writeNode(node, "WellKnownName", symbolizer.graphicName);
                this.writeNode(node, "Fill", symbolizer);
                this.writeNode(node, "Stroke", symbolizer);
                return node;
            },
            "WellKnownName": function(name) {
                return this.createElementNSPlus("WellKnownName", {
                    value: name
                });
            },
            "Opacity": function(value) {
                return this.createElementNSPlus("Opacity", {
                    value: value
                });
            },
            "Size": function(value) {
                return this.createElementNSPlus("Size", {
                    value: value
                });
            },
            "Rotation": function(value) {
                return this.createElementNSPlus("Rotation", {
                    value: value
                });
            },
            "OnlineResource": function(href) {
                return this.createElementNSPlus("OnlineResource", {
                    attributes: {
                        "xlink:type": "simple",
                        "xlink:href": href
                    }
                });
            },
            "Format": function(format) {
                return this.createElementNSPlus("Format", {
                    value: format
                });
            }
        },
        "ogc": {
            "Filter": function(filter) {
                var node = this.createElementNSPlus("ogc:Filter");
                var sub = filter.CLASS_NAME.split(".").pop();
                if(sub == "FeatureId") {
                    for(var i=0; i<filter.fids.length; ++i) {
                        this.writeNode(node, "FeatureId", filter.fids[i]);
                    }
                } else {
                    this.writeNode(node, this.getFilterType(filter), filter);
                }
                return node;
            },
            "FeatureId": function(fid) {
                return this.createElementNSPlus("ogc:FeatureId", {
                    attributes: {fid: fid}
                });
            },
            "And": function(filter) {
                var node = this.createElementNSPlus("ogc:And");
                var childFilter;
                for(var i=0; i<filter.filters.length; ++i) {
                    childFilter = filter.filters[i];
                    this.writeNode(
                        node, this.getFilterType(childFilter), childFilter
                    );
                }
                return node;
            },
            "Or": function(filter) {
                var node = this.createElementNSPlus("ogc:Or");
                var childFilter;
                for(var i=0; i<filter.filters.length; ++i) {
                    childFilter = filter.filters[i];
                    this.writeNode(
                        node, this.getFilterType(childFilter), childFilter
                    );
                }
                return node;
            },
            "Not": function(filter) {
                var node = this.createElementNSPlus("ogc:Not");
                var childFilter = filter.filters[0];
                this.writeNode(
                    node, this.getFilterType(childFilter), childFilter
                );
                return node;
            },
            "PropertyIsEqualTo": function(filter) {
                var node = this.createElementNSPlus("ogc:PropertyIsEqualTo");
                // no ogc:expression handling for now
                this.writeNode(node, "PropertyName", filter);
                this.writeNode(node, "Literal", filter.value);
                return node;
            },
            "PropertyIsNotEqualTo": function(filter) {
                var node = this.createElementNSPlus("ogc:PropertyIsNotEqualTo");
                // no ogc:expression handling for now
                this.writeNode(node, "PropertyName", filter);
                this.writeNode(node, "Literal", filter.value);
                return node;
            },
            "PropertyIsLessThan": function(filter) {
                var node = this.createElementNSPlus("ogc:PropertyIsLessThan");
                // no ogc:expression handling for now
                this.writeNode(node, "PropertyName", filter);
                this.writeNode(node, "Literal", filter.value);                
                return node;
            },
            "PropertyIsGreaterThan": function(filter) {
                var node = this.createElementNSPlus("ogc:PropertyIsGreaterThan");
                // no ogc:expression handling for now
                this.writeNode(node, "PropertyName", filter);
                this.writeNode(node, "Literal", filter.value);
                return node;
            },
            "PropertyIsLessThanOrEqualTo": function(filter) {
                var node = this.createElementNSPlus("ogc:PropertyIsLessThanOrEqualTo");
                // no ogc:expression handling for now
                this.writeNode(node, "PropertyName", filter);
                this.writeNode(node, "Literal", filter.value);
                return node;
            },
            "PropertyIsGreaterThanOrEqualTo": function(filter) {
                var node = this.createElementNSPlus("ogc:PropertyIsGreaterThanOrEqualTo");
                // no ogc:expression handling for now
                this.writeNode(node, "PropertyName", filter);
                this.writeNode(node, "Literal", filter.value);
                return node;
            },
            "PropertyIsBetween": function(filter) {
                var node = this.createElementNSPlus("ogc:PropertyIsBetween");
                // no ogc:expression handling for now
                this.writeNode(node, "PropertyName", filter);
                this.writeNode(node, "LowerBoundary", filter);
                this.writeNode(node, "UpperBoundary", filter);
                return node;
            },
            "PropertyIsLike": function(filter) {
                var node = this.createElementNSPlus("ogc:PropertyIsLike", {
                    attributes: {
                        wildCard: "*", singleChar: ".", escape: "!"
                    }
                });
                // no ogc:expression handling for now
                this.writeNode(node, "PropertyName", filter);
                // convert regex string to ogc string
                this.writeNode(node, "Literal", filter.regex2value());
                return node;
            },
            "PropertyName": function(filter) {
                // no ogc:expression handling for now
                return this.createElementNSPlus("ogc:PropertyName", {
                    value: filter.property
                });
            },
            "Literal": function(value) {
                // no ogc:expression handling for now
                return this.createElementNSPlus("ogc:Literal", {
                    value: value
                });
            },
            "LowerBoundary": function(filter) {
                // no ogc:expression handling for now
                var node = this.createElementNSPlus("ogc:LowerBoundary");
                this.writeNode(node, "Literal", filter.lowerBoundary);
                return node;
            },
            "UpperBoundary": function(filter) {
                // no ogc:expression handling for now
                var node = this.createElementNSPlus("ogc:UpperBoundary");
                this.writeNode(node, "Literal", filter.upperBoundary);
                return node;
            }
        }
    },
    
    /**
     * Method: getFilterType
     */
    getFilterType: function(filter) {
        var filterType = this.filterMap[filter.type];
        if(!filterType) {
            throw "SLD writing not supported for rule type: " + filter.type;
        }
        return filterType;
    },
    
    /**
     * Property: filterMap
     * {Object} Contains a member for each filter type.  Values are node names
     *     for corresponding OGC Filter child elements.
     */
    filterMap: {
        "&&": "And",
        "||": "Or",
        "!": "Not",
        "==": "PropertyIsEqualTo",
        "!=": "PropertyIsNotEqualTo",
        "<": "PropertyIsLessThan",
        ">": "PropertyIsGreaterThan",
        "<=": "PropertyIsLessThanOrEqualTo",
        ">=": "PropertyIsGreaterThanOrEqualTo",
        "..": "PropertyIsBetween",
        "~": "PropertyIsLike"
    },
    

    /**
     * Methods below this point are of general use for versioned XML parsers.
     * These are candidates for an abstract class.
     */
    
    /**
     * Method: getNamespacePrefix
     * Get the namespace prefix for a given uri from the <namespaces> object.
     *
     * Returns:
     * {String} A namespace prefix or null if none found.
     */
    getNamespacePrefix: function(uri) {
        var prefix = null;
        if(uri == null) {
            prefix = this.namespaces[this.defaultPrefix];
        } else {
            var gotPrefix = false;
            for(prefix in this.namespaces) {
                if(this.namespaces[prefix] == uri) {
                    gotPrefix = true;
                    break;
                }
            }
            if(!gotPrefix) {
                prefix = null;
            }
        }
        return prefix;
    },


    /**
     * Method: readChildNodes
     */
    readChildNodes: function(node, obj) {
        var children = node.childNodes;
        var child, group, reader, prefix, local;
        for(var i=0; i<children.length; ++i) {
            child = children[i];
            if(child.nodeType == 1) {
                prefix = this.getNamespacePrefix(child.namespaceURI);
                local = child.nodeName.split(":").pop();
                group = this.readers[prefix];
                if(group) {
                    reader = group[local];
                    if(reader) {
                        reader.apply(this, [child, obj]);
                    }
                }
            }
        }
    },

    /**
     * Method: writeNode
     * Shorthand for applying one of the named writers and appending the
     *     results to a node.  If a qualified name is not provided for the
     *     second argument (and a local name is used instead), the namespace
     *     of the parent node will be assumed.
     *
     * Parameters:
     * parent - {DOMElement} Result will be appended to this node.
     * name - {String} The name of a node to generate.  If a qualified name
     *     (e.g. "pre:Name") is used, the namespace prefix is assumed to be
     *     in the <writers> group.  If a local name is used (e.g. "Name") then
     *     the namespace of the parent is assumed.
     * obj - {Object} Structure containing data for the writer.
     *
     * Returns:
     * {DOMElement} The child node.
     */
    writeNode: function(parent, name, obj) {
        var prefix, local;
        var split = name.indexOf(":");
        if(split > 0) {
            prefix = name.substring(0, split);
            local = name.substring(split + 1);
        } else {
            prefix = this.getNamespacePrefix(parent.namespaceURI);
            local = name;
        }
        var child = this.writers[prefix][local].apply(this, [obj]);
        parent.appendChild(child);
        return child;
    },
    
    /**
     * Method: createElementNSPlus
     * Shorthand for creating namespaced elements with optional attributes and
     *     child text nodes.
     *
     * Parameters:
     * name - {String} The qualified node name.
     * options - {Object} Optional object for node configuration.
     *
     * Returns:
     * {Element} An element node.
     */
    createElementNSPlus: function(name, options) {
        options = options || {};
        var loc = name.indexOf(":");
        // order of prefix preference
        // 1. in the uri option
        // 2. in the prefix option
        // 3. in the qualified name
        // 4. from the defaultPrefix
        var uri = options.uri || this.namespaces[options.prefix];
        if(!uri) {
            loc = name.indexOf(":");
            uri = this.namespaces[name.substring(0, loc)];
        }
        if(!uri) {
            uri = this.namespaces[this.defaultPrefix];
        }
        var node = this.createElementNS(uri, name);
        if(options.attributes) {
            this.setAttributes(node, options.attributes);
        }
        if(options.value) {
            node.appendChild(this.createTextNode(options.value));
        }
        return node;
    },
    
    /**
     * Method: setAttributes
     * Set multiple attributes given key value pairs from an object.
     *
     * Parameters:
     * node - {Element} An element node.
     * obj - {Object || Array} An object whose properties represent attribute
     *     names and values represent attribute values.  If an attribute name
     *     is a qualified name ("prefix:local"), the prefix will be looked up
     *     in the parsers {namespaces} object.  If the prefix is found,
     *     setAttributeNS will be used instead of setAttribute.
     */
    setAttributes: function(node, obj) {
        var value, loc, alias, uri;
        for(var name in obj) {
            value = obj[name].toString();
            // check for qualified attribute name ("prefix:local")
            uri = this.namespaces[name.substring(0, name.indexOf(":"))] || null;
            this.setAttributeNS(node, uri, name, value);
        }
    },

    CLASS_NAME: "OpenLayers.Format.SLD.v1" 

});
