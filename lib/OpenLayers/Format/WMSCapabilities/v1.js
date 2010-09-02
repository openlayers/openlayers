/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/WMSCapabilities.js
 * @requires OpenLayers/Format/XML.js
 */

/**
 * Class: OpenLayers.Format.WMSCapabilities.v1
 * Abstract class not to be instantiated directly. Creates
 * the common parts for both WMS 1.1.X and WMS 1.3.X.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.WMSCapabilities.v1 = OpenLayers.Class(
    OpenLayers.Format.XML, {
    
    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
        wms: "http://www.opengis.net/wms",
        xlink: "http://www.w3.org/1999/xlink",
        xsi: "http://www.w3.org/2001/XMLSchema-instance"
    },

    /**
     * Property: defaultPrefix
     */
    defaultPrefix: "wms",
    
    /**
     * Constructor: OpenLayers.Format.WMSCapabilities.v1
     * Create an instance of one of the subclasses.
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
        if(data && data.nodeType == 9) {
            data = data.documentElement;
        }
        var capabilities = {};
        this.readNode(data, capabilities);
    
        // postprocess the layer list
        this.postProcessLayers(capabilities);
    
        return capabilities;
    },

    /**
     * Method: postProcessLayers
     * Post process the layers, so that the nested layer structure is converted
     * to a flat layer list with only named layers.
     *
     * Parameters:
     * capabilities - {Object} The object (structure) returned by the parser with
     *     all the info from the GetCapabilities response.
     */
    postProcessLayers: function(capabilities) {
        if (capabilities.capability) {
            capabilities.capability.layers = [];
            var layers = capabilities.capability.nestedLayers;
            for (var i=0, len = layers.length; i<len; ++i) {
                var layer = layers[i];
                this.processLayer(capabilities.capability, layer);
            }
        }
    },

    /**
     * Method: processLayer
     * Recursive submethod of postProcessLayers. This function will among
     * others deal with property inheritance.
     *
     * Parameters:
     * capability - {Object} The capability part of the capabilities object
     * layer - {Object} The layer that needs processing
     * parentLayer - {Object} The parent layer of the respective layer
    */
    processLayer: function(capability, layer, parentLayer) {
        if (layer.formats === undefined) {
            layer.formats = capability.request.getmap.formats;
        }

        // deal with property inheritance
        if(parentLayer) {
            // add style
            layer.styles = layer.styles.concat(parentLayer.styles);
            var attributes = ["queryable",
                              "cascaded",
                              "fixedWidth",
                              "fixedHeight",
                              "opaque",
                              "noSubsets",
                              "llbbox",
                              "minScale",
                              "maxScale",
                              "attribution"];

            var complexAttr = ["srs",
                               "bbox",
                               "dimensions",
                               "authorityURLs"];
            
            var key;
            for (var j=0; j<attributes.length; j++) {
                key = attributes[j];
                if (key in parentLayer) {
                    // only take parent value if not present (null or undefined)
                    if (layer[key] == null) {
                        layer[key] = parentLayer[key];
                    }
                    // if attribute isn't present, and we haven't
                    // inherited anything from a parent layer
                    // set to default value
                    if (layer[key] == null) {
                        var intAttr = ["cascaded", "fixedWidth", "fixedHeight"];
                        var boolAttr = ["queryable", "opaque", "noSubsets"];
                        if (OpenLayers.Util.indexOf(intAttr, key) != -1) {
                            layer[key] = 0;
                        }
                        if (OpenLayers.Util.indexOf(boolAttr, key) != -1) {
                            layer[key] = false;
                        }
                    }
                }
            }

            for (var j=0; j<complexAttr.length; j++) {
                key = complexAttr[j];
                layer[key] = OpenLayers.Util.extend(
                    layer[key], parentLayer[key]);
            }
        }

        // process sublayers
        for (var i=0, len=layer.nestedLayers.length; i<len; i++) {
            var childLayer = layer.nestedLayers[i];
            this.processLayer(capability, childLayer, layer);
        }
        
        if (layer.name) {
            capability.layers.push(layer);
        }
    
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
        "wms": {
            "Service": function(node, obj) {
                obj.service = {};
                this.readChildNodes(node, obj.service);
            },
            "Name": function(node, obj) {
                obj.name = this.getChildValue(node);
            },
            "Title": function(node, obj) {
                obj.title = this.getChildValue(node);
            },
            "Abstract": function(node, obj) {
                obj["abstract"] = this.getChildValue(node);
            },
            "BoundingBox": function(node, obj) {
                var bbox = {};
                bbox.bbox = [
                    parseFloat(node.getAttribute("minx")),
                    parseFloat(node.getAttribute("miny")),
                    parseFloat(node.getAttribute("maxx")),
                    parseFloat(node.getAttribute("maxy"))
                ];
                var res = {
                    x: parseFloat(node.getAttribute("resx")),
                    y: parseFloat(node.getAttribute("resy"))
                };

                if (! (isNaN(res.x) && isNaN(res.y))) {
                    bbox.res = res;
                }
                // return the bbox so that descendant classes can set the
                // CRS and SRS and add it to the obj
                return bbox;
            },
            "OnlineResource": function(node, obj) {
                obj.href = this.getAttributeNS(node, this.namespaces.xlink, 
                    "href");
            },
            "ContactInformation": function(node, obj) {
                obj.contactInformation = {};
                this.readChildNodes(node, obj.contactInformation);
            },
            "ContactPersonPrimary": function(node, obj) {
                obj.personPrimary = {};
                this.readChildNodes(node, obj.personPrimary);
            },
            "ContactPerson": function(node, obj) {
                obj.person = this.getChildValue(node);
            },
            "ContactOrganization": function(node, obj) {
                obj.organization = this.getChildValue(node);
            },
            "ContactPosition": function(node, obj) {
                obj.position = this.getChildValue(node);
            },
            "ContactAddress": function(node, obj) {
                obj.contactAddress = {};
                this.readChildNodes(node, obj.contactAddress);
            },
            "AddressType": function(node, obj) {
                obj.type = this.getChildValue(node);
            },
            "Address": function(node, obj) {
                obj.address = this.getChildValue(node);
            },
            "City": function(node, obj) {
                obj.city = this.getChildValue(node);
            },
            "StateOrProvince": function(node, obj) {
                obj.stateOrProvince = this.getChildValue(node);
            },
            "PostCode": function(node, obj) {
                obj.postcode = this.getChildValue(node);
            },
            "Country": function(node, obj) {
                obj.country = this.getChildValue(node);
            },
            "ContactVoiceTelephone": function(node, obj) {
                obj.phone = this.getChildValue(node);
            },
            "ContactFacsimileTelephone": function(node, obj) {
                obj.fax = this.getChildValue(node);
            },
            "ContactElectronicMailAddress": function(node, obj) {
                obj.email = this.getChildValue(node);
            },
            "Fees": function(node, obj) {
                var fees = this.getChildValue(node);
                if (fees && fees.toLowerCase() != "none") {
                    obj.fees = fees;
                }
            },
            "AccessConstraints": function(node, obj) {
                var constraints = this.getChildValue(node);
                if (constraints && constraints.toLowerCase() != "none") {
                    obj.accessConstraints = constraints;
                }
            },
            "Capability": function(node, obj) {
                obj.capability = {nestedLayers: []};
                this.readChildNodes(node, obj.capability);
            },
            "Request": function(node, obj) {
                obj.request = {};
                this.readChildNodes(node, obj.request);
            },
            "GetCapabilities": function(node, obj) {
                obj.getcapabilities = {formats: []};
                this.readChildNodes(node, obj.getcapabilities);
            },
            "Format": function(node, obj) {
                if (obj.formats instanceof Array) {
                    obj.formats.push(this.getChildValue(node));
                } else {
                    obj.format = this.getChildValue(node);
                }
            },
            "DCPType": function(node, obj) {
                this.readChildNodes(node, obj);
            },
            "HTTP": function(node, obj) {
                this.readChildNodes(node, obj);
            },
            "Get": function(node, obj) {
                this.readChildNodes(node, obj);
            },
            "Post": function(node, obj) {
                this.readChildNodes(node, obj);
            },
            "GetMap": function(node, obj) {
                obj.getmap = {formats: []};
                this.readChildNodes(node, obj.getmap);
            },
            "GetFeatureInfo": function(node, obj) {
                obj.getfeatureinfo = {formats: []};
                this.readChildNodes(node, obj.getfeatureinfo);
            },
            "Exception": function(node, obj) {
                obj.exception = {formats: []};
                this.readChildNodes(node, obj.exception);
            },
            "Layer": function(node, obj) {
                var attrNode = node.getAttributeNode("queryable");
                var queryable = (attrNode && attrNode.specified) ? 
                    node.getAttribute("queryable") : null;
                attrNode = node.getAttributeNode("cascaded");
                var cascaded = (attrNode && attrNode.specified) ?
                    node.getAttribute("cascaded") : null;
                attrNode = node.getAttributeNode("opaque");
                var opaque = (attrNode && attrNode.specified) ?
                    node.getAttribute('opaque') : null;
                var noSubsets = node.getAttribute('noSubsets');
                var fixedWidth = node.getAttribute('fixedWidth');
                var fixedHeight = node.getAttribute('fixedHeight');
                var layer = {nestedLayers: [], styles: [], srs: {}, 
                    metadataURLs: [], bbox: {}, dimensions: {},
                    authorityURLs: {}, identifiers: {}, keywords: [],
                    queryable: (queryable && queryable !== "") ? 
                        ( queryable === "1" || queryable === "true" ) : null,
                    cascaded: (cascaded !== null) ? parseInt(cascaded) : null,
                    opaque: opaque ? 
                        (opaque === "1" || opaque === "true" ) : null,
                    noSubsets: (noSubsets !== null) ? 
                        ( noSubsets === "1" || noSubsets === "true" ) : null,
                    fixedWidth: (fixedWidth != null) ? 
                        parseInt(fixedWidth) : null,
                    fixedHeight: (fixedHeight != null) ? 
                        parseInt(fixedHeight) : null
                };
                obj.nestedLayers.push(layer);
                this.readChildNodes(node, layer);
                if(layer.name) {
                    var parts = layer.name.split(":");
                    if(parts.length > 0) {
                        layer.prefix = parts[0];
                    }
                }
            },
            "Attribution": function(node, obj) {
                obj.attribution = {};
                this.readChildNodes(node, obj.attribution);
            },
            "LogoURL": function(node, obj) {
                obj.logo = {
                    width: node.getAttribute("width"),
                    height: node.getAttribute("height")
                };
                this.readChildNodes(node, obj.logo);
            },
            "Style": function(node, obj) {
                var style = {};
                obj.styles.push(style);
                this.readChildNodes(node, style);
            },
            "LegendURL": function(node, obj) {
                var legend = {
                    width: node.getAttribute("width"),
                    height: node.getAttribute("height")
                };
                obj.legend = legend;
                this.readChildNodes(node, legend);
            },
            "MetadataURL": function(node, obj) {
                var metadataURL = {type: node.getAttribute("type")};
                obj.metadataURLs.push(metadataURL);
                this.readChildNodes(node, metadataURL);
            },
            "DataURL": function(node, obj) {
                obj.dataURL = {};
                this.readChildNodes(node, obj.dataURL);
            },
            "FeatureListURL": function(node, obj) {
                obj.featureListURL = {};
                this.readChildNodes(node, obj.featureListURL);
            },
            "AuthorityURL": function(node, obj) {
                var name = node.getAttribute("name");
                var authority = {};
                this.readChildNodes(node, authority);
                obj.authorityURLs[name] = authority.href;
            },
            "Identifier": function(node, obj) {
                var authority = node.getAttribute("authority");
                obj.identifiers[authority] = this.getChildValue(node);
            },
            "KeywordList": function(node, obj) {
                this.readChildNodes(node, obj);
            },
            "SRS": function(node, obj) {
                obj.srs[this.getChildValue(node)] = true;
            }
        }
    },

    CLASS_NAME: "OpenLayers.Format.WMSCapabilities.v1" 

});
