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
     */
    setExtent: function(extent) {
        OpenLayers.Renderer.Elements.prototype.setExtent.apply(this, 
                                                               arguments);
        
        var resolution = this.getResolution();
        
        var extentString = extent.left / resolution + " " + -extent.top / resolution + " " + 
                             extent.getWidth() / resolution + " " + extent.getHeight() / resolution;
        this.rendererRoot.setAttributeNS(null, "viewBox", extentString);
    },

    /**
     * function
     *
     * sets the size of the drawing surface
     *
     * @param size {OpenLayers.Size} the size of the drawing surface
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
     * @param {DOMElement} node
     */
    reprojectNode: function(node) {
        this.drawGeometryNode(node);  
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
     */
    setStyle: function(node, style, options) {
        style = style  || node.olStyle;
        options = options || node.olOptions;

        if (node.geometry.CLASS_NAME == "OpenLayers.Geometry.Point") {
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
     */
    createRenderRoot: function() {
        var id = this.container.id + "_svgRoot";
        var rendererRoot = this.nodeFactory(id, "svg");
        return rendererRoot;                        
    },

    /**
     * @returns The main root element to which we'll add vectors
     * @type DOMElement
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
     */
    drawPoint: function(node, geometry) {
        this.drawCircle(node, geometry, 1);
    },

    /** 
     * @param {DOMElement} node
     * @param {OpenLayers.Geometry} geometry
     * @param {float} radius
     */
    drawCircle: function(node, geometry, radius) {
        var resolution = this.getResolution();
        node.setAttributeNS(null, "cx", geometry.x / resolution);
        node.setAttributeNS(null, "cy", geometry.y / resolution);
        node.setAttributeNS(null, "r", radius);
    },
    
    /** 
     * @param {DOMElement} node
     * @param {OpenLayers.Geometry} geometry
     */
    drawLineString: function(node, geometry) {
        node.setAttributeNS(null, "points", this.getComponentsString(geometry.components));  
    },
    
    /** 
     * @param {DOMElement} node
     * @param {OpenLayers.Geometry} geometry
     */
    drawLinearRing: function(node, geometry) {
        node.setAttributeNS(null, "points", this.getComponentsString(geometry.components));
    },
    
    /** 
     * @param {DOMElement} node
     * @param {OpenLayers.Geometry} geometry
     */
    drawPolygon: function(node, geometry) {
        var d = "";
        for (var j = 0; j < geometry.components.length; j++) {
            var linearRing = geometry.components[j];
            d += " M";
            for (var i = 0; i < linearRing.components.length; i++) {
                d += " " + this.getShortString(linearRing.components[i]);
            }
        }
        d += " z";
        
        node.setAttributeNS(null, "d", d);
        node.setAttributeNS(null, "fill-rule", "evenodd");
    },
    
    /** 
     * @param {DOMElement} node
     * @param {OpenLayers.Geometry} geometry
     */
    drawRectangle: function(node, geometry) {
        node.setAttributeNS(null, "x", geometry.x / resolution);
        node.setAttributeNS(null, "y", geometry.y / resolution);
        node.setAttributeNS(null, "width", geometry.width);
        node.setAttributeNS(null, "height", geometry.height);
    },
    
    
    /** 
     * @param {DOMElement} node
     * @param {OpenLayers.Geometry} geometry
     */
    drawCurve: function(node, geometry) {
        var d = null;
        for (var i = 0; i < geometry.components.length; i++) {
            if ((i%3) == 0 && (i/3) == 0) {
                d = "M " + this.getShortString(geometry.components[i]);
            } else if ((i%3) == 1) {
                d += " C " + this.getShortString(geometry.components[i]);
            } else {
                d += " " + this.getShortString(geometry.components[i]);
            }
        }
        node.setAttributeNS(null, "d", d);
    },
    
    /** 
     * @param {DOMElement} node
     * @param {OpenLayers.Geometry} geometry
     */
    drawSurface: function(node, geometry) {

        // create the svg path string representation
        var d = null;
        for (var i = 0; i < geometry.components.length; i++) {
            if ((i%3) == 0 && (i/3) == 0) {
                d = "M " + this.getShortString(geometry.components[i]);
            } else if ((i%3) == 1) {
                d += " C " + this.getShortString(geometry.components[i]);
            } else {
                d += " " + this.getShortString(geometry.components[i]);
            }
        }
        d += " Z";
        node.setAttributeNS(null, "d", d);
    },

    /** 
     * @param {Array} components array of points
     */
    getComponentsString: function(components) {
        var strings = [];
        for(var i = 0; i < components.length; i++) {
            strings.push(this.getShortString(components[i]));
        }
        return strings.join(",");
    },

    
    /** 
     * @param {OpenLayers.Geometry.Point} point
     */
    getShortString: function(point) {
        var resolution = this.getResolution();
        return point.x / resolution + "," + point.y / resolution;  
        
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Renderer.SVG"
});
