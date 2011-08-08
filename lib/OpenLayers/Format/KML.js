/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/BaseTypes/Date.js
 * @requires OpenLayers/Format/XML.js
 * @requires OpenLayers/Feature/Vector.js
 * @requires OpenLayers/Geometry/Point.js
 * @requires OpenLayers/Geometry/LineString.js
 * @requires OpenLayers/Geometry/Polygon.js
 * @requires OpenLayers/Geometry/Collection.js
 * @requires OpenLayers/Request/XMLHttpRequest.js
 * @requires OpenLayers/Console.js
 * @requires OpenLayers/Lang.js
 * @requires OpenLayers/Projection.js
 */

/**
 * Class: OpenLayers.Format.KML
 * Read/Write KML. Create a new instance with the <OpenLayers.Format.KML>
 *     constructor. 
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.KML = OpenLayers.Class(OpenLayers.Format.XML, {
    
    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
        kml: "http://www.opengis.net/kml/2.2",
        gx: "http://www.google.com/kml/ext/2.2"
    },

    /**
     * APIProperty: kmlns
     * {String} KML Namespace to use. Defaults to 2.0 namespace.
     */
    kmlns: "http://earth.google.com/kml/2.0",
    
    /** 
     * APIProperty: placemarksDesc
     * {String} Name of the placemarks.  Default is "No description available".
     */
    placemarksDesc: "No description available",
    
    /** 
     * APIProperty: foldersName
     * {String} Name of the folders.  Default is "OpenLayers export".
     *          If set to null, no name element will be created.
     */
    foldersName: "OpenLayers export",
    
    /** 
     * APIProperty: foldersDesc
     * {String} Description of the folders. Default is "Exported on [date]."
     *          If set to null, no description element will be created.
     */
    foldersDesc: "Exported on " + new Date(),
    
    /**
     * APIProperty: extractAttributes
     * {Boolean} Extract attributes from KML.  Default is true.
     *           Extracting styleUrls requires this to be set to true
     */
    extractAttributes: true,
    
    /**
     * Property: extractStyles
     * {Boolean} Extract styles from KML.  Default is false.
     *           Extracting styleUrls also requires extractAttributes to be
     *           set to true
     */
    extractStyles: false,
    
    /**
     * APIProperty: extractTracks
     * {Boolean} Extract gx:Track elements from Placemark elements.  Default
     *     is false.  If true, features will be generated for all points in
     *     all gx:Track elements.  Features will have a when (Date) attribute
     *     based on when elements in the track.  If tracks include angle
     *     elements, features will have heading, tilt, and roll attributes.
     *     If track point coordinates have three values, features will have
     *     an altitude attribute with the third coordinate value.
     */
    extractTracks: false,
    
    /**
     * APIProperty: trackAttributes
     * {Array} If <extractTracks> is true, points within gx:Track elements will 
     *     be parsed as features with when, heading, tilt, and roll attributes.
     *     Any additional attribute names can be provided in <trackAttributes>.
     */
    trackAttributes: null,
    
    /**
     * Property: internalns
     * {String} KML Namespace to use -- defaults to the namespace of the
     *     Placemark node being parsed, but falls back to kmlns. 
     */
    internalns: null,

    /**
     * Property: features
     * {Array} Array of features
     *     
     */
    features: null,

    /**
     * Property: styles
     * {Object} Storage of style objects
     *     
     */
    styles: null,
    
    /**
     * Property: styleBaseUrl
     * {String}
     */
    styleBaseUrl: "",

    /**
     * Property: fetched
     * {Object} Storage of KML URLs that have been fetched before
     *     in order to prevent reloading them.
     */
    fetched: null,

    /**
     * APIProperty: maxDepth
     * {Integer} Maximum depth for recursive loading external KML URLs 
     *           Defaults to 0: do no external fetching
     */
    maxDepth: 0,

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
            trimComma: (/\s*,\s*/g),
            kmlColor: (/(\w{2})(\w{2})(\w{2})(\w{2})/),
            kmlIconPalette: (/root:\/\/icons\/palette-(\d+)(\.\w+)/),
            straightBracket: (/\$\[(.*?)\]/g)
        };
        // KML coordinates are always in longlat WGS84
        this.externalProjection = new OpenLayers.Projection("EPSG:4326");

        OpenLayers.Format.XML.prototype.initialize.apply(this, [options]);
    },

    /**
     * APIMethod: read
     * Read data from a string, and return a list of features. 
     * 
     * Parameters: 
     * data    - {String} or {DOMElement} data to read/parse.
     *
     * Returns:
     * {Array(<OpenLayers.Feature.Vector>)} List of features.
     */
    read: function(data) {
        this.features = [];
        this.styles   = {};
        this.fetched  = {};

        // Set default options 
        var options = {
            depth: 0,
            styleBaseUrl: this.styleBaseUrl
        };

        return this.parseData(data, options);
    },

    /**
     * Method: parseData
     * Read data from a string, and return a list of features. 
     * 
     * Parameters: 
     * data    - {String} or {DOMElement} data to read/parse.
     * options - {Object} Hash of options
     *
     * Returns:
     * {Array(<OpenLayers.Feature.Vector>)} List of features.
     */
    parseData: function(data, options) {
        if(typeof data == "string") {
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }

        // Loop throught the following node types in this order and
        // process the nodes found 
        var types = ["Link", "NetworkLink", "Style", "StyleMap", "Placemark"];
        for(var i=0, len=types.length; i<len; ++i) {
            var type = types[i];

            var nodes = this.getElementsByTagNameNS(data, "*", type);

            // skip to next type if no nodes are found
            if(nodes.length == 0) { 
                continue;
            }

            switch (type.toLowerCase()) {

                // Fetch external links 
                case "link":
                case "networklink":
                    this.parseLinks(nodes, options);
                    break;

                // parse style information
                case "style":
                    if (this.extractStyles) {
                        this.parseStyles(nodes, options);
                    }
                    break;
                case "stylemap":
                    if (this.extractStyles) {
                        this.parseStyleMaps(nodes, options);
                    }
                    break;

                // parse features
                case "placemark":
                    this.parseFeatures(nodes, options);
                    break;
            }
        }
        
        return this.features;
    },

    /**
     * Method: parseLinks
     * Finds URLs of linked KML documents and fetches them
     * 
     * Parameters: 
     * nodes   - {Array} of {DOMElement} data to read/parse.
     * options - {Object} Hash of options
     * 
     */
    parseLinks: function(nodes, options) {
        
        // Fetch external links <NetworkLink> and <Link>
        // Don't do anything if we have reached our maximum depth for recursion
        if (options.depth >= this.maxDepth) {
            return false;
        }

        // increase depth
        var newOptions = OpenLayers.Util.extend({}, options);
        newOptions.depth++;

        for(var i=0, len=nodes.length; i<len; i++) {
            var href = this.parseProperty(nodes[i], "*", "href");
            if(href && !this.fetched[href]) {
                this.fetched[href] = true; // prevent reloading the same urls
                var data = this.fetchLink(href);
                if (data) {
                    this.parseData(data, newOptions);
                }
            } 
        }

    },

    /**
     * Method: fetchLink
     * Fetches a URL and returns the result
     * 
     * Parameters: 
     * href  - {String} url to be fetched
     * 
     */
    fetchLink: function(href) {
        var request = OpenLayers.Request.GET({url: href, async: false});
        if (request) {
            return request.responseText;
        }
    },

    /**
     * Method: parseStyles
     * Looks for <Style> nodes in the data and parses them
     * Also parses <StyleMap> nodes, but only uses the 'normal' key
     * 
     * Parameters: 
     * nodes    - {Array} of {DOMElement} data to read/parse.
     * options  - {Object} Hash of options
     * 
     */
    parseStyles: function(nodes, options) {
        for(var i=0, len=nodes.length; i<len; i++) {
            var style = this.parseStyle(nodes[i]);
            if(style) {
                var styleName = (options.styleBaseUrl || "") + "#" + style.id;
                
                this.styles[styleName] = style;
            }
        }
    },

    /**
     * Method: parseKmlColor
     * Parses a kml color (in 'aabbggrr' format) and returns the corresponding 
     * color and opacity or null if the color is invalid.
     *
     * Parameters: 
     * kmlColor - {String} a kml formated color
     *
     * Returns:
     * {Object}
     */
    parseKmlColor: function(kmlColor) {
        var color = null;
        if (kmlColor) {
            var matches = kmlColor.match(this.regExes.kmlColor);
            if (matches) {
                color = {
                    color: '#' + matches[4] + matches[3] + matches[2],
                    opacity: parseInt(matches[1], 16) / 255
                };
            }
        }
        return color;
    },

    /**
     * Method: parseStyle
     * Parses the children of a <Style> node and builds the style hash
     * accordingly
     * 
     * Parameters: 
     * node - {DOMElement} <Style> node
     * 
     */
    parseStyle: function(node) {
        var style = {};
        
        var types = ["LineStyle", "PolyStyle", "IconStyle", "BalloonStyle", 
                     "LabelStyle"];
        var type, styleTypeNode, nodeList, geometry, parser;
        for(var i=0, len=types.length; i<len; ++i) {
            type = types[i];
            styleTypeNode = this.getElementsByTagNameNS(node, "*", type)[0];
            if(!styleTypeNode) { 
                continue;
            }

            // only deal with first geometry of this type
            switch (type.toLowerCase()) {
                case "linestyle":
                    var kmlColor = this.parseProperty(styleTypeNode, "*", "color");
                    var color = this.parseKmlColor(kmlColor);
                    if (color) {
                        style["strokeColor"] = color.color;
                        style["strokeOpacity"] = color.opacity;
                    }
                    
                    var width = this.parseProperty(styleTypeNode, "*", "width");
                    if (width) {
                        style["strokeWidth"] = width;
                    }
                    break;

                case "polystyle":
                    var kmlColor = this.parseProperty(styleTypeNode, "*", "color");
                    var color = this.parseKmlColor(kmlColor);
                    if (color) {
                        style["fillOpacity"] = color.opacity;
                        style["fillColor"] = color.color;
                    }
                    // Check if fill is disabled
                    var fill = this.parseProperty(styleTypeNode, "*", "fill");
                    if (fill == "0") {
                        style["fillColor"] = "none";
                    }
                    // Check if outline is disabled
                    var outline = this.parseProperty(styleTypeNode, "*", "outline");
                    if (outline == "0") {
                        style["strokeWidth"] = "0";
                    }
                   
                    break;

                case "iconstyle":
                    // set scale
                    var scale = parseFloat(this.parseProperty(styleTypeNode, 
                                                          "*", "scale") || 1);
  
                    // set default width and height of icon
                    var width = 32 * scale;
                    var height = 32 * scale;

                    var iconNode = this.getElementsByTagNameNS(styleTypeNode, 
                                               "*", 
                                               "Icon")[0];
                    if (iconNode) {
                        var href = this.parseProperty(iconNode, "*", "href");
                        if (href) {                                                   

                            var w = this.parseProperty(iconNode, "*", "w");
                            var h = this.parseProperty(iconNode, "*", "h");

                            // Settings for Google specific icons that are 64x64
                            // We set the width and height to 64 and halve the
                            // scale to prevent icons from being too big
                            var google = "http://maps.google.com/mapfiles/kml";
                            if (OpenLayers.String.startsWith(
                                                 href, google) && !w && !h) {
                                w = 64;
                                h = 64;
                                scale = scale / 2;
                            }
                                
                            // if only dimension is defined, make sure the
                            // other one has the same value
                            w = w || h;
                            h = h || w;

                            if (w) {
                                width = parseInt(w) * scale;
                            }

                            if (h) {
                                height = parseInt(h) * scale;
                            }

                            // support for internal icons 
                            //    (/root://icons/palette-x.png)
                            // x and y tell the position on the palette:
                            // - in pixels
                            // - starting from the left bottom
                            // We translate that to a position in the list 
                            // and request the appropriate icon from the 
                            // google maps website
                            var matches = href.match(this.regExes.kmlIconPalette);
                            if (matches)  {
                                var palette = matches[1];
                                var file_extension = matches[2];

                                var x = this.parseProperty(iconNode, "*", "x");
                                var y = this.parseProperty(iconNode, "*", "y");

                                var posX = x ? x/32 : 0;
                                var posY = y ? (7 - y/32) : 7;

                                var pos = posY * 8 + posX;
                                href = "http://maps.google.com/mapfiles/kml/pal" 
                                     + palette + "/icon" + pos + file_extension;
                            }

                            style["graphicOpacity"] = 1; // fully opaque
                            style["externalGraphic"] = href;
                        }

                    }


                    // hotSpots define the offset for an Icon
                    var hotSpotNode = this.getElementsByTagNameNS(styleTypeNode, 
                                               "*", 
                                               "hotSpot")[0];
                    if (hotSpotNode) {
                        var x = parseFloat(hotSpotNode.getAttribute("x"));
                        var y = parseFloat(hotSpotNode.getAttribute("y"));

                        var xUnits = hotSpotNode.getAttribute("xunits");
                        if (xUnits == "pixels") {
                            style["graphicXOffset"] = -x * scale;
                        }
                        else if (xUnits == "insetPixels") {
                            style["graphicXOffset"] = -width + (x * scale);
                        }
                        else if (xUnits == "fraction") {
                            style["graphicXOffset"] = -width * x;
                        }

                        var yUnits = hotSpotNode.getAttribute("yunits");
                        if (yUnits == "pixels") {
                            style["graphicYOffset"] = -height + (y * scale) + 1;
                        }
                        else if (yUnits == "insetPixels") {
                            style["graphicYOffset"] = -(y * scale) + 1;
                        }
                        else if (yUnits == "fraction") {
                            style["graphicYOffset"] =  -height * (1 - y) + 1;
                        }
                    }

                    style["graphicWidth"] = width;
                    style["graphicHeight"] = height;
                    break;

                case "balloonstyle":
                    var balloonStyle = OpenLayers.Util.getXmlNodeValue(
                                            styleTypeNode);
                    if (balloonStyle) {
                        style["balloonStyle"] = balloonStyle.replace(
                                       this.regExes.straightBracket, "${$1}");
                    }
                    break;
                case "labelstyle":
                    var kmlColor = this.parseProperty(styleTypeNode, "*", "color");
                    var color = this.parseKmlColor(kmlColor);
                    if (color) {
                        style["fontColor"] = color.color;
                        style["fontOpacity"] = color.opacity;
                    }
                    break;

                default:
            }
        }

        // Some polygons have no line color, so we use the fillColor for that
        if (!style["strokeColor"] && style["fillColor"]) {
            style["strokeColor"] = style["fillColor"];
        }

        var id = node.getAttribute("id");
        if (id && style) {
            style.id = id;
        }

        return style;
    },

    /**
     * Method: parseStyleMaps
     * Looks for <Style> nodes in the data and parses them
     * Also parses <StyleMap> nodes, but only uses the 'normal' key
     * 
     * Parameters: 
     * nodes    - {Array} of {DOMElement} data to read/parse.
     * options  - {Object} Hash of options
     * 
     */
    parseStyleMaps: function(nodes, options) {
        // Only the default or "normal" part of the StyleMap is processed now
        // To do the select or "highlight" bit, we'd need to change lots more

        for(var i=0, len=nodes.length; i<len; i++) {
            var node = nodes[i];
            var pairs = this.getElementsByTagNameNS(node, "*", 
                            "Pair");

            var id = node.getAttribute("id");
            for (var j=0, jlen=pairs.length; j<jlen; j++) {
                var pair = pairs[j];
                // Use the shortcut in the SLD format to quickly retrieve the 
                // value of a node. Maybe it's good to have a method in 
                // Format.XML to do this
                var key = this.parseProperty(pair, "*", "key");
                var styleUrl = this.parseProperty(pair, "*", "styleUrl");

                if (styleUrl && key == "normal") {
                    this.styles[(options.styleBaseUrl || "") + "#" + id] =
                        this.styles[(options.styleBaseUrl || "") + styleUrl];
                }

                if (styleUrl && key == "highlight") {
                    // TODO: implement the "select" part
                }

            }
        }

    },


    /**
     * Method: parseFeatures
     * Loop through all Placemark nodes and parse them.
     * Will create a list of features
     * 
     * Parameters: 
     * nodes    - {Array} of {DOMElement} data to read/parse.
     * options  - {Object} Hash of options
     * 
     */
    parseFeatures: function(nodes, options) {
        var features = [];
        for(var i=0, len=nodes.length; i<len; i++) {
            var featureNode = nodes[i];
            var feature = this.parseFeature.apply(this,[featureNode]) ;
            if(feature) {

                // Create reference to styleUrl 
                if (this.extractStyles && feature.attributes &&
                    feature.attributes.styleUrl) {
                    feature.style = this.getStyle(feature.attributes.styleUrl, options);
                }

                if (this.extractStyles) {
                    // Make sure that <Style> nodes within a placemark are 
                    // processed as well
                    var inlineStyleNode = this.getElementsByTagNameNS(featureNode,
                                                        "*",
                                                        "Style")[0];
                    if (inlineStyleNode) {
                        var inlineStyle= this.parseStyle(inlineStyleNode);
                        if (inlineStyle) {
                            feature.style = OpenLayers.Util.extend(
                                feature.style, inlineStyle
                            );
                        }
                    }
                }

                // check if gx:Track elements should be parsed
                if (this.extractTracks) {
                    var tracks = this.getElementsByTagNameNS(
                        featureNode, this.namespaces.gx, "Track"
                    );
                    if (tracks && tracks.length > 0) {
                        var track = tracks[0];
                        var container = {
                            features: [],
                            feature: feature
                        };
                        this.readNode(track, container);
                        if (container.features.length > 0) {
                            features.push.apply(features, container.features);
                        }
                    }
                } else {
                    // add feature to list of features
                    features.push(feature);                    
                }
            } else {
                throw "Bad Placemark: " + i;
            }
        }

        // add new features to existing feature list
        this.features = this.features.concat(features);
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
        "kml": {
            "when": function(node, container) {
                container.whens.push(OpenLayers.Date.parse(
                    this.getChildValue(node)
                ));
            },
            "_trackPointAttribute": function(node, container) {
                var name = node.nodeName.split(":").pop();
                container.attributes[name].push(this.getChildValue(node));
            }
        },
        "gx": {
            "Track": function(node, container) {
                var obj = {
                    whens: [],
                    points: [],
                    angles: []
                };
                if (this.trackAttributes) {
                    var name;
                    obj.attributes = {};
                    for (var i=0, ii=this.trackAttributes.length; i<ii; ++i) {
                        name = this.trackAttributes[i];
                        obj.attributes[name] = [];
                        if (!(name in this.readers.kml)) {
                            this.readers.kml[name] = this.readers.kml._trackPointAttribute;
                        }
                    }
                }
                this.readChildNodes(node, obj);
                if (obj.whens.length !== obj.points.length) {
                    throw new Error("gx:Track with unequal number of when (" + obj.whens.length + ") and gx:coord (" + obj.points.length + ") elements.");
                }
                var hasAngles = obj.angles.length > 0;
                if (hasAngles && obj.whens.length !== obj.angles.length) {
                    throw new Error("gx:Track with unequal number of when (" + obj.whens.length + ") and gx:angles (" + obj.angles.length + ") elements.");
                }
                var feature, point, angles;
                for (var i=0, ii=obj.whens.length; i<ii; ++i) {
                    feature = container.feature.clone();
                    feature.fid = container.feature.fid || container.feature.id;
                    point = obj.points[i];
                    feature.geometry = point;
                    if ("z" in point) {
                        feature.attributes.altitude = point.z;
                    }
                    if (this.internalProjection && this.externalProjection) {
                        feature.geometry.transform(
                            this.externalProjection, this.internalProjection
                        ); 
                    }
                    if (this.trackAttributes) {
                        for (var j=0, jj=this.trackAttributes.length; j<jj; ++j) {
                            feature.attributes[name] = obj.attributes[this.trackAttributes[j]][i];
                        }
                    }
                    feature.attributes.when = obj.whens[i];
                    feature.attributes.trackId = container.feature.id;
                    if (hasAngles) {
                        angles = obj.angles[i];
                        feature.attributes.heading = parseFloat(angles[0]);
                        feature.attributes.tilt = parseFloat(angles[1]);
                        feature.attributes.roll = parseFloat(angles[2]);
                    }
                    container.features.push(feature);
                }
            },
            "coord": function(node, container) {
                var str = this.getChildValue(node);
                var coords = str.replace(this.regExes.trimSpace, "").split(/\s+/);
                var point = new OpenLayers.Geometry.Point(coords[0], coords[1]);
                if (coords.length > 2) {
                    point.z = parseFloat(coords[2]);
                }
                container.points.push(point);
            },
            "angles": function(node, container) {
                var str = this.getChildValue(node);
                var parts = str.replace(this.regExes.trimSpace, "").split(/\s+/);
                container.angles.push(parts);
            }
        }
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
        for(var i=0, len=order.length; i<len; ++i) {
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
                    if (this.internalProjection && this.externalProjection) {
                        geometry.transform(this.externalProjection, 
                                           this.internalProjection); 
                    }                       
                } else {
                    OpenLayers.Console.error(OpenLayers.i18n(
                                "unsupportedGeometryType", {'geomType':type}));
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

        var fid = node.getAttribute("id") || node.getAttribute("name");
        if(fid != null) {
            feature.fid = fid;
        }

        return feature;
    },        
    
    /**
     * Method: getStyle
     * Retrieves a style from a style hash using styleUrl as the key
     * If the styleUrl doesn't exist yet, we try to fetch it 
     * Internet
     * 
     * Parameters: 
     * styleUrl  - {String} URL of style
     * options   - {Object} Hash of options 
     *
     * Returns:
     * {Object}  - (reference to) Style hash
     */
    getStyle: function(styleUrl, options) {

        var styleBaseUrl = OpenLayers.Util.removeTail(styleUrl);

        var newOptions = OpenLayers.Util.extend({}, options);
        newOptions.depth++;
        newOptions.styleBaseUrl = styleBaseUrl;

        // Fetch remote Style URLs (if not fetched before) 
        if (!this.styles[styleUrl] 
                && !OpenLayers.String.startsWith(styleUrl, "#") 
                && newOptions.depth <= this.maxDepth
                && !this.fetched[styleBaseUrl] ) {

            var data = this.fetchLink(styleBaseUrl);
            if (data) {
                this.parseData(data, newOptions);
            }

        }

        // return requested style
        var style = OpenLayers.Util.extend({}, this.styles[styleUrl]);
        return style;
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
                var coordString = this.getChildValue(nodeList[0]);

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
                for(var i=0, len=nodeList.length; i<len; ++i) {
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
            for(var i=0, len=children.length; i<len; ++i ) {
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
       
        // Extended Data is parsed first.
        var edNodes = node.getElementsByTagName("ExtendedData");
        if (edNodes.length) {
            attributes = this.parseExtendedData(edNodes[0]);
        }
        
        // assume attribute nodes are type 1 children with a type 3 or 4 child
        var child, grandchildren, grandchild;
        var children = node.childNodes;

        for(var i=0, len=children.length; i<len; ++i) {
            child = children[i];
            if(child.nodeType == 1) {
                grandchildren = child.childNodes;
                if(grandchildren.length >= 1 && grandchildren.length <= 3) {
                    var grandchild;
                    switch (grandchildren.length) {
                        case 1:
                            grandchild = grandchildren[0];
                            break;
                        case 2:
                            var c1 = grandchildren[0];
                            var c2 = grandchildren[1];
                            grandchild = (c1.nodeType == 3 || c1.nodeType == 4) ?
                                c1 : c2;
                            break;
                        case 3:
                        default:
                            grandchild = grandchildren[1];
                            break;
                    }
                    if(grandchild.nodeType == 3 || grandchild.nodeType == 4) {
                        var name = (child.prefix) ?
                                child.nodeName.split(":")[1] :
                                child.nodeName;
                        var value = OpenLayers.Util.getXmlNodeValue(grandchild);
                        if (value) {
                            value = value.replace(this.regExes.trimSpace, "");
                            attributes[name] = value;
                        }
                    }
                } 
            }
        }
        return attributes;
    },

    /**
     * Method: parseExtendedData
     * Parse ExtendedData from KML. Limited support for schemas/datatypes.
     *     See http://code.google.com/apis/kml/documentation/kmlreference.html#extendeddata
     *     for more information on extendeddata.
     */
    parseExtendedData: function(node) {
        var attributes = {};
        var i, len, data, key;
        var dataNodes = node.getElementsByTagName("Data");
        for (i = 0, len = dataNodes.length; i < len; i++) {
            data = dataNodes[i];
            key = data.getAttribute("name");
            var ed = {};
            var valueNode = data.getElementsByTagName("value");
            if (valueNode.length) {
                ed['value'] = this.getChildValue(valueNode[0]);
            }    
            var nameNode = data.getElementsByTagName("displayName");
            if (nameNode.length) {
                ed['displayName'] = this.getChildValue(nameNode[0]);
            }
            attributes[key] = ed;
        }
        var simpleDataNodes = node.getElementsByTagName("SimpleData");
        for (i = 0, len = simpleDataNodes.length; i < len; i++) {
            var ed = {};
            data = simpleDataNodes[i];
            key = data.getAttribute("name");
            ed['value'] = this.getChildValue(data);
            ed['displayName'] = key;
            attributes[key] = ed;
        }
        
        return attributes;    
    },
    
    /**
     * Method: parseProperty
     * Convenience method to find a node and return its value
     *
     * Parameters:
     * xmlNode    - {<DOMElement>}
     * namespace  - {String} namespace of the node to find
     * tagName    - {String} name of the property to parse
     * 
     * Returns:
     * {String} The value for the requested property (defaults to null)
     */    
    parseProperty: function(xmlNode, namespace, tagName) {
        var value;
        var nodeList = this.getElementsByTagNameNS(xmlNode, namespace, tagName);
        try {
            value = OpenLayers.Util.getXmlNodeValue(nodeList[0]);
        } catch(e) {
            value = null;
        }
     
        return value;
    },                                                              

    /**
     * APIMethod: write
     * Accept Feature Collection, and return a string. 
     * 
     * Parameters:
     * features - {Array(<OpenLayers.Feature.Vector>)} An array of features.
     *
     * Returns:
     * {String} A KML string.
     */
    write: function(features) {
        if(!(OpenLayers.Util.isArray(features))) {
            features = [features];
        }
        var kml = this.createElementNS(this.kmlns, "kml");
        var folder = this.createFolderXML();
        for(var i=0, len=features.length; i<len; ++i) {
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
        // Folder
        var folder = this.createElementNS(this.kmlns, "Folder");

        // Folder name
        if (this.foldersName) {
            var folderName = this.createElementNS(this.kmlns, "name");
            var folderNameText = this.createTextNode(this.foldersName); 
            folderName.appendChild(folderNameText);
            folder.appendChild(folderName);
        }

        // Folder description
        if (this.foldersDesc) {
            var folderDesc = this.createElementNS(this.kmlns, "description");        
            var folderDescText = this.createTextNode(this.foldersDesc); 
            folderDesc.appendChild(folderDescText);
            folder.appendChild(folderDesc);
        }

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
        var name = feature.style && feature.style.label ? feature.style.label :
                   feature.attributes.name || feature.id;
        placemarkName.appendChild(this.createTextNode(name));

        // Placemark description
        var placemarkDesc = this.createElementNS(this.kmlns, "description");
        var desc = feature.attributes.description || this.placemarksDesc;
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
            for(var i=0, len=rings.length; i<len; ++i) {
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
            for(var i=0, len=geometry.components.length; i<len; ++i) {
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
                parts[i] = this.buildCoordinates(point);
            }
            path = parts.join(" ");
        } else {
            // Point
            path = this.buildCoordinates(geometry);
        }
        
        var txtNode = this.createTextNode(path);
        coordinatesNode.appendChild(txtNode);
        
        return coordinatesNode;
    },    
    
    /**
     * Method: buildCoordinates
     *
     * Parameters:
     * point - {<OpenLayers.Geometry.Point>}
     *
     * Returns
     * {String} a coordinate pair
     */
    buildCoordinates: function(point) {
        if (this.internalProjection && this.externalProjection) {
            point = point.clone();
            point.transform(this.internalProjection, 
                               this.externalProjection);
        }
        return point.x + "," + point.y;                     
    },

    CLASS_NAME: "OpenLayers.Format.KML" 
});
