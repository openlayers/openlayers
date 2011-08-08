/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML.js
 * @requires OpenLayers/Format/KML.js
 * @requires OpenLayers/Format/GML.js
 * @requires OpenLayers/Format/GML/v2.js
 * @requires OpenLayers/Format/SLD/v1_0_0.js
 * @requires OpenLayers/Format/OWSContext.js
 * @requires OpenLayers/Format/OWSCommon/v1_0_0.js
 */

/**
 * Class: OpenLayers.Format.OWSContext.v0_3_1
 * Read and write OWSContext version 0.3.1.
 *
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.OWSContext.v0_3_1 = OpenLayers.Class(OpenLayers.Format.XML, {
    
    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
        owc: "http://www.opengis.net/ows-context",
        gml: "http://www.opengis.net/gml",
        kml: "http://www.opengis.net/kml/2.2",
        ogc: "http://www.opengis.net/ogc",
        ows: "http://www.opengis.net/ows",
        sld: "http://www.opengis.net/sld",
        xlink: "http://www.w3.org/1999/xlink",
        xsi: "http://www.w3.org/2001/XMLSchema-instance"
    },

    /**
     * Constant: VERSION
     * {String} 0.3.1
     */
    VERSION: "0.3.1", 

    /**
     * Property: schemaLocation
     * {String} Schema location
     */
    schemaLocation: "http://www.opengis.net/ows-context http://www.ogcnetwork.net/schemas/owc/0.3.1/owsContext.xsd",

    /**
     * Property: defaultPrefix
     * {String} Default namespace prefix to use.
     */
    defaultPrefix: "owc",

    /**
     * APIProperty: extractAttributes
     * {Boolean} Extract attributes from GML.  Default is true.
     */
    extractAttributes: true,
    
    /**
     * APIProperty: xy
     * {Boolean} Order of the GML coordinate true:(x,y) or false:(y,x)
     * Changing is not recommended, a new Format should be instantiated.
     */ 
    xy: true, 

    /**
     * Property: regExes
     * Compiled regular expressions for manipulating strings.
     */
    regExes: {
        trimSpace: (/^\s*|\s*$/g),
        removeSpace: (/\s*/g),
        splitSpace: (/\s+/),
        trimComma: (/\s*,\s*/g)
    },

    /**
     * Property: featureNS
     * {String} The namespace uri to use for writing InlineGeometry
     */
    featureNS: "http://mapserver.gis.umn.edu/mapserver",

    /**
     * Property: featureType
     * {String} The name to use as the feature type when writing out
     *     InlineGeometry
     */
    featureType: 'vector',
              
    /**
     * Property: geometryName
     * {String} The name to use for the geometry attribute when writing out
     *     InlineGeometry
     */
    geometryName: 'geometry',

    /**
     * Property: nestingLayerLookup
     * {Object} Hashtable lookup for nesting layer nodes. Used while writing 
     *     the OWS context document. It is necessary to keep track of the 
     *     nestingPaths for which nesting layer nodes have already been 
     *     created, so (nesting) layer nodes are added to those nodes.
     *
     * For example:
     *
     *     If there are three layers with nestingPaths:
     *         layer1.metadata.nestingPath = "a/b/"
     *         layer2.metadata.nestingPath = "a/b/"
     *         layer2.metadata.nestingPath = "a/c"
     *
     *     then a nesting layer node "a" should be created once and added 
     *     to the resource list, a nesting layer node "b" should be created 
     *     once and added under "a", and a nesting layer node "c" should be 
     *     created and added under "a". The lookup paths for these nodes 
     *     will be "a", "a/b", and "a/c" respectively.
     */
    nestingLayerLookup: null,

    /**
     * Constructor: OpenLayers.Format.OWSContext.v0_3_1
     * Instances of this class are not created directly.  Use the
     *     <OpenLayers.Format.OWSContext> constructor instead.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.XML.prototype.initialize.apply(this, [options]);
        OpenLayers.Format.GML.v2.prototype.setGeometryTypes.call(this);
    },

    /**
     * Method: setNestingPath
     * Set the nestingPath property of the layer depending on the position
     *     of the layer in hierarchy of layers.
     *
     * Parameters:
     * l - {Object} An object that may have a layersContext array property.
     * 
     */
    setNestingPath : function(l){
        if(l.layersContext){
            for (var i = 0, len = l.layersContext.length; i < len; i++) {
                var layerContext = l.layersContext[i];
                var nPath = [];
                var nTitle = l.title || "";
                if(l.metadata && l.metadata.nestingPath){
                    nPath = l.metadata.nestingPath.slice();
                }
                if (nTitle != "") {
                    nPath.push(nTitle);
                }
                layerContext.metadata.nestingPath = nPath;
                if(layerContext.layersContext){
                    this.setNestingPath(layerContext);
                }
            }
        }
    },

    /**
     * Function: decomposeNestingPath
     * Takes a nestingPath like "a/b/c" and decomposes it into subpaths:
     * "a", "a/b", "a/b/c"
     *
     * Parameters:
     * nPath  - {Array} the nesting path
     *
     * Returns:
     * Array({String}) Array with subpaths, or empty array if there is nothing
     *     to decompose
     */
    decomposeNestingPath: function(nPath){
        var a = [];
        if (OpenLayers.Util.isArray(nPath)) {
            var path = nPath.slice();
            while (path.length > 0) {
                a.push(path.slice());
                path.pop();
            }
            a.reverse();
        }
        return a;
    },

    /**
     * APIMethod: read
     * Read OWS context data from a string or DOMElement, and return a list 
     *     of layers. 
     * 
     * Parameters: 
     * data - {String} or {DOMElement} data to read/parse.
     *
     * Returns:
     * {Object} The context object with a flat layer list as a property named
     *     layersContext.
     */
    read: function(data) {
        if(typeof data == "string") {
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }
        if(data && data.nodeType == 9) {
            data = data.documentElement;
        }
        var context = {};
        this.readNode(data, context);
        // since an OWSContext can be nested we need to go through this
        // structure recursively      
        this.setNestingPath({layersContext : context.layersContext});
        // after nesting path has been set, create a flat list of layers
        var layers = [];
        this.processLayer(layers, context);
        delete context.layersContext;
        context.layersContext = layers;
        return context;
    },

    /**
     * Method: processLayer
     * Recursive function to get back a flat list of layers from the hierarchic
     *     layer structure.
     *
     * Parameters:
     * layerArray - {Array({Object})} Array of layerContext objects
     * layerContext - {Object} layerContext object
     */
    processLayer: function(layerArray, layer) {
        if (layer.layersContext) {
            for (var i=0, len = layer.layersContext.length; i<len; i++) {
                var l = layer.layersContext[i];
                layerArray.push(l);
                if (l.layersContext) {
                    this.processLayer(layerArray, l);
                }
            }
        }
    },

    /**
     * APIMethod: write
     *
     * Parameters:
     * context - {Object} An object representing the map context.
     * options - {Object} Optional object.
     *
     * Returns:
     * {String} An OWS Context document string.
     */
    write: function(context, options) {
        var name = "OWSContext";
        this.nestingLayerLookup = {}; //start with empty lookup
        options = options || {};
        OpenLayers.Util.applyDefaults(options, context);
        var root = this.writeNode(name, options);
        this.nestingLayerLookup = null; //clear lookup
        this.setAttributeNS(
            root, this.namespaces["xsi"],
            "xsi:schemaLocation", this.schemaLocation
        );
        return OpenLayers.Format.XML.prototype.write.apply(this, [root]);
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
        "kml": {
            "Document": function(node, obj) {
                obj.features = new OpenLayers.Format.KML(
                    {kmlns: this.namespaces.kml, 
                        extractStyles: true}).read(node);
            }
        },
        "owc": { 
            "OWSContext": function(node, obj) {
                this.readChildNodes(node, obj);
            }, 
            "General": function(node, obj) {
                this.readChildNodes(node, obj);
            },
            "ResourceList": function(node, obj) {
                this.readChildNodes(node, obj);
            },
            "Layer": function(node, obj) {
                var layerContext = {
                    metadata: {},
                    visibility: (node.getAttribute("hidden") != "1"),
                    queryable: (node.getAttribute("queryable") == "1"),
                    opacity: ((node.getAttribute("opacity") != null) ? 
                        parseFloat(node.getAttribute("opacity")) : null),
                    name: node.getAttribute("name"),
                    /* A category layer is a dummy layer meant for creating
                       hierarchies. It is not a physical layer in the 
                       OpenLayers sense. The assumption we make here is that
                       category layers do not have a name attribute */
                    categoryLayer: (node.getAttribute("name") == null),
                    formats: [],
                    styles: []
                };
                if (!obj.layersContext) {
                    obj.layersContext = [];
                }
                obj.layersContext.push(layerContext);
                this.readChildNodes(node, layerContext);
            },
            "InlineGeometry": function(node, obj) {
                obj.features = [];
                var elements = this.getElementsByTagNameNS(node, 
                    this.namespaces.gml, "featureMember");
                var el;
                if (elements.length >= 1) {
                    el = elements[0];
                }
                if (el && el.firstChild) {
                    var featurenode = (el.firstChild.nextSibling) ? 
                        el.firstChild.nextSibling : el.firstChild;
                    this.setNamespace("feature", featurenode.namespaceURI);
                    this.featureType = featurenode.localName || 
                        featurenode.nodeName.split(":").pop();
                    this.readChildNodes(node, obj);
                }
            },
            "Server": function(node, obj) {
                // when having multiple Server types, we prefer WMS
                if ((!obj.service && !obj.version) || 
                    (obj.service != 
                        OpenLayers.Format.Context.serviceTypes.WMS)) {
                            obj.service = node.getAttribute("service");
                            obj.version = node.getAttribute("version");
                            this.readChildNodes(node, obj);
                }
            },
            "Name": function(node, obj) {
                obj.name = this.getChildValue(node);
                this.readChildNodes(node, obj);
            },
            "Title": function(node, obj) {
                obj.title = this.getChildValue(node);
                this.readChildNodes(node, obj);
            },
            "StyleList": function(node, obj) {
                this.readChildNodes(node, obj.styles);
            },
            "Style": function(node, obj) {
                var style = {};
                obj.push(style);
                this.readChildNodes(node, style);
            },
            "LegendURL": function(node, obj) {
                var legend = {};
                obj.legend = legend;
                this.readChildNodes(node, legend);
            },
            "OnlineResource": function(node, obj) {
                obj.url = this.getAttributeNS(node, this.namespaces.xlink, 
                    "href");
                this.readChildNodes(node, obj);
            }
        },
        "ows": OpenLayers.Format.OWSCommon.v1_0_0.prototype.readers.ows,
        "gml": OpenLayers.Format.GML.v2.prototype.readers.gml,
        "sld": OpenLayers.Format.SLD.v1_0_0.prototype.readers.sld,
        "feature": OpenLayers.Format.GML.v2.prototype.readers.feature
    },

    /**
     * Property: writers
     * As a compliment to the readers property, this structure contains public
     *     writing functions grouped by namespace alias and named like the
     *     node names they produce.
     */
    writers: {
        "owc": {
            "OWSContext": function(options) {
                var node = this.createElementNSPlus("OWSContext", {
                    attributes: {
                        version: this.VERSION,
                        id: options.id || OpenLayers.Util.createUniqueID("OpenLayers_OWSContext_")
                    } 
                }); 
                this.writeNode("General", options, node);
                this.writeNode("ResourceList", options, node);
                return node; 
            },
            "General": function(options) {
                var node = this.createElementNSPlus("General");
                this.writeNode("ows:BoundingBox", options, node);
                this.writeNode("ows:Title", options.title || 'OpenLayers OWSContext', node);
                return node;
            },
            "ResourceList": function(options) {
                var node = this.createElementNSPlus("ResourceList");
                for (var i=0, len=options.layers.length; i<len; i++) {
                    var layer = options.layers[i];
                    var decomposedPath = this.decomposeNestingPath(layer.metadata.nestingPath);
                    this.writeNode("_Layer", {layer: layer, subPaths: decomposedPath}, node);
                }
                return node;
            },
            "Server": function(options) {
                var node = this.createElementNSPlus("Server", {attributes: {
                    version: options.version,
                    service: options.service }
                });
                this.writeNode("OnlineResource", options, node);
                return node;
            },
            "OnlineResource": function(options) {
                var node = this.createElementNSPlus("OnlineResource", {attributes: {
                    "xlink:href": options.url }
                });
                return node;
            },
            "InlineGeometry": function(layer) {
                var node = this.createElementNSPlus("InlineGeometry");
                this.writeNode("gml:boundedBy", layer.getDataExtent(), node);
                for (var i=0, len=layer.features.length; i<len; i++) {
                    this.writeNode("gml:featureMember", layer.features[i], node);
                }
                return node;
            },
            "StyleList": function(styles) {
                var node = this.createElementNSPlus("StyleList");
                for (var i=0, len=styles.length; i<len; i++) {
                    this.writeNode("Style", styles[i], node);
                }
                return node;
            },
            "Style": function(style) {
                var node = this.createElementNSPlus("Style");
                this.writeNode("Name", style, node);
                this.writeNode("Title", style, node);
                if (style.legend) {
                    this.writeNode("LegendURL", style, node);
                }
                return node;
            },
            "Name": function(obj) {
                var node = this.createElementNSPlus("Name", {
                    value: obj.name });
                return node;
            },
            "Title": function(obj) {
                var node = this.createElementNSPlus("Title", {
                    value: obj.title });
                return node;
            },
            "LegendURL": function(style) {
                var node = this.createElementNSPlus("LegendURL");
                this.writeNode("OnlineResource", style.legend, node);
                return node;
            },
            "_WMS": function(layer) {
                var node = this.createElementNSPlus("Layer", {attributes: {
                    name: layer.params.LAYERS,
                    queryable: layer.queryable ? "1" : "0",
                    hidden: layer.visibility ? "0" : "1",
                    opacity: layer.opacity ? layer.opacity: null}
                });
                this.writeNode("ows:Title", layer.name, node);
                this.writeNode("ows:OutputFormat", layer.params.FORMAT, node);
                this.writeNode("Server", {service: 
                    OpenLayers.Format.Context.serviceTypes.WMS,
                    version: layer.params.VERSION, url: layer.url}, node);
                if (layer.metadata.styles && layer.metadata.styles.length > 0) {
                    this.writeNode("StyleList", layer.metadata.styles, node);
                }
                return node;
            },
            "_Layer": function(options) {
                var layer, subPaths, node, title;
                layer = options.layer;
                subPaths = options.subPaths;
                node = null;
                title = null;
                // subPaths is an array of an array
                // recursively calling _Layer writer eats up subPaths, until a 
                // real writer is called and nodes are returned.
                if(subPaths.length > 0){
                    var path = subPaths[0].join("/");
                    var index = path.lastIndexOf("/");
                    node = this.nestingLayerLookup[path];
                    title = (index > 0)?path.substring(index + 1, path.length):path;
                    if(!node){
                        // category layer
                        node = this.createElementNSPlus("Layer");
                        this.writeNode("ows:Title", title, node);
                        this.nestingLayerLookup[path] = node;
                    }
                    options.subPaths.shift();//remove a path after each call
                    this.writeNode("_Layer", options, node);
                    return node;
                } else {
                    // write out the actual layer
                    if (layer instanceof OpenLayers.Layer.WMS) {
                        node = this.writeNode("_WMS", layer);
                    } else if (layer instanceof OpenLayers.Layer.Vector) {
                        if (layer.protocol instanceof OpenLayers.Protocol.WFS.v1) {
                            node = this.writeNode("_WFS", layer);
                        } else if (layer.protocol instanceof OpenLayers.Protocol.HTTP) {
                            if (layer.protocol.format instanceof OpenLayers.Format.GML) {
                                layer.protocol.format.version = "2.1.2";
                                node = this.writeNode("_GML", layer);
                            } else if (layer.protocol.format instanceof OpenLayers.Format.KML) {
                                layer.protocol.format.version = "2.2";
                                node = this.writeNode("_KML", layer);
                            }
                        } else {
                            // write out as inline GML since we have no idea
                            // about the original Format
                            this.setNamespace("feature", this.featureNS);
                            node = this.writeNode("_InlineGeometry", layer);
                        }
                    }
                    if (layer.options.maxScale) {
                        this.writeNode("sld:MinScaleDenominator", 
                            layer.options.maxScale, node);
                    }
                    if (layer.options.minScale) {
                        this.writeNode("sld:MaxScaleDenominator", 
                            layer.options.minScale, node);
                    }
                    this.nestingLayerLookup[layer.name] = node;
                    return node;
                }
            },
            "_WFS": function(layer) {
                var node = this.createElementNSPlus("Layer", {attributes: {
                    name: layer.protocol.featurePrefix + ":" + layer.protocol.featureType,
                    hidden: layer.visibility ? "0" : "1" }
                });
                this.writeNode("ows:Title", layer.name, node);
                this.writeNode("Server", {service: 
                    OpenLayers.Format.Context.serviceTypes.WFS, 
                    version: layer.protocol.version, 
                    url: layer.protocol.url}, node);
                return node;
            },
            "_InlineGeometry": function(layer) {
                var node = this.createElementNSPlus("Layer", {attributes: {
                    name: this.featureType,
                    hidden: layer.visibility ? "0" : "1" }
                });
                this.writeNode("ows:Title", layer.name, node);
                this.writeNode("InlineGeometry", layer, node);
                return node;
            },
            "_GML": function(layer) {
                var node = this.createElementNSPlus("Layer");
                this.writeNode("ows:Title", layer.name, node);
                this.writeNode("Server", {service: 
                    OpenLayers.Format.Context.serviceTypes.GML, 
                    url: layer.protocol.url, version: 
                    layer.protocol.format.version}, node);
                return node;
            },
            "_KML": function(layer) {
                var node = this.createElementNSPlus("Layer");
                this.writeNode("ows:Title", layer.name, node);
                this.writeNode("Server", {service: 
                    OpenLayers.Format.Context.serviceTypes.KML,
                    version: layer.protocol.format.version, url: 
                    layer.protocol.url}, node);
                return node;
            }
        },
        "gml": OpenLayers.Util.applyDefaults({
            "boundedBy": function(bounds) {
                var node = this.createElementNSPlus("gml:boundedBy");
                this.writeNode("gml:Box", bounds, node);
                return node;
            }
        }, OpenLayers.Format.GML.v2.prototype.writers.gml),
        "ows": OpenLayers.Format.OWSCommon.v1_0_0.prototype.writers.ows,
        "sld": OpenLayers.Format.SLD.v1_0_0.prototype.writers.sld,
        "feature": OpenLayers.Format.GML.v2.prototype.writers.feature
    },
    
    CLASS_NAME: "OpenLayers.Format.OWSContext.v0_3_1" 

});
