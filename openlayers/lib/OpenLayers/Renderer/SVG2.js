/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Renderer/NG.js
 */

/**
 * Class: OpenLayers.Renderer.SVG2
 * 
 * Inherits from:
 *  - <OpenLayers.Renderer.NG>
 */
OpenLayers.Renderer.SVG2 = OpenLayers.Class(OpenLayers.Renderer.NG, {

    /** 
     * Property: xmlns
     * {String}
     */
    xmlns: "http://www.w3.org/2000/svg",
    
    /**
     * Property: xlinkns
     * {String}
     */
    xlinkns: "http://www.w3.org/1999/xlink",

    /**
     * Property: symbolMetrics
     * {Object} Cache for symbol metrics according to their svg coordinate
     *     space. This is an object keyed by the symbol's id, and values are
     *     an object with size, x and y properties.
     */
    symbolMetrics: null,
    
    /**
     * Constant: labelNodeType
     * {String} The node type for text label containers.
     */
    labelNodeType: "g",

    /**
     * Constructor: OpenLayers.Renderer.SVG2
     * 
     * Parameters:
     * containerID - {String}
     */
    initialize: function(containerID) {
        if (!this.supported()) { 
            return; 
        }
        OpenLayers.Renderer.Elements.prototype.initialize.apply(this, 
                                                                arguments);
        
        this.symbolMetrics = {};
    },

    /**
     * APIMethod: supported
     * 
     * Returns:
     * {Boolean} Whether or not the browser supports the SVG renderer
     */
    supported: function() {
        var svgFeature = "http://www.w3.org/TR/SVG11/feature#";
        return (document.implementation && 
           (document.implementation.hasFeature("org.w3c.svg", "1.0") || 
            document.implementation.hasFeature(svgFeature + "SVG", "1.1") || 
            document.implementation.hasFeature(svgFeature + "BasicStructure", "1.1") ));
    },    

    /**
     * Method: updateDimensions
     *
     * Parameters:
     * zoomChanged - {Boolean}
     */
    updateDimensions: function(zoomChanged) {
        OpenLayers.Renderer.NG.prototype.updateDimensions.apply(this, arguments);
        
        var res = this.getResolution();
        
        var width = this.extent.getWidth();
        var height = this.extent.getHeight();
        
        var extentString = [
            this.extent.left,
            -this.extent.top,
            width,
            height
        ].join(" ");
        this.rendererRoot.setAttributeNS(null, "viewBox", extentString);
        this.rendererRoot.setAttributeNS(null, "width", width / res);
        this.rendererRoot.setAttributeNS(null, "height", height / res);

        if (zoomChanged === true) {
            // update styles for the new resolution
            var i, len;
            var nodes = this.vectorRoot.childNodes;
            for (i=0, len=nodes.length; i<len; ++i) {
                this.setStyle(nodes[i]);
            }
            var textNodes = this.textRoot.childNodes;
            var label;
            for (i=0, len=textNodes.length; i<len; ++i) {
                label = textNodes[i];
                this.drawText(label, label._style,
                    new OpenLayers.Geometry.Point(label._x, label._y)
                );
            }
        }
    },
    
    /** 
     * Method: getNodeType
     * 
     * Parameters:
     * geometry - {<OpenLayers.Geometry>}
     * style - {Object}
     * 
     * Returns:
     * {String} The corresponding node type for the specified geometry
     */
    getNodeType: function(geometry, style) {
        var nodeType = null;
        switch (geometry.CLASS_NAME) {
            case "OpenLayers.Geometry.Point":
                if (style.externalGraphic) {
                    nodeType = "image";
                } else if (this.isComplexSymbol(style.graphicName)) {
                    nodeType = "svg";
                } else {
                    nodeType = "circle";
                }
                break;
            case "OpenLayers.Geometry.Rectangle":
                nodeType = "rect";
                break;
            case "OpenLayers.Geometry.LineString":
                nodeType = "polyline";
                break;
            case "OpenLayers.Geometry.LinearRing":
                nodeType = "polygon";
                break;
            case "OpenLayers.Geometry.Polygon":
            case "OpenLayers.Geometry.Curve":
            case "OpenLayers.Geometry.Surface":
                nodeType = "path";
                break;
            default:
                break;
        }
        return nodeType;
    },

    /** 
     * Method: setStyle
     * Use to set all the style attributes to a SVG node.
     * 
     * Takes care to adjust stroke width and point radius to be
     * resolution-relative
     *
     * Parameters:
     * node - {SVGDomElement} An SVG element to decorate
     * style - {Object}
     * options - {Object} Currently supported options include 
     *                              'isFilled' {Boolean} and
     *                              'isStroked' {Boolean}
     */
    setStyle: function(node, style, options) {
        style = style  || node._style;
        options = options || node._options;
        var resolution = this.getResolution();
        var r = node._radius;
        var widthFactor = resolution;
        if (node._geometryClass == "OpenLayers.Geometry.Point" && r) {
            node.style.visibility = "";
            if (style.graphic === false) {
                node.style.visibility = "hidden";
            } else if (style.externalGraphic) {
                
                if (style.graphicTitle) {
                    node.setAttributeNS(null, "title", style.graphicTitle);
                    //Standards-conformant SVG 
                    var label = this.nodeFactory(null, "title"); 
                    label.textContent = style.graphicTitle; 
                    node.appendChild(label); 
                }
                if (style.graphicWidth && style.graphicHeight) {
                    node.setAttributeNS(null, "preserveAspectRatio", "none");
                }
                var width = style.graphicWidth || style.graphicHeight;
                var height = style.graphicHeight || style.graphicWidth;
                width = width ? width : style.pointRadius*2;
                height = height ? height : style.pointRadius*2;
                width *= resolution;
                height *= resolution;
                
                var xOffset = (style.graphicXOffset != undefined) ?
                    style.graphicXOffset * resolution : -(0.5 * width);
                var yOffset = (style.graphicYOffset != undefined) ?
                    style.graphicYOffset * resolution : -(0.5 * height);

                var opacity = style.graphicOpacity || style.fillOpacity;
                
                node.setAttributeNS(null, "x", node._x + xOffset);
                node.setAttributeNS(null, "y", node._y + yOffset);
                node.setAttributeNS(null, "width", width);
                node.setAttributeNS(null, "height", height);
                node.setAttributeNS(this.xlinkns, "href", style.externalGraphic);
                node.setAttributeNS(null, "style", "opacity: "+opacity);
                node.onclick = OpenLayers.Renderer.SVG2.preventDefault;
            } else if (this.isComplexSymbol(style.graphicName)) {
                // the symbol viewBox is three times as large as the symbol
                var offset = style.pointRadius * 3 * resolution;
                var size = offset * 2;
                var src = this.importSymbol(style.graphicName);
                widthFactor = this.symbolMetrics[src.id].size * 3 / size * resolution;
                
                // remove the node from the dom before we modify it. This
                // prevents various rendering issues in Safari and FF
                var parent = node.parentNode;
                var nextSibling = node.nextSibling;
                if(parent) {
                    parent.removeChild(node);
                }
                
                // The more appropriate way to implement this would be use/defs, 
                // but due to various issues in several browsers, it is safer to 
                // copy the symbols instead of referencing them.  
                // See e.g. ticket http://trac.osgeo.org/openlayers/ticket/2985  
                // and this email thread 
                // http://osgeo-org.1803224.n2.nabble.com/Select-Control-Ctrl-click-on-Feature-with-a-graphicName-opens-new-browser-window-tc5846039.html 
                node.firstChild && node.removeChild(node.firstChild); 
                node.appendChild(src.firstChild.cloneNode(true)); 
                node.setAttributeNS(null, "viewBox", src.getAttributeNS(null, "viewBox")); 

                node.setAttributeNS(null, "width", size);
                node.setAttributeNS(null, "height", size);
                node.setAttributeNS(null, "x", node._x - offset);
                node.setAttributeNS(null, "y", node._y - offset);
                
                // now that the node has all its new properties, insert it
                // back into the dom where it was
                if(nextSibling) {
                    parent.insertBefore(node, nextSibling);
                } else if(parent) {
                    parent.appendChild(node);
                }
            } else {
                node.setAttributeNS(null, "r", style.pointRadius * resolution);
            }

            var rotation = style.rotation;
            if (rotation !== undefined || node._rotation !== undefined) {
                node._rotation = rotation;
                rotation |= 0;
                if (node.nodeName !== "svg") { 
                    node.setAttributeNS(null, "transform", 
                        ["rotate(", rotation, node._x, node._y, ")"].join(" ")
                    ); 
                } else {
                    var metrics = this.symbolMetrics[src.id]; 
                    node.firstChild.setAttributeNS(null, "transform",
                        ["rotate(", rotation, metrics.x, metrics.y, ")"].join(" ")
                    );
                }
            }
        }
        
        if (options.isFilled) {
            node.setAttributeNS(null, "fill", style.fillColor);
            node.setAttributeNS(null, "fill-opacity", style.fillOpacity);
        } else {
            node.setAttributeNS(null, "fill", "none");
        }

        if (options.isStroked) {
            node.setAttributeNS(null, "stroke", style.strokeColor);
            node.setAttributeNS(null, "stroke-opacity", style.strokeOpacity);
            node.setAttributeNS(null, "stroke-width", style.strokeWidth * widthFactor);
            node.setAttributeNS(null, "stroke-linecap", style.strokeLinecap || "round");
            // Hard-coded linejoin for now, to make it look the same as in VML.
            // There is no strokeLinejoin property yet for symbolizers.
            node.setAttributeNS(null, "stroke-linejoin", "round");
            style.strokeDashstyle && node.setAttributeNS(null,
                "stroke-dasharray", this.dashStyle(style, widthFactor));
        } else {
            node.setAttributeNS(null, "stroke", "none");
        }
        
        if (style.pointerEvents) {
            node.setAttributeNS(null, "pointer-events", style.pointerEvents);
        }
                
        if (style.cursor != null) {
            node.setAttributeNS(null, "cursor", style.cursor);
        }
        
        return node;
    },

    /** 
     * Method: dashStyle
     * 
     * Parameters:
     * style - {Object}
     * widthFactor - {Number}
     * 
     * Returns:
     * {String} A SVG compliant 'stroke-dasharray' value
     */
    dashStyle: function(style, widthFactor) {
        var w = style.strokeWidth * widthFactor;
        var str = style.strokeDashstyle;
        switch (str) {
            case 'solid':
                return 'none';
            case 'dot':
                return [widthFactor, 4 * w].join();
            case 'dash':
                return [4 * w, 4 * w].join();
            case 'dashdot':
                return [4 * w, 4 * w, widthFactor, 4 * w].join();
            case 'longdash':
                return [8 * w, 4 * w].join();
            case 'longdashdot':
                return [8 * w, 4 * w, widthFactor, 4 * w].join();
            default:
                var parts = OpenLayers.String.trim(str).split(/\s+/g);
                for (var i=0, ii=parts.length; i<ii; i++) {
                    parts[i] = parts[i] * widthFactor;
                }
                return parts.join();            
        }
    },
    
    /** 
     * Method: createNode
     * 
     * Parameters:
     * type - {String} Kind of node to draw
     * id - {String} Id for node
     * 
     * Returns:
     * {DOMElement} A new node of the given type and id
     */
    createNode: function(type, id) {
        var node = document.createElementNS(this.xmlns, type);
        if (id) {
            node.setAttributeNS(null, "id", id);
        }
        return node;    
    },
    
    /** 
     * Method: nodeTypeCompare
     * 
     * Parameters:
     * node - {SVGDomElement} An SVG element
     * type - {String} Kind of node
     * 
     * Returns:
     * {Boolean} Whether or not the specified node is of the specified type
     */
    nodeTypeCompare: function(node, type) {
        return (type == node.nodeName);
    },
   
    /**
     * Method: createRenderRoot
     * 
     * Returns:
     * {DOMElement} The specific render engine's root element
     */
    createRenderRoot: function() {
        return this.nodeFactory(this.container.id + "_svgRoot", "svg");
    },

    /**
     * Method: createRoot
     * 
     * Parameter:
     * suffix - {String} suffix to append to the id
     * 
     * Returns:
     * {DOMElement}
     */
    createRoot: function(suffix) {
        return this.nodeFactory(this.container.id + suffix, "g");
    },

    /**
     * Method: createDefs
     *
     * Returns:
     * {DOMElement} The element to which we'll add the symbol definitions
     */
    createDefs: function() {
        var defs = this.nodeFactory(this.container.id + "_defs", "defs");
        this.rendererRoot.appendChild(defs);
        return defs;
    },

    /**************************************
     *                                    *
     *     GEOMETRY DRAWING FUNCTIONS     *
     *                                    *
     **************************************/

    /**
     * Method: drawPoint
     * This method is only called by the renderer itself.
     * 
     * Parameters: 
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     * 
     * Returns:
     * {DOMElement} or false if the renderer could not draw the point
     */ 
    drawPoint: function(node, geometry) {
        return this.drawCircle(node, geometry, 1);
    },

    /**
     * Method: drawCircle
     * This method is only called by the renderer itself.
     * 
     * Parameters: 
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     * radius - {Float}
     * 
     * Returns:
     * {DOMElement} or false if the renderer could not draw the circle
     */
    drawCircle: function(node, geometry, radius) {
        var x = geometry.x;
        var y = -geometry.y;
        node.setAttributeNS(null, "cx", x);
        node.setAttributeNS(null, "cy", y);
        node._x = x;
        node._y = y;
        node._radius = radius;
        return node;
    },
    
    /**
     * Method: drawLineString
     * This method is only called by the renderer itself.
     * 
     * Parameters: 
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     * 
     * Returns:
     * {DOMElement} or null if the renderer could not draw all components of
     *     the linestring, or false if nothing could be drawn
     */ 
    drawLineString: function(node, geometry) {
        var path = this.getComponentsString(geometry.components);
        node.setAttributeNS(null, "points", path);
        return node;
    },
    
    /**
     * Method: drawLinearRing
     * This method is only called by the renderer itself.
     * 
     * Parameters: 
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     * 
     * Returns:
     * {DOMElement} or null if the renderer could not draw all components
     *     of the linear ring, or false if nothing could be drawn
     */ 
    drawLinearRing: function(node, geometry) {
        var path = this.getComponentsString(geometry.components);
        node.setAttributeNS(null, "points", path);
        return node;
    },
    
    /**
     * Method: drawPolygon
     * This method is only called by the renderer itself.
     * 
     * Parameters: 
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     * 
     * Returns:
     * {DOMElement} or null if the renderer could not draw all components
     *     of the polygon, or false if nothing could be drawn
     */ 
    drawPolygon: function(node, geometry) {
        var d = [];
        var draw = true;
        var complete = true;
        var linearRingResult, path;
        for (var j=0, len=geometry.components.length; j<len; j++) {
            d.push("M");
            path = this.getComponentsString(
                geometry.components[j].components, " ");
            d.push(path);
        }
        d.push("z");
        node.setAttributeNS(null, "d", d.join(" "));
        node.setAttributeNS(null, "fill-rule", "evenodd");
        return node;
    },
    
    /**
     * Method: drawRectangle
     * This method is only called by the renderer itself.
     * 
     * Parameters: 
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     * 
     * Returns:
     * {DOMElement} or false if the renderer could not draw the rectangle
     */ 
    drawRectangle: function(node, geometry) {
        node.setAttributeNS(null, "x", geometry.x);
        node.setAttributeNS(null, "y", -geometry.y);
        node.setAttributeNS(null, "width", geometry.width);
        node.setAttributeNS(null, "height", geometry.height);
        return node;
    },
    
    /**
     * Method: drawSurface
     * This method is only called by the renderer itself.
     * 
     * Parameters: 
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     * 
     * Returns:
     * {DOMElement} or false if the renderer could not draw the surface
     */ 
    drawSurface: function(node, geometry) {

        // create the svg path string representation
        var d = [];
        var draw = true;
        for (var i=0, len=geometry.components.length; i<len; i++) {
            if ((i%3) == 0 && (i/3) == 0) {
                var component = this.getShortString(geometry.components[i]);
                d.push("M", component);
            } else if ((i%3) == 1) {
                var component = this.getShortString(geometry.components[i]);
                d.push("C", component);
            } else {
                var component = this.getShortString(geometry.components[i]);
                d.push(component);
            }
        }
        d.push("Z");
        node.setAttributeNS(null, "d", d.join(" "));
        return node;
    },
    
    /**
     * Method: drawText
     * Function for drawing text labels.
     * This method is only called by the renderer itself.
     *
     * Parameters:
     * featureId - {String|DOMElement}
     * style - {Object}
     * location - {<OpenLayers.Geometry.Point>}, will be modified inline
     *
     * Returns:
     * {DOMElement} container holding the text label
     */
    drawText: function(featureId, style, location) {
        var g = OpenLayers.Renderer.NG.prototype.drawText.apply(this, arguments);
        var text = g.firstChild ||
            this.nodeFactory(featureId + this.LABEL_ID_SUFFIX + "_text", "text");

        var res = this.getResolution();
        text.setAttributeNS(null, "x", location.x / res);
        text.setAttributeNS(null, "y", - location.y / res);
        g.setAttributeNS(null, "transform", "scale(" + res + ")");

        if (style.fontColor) {
            text.setAttributeNS(null, "fill", style.fontColor);
        }
        if (style.fontOpacity) {
            text.setAttributeNS(null, "opacity", style.fontOpacity);
        }
        if (style.fontFamily) {
            text.setAttributeNS(null, "font-family", style.fontFamily);
        }
        if (style.fontSize) {
            text.setAttributeNS(null, "font-size", style.fontSize);
        }
        if (style.fontWeight) {
            text.setAttributeNS(null, "font-weight", style.fontWeight);
        }
        if (style.fontStyle) {
            text.setAttributeNS(null, "font-style", style.fontStyle);
        }
        if (style.labelSelect === true) {
            text.setAttributeNS(null, "pointer-events", "visible");
            text._featureId = featureId;
        } else {
            text.setAttributeNS(null, "pointer-events", "none");
        }
        var align = style.labelAlign || "cm";
        text.setAttributeNS(null, "text-anchor",
            OpenLayers.Renderer.SVG2.LABEL_ALIGN[align[0]] || "middle");

        if (OpenLayers.IS_GECKO === true) {
            text.setAttributeNS(null, "dominant-baseline",
                OpenLayers.Renderer.SVG2.LABEL_ALIGN[align[1]] || "central");
        }

        var labelRows = style.label.split('\n');
        var numRows = labelRows.length;
        while (text.childNodes.length > numRows) {
            text.removeChild(text.lastChild);
        }
        for (var i = 0; i < numRows; i++) {
            var tspan = text.childNodes[i] ||
                this.nodeFactory(featureId + this.LABEL_ID_SUFFIX + "_tspan_" + i, "tspan");
            if (style.labelSelect === true) {
                tspan._featureId = featureId;
            }
            if (OpenLayers.IS_GECKO === false) {
                tspan.setAttributeNS(null, "baseline-shift",
                    OpenLayers.Renderer.SVG2.LABEL_VSHIFT[align[1]] || "-35%");
            }
            tspan.setAttribute("x", location.x / res);
            if (i == 0) {
                var vfactor = OpenLayers.Renderer.SVG2.LABEL_VFACTOR[align[1]];
                if (vfactor == null) {
                    vfactor = -.5;
                }
                tspan.setAttribute("dy", (vfactor*(numRows-1)) + "em");
            } else {
                tspan.setAttribute("dy", "1em");
            }
            tspan.textContent = (labelRows[i] === '') ? ' ' : labelRows[i];
            if (!tspan.parentNode) {
                text.appendChild(tspan);
            }
        }

        if (!text.parentNode) {
            g.appendChild(text);
        }

        return g;
    },
    
    /** 
     * Method: getComponentString
     * 
     * Parameters:
     * components - {Array(<OpenLayers.Geometry.Point>)} Array of points
     * separator - {String} character between coordinate pairs. Defaults to ","
     * 
     * Returns:
     * {Object} hash with properties "path" (the string created from the
     *     components and "complete" (false if the renderer was unable to
     *     draw all components)
     */
    getComponentsString: function(components, separator) {
        var len = components.length;
        var strings = new Array(len);
        for (var i=0; i<len; i++) {
            strings[i] = this.getShortString(components[i]);
        }

        return strings.join(separator || ",");
    },
    
    /** 
     * Method: getShortString
     * 
     * Parameters:
     * point - {<OpenLayers.Geometry.Point>}
     * 
     * Returns:
     * {String} or false if point is outside the valid range
     */
    getShortString: function(point) {
        return point.x + "," + (-point.y);
    },
    
    /**
     * Method: importSymbol
     * add a new symbol definition from the rendererer's symbol hash
     * 
     * Parameters:
     * graphicName - {String} name of the symbol to import
     * 
     * Returns:
     * {DOMElement} - the imported symbol
     */      
    importSymbol: function (graphicName)  {
        if (!this.defs) {
            // create svg defs tag
            this.defs = this.createDefs();
        }
        var id = this.container.id + "-" + graphicName;
        
        // check if symbol already exists in the defs
        var existing = document.getElementById(id);
        if (existing != null) {
            return existing;
        }
        
        var symbol = OpenLayers.Renderer.symbol[graphicName];
        if (!symbol) {
            throw new Error(graphicName + ' is not a valid symbol name');
        }

        var symbolNode = this.nodeFactory(id, "symbol");
        var node = this.nodeFactory(null, "polygon");
        symbolNode.appendChild(node);
        var symbolExtent = new OpenLayers.Bounds(
                                    Number.MAX_VALUE, Number.MAX_VALUE, 0, 0);

        var points = [];
        var x,y;
        for (var i=0, len=symbol.length; i<len; i=i+2) {
            x = symbol[i];
            y = symbol[i+1];
            symbolExtent.left = Math.min(symbolExtent.left, x);
            symbolExtent.bottom = Math.min(symbolExtent.bottom, y);
            symbolExtent.right = Math.max(symbolExtent.right, x);
            symbolExtent.top = Math.max(symbolExtent.top, y);
            points.push(x, ",", y);
        }
        
        node.setAttributeNS(null, "points", points.join(" "));
        
        var width = symbolExtent.getWidth();
        var height = symbolExtent.getHeight();
        // create a viewBox three times as large as the symbol itself,
        // to allow for strokeWidth being displayed correctly at the corners.
        var viewBox = [symbolExtent.left - width,
                        symbolExtent.bottom - height, width * 3, height * 3];
        symbolNode.setAttributeNS(null, "viewBox", viewBox.join(" "));
        this.symbolMetrics[id] = {
            size: Math.max(width, height),
            x: symbolExtent.getCenterLonLat().lon,
            y: symbolExtent.getCenterLonLat().lat
        };
        
        this.defs.appendChild(symbolNode);
        return symbolNode;
    },
    
    /**
     * Method: getFeatureIdFromEvent
     * 
     * Parameters:
     * evt - {Object} An <OpenLayers.Event> object
     *
     * Returns:
     * {<OpenLayers.Geometry>} A geometry from an event that 
     *     happened on a layer.
     */
    getFeatureIdFromEvent: function(evt) {
        var featureId = OpenLayers.Renderer.Elements.prototype.getFeatureIdFromEvent.apply(this, arguments);
        if(!featureId) {
            var target = evt.target;
            featureId = target.parentNode && target != this.rendererRoot &&
                target.parentNode._featureId;
        }
        return featureId;
    },

    CLASS_NAME: "OpenLayers.Renderer.SVG2"
});

