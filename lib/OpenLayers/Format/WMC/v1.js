/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/WMC.js
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
        // layersContext is an array containing info for each layer
        context.layersContext = [];
        this.runChildNodes(context, node);
    },
    
    /**
     * Method: read_wmc_Layer
     */
    read_wmc_Layer: function(context, node) {
        var layerContext = {
            visibility: (node.getAttribute("hidden") != "1"),
            queryable: (node.getAttribute("queryable") == "1"),
            formats: [],
            styles: []
        };

        this.runChildNodes(layerContext, node);
        // set properties common to multiple objects on layer options/params
        context.layersContext.push(layerContext);
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
    read_ol_units: function(layerContext, node) {
        layerContext.units = this.getChildValue(node);
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
    read_ol_transparent: function(layerContext, node) {
        layerContext.transparent = this.getChildValue(node);
    },

    /**
     * Method: read_ol_numZoomLevels
     */
    read_ol_numZoomLevels: function(layerContext, node) {
        layerContext.numZoomLevels = parseInt(this.getChildValue(node));
    },

    /**
     * Method: read_ol_opacity
     */
    read_ol_opacity: function(layerContext, node) {
        layerContext.opacity = parseFloat(this.getChildValue(node));
    },

    /**
     * Method: read_ol_singleTile
     */
    read_ol_singleTile: function(layerContext, node) {
        layerContext.singleTile = (this.getChildValue(node) == "true");
    },

    /**
     * Method: read_ol_tileSize
     */
    read_ol_tileSize: function(layerContext, node) {
        var obj = {"width": node.getAttribute("width"), "height": node.getAttribute("height")};
        layerContext.tileSize = obj;
    },
    
    /**
     * Method: read_ol_isBaseLayer
     */
    read_ol_isBaseLayer: function(layerContext, node) {
        layerContext.isBaseLayer = (this.getChildValue(node) == "true");
    },

    /**
     * Method: read_ol_displayInLayerSwitcher
     */
    read_ol_displayInLayerSwitcher: function(layerContext, node) {
        layerContext.displayInLayerSwitcher = (this.getChildValue(node) == "true");
    },

    /**
     * Method: read_wmc_Server
     */
    read_wmc_Server: function(layerContext, node) {
        layerContext.version = node.getAttribute("version");
        var server = {};
        var links = node.getElementsByTagName("OnlineResource");
        if(links.length > 0) {
            this.read_wmc_OnlineResource(server, links[0]);
        }
        layerContext.url = server.href;
    },

    /**
     * Method: read_wmc_FormatList
     */
    read_wmc_FormatList: function(layerContext, node) {
        this.runChildNodes(layerContext, node);
    },

    /**
     * Method: read_wmc_Format
     */
    read_wmc_Format: function(layerContext, node) {
        var format = {
            value: this.getChildValue(node)
        };
        if(node.getAttribute("current") == "1") {
            format.current = true;
        }
        layerContext.formats.push(format);
    },
    
    /**
     * Method: read_wmc_StyleList
     */
    read_wmc_StyleList: function(layerContext, node) {
        this.runChildNodes(layerContext, node);
    },

    /**
     * Method: read_wmc_Style
     */
    read_wmc_Style: function(layerContext, node) {
        var style = {};
        this.runChildNodes(style, node);
        if(node.getAttribute("current") == "1") {
            style.current = true;
        }
        layerContext.styles.push(style);
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
    read_wmc_MetadataURL: function(layerContext, node) {
        var metadataURL = {};
        var links = node.getElementsByTagName("OnlineResource");
        if(links.length > 0) {
            this.read_wmc_OnlineResource(metadataURL, links[0]);
        }
        layerContext.metadataURL = metadataURL.href;

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
                minx: bounds.left.toPrecision(18),
                miny: bounds.bottom.toPrecision(18),
                maxx: bounds.right.toPrecision(18),
                maxy: bounds.top.toPrecision(18),
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
                minx: bounds.left.toPrecision(18),
                miny: bounds.bottom.toPrecision(18),
                maxx: bounds.right.toPrecision(18),
                maxy: bounds.top.toPrecision(18)
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
        
        for(var i=0, len=context.layersContext.length; i<len; ++i) {
            list.appendChild(this.write_wmc_Layer(context.layersContext[i]));
        }
        
        return list;
    },

    /**
     * Method: write_wmc_Layer
     * Create a Layer node given a layer context object.
     *
     * Parameters:
     * context - {Object} A layer context object.}
     *
     * Returns:
     * {Element} A WMC Layer element node.
     */
    write_wmc_Layer: function(context) {
        var node = this.createElementDefaultNS(
            "Layer", null, {
                queryable: context.queryable ? "1" : "0",
                hidden: context.visibility ? "0" : "1"
            }
        );
        
        // required Server element
        node.appendChild(this.write_wmc_Server(context));

        // required Name element
        node.appendChild(this.createElementDefaultNS(
            "Name", context.name
        ));
        
        // required Title element
        node.appendChild(this.createElementDefaultNS(
            "Title", context.title
        ));

        // optional MetadataURL element
        if (context.metadataURL) {
            node.appendChild(this.write_wmc_MetadataURL(context.metadataURL));
        }
        
        return node;
    },
    
    /**
     * Method: write_wmc_LayerExtension
     * Add OpenLayers specific layer parameters to an Extension element.
     *
     * Parameters:
     * context - {Object} A layer context object.
     *
     * Returns:
     * {Element} A WMC Extension element (for a layer).
     */
    write_wmc_LayerExtension: function(context) {
        var node = this.createElementDefaultNS("Extension");
        
        var bounds = context.maxExtent;
        var maxExtent = this.createElementNS(
            this.namespaces.ol, "ol:maxExtent"
        );
        this.setAttributes(maxExtent, {
            minx: bounds.left.toPrecision(18),
            miny: bounds.bottom.toPrecision(18),
            maxx: bounds.right.toPrecision(18),
            maxy: bounds.top.toPrecision(18)
        });
        node.appendChild(maxExtent);
        
        if (context.tileSize && !context.singleTile) {
            var size = this.createElementNS(
                this.namespaces.ol, "ol:tileSize"
            );
            this.setAttributes(size, context.tileSize);
            node.appendChild(size);
        }
        
        var properties = [
            "transparent", "numZoomLevels", "units", "isBaseLayer",
            "opacity", "displayInLayerSwitcher", "singleTile"
        ];
        var child;
        for(var i=0, len=properties.length; i<len; ++i) {
            child = this.createOLPropertyNode(context, properties[i]);
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
     * Create a Server node given a layer context object.
     *
     * Parameters:
     * context - {Object} Layer context object.
     *
     * Returns:
     * {Element} A WMC Server element node.
     */
    write_wmc_Server: function(context) {
        var node = this.createElementDefaultNS("Server");
        this.setAttributes(node, {
            service: "OGC:WMS",
            version: context.version
        });
        
        // required OnlineResource element
        node.appendChild(this.write_wmc_OnlineResource(context.url));
        
        return node;
    },

    /**
     * Method: write_wmc_MetadataURL
     * Create a MetadataURL node given a metadataURL string.
     *
     * Parameters:
     * metadataURL - {String} MetadataURL string value.
     *
     * Returns:
     * {Element} A WMC metadataURL element node.
     */
    write_wmc_MetadataURL: function(metadataURL) {
        var node = this.createElementDefaultNS("MetadataURL");

        // required OnlineResource element
        node.appendChild(this.write_wmc_OnlineResource(metadataURL));

        return node;
    },

    /**
     * Method: write_wmc_FormatList
     * Create a FormatList node given a layer context.
     *
     * Parameters:
     * context - {Object} Layer context object.
     *
     * Returns:
     * {Element} A WMC FormatList element node.
     */
    write_wmc_FormatList: function(context) {
        var node = this.createElementDefaultNS("FormatList");
        for (var i=0, len=context.formats.length; i<len; i++) {
            var format = context.formats[i];
            node.appendChild(this.createElementDefaultNS(
                "Format",
                format.value,
                (format.current && format.current == true) ?
                    {current: "1"} : null
            ));
        }

        return node;
    },

    /**
     * Method: write_wmc_StyleList
     * Create a StyleList node given a layer context.
     *
     * Parameters:
     * context - {Object} Layer context object.
     *
     * Returns:
     * {Element} A WMC StyleList element node.
     */
    write_wmc_StyleList: function(layer) {
        var node = this.createElementDefaultNS("StyleList");

        var styles = layer.styles;
        if (styles && styles instanceof Array) {
            var sld;
            for (var i=0, len=styles.length; i<len; i++) {
                var s = styles[i];
                // three style types to consider
                // [1] linked SLD
                // [2] inline SLD
                // [3] named style
                // running child nodes always gets name, optionally gets href or body
                var style = this.createElementDefaultNS(
                    "Style",
                    null,
                    (s.current && s.current == true) ?
                    {current: "1"} : null
                );
                if(s.href) { // [1]
                    sld = this.createElementDefaultNS("SLD");
                    var link = this.write_wmc_OnlineResource(s.href);
                    sld.appendChild(link);
                    // Name is required.
                    sld.appendChild(this.createElementDefaultNS("Name", s.name));
                    // Title is optional.
                    if (s.title) {
                        sld.appendChild(this.createElementDefaultNS("Title", s.title));
                    }
                    style.appendChild(sld);
                } else if(s.body) { // [2]
                    sld = this.createElementDefaultNS("SLD");
                    // read in body as xml doc - assume proper namespace declarations
                    var doc = OpenLayers.Format.XML.prototype.read.apply(this, [s.body]);
                    // append to StyledLayerDescriptor node
                    var imported = doc.documentElement;
                    if(sld.ownerDocument && sld.ownerDocument.importNode) {
                        imported = sld.ownerDocument.importNode(imported, true);
                    }
                    sld.appendChild(imported);
                    // Name is required.
                    sld.appendChild(this.createElementDefaultNS("Name", s.name));
                    // Title is optional.
                    if (s.title) {
                        sld.appendChild(this.createElementDefaultNS("Title", s.title));
                    }
                    style.appendChild(sld);            
                } else { // [3]
                    // both Name and Title are required.
                    style.appendChild(this.createElementDefaultNS("Name", s.name));
                    style.appendChild(this.createElementDefaultNS("Title", s.title));
                    // Abstract is optional
                    if (s['abstract']) { // abstract is a js keyword
                        style.appendChild(this.createElementDefaultNS(
                            "Abstract", s['abstract']
                        ));
                    }
                }
                node.appendChild(style);
            }
        }

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
