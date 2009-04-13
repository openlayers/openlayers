/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Rule.js
 * @requires OpenLayers/Format/SLD.js
 * @requires OpenLayers/Format/Filter/v1_0_0.js
 */

/**
 * Class: OpenLayers.Format.SLD.v1
 * Superclass for SLD version 1 parsers.
 *
 * Inherits from:
 *  - <OpenLayers.Format.Filter.v1_0_0>
 */
OpenLayers.Format.SLD.v1 = OpenLayers.Class(OpenLayers.Format.Filter.v1_0_0, {
    
    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
        sld: "http://www.opengis.net/sld",
        ogc: "http://www.opengis.net/ogc",
        gml: "http://www.opengis.net/gml",
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
        strokeDashstyle: "solid",
        pointRadius: 3,
        graphicName: "square"
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
        OpenLayers.Format.Filter.v1_0_0.prototype.initialize.apply(this, [options]);
    },
    
    /**
     * Method: read
     *
     * Parameters:
     * data - {DOMElement} An SLD document element.
     * options - {Object} Options for the reader.
     *
     * Valid options:
     * namedLayersAsArray - {Boolean}  Generate a namedLayers array.  If false,
     *     the namedLayers property value will be an object keyed by layer name.
     *     Default is false.
     *
     * Returns:
     * {Object} An object representing the SLD.
     */
    read: function(data, options) {
        options = OpenLayers.Util.applyDefaults(options, this.options);
        var sld = {
            namedLayers: options.namedLayersAsArray === true ? [] : {}
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
    readers: OpenLayers.Util.applyDefaults({
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
                for(var i=0, len=layer.userStyles.length; i<len; ++i) {
                    layer.userStyles[i].layerName = layer.name;
                }
                if(sld.namedLayers instanceof Array) {
                    sld.namedLayers.push(layer);                
                } else {
                    sld.namedLayers[layer.name] = layer;
                }
            },
            "NamedStyle": function(node, layer) {
                layer.namedStyles.push(
                    this.getChildName(node.firstChild)
                );
            },
            "UserStyle": function(node, layer) {
                var obj = {defaultsPerSymbolizer: true, rules: []};
                this.readChildNodes(node, obj);
                var style = new OpenLayers.Style(this.defaultSymbolizer, obj);
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
                rule.minScaleDenominator = parseFloat(this.getChildValue(node));
            },
            "MaxScaleDenominator": function(node, rule) {
                rule.maxScaleDenominator = parseFloat(this.getChildValue(node));
            },
            "TextSymbolizer": function(node, rule) {
                // OpenLayers doens't do painter's order, instead we extend
                var symbolizer = rule.symbolizer["Text"] || {};
                this.readChildNodes(node, symbolizer);
                // in case it didn't exist before
                rule.symbolizer["Text"] = symbolizer;
            },
            "Label": function(node, symbolizer) {
                // only supporting literal or property name
                var obj = {};
                this.readChildNodes(node, obj);
                if(obj.property) {
                    symbolizer.label = "${" + obj.property + "}";
                } else {
                    var value = this.readOgcExpression(node);
                    if(value) {
                        symbolizer.label = value;
                    }
                }
            },
            "Font": function(node, symbolizer) {
                this.readChildNodes(node, symbolizer);
            },
            "Halo": function(node, symbolizer) {
                // halo has a fill, so send fresh object
                var obj = {};
                this.readChildNodes(node, obj);
                symbolizer.haloRadius = obj.haloRadius;
                symbolizer.haloColor = obj.fillColor;
                symbolizer.haloOpacity = obj.fillOpacity;
            },
            "Radius": function(node, symbolizer) {
                var radius = this.readOgcExpression(node);
                if(radius != null) {
                    // radius is only used for halo
                    symbolizer.haloRadius = radius;
                }
            },
            "LineSymbolizer": function(node, rule) {
                // OpenLayers doesn't do painter's order, instead we extend
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
                symbolizer.stroke = true;
                this.readChildNodes(node, symbolizer);
            },
            "Fill": function(node, symbolizer) {
                symbolizer.fill = true;
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
                symbolizer.graphic = true;
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
                for(var i=0, len=properties.length; i<len; ++i) {
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
                var opacity = this.readOgcExpression(node);
                // always string, could be empty string
                if(opacity) {
                    obj.opacity = opacity;
                }
            },
            "Size": function(node, obj) {
                var size = this.readOgcExpression(node);
                // always string, could be empty string
                if(size) {
                    obj.size = size;
                }
            },
            "Rotation": function(node, obj) {
                var rotation = this.readOgcExpression(node);
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
        }
    }, OpenLayers.Format.Filter.v1_0_0.prototype.readers),
    
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
        "stroke-dasharray": "strokeDashstyle",
        "fill": "fillColor",
        "fill-opacity": "fillOpacity",
        "font-family": "fontFamily",
        "font-size": "fontSize",
        "font-weight": "fontWeight",
        "font-style": "fontStyle"
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
    writers: OpenLayers.Util.applyDefaults({
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
                    this.writeNode("Name", sld.name, root);
                }
                // add in optional title
                if(sld.title) {
                    this.writeNode("Title", sld.title, root);
                }
                // add in optional description
                if(sld.description) {
                    this.writeNode("Abstract", sld.description, root);
                }
                // add in named layers
                // allow namedLayers to be an array
                if(sld.namedLayers instanceof Array) {
                    for(var i=0, len=sld.namedLayers.length; i<len; ++i) {
                        this.writeNode("NamedLayer", sld.namedLayers[i], root);
                    }
                } else {
                    for(var name in sld.namedLayers) {
                        this.writeNode("NamedLayer", sld.namedLayers[name], root);
                    }
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
                this.writeNode("Name", layer.name, node);

                // optional sld:LayerFeatureConstraints here

                // add in named styles
                if(layer.namedStyles) {
                    for(var i=0, len=layer.namedStyles.length; i<len; ++i) {
                        this.writeNode(
                            "NamedStyle", layer.namedStyles[i], node
                        );
                    }
                }
                
                // add in user styles
                if(layer.userStyles) {
                    for(var i=0, len=layer.userStyles.length; i<len; ++i) {
                        this.writeNode(
                            "UserStyle", layer.userStyles[i], node
                        );
                    }
                }
                
                return node;
            },
            "NamedStyle": function(name) {
                var node = this.createElementNSPlus("NamedStyle");
                this.writeNode("Name", name, node);
                return node;
            },
            "UserStyle": function(style) {
                var node = this.createElementNSPlus("UserStyle");

                // add in optional name
                if(style.name) {
                    this.writeNode("Name", style.name, node);
                }
                // add in optional title
                if(style.title) {
                    this.writeNode("Title", style.title, node);
                }
                // add in optional description
                if(style.description) {
                    this.writeNode("Abstract", style.description, node);
                }
                
                // add isdefault
                if(style.isDefault) {
                    this.writeNode("IsDefault", style.isDefault, node);
                }
                
                // add FeatureTypeStyles
                this.writeNode("FeatureTypeStyle", style, node);
                
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
                for(var i=0, len=style.rules.length; i<len; ++i) {
                    this.writeNode("Rule", style.rules[i], node);
                }
                
                return node;
            },
            "Rule": function(rule) {
                var node = this.createElementNSPlus("Rule");

                // add in optional name
                if(rule.name) {
                    this.writeNode("Name", rule.name, node);
                }
                // add in optional title
                if(rule.title) {
                    this.writeNode("Title", rule.title, node);
                }
                // add in optional description
                if(rule.description) {
                    this.writeNode("Abstract", rule.description, node);
                }
                
                // add in LegendGraphic here
                
                // add in optional filters
                if(rule.elseFilter) {
                    this.writeNode("ElseFilter", null, node);
                } else if(rule.filter) {
                    this.writeNode("ogc:Filter", rule.filter, node);
                }
                
                // add in scale limits
                if(rule.minScaleDenominator != undefined) {
                    this.writeNode(
                        "MinScaleDenominator", rule.minScaleDenominator, node
                    );
                }
                if(rule.maxScaleDenominator != undefined) {
                    this.writeNode(
                        "MaxScaleDenominator", rule.maxScaleDenominator, node
                    );
                }
                
                // add in symbolizers (relies on geometry type keys)
                var types = OpenLayers.Style.SYMBOLIZER_PREFIXES;
                var type, symbolizer;
                for(var i=0, len=types.length; i<len; ++i) {
                    type = types[i];
                    symbolizer = rule.symbolizer[type];
                    if(symbolizer) {
                        this.writeNode(
                            type + "Symbolizer", symbolizer, node
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
                this.writeNode("Stroke", symbolizer, node);
                return node;
            },
            "Stroke": function(symbolizer) {
                var node = this.createElementNSPlus("Stroke");

                // GraphicFill here
                // GraphicStroke here

                // add in CssParameters
                if(symbolizer.strokeColor != undefined) {
                    this.writeNode(
                        "CssParameter",
                        {symbolizer: symbolizer, key: "strokeColor"},
                        node
                    );
                }
                if(symbolizer.strokeOpacity != undefined) {
                    this.writeNode(
                        "CssParameter",
                        {symbolizer: symbolizer, key: "strokeOpacity"},
                        node
                    );
                }
                if(symbolizer.strokeWidth != undefined) {
                    this.writeNode(
                        "CssParameter",
                        {symbolizer: symbolizer, key: "strokeWidth"},
                        node
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
                    this.writeNode("Label", symbolizer.label, node);
                }
                // add in optional Font
                if(symbolizer.fontFamily != null ||
                   symbolizer.fontSize != null ||
                   symbolizer.fontWeight != null ||
                   symbolizer.fontStyle != null) {
                    this.writeNode("Font", symbolizer, node);
                }
                // add in optional Halo
                if(symbolizer.haloRadius != null ||
                   symbolizer.haloColor != null ||
                   symbolizer.haloOpacity != null) {
                    this.writeNode("Halo", symbolizer, node);
                }
                // add in optional Fill
                if(symbolizer.fillColor != null ||
                   symbolizer.fillOpacity != null) {
                    this.writeNode("Fill", symbolizer, node);
                }
                return node;
            },
            "Font": function(symbolizer) {
                var node = this.createElementNSPlus("Font");
                // add in CssParameters
                if(symbolizer.fontFamily) {
                    this.writeNode(
                        "CssParameter",
                        {symbolizer: symbolizer, key: "fontFamily"},
                        node
                    );
                }
                if(symbolizer.fontSize) {
                    this.writeNode(
                        "CssParameter",
                        {symbolizer: symbolizer, key: "fontSize"},
                        node
                    );
                }
                if(symbolizer.fontWeight) {
                    this.writeNode(
                        "CssParameter",
                        {symbolizer: symbolizer, key: "fontWeight"},
                        node
                    );
                }
                if(symbolizer.fontStyle) {
                    this.writeNode(
                        "CssParameter",
                        {symbolizer: symbolizer, key: "fontStyle"},
                        node
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
                for(var i=1, len=tokens.length; i<len; i++) {
                    item = tokens[i];
                    last = item.indexOf("}"); 
                    if(last > 0) {
                        this.writeNode(
                            "ogc:PropertyName",
                            {property: item.substring(0, last)},
                            node
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
            "Halo": function(symbolizer) {
                var node = this.createElementNSPlus("Halo");
                if(symbolizer.haloRadius) {
                    this.writeNode("Radius", symbolizer.haloRadius, node);
                }
                if(symbolizer.haloColor || symbolizer.haloOpacity) {
                    this.writeNode("Fill", {
                        fillColor: symbolizer.haloColor,
                        fillOpacity: symbolizer.haloOpacity
                    }, node);
                }
                return node;
            },
            "Radius": function(value) {
                return node = this.createElementNSPlus("Radius", {
                    value: value
                });
            },
            "PolygonSymbolizer": function(symbolizer) {
                var node = this.createElementNSPlus("PolygonSymbolizer");
                if(symbolizer.fillColor != undefined ||
                   symbolizer.fillOpacity != undefined) {
                    this.writeNode("Fill", symbolizer, node);
                }
                if(symbolizer.strokeWidth != undefined ||
                   symbolizer.strokeColor != undefined ||
                   symbolizer.strokeOpacity != undefined ||
                   symbolizer.strokeDashstyle != undefined) {
                    this.writeNode("Stroke", symbolizer, node);
                }
                return node;
            },
            "Fill": function(symbolizer) {
                var node = this.createElementNSPlus("Fill");
                
                // GraphicFill here
                
                // add in CssParameters
                if(symbolizer.fillColor) {
                    this.writeNode(
                        "CssParameter",
                        {symbolizer: symbolizer, key: "fillColor"},
                        node
                    );
                }
                if(symbolizer.fillOpacity != null) {
                    this.writeNode(
                        "CssParameter",
                        {symbolizer: symbolizer, key: "fillOpacity"},
                        node
                    );
                }
                return node;
            },
            "PointSymbolizer": function(symbolizer) {
                var node = this.createElementNSPlus("PointSymbolizer");
                this.writeNode("Graphic", symbolizer, node);
                return node;
            },
            "Graphic": function(symbolizer) {
                var node = this.createElementNSPlus("Graphic");
                if(symbolizer.externalGraphic != undefined) {
                    this.writeNode("ExternalGraphic", symbolizer, node);
                } else {
                    this.writeNode("Mark", symbolizer, node);
                }
                
                if(symbolizer.graphicOpacity != undefined) {
                    this.writeNode("Opacity", symbolizer.graphicOpacity, node);
                }
                if(symbolizer.pointRadius != undefined) {
                    this.writeNode("Size", symbolizer.pointRadius * 2, node);
                }
                if(symbolizer.rotation != undefined) {
                    this.writeNode("Rotation", symbolizer.rotation, node);
                }
                return node;
            },
            "ExternalGraphic": function(symbolizer) {
                var node = this.createElementNSPlus("ExternalGraphic");
                this.writeNode(
                    "OnlineResource", symbolizer.externalGraphic, node
                );
                var format = symbolizer.graphicFormat ||
                             this.getGraphicFormat(symbolizer.externalGraphic);
                this.writeNode("Format", format, node);
                return node;
            },
            "Mark": function(symbolizer) {
                var node = this.createElementNSPlus("Mark");
                if(symbolizer.graphicName) {
                    this.writeNode("WellKnownName", symbolizer.graphicName, node);
                }
                this.writeNode("Fill", symbolizer, node);
                this.writeNode("Stroke", symbolizer, node);
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
        }
    }, OpenLayers.Format.Filter.v1_0_0.prototype.writers),
    
    CLASS_NAME: "OpenLayers.Format.SLD.v1" 

});
