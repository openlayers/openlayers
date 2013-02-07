/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML.js
 * @requires OpenLayers/Format/GML/v3.js
 * @requires OpenLayers/Feature/Vector.js
 */

/**
 * Class: OpenLayers.Format.Atom
 * Read/write Atom feeds. Create a new instance with the
 *     <OpenLayers.Format.AtomFeed> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.Atom = OpenLayers.Class(OpenLayers.Format.XML, {
    
    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.  Properties
     *     of this object should not be set individually.  Read-only.  All
     *     XML subclasses should have their own namespaces object.  Use
     *     <setNamespace> to add or set a namespace alias after construction.
     */
    namespaces: {
        atom: "http://www.w3.org/2005/Atom",
        georss: "http://www.georss.org/georss"
    },
    
    /**
     * APIProperty: feedTitle
     * {String} Atom feed elements require a title.  Default is "untitled".
     */
    feedTitle: "untitled",

    /**
     * APIProperty: defaultEntryTitle
     * {String} Atom entry elements require a title.  In cases where one is
     *     not provided in the feature attributes, this will be used.  Default
     *     is "untitled".
     */
    defaultEntryTitle: "untitled",

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
     * Constructor: OpenLayers.Format.AtomEntry
     * Create a new parser for Atom.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    
    /**
     * APIMethod: read
     * Return a list of features from an Atom feed or entry document.
     
     * Parameters:
     * doc - {Element} or {String}
     *
     * Returns:
     * Array({<OpenLayers.Feature.Vector>})
     */
    read: function(doc) {
        if (typeof doc == "string") {
            doc = OpenLayers.Format.XML.prototype.read.apply(this, [doc]);
        }
        return this.parseFeatures(doc);
    },
    
    /**
     * APIMethod: write
     * Serialize or more feature nodes to Atom documents.
     *
     * Parameters:
     * features - {<OpenLayers.Feature.Vector>} or Array({<OpenLayers.Feature.Vector>})
     *
     * Returns:
     * {String} an Atom entry document if passed one feature node, or a feed
     * document if passed an array of feature nodes.
     */
    write: function(features) {
        var doc;
        if (OpenLayers.Util.isArray(features)) {
            doc = this.createElementNSPlus("atom:feed");
            doc.appendChild(
                this.createElementNSPlus("atom:title", {
                    value: this.feedTitle
                })
            );
            for (var i=0, ii=features.length; i<ii; i++) {
                doc.appendChild(this.buildEntryNode(features[i]));
            }
        }
        else {
            doc = this.buildEntryNode(features);
        }
        return OpenLayers.Format.XML.prototype.write.apply(this, [doc]);
    },
    
    /**
     * Method: buildContentNode
     *
     * Parameters:
     * content - {Object}
     *
     * Returns:
     * {DOMElement} an Atom content node.
     *
     * TODO: types other than text.
     */
    buildContentNode: function(content) {
        var node = this.createElementNSPlus("atom:content", {
            attributes: {
                type: content.type || null
            }
        });
        if (content.src) {
            node.setAttribute("src", content.src);
        } else {
            if (content.type == "text" || content.type == null) {
                node.appendChild(
                    this.createTextNode(content.value)
                );
            } else if (content.type == "html") {
                if (typeof content.value != "string") {
                    throw "HTML content must be in form of an escaped string";
                }
                node.appendChild(
                    this.createTextNode(content.value)
                );
            } else if (content.type == "xhtml") {
                node.appendChild(content.value);
            } else if (content.type == "xhtml" ||
                           content.type.match(/(\+|\/)xml$/)) {
                node.appendChild(content.value);
            }
            else { // MUST be a valid Base64 encoding
                node.appendChild(
                    this.createTextNode(content.value)
                );
            }
        }
        return node;
    },
    
    /**
     * Method: buildEntryNode
     * Build an Atom entry node from a feature object.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     *
     * Returns:
     * {DOMElement} an Atom entry node.
     *
     * These entries are geared for publication using AtomPub.
     *
     * TODO: support extension elements
     */
    buildEntryNode: function(feature) {
        var attrib = feature.attributes;
        var atomAttrib = attrib.atom || {};
        var entryNode = this.createElementNSPlus("atom:entry");
        
        // atom:author
        if (atomAttrib.authors) {
            var authors = OpenLayers.Util.isArray(atomAttrib.authors) ?
                atomAttrib.authors : [atomAttrib.authors];
            for (var i=0, ii=authors.length; i<ii; i++) {
                entryNode.appendChild(
                    this.buildPersonConstructNode(
                        "author", authors[i]
                    )
                );
            }
        }
        
        // atom:category
        if (atomAttrib.categories) {
            var categories = OpenLayers.Util.isArray(atomAttrib.categories) ?
                atomAttrib.categories : [atomAttrib.categories];
            var category;
            for (var i=0, ii=categories.length; i<ii; i++) {
                category = categories[i];
                entryNode.appendChild(
                    this.createElementNSPlus("atom:category", {
                        attributes: {
                            term: category.term,
                            scheme: category.scheme || null,
                            label: category.label || null
                        }
                    })
                );
            }
        }
        
        // atom:content
        if (atomAttrib.content) {
            entryNode.appendChild(this.buildContentNode(atomAttrib.content));
        }
        
        // atom:contributor
        if (atomAttrib.contributors) {
            var contributors = OpenLayers.Util.isArray(atomAttrib.contributors) ?
                atomAttrib.contributors : [atomAttrib.contributors];
            for (var i=0, ii=contributors.length; i<ii; i++) {
                entryNode.appendChild(
                    this.buildPersonConstructNode(
                        "contributor",
                        contributors[i]
                        )
                    );
            }
        }
        
        // atom:id
        if (feature.fid) {
            entryNode.appendChild(
                this.createElementNSPlus("atom:id", {
                    value: feature.fid
                })
            );
        }
        
        // atom:link
        if (atomAttrib.links) {
            var links = OpenLayers.Util.isArray(atomAttrib.links) ?
                atomAttrib.links : [atomAttrib.links];
            var link;
            for (var i=0, ii=links.length; i<ii; i++) {
                link = links[i];
                entryNode.appendChild(
                    this.createElementNSPlus("atom:link", {
                        attributes: {
                            href: link.href,
                            rel: link.rel || null,
                            type: link.type || null,
                            hreflang: link.hreflang || null,
                            title: link.title || null,
                            length: link.length || null
                        }
                    })
                );
            }
        }
        
        // atom:published
        if (atomAttrib.published) {
            entryNode.appendChild(
                this.createElementNSPlus("atom:published", {
                    value: atomAttrib.published
                })
            );
        }
        
        // atom:rights
        if (atomAttrib.rights) {
            entryNode.appendChild(
                this.createElementNSPlus("atom:rights", {
                    value: atomAttrib.rights
                })
            );
        }
        
        // atom:source not implemented
        
        // atom:summary
        if (atomAttrib.summary || attrib.description) {
            entryNode.appendChild(
                this.createElementNSPlus("atom:summary", {
                    value: atomAttrib.summary || attrib.description
                })
            );
        }
        
        // atom:title
        entryNode.appendChild(
            this.createElementNSPlus("atom:title", {
                value: atomAttrib.title || attrib.title || this.defaultEntryTitle
            })
        );
        
        // atom:updated
        if (atomAttrib.updated) {
            entryNode.appendChild(
                this.createElementNSPlus("atom:updated", {
                    value: atomAttrib.updated
                })
            );
        }
        
        // georss:where
        if (feature.geometry) {
            var whereNode = this.createElementNSPlus("georss:where");
            whereNode.appendChild(
                this.buildGeometryNode(feature.geometry)
            );
            entryNode.appendChild(whereNode);
        }
        
        return entryNode;
    },
    
    /**
     * Method: initGmlParser
     * Creates a GML parser.
     */
    initGmlParser: function() {
        this.gmlParser = new OpenLayers.Format.GML.v3({
            xy: this.xy,
            featureNS: "http://example.com#feature",
            internalProjection: this.internalProjection,
            externalProjection: this.externalProjection
        });
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
        if (!this.gmlParser) {
            this.initGmlParser();
        }
        var node = this.gmlParser.writeNode("feature:_geometry", geometry);
        return node.firstChild;
    },
    
    /**
     * Method: buildPersonConstructNode
     *
     * Parameters:
     * name - {String}
     * value - {Object}
     *
     * Returns:
     * {DOMElement} an Atom person construct node.
     *
     * Example:
     * >>> buildPersonConstructNode("author", {name: "John Smith"})
     * {<author><name>John Smith</name></author>}
     *
     * TODO: how to specify extension elements? Add to the oNames array?
     */
    buildPersonConstructNode: function(name, value) {
        var oNames = ["uri", "email"];
        var personNode = this.createElementNSPlus("atom:" + name);
        personNode.appendChild(
            this.createElementNSPlus("atom:name", {
                value: value.name
            })
        );
        for (var i=0, ii=oNames.length; i<ii; i++) {
            if (value[oNames[i]]) {
                personNode.appendChild(
                    this.createElementNSPlus("atom:" + oNames[i], {
                        value: value[oNames[i]]
                    })
                );
            }
        }
        return personNode;
    },
    
    /**
     * Method: getFirstChildValue
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
    getFirstChildValue: function(node, nsuri, name, def) {
        var value;
        var nodes = this.getElementsByTagNameNS(node, nsuri, name);
        if (nodes && nodes.length > 0) {
            value = this.getChildValue(nodes[0], def);
        } else {
            value = def;
        }
        return value;
    },
    
    /**
     * Method: parseFeature
     * Parse feature from an Atom entry node..
     *
     * Parameters:
     * node - {DOMElement} An Atom entry or feed node.
     *
     * Returns:
     * {<OpenLayers.Feature.Vector>}
     */
    parseFeature: function(node) {
        var atomAttrib = {};
        var value = null;
        var nodes = null;
        var attval = null;
        var atomns = this.namespaces.atom;
        
        // atomAuthor*
        this.parsePersonConstructs(node, "author", atomAttrib);
        
        // atomCategory*
        nodes = this.getElementsByTagNameNS(node, atomns, "category");
        if (nodes.length > 0) {
            atomAttrib.categories = [];
        }
        for (var i=0, ii=nodes.length; i<ii; i++) {
            value = {};
            value.term = nodes[i].getAttribute("term");
            attval = nodes[i].getAttribute("scheme");
            if (attval) { value.scheme = attval; }
            attval = nodes[i].getAttribute("label");
            if (attval) { value.label = attval; }
            atomAttrib.categories.push(value);
        }
        
        // atomContent?
        nodes = this.getElementsByTagNameNS(node, atomns, "content");
        if (nodes.length > 0) {
            value = {};
            attval = nodes[0].getAttribute("type");
            if (attval) {
                value.type = attval;
            }
            attval = nodes[0].getAttribute("src");
            if (attval) {
                value.src = attval;
            } else {
                if (value.type == "text" || 
                    value.type == "html" || 
                    value.type == null ) {
                    value.value = this.getFirstChildValue(
                                        node,
                                        atomns,
                                        "content",
                                        null
                                        );
                } else if (value.type == "xhtml" ||
                           value.type.match(/(\+|\/)xml$/)) {
                    value.value = this.getChildEl(nodes[0]);
                } else { // MUST be base64 encoded
                    value.value = this.getFirstChildValue(
                                        node,
                                        atomns,
                                        "content",
                                        null
                                        );
                }
                atomAttrib.content = value;
            }
        }
        
        // atomContributor*
        this.parsePersonConstructs(node, "contributor", atomAttrib);
        
        // atomId
        atomAttrib.id = this.getFirstChildValue(node, atomns, "id", null);
        
        // atomLink*
        nodes = this.getElementsByTagNameNS(node, atomns, "link");
        if (nodes.length > 0) {
            atomAttrib.links = new Array(nodes.length);
        }
        var oAtts = ["rel", "type", "hreflang", "title", "length"];
        for (var i=0, ii=nodes.length; i<ii; i++) {
            value = {};
            value.href = nodes[i].getAttribute("href");
            for (var j=0, jj=oAtts.length; j<jj; j++) {
                attval = nodes[i].getAttribute(oAtts[j]);
                if (attval) {
                    value[oAtts[j]] = attval;
                }
            }
            atomAttrib.links[i] = value;
        }
        
        // atomPublished?
        value = this.getFirstChildValue(node, atomns, "published", null);
        if (value) {
            atomAttrib.published = value;
        }
        
        // atomRights?
        value = this.getFirstChildValue(node, atomns, "rights", null);
        if (value) {
            atomAttrib.rights = value;
        }
        
        // atomSource? -- not implemented
        
        // atomSummary?
        value = this.getFirstChildValue(node, atomns, "summary", null);
        if (value) {
            atomAttrib.summary = value;
        }
        
        // atomTitle
        atomAttrib.title = this.getFirstChildValue(
                                node, atomns, "title", null
                                );
        
        // atomUpdated
        atomAttrib.updated = this.getFirstChildValue(
                                node, atomns, "updated", null
                                );
        
        var featureAttrib = {
            title: atomAttrib.title,
            description: atomAttrib.summary,
            atom: atomAttrib
        };
        var geometry = this.parseLocations(node)[0];
        var feature = new OpenLayers.Feature.Vector(geometry, featureAttrib);
        feature.fid = atomAttrib.id;
        return feature;
    },
    
    /**
     * Method: parseFeatures
     * Return features from an Atom entry or feed.
     *
     * Parameters:
     * node - {DOMElement} An Atom entry or feed node.
     *
     * Returns:
     * Array({<OpenLayers.Feature.Vector>})
     */
    parseFeatures: function(node) {
        var features = [];
        var entries = this.getElementsByTagNameNS(
            node, this.namespaces.atom, "entry"
        );
        if (entries.length == 0) {
            entries = [node];
        }
        for (var i=0, ii=entries.length; i<ii; i++) {
            features.push(this.parseFeature(entries[i]));
        }
        return features;
    },
    
    /**
     * Method: parseLocations
     * Parse the locations from an Atom entry or feed.
     *
     * Parameters:
     * node - {DOMElement} An Atom entry or feed node.
     *
     * Returns:
     * Array({<OpenLayers.Geometry>})
     */
    parseLocations: function(node) {
        var georssns = this.namespaces.georss;

        var locations = {components: []};
        var where = this.getElementsByTagNameNS(node, georssns, "where");
        if (where && where.length > 0) {
            if (!this.gmlParser) {
                this.initGmlParser();
            }
            for (var i=0, ii=where.length; i<ii; i++) {
                this.gmlParser.readChildNodes(where[i], locations);
            }
        }
        
        var components = locations.components;
        var point = this.getElementsByTagNameNS(node, georssns, "point");
        if (point && point.length > 0) {
            for (var i=0, ii=point.length; i<ii; i++) {
                var xy = OpenLayers.String.trim(
                            point[i].firstChild.nodeValue
                            ).split(/\s+/);
                if (xy.length !=2) {
                    xy = OpenLayers.String.trim(
                                point[i].firstChild.nodeValue
                                ).split(/\s*,\s*/);
                }
                components.push(new OpenLayers.Geometry.Point(xy[1], xy[0]));
            }
        }

        var line = this.getElementsByTagNameNS(node, georssns, "line");
        if (line && line.length > 0) {
            var coords;
            var p;
            var points;
            for (var i=0, ii=line.length; i<ii; i++) {
                coords = OpenLayers.String.trim(
                                line[i].firstChild.nodeValue
                                ).split(/\s+/);
                points = [];
                for (var j=0, jj=coords.length; j<jj; j+=2) {
                    p = new OpenLayers.Geometry.Point(coords[j+1], coords[j]);
                    points.push(p);
                }
                components.push(
                    new OpenLayers.Geometry.LineString(points)
                );
            }
        }        

        var polygon = this.getElementsByTagNameNS(node, georssns, "polygon");
        if (polygon && polygon.length > 0) {
            var coords;
            var p;
            var points;
            for (var i=0, ii=polygon.length; i<ii; i++) {
                coords = OpenLayers.String.trim(
                            polygon[i].firstChild.nodeValue
                            ).split(/\s+/);
                points = [];
                for (var j=0, jj=coords.length; j<jj; j+=2) {
                    p = new OpenLayers.Geometry.Point(coords[j+1], coords[j]);
                    points.push(p);
                }
                components.push(
                    new OpenLayers.Geometry.Polygon(
                        [new OpenLayers.Geometry.LinearRing(points)]
                    )
                );
            }
        }
        
        if (this.internalProjection && this.externalProjection) {
            for (var i=0, ii=components.length; i<ii; i++) {
                if (components[i]) {
                    components[i].transform(
                        this.externalProjection,
                        this.internalProjection
                    );
                }
            }
        }
        
        return components;
    },
    
    /**
     * Method: parsePersonConstruct
     * Parse Atom person constructs from an Atom entry node.
     *
     * Parameters:
     * node - {DOMElement} An Atom entry or feed node.
     * name - {String} Construcy name ("author" or "contributor")
     * data = {Object} Object in which to put parsed persons.
     *
     * Returns:
     * An {Object}.
     */
    parsePersonConstructs: function(node, name, data) {
        var persons = [];
        var atomns = this.namespaces.atom;
        var nodes = this.getElementsByTagNameNS(node, atomns, name);
        var oAtts = ["uri", "email"];
        for (var i=0, ii=nodes.length; i<ii; i++) {
            var value = {};
            value.name = this.getFirstChildValue(
                            nodes[i],
                            atomns,
                            "name",
                            null
                            );
            for (var j=0, jj=oAtts.length; j<jj; j++) {
                var attval = this.getFirstChildValue(
                            nodes[i],
                            atomns,
                            oAtts[j],
                            null);
                if (attval) {
                    value[oAtts[j]] = attval;
                }
            }
            persons.push(value);
        }
        if (persons.length > 0) {
            data[name + "s"] = persons;
        }
    },

    CLASS_NAME: "OpenLayers.Format.Atom"
});
