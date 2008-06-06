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
                             extent.getWidth() / resolution + " " + extent.getHeight() / resolution;
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
                nodeType = style.externalGraphic ? "image" : "circle";
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
        if (node._geometryClass == "OpenLayers.Geometry.Point" && r) {
            if (style.externalGraphic) {
                var x = parseFloat(node.getAttributeNS(null, "cx"));
                var y = parseFloat(node.getAttributeNS(null, "cy"));
                
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
                
                node.setAttributeNS(null, "x", (x + xOffset).toFixed());
                node.setAttributeNS(null, "y", (y + yOffset).toFixed());
                node.setAttributeNS(null, "width", width);
                node.setAttributeNS(null, "height", height);
                node.setAttributeNS("http://www.w3.org/1999/xlink", "href", style.externalGraphic);
                node.setAttributeNS(null, "style", "opacity: "+opacity);
            } else {
                node.setAttributeNS(null, "r", style.pointRadius);
            }

            if (style.rotation) {
                var rotation = OpenLayers.String.format(
                    "rotate(${0} ${1} ${2})", [style.rotation, x, y]);
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
            node.setAttributeNS(null, "stroke-width", style.strokeWidth);
            node.setAttributeNS(null, "stroke-linecap", style.strokeLinecap);
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
        for (var j = 0; j < geometry.components.length; j++) {
            var linearRing = geometry.components[j];
            d += " M";
            for (var i = 0; i < linearRing.components.length; i++) {
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
        for (var i = 0; i < geometry.components.length; i++) {
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
        for(var i = 0; i < components.length; i++) {
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

    CLASS_NAME: "OpenLayers.Renderer.SVG"
});
