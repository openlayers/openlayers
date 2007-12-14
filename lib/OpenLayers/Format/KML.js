/* Copyright (c) 2006-2007 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML.js
 * @requires OpenLayers/Feature/Vector.js
 * @requires OpenLayers/Geometry/Point.js
 * @requires OpenLayers/Geometry/LineString.js
 * @requires OpenLayers/Geometry/Polygon.js
 * @requires OpenLayers/Geometry/Collection.js
 *
 * Class: OpenLayers.Format.KML
 * Read/Wite KML. Create a new instance with the <OpenLayers.Format.KML>
 *     constructor. 
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.KML = OpenLayers.Class(OpenLayers.Format.XML, {
    
    /**
     * APIProperty: kmlns
     * {String} KML Namespace to use. Defaults to 2.0 namespace.
     */
    kmlns: "http://earth.google.com/kml/2.0",
    
    /** 
     * APIProperty: placemarksDesc
     * {String} Name of the placemarks.  Default is "No description available."
     */
    placemarksDesc: "No description available",
    
    /** 
     * APIProperty: foldersName
     * {String} Name of the folders.  Default is "OpenLayers export."
     */
    foldersName: "OpenLayers export",
    
    /** 
     * APIProperty: foldersDesc
     * {String} Description of the folders. Default is "Exported on [date]."
     */
    foldersDesc: "Exported on " + new Date(),
    
    /**
     * APIProperty: extractAttributes
     * {Boolean} Extract attributes from KML.  Default is true.
     */
    extractAttributes: true,
    
    /**
     * Property: internalns
     * {String} KML Namespace to use -- defaults to the namespace of the
     *     Placemark node being parsed, but falls back to kmlns. 
     */
    internalns: null,

    /**
     * Constructor: OpenLayers.Format.KML
     * Create a new parser for KML.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        // compile regular expressions once instead of every time they are used
        this.regExes = {
            trimSpace: (/^\s*|\s*$/g),
            removeSpace: (/\s*/g),
            splitSpace: (/\s+/),
            trimComma: (/\s*,\s*/g)
        };
        OpenLayers.Format.XML.prototype.initialize.apply(this, [options]);
    },

    /**
     * APIMethod: read
     * Read data from a string, and return a list of features. 
     * 
     * Parameters: 
     * data - {String} or {DOMElement} data to read/parse.
     *
     * Returns:
     * {Array(<OpenLayers.Feature.Vector>)} List of features.
     */
    read: function(data) {
        if(typeof data == "string") {
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }
        var featureNodes = this.getElementsByTagNameNS(data,
                                                       '*',
                                                       "Placemark");
        var numFeatures = featureNodes.length;
        var features = new Array(numFeatures);
        for(var i=0; i<numFeatures; i++) {
            var feature = this.parseFeature(featureNodes[i]);
            if(feature) {
                features[i] = feature;
            } else {
                throw "Bad Placemark: " + i;
            }
        }
        return features;
    },

    /**
     * Method: parseFeature
     * This function is the core of the KML parsing code in OpenLayers.
     *     It creates the geometries that are then attached to the returned
     *     feature, and calls parseAttributes() to get attribute data out.
     *
     * Parameters:
     * node - {DOMElement}
     *
     * Returns:
     * {<OpenLayers.Feature.Vector>} A vector feature.
     */
    parseFeature: function(node) {
        // only accept one geometry per feature - look for highest "order"
        var order = ["MultiGeometry", "Polygon", "LineString", "Point"];
        var type, nodeList, geometry, parser;
        for(var i=0; i<order.length; ++i) {
            type = order[i];
            this.internalns = node.namespaceURI ? 
                    node.namespaceURI : this.kmlns;
            nodeList = this.getElementsByTagNameNS(node, 
                                                   this.internalns, type);
            if(nodeList.length > 0) {
                // only deal with first geometry of this type
                var parser = this.parseGeometry[type.toLowerCase()];
                if(parser) {
                    geometry = parser.apply(this, [nodeList[0]]);
                } else {
                    OpenLayers.Console.error("Unsupported geometry type: " +
                                             type);
                }
                // stop looking for different geometry types
                break;
            }
        }

        // construct feature (optionally with attributes)
        var attributes;
        if(this.extractAttributes) {
            attributes = this.parseAttributes(node);
        }
        var feature = new OpenLayers.Feature.Vector(geometry, attributes);

        var fid = node.getAttribute("id");
        if(fid != null) {
            feature.fid = fid;
        }

        return feature;
    },        
    
    /**
     * Property: parseGeometry
     * Properties of this object are the functions that parse geometries based
     *     on their type.
     */
    parseGeometry: {
        
        /**
         * Method: parseGeometry.point
         * Given a KML node representing a point geometry, create an OpenLayers
         *     point geometry.
         *
         * Parameters:
         * node - {DOMElement} A KML Point node.
         *
         * Returns:
         * {<OpenLayers.Geometry.Point>} A point geometry.
         */
        point: function(node) {
            var nodeList = this.getElementsByTagNameNS(node, this.internalns,
                                                       "coordinates");
            var coords = [];
            if(nodeList.length > 0) {
                var coordString = nodeList[0].firstChild.nodeValue;
                coordString = coordString.replace(this.regExes.removeSpace, "");
                coords = coordString.split(",");
            }

            var point = null;
            if(coords.length > 1) {
                // preserve third dimension
                if(coords.length == 2) {
                    coords[2] = null;
                }
                point = new OpenLayers.Geometry.Point(coords[0], coords[1],
                                                      coords[2]);
            } else {
                throw "Bad coordinate string: " + coordString;
            }
            return point;
        },
        
        /**
         * Method: parseGeometry.linestring
         * Given a KML node representing a linestring geometry, create an
         *     OpenLayers linestring geometry.
         *
         * Parameters:
         * node - {DOMElement} A KML LineString node.
         *
         * Returns:
         * {<OpenLayers.Geometry.LineString>} A linestring geometry.
         */
        linestring: function(node, ring) {
            var nodeList = this.getElementsByTagNameNS(node, this.internalns,
                                                       "coordinates");
            var line = null;
            if(nodeList.length > 0) {
                var coordString = this.concatChildValues(nodeList[0]);

                coordString = coordString.replace(this.regExes.trimSpace,
                                                  "");
                coordString = coordString.replace(this.regExes.trimComma,
                                                  ",");
                var pointList = coordString.split(this.regExes.splitSpace);
                var numPoints = pointList.length;
                var points = new Array(numPoints);
                var coords, numCoords;
                for(var i=0; i<numPoints; ++i) {
                    coords = pointList[i].split(",");
                    numCoords = coords.length;
                    if(numCoords > 1) {
                        if(coords.length == 2) {
                            coords[2] = null;
                        }
                        points[i] = new OpenLayers.Geometry.Point(coords[0],
                                                                  coords[1],
                                                                  coords[2]);
                    } else {
                        throw "Bad LineString point coordinates: " +
                              pointList[i];
                    }
                }
                if(numPoints) {
                    if(ring) {
                        line = new OpenLayers.Geometry.LinearRing(points);
                    } else {
                        line = new OpenLayers.Geometry.LineString(points);
                    }
                } else {
                    throw "Bad LineString coordinates: " + coordString;
                }
            }

            return line;
        },
        
        /**
         * Method: parseGeometry.polygon
         * Given a KML node representing a polygon geometry, create an
         *     OpenLayers polygon geometry.
         *
         * Parameters:
         * node - {DOMElement} A KML Polygon node.
         *
         * Returns:
         * {<OpenLayers.Geometry.Polygon>} A polygon geometry.
         */
        polygon: function(node) {
            var nodeList = this.getElementsByTagNameNS(node, this.internalns,
                                                       "LinearRing");
            var numRings = nodeList.length;
            var components = new Array(numRings);
            if(numRings > 0) {
                // this assumes exterior ring first, inner rings after
                var ring;
                for(var i=0; i<nodeList.length; ++i) {
                    ring = this.parseGeometry.linestring.apply(this,
                                                        [nodeList[i], true]);
                    if(ring) {
                        components[i] = ring;
                    } else {
                        throw "Bad LinearRing geometry: " + i;
                    }
                }
            }
            return new OpenLayers.Geometry.Polygon(components);
        },
        
        /**
         * Method: parseGeometry.multigeometry
         * Given a KML node representing a multigeometry, create an
         *     OpenLayers geometry collection.
         *
         * Parameters:
         * node - {DOMElement} A KML MultiGeometry node.
         *
         * Returns:
         * {<OpenLayers.Geometry.Collection>} A geometry collection.
         */
        multigeometry: function(node) {
            var child, parser;
            var parts = [];
            var children = node.childNodes;
            for(var i=0; i<children.length; ++i ) {
                child = children[i];
                if(child.nodeType == 1) {
                    var type = (child.prefix) ?
                            child.nodeName.split(":")[1] :
                            child.nodeName;
                    var parser = this.parseGeometry[type.toLowerCase()];
                    if(parser) {
                        parts.push(parser.apply(this, [child]));
                    }
                }
            }
            return new OpenLayers.Geometry.Collection(parts);
        }
        
    },

    /**
     * Method: parseAttributes
     *
     * Parameters:
     * node - {DOMElement}
     *
     * Returns:
     * {Object} An attributes object.
     */
    parseAttributes: function(node) {
        var attributes = {};
        // assume attribute nodes are type 1 children with a type 3 child
        var child, grandchildren, grandchild;
        var children = node.childNodes;
        for(var i=0; i<children.length; ++i) {
            child = children[i];
            if(child.nodeType == 1) {
                grandchildren = child.childNodes;
                if(grandchildren.length == 1) {
                    grandchild = grandchildren[0];
                    if(grandchild.nodeType == 3 || grandchild.nodeType == 4) {
                        var name = (child.prefix) ?
                                child.nodeName.split(":")[1] :
                                child.nodeName;
                        var value = grandchild.nodeValue.replace(
                                                this.regExes.trimSpace, "");
                        attributes[name] = value;
                    }
                }
            }
        }
        return attributes;
    },

    /**
     * APIMethod: write
     * Accept Feature Collection, and return a string. 
     * 
     * Parameters:
     * features - {Array(<OpenLayers.Feature.Vector>} An array of features.
     *
     * Returns:
     * {String} A KML string.
     */
    write: function(features) {
        if(!(features instanceof Array)) {
            features = [features];
        }
        var kml = this.createElementNS(this.kmlns, "kml");
        var folder = this.createFolderXML();
        for(var i=0; i<features.length; ++i) {
            folder.appendChild(this.createPlacemarkXML(features[i]));
        }
        kml.appendChild(folder);
        return OpenLayers.Format.XML.prototype.write.apply(this, [kml]);
    },

    /**
     * Method: createFolderXML
     * Creates and returns a KML folder node
     * 
     * Returns:
     * {DOMElement}
     */
    createFolderXML: function() {
        // Folder name
        var folderName = this.createElementNS(this.kmlns, "name");
        var folderNameText = this.createTextNode(this.foldersName); 
        folderName.appendChild(folderNameText);

        // Folder description
        var folderDesc = this.createElementNS(this.kmlns, "description");        
        var folderDescText = this.createTextNode(this.foldersDesc); 
        folderDesc.appendChild(folderDescText);

        // Folder
        var folder = this.createElementNS(this.kmlns, "Folder");
        folder.appendChild(folderName);
        folder.appendChild(folderDesc);
        
        return folder;
    },

    /**
     * Method: createPlacemarkXML
     * Creates and returns a KML placemark node representing the given feature. 
     * 
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     * 
     * Returns:
     * {DOMElement}
     */
    createPlacemarkXML: function(feature) {        
        // Placemark name
        var placemarkName = this.createElementNS(this.kmlns, "name");
        var name = (feature.attributes.name) ?
                    feature.attributes.name : feature.id;
        placemarkName.appendChild(this.createTextNode(name));

        // Placemark description
        var placemarkDesc = this.createElementNS(this.kmlns, "description");
        var desc = (feature.attributes.description) ?
                    feature.attributes.description : this.placemarksDesc;
        placemarkDesc.appendChild(this.createTextNode(desc));
        
        // Placemark
        var placemarkNode = this.createElementNS(this.kmlns, "Placemark");
        if(feature.fid != null) {
            placemarkNode.setAttribute("id", feature.fid);
        }
        placemarkNode.appendChild(placemarkName);
        placemarkNode.appendChild(placemarkDesc);

        // Geometry node (Point, LineString, etc. nodes)
        var geometryNode = this.buildGeometryNode(feature.geometry);
        placemarkNode.appendChild(geometryNode);        
        
        // TBD - deal with remaining (non name/description) attributes.
        return placemarkNode;
    },    

    /**
     * Method: buildGeometryNode
     * Builds and returns a KML geometry node with the given geometry.
     * 
     * Parameters:
     * geometry - {<OpenLayers.Geometry>}
     * 
     * Returns:
     * {DOMElement}
     */
    buildGeometryNode: function(geometry) {
        var className = geometry.CLASS_NAME;
        var type = className.substring(className.lastIndexOf(".") + 1);
        var builder = this.buildGeometry[type.toLowerCase()];
        var node = null;
        if(builder) {
            node = builder.apply(this, [geometry]);
        }
        return node;
    },

    /**
     * Property: buildGeometry
     * Object containing methods to do the actual geometry node building
     *     based on geometry type.
     */
    buildGeometry: {
        // TBD: Anybody care about namespace aliases here (these nodes have
        //    no prefixes)?

        /**
         * Method: buildGeometry.point
         * Given an OpenLayers point geometry, create a KML point.
         *
         * Parameters:
         * geometry - {<OpenLayers.Geometry.Point>} A point geometry.
         *
         * Returns:
         * {DOMElement} A KML point node.
         */
        point: function(geometry) {
            var kml = this.createElementNS(this.kmlns, "Point");
            kml.appendChild(this.buildCoordinatesNode(geometry));
            return kml;
        },
        
        /**
         * Method: buildGeometry.multipoint
         * Given an OpenLayers multipoint geometry, create a KML
         *     GeometryCollection.
         *
         * Parameters:
         * geometry - {<OpenLayers.Geometry.Point>} A multipoint geometry.
         *
         * Returns:
         * {DOMElement} A KML GeometryCollection node.
         */
        multipoint: function(geometry) {
            return this.buildGeometry.collection.apply(this, [geometry]);
        },

        /**
         * Method: buildGeometry.linestring
         * Given an OpenLayers linestring geometry, create a KML linestring.
         *
         * Parameters:
         * geometry - {<OpenLayers.Geometry.LineString>} A linestring geometry.
         *
         * Returns:
         * {DOMElement} A KML linestring node.
         */
        linestring: function(geometry) {
            var kml = this.createElementNS(this.kmlns, "LineString");
            kml.appendChild(this.buildCoordinatesNode(geometry));
            return kml;
        },
        
        /**
         * Method: buildGeometry.multilinestring
         * Given an OpenLayers multilinestring geometry, create a KML
         *     GeometryCollection.
         *
         * Parameters:
         * geometry - {<OpenLayers.Geometry.Point>} A multilinestring geometry.
         *
         * Returns:
         * {DOMElement} A KML GeometryCollection node.
         */
        multilinestring: function(geometry) {
            return this.buildGeometry.collection.apply(this, [geometry]);
        },

        /**
         * Method: buildGeometry.linearring
         * Given an OpenLayers linearring geometry, create a KML linearring.
         *
         * Parameters:
         * geometry - {<OpenLayers.Geometry.LinearRing>} A linearring geometry.
         *
         * Returns:
         * {DOMElement} A KML linearring node.
         */
        linearring: function(geometry) {
            var kml = this.createElementNS(this.kmlns, "LinearRing");
            kml.appendChild(this.buildCoordinatesNode(geometry));
            return kml;
        },
        
        /**
         * Method: buildGeometry.polygon
         * Given an OpenLayers polygon geometry, create a KML polygon.
         *
         * Parameters:
         * geometry - {<OpenLayers.Geometry.Polygon>} A polygon geometry.
         *
         * Returns:
         * {DOMElement} A KML polygon node.
         */
        polygon: function(geometry) {
            var kml = this.createElementNS(this.kmlns, "Polygon");
            var rings = geometry.components;
            var ringMember, ringGeom, type;
            for(var i=0; i<rings.length; ++i) {
                type = (i==0) ? "outerBoundaryIs" : "innerBoundaryIs";
                ringMember = this.createElementNS(this.kmlns, type);
                ringGeom = this.buildGeometry.linearring.apply(this,
                                                               [rings[i]]);
                ringMember.appendChild(ringGeom);
                kml.appendChild(ringMember);
            }
            return kml;
        },
        
        /**
         * Method: buildGeometry.multipolygon
         * Given an OpenLayers multipolygon geometry, create a KML
         *     GeometryCollection.
         *
         * Parameters:
         * geometry - {<OpenLayers.Geometry.Point>} A multipolygon geometry.
         *
         * Returns:
         * {DOMElement} A KML GeometryCollection node.
         */
        multipolygon: function(geometry) {
            return this.buildGeometry.collection.apply(this, [geometry]);
        },

        /**
         * Method: buildGeometry.collection
         * Given an OpenLayers geometry collection, create a KML MultiGeometry.
         *
         * Parameters:
         * geometry - {<OpenLayers.Geometry.Collection>} A geometry collection.
         *
         * Returns:
         * {DOMElement} A KML MultiGeometry node.
         */
        collection: function(geometry) {
            var kml = this.createElementNS(this.kmlns, "MultiGeometry");
            var child;
            for(var i=0; i<geometry.components.length; ++i) {
                child = this.buildGeometryNode.apply(this,
                                                     [geometry.components[i]]);
                if(child) {
                    kml.appendChild(child);
                }
            }
            return kml;
        }
    },

    /**
     * Method: buildCoordinatesNode
     * Builds and returns the KML coordinates node with the given geometry
     * <coordinates>...</coordinates>
     * 
     * Parameters:
     * geometry - {<OpenLayers.Geometry>}
     * 
     * Return:
     * {DOMElement}
     */     
    buildCoordinatesNode: function(geometry) {
        var coordinatesNode = this.createElementNS(this.kmlns, "coordinates");
        
        var path;
        var points = geometry.components;
        if(points) {
            // LineString or LinearRing
            var point;
            var numPoints = points.length;
            var parts = new Array(numPoints);
            for(var i=0; i<numPoints; ++i) {
                point = points[i];
                parts[i] = point.x + "," + point.y;
            }
            path = parts.join(" ");
        } else {
            // Point
            path = geometry.x + "," + geometry.y;
        }
        
        var txtNode = this.createTextNode(path);
        coordinatesNode.appendChild(txtNode);
        
        return coordinatesNode;
    },    

    CLASS_NAME: "OpenLayers.Format.KML" 
});
