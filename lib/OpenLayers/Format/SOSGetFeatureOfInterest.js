/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */
 
/**
 * @requires OpenLayers/Format/XML.js
 * @requires OpenLayers/Format/GML/v3.js
 */

/**
 * Class: OpenLayers.Format.SOSGetFeatureOfInterest
 * Read and write SOS GetFeatureOfInterest. This is used to get to
 * the location of the features (stations). The stations can have 1 or more
 * sensors.
 *
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.SOSGetFeatureOfInterest = OpenLayers.Class(
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
        sos: "http://www.opengis.net/sos/1.0",
        gml: "http://www.opengis.net/gml",
        sa: "http://www.opengis.net/sampling/1.0",
        xsi: "http://www.w3.org/2001/XMLSchema-instance"
    },

    /**
     * Property: schemaLocation
     * {String} Schema location
     */
    schemaLocation: "http://www.opengis.net/sos/1.0 http://schemas.opengis.net/sos/1.0.0/sosAll.xsd",

    /**
     * Property: defaultPrefix
     */
    defaultPrefix: "sos",

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
     * Constructor: OpenLayers.Format.SOSGetFeatureOfInterest
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */

    /**
     * APIMethod: read
     * Parse a GetFeatureOfInterest response and return an array of features
     * 
     * Parameters: 
     * data - {String} or {DOMElement} data to read/parse.
     *
     * Returns:
     * {Array(<OpenLayers.Feature.Vector>)} An array of features. 
     */
    read: function(data) {
        if(typeof data == "string") {
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }
        if(data && data.nodeType == 9) {
            data = data.documentElement;
        }

        var info = {features: []};
        this.readNode(data, info);
       
        var features = [];
        for (var i=0, len=info.features.length; i<len; i++) {
            var container = info.features[i];
            // reproject features if needed
            if(this.internalProjection && this.externalProjection &&
                container.components[0]) {
                    container.components[0].transform(
                        this.externalProjection, this.internalProjection
                    );
            }             
            var feature = new OpenLayers.Feature.Vector(
                container.components[0], container.attributes);
            features.push(feature);
        }
        return features;
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
        "sa": {
            "SamplingPoint": function(node, obj) {
                // sampling point can also be without a featureMember if 
                // there is only 1
                if (!obj.attributes) {
                    var feature = {attributes: {}};
                    obj.features.push(feature);
                    obj = feature;
                }
                obj.attributes.id = this.getAttributeNS(node, 
                    this.namespaces.gml, "id");
                this.readChildNodes(node, obj);
            },
            "position": function (node, obj) {
                this.readChildNodes(node, obj);
            }
        },
        "gml": OpenLayers.Util.applyDefaults({
            "FeatureCollection": function(node, obj) {
                this.readChildNodes(node, obj);
            },
            "featureMember": function(node, obj) {
                var feature = {attributes: {}};
                obj.features.push(feature);
                this.readChildNodes(node, feature);
            },
            "name": function(node, obj) {
                obj.attributes.name = this.getChildValue(node);
            },
            "pos": function(node, obj) {
                // we need to parse the srsName to get to the 
                // externalProjection, that's why we cannot use
                // GML v3 for this
                if (!this.externalProjection) {
                    this.externalProjection = new OpenLayers.Projection(
                        node.getAttribute("srsName"));
                }
             OpenLayers.Format.GML.v3.prototype.readers.gml.pos.apply(
                    this, [node, obj]);
            }
        }, OpenLayers.Format.GML.v3.prototype.readers.gml)
    },
    
    /**
     * Property: writers
     * As a compliment to the readers property, this structure contains public
     *     writing functions grouped by namespace alias and named like the
     *     node names they produce.
     */
    writers: {
        "sos": {
            "GetFeatureOfInterest": function(options) {
                var node = this.createElementNSPlus("GetFeatureOfInterest", {
                    attributes: {
                        version: this.VERSION,
                        service: 'SOS',
                        "xsi:schemaLocation": this.schemaLocation
                    } 
                }); 
                for (var i=0, len=options.fois.length; i<len; i++) {
                    this.writeNode("FeatureOfInterestId", {foi: options.fois[i]}, node);
                }
                return node; 
            },
            "FeatureOfInterestId": function(options) {
                var node = this.createElementNSPlus("FeatureOfInterestId", {value: options.foi});
                return node;
            }
        }
    },

    CLASS_NAME: "OpenLayers.Format.SOSGetFeatureOfInterest" 

});
