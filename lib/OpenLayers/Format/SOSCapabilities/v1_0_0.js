/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/SOSCapabilities.js
 * @requires OpenLayers/Format/OWSCommon/v1_1_0.js
 * @requires OpenLayers/Format/GML/v3.js
 */

/**
 * Class: OpenLayers.Format.SOSCapabilities.v1_0_0
 * Read SOS Capabilities version 1.0.0.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.SOSCapabilities>
 */
OpenLayers.Format.SOSCapabilities.v1_0_0 = OpenLayers.Class(
    OpenLayers.Format.SOSCapabilities, {

    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
        ows: "http://www.opengis.net/ows/1.1",
        sos: "http://www.opengis.net/sos/1.0",
        gml: "http://www.opengis.net/gml",
        xlink: "http://www.w3.org/1999/xlink"
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
     * Constructor: OpenLayers.Format.SOSCapabilities.v1_0_0
     * Create a new parser for SOS capabilities version 1.0.0. 
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
     * Read capabilities data from a string, and return info about the SOS.
     * 
     * Parameters: 
     * data - {String} or {DOMElement} data to read/parse.
     *
     * Returns:
     * {Object} Information about the SOS service.
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
        return capabilities;
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
        "gml": OpenLayers.Util.applyDefaults({
            "name": function(node, obj) {
                obj.name = this.getChildValue(node);
            },
            "TimePeriod": function(node, obj) {
                obj.timePeriod = {};
                this.readChildNodes(node, obj.timePeriod);
            },
            "beginPosition": function(node, timePeriod) {
                timePeriod.beginPosition = this.getChildValue(node);
            },
            "endPosition": function(node, timePeriod) {
                timePeriod.endPosition = this.getChildValue(node);
            }
        }, OpenLayers.Format.GML.v3.prototype.readers["gml"]),
        "sos": {
            "Capabilities": function(node, obj) {
                this.readChildNodes(node, obj);
            },
            "Contents": function(node, obj) {
                obj.contents = {};
                this.readChildNodes(node, obj.contents);
            },
            "ObservationOfferingList": function(node, contents) {
                contents.offeringList = {};
                this.readChildNodes(node, contents.offeringList);
            },
            "ObservationOffering": function(node, offeringList) {
                var id = this.getAttributeNS(node, this.namespaces.gml, "id");
                offeringList[id] = {
                    procedures: [],
                    observedProperties: [],
                    featureOfInterestIds: [],
                    responseFormats: [],
                    resultModels: [],
                    responseModes: []
                };
                this.readChildNodes(node, offeringList[id]);
            },
            "time": function(node, offering) {
                offering.time = {};
                this.readChildNodes(node, offering.time);
            },
            "procedure": function(node, offering) {
                offering.procedures.push(this.getAttributeNS(node, 
                    this.namespaces.xlink, "href"));
            },
            "observedProperty": function(node, offering) {
                offering.observedProperties.push(this.getAttributeNS(node, 
                    this.namespaces.xlink, "href"));
            },
            "featureOfInterest": function(node, offering) {
                offering.featureOfInterestIds.push(this.getAttributeNS(node, 
                    this.namespaces.xlink, "href"));
            },
            "responseFormat": function(node, offering) {
                offering.responseFormats.push(this.getChildValue(node));
            },
            "resultModel": function(node, offering) {
                offering.resultModels.push(this.getChildValue(node));
            },
            "responseMode": function(node, offering) {
                offering.responseModes.push(this.getChildValue(node));
            }
        },
        "ows": OpenLayers.Format.OWSCommon.v1_1_0.prototype.readers["ows"]
    },    
    
    CLASS_NAME: "OpenLayers.Format.SOSCapabilities.v1_0_0" 

});
