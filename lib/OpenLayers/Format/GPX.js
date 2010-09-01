/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
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
     * An Array of <OpenLayers.Feature.Vector>s
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
    * segment - {<DOMElement>} a trkseg or rte node to parse
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
        var attrNode = node.firstChild;
        while(attrNode) {
            if(attrNode.nodeType == 1) {
                var value = attrNode.firstChild;
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
    
    CLASS_NAME: "OpenLayers.Format.GPX"
});
