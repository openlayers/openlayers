/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML.js
 * @requires OpenLayers/Format/OWSCommon/v1_1_0.js
 * @requires OpenLayers/Format/WCSGetCoverage.js
 * @requires OpenLayers/Format/WFST/v1_1_0.js
 */

/**
 * Class: OpenLayers.Format.WPSExecute version 1.0.0
 *
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.WPSExecute = OpenLayers.Class(OpenLayers.Format.XML,
                                            OpenLayers.Format.Filter.v1_1_0, {
    
    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
        ows: "http://www.opengis.net/ows/1.1",
        gml: "http://www.opengis.net/gml",
        wps: "http://www.opengis.net/wps/1.0.0",
        wfs: "http://www.opengis.net/wfs",
        ogc: "http://www.opengis.net/ogc",
        wcs: "http://www.opengis.net/wcs",
        xlink: "http://www.w3.org/1999/xlink",
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
     * Constant: VERSION
     * {String} 1.0.0
     */
    VERSION: "1.0.0",

    /**
     * Property: schemaLocation
     * {String} Schema location
     */
    schemaLocation: "http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsAll.xsd",

    schemaLocationAttr: function(options) {
        return undefined;
    },

    /**
     * Constructor: OpenLayers.Format.WPSExecute
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */

    /**
     * Method: write
     *
     * Parameters:
     * options - {Object} Optional object.
     *
     * Returns:
     * {String} An WPS Execute request XML string.
     */
    write: function(options) {
        var doc;
        if (window.ActiveXObject) {
            doc = new ActiveXObject("Microsoft.XMLDOM");
            this.xmldom = doc;
        } else {
            doc = document.implementation.createDocument("", "", null);
        }
        var node = this.writeNode("wps:Execute", options, doc);
        this.setAttributeNS(
            node, this.namespaces.xsi,
            "xsi:schemaLocation", this.schemaLocation
        );
        return OpenLayers.Format.XML.prototype.write.apply(this, [node]);
    }, 

    /**
     * APIMethod: read
     * Parse a WPS Execute and return an object with its information.
     * 
     * Parameters: 
     * data - {String} or {DOMElement} data to read/parse.
     *
     * Returns:
     * {Object}
     */
    read: function(data) {
        if(typeof data == "string") {
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }
        if(data && data.nodeType == 9) {
            data = data.documentElement;
        }
        var info = {};
        this.readNode(data, info);
        return info;
    },

    /**
     * Property: writers
     * As a compliment to the readers property, this structure contains public
     *     writing functions grouped by namespace alias and named like the
     *     node names they produce.
     */
    writers: {
        "wps": {
            "Execute": function(options) {
                var node = this.createElementNSPlus("wps:Execute", {
                    attributes: {
                        version: this.VERSION,
                        service: 'WPS'
                    } 
                }); 
                this.writeNode("ows:Identifier", options.identifier, node);
                this.writeNode("wps:DataInputs", options.dataInputs, node);
                this.writeNode("wps:ResponseForm", options.responseForm, node);
                return node; 
            },
            "ResponseForm": function(responseForm) {
                var node = this.createElementNSPlus("wps:ResponseForm", {});
                if (responseForm.rawDataOutput) {
                    this.writeNode("wps:RawDataOutput", responseForm.rawDataOutput, node);
                }
                if (responseForm.responseDocument) {
                    this.writeNode("wps:ResponseDocument", responseForm.responseDocument, node);
                }
                return node;
            },
            "ResponseDocument": function(responseDocument) {
                var node = this.createElementNSPlus("wps:ResponseDocument", {
                    attributes: {
                        storeExecuteResponse: responseDocument.storeExecuteResponse,
                        lineage: responseDocument.lineage,
                        status: responseDocument.status
                    }
                });
                if (responseDocument.outputs) {
                    for (var i = 0, len = responseDocument.outputs.length; i < len; i++) {
                        this.writeNode("wps:Output", responseDocument.outputs[i], node);
                    }
                }
                return node;
            },
            "Output": function(output) {
                var node = this.createElementNSPlus("wps:Output", {
                    attributes: {
                        asReference: output.asReference,
                        mimeType: output.mimeType,
                        encoding: output.encoding,
                        schema: output.schema
                    }
                });
                this.writeNode("ows:Identifier", output.identifier, node);
                this.writeNode("ows:Title", output.title, node);
                this.writeNode("ows:Abstract", output["abstract"], node);
                return node;
            },
            "RawDataOutput": function(rawDataOutput) {
                var node = this.createElementNSPlus("wps:RawDataOutput", {
                    attributes: {
                        mimeType: rawDataOutput.mimeType,
                        encoding: rawDataOutput.encoding,
                        schema: rawDataOutput.schema
                    }
                });
                this.writeNode("ows:Identifier", rawDataOutput.identifier, node);
                return node;
            },
            "DataInputs": function(dataInputs) {
                var node = this.createElementNSPlus("wps:DataInputs", {});
                for (var i=0, ii=dataInputs.length; i<ii; ++i) {
                    this.writeNode("wps:Input", dataInputs[i], node);
                }
                return node;
            },
            "Input": function(input) {
                var node = this.createElementNSPlus("wps:Input", {});
                this.writeNode("ows:Identifier", input.identifier, node);
                if (input.title) {
                    this.writeNode("ows:Title", input.title, node);
                }
                if (input.data) {
                    this.writeNode("wps:Data", input.data, node);
                }
                if (input.reference) {
                    this.writeNode("wps:Reference", input.reference, node);
                }
                if (input.boundingBoxData) {
                    this.writeNode("wps:BoundingBoxData", input.boundingBoxData, node);
                }
                return node;
            },
            "Data": function(data) {
                var node = this.createElementNSPlus("wps:Data", {});
                if (data.literalData) {
                    this.writeNode("wps:LiteralData", data.literalData, node);
                } else if (data.complexData) {
                    this.writeNode("wps:ComplexData", data.complexData, node);
                } else if (data.boundingBoxData) {
                    this.writeNode("ows:BoundingBox", data.boundingBoxData, node);
                }
                return node;
            },
            "LiteralData": function(literalData) {
                var node = this.createElementNSPlus("wps:LiteralData", {
                    attributes: {
                        uom: literalData.uom
                    },
                    value: literalData.value
                });
                return node;
            },
            "ComplexData": function(complexData) {
                var node = this.createElementNSPlus("wps:ComplexData", {
                    attributes: {
                        mimeType: complexData.mimeType,
                        encoding: complexData.encoding,
                        schema: complexData.schema
                    } 
                });
                var data = complexData.value;
                if (typeof data === "string") {
                    node.appendChild(
                        this.getXMLDoc().createCDATASection(complexData.value)
                    );
                } else {
                    node.appendChild(data);
                }
                return node;
            },
            "Reference": function(reference) {
                var node = this.createElementNSPlus("wps:Reference", {
                    attributes: {
                        mimeType: reference.mimeType,
                        "xlink:href": reference.href,
                        method: reference.method,
                        encoding: reference.encoding,
                        schema: reference.schema
                    }
                });
                if (reference.body) {
                    this.writeNode("wps:Body", reference.body, node);
                }
                return node;
            },
            "BoundingBoxData": function(node, obj) {
                this.writers['ows']['BoundingBox'].apply(this, [node, obj, "wps:BoundingBoxData"]);
            },
            "Body": function(body) {
                var node = this.createElementNSPlus("wps:Body", {});
                if (body.wcs) {
                    this.writeNode("wcs:GetCoverage", body.wcs, node);
                }
                else if (body.wfs) {
                    // OpenLayers.Format.WFST expects these to be on the 
                    // instance and not in the options
                    this.featureType = body.wfs.featureType;
                    this.version = body.wfs.version;
                    this.writeNode("wfs:GetFeature", body.wfs, node);
                } else {
                    this.writeNode("wps:Execute", body, node);
                }
                return node;                
            }
        },
        "wcs": OpenLayers.Format.WCSGetCoverage.prototype.writers.wcs,
        "wfs": OpenLayers.Format.WFST.v1_1_0.prototype.writers.wfs,
        "ogc": OpenLayers.Format.Filter.v1_1_0.prototype.writers.ogc,
        "ows": OpenLayers.Format.OWSCommon.v1_1_0.prototype.writers.ows
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
        "wps": {
            "ExecuteResponse": function(node, obj) {
                obj.executeResponse = {
                    lang: node.getAttribute("lang"),
                    statusLocation: node.getAttribute("statusLocation"),
                    serviceInstance: node.getAttribute("serviceInstance"),
                    service: node.getAttribute("service")
                };
                this.readChildNodes(node, obj.executeResponse);
            },
            "Process":function(node,obj) {
                obj.process = {};
                this.readChildNodes(node, obj.process);
            },
            "Status":function(node,obj) {
                obj.status = {
                    creationTime: node.getAttribute("creationTime")
                };
                this.readChildNodes(node, obj.status);
            },
            "ProcessSucceeded": function(node,obj) {
                obj.processSucceeded = true;
            },
            "ProcessOutputs": function(node, processDescription) {
                processDescription.processOutputs = [];
                this.readChildNodes(node, processDescription.processOutputs);
            },
            "Output": function(node, processOutputs) {
                var output = {};
                this.readChildNodes(node, output);
                processOutputs.push(output);
            },
            "Reference": function(node, output) {
                output.reference = {
                    href: node.getAttribute("href"),
                    mimeType: node.getAttribute("mimeType"),
                    encoding: node.getAttribute("encoding"),
                    schema: node.getAttribute("schema")
                };
            },
            "Data": function(node, output) {
                output.data = {};
                this.readChildNodes(node, output);
            },
            "LiteralData": function(node, output) {
                output.literalData = {
                    dataType: node.getAttribute("dataType"),
                    uom: node.getAttribute("uom"),
                    value: this.getChildValue(node)
                };
            },
            "ComplexData": function(node, output) {
                output.complexData = {
                    mimeType: node.getAttribute("mimeType"),
                    schema: node.getAttribute("schema"),
                    encoding: node.getAttribute("encoding"),
                    value: ""
                };
                
                // try to get *some* value, ignore the empty text values
                if (this.isSimpleContent(node)) {
                    var child;
                    for(child=node.firstChild; child; child=child.nextSibling) {
                        switch(child.nodeType) {
                            case 3: // text node
                            case 4: // cdata section
                                output.complexData.value += child.nodeValue;
                        }
                    }
                }
                else {
                    for(child=node.firstChild; child; child=child.nextSibling) {
                        if (child.nodeType == 1) {
                            output.complexData.value = child;
                        }
                    }
                }

            },
            "BoundingBox": function(node, output) {
                output.boundingBoxData = {
                    dimensions: node.getAttribute("dimensions"),
                    crs: node.getAttribute("crs")
                };
                this.readChildNodes(node, output.boundingBoxData);
            }
        },

        // TODO: we should add Exception parsing here
        "ows": OpenLayers.Format.OWSCommon.v1_1_0.prototype.readers["ows"]
    },
    
    CLASS_NAME: "OpenLayers.Format.WPSExecute" 

});
