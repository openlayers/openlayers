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
     * Property: symbolCache
     * {DOMElement} node holding symbols. This hash is keyed by symbol name,
     *     and each value is a hash with a "path" and an "extent" property.
     */
    symbolCache: {},

    /**
     * Property: offset
     * {Object} Hash with "x" and "y" properties
     */
    offset: null,
    
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
        if (!document.namespaces.olv) {
            document.namespaces.add("olv", this.xmlns);
            var style = document.createStyleSheet();
            style.addRule('olv\\:*', "behavior: url(#default#VML); " +
                                   "position: absolute; display: inline-block;");
        }
        
        OpenLayers.Renderer.Elements.prototype.initialize.apply(this, 
                                                                arguments);
        this.offset = {x: 0, y: 0};
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
     * resolutionChanged - {Boolean}
     * 
     * Returns:
     * {Boolean} true to notify the layer that the new extent does not exceed
     *     the coordinate range, and the features will not need to be redrawn.
     */
    setExtent: function(extent, resolutionChanged) {
        OpenLayers.Renderer.Elements.prototype.setExtent.apply(this, 
                                                               arguments);
        var resolution = this.getResolution();
    
        var left = extent.left/resolution;
        var top = extent.top/resolution - this.size.h;
        if (resolutionChanged) {
            this.offset = {x: left, y: top};
            left = 0;
            top = 0;
        } else {
            left = left - this.offset.x;
            top = top - this.offset.y;
        }
        
        var org = left + " " + top;
        this.root.setAttribute("coordorigin", org);

        var size = this.size.w + " " + this.size.h;
        this.root.setAttribute("coordsize", size);
        
        // flip the VML display Y axis upside down so it 
        // matches the display Y axis of the map
        this.root.style.flip = "y";
        
        return true;
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

        this.rendererRoot.style.width = this.size.w + "px";
        this.rendererRoot.style.height = this.size.h + "px";

        this.root.style.width = this.size.w + "px";
        this.root.style.height = this.size.h + "px";
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
                if (style.externalGraphic) {
                    nodeType = "olv:rect";
                } else if (this.isComplexSymbol(style.graphicName)) {
                    nodeType = "olv:shape";
                } else {
                    nodeType = "olv:oval";
                }
                break;
            case "OpenLayers.Geometry.Rectangle":
                nodeType = "olv:rect";
                break;
            case "OpenLayers.Geometry.LineString":
            case "OpenLayers.Geometry.LinearRing":
            case "OpenLayers.Geometry.Polygon":
            case "OpenLayers.Geometry.Curve":
            case "OpenLayers.Geometry.Surface":
                nodeType = "olv:shape";
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
        var widthFactor = 1;
        
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
                
                node.style.left = ((geometry.x/resolution - this.offset.x)+xOffset).toFixed();
                node.style.top = ((geometry.y/resolution - this.offset.y)-(yOffset+height)).toFixed();
                node.style.width = width + "px";
                node.style.height = height + "px";
                node.style.flip = "y";
                
                // modify style/options for fill and stroke styling below
                style.fillColor = "none";
                options.isStroked = false;
            } else if (this.isComplexSymbol(style.graphicName)) {
                var cache = this.importSymbol(style.graphicName);
                var symbolExtent = cache.extent;
                var width = symbolExtent.getWidth();
                var height = symbolExtent.getHeight();
                node.setAttribute("path", cache.path);
                node.setAttribute("coordorigin", symbolExtent.left + "," +
                                                                symbolExtent.bottom);
                node.setAttribute("coordsize", width + "," + height);
                node.style.left = symbolExtent.left + "px";
                node.style.top = symbolExtent.bottom + "px";
                node.style.width = width + "px";
                node.style.height = height + "px";
        
                this.drawCircle(node, geometry, style.pointRadius);
                node.style.flip = "y";
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
                fill = this.createNode('olv:fill', node.id + "_fill");
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
                
                if (!(style.graphicWidth && style.graphicHeight)) {
                  fill.aspect = "atmost";
                }                
            }
            if (fill.parentNode != node) {
                node.appendChild(fill);
            }
        }

        // additional rendering for rotated graphics or symbols
        if (typeof style.rotation != "undefined") {
            if (style.externalGraphic) {
                this.graphicRotate(node, xOffset, yOffset);
                // make the fill fully transparent, because we now have
                // the graphic as imagedata element. We cannot just remove
                // the fill, because this is part of the hack described
                // in graphicRotate
                fill.setAttribute("opacity", 0);
            } else {
                node.style.rotation = style.rotation;
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
                stroke = this.createNode('olv:stroke', node.id + "_stroke");
                node.appendChild(stroke);
            }
            stroke.setAttribute("opacity", style.strokeOpacity);
            stroke.setAttribute("endcap", !style.strokeLinecap || style.strokeLinecap == 'butt' ? 'flat' : style.strokeLinecap);
            stroke.setAttribute("dashstyle", this.dashStyle(style));
        }
        
        if (style.cursor != "inherit" && style.cursor != null) {
            node.style.cursor = style.cursor;
        }
        return node;
    },

    /**
     * Method: graphicRotate
     * If a point is to be styled with externalGraphic and rotation, VML fills
     * cannot be used to display the graphic, because rotation of graphic
     * fills is not supported by the VML implementation of Internet Explorer.
     * This method creates a olv:imagedata element inside the VML node,
     * DXImageTransform.Matrix and BasicImage filters for rotation and
     * opacity, and a 3-step hack to remove rendering artefacts from the
     * graphic and preserve the ability of graphics to trigger events.
     * Finally, OpenLayers methods are used to determine the correct
     * insertion point of the rotated image, because DXImageTransform.Matrix
     * does the rotation without the ability to specify a rotation center
     * point.
     * 
     * Parameters:
     * node    - {DOMElement}
     * xOffset - {Number} rotation center relative to image, x coordinate
     * yOffset - {Number} rotation center relative to image, y coordinate
     */
    graphicRotate: function(node, xOffset, yOffset) {
        var style = style || node._style;
        var options = node._options;
        
        var aspectRatio, size;
        if (!(style.graphicWidth && style.graphicHeight)) {
            // load the image to determine its size
            var img = new Image();
            img.onreadystatechange = OpenLayers.Function.bind(function() {
                if(img.readyState == "complete" ||
                        img.readyState == "interactive") {
                    aspectRatio = img.width / img.height;
                    size = Math.max(style.pointRadius * 2, 
                        style.graphicWidth || 0,
                        style.graphicHeight || 0);
                    xOffset = xOffset * aspectRatio;
                    style.graphicWidth = size * aspectRatio;
                    style.graphicHeight = size;
                    this.graphicRotate(node, xOffset, yOffset);
                }
            }, this);
            img.src = style.externalGraphic;
            
            // will be called again by the onreadystate handler
            return;
        } else {
            size = Math.max(style.graphicWidth, style.graphicHeight);
            aspectRatio = style.graphicWidth / style.graphicHeight;
        }
        
        var width = Math.round(style.graphicWidth || size * aspectRatio);
        var height = Math.round(style.graphicHeight || size);
        node.style.width = width + "px";
        node.style.height = height + "px";
        
        // Three steps are required to remove artefacts for images with
        // transparent backgrounds (resulting from using DXImageTransform
        // filters on svg objects), while preserving awareness for browser
        // events on images:
        // - Use the fill as usual (like for unrotated images) to handle
        //   events
        // - specify an imagedata element with the same src as the fill
        // - style the imagedata element with an AlphaImageLoader filter
        //   with empty src
        var image = document.getElementById(node.id + "_image");
        if (!image) {
            image = this.createNode("olv:imagedata", node.id + "_image");
            node.appendChild(image);
        }
        image.style.width = width + "px";
        image.style.height = height + "px";
        image.src = style.externalGraphic;
        image.style.filter =
            "progid:DXImageTransform.Microsoft.AlphaImageLoader(" + 
            "src='', sizingMethod='scale')";

        var rotation = style.rotation * Math.PI / 180;
        var sintheta = Math.sin(rotation);
        var costheta = Math.cos(rotation);

        // do the rotation on the image
        var filter =
            "progid:DXImageTransform.Microsoft.Matrix(M11=" + costheta +
            ",M12=" + (-sintheta) + ",M21=" + sintheta + ",M22=" + costheta +
            ",SizingMethod='auto expand')\n";

        // set the opacity (needed for the imagedata)
        var opacity = style.graphicOpacity || style.fillOpacity;
        if (opacity && opacity != 1) {
            filter += 
                "progid:DXImageTransform.Microsoft.BasicImage(opacity=" + 
                opacity+")\n";
        }
        node.style.filter = filter;

        // do the rotation again on a box, so we know the insertion point
        var centerPoint = new OpenLayers.Geometry.Point(-xOffset, -yOffset);
        var imgBox = new OpenLayers.Bounds(0, 0, width, height).toGeometry();
        imgBox.rotate(style.rotation, centerPoint);
        var imgBounds = imgBox.getBounds();

        node.style.left = Math.round(
            parseInt(node.style.left) + imgBounds.left) + "px";
        node.style.top = Math.round(
            parseInt(node.style.top) - imgBounds.bottom) + "px";
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
                new OpenLayers.Bounds((bbox.left/resolution - this.offset.x).toFixed(),
                                      (bbox.bottom/resolution - this.offset.y).toFixed(),
                                      (bbox.right/resolution - this.offset.x).toFixed(),
                                      (bbox.top/resolution - this.offset.y).toFixed());
            
            // Set the internal coordinate system to draw the path
            node.style.left = scaledBox.left + "px";
            node.style.top = scaledBox.top + "px";
            node.style.width = scaledBox.getWidth() + "px";
            node.style.height = scaledBox.getHeight() + "px";
    
            node.coordorigin = scaledBox.left + " " + scaledBox.top;
            node.coordsize = scaledBox.getWidth()+ " " + scaledBox.getHeight();
        }
    },
    
    /** 
     * Method: dashStyle
     * 
     * Parameters:
     * style - {Object}
     * 
     * Returns:
     * {String} A VML compliant 'stroke-dasharray' value
     */
    dashStyle: function(style) {
        var dash = style.strokeDashstyle;
        switch (dash) {
            case 'solid':
            case 'dot':
            case 'dash':
            case 'dashdot':
            case 'longdash':
            case 'longdashdot':
                return dash;
            default:
                // very basic guessing of dash style patterns
                var parts = dash.split(/[ ,]/);
                if (parts.length == 2) {
                    if (1*parts[0] >= 2*parts[1]) {
                        return "longdash";
                    }
                    return (parts[0] == 1 || parts[1] == 1) ? "dot" : "dash";
                } else if (parts.length == 4) {
                    return (1*parts[0] >= 2*parts[1]) ? "longdashdot" :
                        "dashdot";
                }
                return "solid";
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
        return this.nodeFactory(this.container.id + "_root", "olv:group");
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
     * 
     * Returns:
     * {DOMElement} or false if the point could not be drawn
     */
    drawPoint: function(node, geometry) {
        return this.drawCircle(node, geometry, 1);
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
     * 
     * Returns:
     * {DOMElement} or false if the circle could not ne drawn
     */
    drawCircle: function(node, geometry, radius) {
        if(!isNaN(geometry.x)&& !isNaN(geometry.y)) {
            var resolution = this.getResolution();

            node.style.left = ((geometry.x /resolution - this.offset.x).toFixed() - radius) + "px";
            node.style.top = ((geometry.y /resolution - this.offset.y).toFixed() - radius) + "px";
    
            var diameter = radius * 2;
            
            node.style.width = diameter + "px";
            node.style.height = diameter + "px";
            return node;
        }
        return false;
    },


    /**
     * Method: drawLineString
     * Render a linestring.
     * 
     * Parameters:
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     * 
     * Returns:
     * {DOMElement}
     */
    drawLineString: function(node, geometry) {
        return this.drawLine(node, geometry, false);
    },

    /**
     * Method: drawLinearRing
     * Render a linearring
     * 
     * Parameters:
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     * 
     * Returns:
     * {DOMElement}
     */
    drawLinearRing: function(node, geometry) {
        return this.drawLine(node, geometry, true);
    },

    /**
     * Method: DrawLine
     * Render a line.
     * 
     * Parameters:
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     * closeLine - {Boolean} Close the line? (make it a ring?)
     * 
     * Returns:
     * {DOMElement}
     */
    drawLine: function(node, geometry, closeLine) {

        this.setNodeDimension(node, geometry);

        var resolution = this.getResolution();
        var numComponents = geometry.components.length;
        var parts = new Array(numComponents);

        var comp, x, y;
        for (var i = 0; i < numComponents; i++) {
            comp = geometry.components[i];
            x = (comp.x/resolution - this.offset.x);
            y = (comp.y/resolution - this.offset.y);
            parts[i] = " " + x.toFixed() + "," + y.toFixed() + " l ";
        }
        var end = (closeLine) ? " x e" : " e";
        node.path = "m" + parts.join("") + end;
        return node;
    },

    /**
     * Method: drawPolygon
     * Render a polygon
     * 
     * Parameters:
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     * 
     * Returns:
     * {DOMElement}
     */
    drawPolygon: function(node, geometry) {
        this.setNodeDimension(node, geometry);

        var resolution = this.getResolution();
    
        var path = [];
        var linearRing, i, j, len, ilen, comp, x, y;
        for (j = 0, len=geometry.components.length; j<len; j++) {
            linearRing = geometry.components[j];

            path.push("m");
            for (i=0, ilen=linearRing.components.length; i<ilen; i++) {
                comp = linearRing.components[i];
                x = comp.x / resolution - this.offset.x;
                y = comp.y / resolution - this.offset.y;
                path.push(" " + x.toFixed() + "," + y.toFixed());
                if (i==0) {
                    path.push(" l");
                }
            }
            path.push(" x ");
        }
        path.push("e");
        node.path = path.join("");
        return node;
    },

    /**
     * Method: drawRectangle
     * Render a rectangle
     * 
     * Parameters:
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     * 
     * Returns:
     * {DOMElement}
     */
    drawRectangle: function(node, geometry) {
        var resolution = this.getResolution();
    
        node.style.left = (geometry.x/resolution - this.offset.x) + "px";
        node.style.top = (geometry.y/resolution - this.offset.y) + "px";
        node.style.width = geometry.width/resolution + "px";
        node.style.height = geometry.height/resolution + "px";
        
        return node;
    },

    /**
     * Method: drawSurface
     * 
     * Parameters:
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     * 
     * Returns:
     * {DOMElement}
     */
    drawSurface: function(node, geometry) {

        this.setNodeDimension(node, geometry);

        var resolution = this.getResolution();
    
        var path = [];
        var comp, x, y;
        for (var i=0, len=geometry.components.length; i<len; i++) {
            comp = geometry.components[i];
            x = comp.x / resolution - this.offset.x;
            y = comp.y / resolution - this.offset.y;
            if ((i%3)==0 && (i/3)==0) {
                path.push("m");
            } else if ((i%3)==1) {
                path.push(" c");
            }
            path.push(" " + x + "," + y);
        }
        path.push(" x e");

        node.path = path.join("");
        return node;
    },
    
    /**
     * Method: importSymbol
     * add a new symbol definition from the rendererer's symbol hash
     * 
     * Parameters:
     * graphicName - {String} name of the symbol to import
     * 
     * Returns:
     * {Object} - hash of {DOMElement} "symbol" and {Number} "size"
     */      
    importSymbol: function (graphicName)  {
        var id = this.container.id + "-" + graphicName;
        
        // check if symbol already exists in the cache
        var cache = this.symbolCache[id];
        if (cache) {
            return cache;
        }
        
        var symbol = OpenLayers.Renderer.symbol[graphicName];
        if (!symbol) {
            throw new Error(graphicName + ' is not a valid symbol name');
            return;
        }

        var symbolExtent = new OpenLayers.Bounds(
                                    Number.MAX_VALUE, Number.MAX_VALUE, 0, 0);
        
        var pathitems = ["m"];
        for (var i=0; i<symbol.length; i=i+2) {
            x = symbol[i];
            y = symbol[i+1];
            symbolExtent.left = Math.min(symbolExtent.left, x);
            symbolExtent.bottom = Math.min(symbolExtent.bottom, y);
            symbolExtent.right = Math.max(symbolExtent.right, x);
            symbolExtent.top = Math.max(symbolExtent.top, y);

            pathitems.push(x);
            pathitems.push(y);
            if (i == 0) {
                pathitems.push("l");
            }
        }
        pathitems.push("x e");
        var path = pathitems.join(" ");
        
        cache = {
            path: path,
            extent: symbolExtent
        };
        this.symbolCache[id] = cache;
        
        return cache;
    },
    
    CLASS_NAME: "OpenLayers.Renderer.VML"
});
