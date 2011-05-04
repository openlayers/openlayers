/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/WFSCapabilities/v1.js
 */

/**
 * Class: OpenLayers.Format.WFSCapabilities/v1_0_0
 * Read WFS Capabilities version 1.0.0.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.WFSCapabilities>
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
    initialize: function(options) {
        OpenLayers.Format.WFSCapabilities.v1.prototype.initialize.apply(
            this, [options]
        );
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
     * Method: read_cap_OnlineResource
     */
    read_cap_OnlineResource: function(service, node) {
        var onlineResource = this.getChildValue(node);
        if (onlineResource && onlineResource.toLowerCase() != "none") {
            service.onlineResource = onlineResource;
        }
    },
    
    /**
     * Method: read_cap_Keywords
     */
    read_cap_Keywords: function(service, node) {
        var keywords = this.getChildValue(node);
        if (keywords && keywords.toLowerCase() != "none") {
            service.keywords = keywords.split(', ');
        }
    },
    
    /**
     * Method: read_cap_Capability
     */
    read_cap_Capability: function(capabilities, node) {
        var capability = {};
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
     * Method: read_cap_GetFeature
     */
    read_cap_GetFeature: function(request, node) {
        var getfeature = {
            href: {}, // DCPType
            formats: [] // ResultFormat
        };
        this.runChildNodes(getfeature, node);
        request.getfeature = getfeature;
    },
    
    /**
     * Method: read_cap_ResultFormat
     */
    read_cap_ResultFormat: function(obj, node) {
        var children = node.childNodes;
        var childNode;
        for(var i=0; i<children.length; i++) {
            childNode = children[i];
            if(childNode.nodeType == 1) {
                obj.formats.push(childNode.nodeName);
            }
        }
    },
    
    /**
     * Method: read_cap_DCPType
     */
    read_cap_DCPType: function(obj, node) {
        this.runChildNodes(obj, node);
    },
    
    /**
     * Method: read_cap_HTTP
     */
    read_cap_HTTP: function(obj, node) {
        this.runChildNodes(obj.href, node);
    },
    
    /**
     * Method: read_cap_Get
     */
    read_cap_Get: function(obj, node) {
        obj.get = node.getAttribute("onlineResource");
    },
    
    /**
     * Method: read_cap_Post
     */
    read_cap_Post: function(obj, node) {
        obj.post = node.getAttribute("onlineResource");
    },

    /**
     * Method: read_cap_SRS
     */
    read_cap_SRS: function(obj, node) {
        var srs = this.getChildValue(node);
        if (srs) {
            obj.srs = srs;
        }
    },
    
    CLASS_NAME: "OpenLayers.Format.WFSCapabilities.v1_0_0" 

});
