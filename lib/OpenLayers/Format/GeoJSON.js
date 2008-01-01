/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/JSON.js
 * @requires OpenLayers/Feature/Vector.js
 * @requires OpenLayers/Geometry/Point.js
 * @requires OpenLayers/Geometry/MultiPoint.js
 * @requires OpenLayers/Geometry/LineString.js
 * @requires OpenLayers/Geometry/MultiLineString.js
 * @requires OpenLayers/Geometry/Polygon.js
 * @requires OpenLayers/Geometry/MultiPolygon.js
 */

/**
 * Class: OpenLayers.Format.GeoJSON
 * Read and write GeoJSON. Create a new parser with the
 *     <OpenLayers.Format.GeoJSON> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Format.JSON>
 */
OpenLayers.Format.GeoJSON = OpenLayers.Class(OpenLayers.Format.JSON, {

    /**
     * Constructor: OpenLayers.Format.GeoJSON
     * Create a new parser for GeoJSON.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.JSON.prototype.initialize.apply(this, [options]);
    },

    /**
     * APIMethod: read
     * Deserialize a GeoJSON string.
     *
     * Parameters:
     * json - {String} A GeoJSON string
     * type - {String} Optional string that determines the structure of
     *     the output.  Supported values are "Geometry", "Feature", and
     *     "FeatureCollection".  If absent or null, a default of
     *     "FeatureCollection" is assumed.
     * filter - {Function} A function which will be called for every key and
     *     value at every level of the final result. Each value will be
     *     replaced by the result of the filter function. This can be used to
     *     reform generic objects into instances of classes, or to transform
     *     date strings into Date objects.
     *
     * Returns: 
     * {Object} The return depends on the value of the type argument. If type
     *     is "FeatureCollection" (the default), the return will be an array
     *     of <OpenLayers.Feature.Vector>. If type is "Geometry", the input json
     *     must represent a single geometry, and the return will be an
     *     <OpenLayers.Geometry>.  If type is "Feature", the input json must
     *     represent a single feature, and the return will be an
     *     <OpenLayers.Feature.Vector>.
     */
    read: function(json, type, filter) {
        type = (type) ? type : "FeatureCollection";
        var results = null;
        var obj = null;
        if (typeof json == "string") {
            obj = OpenLayers.Format.JSON.prototype.read.apply(this,
                                                              [json, filter]);
        } else { 
            obj = json;
        }    
        if(!obj) {
            OpenLayers.Console.error("Bad JSON: " + json);
        } else if(typeof(obj.type) != "string") {
            OpenLayers.Console.error("Bad GeoJSON - no type: " + json);
        } else if(this.isValidType(obj, type)) {
            switch(type) {
                case "Geometry":
                    try {
                        results = this.parseGeometry(obj);
                    } catch(err) {
                        OpenLayers.Console.error(err);
                    }
                    break;
                case "Feature":
                    try {
                        results = this.parseFeature(obj);
                        results.type = "Feature";
                    } catch(err) {
                        OpenLayers.Console.error(err);
                    }
                    break;
                case "FeatureCollection":
                    // for type FeatureCollection, we allow input to be any type
                    results = [];
                    switch(obj.type) {
                        case "Feature":
                            try {
                                results.push(this.parseFeature(obj));
                            } catch(err) {
                                results = null;
                                OpenLayers.Console.error(err);
                            }
                            break;
                        case "FeatureCollection":
                            for(var i=0; i<obj.features.length; ++i) {
                                try {
                                    results.push(this.parseFeature(obj.features[i]));
                                } catch(err) {
                                    results = null;
                                    OpenLayers.Console.error(err);
                                }
                            }
                            break;
                        default:
                            try {
                                var geom = this.parseGeometry(obj);
                                results.push(new OpenLayers.Feature.Vector(geom));
                            } catch(err) {
                                results = null;
                                OpenLayers.Console.error(err);
                            }
                    }
                break;
            }
        }
        return results;
    },
    
    /**
     * Method: isValidType
     * Check if a GeoJSON object is a valid representative of the given type.
     *
     * Returns:
     * {Boolean} The object is valid GeoJSON object of the given type.
     */
    isValidType: function(obj, type) {
        var valid = false;
        switch(type) {
            case "Geometry":
                if(OpenLayers.Util.indexOf(
                    ["Point", "MultiPoint", "LineString", "MultiLineString",
                     "Polygon", "MultiPolygon", "Box", "GeometryCollection"],
                    obj.type) == -1) {
                    // unsupported geometry type
                    OpenLayers.Console.error("Unsupported geometry type: " +
                                              obj.type);
                } else {
                    valid = true;
                }
                break;
            case "FeatureCollection":
                // allow for any type to be converted to a feature collection
                valid = true;
                break;
            default:
                // for Feature types must match
                if(obj.type == type) {
                    valid = true;
                } else {
                    OpenLayers.Console.error("Cannot convert types from " +
                                              obj.type + " to " + type);
                }
        }
        return valid;
    },
    
    /**
     * Method: parseFeature
     * Convert a feature object from GeoJSON into an
     *     <OpenLayers.Feature.Vector>.
     *
     * Parameters:
     * obj - {Object} An object created from a GeoJSON object
     *
     * Returns:
     * {<OpenLayers.Feature.Vector>} A feature.
     */
    parseFeature: function(obj) {
        var feature, geometry, attributes;
        attributes = (obj.properties) ? obj.properties : {};
        try {
            geometry = this.parseGeometry(obj.geometry);            
        } catch(err) {
            // deal with bad geometries
            throw err;
        }
        feature = new OpenLayers.Feature.Vector(geometry, attributes);
        if(obj.id) {
            feature.fid = obj.id;
        }
        return feature;
    },
    
    /**
     * Method: parseGeometry
     * Convert a geometry object from GeoJSON into an <OpenLayers.Geometry>.
     *
     * Parameters:
     * obj - {Object} An object created from a GeoJSON object
     *
     * Returns: 
     * {<OpenLayers.Geometry>} A geometry.
     */
    parseGeometry: function(obj) {
        var geometry;
        if(obj.type == "GeometryCollection") {
            if(!(obj.geometries instanceof Array)) {
                throw "GeometryCollection must have geometries array: " + obj;
            }
            var numGeom = obj.geometries.length;
            var components = new Array(numGeom);
            for(var i=0; i<numGeom; ++i) {
                components[i] = this.parseGeometry.apply(
                    this, [obj.geometries[i]]
                );
            }
            geometry = new OpenLayers.Geometry.Collection(components);
        } else {
            if(!(obj.coordinates instanceof Array)) {
                throw "Geometry must have coordinates array: " + obj;
            }
            if(!this.parseCoords[obj.type.toLowerCase()]) {
                throw "Unsupported geometry type: " + obj.type;
            }
            try {
                geometry = this.parseCoords[obj.type.toLowerCase()].apply(
                    this, [obj.coordinates]
                );
            } catch(err) {
                // deal with bad coordinates
                throw err;
            }
        }
        if (this.internalProjection && this.externalProjection) {
            geometry.transform(this.externalProjection, 
                               this.internalProjection); 
        }                       
        return geometry;
    },
    
    /**
     * Property: parseCoords
     * Object with properties corresponding to the GeoJSON geometry types.
     *     Property values are functions that do the actual parsing.
     */
    parseCoords: {
        /**
         * Method: parseCoords.point
         * Convert a coordinate array from GeoJSON into an
         *     <OpenLayers.Geometry>.
         *
         * Parameters:
         * array - {Object} The coordinates array from the GeoJSON fragment.
         *
         * Returns:
         * {<OpenLayers.Geometry>} A geometry.
         */
        "point": function(array) {
            if(array.length != 2) {
                throw "Only 2D points are supported: " + array;
            }
            return new OpenLayers.Geometry.Point(array[0], array[1]);
        },
        
        /**
         * Method: parseCoords.multipoint
         * Convert a coordinate array from GeoJSON into an
         *     <OpenLayers.Geometry>.
         *
         * Parameters:
         * array {Object} The coordinates array from the GeoJSON fragment.
         *
         * Returns:
         * {<OpenLayers.Geometry>} A geometry.
         */
        "multipoint": function(array) {
            var points = [];
            var p = null;
            for(var i=0; i<array.length; ++i) {
                try {
                    p = this.parseCoords["point"].apply(this, [array[i]]);
                } catch(err) {
                    throw err;
                }
                points.push(p);
            }
            return new OpenLayers.Geometry.MultiPoint(points);
        },

        /**
         * Method: parseCoords.linestring
         * Convert a coordinate array from GeoJSON into an
         *     <OpenLayers.Geometry>.
         *
         * Parameters:
         * array - {Object} The coordinates array from the GeoJSON fragment.
         *
         * Returns:
         * {<OpenLayers.Geometry>} A geometry.
         */
        "linestring": function(array) {
            var points = [];
            var p = null;
            for(var i=0; i<array.length; ++i) {
                try {
                    p = this.parseCoords["point"].apply(this, [array[i]]);
                } catch(err) {
                    throw err;
                }
                points.push(p);
            }
            return new OpenLayers.Geometry.LineString(points);
        },
        
        /**
         * Method: parseCoords.multilinestring
         * Convert a coordinate array from GeoJSON into an
         *     <OpenLayers.Geometry>.
         *
         * Parameters:
         * array - {Object} The coordinates array from the GeoJSON fragment.
         *
         * Returns:
         * {<OpenLayers.Geometry>} A geometry.
         */
        "multilinestring": function(array) {
            var lines = [];
            var l = null;
            for(var i=0; i<array.length; ++i) {
                try {
                    l = this.parseCoords["linestring"].apply(this, [array[i]]);
                } catch(err) {
                    throw err;
                }
                lines.push(l);
            }
            return new OpenLayers.Geometry.MultiLineString(lines);
        },
        
        /**
         * Method: parseCoords.polygon
         * Convert a coordinate array from GeoJSON into an
         *     <OpenLayers.Geometry>.
         *
         * Returns:
         * {<OpenLayers.Geometry>} A geometry.
         */
        "polygon": function(array) {
            var rings = [];
            var r, l;
            for(var i=0; i<array.length; ++i) {
                try {
                    l = this.parseCoords["linestring"].apply(this, [array[i]]);
                } catch(err) {
                    throw err;
                }
                r = new OpenLayers.Geometry.LinearRing(l.components);
                rings.push(r);
            }
            return new OpenLayers.Geometry.Polygon(rings);
        },

        /**
         * Method: parseCoords.multipolygon
         * Convert a coordinate array from GeoJSON into an
         *     <OpenLayers.Geometry>.
         *
         * Parameters:
         * array - {Object} The coordinates array from the GeoJSON fragment.
         *
         * Returns:
         * {<OpenLayers.Geometry>} A geometry.
         */
        "multipolygon": function(array) {
            var polys = [];
            var p = null;
            for(var i=0; i<array.length; ++i) {
                try {
                    p = this.parseCoords["polygon"].apply(this, [array[i]]);
                } catch(err) {
                    throw err;
                }
                polys.push(p);
            }
            return new OpenLayers.Geometry.MultiPolygon(polys);
        },

        /**
         * Method: parseCoords.box
         * Convert a coordinate array from GeoJSON into an
         *     <OpenLayers.Geometry>.
         *
         * Parameters:
         * array - {Object} The coordinates array from the GeoJSON fragment.
         *
         * Returns:
         * {<OpenLayers.Geometry>} A geometry.
         */
        "box": function(array) {
            if(array.length != 2) {
                throw "GeoJSON box coordinates must have 2 elements";
            }
            return new OpenLayers.Geometry.Polygon([
                new OpenLayers.Geometry.LinearRing([
                    new OpenLayers.Geometry.Point(array[0][0], array[0][1]),
                    new OpenLayers.Geometry.Point(array[1][0], array[0][1]),
                    new OpenLayers.Geometry.Point(array[1][0], array[1][1]),
                    new OpenLayers.Geometry.Point(array[0][0], array[1][1]),
                    new OpenLayers.Geometry.Point(array[0][0], array[0][1])
                ])
            ]);
        }

    },

    /**
     * APIMethod: write
     * Serialize a feature, geometry, array of features into a GeoJSON string.
     *
     * Parameters:
     * obj - {Object} An <OpenLayers.Feature.Vector>, <OpenLayers.Geometry>,
     *     or an array of features.
     * pretty - {Boolean} Structure the output with newlines and indentation.
     *     Default is false.
     *
     * Returns:
     * {String} The GeoJSON string representation of the input geometry,
     *     features, or array of features.
     */
    write: function(obj, pretty) {
        var geojson = {
            "type": null
        };
        if(obj instanceof Array) {
            geojson.type = "FeatureCollection";
            var numFeatures = obj.length;
            geojson.features = new Array(numFeatures);
            for(var i=0; i<numFeatures; ++i) {
                var element = obj[i];
                if(!element instanceof OpenLayers.Feature.Vector) {
                    var msg = "FeatureCollection only supports collections " +
                              "of features: " + element;
                    throw msg;
                }
                geojson.features[i] = this.extract.feature.apply(
                    this, [element]
                );
            }
        } else if (obj.CLASS_NAME.indexOf("OpenLayers.Geometry") == 0) {
            geojson = this.extract.geometry.apply(this, [obj]);
        } else if (obj instanceof OpenLayers.Feature.Vector) {
            geojson = this.extract.feature.apply(this, [obj]);
            if(obj.layer && obj.layer.projection) {
                geojson.crs = this.createCRSObject(obj);
            }
        }
        return OpenLayers.Format.JSON.prototype.write.apply(this,
                                                            [geojson, pretty]);
    },

    /**
     * Method: createCRSObject
     * Create the CRS object for an object.
     *
     * Parameters:
     * object - {<OpenLayers.Feature.Vector>} 
     *
     * Returns:
     * {Object} An object which can be assigned to the crs property
     * of a GeoJSON object.
     */
    createCRSObject: function(object) {
       var proj = object.layer.projection.toString();
       var crs = {};
       if (proj.match(/epsg:/i)) {
           var code = parseInt(proj.substring(proj.indexOf(":") + 1));
           if (code == 4326) {
               crs = {
                   "type": "OGC",
                   "properties": {
                       "urn": "urn:ogc:def:crs:OGC:1.3:CRS84"
                   }
               };
           } else {    
               crs = {
                   "type": "EPSG",
                   "properties": {
                       "code": code 
                   }
               };
           }    
       }
       return crs;
    },
    
    /**
     * Property: extract
     * Object with properties corresponding to the GeoJSON types.
     *     Property values are functions that do the actual value extraction.
     */
    extract: {
        /**
         * Method: extract.feature
         * Return a partial GeoJSON object representing a single feature.
         *
         * Parameters:
         * feature - {<OpenLayers.Feature.Vector>}
         *
         * Returns:
         * {Object} An object representing the point.
         */
        'feature': function(feature) {
            var geom = this.extract.geometry.apply(this, [feature.geometry]);
            return {
                "type": "Feature",
                "id": feature.fid == null ? feature.id : feature.fid,
                "properties": feature.attributes,
                "geometry": geom
            };
        },
        
        /**
         * Method: extract.geometry
         * Return a GeoJSON object representing a single geometry.
         *
         * Parameters:
         * geometry - {<OpenLayers.Geometry>}
         *
         * Returns:
         * {Object} An object representing the geometry.
         */
        'geometry': function(geometry) {
            if (this.internalProjection && this.externalProjection) {
                geometry = geometry.clone();
                geometry.transform(this.internalProjection, 
                                   this.externalProjection);
            }                       
            var geometryType = geometry.CLASS_NAME.split('.')[2];
            var data = this.extract[geometryType.toLowerCase()].apply(this, [geometry]);
            var json;
            if(geometryType == "Collection") {
                json = {
                    "type": "GeometryCollection",
                    "geometries": data
                };
            } else {
                json = {
                    "type": geometryType,
                    "coordinates": data
                };
            }
            
            return json;
        },

        /**
         * Method: extract.point
         * Return an array of coordinates from a point.
         *
         * Parameters:
         * point - {<OpenLayers.Geometry.Point>}
         *
         * Returns: 
         * {Array} An array of coordinates representing the point.
         */
        'point': function(point) {
            return [point.x, point.y];
        },

        /**
         * Method: extract.multipoint
         * Return an array of point coordinates from a multipoint.
         *
         * Parameters:
         * multipoint - {<OpenLayers.Geometry.MultiPoint>}
         *
         * Returns:
         * {Array} An array of point coordinate arrays representing
         *     the multipoint.
         */
        'multipoint': function(multipoint) {
            var array = [];
            for(var i=0; i<multipoint.components.length; ++i) {
                array.push(this.extract.point.apply(this, [multipoint.components[i]]));
            }
            return array;
        },
        
        /**
         * Method: extract.linestring
         * Return an array of coordinate arrays from a linestring.
         *
         * Parameters:
         * linestring - {<OpenLayers.Geometry.LineString>}
         *
         * Returns:
         * {Array} An array of coordinate arrays representing
         *     the linestring.
         */
        'linestring': function(linestring) {
            var array = [];
            for(var i=0; i<linestring.components.length; ++i) {
                array.push(this.extract.point.apply(this, [linestring.components[i]]));
            }
            return array;
        },

        /**
         * Method: extract.multilinestring
         * Return an array of linestring arrays from a linestring.
         * 
         * Parameters:
         * linestring - {<OpenLayers.Geometry.MultiLineString>}
         * 
         * Returns:
         * {Array} An array of linestring arrays representing
         *     the multilinestring.
         */
        'multilinestring': function(multilinestring) {
            var array = [];
            for(var i=0; i<multilinestring.components.length; ++i) {
                array.push(this.extract.linestring.apply(this, [multilinestring.components[i]]));
            }
            return array;
        },
        
        /**
         * Method: extract.polygon
         * Return an array of linear ring arrays from a polygon.
         *
         * Parameters:
         * polygon - {<OpenLayers.Geometry.Polygon>}
         * 
         * Returns:
         * {Array} An array of linear ring arrays representing the polygon.
         */
        'polygon': function(polygon) {
            var array = [];
            for(var i=0; i<polygon.components.length; ++i) {
                array.push(this.extract.linestring.apply(this, [polygon.components[i]]));
            }
            return array;
        },

        /**
         * Method: extract.multipolygon
         * Return an array of polygon arrays from a multipolygon.
         * 
         * Parameters:
         * multipolygon - {<OpenLayers.Geometry.MultiPolygon>}
         * 
         * Returns:
         * {Array} An array of polygon arrays representing
         *     the multipolygon
         */
        'multipolygon': function(multipolygon) {
            var array = [];
            for(var i=0; i<multipolygon.components.length; ++i) {
                array.push(this.extract.polygon.apply(this, [multipolygon.components[i]]));
            }
            return array;
        },
        
        /**
         * Method: extract.collection
         * Return an array of geometries from a geometry collection.
         * 
         * Parameters:
         * collection - {<OpenLayers.Geometry.Collection>}
         * 
         * Returns:
         * {Array} An array of geometry objects representing the geometry
         *     collection.
         */
        'collection': function(collection) {
            var len = collection.components.length;
            var array = new Array(len);
            for(var i=0; i<len; ++i) {
                array[i] = this.extract.geometry.apply(
                    this, [collection.components[i]]
                );
            }
            return array;
        }
        

    },

    CLASS_NAME: "OpenLayers.Format.GeoJSON" 

});     