/**
 * Constant: OpenLayers.Renderer.SVG2.LABEL_ALIGN
 * {Object}
 */
OpenLayers.Renderer.SVG2.LABEL_ALIGN = {
    "l": "start",
    "r": "end",
    "b": "bottom",
    "t": "hanging"
};

/**
 * Constant: OpenLayers.Renderer.SVG2.LABEL_VSHIFT
 * {Object}
 */
OpenLayers.Renderer.SVG2.LABEL_VSHIFT = {
    // according to
    // http://www.w3.org/Graphics/SVG/Test/20061213/htmlObjectHarness/full-text-align-02-b.html
    // a baseline-shift of -70% shifts the text exactly from the
    // bottom to the top of the baseline, so -35% moves the text to
    // the center of the baseline.
    "t": "-70%",
    "b": "0"    
};

/**
 * Constant: OpenLayers.Renderer.SVG2.LABEL_VFACTOR
 * {Object}
 */
OpenLayers.Renderer.SVG2.LABEL_VFACTOR = {
    "t": 0,
    "b": -1
};

/** 
 * Function: OpenLayers.Renderer.SVG2.preventDefault 
 * Used to prevent default events (especially opening images in a new tab on 
 * ctrl-click) from being executed for externalGraphic and graphicName symbols 
 */ 
OpenLayers.Renderer.SVG2.preventDefault = function(e) { 
    e.preventDefault && e.preventDefault(); 
};
