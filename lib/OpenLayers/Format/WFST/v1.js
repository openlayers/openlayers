/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML.js
 * @requires OpenLayers/Format/WFST.js
 */

/**
 * Class: OpenLayers.Format.WFST.v1
 * Superclass for WFST parsers.
 *
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.WFST.v1 = OpenLayers.Class(OpenLayers.Format.XML, {
    
    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
        xlink: "http://www.w3.org/1999/xlink",
        xsi: "http://www.w3.org/2001/XMLSchema-instance",
        wfs: "http://www.opengis.net/wfs",
        gml: "http://www.opengis.net/gml",
        ogc: "http://www.opengis.net/ogc",
        ows: "http://www.opengis.net/ows"
    },
    
    /**
     * Property: defaultPrefix
     */
    defaultPrefix: "wfs",

    /**
     * Property: version
     * {String} WFS version number.
     */
    version: null,

    /**
     * Property: schemaLocation
     * {String} Schema location for a particular minor version.
     */
    schemaLocations: null,
    
    /**
     * APIProperty: srsName
     * {String} URI for spatial reference system.
     */
    srsName: null,

    /**
     * APIProperty: extractAttributes
     * {Boolean} Extract attributes from GML.  Default is true.
     */
    extractAttributes: true,
    
    /**
     * APIProperty: xy
     * {Boolean} Order of the GML coordinate true:(x,y) or false:(y,x)
     * Changing is not recommended, a new Format should be instantiated.
     */ 
    xy: true,

    /**
     * Property: stateName
     * {Object} Maps feature states to node names.
     */
    stateName: null,
    
    /**
     * Constructor: OpenLayers.Format.WFST.v1
     * Instances of this class are not created directly.  Use the
     *     <OpenLayers.Format.WFST.v1_0_0> or <OpenLayers.Format.WFST.v1_1_0>
     *     constructor instead.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        // set state name mapping
        this.stateName = {};
        this.stateName[OpenLayers.State.INSERT] = "wfs:Insert";
        this.stateName[OpenLayers.State.UPDATE] = "wfs:Update";
        this.stateName[OpenLayers.State.DELETE] = "wfs:Delete";
        OpenLayers.Format.XML.prototype.initialize.apply(this, [options]);
    },
    
    /**
     * Method: getSrsName
     */
    getSrsName: function(feature, options) {
        var srsName = options && options.srsName;
        if(!srsName) {
            if(feature && feature.layer) {
                srsName = feature.layer.projection.getCode();
            } else {
                srsName = this.srsName;
            }
        }
        return srsName;
    },

    /**
     * APIMethod: read
     * Parse the response from a transaction.  Because WFS is split into
     *     Transaction requests (create, update, and delete) and GetFeature
     *     requests (read), this method handles parsing of both types of
     *     responses.
     *
     * Parameters:
     * data - {String | Document} The WFST document to read
     * options - {Object} Options for the reader
     *
     * Valid options properties:
     * output - {String} either "features" or "object". The default is
     *     "features", which means that the method will return an array of
     *     features. If set to "object", an object with a "features" property
     *     and other properties read by the parser will be returned.
     *
     * Returns:
     * {Array | Object} Output depending on the output option.
     */
    read: function(data, options) {
        options = options || {};
        OpenLayers.Util.applyDefaults(options, {
            output: "features"
        });
        
        if(typeof data == "string") { 
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }
        if(data && data.nodeType == 9) {
            data = data.documentElement;
        }
        var obj = {};
        if(data) {
            this.readNode(data, obj, true);
        }
        if(obj.features && options.output === "features") {
            obj = obj.features;
        }
        return obj;
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
        "wfs": {
            "FeatureCollection": function(node, obj) {
                obj.features = [];
                this.readChildNodes(node, obj);
            }
        }
    },
    
    /**
     * Method: write
     * Given an array of features, write a WFS transaction.  This assumes
     *     the features have a state property that determines the operation
     *     type - insert, update, or delete.
     *
     * Parameters:
     * features - {Array(<OpenLayers.Feature.Vector>)} A list of features. See
     *     below for a more detailed description of the influence of the
     *     feature's *modified* property.
     * options - {Object}
     *
     * feature.modified rules:
     * If a feature has a modified property set, the following checks will be
     * made before a feature's geometry or attribute is included in an Update
     * transaction:
     * - *modified* is not set at all: The geometry and all attributes will be
     *     included.
     * - *modified.geometry* is set (null or a geometry): The geometry will be
     *     included. If *modified.attributes* is not set, all attributes will
     *     be included.
     * - *modified.attributes* is set: Only the attributes set (i.e. to null or
     *     a value) in *modified.attributes* will be included. 
     *     If *modified.geometry* is not set, the geometry will not be included.
     *
     * Valid options include:
     * - *multi* {Boolean} If set to true, geometries will be casted to
     *   Multi geometries before writing.
     *
     * Returns:
     * {String} A serialized WFS transaction.
     */
    write: function(features, options) {
        var node = this.writeNode("wfs:Transaction", {
            features:features,
            options: options
        });
        var value = this.schemaLocationAttr();
        if(value) {
            this.setAttributeNS(
                node, this.namespaces["xsi"], "xsi:schemaLocation",  value
            );
        }
        return OpenLayers.Format.XML.prototype.write.apply(this, [node]);
    },
    
    /**
     * Property: writers
     * As a compliment to the readers property, this structure contains public
     *     writing functions grouped by namespace alias and named like the
     *     node names they produce.
     */
    writers: {
        "wfs": {
            "GetFeature": function(options) {
                var node = this.createElementNSPlus("wfs:GetFeature", {
                    attributes: {
                        service: "WFS",
                        version: this.version,
                        handle: options && options.handle,
                        outputFormat: options && options.outputFormat,
                        maxFeatures: options && options.maxFeatures,
                        "xsi:schemaLocation": this.schemaLocationAttr(options)
                    }
                });
                if (typeof this.featureType == "string") {
                    this.writeNode("Query", options, node);
                } else {
                    for (var i=0,len = this.featureType.length; i<len; i++) { 
                        options.featureType = this.featureType[i]; 
                        this.writeNode("Query", options, node); 
                    } 
                }
                return node;
            },
            "Transaction": function(obj) {
                obj = obj || {};
                var options = obj.options || {};
                var node = this.createElementNSPlus("wfs:Transaction", {
                    attributes: {
                        service: "WFS",
                        version: this.version,
                        handle: options.handle
                    }
                });
                var i, len;
                var features = obj.features;
                if(features) {
                    // temporarily re-assigning geometry types
                    if (options.multi === true) {
                        OpenLayers.Util.extend(this.geometryTypes, {
                            "OpenLayers.Geometry.Point": "MultiPoint",
                            "OpenLayers.Geometry.LineString": (this.multiCurve === true) ? "MultiCurve": "MultiLineString",
                            "OpenLayers.Geometry.Polygon": (this.multiSurface === true) ? "MultiSurface" : "MultiPolygon"
                        });
                    }
                    var name, feature;
                    for(i=0, len=features.length; i<len; ++i) {
                        feature = features[i];
                        name = this.stateName[feature.state];
                        if(name) {
                            this.writeNode(name, {
                                feature: feature, 
                                options: options
                            }, node);
                        }
                    }
                    // switch back to original geometry types assignment
                    if (options.multi === true) {
                        this.setGeometryTypes();
                    }
                }
                if (options.nativeElements) {
                    for (i=0, len=options.nativeElements.length; i<len; ++i) {
                        this.writeNode("wfs:Native", 
                            options.nativeElements[i], node);
                    }
                }
                return node;
            },
            "Native": function(nativeElement) {
                var node = this.createElementNSPlus("wfs:Native", {
                    attributes: {
                        vendorId: nativeElement.vendorId,
                        safeToIgnore: nativeElement.safeToIgnore
                    },
                    value: nativeElement.value
                });
                return node;
            },
            "Insert": function(obj) {
                var feature = obj.feature;
                var options = obj.options;
                var node = this.createElementNSPlus("wfs:Insert", {
                    attributes: {
                        handle: options && options.handle
                    }
                });
                this.srsName = this.getSrsName(feature);
                this.writeNode("feature:_typeName", feature, node);
                return node;
            },
            "Update": function(obj) {
                var feature = obj.feature;
                var options = obj.options;
                var node = this.createElementNSPlus("wfs:Update", {
                    attributes: {
                        handle: options && options.handle,
                        typeName: (this.featureNS ? this.featurePrefix + ":" : "") +
                            this.featureType
                    }
                });
                if(this.featureNS) {
                    node.setAttribute("xmlns:" + this.featurePrefix, this.featureNS);
                }
                
                // add in geometry
                var modified = feature.modified;
                if (this.geometryName !== null && (!modified || modified.geometry !== undefined)) {
                    this.srsName = this.getSrsName(feature);
                    this.writeNode(
                        "Property", {name: this.geometryName, value: feature.geometry}, node
                    );
                }
        
                // add in attributes
                for(var key in feature.attributes) {
                    if(feature.attributes[key] !== undefined &&
                                (!modified || !modified.attributes ||
                                (modified.attributes && modified.attributes[key] !== undefined))) {
                        this.writeNode(
                            "Property", {name: key, value: feature.attributes[key]}, node
                        );
                    }
                }
                
                // add feature id filter
                this.writeNode("ogc:Filter", new OpenLayers.Filter.FeatureId({
                    fids: [feature.fid]
                }), node);
        
                return node;
            },
            "Property": function(obj) {
                var node = this.createElementNSPlus("wfs:Property");
                this.writeNode("Name", obj.name, node);
                if(obj.value !== null) {
                    this.writeNode("Value", obj.value, node);
                }
                return node;
            },
            "Name": function(name) {
                return this.createElementNSPlus("wfs:Name", {value: name});
            },
            "Value": function(obj) {
                var node;
                if(obj instanceof OpenLayers.Geometry) {
                    node = this.createElementNSPlus("wfs:Value");
                    var geom = this.writeNode("feature:_geometry", obj).firstChild;
                    node.appendChild(geom);
                } else {
                    node = this.createElementNSPlus("wfs:Value", {value: obj});                
                }
                return node;
            },
            "Delete": function(obj) {
                var feature = obj.feature;
                var options = obj.options;
                var node = this.createElementNSPlus("wfs:Delete", {
                    attributes: {
                        handle: options && options.handle,
                        typeName: (this.featureNS ? this.featurePrefix + ":" : "") +
                            this.featureType
                    }
                });
                if(this.featureNS) {
                    node.setAttribute("xmlns:" + this.featurePrefix, this.featureNS);
                }
                this.writeNode("ogc:Filter", new OpenLayers.Filter.FeatureId({
                    fids: [feature.fid]
                }), node);
                return node;
            }
        }
    },

    /**
     * Method: schemaLocationAttr
     * Generate the xsi:schemaLocation attribute value.
     *
     * Returns:
     * {String} The xsi:schemaLocation attribute or undefined if none.
     */
    schemaLocationAttr: function(options) {
        options = OpenLayers.Util.extend({
            featurePrefix: this.featurePrefix,
            schema: this.schema
        }, options);
        var schemaLocations = OpenLayers.Util.extend({}, this.schemaLocations);
        if(options.schema) {
            schemaLocations[options.featurePrefix] = options.schema;
        }
        var parts = [];
        var uri;
        for(var key in schemaLocations) {
            uri = this.namespaces[key];
            if(uri) {
                parts.push(uri + " " + schemaLocations[key]);
            }
        }
        var value = parts.join(" ") || undefined;
        return value;
    },
    
    /**
     * Method: setFilterProperty
     * Set the property of each spatial filter.
     *
     * Parameters:
     * filter - {<OpenLayers.Filter>}
     */
    setFilterProperty: function(filter) {
        if(filter.filters) {
            for(var i=0, len=filter.filters.length; i<len; ++i) {
                this.setFilterProperty(filter.filters[i]);
            }
        } else {
            if(filter instanceof OpenLayers.Filter.Spatial) {
                // got a spatial filter, set its property
                filter.property = this.geometryName;
            }
        }
    },

    CLASS_NAME: "OpenLayers.Format.WFST.v1" 

});
