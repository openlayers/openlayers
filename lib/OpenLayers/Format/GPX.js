/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML.js
 * @requires OpenLayers/Feature/Vector.js
 * @requires OpenLayers/Geometry/Point.js
 * @requires OpenLayers/Geometry/LineString.js
 * @requires OpenLayers/Projection.js
 */

/**
 * Class: OpenLayers.Format.GPX
 * Read/write GPX parser. Create a new instance with the 
 *     <OpenLayers.Format.GPX> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.GPX = OpenLayers.Class(OpenLayers.Format.XML, {
    

    /** 
     * APIProperty: defaultDesc
     * {String} Default description for the waypoints/tracks in the case
     *     where the feature has no "description" attribute.
     *     Default is "No description available".
     */
    defaultDesc: "No description available",

   /**
    * APIProperty: extractWaypoints
    * {Boolean} Extract waypoints from GPX. (default: true)
    */
    extractWaypoints: true,
    
   /**
    * APIProperty: extractTracks
    * {Boolean} Extract tracks from GPX. (default: true)
    */
    extractTracks: true,
    
   /**
    * APIProperty: extractRoutes
    * {Boolean} Extract routes from GPX. (default: true)
    */
    extractRoutes: true,
    
    /**
     * APIProperty: extractAttributes
     * {Boolean} Extract feature attributes from GPX. (default: true)
     *     NOTE: Attributes as part of extensions to the GPX standard may not
     *     be extracted.
     */
    extractAttributes: true,

    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
        gpx: "http://www.topografix.com/GPX/1/1",
        xsi: "http://www.w3.org/2001/XMLSchema-instance"
    },

    /**
     * Property: schemaLocation
     * {String} Schema location. Defaults to
     *  "http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd"
     */
    schemaLocation: "http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd",

    /**
     * APIProperty: creator
     * {String} The creator attribute to be added to the written GPX files.
     * Defaults to "OpenLayers"
     */
    creator: "OpenLayers",
    
    /**
     * Constructor: OpenLayers.Format.GPX
     * Create a new parser for GPX.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        // GPX coordinates are always in longlat WGS84
        this.externalProjection = new OpenLayers.Projection("EPSG:4326");

        OpenLayers.Format.XML.prototype.initialize.apply(this, [options]);
    },
    
    /**
     * APIMethod: read
     * Return a list of features from a GPX doc
     *
     * Parameters:
     * doc - {Element} 
     *
     * Returns:
     * Array({<OpenLayers.Feature.Vector>})
     */
    read: function(doc) {
        if (typeof doc == "string") { 
            doc = OpenLayers.Format.XML.prototype.read.apply(this, [doc]);
        }
        var features = [];
        
        if(this.extractTracks) {
            var tracks = doc.getElementsByTagName("trk");
            for (var i=0, len=tracks.length; i<len; i++) {
                // Attributes are only in trk nodes, not trkseg nodes
                var attrs = {};
                if(this.extractAttributes) {
                    attrs = this.parseAttributes(tracks[i]);
                }
                
                var segs = this.getElementsByTagNameNS(tracks[i], tracks[i].namespaceURI, "trkseg");
                for (var j = 0, seglen = segs.length; j < seglen; j++) {
                    // We don't yet support extraction of trkpt attributes
                    // All trksegs of a trk get that trk's attributes
                    var track = this.extractSegment(segs[j], "trkpt");
                    features.push(new OpenLayers.Feature.Vector(track, attrs));
                }
            }
        }
        
        if(this.extractRoutes) {
            var routes = doc.getElementsByTagName("rte");
            for (var k=0, klen=routes.length; k<klen; k++) {
                var attrs = {};
                if(this.extractAttributes) {
                    attrs = this.parseAttributes(routes[k]);
                }
                var route = this.extractSegment(routes[k], "rtept");
                features.push(new OpenLayers.Feature.Vector(route, attrs));
            }
        }
        
        if(this.extractWaypoints) {
            var waypoints = doc.getElementsByTagName("wpt");
            for (var l = 0, len = waypoints.length; l < len; l++) {
                var attrs = {};
                if(this.extractAttributes) {
                    attrs = this.parseAttributes(waypoints[l]);
                }
                var wpt = new OpenLayers.Geometry.Point(waypoints[l].getAttribute("lon"), waypoints[l].getAttribute("lat"));
                features.push(new OpenLayers.Feature.Vector(wpt, attrs));
            }
        }
        
        if (this.internalProjection && this.externalProjection) {
            for (var g = 0, featLength = features.length; g < featLength; g++) {
                features[g].geometry.transform(this.externalProjection,
                                    this.internalProjection);
            }
        }
        
        return features;
    },
    
   /**
    * Method: extractSegment
    *
    * Parameters:
    * segment - {DOMElement} a trkseg or rte node to parse
    * segmentType - {String} nodeName of waypoints that form the line
    *
    * Returns:
    * {<OpenLayers.Geometry.LineString>} A linestring geometry
    */
    extractSegment: function(segment, segmentType) {
        var points = this.getElementsByTagNameNS(segment, segment.namespaceURI, segmentType);
        var point_features = [];
        for (var i = 0, len = points.length; i < len; i++) {
            point_features.push(new OpenLayers.Geometry.Point(points[i].getAttribute("lon"), points[i].getAttribute("lat")));
        }
        return new OpenLayers.Geometry.LineString(point_features);
    },
    
    /**
     * Method: parseAttributes
     *
     * Parameters:
     * node - {<DOMElement>}
     *
     * Returns:
     * {Object} An attributes object.
     */
    parseAttributes: function(node) {
        // node is either a wpt, trk or rte
        // attributes are children of the form <attr>value</attr>
        var attributes = {};
        var attrNode = node.firstChild, value, name;
        while(attrNode) {
            if(attrNode.nodeType == 1 && attrNode.firstChild) {
                value = attrNode.firstChild;
                if(value.nodeType == 3 || value.nodeType == 4) {
                    name = (attrNode.prefix) ?
                        attrNode.nodeName.split(":")[1] :
                        attrNode.nodeName;
                    if(name != "trkseg" && name != "rtept") {
                        attributes[name] = value.nodeValue;
                    }
                }
            }
            attrNode = attrNode.nextSibling;
        }
        return attributes;
    },

    /**
     * APIMethod: write
     * Accepts Feature Collection, and returns a string. 
     * 
     * Parameters: 
     * features - {Array(<OpenLayers.Feature.Vector>)} List of features to serialize into a string.
     * metadata - {Object} A key/value pairs object to build a metadata node to
     *      add to the gpx. Supported keys are 'name', 'desc', 'author'.
     */
    write: function(features, metadata) {
        features = OpenLayers.Util.isArray(features) ?
            features : [features];
        var gpx = this.createElementNS(this.namespaces.gpx, "gpx");
        gpx.setAttribute("version", "1.1");
        gpx.setAttribute("creator", this.creator);
        this.setAttributes(gpx, {
            "xsi:schemaLocation": this.schemaLocation
        });

        if (metadata && typeof metadata == 'object') {
            gpx.appendChild(this.buildMetadataNode(metadata));
        }
        for(var i=0, len=features.length; i<len; i++) {
            gpx.appendChild(this.buildFeatureNode(features[i]));
        }
        return OpenLayers.Format.XML.prototype.write.apply(this, [gpx]);
    },

    /**
     * Method: buildMetadataNode
     * Creates a "metadata" node.
     *
     * Returns:
     * {DOMElement}
     */
    buildMetadataNode: function(metadata) {
        var types = ['name', 'desc', 'author'],
            node = this.createElementNSPlus('gpx:metadata');
        for (var i=0; i < types.length; i++) {
            var type = types[i];
            if (metadata[type]) {
                var n = this.createElementNSPlus("gpx:" + type);
                n.appendChild(this.createTextNode(metadata[type]));
                node.appendChild(n);
            }
        }
        return node;
    },

    /**
     * Method: buildFeatureNode
     * Accepts an <OpenLayers.Feature.Vector>, and builds a node for it.
     * 
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     *
     * Returns:
     * {DOMElement} - The created node, either a 'wpt' or a 'trk'.
     */
    buildFeatureNode: function(feature) {
        var geometry = feature.geometry;
            geometry = geometry.clone();
        if (this.internalProjection && this.externalProjection) {
            geometry.transform(this.internalProjection, 
                               this.externalProjection);
        }
        if (geometry.CLASS_NAME == "OpenLayers.Geometry.Point") {
            var wpt = this.buildWptNode(geometry);
            this.appendAttributesNode(wpt, feature);
            return wpt;
        } else {
            var trkNode = this.createElementNSPlus("gpx:trk");
            this.appendAttributesNode(trkNode, feature);
            var trkSegNodes = this.buildTrkSegNode(geometry);
            trkSegNodes = OpenLayers.Util.isArray(trkSegNodes) ?
                trkSegNodes : [trkSegNodes];
            for (var i = 0, len = trkSegNodes.length; i < len; i++) {
                trkNode.appendChild(trkSegNodes[i]);
            }
            return trkNode;
        }
    },

    /**
     * Method: buildTrkSegNode
     * Builds trkseg node(s) given a geometry
     *
     * Parameters:
     * trknode
     * geometry - {<OpenLayers.Geometry>}
     */
    buildTrkSegNode: function(geometry) {
        var node,
            i,
            len,
            point,
            nodes;
        if (geometry.CLASS_NAME == "OpenLayers.Geometry.LineString" ||
            geometry.CLASS_NAME == "OpenLayers.Geometry.LinearRing") {
            node = this.createElementNSPlus("gpx:trkseg");
            for (i = 0, len=geometry.components.length; i < len; i++) {
                point = geometry.components[i];
                node.appendChild(this.buildTrkPtNode(point));
            }
            return node;
        } else {
            nodes = [];
            for (i = 0, len = geometry.components.length; i < len; i++) {
                nodes.push(this.buildTrkSegNode(geometry.components[i]));
            }
            return nodes;
        }
    },
    
    /**
     * Method: buildTrkPtNode
     * Builds a trkpt node given a point 
     *
     * Parameters:
     * point - {<OpenLayers.Geometry.Point>}
     *
     * Returns:
     * {DOMElement} A trkpt node
     */
    buildTrkPtNode: function(point) {
        var node = this.createElementNSPlus("gpx:trkpt");
        node.setAttribute("lon", point.x);
        node.setAttribute("lat", point.y);
        return node;
    },

    /**
     * Method: buildWptNode
     * Builds a wpt node given a point
     *
     * Parameters:
     * geometry - {<OpenLayers.Geometry.Point>}
     *
     * Returns:
     * {DOMElement} A wpt node
     */
    buildWptNode: function(geometry) {
        var node = this.createElementNSPlus("gpx:wpt");
        node.setAttribute("lon", geometry.x);
        node.setAttribute("lat", geometry.y);
        return node;
    },

    /**
     * Method: appendAttributesNode
     * Adds some attributes node.
     *
     * Parameters:
     * node - {DOMElement} the node to append the attribute nodes to.
     * feature - {<OpenLayers.Feature.Vector>}
     */
    appendAttributesNode: function(node, feature) {
        var name = this.createElementNSPlus('gpx:name');
        name.appendChild(this.createTextNode(
            feature.attributes.name || feature.id));
        node.appendChild(name);
        var desc = this.createElementNSPlus('gpx:desc');
        desc.appendChild(this.createTextNode(
            feature.attributes.description || this.defaultDesc));
        node.appendChild(desc);
        // TBD - deal with remaining (non name/description) attributes.
    },

    CLASS_NAME: "OpenLayers.Format.GPX"
});
