/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/WFSCapabilities/v1.js
 */

/**
 * Class: OpenLayers.Format.WFSCapabilities/v1_0_0
 * Read WFS Capabilities version 1.0.0.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.WFSCapabilities.v1>
 */
OpenLayers.Format.WFSCapabilities.v1_0_0 = OpenLayers.Class(
    OpenLayers.Format.WFSCapabilities.v1, {
    
    /**
     * Constructor: OpenLayers.Format.WFSCapabilities.v1_0_0
     * Create a new parser for WFS capabilities version 1.0.0.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */

    /**
     * Property: readers
     * Contains public functions, grouped by namespace prefix, that will
     *     be applied when a namespaced node is found matching the function
     *     name.  The function will be applied in the scope of this parser
     *     with two arguments: the node being read and a context object passed
     *     from the parent.
     */
    readers: {
        "wfs": OpenLayers.Util.applyDefaults({
            "Service": function(node, capabilities) {
                capabilities.service = {};
                this.readChildNodes(node, capabilities.service);
            },
            "Fees": function(node, service) {
                var fees = this.getChildValue(node);
                if (fees && fees.toLowerCase() != "none") {
                    service.fees = fees;
                }
            },
            "AccessConstraints": function(node, service) {
                var constraints = this.getChildValue(node);
                if (constraints && constraints.toLowerCase() != "none") {
                    service.accessConstraints = constraints;
                }
            },
            "OnlineResource": function(node, service) {
                var onlineResource = this.getChildValue(node);
                if (onlineResource && onlineResource.toLowerCase() != "none") {
                    service.onlineResource = onlineResource;
                }
            },
            "Keywords": function(node, service) {
                var keywords = this.getChildValue(node);
                if (keywords && keywords.toLowerCase() != "none") {
                    service.keywords = keywords.split(', ');
                }
            },
            "Capability": function(node, capabilities) {
                capabilities.capability = {};
                this.readChildNodes(node, capabilities.capability);
            },
            "Request": function(node, obj) {
                obj.request = {};
                this.readChildNodes(node, obj.request);
            },
            "GetFeature": function(node, request) {
                request.getfeature = {
                    href: {}, // DCPType
                    formats: [] // ResultFormat
                };
                this.readChildNodes(node, request.getfeature);
            },
            "ResultFormat": function(node, obj) {
                var children = node.childNodes;
                var childNode;
                for(var i=0; i<children.length; i++) {
                    childNode = children[i];
                    if(childNode.nodeType == 1) {
                        obj.formats.push(childNode.nodeName);
                    }
                }
            },
            "DCPType": function(node, obj) {
                this.readChildNodes(node, obj);
            },
            "HTTP": function(node, obj) {
                this.readChildNodes(node, obj.href);
            },
            "Get": function(node, obj) {
                obj.get = node.getAttribute("onlineResource");
            },
            "Post": function(node, obj) {
                obj.post = node.getAttribute("onlineResource");
            },
            "SRS": function(node, obj) {
                var srs = this.getChildValue(node);
                if (srs) {
                    obj.srs = srs;
                }
            }
        }, OpenLayers.Format.WFSCapabilities.v1.prototype.readers["wfs"])
    },
    
    CLASS_NAME: "OpenLayers.Format.WFSCapabilities.v1_0_0" 

});
