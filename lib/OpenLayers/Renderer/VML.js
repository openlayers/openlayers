/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Renderer/Elements.js
 */

/**
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
OpenLayers.Renderer.VML = OpenLayers.Class(OpenLayers.Renderer.Elements, {

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
        if (!document.namespaces.v) {
            document.namespaces.add("v", this.xmlns);
            var style = document.createStyleSheet();
            style.addRule('v\\:*', "behavior: url(#default#VML); " +
                                   "position: absolute; display: inline-block;");
        }
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
     * Returns:
     * {Boolean} The browser supports the VML renderer
     */
    supported: function() {
        return !!(document.namespaces);
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

        this.root.style.width = this.size.w;
        this.root.style.height = this.size.h;
    },

    /**
     * Method: getNodeType
     * Get the node type for a geometry and style
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
                nodeType = style.externalGraphic ? "v:rect" : "v:oval";
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
     * node - {DOMElement} An VML element to decorate
     * style - {Object}
     * options - {Object} Currently supported options include 
     *                              'isFilled' {Boolean} and
     *                              'isStroked' {Boolean}
     * geometry - {<OpenLayers.Geometry>}
     */
    setStyle: function(node, style, options, geometry) {
        style = style  || node._style;
        options = options || node._options;
        
        if (node._geometryClass == "OpenLayers.Geometry.Point") {
            if (style.externalGraphic) {
                var width = style.graphicWidth || style.graphicHeight;
                var height = style.graphicHeight || style.graphicWidth;
                width = width ? width : style.pointRadius*2;
                height = height ? height : style.pointRadius*2;

                var resolution = this.getResolution();
                var xOffset = (style.graphicXOffset != undefined) ?
                    style.graphicXOffset : -(0.5 * width);
                var yOffset = (style.graphicYOffset != undefined) ?
                    style.graphicYOffset : -(0.5 * height);
                
                node.style.left = ((geometry.x/resolution)+xOffset).toFixed();
                node.style.top = ((geometry.y/resolution)-(yOffset+height)).toFixed();
                node.style.width = width;
                node.style.height = height;    
                
                // modify style/options for fill and stroke styling below
                style.fillColor = "none";
                options.isStroked = false;
                         
            } else {
                this.drawCircle(node, geometry, style.pointRadius);
            }
        }

        // fill 
        if (options.isFilled) { 
            node.setAttribute("fillcolor", style.fillColor); 
        } else { 
            node.setAttribute("filled", "false"); 
        }
        var fills = node.getElementsByTagName("fill");
        var fill = (fills.length == 0) ? null : fills[0];
        if (!options.isFilled) {
            if (fill) {
                node.removeChild(fill);
            }
        } else {
            if (!fill) {
                fill = this.createNode('v:fill', node.id + "_fill");
            }
            fill.setAttribute("opacity", style.fillOpacity);

            if (node._geometryClass == "OpenLayers.Geometry.Point" &&
                    style.externalGraphic) {

                // override fillOpacity
                if (style.graphicOpacity) {
                    fill.setAttribute("opacity", style.graphicOpacity);
                }
                
                fill.setAttribute("src", style.externalGraphic);
                fill.setAttribute("type", "frame");
                node.style.flip = "y";
                
                if (!(style.graphicWidth && style.graphicHeight)) {
                  fill.aspect = "atmost";
                }                
            }
            if (fill.parentNode != node) {
                node.appendChild(fill);
            }
        }


        // stroke 
        if (options.isStroked) { 
            node.setAttribute("strokecolor", style.strokeColor); 
            node.setAttribute("strokeweight", style.strokeWidth + "px"); 
        } else { 
            node.setAttribute("stroked", "false"); 
        }
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
        
        if (style.cursor != null) {
            node.style.cursor = style.cursor;
        }
        return node;
    },

    /**
     * Method: postDraw
     * Some versions of Internet Explorer seem to be unable to set fillcolor
     * and strokecolor to "none" correctly before the fill node is appended to
     * a visible vml node. This method takes care of that and sets fillcolor
     * and strokecolor again if needed.
     * 
     * Parameters:
     * node - {DOMElement}
     */
    postDraw: function(node) {
        var fillColor = node._style.fillColor;
        var strokeColor = node._style.strokeColor;
        if (fillColor == "none" &&
                node.getAttribute("fillcolor") != fillColor) {
            node.setAttribute("fillcolor", fillColor);
        }
        if (strokeColor == "none" &&
                node.getAttribute("strokecolor") != strokeColor) {
            node.setAttribute("strokecolor", strokeColor);
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
        if(bbox) {
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
        }
    },

    /**
     * Method: createNode
     * Create a new node
     *
     * Parameters:
     * type - {String} Kind of node to draw
     * id - {String} Id for node
     *
     * Returns:
     * {DOMElement} A new node of the given type and id
     */
    createNode: function(type, id) {
        var node = document.createElement(type);
        if (id) {
            node.setAttribute('id', id);
        }
        
        // IE hack to make elements unselectable, to prevent 'blue flash'
        // while dragging vectors; #1410
        node.setAttribute('unselectable', 'on', 0);
        node.onselectstart = function() { return(false); };
        
        return node;    
    },
    
    /**
     * Method: nodeTypeCompare
     * Determine whether a node is of a given type
     *
     * Parameters:
     * node - {DOMElement} An VML element
     * type - {String} Kind of node
     *
     * Returns:
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
     * Returns:
     * {DOMElement} The specific render engine's root element
     */
    createRenderRoot: function() {
        return this.nodeFactory(this.container.id + "_vmlRoot", "div");
    },

    /**
     * Method: createRoot
     * Create the main root element
     *
     * Returns:
     * {DOMElement} The main root element to which we'll add vectors
     */
    createRoot: function() {
        return this.nodeFactory(this.container.id + "_root", "v:group");
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
        if(!isNaN(geometry.x)&& !isNaN(geometry.y)) {
            var resolution = this.getResolution();
        
            node.style.left = (geometry.x /resolution).toFixed() - radius;
            node.style.top = (geometry.y /resolution).toFixed() - radius;
    
            var diameter = radius * 2;
            
            node.style.width = diameter;
            node.style.height = diameter;
        }
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
        var numComponents = geometry.components.length;
        var parts = new Array(numComponents);

        var comp, x, y;
        for (var i = 0; i < numComponents; i++) {
            comp = geometry.components[i];
            x = (comp.x/resolution);
            y = (comp.y/resolution);
            parts[i] = " " + x.toFixed() + "," + y.toFixed() + " l ";
        }
        var end = (closeLine) ? " x e" : " e";
        node.path = "m" + parts.join("") + end;
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
    
        var path = [];
        var linearRing, i, comp, x, y;
        for (var j = 0; j < geometry.components.length; j++) {
            linearRing = geometry.components[j];

            path.push("m");
            for (i = 0; i < linearRing.components.length; i++) {
                comp = linearRing.components[i];
                x = comp.x / resolution;
                y = comp.y / resolution;
                path.push(" " + x.toFixed() + "," + y.toFixed());
                if (i==0) {
                    path.push(" l");
                }
            }
            path.push(" x ");
        }
        path.push("e");
        node.path = path.join("");
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
     * Method: drawSurface
     * 
     * Parameters:
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     */
    drawSurface: function(node, geometry) {

        this.setNodeDimension(node, geometry);

        var resolution = this.getResolution();
    
        var path = [];
        var comp, x, y;
        for (var i = 0; i < geometry.components.length; i++) {
            comp = geometry.components[i];
            x = comp.x / resolution;
            y = comp.y / resolution;
            if ((i%3)==0 && (i/3)==0) {
                path.push("m");
            } else if ((i%3)==1) {
                path.push(" c");
            }
            path.push(" " + x + "," + y);
        }
        path.push(" x e");

        node.path = path.join("");
    },

    CLASS_NAME: "OpenLayers.Renderer.VML"
});
