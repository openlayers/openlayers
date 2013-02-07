/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/WCSCapabilities/v1.js
 * @requires OpenLayers/Format/GML/v3.js
 */

/**
 * Class: OpenLayers.Format.WCSCapabilities/v1_0_0
 * Read WCS Capabilities version 1.0.0.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.WCSCapabilities.v1>
 */
OpenLayers.Format.WCSCapabilities.v1_0_0 = OpenLayers.Class(
    OpenLayers.Format.WCSCapabilities.v1, {
    
    /**
     * Constructor: OpenLayers.Format.WCSCapabilities.v1_0_0
     * Create a new parser for WCS capabilities version 1.0.0.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */

    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
        wcs: "http://www.opengis.net/wcs",
        xlink: "http://www.w3.org/1999/xlink",
        xsi: "http://www.w3.org/2001/XMLSchema-instance",
        ows: "http://www.opengis.net/ows"
    },

    /**
     * Property: errorProperty
     * {String} Which property of the returned object to check for in order to
     * determine whether or not parsing has failed. In the case that the
     * errorProperty is undefined on the returned object, the document will be
     * run through an OGCExceptionReport parser.
     */
    errorProperty: "service",

    /**
     * Property: readers
     * Contains public functions, grouped by namespace prefix, that will
     *     be applied when a namespaced node is found matching the function
     *     name.  The function will be applied in the scope of this parser
     *     with two arguments: the node being read and a context object passed
     *     from the parent.
     */
    readers: {
        "wcs": {
             "WCS_Capabilities": function(node, obj) {          
                this.readChildNodes(node, obj);
            },
            "Service": function(node, obj) {
                obj.service = {};
                this.readChildNodes(node, obj.service);
            },
            "name": function(node, service) {  
                service.name = this.getChildValue(node);
            },
            "label": function(node, service) {  
                service.label = this.getChildValue(node);
            },
            "keywords": function(node, service) { 
                service.keywords = []; 
                this.readChildNodes(node, service.keywords);
            },
            "keyword": function(node, keywords) { 
                // Append the keyword to the keywords list
                keywords.push(this.getChildValue(node));      
            },
            "responsibleParty": function(node, service) {
                service.responsibleParty = {};
                this.readChildNodes(node, service.responsibleParty);   
            },
            "individualName": function(node, responsibleParty) {
                responsibleParty.individualName = this.getChildValue(node);
            },
            "organisationName": function(node, responsibleParty) {
                responsibleParty.organisationName = this.getChildValue(node);
            },
            "positionName": function(node, responsibleParty) {
                responsibleParty.positionName = this.getChildValue(node);
            },
            "contactInfo": function(node, responsibleParty) {
                responsibleParty.contactInfo = {};
                this.readChildNodes(node, responsibleParty.contactInfo);
            },
            "phone": function(node, contactInfo) {
                contactInfo.phone = {};
                this.readChildNodes(node, contactInfo.phone);
            },
            "voice": function(node, phone) {
                phone.voice = this.getChildValue(node);
            },
            "facsimile": function(node, phone) {
                phone.facsimile = this.getChildValue(node);
            },
            "address": function(node, contactInfo) {
                contactInfo.address = {};
                this.readChildNodes(node, contactInfo.address);
            },
            "deliveryPoint": function(node, address) {
                address.deliveryPoint = this.getChildValue(node);
            },
            "city": function(node, address) {
                address.city = this.getChildValue(node);
            },
            "postalCode": function(node, address) {
                address.postalCode = this.getChildValue(node);
            },
            "country": function(node, address) {
                address.country = this.getChildValue(node);
            },
            "electronicMailAddress": function(node, address) {
                address.electronicMailAddress = this.getChildValue(node);
            },
            "fees": function(node, service) {
                service.fees = this.getChildValue(node);
            },
            "accessConstraints": function(node, service) {
                service.accessConstraints = this.getChildValue(node);
            },
            "ContentMetadata": function(node, obj) {
                obj.contentMetadata = [];
                this.readChildNodes(node, obj.contentMetadata);
            },
            "CoverageOfferingBrief": function(node, contentMetadata) {
                var coverageOfferingBrief = {};
                this.readChildNodes(node, coverageOfferingBrief);
                contentMetadata.push(coverageOfferingBrief);
            },
            "name": function(node, coverageOfferingBrief) {
                coverageOfferingBrief.name = this.getChildValue(node);
            },
            "label": function(node, coverageOfferingBrief) {
                coverageOfferingBrief.label = this.getChildValue(node);
            },
            "lonLatEnvelope": function(node, coverageOfferingBrief) {
                var nodeList = this.getElementsByTagNameNS(node, "http://www.opengis.net/gml", "pos");

                // We expect two nodes here, to create the corners of a bounding box
                if(nodeList.length == 2) {
                    var min = {};
                    var max = {};

                    OpenLayers.Format.GML.v3.prototype.readers["gml"].pos.apply(this, [nodeList[0], min]);
                    OpenLayers.Format.GML.v3.prototype.readers["gml"].pos.apply(this, [nodeList[1], max]);

                    coverageOfferingBrief.lonLatEnvelope = {};
                    coverageOfferingBrief.lonLatEnvelope.srsName = node.getAttribute("srsName");
                    coverageOfferingBrief.lonLatEnvelope.min = min.points[0];
                    coverageOfferingBrief.lonLatEnvelope.max = max.points[0];
                }
            }
        }
    },
    
    CLASS_NAME: "OpenLayers.Format.WCSCapabilities.v1_0_0" 

});
