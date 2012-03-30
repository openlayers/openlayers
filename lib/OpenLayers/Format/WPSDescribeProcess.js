/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */
 
/**
 * @requires OpenLayers/Format/XML.js
 * @requires OpenLayers/Format/OWSCommon/v1_1_0.js
 */

/**
 * Class: OpenLayers.Format.WPSDescribeProcess
 * Read WPS DescribeProcess responses. 
 *
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.WPSDescribeProcess = OpenLayers.Class(
    OpenLayers.Format.XML, {
    
    /**
     * Constant: VERSION
     * {String} 1.0.0
     */
    VERSION: "1.0.0",

    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
        wps: "http://www.opengis.net/wps/1.0.0",
        ows: "http://www.opengis.net/ows/1.1",
        xsi: "http://www.w3.org/2001/XMLSchema-instance"
    },

    /**
     * Property: schemaLocation
     * {String} Schema location
     */
    schemaLocation: "http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsAll.xsd",

    /**
     * Property: defaultPrefix
     */
    defaultPrefix: "wps",

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
     * Constructor: OpenLayers.Format.WPSDescribeProcess
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */

    /**
     * APIMethod: read
     * Parse a WPS DescribeProcess and return an object with its information.
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
     * Property: readers
     * Contains public functions, grouped by namespace prefix, that will
     *     be applied when a namespaced node is found matching the function
     *     name.  The function will be applied in the scope of this parser
     *     with two arguments: the node being read and a context object passed
     *     from the parent.
     */
    readers: {
        "wps": {
            "ProcessDescriptions": function(node, obj) {
                obj.processDescriptions = {};
                this.readChildNodes(node, obj.processDescriptions);
            },
            "ProcessDescription": function(node, processDescriptions) {
                var processVersion = this.getAttributeNS(node, this.namespaces.wps, "processVersion");
                var processDescription = {
                    processVersion: processVersion,
                    statusSupported: (node.getAttribute("statusSupported") === "true"),
                    storeSupported: (node.getAttribute("storeSupported") === "true")
                };
                this.readChildNodes(node, processDescription);
                processDescriptions[processDescription.identifier] = processDescription;
            },
            "DataInputs": function(node, processDescription) {
                processDescription.dataInputs = [];
                this.readChildNodes(node, processDescription.dataInputs);
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
            "ComplexOutput": function(node, output) {
                output.complexOutput = {};
                this.readChildNodes(node, output.complexOutput);
            },
            "Input": function(node, dataInputs) {
                var input = {
                    maxOccurs: parseInt(node.getAttribute("maxOccurs")),
                    minOccurs: parseInt(node.getAttribute("minOccurs"))
                };
                this.readChildNodes(node, input);
                dataInputs.push(input);
            },
            "BoundingBoxData": function(node, input) {
                input.boundingBoxData = {};
                this.readChildNodes(node, input.boundingBoxData);
            },
            "CRS": function(node, obj) {
                if (!obj.CRSs) {
                    obj.CRSs = {};
                }
                obj.CRSs[this.getChildValue(node)] = true;
            },
            "LiteralData": function(node, input) {
                input.literalData = {};
                this.readChildNodes(node, input.literalData);
            },
            "ComplexData": function(node, input) {
                input.complexData = {};
                this.readChildNodes(node,  input.complexData);
            },
            "Default": function(node, complexData) {
                complexData["default"] = {};
                this.readChildNodes(node,  complexData["default"]);
            },
            "Supported": function(node, complexData) {
                complexData["supported"] = {};
                this.readChildNodes(node,  complexData["supported"]);
            },
            "Format": function(node, obj) {
                var format = {};
                this.readChildNodes(node, format);
                if (!obj.formats) {
                    obj.formats = {};
                }
                obj.formats[format.mimeType] = true;
            },
            "MimeType": function(node, format) {
                format.mimeType = this.getChildValue(node);
            }
        },
        "ows": OpenLayers.Format.OWSCommon.v1_1_0.prototype.readers["ows"]
    },
    
    CLASS_NAME: "OpenLayers.Format.WPSDescribeProcess" 

});
