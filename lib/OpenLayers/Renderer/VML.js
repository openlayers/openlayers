/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt
 * for the full text of the license. */

/**
 * @class
 * 
 * Note that for all calculations in this class, we use toFixed() to round a 
 * float value to an integer. This is done because it seems that VML doesn't 
 * support float values.
 *
 * @requires OpenLayers/Renderer/Elements.js
 */
OpenLayers.Renderer.VML = OpenLayers.Class.create();
OpenLayers.Renderer.VML.prototype = 
  OpenLayers.Class.inherit(OpenLayers.Renderer.Elements, {

    /** @type String */
    xmlns: "urn:schemas-microsoft-com:vml",

    /**
     * @constructor
     * 
     * @param {String} containerID
     */
    initialize: function(containerID) {
        if (!this.supported()) { 
            return; 
        } 
        document.namespaces.add("v", "urn:schemas-microsoft-com:vml");
        var style = document.createStyleSheet();
        style.addRule('v\\:*', "behavior: url(#default#VML);");

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
     * @returns Whether or not the browser supports the VML renderer
     * @type Boolean
     */
    supported: function() {
        var supported = document.namespaces;
        return supported;
    },    

    /**
     * @param {OpenLayers.Bounds} extent
     */
    setExtent: function(extent) {
        OpenLayers.Renderer.Elements.prototype.setExtent.apply(this, 
                                                               arguments);
        var resolution = this.getResolution();
    
        var org = extent.left/resolution + " " + 
                    extent.top/resolution;
        this.root.setAttribute("coordorigin", org);

        var size = extent.getWidth()/resolution + " " + 
                    -extent.getHeight()/resolution;
        this.root.setAttribute("coordsize", size);
    },


    /**
     * Set the size of the drawing surface
     *
     * @param size {OpenLayers.Size} the size of the drawing surface
     */
    setSize: function(size) {
        OpenLayers.Renderer.prototype.setSize.apply(this, arguments);

        this.rendererRoot.style.width = this.size.w;
        this.rendererRoot.style.height = this.size.h;

        this.root.style.width = this.size.w;
        this.root.style.height = this.size.h
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
                nodeType = "v:oval";
                break;
            case "OpenLayers.Geometry.Rectangle":
                nodeType = "v:rect";
                break;
            case "OpenLayers.Geometry.LineString":
            case "OpenLayers.Geometry.LinearRing":
            case "OpenLayers.Geometry.Polygon":
            case "OpenLayers.Geometry.Curve":
            case "OpenLayers.Geometry.Surface":
                nodeType = "v:shape";
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
        //we have to reprojectNode the entire node since the coordinates 
        // system has changed
        this.drawGeometryNode(node);  
    },


    /**
     * Use to set all the style attributes to a VML node.
     *
     * @param {DOMElement} node
     * @param {Object} style
     * @param {Object} options
     * @option isFilled {boolean} 
     * @option isStroked {boolean} 
     */
    setStyle: function(node, style, options) {
        style = style  || node.olStyle;
        options = options || node.olOptions;
        
        if (node.geometry.CLASS_NAME == "OpenLayers.Geometry.Point") {
            this.drawCircle(node, node.geometry, style.pointRadius);
        }

      //fill
        var fillColor = (options.isFilled) ? style.fillColor : "none";
        node.setAttribute("fillcolor", fillColor);
        var fills = node.getElementsByTagName("fill");
        var fill = (fills.length == 0) ? null : fills[0];
        if (!options.isFilled) {
            if (fill) {
                node.removeChild(fill);
            }
        } else {
            if (!fill) {
                fill = this.createNode('v:fill', node.id + "_fill");
                node.appendChild(fill);
            }
            fill.setAttribute("opacity", style.fillOpacity);
        }


      //stroke
        var strokeColor = (options.isStroked) ? style.strokeColor : "none";
        node.setAttribute("strokecolor", strokeColor);
        node.setAttribute("strokeweight", style.strokeWidth);
        var strokes = node.getElementsByTagName("stroke");
        var stroke = (strokes.length == 0) ? null : strokes[0];
        if (!options.isStroked) {
            if (stroke) {
                node.removeChild(stroke);
            }
        } else {
            if (!stroke) {
                stroke = this.createNode('v:stroke', node.id + "_stroke");
                node.appendChild(stroke);
            }
            stroke.setAttribute("opacity", style.strokeOpacity);
        }
    },


    /** Get the geometry's bounds, convert it to our vml coordinate system, 
     *   then set the node's position, size, and local coordinate system.
     *   
     * @param {DOMElement} node
     * @param {OpenLayers.Geometry} geometry
     */
    setNodeDimension: function(node, geometry) {

        var bbox = geometry.getBounds();

        var resolution = this.getResolution();
    
        var scaledBox = 
            new OpenLayers.Bounds((bbox.left/resolution).toFixed(),
                                  (bbox.bottom/resolution).toFixed(),
                                  (bbox.right/resolution).toFixed(),
                                  (bbox.top/resolution).toFixed());
        
        // Set the internal coordinate system to draw the path
        node.style.left = scaledBox.left;
        node.style.top = scaledBox.top;
        node.style.width = scaledBox.getWidth();
        node.style.height = scaledBox.getHeight();

        node.coordorigin = scaledBox.left + " " + scaledBox.top;
        node.coordsize = scaledBox.getWidth()+ " " + scaledBox.getHeight();
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
        var node = document.createElement(type);
        if (id) {
            node.setAttribute('id', id);
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

        //split type
        var subType = type;
        var splitIndex = subType.indexOf(":");
        if (splitIndex != -1) {
            subType = subType.substr(splitIndex+1);
        }

        //split nodeName
        var nodeName = node.nodeName;
        splitIndex = nodeName.indexOf(":");
        if (splitIndex != -1) {
            nodeName = nodeName.substr(splitIndex+1);
        }

        return (subType == nodeName);
    },

    /**
     * @returns The specific render engine's root element
     * @type DOMElement
     */
    createRenderRoot: function() {
        var id = this.container.id + "_vmlRoot";
        var rendererRoot = this.nodeFactory(id, "div");
        return rendererRoot;                        
    },

    /**
     * @returns The main root element to which we'll add vectors
     * @type DOMElement
     */
    createRoot: function() {
        var id = this.container.id + "_root";
        var root = this.nodeFactory(id, "v:group");
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
        this.drawCircle(node, node.geometry, 1);
    },

    /** Size and Center a circle given geometry (x,y center) and radius
     * 
     * @param {DOMElement} node
     * @param {OpenLayers.Geometry} geometry
     * @param {float} radius
     */
    drawCircle: function(node, geometry, radius) {

        var resolution = this.getResolution();
    
        node.style.left = (geometry.x /resolution).toFixed() - radius;
        node.style.top = (geometry.y /resolution).toFixed() - radius;

        var diameter = radius * 2;
        
        node.style.width = diameter;
        node.style.height = diameter;
    },


    /**
     * @param {DOMElement} node
     * @param {OpenLayers.Geometry} geometry
     */
    drawLineString: function(node, geometry) {
        this.drawLine(node, geometry, false);
    },

    /**
     * @param {DOMElement} node
     * @param {OpenLayers.Geometry} geometry
     */
    drawLinearRing: function(node, geometry) {
        this.drawLine(node, geometry, true);
    },

    /**
     * @param {DOMElement} node
     * @param {OpenLayers.Geometry} geometry
     * @param {Boolean} closeLine Close the line? (make it a ring?)
     */
    drawLine: function(node, geometry, closeLine) {

        this.setNodeDimension(node, geometry);

        var resolution = this.getResolution();

        var path = "m";
        for (var i = 0; i < geometry.components.length; i++) {
            var x = (geometry.components[i].x/resolution);
            var y = (geometry.components[i].y/resolution);
            path += " " + x.toFixed() + "," + y.toFixed() + " l ";
        }
        if (closeLine) {
            path += " x";
        }
        path += " e";

        node.path = path;
    },

    /**
     * @parm {DOMElement} node
     * @param {OpenLayers.Geometry} geometry
     */
    drawPolygon: function(node, geometry) {
        this.setNodeDimension(node, geometry);

        var resolution = this.getResolution();
    
        var path = "";
        for (var j = 0; j < geometry.components.length; j++) {
            var linearRing = geometry.components[j];

            path += "m";
            for (var i = 0; i < linearRing.components.length; i++) {
                var x = linearRing.components[i].x / resolution;
                var y = linearRing.components[i].y / resolution;
                path += " " + x.toFixed() + "," + y.toFixed();
                if (i==0) {
                    path += " l";
                }
            }
            path += " x ";
        }
        path += "e";
        node.path = path;
    },

    /**
     * @parm {DOMElement} node
     * @param {OpenLayers.Geometry} geometry
     */
    drawRectangle: function(node, geometry) {
        var resolution = this.getResolution();
    
        node.style.left = geometry.x/resolution;
        node.style.top = geometry.y/resolution;
        node.style.width = geometry.width/resolution;
        node.style.height = geometry.height/resolution;
    },



    /**
     * @parm {DOMElement} node
     * @param {OpenLayers.Geometry} geometry
     */
    drawCurve: function(node, geometry) {
        this.setNodeDimension(node, geometry);

        var resolution = this.getResolution();
    
        var path = "";
        for (var i = 0; i < geometry.components.length; i++) {
            var x = geometry.components[i].x / resolution;
            var y = geometry.components[i].y / resolution;
    
            if ((i%3)==0 && (i/3)==0) {
                path += "m"
            } else if ((i%3)==1) {
                path += " c"
            }
            path += " " + x + "," + y;
        }
        path += " x e";

        node.path = path;
    },

    /**
     * @parm {DOMElement} node
     * @param {OpenLayers.Geometry} geometry
     */
    drawSurface: function(node, geometry) {

        this.setNodeDimension(node, geometry);

        var resolution = this.getResolution();
    
        var path = "";
        for (var i = 0; i < geometry.components.length; i++) {
            var x = geometry.components[i].x / resolution;
            var y = geometry.components[i].y / resolution;
            if ((i%3)==0 && (i/3)==0) {
                path += "m";
            } else if ((i%3)==1) {
                path += " c";
            }
            path += " " + x + "," + y;
        }
        path += " x e";

        node.path = path;
    },

    CLASS_NAME: "OpenLayers.Renderer.VML"
});
