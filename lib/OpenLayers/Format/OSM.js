/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML.js
 * @requires OpenLayers/Feature/Vector.js
 * @requires OpenLayers/Geometry/Point.js
 * @requires OpenLayers/Geometry/LineString.js
 * @requires OpenLayers/Geometry/Polygon.js
 * @requires OpenLayers/Projection.js
 */

/**  
 * Class: OpenLayers.Format.OSM
 * OSM parser. Create a new instance with the 
 *     <OpenLayers.Format.OSM> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.OSM = OpenLayers.Class(OpenLayers.Format.XML, {
    
    /**
     * APIProperty: checkTags
     * {Boolean} Should tags be checked to determine whether something
     * should be treated as a seperate node. Will slow down parsing.
     * Default is false.
     */
    checkTags: false,

    /**
     * Property: interestingTagsExclude
     * {Array} List of tags to exclude from 'interesting' checks on nodes.
     * Must be set when creating the format. Will only be used if checkTags
     * is set.
     */
    interestingTagsExclude: null, 
    
    /**
     * APIProperty: areaTags
     * {Array} List of tags indicating that something is an area.  
     * Must be set when creating the format. Will only be used if 
     * checkTags is true.
     */
    areaTags: null, 
    
    /**
     * Constructor: OpenLayers.Format.OSM
     * Create a new parser for OSM.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        var layer_defaults = {
          'interestingTagsExclude': ['source', 'source_ref', 
              'source:ref', 'history', 'attribution', 'created_by'],
          'areaTags': ['area', 'building', 'leisure', 'tourism', 'ruins',
              'historic', 'landuse', 'military', 'natural', 'sport'] 
        };
          
        layer_defaults = OpenLayers.Util.extend(layer_defaults, options);
        
        var interesting = {};
        for (var i = 0; i < layer_defaults.interestingTagsExclude.length; i++) {
            interesting[layer_defaults.interestingTagsExclude[i]] = true;
        }
        layer_defaults.interestingTagsExclude = interesting;
        
        var area = {};
        for (var i = 0; i < layer_defaults.areaTags.length; i++) {
            area[layer_defaults.areaTags[i]] = true;
        }
        layer_defaults.areaTags = area;

        // OSM coordinates are always in longlat WGS84
        this.externalProjection = new OpenLayers.Projection("EPSG:4326");
        
        OpenLayers.Format.XML.prototype.initialize.apply(this, [layer_defaults]);
    },
    
    /**
     * APIMethod: read
     * Return a list of features from a OSM doc
     
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

        var nodes = this.getNodes(doc);
        var ways = this.getWays(doc);
        
        // Geoms will contain at least ways.length entries.
        var feat_list = new Array(ways.length);
        
        for (var i = 0; i < ways.length; i++) {
            // We know the minimal of this one ahead of time. (Could be -1
            // due to areas/polygons)
            var point_list = new Array(ways[i].nodes.length);
            
            var poly = this.isWayArea(ways[i]) ? 1 : 0; 
            for (var j = 0; j < ways[i].nodes.length; j++) {
               var node = nodes[ways[i].nodes[j]];
               
               var point = new OpenLayers.Geometry.Point(node.lon, node.lat);
               
               // Since OSM is topological, we stash the node ID internally. 
               point.osm_id = parseInt(ways[i].nodes[j]);
               point_list[j] = point;
               
               // We don't display nodes if they're used inside other 
               // elements.
               node.used = true; 
            }
            var geometry = null;
            if (poly) { 
                geometry = new OpenLayers.Geometry.Polygon(
                    new OpenLayers.Geometry.LinearRing(point_list));
            } else {    
                geometry = new OpenLayers.Geometry.LineString(point_list);
            }
            if (this.internalProjection && this.externalProjection) {
                geometry.transform(this.externalProjection, 
                    this.internalProjection);
            }        
            var feat = new OpenLayers.Feature.Vector(geometry,
                ways[i].tags);
            feat.osm_id = parseInt(ways[i].id);
            feat.fid = "way." + feat.osm_id;
            feat_list[i] = feat;
        } 
        for (var node_id in nodes) {
            var node = nodes[node_id];
            if (!node.used || this.checkTags) {
                var tags = null;
                
                if (this.checkTags) {
                    var result = this.getTags(node.node, true);
                    if (node.used && !result[1]) {
                        continue;
                    }
                    tags = result[0];
                } else { 
                    tags = this.getTags(node.node);
                }    
                
                var feat = new OpenLayers.Feature.Vector(
                    new OpenLayers.Geometry.Point(node['lon'], node['lat']),
                    tags);
                if (this.internalProjection && this.externalProjection) {
                    feat.geometry.transform(this.externalProjection, 
                        this.internalProjection);
                }        
                feat.osm_id = parseInt(node_id); 
                feat.fid = "node." + feat.osm_id;
                feat_list.push(feat);
            }   
            // Memory cleanup
            node.node = null;
        }        
        return feat_list;
    },

    /**
     * Method: getNodes
     * Return the node items from a doc.  
     *
     * Parameters:
     * doc - {DOMElement} node to parse tags from
     */
    getNodes: function(doc) {
        var node_list = doc.getElementsByTagName("node");
        var nodes = {};
        for (var i = 0; i < node_list.length; i++) {
            var node = node_list[i];
            var id = node.getAttribute("id");
            nodes[id] = {
                'lat': node.getAttribute("lat"),
                'lon': node.getAttribute("lon"),
                'node': node
            };
        }
        return nodes;
    },

    /**
     * Method: getWays
     * Return the way items from a doc.  
     *
     * Parameters:
     * doc - {DOMElement} node to parse tags from
     */
    getWays: function(doc) {
        var way_list = doc.getElementsByTagName("way");
        var return_ways = [];
        for (var i = 0; i < way_list.length; i++) {
            var way = way_list[i];
            var way_object = {
              id: way.getAttribute("id")
            };
            
            way_object.tags = this.getTags(way);
            
            var node_list = way.getElementsByTagName("nd");
            
            way_object.nodes = new Array(node_list.length);
            
            for (var j = 0; j < node_list.length; j++) {
                way_object.nodes[j] = node_list[j].getAttribute("ref");
            }  
            return_ways.push(way_object);
        }
        return return_ways; 
        
    },  
    
    /**
     * Method: getTags
     * Return the tags list attached to a specific DOM element.
     *
     * Parameters:
     * dom_node - {DOMElement} node to parse tags from
     * interesting_tags - {Boolean} whether the return from this function should
     *    return a boolean indicating that it has 'interesting tags' -- 
     *    tags like attribution and source are ignored. (To change the list
     *    of tags, see interestingTagsExclude)
     * 
     * Returns:
     * tags - {Object} hash of tags
     * interesting - {Boolean} if interesting_tags is passed, returns
     *     whether there are any interesting tags on this element.
     */
    getTags: function(dom_node, interesting_tags) {
        var tag_list = dom_node.getElementsByTagName("tag");
        var tags = {};
        var interesting = false;
        for (var j = 0; j < tag_list.length; j++) {
            var key = tag_list[j].getAttribute("k");
            tags[key] = tag_list[j].getAttribute("v");
            if (interesting_tags) {
                if (!this.interestingTagsExclude[key]) {
                    interesting = true;
                }
            }    
        }  
        return interesting_tags ? [tags, interesting] : tags;     
    },

    /** 
     * Method: isWayArea
     * Given a way object from getWays, check whether the tags and geometry
     * indicate something is an area.
     *
     * Returns:
     * {Boolean}
     */
    isWayArea: function(way) { 
        var poly_shaped = false;
        var poly_tags = false;
        
        if (way.nodes[0] == way.nodes[way.nodes.length - 1]) {
            poly_shaped = true;
        }
        if (this.checkTags) {
            for(var key in way.tags) {
                if (this.areaTags[key]) {
                    poly_tags = true;
                    break;
                }
            }
        }    
        return poly_shaped && (this.checkTags ? poly_tags : true);            
    }, 

    /**
     * APIMethod: write 
     * Takes a list of features, returns a serialized OSM format file for use
     * in tools like JOSM.
     *
     * Parameters:
     * features - {Array(<OpenLayers.Feature.Vector>)}
     */
    write: function(features) { 
        if (!(OpenLayers.Util.isArray(features))) {
            features = [features];
        }
        
        this.osm_id = 1;
        this.created_nodes = {};
        var root_node = this.createElementNS(null, "osm");
        root_node.setAttribute("version", "0.5");
        root_node.setAttribute("generator", "OpenLayers "+ OpenLayers.VERSION_NUMBER);

        // Loop backwards, because the deserializer puts nodes last, and 
        // we want them first if possible
        for(var i = features.length - 1; i >= 0; i--) {
            var nodes = this.createFeatureNodes(features[i]);
            for (var j = 0; j < nodes.length; j++) {
                root_node.appendChild(nodes[j]);
            }    
        }
        return OpenLayers.Format.XML.prototype.write.apply(this, [root_node]);
    },

    /**
     * Method: createFeatureNodes
     * Takes a feature, returns a list of nodes from size 0->n.
     * Will include all pieces of the serialization that are required which
     * have not already been created. Calls out to createXML based on geometry
     * type.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     */
    createFeatureNodes: function(feature) {
        var nodes = [];
        var className = feature.geometry.CLASS_NAME;
        var type = className.substring(className.lastIndexOf(".") + 1);
        type = type.toLowerCase();
        var builder = this.createXML[type];
        if (builder) {
            nodes = builder.apply(this, [feature]);
        }
        return nodes;
    },
    
    /**
     * Method: createXML
     * Takes a feature, returns a list of nodes from size 0->n.
     * Will include all pieces of the serialization that are required which
     * have not already been created.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     */
    createXML: {
        'point': function(point) {
            var id = null;
            var geometry = point.geometry ? point.geometry : point;
            
            if (this.internalProjection && this.externalProjection) {
                geometry = geometry.clone();
                geometry.transform(this.internalProjection, 
                                   this.externalProjection);
            }                       
            
            var already_exists = false; // We don't return anything if the node
                                        // has already been created
            if (point.osm_id) {
                id = point.osm_id;
                if (this.created_nodes[id]) {
                    already_exists = true;
                }    
            } else {
               id = -this.osm_id;
               this.osm_id++; 
            }
            if (already_exists) {
                node = this.created_nodes[id];
            } else {    
                var node = this.createElementNS(null, "node");
            }
            this.created_nodes[id] = node;
            node.setAttribute("id", id);
            node.setAttribute("lon", geometry.x); 
            node.setAttribute("lat", geometry.y);
            if (point.attributes) {
                this.serializeTags(point, node);
            }
            this.setState(point, node);
            return already_exists ? [] : [node];
        }, 
        linestring: function(feature) {
            var id;
            var nodes = [];
            var geometry = feature.geometry;
            if (feature.osm_id) {
                id = feature.osm_id;
            } else {
                id = -this.osm_id;
                this.osm_id++; 
            }
            var way = this.createElementNS(null, "way");
            way.setAttribute("id", id);
            for (var i = 0; i < geometry.components.length; i++) {
                var node = this.createXML['point'].apply(this, [geometry.components[i]]);
                if (node.length) {
                    node = node[0];
                    var node_ref = node.getAttribute("id");
                    nodes.push(node);
                } else {
                    node_ref = geometry.components[i].osm_id;
                    node = this.created_nodes[node_ref];
                }
                this.setState(feature, node);
                var nd_dom = this.createElementNS(null, "nd");
                nd_dom.setAttribute("ref", node_ref);
                way.appendChild(nd_dom);
            }
            this.serializeTags(feature, way);
            nodes.push(way);
            
            return nodes;
        },
        polygon: function(feature) {
            var attrs = OpenLayers.Util.extend({'area':'yes'}, feature.attributes);
            var feat = new OpenLayers.Feature.Vector(feature.geometry.components[0], attrs); 
            feat.osm_id = feature.osm_id;
            return this.createXML['linestring'].apply(this, [feat]);
        }
    },

    /**
     * Method: serializeTags
     * Given a feature, serialize the attributes onto the given node.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     * node - {DOMNode}
     */
    serializeTags: function(feature, node) {
        for (var key in feature.attributes) {
            var tag = this.createElementNS(null, "tag");
            tag.setAttribute("k", key);
            tag.setAttribute("v", feature.attributes[key]);
            node.appendChild(tag);
        }
    },

    /**
     * Method: setState 
     * OpenStreetMap has a convention that 'state' is stored for modification or deletion.
     * This allows the file to be uploaded via JOSM or the bulk uploader tool.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     * node - {DOMNode}
     */
    setState: function(feature, node) {
        if (feature.state) {
            var state = null;
            switch(feature.state) {
                case OpenLayers.State.UPDATE:
                    state = "modify";
                case OpenLayers.State.DELETE:
                    state = "delete";
            }
            if (state) {
                node.setAttribute("action", state);
            }
        }    
    },

    CLASS_NAME: "OpenLayers.Format.OSM" 
});     
