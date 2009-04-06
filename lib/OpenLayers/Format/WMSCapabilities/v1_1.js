/**
 * @requires OpenLayers/Format/WMSCapabilities.js
 * @requires OpenLayers/Format/XML.js
 */

/**
 * Class: OpenLayers.Format.WMSCapabilities.v1_1
 * Abstract class not to be instantiated directly.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.WMSCapabilities.v1_1 = OpenLayers.Class(
    OpenLayers.Format.XML, {
    
    /**
     * Constructor: OpenLayers.Format.WMSCapabilities.v1_1
     * Create an instance of one of the subclasses.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.XML.prototype.initialize.apply(this, [options]);
        this.options = options;
    },

    /**
     * APIMethod: read
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
        var capabilities = {};
        var root = data.documentElement;
        this.runChildNodes(capabilities, root);
        return capabilities;
    },
    
    /**
     * Method: runChildNodes
     */
    runChildNodes: function(obj, node) {
        var children = node.childNodes;
        var childNode, processor;
        for(var i=0; i<children.length; ++i) {
            childNode = children[i];
            if(childNode.nodeType == 1) {
                processor = this["read_cap_" + childNode.nodeName];
                if(processor) {
                    processor.apply(this, [obj, childNode]);
                }
            }
        }
    },
    
    /**
     * Method: read_cap_Capability
     */
    read_cap_Capability: function(capabilities, node) {
        var capability = {
            layers: []
        };
        this.runChildNodes(capability, node);
        capabilities.capability = capability;
    },
    
    /**
     * Method: read_cap_Request
     */
    read_cap_Request: function(obj, node) {
        var request = {};
        this.runChildNodes(request, node);
        obj.request = request;
    },
    
    /**
     * Method: read_cap_GetMap
     */
    read_cap_GetMap: function(request, node) {
        var getmap = {
            formats: []
        };
        this.runChildNodes(getmap, node);
        request.getmap = getmap;
    },
    
    /**
     * Method: read_cap_Format
     */
    read_cap_Format: function(obj, node) {
        if(obj.formats) {
            obj.formats.push(this.getChildValue(node));
        }
    },
    
    /**
     * Method: read_cap_DCPType
     * Super simplified HTTP href extractor.  Assumes the first online resource
     *     will work.
     */
    read_cap_DCPType: function(obj, node) {
        var children = node.getElementsByTagName("OnlineResource");
        if(children.length > 0) {
            this.read_cap_OnlineResource(obj, children[0]);
        }
    },

    /**
     * Method: read_cap_Service
     */
    read_cap_Service: function(capabilities, node) {
        var service = {};
        this.runChildNodes(service, node);
        capabilities.service = service;
    },

    /**
     * Method: read_cap_Layer
     */
    read_cap_Layer: function(capability, node, parentLayer) {
        var layer = {
            formats: capability.request.getmap.formats || [],
            styles: [],
            queryable: (node.getAttribute("queryable") === "1" 
                        || node.getAttribute("queryable") === "true")
        };
        // deal with property inheritance
        if(parentLayer) {
            // add style
            layer.styles = layer.styles.concat(parentLayer.styles);
            // use llbbox
            layer.llbbox = parentLayer.llbbox;
            // use min/maxScale
            layer.minScale = parentLayer.minScale;
            layer.maxScale = parentLayer.maxScale;
        }
        var children = node.childNodes;
        var childNode, nodeName, processor;
        for(var i=0; i<children.length; ++i) {
            childNode = children[i];
            nodeName = childNode.nodeName;
            processor = this["read_cap_" + childNode.nodeName];
            if(processor) {
                if(nodeName == "Layer") {
                    processor.apply(this, [capability, childNode, layer]);
                } else {
                    processor.apply(this, [layer, childNode]);
                }
            }
        }
        if(layer.name) {
            var index = layer.name.indexOf(":");
            if(index > 0) {
                layer.prefix = layer.name.substring(0, index);
            }
            capability.layers.push(layer);
        }
    },
    
    /**
     * Method: read_cap_ScaleHint
     * The Layer ScaleHint element has min and max attributes that relate to
     *     the minimum and maximum resolution that the server supports.  The
     *     values are pixel diagonals measured in meters (on the ground).
     */
    read_cap_ScaleHint: function(layer, node) {
        var min = node.getAttribute("min");
        var max = node.getAttribute("max");
        var rad2 = Math.pow(2, 0.5);
        var ipm = OpenLayers.INCHES_PER_UNIT["m"];
        layer.maxScale = parseFloat(
            ((rad2 * min) * ipm * OpenLayers.DOTS_PER_INCH).toPrecision(13)
        );
        layer.minScale = parseFloat(
            ((rad2 * max) * ipm * OpenLayers.DOTS_PER_INCH).toPrecision(13)
        );
    },
    
    /**
     * Method: read_cap_Name
     */
    read_cap_Name: function(obj, node) {
        var name = this.getChildValue(node);
        if(name) {
            obj.name = name;
        }
    },

    /**
     * Method: read_cap_Title
     */
    read_cap_Title: function(obj, node) {
        var title = this.getChildValue(node);
        if(title) {
            obj.title = title;
        }
    },

    /**
     * Method: read_cap_Abstract
     */
    read_cap_Abstract: function(obj, node) {
        var abst = this.getChildValue(node);
        if(abst) {
            obj["abstract"] = abst;
        }
    },
    
    /**
     * Method: read_cap_LatLonBoundingBox
     */
    read_cap_LatLonBoundingBox: function(layer, node) {
        layer.llbbox = [
            parseFloat(node.getAttribute("minx")),
            parseFloat(node.getAttribute("miny")),
            parseFloat(node.getAttribute("maxx")),
            parseFloat(node.getAttribute("maxy"))
        ];
    },

    /**
     * Method: read_cap_Style
     */
    read_cap_Style: function(layer, node) {
        var style = {};
        this.runChildNodes(style, node);
        layer.styles.push(style);
    },

    /**
     * Method: read_cap_LegendURL
     */
    read_cap_LegendURL: function(style, node) {
        var legend = {
            width: node.getAttribute('width'),
            height: node.getAttribute('height')
        };
        var links = node.getElementsByTagName("OnlineResource");
        if(links.length > 0) {
            this.read_cap_OnlineResource(legend, links[0]);
        }
        style.legend = legend;
    },
    
    /**
     * Method: read_cap_OnlineResource
     */
    read_cap_OnlineResource: function(obj, node) {
        obj.href = this.getAttributeNS(
            node, "http://www.w3.org/1999/xlink", "href"
        );
    },

    CLASS_NAME: "OpenLayers.Format.WMSCapabilities.v1_1" 

});