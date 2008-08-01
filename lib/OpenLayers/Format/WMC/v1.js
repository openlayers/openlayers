/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML.js
 */

/**
 * Class: OpenLayers.Format.WMC.v1
 * Superclass for WMC version 1 parsers.
 *
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.WMC.v1 = OpenLayers.Class(OpenLayers.Format.XML, {
    
    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
        ol: "http://openlayers.org/context",
        wmc: "http://www.opengis.net/context",
        sld: "http://www.opengis.net/sld",
        xlink: "http://www.w3.org/1999/xlink",
        xsi: "http://www.w3.org/2001/XMLSchema-instance"
    },
    
    /**
     * Property: schemaLocation
     * {String} Schema location for a particular minor version.
     */
    schemaLocation: "",

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
            for(prefix in this.namespaces) {
                if(this.namespaces[prefix] == uri) {
                    break;
                }
            }
        }
        return prefix;
    },
    
    /**
     * Property: defaultPrefix
     */
    defaultPrefix: "wmc",

    /**
     * Property: rootPrefix
     * {String} Prefix on the root node that maps to the context namespace URI.
     */
    rootPrefix: null,
    
    /**
     * Property: defaultStyleName
     * {String} Style name used if layer has no style param.  Default is "".
     */
    defaultStyleName: "",
    
    /**
     * Property: defaultStyleTitle
     * {String} Default style title.  Default is "Default".
     */
    defaultStyleTitle: "Default",
    
    /**
     * Constructor: OpenLayers.Format.WMC.v1
     * Instances of this class are not created directly.  Use the
     *     <OpenLayers.Format.WMC> constructor instead.
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
     * Read capabilities data from a string, and return a list of layers. 
     * 
     * Parameters: 
     * data - {String} or {DOMElement} data to read/parse.
     *
     * Returns:
     * {Array} List of named layers.
     */
    read: function(data) {
        if(typeof data == "string") {
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }
        var root = data.documentElement;
        this.rootPrefix = root.prefix;
        var context = {
            version: root.getAttribute("version")
        };
        this.runChildNodes(context, root);
        return context;
    },
    
    /**
     * Method: runChildNodes
     */
    runChildNodes: function(obj, node) {
        var children = node.childNodes;
        var childNode, processor, prefix, local;
        for(var i=0, len=children.length; i<len; ++i) {
            childNode = children[i];
            if(childNode.nodeType == 1) {
                prefix = this.getNamespacePrefix(childNode.namespaceURI);
                local = childNode.nodeName.split(":").pop();
                processor = this["read_" + prefix + "_" + local];
                if(processor) {
                    processor.apply(this, [obj, childNode]);
                }
            }
        }
    },
    
    /**
     * Method: read_wmc_General
     */
    read_wmc_General: function(context, node) {
        this.runChildNodes(context, node);
    },
    
    /**
     * Method: read_wmc_BoundingBox
     */
    read_wmc_BoundingBox: function(context, node) {
        context.projection = node.getAttribute("SRS");
        context.bounds = new OpenLayers.Bounds(
            parseFloat(node.getAttribute("minx")),
            parseFloat(node.getAttribute("miny")),
            parseFloat(node.getAttribute("maxx")),
            parseFloat(node.getAttribute("maxy"))
        );
    },
    
    /**
     * Method: read_wmc_LayerList
     */
    read_wmc_LayerList: function(context, node) {
        context.layers = [];
        this.runChildNodes(context, node);
    },
    
    /**
     * Method: read_wmc_Layer
     */
    read_wmc_Layer: function(context, node) {
        var layerInfo = {
            params: {},
            options: {
                visibility: (node.getAttribute("hidden") != "1"),
                queryable: (node.getAttribute("queryable") == "1")
                
            },
            formats: [],
            styles: []
        };
        this.runChildNodes(layerInfo, node);
        // set properties common to multiple objects on layer options/params
        layerInfo.params.layers = layerInfo.name;
        layerInfo.options.maxExtent = layerInfo.maxExtent;
        // create the layer
        var layer = this.getLayerFromInfo(layerInfo);
        context.layers.push(layer);
    },
    
    /**
     * Method: getLayerFromInfo
     * Create a WMS layer from a layerInfo object.
     *
     * Parameters:
     * layerInfo - {Object} An object representing a WMS layer.
     *
     * Returns:
     * {<OpenLayers.Layer.WMS>} A WMS layer.
     */
    getLayerFromInfo: function(layerInfo) {
        var options = layerInfo.options;
        if (this.layerOptions) {
            OpenLayers.Util.applyDefaults(options, this.layerOptions);
        }
        var layer = new OpenLayers.Layer.WMS(
            layerInfo.title,
            layerInfo.href,
            layerInfo.params,
            options
        );
        return layer;
    },
    
    /**
     * Method: read_wmc_Extension
     */
    read_wmc_Extension: function(obj, node) {
        this.runChildNodes(obj, node);
    },

    /**
     * Method: read_ol_units
     */
    read_ol_units: function(layerInfo, node) {
        layerInfo.options.units = this.getChildValue(node);
    },
    
    /**
     * Method: read_ol_maxExtent
     */
    read_ol_maxExtent: function(obj, node) {
        var bounds = new OpenLayers.Bounds(
            node.getAttribute("minx"), node.getAttribute("miny"),
            node.getAttribute("maxx"), node.getAttribute("maxy")
        );
        obj.maxExtent = bounds;
    },
    
    /**
     * Method: read_ol_transparent
     */
    read_ol_transparent: function(layerInfo, node) {
        layerInfo.params.transparent = this.getChildValue(node);
    },

    /**
     * Method: read_ol_numZoomLevels
     */
    read_ol_numZoomLevels: function(layerInfo, node) {
        layerInfo.options.numZoomLevels = parseInt(this.getChildValue(node));
    },

    /**
     * Method: read_ol_opacity
     */
    read_ol_opacity: function(layerInfo, node) {
        layerInfo.options.opacity = parseFloat(this.getChildValue(node));
    },

    /**
     * Method: read_ol_singleTile
     */
    read_ol_singleTile: function(layerInfo, node) {
        layerInfo.options.singleTile = (this.getChildValue(node) == "true");
    },

    /**
     * Method: read_ol_isBaseLayer
     */
    read_ol_isBaseLayer: function(layerInfo, node) {
        layerInfo.options.isBaseLayer = (this.getChildValue(node) == "true");
    },

    /**
     * Method: read_ol_displayInLayerSwitcher
     */
    read_ol_displayInLayerSwitcher: function(layerInfo, node) {
        layerInfo.options.displayInLayerSwitcher =
            (this.getChildValue(node) == "true");
    },

    /**
     * Method: read_wmc_Server
     */
    read_wmc_Server: function(layerInfo, node) {
        layerInfo.params.version = node.getAttribute("version");
        this.runChildNodes(layerInfo, node);
    },

    /**
     * Method: read_wmc_FormatList
     */
    read_wmc_FormatList: function(layerInfo, node) {
        this.runChildNodes(layerInfo, node);
    },

    /**
     * Method: read_wmc_Format
     */
    read_wmc_Format: function(layerInfo, node) {
        var format = this.getChildValue(node);
        layerInfo.formats.push(format);
        if(node.getAttribute("current") == "1") {
            layerInfo.params.format = format;
        }
    },
    
    /**
     * Method: read_wmc_StyleList
     */
    read_wmc_StyleList: function(layerInfo, node) {
        this.runChildNodes(layerInfo, node);
    },

    /**
     * Method: read_wmc_Style
     */
    read_wmc_Style: function(layerInfo, node) {
        var style = {};
        this.runChildNodes(style, node);
        if(node.getAttribute("current") == "1") {
            // three style types to consider
            // 1) linked SLD
            // 2) inline SLD
            // 3) named style
            // running child nodes always gets name, optionally gets href or body
            if(style.href) {
                layerInfo.params.sld = style.href;
            } else if(style.body) {
                layerInfo.params.sld_body = style.body;
            } else {
                layerInfo.params.styles = style.name;
            }
        }
        layerInfo.styles.push(style);
    },
    
    /**
     * Method: read_wmc_SLD
     */
    read_wmc_SLD: function(style, node) {
        this.runChildNodes(style, node);
        // style either comes back with an href or a body property
    },
    
    /**
     * Method: read_sld_StyledLayerDescriptor
     */
    read_sld_StyledLayerDescriptor: function(sld, node) {
        var xml = OpenLayers.Format.XML.prototype.write.apply(this, [node]);
        sld.body = xml;
    },

    /**
     * Method: read_wmc_OnlineResource
     */
    read_wmc_OnlineResource: function(obj, node) {
        obj.href = this.getAttributeNS(
            node, this.namespaces.xlink, "href"
        );
    },
    
    /**
     * Method: read_wmc_Name
     */
    read_wmc_Name: function(obj, node) {
        var name = this.getChildValue(node);
        if(name) {
            obj.name = name;
        }
    },

    /**
     * Method: read_wmc_Title
     */
    read_wmc_Title: function(obj, node) {
        var title = this.getChildValue(node);
        if(title) {
            obj.title = title;
        }
    },

    /**
     * Method: read_wmc_MetadataURL
     */
    read_wmc_MetadataURL: function(layerInfo, node) {
        var metadataURL = {};
        var links = node.getElementsByTagName("OnlineResource");
        if(links.length > 0) {
            this.read_wmc_OnlineResource(metadataURL, links[0]);
        }
        layerInfo.options.metadataURL = metadataURL.href;

    },

    /**
     * Method: read_wmc_Abstract
     */
    read_wmc_Abstract: function(obj, node) {
        var abst = this.getChildValue(node);
        if(abst) {
            obj["abstract"] = abst;
        }
    },
    
    /**
     * Method: read_wmc_LatLonBoundingBox
     */
    read_wmc_LatLonBoundingBox: function(layer, node) {
        layer.llbbox = [
            parseFloat(node.getAttribute("minx")),
            parseFloat(node.getAttribute("miny")),
            parseFloat(node.getAttribute("maxx")),
            parseFloat(node.getAttribute("maxy"))
        ];
    },

    /**
     * Method: read_wmc_LegendURL
     */
    read_wmc_LegendURL: function(style, node) {
        var legend = {
            width: node.getAttribute('width'),
            height: node.getAttribute('height')
        };
        var links = node.getElementsByTagName("OnlineResource");
        if(links.length > 0) {
            this.read_wmc_OnlineResource(legend, links[0]);
        }
        style.legend = legend;
    },
    
    /**
     * Method: write
     *
     * Parameters:
     * context - {Object} An object representing the map context.
     * options - {Object} Optional object.
     *
     * Returns:
     * {String} A WMC document string.
     */
    write: function(context, options) {
        var root = this.createElementDefaultNS("ViewContext");
        this.setAttributes(root, {
            version: this.VERSION,
            id: (options && typeof options.id == "string") ?
                    options.id :
                    OpenLayers.Util.createUniqueID("OpenLayers_Context_")
        });
        
        // add schemaLocation attribute
        this.setAttributeNS(
            root, this.namespaces.xsi,
            "xsi:schemaLocation", this.schemaLocation
        );
        
        // required General element
        root.appendChild(this.write_wmc_General(context));

        // required LayerList element
        root.appendChild(this.write_wmc_LayerList(context));

        return OpenLayers.Format.XML.prototype.write.apply(this, [root]);
    },
    
    /**
     * Method: createElementDefaultNS
     * Shorthand for createElementNS with namespace from <defaultPrefix>.
     *     Can optionally be used to set attributes and a text child value.
     *
     * Parameters:
     * name - {String} The qualified node name.
     * childValue - {String} Optional value for text child node.
     * attributes - {Object} Optional object representing attributes.
     *
     * Returns:
     * {Element} An element node.
     */
    createElementDefaultNS: function(name, childValue, attributes) {
        var node = this.createElementNS(
            this.namespaces[this.defaultPrefix],
            name
        );
        if(childValue) {
            node.appendChild(this.createTextNode(childValue));
        }
        if(attributes) {
            this.setAttributes(node, attributes);
        }
        return node;
    },
    
    /**
     * Method: setAttributes
     * Set multiple attributes given key value pairs from an object.
     *
     * Parameters:
     * node - {Element} An element node.
     * obj - {Object} An object whose properties represent attribute names and
     *     values represent attribute values.
     */
    setAttributes: function(node, obj) {
        var value;
        for(var name in obj) {
            value = obj[name].toString();
            if(value.match(/[A-Z]/)) {
                // safari lowercases attributes with setAttribute
                this.setAttributeNS(node, null, name, value);
            } else {
                node.setAttribute(name, value);
            }
        }
    },

    /**
     * Method: write_wmc_General
     * Create a General node given an context object.
     *
     * Parameters:
     * context - {Object} Context object.
     *
     * Returns:
     * {Element} A WMC General element node.
     */
    write_wmc_General: function(context) {
        var node = this.createElementDefaultNS("General");

        // optional Window element
        if(context.size) {
            node.appendChild(this.createElementDefaultNS(
                "Window", null,
                {
                    width: context.size.w,
                    height: context.size.h
                }
            ));
        }
        
        // required BoundingBox element
        var bounds = context.bounds;
        node.appendChild(this.createElementDefaultNS(
            "BoundingBox", null,
            {
                minx: bounds.left.toPrecision(10),
                miny: bounds.bottom.toPrecision(10),
                maxx: bounds.right.toPrecision(10),
                maxy: bounds.top.toPrecision(10),
                SRS: context.projection
            }
        ));

        // required Title element
        node.appendChild(this.createElementDefaultNS(
            "Title", context.title
        ));
        
        // OpenLayers specific map properties
        node.appendChild(this.write_ol_MapExtension(context));
        
        return node;
    },
    
    /**
     * Method: write_ol_MapExtension
     */
    write_ol_MapExtension: function(context) {
        var node = this.createElementDefaultNS("Extension");
        
        var bounds = context.maxExtent;
        if(bounds) {
            var maxExtent = this.createElementNS(
                this.namespaces.ol, "ol:maxExtent"
            );
            this.setAttributes(maxExtent, {
                minx: bounds.left.toPrecision(10),
                miny: bounds.bottom.toPrecision(10),
                maxx: bounds.right.toPrecision(10),
                maxy: bounds.top.toPrecision(10)
            });
            node.appendChild(maxExtent);
        }
        
        return node;
    },
    
    /**
     * Method: write_wmc_LayerList
     * Create a LayerList node given an context object.
     *
     * Parameters:
     * context - {Object} Context object.
     *
     * Returns:
     * {Element} A WMC LayerList element node.
     */
    write_wmc_LayerList: function(context) {
        var list = this.createElementDefaultNS("LayerList");
        
        var layer;
        for(var i=0, len=context.layers.length; i<len; ++i) {
            layer = context.layers[i];
            if(layer instanceof OpenLayers.Layer.WMS) {
                list.appendChild(this.write_wmc_Layer(layer));
            }
        }
        
        return list;
    },

    /**
     * Method: write_wmc_Layer
     * Create a Layer node given a layer object.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer.WMS>} Layer object.
     *
     * Returns:
     * {Element} A WMC Layer element node.
     */
    write_wmc_Layer: function(layer) {
        var node = this.createElementDefaultNS(
            "Layer", null, {
                queryable: layer.queryable ? "1" : "0",
                hidden: layer.visibility ? "0" : "1"
            }
        );
        
        // required Server element
        node.appendChild(this.write_wmc_Server(layer));

        // required Name element
        node.appendChild(this.createElementDefaultNS(
            "Name", layer.params["LAYERS"]
        ));
        
        // required Title element
        node.appendChild(this.createElementDefaultNS(
            "Title", layer.name
        ));

        // optional MetadataURL element
        if (layer.metadataURL) {
            node.appendChild(this.write_wmc_MetadataURL(layer));
        }
        
        // optional FormatList element
        node.appendChild(this.write_wmc_FormatList(layer));

        // optional StyleList element
        node.appendChild(this.write_wmc_StyleList(layer));
        
        // OpenLayers specific properties go in an Extension element
        node.appendChild(this.write_wmc_LayerExtension(layer));

        return node;
    },
    
    /**
     * Method: write_wmc_LayerExtension
     * Add OpenLayers specific layer parameters to an Extension element.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer.WMS>} A WMS layer.
     *
     * Returns:
     * {Element} A WMC Extension element (for a layer).
     */
    write_wmc_LayerExtension: function(layer) {
        var node = this.createElementDefaultNS("Extension");
        
        var bounds = layer.maxExtent;
        var maxExtent = this.createElementNS(
            this.namespaces.ol, "ol:maxExtent"
        );
        this.setAttributes(maxExtent, {
            minx: bounds.left.toPrecision(10),
            miny: bounds.bottom.toPrecision(10),
            maxx: bounds.right.toPrecision(10),
            maxy: bounds.top.toPrecision(10)
        });
        node.appendChild(maxExtent);
        
        var param = layer.params["TRANSPARENT"];
        if(param) {
            var trans = this.createElementNS(
                this.namespaces.ol, "ol:transparent"
            );
            trans.appendChild(this.createTextNode(param));
            node.appendChild(trans);
        }
        
        var properties = [
            "numZoomLevels", "units", "isBaseLayer",
            "opacity", "displayInLayerSwitcher", "singleTile"
        ];
        var child;
        for(var i=0, len=properties.length; i<len; ++i) {
            child = this.createOLPropertyNode(layer, properties[i]);
            if(child) {
                node.appendChild(child);
            }
        }

        return node;
    },
    
    /**
     * Method: createOLPropertyNode
     * Create a node representing an OpenLayers property.  If the property is
     *     null or undefined, null will be returned.
     *
     * Parameters:
     * object - {Object} An object.
     * prop - {String} A property.
     *
     * Returns:
     * {Element} A property node.
     */
    createOLPropertyNode: function(obj, prop) {
        var node = null;
        if(obj[prop] != null) {
            node = this.createElementNS(this.namespaces.ol, "ol:" + prop);
            node.appendChild(this.createTextNode(obj[prop].toString()));
        }
        return node;
    },

    /**
     * Method: write_wmc_Server
     * Create a Server node given a layer object.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer.WMS>} Layer object.
     *
     * Returns:
     * {Element} A WMC Server element node.
     */
    write_wmc_Server: function(layer) {
        var node = this.createElementDefaultNS("Server");
        this.setAttributes(node, {
            service: "OGC:WMS",
            version: layer.params["VERSION"]
        });
        
        // required OnlineResource element
        node.appendChild(this.write_wmc_OnlineResource(layer.url));
        
        return node;
    },

    /**
     * Method: write_wmc_MetadataURL
     * Create a MetadataURL node given a layer object.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer.WMS>} Layer object.
     *
     * Returns:
     * {Element} A WMC metadataURL element node.
     */
    write_wmc_MetadataURL: function(layer) {
        var node = this.createElementDefaultNS("MetadataURL");

        // required OnlineResource element
        node.appendChild(this.write_wmc_OnlineResource(layer.metadataURL));

        return node;
    },

    /**
     * Method: write_wmc_FormatList
     * Create a FormatList node given a layer.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer.WMS>} Layer object.
     *
     * Returns:
     * {Element} A WMC FormatList element node.
     */
    write_wmc_FormatList: function(layer) {
        var node = this.createElementDefaultNS("FormatList");
        node.appendChild(this.createElementDefaultNS(
            "Format", layer.params["FORMAT"], {current: "1"}
        ));

        return node;
    },

    /**
     * Method: write_wmc_StyleList
     * Create a StyleList node given a layer.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer.WMS>} Layer object.
     *
     * Returns:
     * {Element} A WMC StyleList element node.
     */
    write_wmc_StyleList: function(layer) {
        var node = this.createElementDefaultNS("StyleList");
        var style = this.createElementDefaultNS(
            "Style", null, {current: "1"}
        );
        
        // Style can come from one of three places (prioritized as below):
        // 1) an SLD parameter
        // 2) and SLD_BODY parameter
        // 3) the STYLES parameter
        
        if(layer.params["SLD"]) {
            // create link from SLD parameter
            var sld = this.createElementDefaultNS("SLD");
            var link = this.write_wmc_OnlineResource(layer.params["SLD"]);
            sld.appendChild(link);
            style.appendChild(sld);
        } else if(layer.params["SLD_BODY"]) {
            // include sld fragment from SLD_BODY parameter
            var sld = this.createElementDefaultNS("SLD");
            var body = layer.params["SLD_BODY"];
            // read in body as xml doc - assume proper namespace declarations
            var doc = OpenLayers.Format.XML.prototype.read.apply(this, [body]);
            // append to StyledLayerDescriptor node
            var imported = doc.documentElement;
            if(sld.ownerDocument && sld.ownerDocument.importNode) {
                imported = sld.ownerDocument.importNode(imported, true);
            }
            sld.appendChild(imported);
            style.appendChild(sld);            
        } else {
            // use name(s) from STYLES parameter
            var name = layer.params["STYLES"] ?
                layer.params["STYLES"] : this.defaultStyleName;
            
            style.appendChild(this.createElementDefaultNS("Name", name));
            style.appendChild(this.createElementDefaultNS(
                "Title", this.defaultStyleTitle
            ));
        }
        node.appendChild(style);
        return node;
    },

    /**
     * Method: write_wmc_OnlineResource
     * Create an OnlineResource node given a URL.
     *
     * Parameters:
     * href - {String} URL for the resource.
     *
     * Returns:
     * {Element} A WMC OnlineResource element node.
     */
    write_wmc_OnlineResource: function(href) {
        var node = this.createElementDefaultNS("OnlineResource");
        this.setAttributeNS(node, this.namespaces.xlink, "xlink:type", "simple");
        this.setAttributeNS(node, this.namespaces.xlink, "xlink:href", href);
        return node;
    },

    CLASS_NAME: "OpenLayers.Format.WMC.v1" 

});
