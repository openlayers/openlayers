/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/Filter/v1.js
 * @requires OpenLayers/Format/GML/v3.js
 */

/**
 * Class: OpenLayers.Format.Filter.v1_1_0
 * Write ogc:Filter version 1.1.0.
 *
 * Differences from the v1.0.0 parser:
 *  - uses GML v3 instead of GML v2
 *  - reads matchCase attribute on ogc:PropertyIsEqual and
 *        ogc:PropertyIsNotEqual elements.
 *  - writes matchCase attribute from comparison filters of type EQUAL_TO,
 *        NOT_EQUAL_TO and LIKE.
 * 
 * Inherits from: 
 *  - <OpenLayers.Format.GML.v3>
 *  - <OpenLayers.Format.Filter.v1>
 */
OpenLayers.Format.Filter.v1_1_0 = OpenLayers.Class(
    OpenLayers.Format.GML.v3, OpenLayers.Format.Filter.v1, {
    
    /**
     * Constant: VERSION
     * {String} 1.1.0
     */
    VERSION: "1.1.0",
    
    /**
     * Property: schemaLocation
     * {String} http://www.opengis.net/ogc/filter/1.1.0/filter.xsd
     */
    schemaLocation: "http://www.opengis.net/ogc/filter/1.1.0/filter.xsd",

    /**
     * Constructor: OpenLayers.Format.Filter.v1_1_0
     * Instances of this class are not created directly.  Use the
     *     <OpenLayers.Format.Filter> constructor instead.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.GML.v3.prototype.initialize.apply(
            this, [options]
        );
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
        "ogc": OpenLayers.Util.applyDefaults({
            "PropertyIsEqualTo": function(node, obj) {
                var matchCase = node.getAttribute("matchCase");
                var filter = new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.EQUAL_TO,
                    matchCase: !(matchCase === "false" || matchCase === "0")
                });
                this.readChildNodes(node, filter);
                obj.filters.push(filter);
            },
            "PropertyIsNotEqualTo": function(node, obj) {
                var matchCase = node.getAttribute("matchCase");
                var filter = new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.NOT_EQUAL_TO,
                    matchCase: !(matchCase === "false" || matchCase === "0")
                });
                this.readChildNodes(node, filter);
                obj.filters.push(filter);
            },
            "PropertyIsLike": function(node, obj) {
                var filter = new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.LIKE
                });
                this.readChildNodes(node, filter);
                var wildCard = node.getAttribute("wildCard");
                var singleChar = node.getAttribute("singleChar");
                var esc = node.getAttribute("escapeChar");
                filter.value2regex(wildCard, singleChar, esc);
                obj.filters.push(filter);
            }
        }, OpenLayers.Format.Filter.v1.prototype.readers["ogc"]),
        "gml": OpenLayers.Format.GML.v3.prototype.readers["gml"],
        "feature": OpenLayers.Format.GML.v3.prototype.readers["feature"]        
    },

    /**
     * Property: writers
     * As a compliment to the readers property, this structure contains public
     *     writing functions grouped by namespace alias and named like the
     *     node names they produce.
     */
    writers: {
        "ogc": OpenLayers.Util.applyDefaults({
            "PropertyIsEqualTo": function(filter) {
                var node = this.createElementNSPlus("ogc:PropertyIsEqualTo", {
                    attributes: {matchCase: filter.matchCase}
                });
                // no ogc:expression handling for PropertyName for now
                this.writeNode("PropertyName", filter, node);
                // handle Literals or Functions for now
                this.writeOgcExpression(filter.value, node);
                return node;
            },
            "PropertyIsNotEqualTo": function(filter) {
                var node = this.createElementNSPlus("ogc:PropertyIsNotEqualTo", {
                    attributes: {matchCase: filter.matchCase}
                });
                // no ogc:expression handling for PropertyName for now
                this.writeNode("PropertyName", filter, node);
                // handle Literals or Functions for now
                this.writeOgcExpression(filter.value, node);
                return node;
            },
            "PropertyIsLike": function(filter) {
                var node = this.createElementNSPlus("ogc:PropertyIsLike", {
                    attributes: {
                        matchCase: filter.matchCase,
                        wildCard: "*", singleChar: ".", escapeChar: "!"
                    }
                });
                // no ogc:expression handling for now
                this.writeNode("PropertyName", filter, node);
                // convert regex string to ogc string
                this.writeNode("Literal", filter.regex2value(), node);
                return node;
            },
            "BBOX": function(filter) {
                var node = this.createElementNSPlus("ogc:BBOX");
                // PropertyName is optional in 1.1.0
                filter.property && this.writeNode("PropertyName", filter, node);
                var box = this.writeNode("gml:Envelope", filter.value);
                if(filter.projection) {
                    box.setAttribute("srsName", filter.projection);
                }
                node.appendChild(box); 
                return node;
            },
            "SortBy": function(sortProperties) {
                var node = this.createElementNSPlus("ogc:SortBy");
                for (var i=0,l=sortProperties.length;i<l;i++) {
                    this.writeNode(
                        "ogc:SortProperty",
                        sortProperties[i],
                        node
                    );
                }
                return node;
            }, 
            "SortProperty": function(sortProperty) {
                var node = this.createElementNSPlus("ogc:SortProperty");
                this.writeNode(
                    "ogc:PropertyName",
                    sortProperty,
                    node
                );
                this.writeNode(
                    "ogc:SortOrder",
                    (sortProperty.order == 'DESC') ? 'DESC' : 'ASC',
                    node
                );
                return node;
            },
            "SortOrder": function(value) {
                var node = this.createElementNSPlus("ogc:SortOrder", {
                    value: value
                });
                return node;
            }
        }, OpenLayers.Format.Filter.v1.prototype.writers["ogc"]),
        "gml": OpenLayers.Format.GML.v3.prototype.writers["gml"],
        "feature": OpenLayers.Format.GML.v3.prototype.writers["feature"]
    },

    /**
     * Method: writeSpatial
     *
     * Read a {<OpenLayers.Filter.Spatial>} filter and converts it into XML.
     *
     * Parameters:
     * filter - {<OpenLayers.Filter.Spatial>} The filter.
     * name - {String} Name of the generated XML element.
     *
     * Returns:
     * {DOMElement} The created XML element.
     */
    writeSpatial: function(filter, name) {
        var node = this.createElementNSPlus("ogc:"+name);
        this.writeNode("PropertyName", filter, node);
        if(filter.value instanceof OpenLayers.Filter.Function) {
            this.writeNode("Function", filter.value, node);
        } else {
        var child;
        if(filter.value instanceof OpenLayers.Geometry) {
            child = this.writeNode("feature:_geometry", filter.value).firstChild;
        } else {
            child = this.writeNode("gml:Envelope", filter.value);
        }
        if(filter.projection) {
            child.setAttribute("srsName", filter.projection);
        }
        node.appendChild(child);
        }
        return node;
    },

    CLASS_NAME: "OpenLayers.Format.Filter.v1_1_0" 

});
