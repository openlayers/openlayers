/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/Filter.js
 * @requires OpenLayers/Format/XML.js
 */

/**
 * Class: OpenLayers.Format.Filter.v1
 * Superclass for Filter version 1 parsers.
 *
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.Filter.v1 = OpenLayers.Class(OpenLayers.Format.XML, {
    
    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
        ogc: "http://www.opengis.net/ogc",
        gml: "http://www.opengis.net/gml",
        xlink: "http://www.w3.org/1999/xlink",
        xsi: "http://www.w3.org/2001/XMLSchema-instance"
    },
    
    /**
     * Property: defaultPrefix
     */
    defaultPrefix: "ogc",

    /**
     * Property: schemaLocation
     * {String} Schema location for a particular minor version.
     */
    schemaLocation: null,
    
    /**
     * Constructor: OpenLayers.Format.Filter.v1
     * Instances of this class are not created directly.  Use the
     *     <OpenLayers.Format.Filter> constructor instead.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.XML.prototype.initialize.apply(this, [options]);
    },
    
    /**
     * Method: read
     *
     * Parameters:
     * data - {DOMElement} A Filter document element.
     *
     * Returns:
     * {<OpenLayers.Filter>} A filter object.
     */
    read: function(data) {
        var obj = {};
        this.readers.ogc["Filter"].apply(this, [data, obj]);
        return obj.filter;
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
        "ogc": {
            "Filter": function(node, parent) {
                // Filters correspond to subclasses of OpenLayers.Filter.
                // Since they contain information we don't persist, we
                // create a temporary object and then pass on the filter
                // (ogc:Filter) to the parent obj.
                var obj = {
                    fids: [],
                    filters: []
                };
                this.readChildNodes(node, obj);
                if(obj.fids.length > 0) {
                    parent.filter = new OpenLayers.Filter.FeatureId({
                        fids: obj.fids
                    });
                } else if(obj.filters.length > 0) {
                    parent.filter = obj.filters[0];
                }
            },
            "FeatureId": function(node, obj) {
                var fid = node.getAttribute("fid");
                if(fid) {
                    obj.fids.push(fid);
                }
            },
            "And": function(node, obj) {
                var filter = new OpenLayers.Filter.Logical({
                    type: OpenLayers.Filter.Logical.AND
                });
                this.readChildNodes(node, filter);
                obj.filters.push(filter);
            },
            "Or": function(node, obj) {
                var filter = new OpenLayers.Filter.Logical({
                    type: OpenLayers.Filter.Logical.OR
                });
                this.readChildNodes(node, filter);
                obj.filters.push(filter);
            },
            "Not": function(node, obj) {
                var filter = new OpenLayers.Filter.Logical({
                    type: OpenLayers.Filter.Logical.NOT
                });
                this.readChildNodes(node, filter);
                obj.filters.push(filter);
            },
            "PropertyIsLessThan": function(node, obj) {
                var filter = new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.LESS_THAN
                });
                this.readChildNodes(node, filter);
                obj.filters.push(filter);
            },
            "PropertyIsGreaterThan": function(node, obj) {
                var filter = new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.GREATER_THAN
                });
                this.readChildNodes(node, filter);
                obj.filters.push(filter);
            },
            "PropertyIsLessThanOrEqualTo": function(node, obj) {
                var filter = new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.LESS_THAN_OR_EQUAL_TO
                });
                this.readChildNodes(node, filter);
                obj.filters.push(filter);
            },
            "PropertyIsGreaterThanOrEqualTo": function(node, obj) {
                var filter = new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO
                });
                this.readChildNodes(node, filter);
                obj.filters.push(filter);
            },
            "PropertyIsBetween": function(node, obj) {
                var filter = new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.BETWEEN
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
                var esc = node.getAttribute("escape");
                filter.value2regex(wildCard, singleChar, esc);
                obj.filters.push(filter);
            },
            "Literal": function(node, obj) {
                obj.value = this.getChildValue(node);
            },
            "PropertyName": function(node, filter) {
                filter.property = this.getChildValue(node);
            },
            "LowerBoundary": function(node, filter) {
                filter.lowerBoundary = this.readOgcExpression(node);
            },
            "UpperBoundary": function(node, filter) {
                filter.upperBoundary = this.readOgcExpression(node);
            }
            
        }
    },
    
    /**
     * Method: readOgcExpression
     * Limited support for OGC expressions.
     *
     * Parameters:
     * node - {DOMElement} A DOM element that contains an ogc:expression.
     *
     * Returns:
     * {String} A value to be used in a symbolizer.
     */
    readOgcExpression: function(node) {
        var obj = {};
        this.readChildNodes(node, obj);
        var value = obj.value;
        if(!value) {
            value = this.getChildValue(node);
        }
        return value;
    },

    /**
     * Method: write
     *
     * Parameters:
     * filter - {<OpenLayers.Filter>} A filter object.
     *
     * Returns:
     * {DOMElement} An ogc:Filter element.
     */
    write: function(filter) {
        return this.writers.ogc["Filter"].apply(this, [filter]);
    },
    
    /**
     * Property: writers
     * As a compliment to the readers property, this structure contains public
     *     writing functions grouped by namespace alias and named like the
     *     node names they produce.
     */
    writers: {
        "ogc": {
            "Filter": function(filter) {
                var node = this.createElementNSPlus("ogc:Filter");
                var sub = filter.CLASS_NAME.split(".").pop();
                if(sub == "FeatureId") {
                    for(var i=0; i<filter.fids.length; ++i) {
                        this.writeNode("FeatureId", filter.fids[i], node);
                    }
                } else {
                    this.writeNode(this.getFilterType(filter), filter, node);
                }
                return node;
            },
            "FeatureId": function(fid) {
                return this.createElementNSPlus("ogc:FeatureId", {
                    attributes: {fid: fid}
                });
            },
            "And": function(filter) {
                var node = this.createElementNSPlus("ogc:And");
                var childFilter;
                for(var i=0; i<filter.filters.length; ++i) {
                    childFilter = filter.filters[i];
                    this.writeNode(
                        this.getFilterType(childFilter), childFilter, node
                    );
                }
                return node;
            },
            "Or": function(filter) {
                var node = this.createElementNSPlus("ogc:Or");
                var childFilter;
                for(var i=0; i<filter.filters.length; ++i) {
                    childFilter = filter.filters[i];
                    this.writeNode(
                        this.getFilterType(childFilter), childFilter, node
                    );
                }
                return node;
            },
            "Not": function(filter) {
                var node = this.createElementNSPlus("ogc:Not");
                var childFilter = filter.filters[0];
                this.writeNode(
                    this.getFilterType(childFilter), childFilter, node
                );
                return node;
            },
            "PropertyIsLessThan": function(filter) {
                var node = this.createElementNSPlus("ogc:PropertyIsLessThan");
                // no ogc:expression handling for now
                this.writeNode("PropertyName", filter, node);
                this.writeNode("Literal", filter.value, node);                
                return node;
            },
            "PropertyIsGreaterThan": function(filter) {
                var node = this.createElementNSPlus("ogc:PropertyIsGreaterThan");
                // no ogc:expression handling for now
                this.writeNode("PropertyName", filter, node);
                this.writeNode("Literal", filter.value, node);
                return node;
            },
            "PropertyIsLessThanOrEqualTo": function(filter) {
                var node = this.createElementNSPlus("ogc:PropertyIsLessThanOrEqualTo");
                // no ogc:expression handling for now
                this.writeNode("PropertyName", filter, node);
                this.writeNode("Literal", filter.value, node);
                return node;
            },
            "PropertyIsGreaterThanOrEqualTo": function(filter) {
                var node = this.createElementNSPlus("ogc:PropertyIsGreaterThanOrEqualTo");
                // no ogc:expression handling for now
                this.writeNode("PropertyName", filter, node);
                this.writeNode("Literal", filter.value, node);
                return node;
            },
            "PropertyIsBetween": function(filter) {
                var node = this.createElementNSPlus("ogc:PropertyIsBetween");
                // no ogc:expression handling for now
                this.writeNode("PropertyName", filter, node);
                this.writeNode("LowerBoundary", filter, node);
                this.writeNode("UpperBoundary", filter, node);
                return node;
            },
            "PropertyIsLike": function(filter) {
                var node = this.createElementNSPlus("ogc:PropertyIsLike", {
                    attributes: {
                        wildCard: "*", singleChar: ".", escape: "!"
                    }
                });
                // no ogc:expression handling for now
                this.writeNode("PropertyName", filter, node);
                // convert regex string to ogc string
                this.writeNode("Literal", filter.regex2value(), node);
                return node;
            },
            "PropertyName": function(filter) {
                // no ogc:expression handling for now
                return this.createElementNSPlus("ogc:PropertyName", {
                    value: filter.property
                });
            },
            "Literal": function(value) {
                // no ogc:expression handling for now
                return this.createElementNSPlus("ogc:Literal", {
                    value: value
                });
            },
            "LowerBoundary": function(filter) {
                // no ogc:expression handling for now
                var node = this.createElementNSPlus("ogc:LowerBoundary");
                this.writeNode("Literal", filter.lowerBoundary, node);
                return node;
            },
            "UpperBoundary": function(filter) {
                // no ogc:expression handling for now
                var node = this.createElementNSPlus("ogc:UpperBoundary");
                this.writeNode("Literal", filter.upperBoundary, node);
                return node;
            },
            "DWITHIN": function(filter) {
                var node = this.createElementNSPlus("ogc:DWithin");
                this.writeNode("PropertyName", filter, node);
                var child = this.writeNode("feature:_geometry", filter.value);
                node.appendChild(child.firstChild);
                this.writeNode("Distance", filter, node);
                return node;
            },
            "INTERSECTS": function(filter) {
                var node = this.createElementNSPlus("ogc:Intersects");
                this.writeNode("PropertyName", filter, node);
                var child = this.writeNode("feature:_geometry", filter.value);
                node.appendChild(child.firstChild);
                return node;
            },
            "Distance": function(filter) {
                return this.createElementNSPlus("ogc:Distance", 
                    {attributes: {units: filter.distanceUnits}, 
                     value: filter.distance});
            }
        }
    },
    
    /**
     * Method: getFilterType
     */
    getFilterType: function(filter) {
        var filterType = this.filterMap[filter.type];
        if(!filterType) {
            throw "Filter writing not supported for rule type: " + filter.type;
        }
        return filterType;
    },
    
    /**
     * Property: filterMap
     * {Object} Contains a member for each filter type.  Values are node names
     *     for corresponding OGC Filter child elements.
     */
    filterMap: {
        "&&": "And",
        "||": "Or",
        "!": "Not",
        "==": "PropertyIsEqualTo",
        "!=": "PropertyIsNotEqualTo",
        "<": "PropertyIsLessThan",
        ">": "PropertyIsGreaterThan",
        "<=": "PropertyIsLessThanOrEqualTo",
        ">=": "PropertyIsGreaterThanOrEqualTo",
        "..": "PropertyIsBetween",
        "~": "PropertyIsLike",
        "BBOX": "BBOX",
        "DWITHIN": "DWITHIN",
        "INTERSECTS": "INTERSECTS"
    },

    CLASS_NAME: "OpenLayers.Format.Filter.v1" 

});
