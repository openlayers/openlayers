/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @class
 * 
 * @requires OpenLayers/Renderer/Elements.js
 */
OpenLayers.Renderer.SVG = OpenLayers.Class.create();
OpenLayers.Renderer.SVG.prototype = 
  OpenLayers.Class.inherit(OpenLayers.Renderer.Elements, {

    /** @type String */
    xmlns: "http://www.w3.org/2000/svg",

    // Firefox has a limitation where values larger or smaller than about
    // 15000 in an SVG document lock the browser up. This works around it.
    /** @type Integer */
    maxPixel: 15000,
    

    /** @type Float 
        @private */
    localResolution: null,

    /**
     * @constructor
     * 
     * @param {String} containerID
     */
    initialize: function(containerID) {
        if (!this.supported()) { 
            return; 
        }
        OpenLayers.Renderer.Elements.prototype.initialize.apply(this, 
                                                                arguments);
    },

    /**
     * 
     */
    destroy: function() {
        OpenLayers.Renderer.Elements.prototype.destroy.apply(this, arguments);
    },
    
    /**
     * @returns Whether or not the browser supports the SVG renderer
     * @type Boolean
     */
    supported: function() {
        var svgFeature = "http://www.w3.org/TR/SVG11/feature#SVG";
        var supported = (document.implementation.hasFeature("org.w3c.svg", "1.0") || document.implementation.hasFeature(svgFeature, "1.1"));
        return supported;
    },    

    /**
     * @param {OpenLayers.Bounds} extent
     * @private
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
     * function
     *
     * sets the size of the drawing surface
     *
     * @param size {OpenLayers.Size} the size of the drawing surface
     * @private
     */
    setSize: function(size) {
        OpenLayers.Renderer.prototype.setSize.apply(this, arguments);
        
        this.rendererRoot.setAttributeNS(null, "width", this.size.w);
        this.rendererRoot.setAttributeNS(null, "height", this.size.h);
    },

    


    /** 
     * @param geometry {OpenLayers.Geometry}
     * 
     * @returns The corresponding node type for the specified geometry
     * @type String
     * @private
     */
    getNodeType: function(geometry) {
        var nodeType = null;
        switch (geometry.CLASS_NAME) {
            case "OpenLayers.Geometry.Point":
                nodeType = "circle";
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
     * Use to set all the style attributes to a SVG node.
     * 
     * Note: takes care to adjust stroke width and point radius
     *       to be resolution-relative
     *
     * @param node {SVGDomElement} an SVG element to decorate
     * @param {Object} style
     * @param {Object} options
     * @option isFilled {boolean} 
     * @option isStroked {boolean} 
     * @private
     */
    setStyle: function(node, style, options) {
        style = style  || node._style;
        options = options || node._options;

        if (node._geometryClass == "OpenLayers.Geometry.Point") {
            node.setAttributeNS(null, "r", style.pointRadius);
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
        } else {
            node.setAttributeNS(null, "stroke", "none");
        }
        
        if (style.pointerEvents) {
            node.setAttributeNS(null, "pointer-events", style.pointerEvents);
        }
        
        if (style.cursor) {
            node.setAttributeNS(null, "cursor", style.cursor);
        }
    },

    /** 
     * @private 
     *
     * @param {String} type Kind of node to draw
     * @param {String} id Id for node
     * 
     * @returns A new node of the given type and id
     * @type DOMElement
     */
    createNode: function(type, id) {
        var node = document.createElementNS(this.xmlns, type);
        if (id) {
            node.setAttributeNS(null, "id", id);
        }
        return node;    
    },
    
    /** 
     * @private 
     *
     * @param {String} type Kind of node to draw
     * @param {String} id Id for node
     * 
     * @returns Whether or not the specified node is of the specified type
     * @type Boolean
     */
    nodeTypeCompare: function(node, type) {
        return (type == node.nodeName);
    },
   
    /**
     * @returns The specific render engine's root element
     * @type DOMElement
     * @private
     */
    createRenderRoot: function() {
        var id = this.container.id + "_svgRoot";
        var rendererRoot = this.nodeFactory(id, "svg");
        return rendererRoot;                        
    },

    /**
     * @returns The main root element to which we'll add vectors
     * @type DOMElement
     * @private
     */
    createRoot: function() {
        var id = this.container.id + "_root";

        var root = this.nodeFactory(id, "g");

        // flip the SVG display Y axis upside down so it 
        // matches the display Y axis of the map
        root.setAttributeNS(null, "transform", "scale(1, -1)");

        return root;
    },

    /**************************************
     *                                    *
     *     GEOMETRY DRAWING FUNCTIONS     *
     *                                    *
     **************************************/

    /** 
     * @param {DOMElement} node
     * @param {OpenLayers.Geometry} geometry
     * @private
     */
    drawPoint: function(node, geometry) {
        this.drawCircle(node, geometry, 1);
    },

    /** 
     * @param {DOMElement} node
     * @param {OpenLayers.Geometry} geometry
     * @param {float} radius
     * @private
     */
    drawCircle: function(node, geometry, radius) {
        var resolution = this.getResolution();
        var x = (geometry.x / resolution + this.left);
        var y = (geometry.y / resolution - this.top);
        var draw = true;
        if (x < -this.maxPixel || x > this.maxPixel) { draw = false; }
        if (y < -this.maxPixel || y > this.maxPixel) { draw = false; }

        if (draw) { 
            node.setAttributeNS(null, "cx", x);
            node.setAttributeNS(null, "cy", y);
            node.setAttributeNS(null, "r", radius);
        } else {
            this.root.removeChild(node);
        }    
            
    },
    
    /** 
     * @param {DOMElement} node
     * @param {OpenLayers.Geometry} geometry
     * @private
     */
    drawLineString: function(node, geometry) {
        node.setAttributeNS(null, "points", this.getComponentsString(geometry.components));  
    },
    
    /** 
     * @param {DOMElement} node
     * @param {OpenLayers.Geometry} geometry
     * @private
     */
    drawLinearRing: function(node, geometry) {
        node.setAttributeNS(null, "points", this.getComponentsString(geometry.components));
    },
    
    /** 
     * @param {DOMElement} node
     * @param {OpenLayers.Geometry} geometry
     * @private
     */
    drawPolygon: function(node, geometry) {
        var d = "";
        var draw = true;
        for (var j = 0; j < geometry.components.length; j++) {
            var linearRing = geometry.components[j];
            d += " M";
            for (var i = 0; i < linearRing.components.length; i++) {
                var component = this.getShortString(linearRing.components[i])
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
     * @param {DOMElement} node
     * @param {OpenLayers.Geometry} geometry
     * @private
     */
    drawRectangle: function(node, geometry) {
        // This needs to be reworked 
        var x = (geometry.x / resolution + this.left);
        var y = (geometry.y / resolution - this.top);
        var draw = true;
        if (x < -this.maxPixel || x > this.maxPixel) { draw = false; }
        if (y < -this.maxPixel || y > this.maxPixel) { draw = false; }
        if (draw) {
            node.setAttributeNS(null, "x", x);
            node.setAttributeNS(null, "y", y);
            node.setAttributeNS(null, "width", geometry.width);
            node.setAttributeNS(null, "height", geometry.height);
        } else {
            node.setAttributeNS(null, "x", "");
            node.setAttributeNS(null, "y", "");
            node.setAttributeNS(null, "width", 0);
            node.setAttributeNS(null, "height", 0);
        }    

    },
    
    
    /** 
     * @param {DOMElement} node
     * @param {OpenLayers.Geometry} geometry
     * @private
     */
    drawCurve: function(node, geometry) {
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
        if (draw) {
            node.setAttributeNS(null, "d", d);
        } else {
            node.setAttributeNS(null, "d", "");
        }    
    },
    
    /** 
     * @param {DOMElement} node
     * @param {OpenLayers.Geometry} geometry
     * @private
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
     * @param {Array} components array of points
     * @private
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
     * @param {OpenLayers.Geometry.Point} point
     * @private
     */
    getShortString: function(point) {
        var resolution = this.getResolution();
        var x = (point.x / resolution + this.left);
        var y = (point.y / resolution - this.top);
        if (x < -this.maxPixel || x > this.maxPixel) { return false; }
        if (y < -this.maxPixel || y > this.maxPixel) { return false; }
        var string =  x + "," + y;  
        return string;
        
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Renderer.SVG"
});
