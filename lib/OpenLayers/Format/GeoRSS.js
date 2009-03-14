/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML.js
 * @requires OpenLayers/Feature/Vector.js
 * @requires OpenLayers/Geometry/Point.js
 * @requires OpenLayers/Geometry/LineString.js
 * @requires OpenLayers/Geometry/Polygon.js
 */

/**
 * Class: OpenLayers.Format.GeoRSS
 * Read/write GeoRSS parser. Create a new instance with the 
 *     <OpenLayers.Format.GeoRSS> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.GeoRSS = OpenLayers.Class(OpenLayers.Format.XML, {
    
    /**
     * APIProperty: rssns
     * {String} RSS namespace to use. Defaults to
     *   "http://backend.userland.com/rss2"
     */
    rssns: "http://backend.userland.com/rss2",
    
    /**
     * APIProperty: featurens
     * {String} Feature Attributes namespace.  Defaults to
     *    "http://mapserver.gis.umn.edu/mapserver"
     */
    featureNS: "http://mapserver.gis.umn.edu/mapserver",
    
    /**
     * APIProperty: georssns
     * {String} GeoRSS namespace to use.  Defaults to
     *     "http://www.georss.org/georss"
     */
    georssns: "http://www.georss.org/georss",

    /**
     * APIProperty: geons
     * {String} W3C Geo namespace to use.  Defaults to
     *     "http://www.w3.org/2003/01/geo/wgs84_pos#"
     */
    geons: "http://www.w3.org/2003/01/geo/wgs84_pos#",
    
    /**
     * APIProperty: featureTitle
     * {String} Default title for features.  Defaults to "Untitled"
     */
    featureTitle: "Untitled",
    
    /**
     * APIProperty: featureDescription
     * {String} Default description for features.  Defaults to "No Description"
     */
    featureDescription: "No Description",
    
    /**
     * Property: gmlParse
     * {Object} GML Format object for parsing features
     * Non-API and only created if necessary
     */
    gmlParser: null,

    /**
     * APIProperty: xy
     * {Boolean} Order of the GML coordinate: true:(x,y) or false:(y,x)
     * For GeoRSS the default is (y,x), therefore: false
     */ 
    xy: false,
    
    /**
     * Constructor: OpenLayers.Format.GeoRSS
     * Create a new parser for GeoRSS.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.XML.prototype.initialize.apply(this, [options]);
    },
    
    /**
     * Method: createGeometryFromItem
     * Return a geometry from a GeoRSS Item.
     *
     * Parameters:
     * item - {DOMElement} A GeoRSS item node.
     *
     * Returns:
     * {<OpenLayers.Geometry>} A geometry representing the node.
     */
    createGeometryFromItem: function(item) {
        var point = this.getElementsByTagNameNS(item, this.georssns, "point");
        var lat = this.getElementsByTagNameNS(item, this.geons, 'lat');
        var lon = this.getElementsByTagNameNS(item, this.geons, 'long');
        
        var line = this.getElementsByTagNameNS(item,
                                                this.georssns,
                                                "line");
        var polygon = this.getElementsByTagNameNS(item,
                                                this.georssns,
                                                "polygon");
        var where = this.getElementsByTagNameNS(item, 
                                                this.georssns, 
                                                "where");
        var box = this.getElementsByTagNameNS(item, 
                                              this.georssns, 
                                              "box");
												
        if (point.length > 0 || (lat.length > 0 && lon.length > 0)) {
            var location;
            if (point.length > 0) {
                location = OpenLayers.String.trim(
                                point[0].firstChild.nodeValue).split(/\s+/);
                if (location.length !=2) {
                    location = OpenLayers.String.trim(
                                point[0].firstChild.nodeValue).split(/\s*,\s*/);
                }
            } else {
                location = [parseFloat(lat[0].firstChild.nodeValue),
                                parseFloat(lon[0].firstChild.nodeValue)];
            }    

            var geometry = new OpenLayers.Geometry.Point(parseFloat(location[1]),
                                                         parseFloat(location[0]));
              
        } else if (line.length > 0) {
            var coords = OpenLayers.String.trim(this.concatChildValues(line[0])).split(/\s+/);
            var components = []; 
            var point;
            for (var i=0, len=coords.length; i<len; i+=2) {
                point = new OpenLayers.Geometry.Point(parseFloat(coords[i+1]), 
                                                     parseFloat(coords[i]));
                components.push(point);
            }
            geometry = new OpenLayers.Geometry.LineString(components);
        } else if (polygon.length > 0) { 
            var coords = OpenLayers.String.trim(this.concatChildValues(polygon[0])).split(/\s+/);
            var components = []; 
            var point;
            for (var i=0, len=coords.length; i<len; i+=2) {
                point = new OpenLayers.Geometry.Point(parseFloat(coords[i+1]), 
                                                     parseFloat(coords[i]));
                components.push(point);
            }
            geometry = new OpenLayers.Geometry.Polygon([new OpenLayers.Geometry.LinearRing(components)]);
        } else if (where.length > 0) { 
            if (!this.gmlParser) {
              this.gmlParser = new OpenLayers.Format.GML({'xy': this.xy});
            }
            var feature = this.gmlParser.parseFeature(where[0]);
            geometry = feature.geometry;
        } else if (box.length  > 0) {
            var coords = OpenLayers.String.trim(box[0].firstChild.nodeValue).split(/\s+/);
            var components = [];
            var point;
            if (coords.length > 3) {
                point = new OpenLayers.Geometry.Point(parseFloat(coords[1]), 
                                                     parseFloat(coords[0]));
                components.push(point);
                point = new OpenLayers.Geometry.Point(parseFloat(coords[1]), 
                                                     parseFloat(coords[2]));
                components.push(point);
                point = new OpenLayers.Geometry.Point(parseFloat(coords[3]), 
                                                     parseFloat(coords[2]));
                components.push(point);
                point = new OpenLayers.Geometry.Point(parseFloat(coords[3]), 
                                                     parseFloat(coords[0]));
                components.push(point);
                point = new OpenLayers.Geometry.Point(parseFloat(coords[1]), 
                                                     parseFloat(coords[0]));
                components.push(point);
            }
            geometry = new OpenLayers.Geometry.Polygon([new OpenLayers.Geometry.LinearRing(components)]);									 
        }
        
        if (geometry && this.internalProjection && this.externalProjection) {
            geometry.transform(this.externalProjection, 
                               this.internalProjection);
        }

        return geometry;
    },        

    /**
     * Method: createFeatureFromItem
     * Return a feature from a GeoRSS Item.
     *
     * Parameters:
     * item - {DOMElement} A GeoRSS item node.
     *
     * Returns:
     * {<OpenLayers.Feature.Vector>} A feature representing the item.
     */
    createFeatureFromItem: function(item) {
        var geometry = this.createGeometryFromItem(item);
     
        /* Provide defaults for title and description */
        var title = this.getChildValue(item, "*", "title", this.featureTitle);
       
        /* First try RSS descriptions, then Atom summaries */
        var description = this.getChildValue(
            item, "*", "description",
            this.getChildValue(item, "*", "content",
                this.getChildValue(item, "*", "summary", this.featureDescription)));

        /* If no link URL is found in the first child node, try the
           href attribute */
        var link = this.getChildValue(item, "*", "link");
        if(!link) {
            try {
                link = this.getElementsByTagNameNS(item, "*", "link")[0].getAttribute("href");
            } catch(e) {
                link = null;
            }
        }

        var id = this.getChildValue(item, "*", "id", null);
        
        var data = {
            "title": title,
            "description": description,
            "link": link
        };
        var feature = new OpenLayers.Feature.Vector(geometry, data);
        feature.fid = id;
        return feature;
    },        
    
    /**
     * Method: getChildValue
     *
     * Parameters:
     * node - {DOMElement}
     * nsuri - {String} Child node namespace uri ("*" for any).
     * name - {String} Child node name.
     * def - {String} Optional string default to return if no child found.
     *
     * Returns:
     * {String} The value of the first child with the given tag name.  Returns
     *     default value or empty string if none found.
     */
    getChildValue: function(node, nsuri, name, def) {
        var value;
        var eles = this.getElementsByTagNameNS(node, nsuri, name);
        if(eles && eles[0] && eles[0].firstChild
            && eles[0].firstChild.nodeValue) {
            value = eles[0].firstChild.nodeValue;
        } else {
            value = (def == undefined) ? "" : def;
        }
        return value;
    },
    
    /**
     * APIMethod: read
     * Return a list of features from a GeoRSS doc
     
     * Parameters:
     * data - {Element} 
     *
     * Returns:
     * An Array of <OpenLayers.Feature.Vector>s
     */
    read: function(doc) {
        if (typeof doc == "string") { 
            doc = OpenLayers.Format.XML.prototype.read.apply(this, [doc]);
        }

        /* Try RSS items first, then Atom entries */
        var itemlist = null;
        itemlist = this.getElementsByTagNameNS(doc, '*', 'item');
        if (itemlist.length == 0) {
            itemlist = this.getElementsByTagNameNS(doc, '*', 'entry');
        }
        
        var numItems = itemlist.length;
        var features = new Array(numItems);
        for(var i=0; i<numItems; i++) {
            features[i] = this.createFeatureFromItem(itemlist[i]);
        }
        return features;
    },
    

    /**
     * APIMethod: write
     * Accept Feature Collection, and return a string. 
     * 
     * Parameters: 
     * features - {Array(<OpenLayers.Feature.Vector>)} List of features to serialize into a string.
     */
    write: function(features) {
        var georss;
        if(features instanceof Array) {
            georss = this.createElementNS(this.rssns, "rss");
            for(var i=0, len=features.length; i<len; i++) {
                georss.appendChild(this.createFeatureXML(features[i]));
            }
        } else {
            georss = this.createFeatureXML(features);
        }
        return OpenLayers.Format.XML.prototype.write.apply(this, [georss]);
    },

    /**
     * Method: createFeatureXML
     * Accept an <OpenLayers.Feature.Vector>, and build a geometry for it.
     * 
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} 
     *
     * Returns:
     * {DOMElement}
     */
    createFeatureXML: function(feature) {
        var geometryNode = this.buildGeometryNode(feature.geometry);
        var featureNode = this.createElementNS(this.rssns, "item");
        var titleNode = this.createElementNS(this.rssns, "title");
        titleNode.appendChild(this.createTextNode(feature.attributes.title ? feature.attributes.title : ""));
        var descNode = this.createElementNS(this.rssns, "description");
        descNode.appendChild(this.createTextNode(feature.attributes.description ? feature.attributes.description : ""));
        featureNode.appendChild(titleNode);
        featureNode.appendChild(descNode);
        if (feature.attributes.link) {
            var linkNode = this.createElementNS(this.rssns, "link");
            linkNode.appendChild(this.createTextNode(feature.attributes.link));
            featureNode.appendChild(linkNode);
        }    
        for(var attr in feature.attributes) {
            if (attr == "link" || attr == "title" || attr == "description") { continue; } 
            var attrText = this.createTextNode(feature.attributes[attr]); 
            var nodename = attr;
            if (attr.search(":") != -1) {
                nodename = attr.split(":")[1];
            }    
            var attrContainer = this.createElementNS(this.featureNS, "feature:"+nodename);
            attrContainer.appendChild(attrText);
            featureNode.appendChild(attrContainer);
        }    
        featureNode.appendChild(geometryNode);
        return featureNode;
    },    
    
    /** 
     * Method: buildGeometryNode
     * builds a GeoRSS node with a given geometry
     * 
     * Parameters:
     * geometry - {<OpenLayers.Geometry>}
     *
     * Returns:
     * {DOMElement} A gml node.
     */
    buildGeometryNode: function(geometry) {
        if (this.internalProjection && this.externalProjection) {
            geometry = geometry.clone();
            geometry.transform(this.internalProjection, 
                               this.externalProjection);
        }
        var node;
        // match Polygon
        if (geometry.CLASS_NAME == "OpenLayers.Geometry.Polygon") {
            node = this.createElementNS(this.georssns, 'georss:polygon');
            
            node.appendChild(this.buildCoordinatesNode(geometry.components[0]));
        }
        // match LineString
        else if (geometry.CLASS_NAME == "OpenLayers.Geometry.LineString") {
            node = this.createElementNS(this.georssns, 'georss:line');
            
            node.appendChild(this.buildCoordinatesNode(geometry));
        }
        // match Point
        else if (geometry.CLASS_NAME == "OpenLayers.Geometry.Point") {
            node = this.createElementNS(this.georssns, 'georss:point');
            node.appendChild(this.buildCoordinatesNode(geometry));
        } else {
            throw "Couldn't parse " + geometry.CLASS_NAME;
        }  
        return node;         
    },
    
    /** 
     * Method: buildCoordinatesNode
     * 
     * Parameters:
     * geometry - {<OpenLayers.Geometry>}
     */
    buildCoordinatesNode: function(geometry) {
        var points = null;
        
        if (geometry.components) {
            points = geometry.components;
        }

        var path;
        if (points) {
            var numPoints = points.length;
            var parts = new Array(numPoints);
            for (var i = 0; i < numPoints; i++) {
                parts[i] = points[i].y + " " + points[i].x;
            }
            path = parts.join(" ");
        } else {
            path = geometry.y + " " + geometry.x;
        }
        return this.createTextNode(path);
    },

    CLASS_NAME: "OpenLayers.Format.GeoRSS" 
});     
