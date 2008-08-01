/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Renderer/Elements.js
 */

/**
 * Class: OpenLayers.Renderer.SVG
 * 
 * Inherits:
 *  - <OpenLayers.Renderer.Elements>
 */
OpenLayers.Renderer.SVG = OpenLayers.Class(OpenLayers.Renderer.Elements, {

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
     * Constant: MAX_PIXEL
     * {Integer} Firefox has a limitation where values larger or smaller than  
     *           about 15000 in an SVG document lock the browser up. This 
     *           works around it.
      */
    MAX_PIXEL: 15000,

    /** 
     * Property: localResolution
     * {Float}
     */
    localResolution: null,
    
    /**
     * Property: symbolSize
     * {Object} Cache for symbol sizes according to their svg coordinate space
     */
    symbolSize: {},

    /**
     * Constructor: OpenLayers.Renderer.SVG
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
    },

    /**
     * APIMethod: destroy
     */
    destroy: function() {
        OpenLayers.Renderer.Elements.prototype.destroy.apply(this, arguments);
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
     * Method: inValidRange
     * See #669 for more information
     *
     * Parameters:
     * x - {Integer}
     * y - {Integer}
     * 
     * Returns:
     * {Boolean} Whether or not the 'x' and 'y' coordinates are in the  
     *           valid range.
     */ 
    inValidRange: function(x, y) {
        return (x >= -this.MAX_PIXEL && x <= this.MAX_PIXEL &&
                y >= -this.MAX_PIXEL && y <= this.MAX_PIXEL);
    },

    /**
     * Method: setExtent
     * 
     * Parameters:
     * extent - {<OpenLayers.Bounds>}
     */
    setExtent: function(extent) {
        OpenLayers.Renderer.Elements.prototype.setExtent.apply(this, 
                                                               arguments);
        
        var resolution = this.getResolution();

        // If the resolution has changed, start over changing the corner, because
        // the features will redraw.
        if (!this.localResolution || resolution != this.localResolution) {
            this.left = -extent.left / resolution;
            this.top = extent.top / resolution;
        }
        
        var left = 0;
        var top = 0;

        // If the resolution has not changed, we already have features, and we need
        // to adjust the viewbox to fit them.
        if (this.localResolution && resolution == this.localResolution) {
            left = (this.left) - (-extent.left / resolution);
            top  = (this.top) - (extent.top / resolution);
        }    
        
        // Store resolution for use later.
        this.localResolution = resolution;
        
        // Set the viewbox -- the left/top will be pixels-dragged-since-res change,
        // the width/height will be pixels.
        var extentString = left + " " + top + " " + 
                             this.size.w + " " + this.size.h;
        //var extentString = extent.left / resolution + " " + -extent.top / resolution + " " + 
        this.rendererRoot.setAttributeNS(null, "viewBox", extentString);
    },

    /**
     * Method: setSize
     * Sets the size of the drawing surface.
     * 
     * Parameters:
     * size - {<OpenLayers.Size>} The size of the drawing surface
     */
    setSize: function(size) {
        OpenLayers.Renderer.prototype.setSize.apply(this, arguments);
        
        this.rendererRoot.setAttributeNS(null, "width", this.size.w);
        this.rendererRoot.setAttributeNS(null, "height", this.size.h);
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
                    nodeType = "use";
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
        var r = parseFloat(node.getAttributeNS(null, "r"));
        var widthFactor = 1;
        var pos;
        if (node._geometryClass == "OpenLayers.Geometry.Point" && r) {
            if (style.externalGraphic) {
                pos = this.getPosition(node);
                
                if (style.graphicWidth && style.graphicHeight) {
                  node.setAttributeNS(null, "preserveAspectRatio", "none");
                }
                var width = style.graphicWidth || style.graphicHeight;
                var height = style.graphicHeight || style.graphicWidth;
                width = width ? width : style.pointRadius*2;
                height = height ? height : style.pointRadius*2;
                var xOffset = (style.graphicXOffset != undefined) ?
                    style.graphicXOffset : -(0.5 * width);
                var yOffset = (style.graphicYOffset != undefined) ?
                    style.graphicYOffset : -(0.5 * height);

                var opacity = style.graphicOpacity || style.fillOpacity;
                
                node.setAttributeNS(null, "x", (pos.x + xOffset).toFixed());
                node.setAttributeNS(null, "y", (pos.y + yOffset).toFixed());
                node.setAttributeNS(null, "width", width);
                node.setAttributeNS(null, "height", height);
                node.setAttributeNS(this.xlinkns, "href", style.externalGraphic);
                node.setAttributeNS(null, "style", "opacity: "+opacity);
            } else if (this.isComplexSymbol(style.graphicName)) {
                // the symbol viewBox is three times as large as the symbol
                var offset = style.pointRadius * 3;
                var size = offset * 2;
                var id = this.importSymbol(style.graphicName);
                var href = "#" + id;
                pos = this.getPosition(node);
                widthFactor = this.symbolSize[id] / size;
                // Only set the href if it is different from the current one.
                // This is a workaround for strange rendering behavior in FF3.
                if (node.getAttributeNS(this.xlinkns, "href") != href) {
                    node.setAttributeNS(this.xlinkns, "href", href);
                } else if (size != parseFloat(node.getAttributeNS(null, "width"))) {
                    // hide the element (and force a reflow so it really gets
                    // hidden. This workaround is needed for Safari.
                    node.style.visibility = "hidden";
                    this.container.scrollLeft = this.container.scrollLeft;
                }
                node.setAttributeNS(null, "width", size);
                node.setAttributeNS(null, "height", size);
                node.setAttributeNS(null, "x", pos.x - offset);
                node.setAttributeNS(null, "y", pos.y - offset);
                // set the visibility back to normal (after the Safari
                // workaround above)
                node.style.visibility = "";
            } else {
                node.setAttributeNS(null, "r", style.pointRadius);
            }

            if (typeof style.rotation != "undefined" && pos) {
                var rotation = OpenLayers.String.format(
                    "rotate(${0} ${1} ${2})", [style.rotation, pos.x, pos.y]);
                node.setAttributeNS(null, "transform", rotation);
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
            node.setAttributeNS(null, "stroke-linecap", style.strokeLinecap);
            // Hard-coded linejoin for now, to make it look the same as in VML.
            // There is no strokeLinejoin property yet for symbolizers.
            node.setAttributeNS(null, "stroke-linejoin", "round");
            node.setAttributeNS(null, "stroke-dasharray", this.dashStyle(style,
                widthFactor));
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

        switch (style.strokeDashstyle) {
            case 'solid':
                return 'none';
            case 'dot':
                return [1, 4 * w].join();
            case 'dash':
                return [4 * w, 4 * w].join();
            case 'dashdot':
                return [4 * w, 4 * w, 1, 4 * w].join();
            case 'longdash':
                return [8 * w, 4 * w].join();
            case 'longdashdot':
                return [8 * w, 4 * w, 1, 4 * w].join();
            default:
                return style.strokeDashstyle.replace(/ /g, ",");
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
     * Returns:
     * {DOMElement} The main root element to which we'll add vectors
     */
    createRoot: function() {
        return this.nodeFactory(this.container.id + "_root", "g");
    },

    /**
     * Method: createDefs
     *
     * Returns:
     * {DOMElement} The element to which we'll add the symbol definitions
     */
    createDefs: function() {
        var defs = this.nodeFactory("ol-renderer-defs", "defs");
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
     */ 
    drawPoint: function(node, geometry) {
        this.drawCircle(node, geometry, 1);
    },

    /**
     * Method: drawCircle
     * This method is only called by the renderer itself.
     * 
     * Parameters: 
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     * radius - {Float}
     */
    drawCircle: function(node, geometry, radius) {
        var resolution = this.getResolution();
        var x = (geometry.x / resolution + this.left);
        var y = (this.top - geometry.y / resolution);

        if (this.inValidRange(x, y)) { 
            node.setAttributeNS(null, "cx", x);
            node.setAttributeNS(null, "cy", y);
            node.setAttributeNS(null, "r", radius);
        } else {
            node.setAttributeNS(null, "cx", "");
            node.setAttributeNS(null, "cy", "");
            node.setAttributeNS(null, "r", 0);
        }    
            
    },
    
    /**
     * Method: drawLineString
     * This method is only called by the renderer itself.
     * 
     * Parameters: 
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     */ 
    drawLineString: function(node, geometry) {
        node.setAttributeNS(null, "points", 
                            this.getComponentsString(geometry.components));  
    },
    
    /**v
     * Method: drawLinearRing
     * This method is only called by the renderer itself.
     * 
     * Parameters: 
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     */ 
    drawLinearRing: function(node, geometry) {
        node.setAttributeNS(null, "points", 
                            this.getComponentsString(geometry.components));
    },
    
    /**
     * Method: drawPolygon
     * This method is only called by the renderer itself.
     * 
     * Parameters: 
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     */ 
    drawPolygon: function(node, geometry) {
        var d = "";
        var draw = true;
        for (var j=0, len=geometry.components.length; j<len; j++) {
            var linearRing = geometry.components[j];
            d += " M";
            for (var i=0, ilen=linearRing.components.length; i<ilen; i++) {
                var component = this.getShortString(linearRing.components[i]);
                if (component) {
                    d += " " + component;
                } else {
                    draw = false;
                }    
            }
        }
        d += " z";
        if (draw) {
            node.setAttributeNS(null, "d", d);
            node.setAttributeNS(null, "fill-rule", "evenodd");
        } else {
            node.setAttributeNS(null, "d", "");
        }    
    },
    
    /**
     * Method: drawRectangle
     * This method is only called by the renderer itself.
     * 
     * Parameters: 
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     */ 
    drawRectangle: function(node, geometry) {
        var resolution = this.getResolution();
        var x = (geometry.x / resolution + this.left);
        var y = (this.top - geometry.y / resolution);

        if (this.inValidRange(x, y)) { 
            node.setAttributeNS(null, "x", x);
            node.setAttributeNS(null, "y", y);
            node.setAttributeNS(null, "width", geometry.width / resolution);
            node.setAttributeNS(null, "height", geometry.height / resolution);
        } else {
            node.setAttributeNS(null, "x", "");
            node.setAttributeNS(null, "y", "");
            node.setAttributeNS(null, "width", 0);
            node.setAttributeNS(null, "height", 0);
        }
    },
    
    /**
     * Method: drawSurface
     * This method is only called by the renderer itself.
     * 
     * Parameters: 
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     */ 
    drawSurface: function(node, geometry) {

        // create the svg path string representation
        var d = null;
        var draw = true;
        for (var i=0, len=geometry.components.length; i<len; i++) {
            if ((i%3) == 0 && (i/3) == 0) {
                var component = this.getShortString(geometry.components[i]);
                if (!component) { draw = false; }
                d = "M " + component;
            } else if ((i%3) == 1) {
                var component = this.getShortString(geometry.components[i]);
                if (!component) { draw = false; }
                d += " C " + component;
            } else {
                var component = this.getShortString(geometry.components[i]);
                if (!component) { draw = false; }
                d += " " + component;
            }
        }
        d += " Z";
        if (draw) {
            node.setAttributeNS(null, "d", d);
        } else {
            node.setAttributeNS(null, "d", "");
        }    
    },

    /** 
     * Method: getComponentString
     * 
     * Parameters:
     * components - {Array(<OpenLayers.Geometry.Point>)} Array of points
     */
    getComponentsString: function(components) {
        var strings = [];
        for(var i=0, len=components.length; i<len; i++) {
            var component = this.getShortString(components[i]);
            if (component) {
                strings.push(component);
            }
        }
        return strings.join(",");
    },

    
    /** 
     * Method: getShortString
     * 
     * Parameters:
     * point - {<OpenLayers.Geometry.Point>}
     * 
     * Returns:
     * {String}
     */
    getShortString: function(point) {
        var resolution = this.getResolution();
        var x = (point.x / resolution + this.left);
        var y = (this.top - point.y / resolution);

        if (this.inValidRange(x, y)) { 
            return x + "," + y;
        } else {
            return false;
        }
    },
    
    /**
     * Method: getPosition
     * Finds the position of an svg node.
     * 
     * Parameters:
     * node - {DOMElement}
     * 
     * Returns:
     * {Object} hash with x and y properties, representing the coordinates
     *     within the svg coordinate system
     */
    getPosition: function(node) {
        return({
            x: parseFloat(node.getAttributeNS(null, "cx")),
            y: parseFloat(node.getAttributeNS(null, "cy"))
        });
    },

    /**
     * Method: importSymbol
     * add a new symbol definition from the rendererer's symbol hash
     * 
     * Parameters:
     * graphicName - {String} name of the symbol to import
     * 
     * Returns:
     * {String} - id of the imported symbol
     */      
    importSymbol: function (graphicName)  {
        if (!this.defs) {
            // create svg defs tag
            this.defs = this.createDefs();
        }
        var id = this.container.id + "-" + graphicName;
        
        // check if symbol already exists in the defs
        if (document.getElementById(id) != null) {
            return id;
        }
        
        var symbol = OpenLayers.Renderer.symbol[graphicName];
        if (!symbol) {
            throw new Error(graphicName + ' is not a valid symbol name');
            return;
        }

        var symbolNode = this.nodeFactory(id, "symbol");
        var node = this.nodeFactory(null, "polygon");
        symbolNode.appendChild(node);
        var symbolExtent = new OpenLayers.Bounds(
                                    Number.MAX_VALUE, Number.MAX_VALUE, 0, 0);

        var points = "";
        var x,y;
        for (var i=0; i<symbol.length; i=i+2) {
            x = symbol[i];
            y = symbol[i+1];
            symbolExtent.left = Math.min(symbolExtent.left, x);
            symbolExtent.bottom = Math.min(symbolExtent.bottom, y);
            symbolExtent.right = Math.max(symbolExtent.right, x);
            symbolExtent.top = Math.max(symbolExtent.top, y);
            points += " " + x + "," + y;
        }
        
        node.setAttributeNS(null, "points", points);
        
        var width = symbolExtent.getWidth();
        var height = symbolExtent.getHeight();
        // create a viewBox three times as large as the symbol itself,
        // to allow for strokeWidth being displayed correctly at the corners.
        var viewBox = [symbolExtent.left - width,
                        symbolExtent.bottom - height, width * 3, height * 3];
        symbolNode.setAttributeNS(null, "viewBox", viewBox.join(" "));
        this.symbolSize[id] = Math.max(width, height) * 3;
        
        this.defs.appendChild(symbolNode);
        return symbolNode.id;
    },

    CLASS_NAME: "OpenLayers.Renderer.SVG"
});
