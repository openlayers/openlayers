/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt
 * for the full text of the license. */

/**
 * @requires OpenLayers/Renderer/Elements.js
 *
 * Class: OpenLayers.Renderer.VML
 * Render vector features in browsers with VML capability.  Construct a new
 * VML renderer with the <OpenLayers.Renderer.VML> constructor.
 * 
 * Note that for all calculations in this class, we use toFixed() to round a 
 * float value to an integer. This is done because it seems that VML doesn't 
 * support float values.
 *
 * Inherits from:
 *  - <OpenLayers.Renderer.Elements>
 */
OpenLayers.Renderer.VML = OpenLayers.Class.create();
OpenLayers.Renderer.VML.prototype = 
  OpenLayers.Class.inherit(OpenLayers.Renderer.Elements, {

    /**
     * Property: xmlns
     * {String} XML Namespace URN
     */
    xmlns: "urn:schemas-microsoft-com:vml",

    /**
     * Constructor: OpenLayers.Renderer.VML
     * Create a new VML renderer.
     *
     * Parameters:
     * containerID - {String} The id for the element that contains the renderer
     */
    initialize: function(containerID) {
        if (!this.supported()) { 
            return; 
        } 
        document.namespaces.add("v", "urn:schemas-microsoft-com:vml");
        var style = document.createStyleSheet();
        style.addRule('v\\:*', "behavior: url(#default#VML); " +
                               "position: relative; display: inline-block;");
        OpenLayers.Renderer.Elements.prototype.initialize.apply(this, 
                                                                arguments);
    },

    /**
     * APIMethod: destroy
     * Deconstruct the renderer.
     */
    destroy: function() {
        OpenLayers.Renderer.Elements.prototype.destroy.apply(this, arguments);
    },

    /**
     * APIMethod: supported
     * Determine whether a browser supports this renderer.
     *
     * Return:
     * {Boolean} The browser supports the VML renderer
     */
    supported: function() {
        var supported = document.namespaces;
        return supported;
    },    

    /**
     * Method: setExtent
     * Set the renderer's extent
     *
     * Parameters:
     * extent - {<OpenLayers.Bounds>}
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
     * Method: setSize
     * Set the size of the drawing surface
     *
     * Parameters:
     * size - {<OpenLayers.Size>} the size of the drawing surface
     */
    setSize: function(size) {
        OpenLayers.Renderer.prototype.setSize.apply(this, arguments);

        this.rendererRoot.style.width = this.size.w;
        this.rendererRoot.style.height = this.size.h;

        this.root.style.width = "100%";
        this.root.style.height = "100%";
    },

    /**
     * Method: getNodeType
     * Get the noode type for a geometry
     *
     * Parameters:
     * geometry - {<OpenLayers.Geometry>}
     *
     * Return:
     * {String} The corresponding node type for the specified geometry
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
     * Method: setStyle
     * Use to set all the style attributes to a VML node.
     *
     * Parameters:
     * node - {DOMElement} 
     * style - {Object}
     * options - {Object} 
     * isFilled - {Boolean} 
     * isStroked - {Boolean}
     * geometry - {<OpenLayers.Geometry>}
     */
    setStyle: function(node, style, options, geometry) {
        style = style  || node._style;
        options = options || node._options;
        
        if (node._geometryClass == "OpenLayers.Geometry.Point") {
            this.drawCircle(node, geometry, style.pointRadius);
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
            stroke.setAttribute("endcap", !style.strokeLinecap || style.strokeLinecap == 'butt' ? 'flat' : style.strokeLinecap);
        }
        
        if (style.cursor) {
            node.style.cursor = style.cursor;
        }
    },


    /**
     * Method: setNodeDimension
     * Get the geometry's bounds, convert it to our vml coordinate system, 
     * then set the node's position, size, and local coordinate system.
     *   
     * Parameters:
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
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
     * Method: createNode
     * Create a new node
     *
     * Parameters:
     * type - {String} Kind of node to draw
     * id - {String} Id for node
     *
     * Return:
     * {DOMElement} A new node of the given type and id
     */
    createNode: function(type, id) {
        var node = document.createElement(type);
        if (id) {
            node.setAttribute('id', id);
        }
        return node;    
    },
    
    /**
     * Method: nodeTypeCompare
     * Determine whether a node is of a given type
     *
     * Parameters:
     * type - {String} Kind of node to draw
     * id - {String} Id for node
     *
     * Return:
     * {Boolean} Whether or not the specified node is of the specified type
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
     * Method: createRenderRoot
     * Create the renderer root
     *
     * Return:
     * {DOMElement} The specific render engine's root element
     */
    createRenderRoot: function() {
        var id = this.container.id + "_vmlRoot";
        var rendererRoot = this.nodeFactory(id, "div");
        return rendererRoot;                        
    },

    /**
     * Method: createRoot
     * Create the main root element
     *
     * Return:
     * {DOMElement} The main root element to which we'll add vectors
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
     * Method: drawPoint
     * Render a point
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
     * Render a circle.
     * Size and Center a circle given geometry (x,y center) and radius
     * 
     * Parameters:
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     * radius - {float}
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
     * Method: drawLineString
     * Render a linestring.
     * 
     * Parameters:
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     */
    drawLineString: function(node, geometry) {
        this.drawLine(node, geometry, false);
    },

    /**
     * Method: drawLinearRing
     * Render a linearring
     * 
     * Parameters:
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     */
    drawLinearRing: function(node, geometry) {
        this.drawLine(node, geometry, true);
    },

    /**
     * Method: DrawLine
     * Render a line.
     * 
     * Parameters:
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     * closeLine - {Boolean} Close the line? (make it a ring?)
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
     * Method: drawPolygon
     * Render a polygon
     * 
     * Parameters:
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
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
     * Method: drawRectangle
     * Render a rectangle
     * 
     * Parameters:
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     */
    drawRectangle: function(node, geometry) {
        var resolution = this.getResolution();
    
        node.style.left = geometry.x/resolution;
        node.style.top = geometry.y/resolution;
        node.style.width = geometry.width/resolution;
        node.style.height = geometry.height/resolution;
    },



    /**
     * Method: drawCurve
     * 
     * Parameters:
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
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
     * Method: drawSurface
     * 
     * Parameters:
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
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

    /** @final @type String*/
    CLASS_NAME: "OpenLayers.Renderer.VML"
});
