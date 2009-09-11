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
     * Method: read_cap_Service
     */
    read_cap_Service: function(capabilities, node) {
        var service = {};
        this.runChildNodes(service, node);
        capabilities.service = service;
    },

    /**
     * Method: read_cap_Fees
     */
    read_cap_Fees: function(service, node) {
        var fees = this.getChildValue(node);
        if (fees && fees.toLowerCase() != "none") {
            service.fees = fees;
        }
    },

    /**
     * Method: read_cap_AccessConstraints
     */
    read_cap_AccessConstraints: function(service, node) {
        var constraints = this.getChildValue(node);
        if (constraints && constraints.toLowerCase() != "none") {
            service.accessConstraints = constraints;
        }
    },

    /**
     * Method: read_cap_ContactInformation
    */
    read_cap_ContactInformation: function(service, node) {
        var contact = {};
        this.runChildNodes(contact, node);
        service.contactInformation = contact;
    },


    /**
     * Method: read_cap_ContactPersonPrimary
     */
    read_cap_ContactPersonPrimary: function(contact, node) {
        var personPrimary = {};
        this.runChildNodes(personPrimary, node);
        contact.personPrimary = personPrimary;
    },

    /**
     * Method: read_cap_ContactPerson
     */
    read_cap_ContactPerson: function(primaryPerson, node) {
        var person = this.getChildValue(node);
        if (person) {
            primaryPerson.person = person;
        }
    },

    /**
     * Method: read_cap_ContactOrganization
     */
    read_cap_ContactOrganization: function(primaryPerson, node) {
        var organization = this.getChildValue(node);
        if (organization) {
            primaryPerson.organization = organization;
        }
    },

    /**
     * Method: read_cap_ContactPosition
     */
    read_cap_ContactPosition: function(contact, node) {
        var position = this.getChildValue(node);
        if (position) {
            contact.position = position;
        }
    },

    /**
     * Method: read_cap_ContactAddress
     */
    read_cap_ContactAddress: function(contact, node) {
        var contactAddress = {};
        this.runChildNodes(contactAddress, node);
        contact.contactAddress = contactAddress;
    },

    /**
     * Method: read_cap_AddressType
     */
    read_cap_AddressType: function(contactAddress, node) {
        var type = this.getChildValue(node);
        if (type) {
            contactAddress.type = type;
        }
    },

    /**
     * Method: read_cap_Address
     */
    read_cap_Address: function(contactAddress, node) {
        var address = this.getChildValue(node);
        if (address) {
            contactAddress.address = address;
        }
    },

    /**
     * Method: read_cap_City
     */
    read_cap_City: function(contactAddress, node) {
        var city = this.getChildValue(node);
        if (city) {
            contactAddress.city = city;
        }
    },

    /**
     * Method: read_cap_StateOrProvince
     */
    read_cap_StateOrProvince: function(contactAddress, node) {
        var stateOrProvince = this.getChildValue(node);
        if (stateOrProvince) {
            contactAddress.stateOrProvince = stateOrProvince;
        }
    },

    /**
     * Method: read_cap_PostCode
     */
    read_cap_PostCode: function(contactAddress, node) {
        var postcode = this.getChildValue(node);
        if (postcode) {
            contactAddress.postcode = postcode;
        }
    },

    /**
     * Method: read_cap_Country
     */
    read_cap_Country: function(contactAddress, node) {
        var country = this.getChildValue(node);
        if (country) {
            contactAddress.country = country;
        }
    },

    /**
     * Method: read_cap_ContactVoiceTelephone
     */
    read_cap_ContactVoiceTelephone: function(contact, node) {
        var phone = this.getChildValue(node);
        if (phone) {
            contact.phone = phone;
        }
    },

    /**
     * Method: read_cap_ContactFacsimileTelephone
     */
    read_cap_ContactFacsimileTelephone: function(contact, node) {
        var fax = this.getChildValue(node);
        if (fax) {
            contact.fax = fax;
        }
    },

    /**
     * Method: read_cap_ContactElectronicMailAddress
     */
    read_cap_ContactElectronicMailAddress: function(contact, node) {
        var email = this.getChildValue(node);
        if (email) {
            contact.email = email;
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
     * Method: read_cap_GetCapabilities
     */
    read_cap_GetCapabilities: function(request, node) {
        var getcapabilities = {
            formats: []
        };
        this.runChildNodes(getcapabilities, node);
        request.getcapabilities = getcapabilities;
    },

    /**
     * Method: read_cap_GetFeatureInfo
     */
    read_cap_GetFeatureInfo: function(request, node) {
        var getfeatureinfo = {
            formats: []
        };
        this.runChildNodes(getfeatureinfo, node);
        request.getfeatureinfo = getfeatureinfo;
    },

    /**
     * Method: read_cap_DescribeLayer
     */
    read_cap_DescribeLayer: function(request, node) {
        var describelayer = {
            formats: []
        };
        this.runChildNodes(describelayer, node);
        request.describelayer = describelayer;
    },

    /**
     * Method: read_cap_GetLegendGraphic
     */
    read_cap_GetLegendGraphic: function(request, node) {
        var getlegendgraphic = {
            formats: []
        };
        this.runChildNodes(getlegendgraphic, node);
        request.getlegendgraphic = getlegendgraphic;
    },

    /**
     * Method: read_cap_GetStyles
     */
    read_cap_GetStyles: function(request, node) {
        var getstyles = {
            formats: []
        };
        this.runChildNodes(getstyles, node);
        request.getstyles = getstyles;
    },

    /**
     * Method: read_cap_PutStyles
     */
    read_cap_PutStyles: function(request, node) {
        var putstyles = {
            formats: []
        };
        this.runChildNodes(putstyles, node);
        request.putstyles = putstyles;
    },

    /**
     * Method: read_cap_Format
     */
    read_cap_Format: function(obj, node) {
        var format = this.getChildValue(node);
        if(obj.formats) {
            obj.formats.push(format);
        } else {
            obj.format  = format;
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
     * Method: read_cap_Exception
     */
    read_cap_Exception: function(capability, node) {
        var exception = {
            formats: []
        };
        this.runChildNodes(exception, node);
        capability.exception = exception;
    },

    /**
     * Method: read_cap_UserDefinedSymbolization
     */
    read_cap_UserDefinedSymbolization: function(capability, node) {
        var userSymbols = {
            supportSLD: parseInt(node.getAttribute("SupportSLD")) == 1,
            userLayer: parseInt(node.getAttribute("UserLayer")) == 1,
            userStyle: parseInt(node.getAttribute("UserStyle")) == 1,
            remoteWFS: parseInt(node.getAttribute("RemoteWFS")) == 1
        };
        capability.userSymbols = userSymbols;
    },

    /**
     * Method: read_cap_Layer
     */
    read_cap_Layer: function(capability, node, parentLayer) {
        var layer = {
            formats: capability.request.getmap.formats || [],
            styles: [],
            srs: {},
            bbox: {},
            dimensions: {},
            metadataURLs: [],
            authorityURLs: {},
            identifiers: {},
            keywords: []
        };

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
            for (var i=0; i<attributes.length; i++) {
                key = attributes[i];
                if (key in parentLayer) {
                    layer[key] = parentLayer[key];
                }
            }

            for (var i=0; i<complexAttr.length; i++) {
                key = complexAttr[i];
                layer[key] = OpenLayers.Util.extend(
                    layer[key], parentLayer[key]
                );
            }

        }

        var intAttr = ["cascaded", "fixedWidth", "fixedHeight"];
        var boolAttr = ["queryable", "opaque", "noSubsets"];

        for (var i=0; i<intAttr.length; i++) {
            var attr = intAttr[i];
            var attrNode = node.getAttributeNode(attr);
            if (attrNode && attrNode.specified) {
                // if attribute is present, override inherited value
                layer[attr] = parseInt(attrNode.value);
            } else if (! (attr in layer)) {
                // if attribute isn't present, and we haven't
                // inherited anything from a parent layer
                // set to default value
                layer[attr] = 0;
            }
        }
        for (var i=0; i<boolAttr.length; i++) {
            var attr = boolAttr[i];
            var attrNode = node.getAttributeNode(attr);
            if (attrNode && attrNode.specified) {
                // if attribute is present, override inherited value
                var value = attrNode.value;
                layer[attr] = ( value === "1" || value === "true" );
            } else if (! (attr in layer)) {
                // if attribute isn't present, and we haven't
                // inherited anything from a parent layer
                // set to default value
                layer[attr] = false;
            }
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
            ((min / rad2) * ipm * OpenLayers.DOTS_PER_INCH).toPrecision(13)
        );
        layer.minScale = parseFloat(
            ((max / rad2) * ipm * OpenLayers.DOTS_PER_INCH).toPrecision(13)
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
     * Method: read_cap_Attribution
     */
    read_cap_Attribution: function(obj, node) {
        var attribution = {};
        this.runChildNodes(attribution, node);
        obj.attribution = attribution;
    },
    
    /**
     * Method: read_cap_LogoURL
     */
    read_cap_LogoURL: function(obj, node) {
        obj.logo = {
            width: node.getAttribute("width"),
            height: node.getAttribute("height")
        };
        this.runChildNodes(obj.logo, node);
    },
    
    /**
     * Method: read_cap_MetadataURL
     */
    read_cap_MetadataURL: function(layer, node) {
        var metadataURL = {};
        this.runChildNodes(metadataURL, node);
        metadataURL.type = node.getAttribute("type");
        layer.metadataURLs.push(metadataURL);
    },
    
    /**
     * Method: read_cap_DataURL
     */
    read_cap_DataURL: function(layer, node) {
        layer.dataURL = {};
        this.runChildNodes(layer.dataURL, node);
    },

    /**
     * Method: read_cap_FeatureListURL
     */
    read_cap_FeatureListURL: function(layer, node) {
        layer.featureListURL = {};
        this.runChildNodes(layer.featureListURL, node);
    },

    /**
     * Method: read_cap_AuthorityURL
     */
    read_cap_AuthorityURL: function(layer, node) {
        var name = node.getAttribute("name");
        if (! (name in layer.authorityURLs)) {
            var authority = {};
            this.runChildNodes(authority, node);
            layer.authorityURLs[name] = authority.href;
        } else {
            // A child Layer SHALL NOT define an AuthorityURL with the
            // same name attribute as one inherited from a parent
            return;
        }
    },

    /**
     * Method: read_cap_Identifier
    */
    read_cap_Identifier: function(layer, node) {
        var authority = node.getAttribute("authority");

        if (authority in layer.authorityURLs) {
            layer.identifiers[authority] = this.getChildValue(node);
        } else {
            // A layer SHALL NOT declare an Identifier unless a
            // corresponding authorityURL has been declared or
            // inherited earlier in the Capabilities XML
            return;
        }

    },

    /**
     * Method: read_cap_KeywordList
     */
    read_cap_KeywordList: function(layer, node) {
        var obj = layer;
        this.runChildNodes(obj, node);
    },
    
    /**
     * Method: read_cap_Keyword
     */
    read_cap_Keyword: function(obj, node) {
        if(obj.keywords) {
            obj.keywords.push(this.getChildValue(node));
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
     * Method: read_cap_BoundingBox
     */
    read_cap_BoundingBox: function(layer, node) {
        var bbox = {};
        bbox.srs  = node.getAttribute("SRS");
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
        layer.bbox[bbox.srs] = bbox;
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
     * Method: read_cap_Dimension
     */
    read_cap_Dimension: function(layer, node) {
        var name = node.getAttribute("name").toLowerCase();

        if (name in layer["dimensions"]) {
            // "A child SHALL NOT redefine a Dimension with the same
            // name attribute as one that was inherited"
            return;
        }

        var dim = {
            name: name,
            units: node.getAttribute("units"),
            unitsymbol: node.getAttribute("unitSymbol")
        };

        layer.dimensions[dim.name] = dim;
    },

    /**
     * Method: read_cap_Extent
     */
    read_cap_Extent: function(layer, node) {
        var name   = node.getAttribute("name").toLowerCase();

        if (name in layer["dimensions"]) {
            var extent = layer.dimensions[name];

            extent.nearestVal = node.getAttribute("nearestValue") === "1";
            extent.multipleVal = node.getAttribute("multipleValues") === "1";
            extent.current = node.getAttribute("current") === "1";
            extent["default"] = node.getAttribute("default") || "";
            var values = this.getChildValue(node);
            extent.values = values.split(",");
        } else {
            // A layer SHALL NOT declare an Extent unless a Dimension
            // with the same name has been declared or inherited
            // earlier in the Capabilities XML
            return;
        }

    },

    /**
     * Method: read_cap_LegendURL
     */
    read_cap_LegendURL: function(style, node) {
        style.legend = {
            width: node.getAttribute("width"),
            height: node.getAttribute("height")
        };
        this.runChildNodes(style.legend, node);
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
