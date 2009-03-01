/**
 * @requires OpenLayers/Format/WFST/v1.js
 * @requires OpenLayers/Format/Filter/v1_1_0.js
 */

/**
 * Class: OpenLayers.Format.WFST.v1_1_0
 * A format for creating WFS v1.1.0 transactions.  Create a new instance with the
 *     <OpenLayers.Format.WFST.v1_1_0> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Format.Filter.v1_1_0>
 *  - <OpenLayers.Format.WFST.v1>
 */
OpenLayers.Format.WFST.v1_1_0 = OpenLayers.Class(
    OpenLayers.Format.Filter.v1_1_0, OpenLayers.Format.WFST.v1, {
    
    /**
     * Property: version
     * {String} WFS version number.
     */
    version: "1.1.0",
    
    /**
     * Property: schemaLocations
     * {Object} Properties are namespace aliases, values are schema locations.
     */
    schemaLocations: {
        "wfs": "http://schemas.opengis.net/wfs/1.1.0/wfs.xsd"
    },
    
    /**
     * Constructor: OpenLayers.Format.WFST.v1_1_0
     * A class for parsing and generating WFS v1.1.0 transactions.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     *
     * Valid options properties:
     * featureType - {String} Local (without prefix) feature typeName (required).
     * featureNS - {String} Feature namespace (optional).
     * featurePrefix - {String} Feature namespace alias (optional - only used
     *     if featureNS is provided).  Default is 'feature'.
     * geometryName - {String} Name of geometry attribute.  Default is 'the_geom'.
     */
    initialize: function(options) {
        OpenLayers.Format.Filter.v1_1_0.prototype.initialize.apply(this, [options]);
        OpenLayers.Format.WFST.v1.prototype.initialize.apply(this, [options]);
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
        "wfs": OpenLayers.Util.applyDefaults({
            "TransactionResponse": function(node, obj) {
                obj.insertIds = [];
                obj.success = false;
                this.readChildNodes(node, obj);
            },
            "TransactionSummary": function(node, obj) {
                // this is a limited test of success
                obj.success = true;
            },
            "InsertResults": function(node, obj) {
                this.readChildNodes(node, obj);
            },
            "Feature": function(node, container) {
                var obj = {fids: []};
                this.readChildNodes(node, obj);
                container.insertIds.push(obj.fids[0]);
            }
        }, OpenLayers.Format.WFST.v1.prototype.readers["wfs"]),
        "gml": OpenLayers.Format.GML.v3.prototype.readers["gml"],
        "feature": OpenLayers.Format.GML.v3.prototype.readers["feature"],
        "ogc": OpenLayers.Format.Filter.v1_1_0.prototype.readers["ogc"]
    },

    /**
     * Property: writers
     * As a compliment to the readers property, this structure contains public
     *     writing functions grouped by namespace alias and named like the
     *     node names they produce.
     */
    writers: {
        "wfs": OpenLayers.Util.applyDefaults({
            "Query": function(options) {
                options = OpenLayers.Util.extend({
                    featureNS: this.featureNS,
                    featurePrefix: this.featurePrefix,
                    featureType: this.featureType,
                    srsName: this.srsName
                }, options);
                var node = this.createElementNSPlus("wfs:Query", {
                    attributes: {
                        typeName: (options.featureNS ? options.featurePrefix + ":" : "") +
                            options.featureType,
                        srsName: options.srsName
                    }
                });
                if(options.featureNS) {
                    node.setAttribute("xmlns:" + options.featurePrefix, options.featureNS);
                }
                if(options.propertyNames) {
                    for(var i=0,len = options.propertyNames.length; i<len; i++) {
                        this.writeNode(
                            "wfs:PropertyName", 
                            {property: options.propertyNames[i]},
                            node
                        );
                    }
                }
                if(options.filter) {
                    this.setFilterProperty(options.filter);
                    this.writeNode("ogc:Filter", options.filter, node);
                }
                return node;
            },
            "PropertyName": function(obj) {
                return this.createElementNSPlus("wfs:PropertyName", {
                    value: obj.property
                });
            }            
        }, OpenLayers.Format.WFST.v1.prototype.writers["wfs"]),
        "gml": OpenLayers.Format.GML.v3.prototype.writers["gml"],
        "feature": OpenLayers.Format.GML.v3.prototype.writers["feature"],
        "ogc": OpenLayers.Format.Filter.v1_1_0.prototype.writers["ogc"]
    },

    CLASS_NAME: "OpenLayers.Format.WFST.v1_1_0" 
});
