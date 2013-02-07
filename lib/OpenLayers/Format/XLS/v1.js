/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XLS.js
 * @requires OpenLayers/Format/GML/v3.js
 */

/**
 * Class: OpenLayers.Format.XLS.v1
 * Superclass for XLS version 1 parsers. Only supports GeocodeRequest for now.
 *
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.XLS.v1 = OpenLayers.Class(OpenLayers.Format.XML, {
    
    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
        xls: "http://www.opengis.net/xls",
        gml: "http://www.opengis.net/gml",
        xsi: "http://www.w3.org/2001/XMLSchema-instance"
    },

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
     * APIProperty: xy
     * {Boolean} Order of the GML coordinate true:(x,y) or false:(y,x)
     * Changing is not recommended, a new Format should be instantiated.
     */
    xy: true,
    
    /**
     * Property: defaultPrefix
     */
    defaultPrefix: "xls",

    /**
     * Property: schemaLocation
     * {String} Schema location for a particular minor version.
     */
    schemaLocation: null,
    
    /**
     * Constructor: OpenLayers.Format.XLS.v1
     * Instances of this class are not created directly.  Use the
     *     <OpenLayers.Format.XLS> constructor instead.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    
    /**
     * Method: read
     *
     * Parameters:
     * data - {DOMElement} An XLS document element.
     * options - {Object} Options for the reader.
     *
     * Returns:
     * {Object} An object representing the XLSResponse.
     */
    read: function(data, options) {
        options = OpenLayers.Util.applyDefaults(options, this.options);
        var xls = {};
        this.readChildNodes(data, xls);
        return xls;
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
        "xls": {
            "XLS": function(node, xls) {
                xls.version = node.getAttribute("version");
                this.readChildNodes(node, xls);
            },
            "Response": function(node, xls) {
               this.readChildNodes(node, xls);
            },
            "GeocodeResponse": function(node, xls) {
               xls.responseLists = [];
               this.readChildNodes(node, xls);
            },
            "GeocodeResponseList": function(node, xls) {
                var responseList = {
                    features: [], 
                    numberOfGeocodedAddresses: 
                        parseInt(node.getAttribute("numberOfGeocodedAddresses"))
                };
                xls.responseLists.push(responseList);
                this.readChildNodes(node, responseList);
            },
            "GeocodedAddress": function(node, responseList) {
                var feature = new OpenLayers.Feature.Vector();
                responseList.features.push(feature);
                this.readChildNodes(node, feature);
                // post-process geometry
                feature.geometry = feature.components[0];
            },
            "GeocodeMatchCode": function(node, feature) {
                feature.attributes.matchCode = {
                    accuracy: parseFloat(node.getAttribute("accuracy")),
                    matchType: node.getAttribute("matchType")
                };
            },
            "Address": function(node, feature) {
                var address = {
                    countryCode: node.getAttribute("countryCode"),
                    addressee: node.getAttribute("addressee"),
                    street: [],
                    place: []
                };
                feature.attributes.address = address;
                this.readChildNodes(node, address);
            },
            "freeFormAddress": function(node, address) {
                address.freeFormAddress = this.getChildValue(node);
            },
            "StreetAddress": function(node, address) {
                this.readChildNodes(node, address);
            },
            "Building": function(node, address) {
                address.building = {
                    'number': node.getAttribute("number"),
                    subdivision: node.getAttribute("subdivision"),
                    buildingName: node.getAttribute("buildingName")
                };
            },
            "Street": function(node, address) {
                // only support the built-in primitive type for now
                address.street.push(this.getChildValue(node));
            },
            "Place": function(node, address) {
                // type is one of CountrySubdivision, 
                // CountrySecondarySubdivision, Municipality or
                // MunicipalitySubdivision
                address.place[node.getAttribute("type")] = 
                    this.getChildValue(node);
            },
            "PostalCode": function(node, address) {
                address.postalCode = this.getChildValue(node);
            }
        },
        "gml": OpenLayers.Format.GML.v3.prototype.readers.gml
    },
    
    /**
     * Method: write
     *
     * Parameters:
     * request - {Object} An object representing the geocode request.
     *
     * Returns:
     * {DOMElement} The root of an XLS document.
     */
    write: function(request) {
        return this.writers.xls.XLS.apply(this, [request]);
    },
    
    /**
     * Property: writers
     * As a compliment to the readers property, this structure contains public
     *     writing functions grouped by namespace alias and named like the
     *     node names they produce.
     */
    writers: {
        "xls": {
            "XLS": function(request) {
                var root = this.createElementNSPlus(
                    "xls:XLS",
                    {attributes: {
                        "version": this.VERSION,
                        "xsi:schemaLocation": this.schemaLocation
                    }}
                );
                this.writeNode("RequestHeader", request.header, root);
                this.writeNode("Request", request, root);
                return root;
            },
            "RequestHeader": function(header) {
                return this.createElementNSPlus("xls:RequestHeader");
            },
            "Request": function(request) {
                var node = this.createElementNSPlus("xls:Request", {
                    attributes: {
                        methodName: "GeocodeRequest",
                        requestID: request.requestID || "",
                        version: this.VERSION
                    }
                });
                this.writeNode("GeocodeRequest", request.addresses, node);
                return node;
            },
            "GeocodeRequest": function(addresses) {
                var node = this.createElementNSPlus("xls:GeocodeRequest");
                for (var i=0, len=addresses.length; i<len; i++) {
                    this.writeNode("Address", addresses[i], node);
                }
                return node;
            },
            "Address": function(address) {
                var node = this.createElementNSPlus("xls:Address", {
                    attributes: {
                        countryCode: address.countryCode
                    }
                });
                if (address.freeFormAddress) {
                    this.writeNode("freeFormAddress", address.freeFormAddress, node);
                } else {
                    if (address.street) {
                        this.writeNode("StreetAddress", address, node);
                    }
                    if (address.municipality) {
                        this.writeNode("Municipality", address.municipality, node);
                    }
                    if (address.countrySubdivision) {
                        this.writeNode("CountrySubdivision", address.countrySubdivision, node);
                    }
                    if (address.postalCode) {
                        this.writeNode("PostalCode", address.postalCode, node);
                    }
                }
                return node;
            },
            "freeFormAddress": function(freeFormAddress) {
                return this.createElementNSPlus("freeFormAddress", 
                    {value: freeFormAddress});
            },
            "StreetAddress": function(address) {
                var node = this.createElementNSPlus("xls:StreetAddress");
                if (address.building) {
                    this.writeNode(node, "Building", address.building);
                }
                var street = address.street;
                if (!(OpenLayers.Util.isArray(street))) {
                    street = [street];
                }
                for (var i=0, len=street.length; i < len; i++) {
                    this.writeNode("Street", street[i], node);
                }
                return node;
            },
            "Building": function(building) {
                return this.createElementNSPlus("xls:Building", {
                    attributes: {
                        "number": building["number"],
                        "subdivision": building.subdivision,
                        "buildingName": building.buildingName
                    }
                });
            },
            "Street": function(street) {
                return this.createElementNSPlus("xls:Street", {value: street});
            },
            "Municipality": function(municipality) {
                return this.createElementNSPlus("xls:Place", {
                    attributes: {
                        type: "Municipality"
                    },
                    value: municipality
                });
            },
            "CountrySubdivision": function(countrySubdivision) {
                return this.createElementNSPlus("xls:Place", {
                    attributes: {
                        type: "CountrySubdivision"
                    },
                    value: countrySubdivision
                });
            },
            "PostalCode": function(postalCode) {
                return this.createElementNSPlus("xls:PostalCode", {
                    value: postalCode
                });
            }
        }
    },
    
    CLASS_NAME: "OpenLayers.Format.XLS.v1" 

});
