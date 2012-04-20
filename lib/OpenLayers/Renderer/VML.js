/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Renderer/Elements.js
 */

/**
 * Class: OpenLayers.Renderer.VML
 * Render vector features in browsers with VML capability.  Construct a new
 * VML renderer with the <OpenLayers.Renderer.VML> constructor.
 * 
 * Note that for all calculations in this class, we use (num | 0) to truncate a 
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
            var shapes = ['shape','rect', 'oval', 'fill', 'stroke', 'imagedata', 'group','textbox']; 
            for (var i = 0, len = shapes.length; i < len; i++) {

                style.addRule('olv\\:' + shapes[i], "behavior: url(#default#VML); " +
                              "position: absolute; display: inline-block;");
            }                  
        }
        
        OpenLayers.Renderer.Elements.prototype.initialize.apply(this, 
                                                                arguments);
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
        var coordSysUnchanged = OpenLayers.Renderer.Elements.prototype.setExtent.apply(this, arguments);
        var resolution = this.getResolution();
    
        var left = (extent.left/resolution) | 0;
        var top = (extent.top/resolution - this.size.h) | 0;
        if (resolutionChanged || !this.offset) {
            this.offset = {x: left, y: top};
            left = 0;
            top = 0;
        } else {
            left = left - this.offset.x;
            top = top - this.offset.y;
        }

        
        var org = (left - this.xOffset) + " " + top;
        this.root.coordorigin = org;
        var roots = [this.root, this.vectorRoot, this.textRoot];
        var root;
        for(var i=0, len=roots.length; i<len; ++i) {
            root = roots[i];

            var size = this.size.w + " " + this.size.h;
            root.coordsize = size;
            
        }
        // flip the VML display Y axis upside down so it 
        // matches the display Y axis of the map
        this.root.style.flip = "y";
        
        return coordSysUnchanged;
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
        
        // setting width and height on all roots to avoid flicker which we
        // would get with 100% width and height on child roots
        var roots = [
            this.rendererRoot,
            this.root,
            this.vectorRoot,
            this.textRoot
        ];
        var w = this.size.w + "px";
        var h = this.size.h + "px";
        var root;
        for(var i=0, len=roots.length; i<len; ++i) {
            root = roots[i];
            root.style.width = w;
            root.style.height = h;
        }
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
        var fillColor = style.fillColor;

        if (node._geometryClass === "OpenLayers.Geometry.Point") {
            if (style.externalGraphic) {
                options.isFilled = true;
                if (style.graphicTitle) {
                    node.title=style.graphicTitle;
                } 
                var width = style.graphicWidth || style.graphicHeight;
                var height = style.graphicHeight || style.graphicWidth;
                width = width ? width : style.pointRadius*2;
                height = height ? height : style.pointRadius*2;

                var resolution = this.getResolution();
                var xOffset = (style.graphicXOffset != undefined) ?
                    style.graphicXOffset : -(0.5 * width);
                var yOffset = (style.graphicYOffset != undefined) ?
                    style.graphicYOffset : -(0.5 * height);
                
                node.style.left = ((((geometry.x - this.featureDx)/resolution - this.offset.x)+xOffset) | 0) + "px";
                node.style.top = (((geometry.y/resolution - this.offset.y)-(yOffset+height)) | 0) + "px";
                node.style.width = width + "px";
                node.style.height = height + "px";
                node.style.flip = "y";
                
                // modify fillColor and options for stroke styling below
                fillColor = "none";
                options.isStroked = false;
            } else if (this.isComplexSymbol(style.graphicName)) {
                var cache = this.importSymbol(style.graphicName);
                node.path = cache.path;
                node.coordorigin = cache.left + "," + cache.bottom;
                var size = cache.size;
                node.coordsize = size + "," + size;        
                this.drawCircle(node, geometry, style.pointRadius);
                node.style.flip = "y";
            } else {
                this.drawCircle(node, geometry, style.pointRadius);
            }
        }

        // fill 
        if (options.isFilled) { 
            node.fillcolor = fillColor; 
        } else { 
            node.filled = "false"; 
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
            fill.opacity = style.fillOpacity;

            if (node._geometryClass === "OpenLayers.Geometry.Point" &&
                    style.externalGraphic) {

                // override fillOpacity
                if (style.graphicOpacity) {
                    fill.opacity = style.graphicOpacity;
                }
                
                fill.src = style.externalGraphic;
                fill.type = "frame";
                
                if (!(style.graphicWidth && style.graphicHeight)) {
                  fill.aspect = "atmost";
                }                
            }
            if (fill.parentNode != node) {
                node.appendChild(fill);
            }
        }

        // additional rendering for rotated graphics or symbols
        var rotation = style.rotation;
        if ((rotation !== undefined || node._rotation !== undefined)) {
            node._rotation = rotation;
            if (style.externalGraphic) {
                this.graphicRotate(node, xOffset, yOffset, style);
                // make the fill fully transparent, because we now have
                // the graphic as imagedata element. We cannot just remove
                // the fill, because this is part of the hack described
                // in graphicRotate
                fill.opacity = 0;
            } else if(node._geometryClass === "OpenLayers.Geometry.Point") {
                node.style.rotation = rotation || 0;
            }
        }

        // stroke 
        var strokes = node.getElementsByTagName("stroke");
        var stroke = (strokes.length == 0) ? null : strokes[0];
        if (!options.isStroked) {
            node.stroked = false;
            if (stroke) {
                stroke.on = false;
            }
        } else {
            if (!stroke) {
                stroke = this.createNode('olv:stroke', node.id + "_stroke");
                node.appendChild(stroke);
            }
            stroke.on = true;
            stroke.color = style.strokeColor; 
            stroke.weight = style.strokeWidth + "px"; 
            stroke.opacity = style.strokeOpacity;
            stroke.endcap = style.strokeLinecap == 'butt' ? 'flat' :
                (style.strokeLinecap || 'round');
            if (style.strokeDashstyle) {
                stroke.dashstyle = this.dashStyle(style);
            }
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
     * style   - {Object}
     */
    graphicRotate: function(node, xOffset, yOffset, style) {
        var style = style || node._style;
        var rotation = style.rotation || 0;
        
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
                    this.graphicRotate(node, xOffset, yOffset, style);
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

        var rot = rotation * Math.PI / 180;
        var sintheta = Math.sin(rot);
        var costheta = Math.cos(rot);

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
     * Does some node postprocessing to work around browser issues:
     * - Some versions of Internet Explorer seem to be unable to set fillcolor
     *   and strokecolor to "none" correctly before the fill node is appended
     *   to a visible vml node. This method takes care of that and sets
     *   fillcolor and strokecolor again if needed.
     * - In some cases, a node won't become visible after being drawn. Setting
     *   style.visibility to "visible" works around that.
     * 
     * Parameters:
     * node - {DOMElement}
     */
    postDraw: function(node) {
        node.style.visibility = "visible";
        var fillColor = node._style.fillColor;
        var strokeColor = node._style.strokeColor;
        if (fillColor == "none" &&
                node.fillcolor != fillColor) {
            node.fillcolor = fillColor;
        }
        if (strokeColor == "none" &&
                node.strokecolor != strokeColor) {
            node.strokecolor = strokeColor;
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
                new OpenLayers.Bounds(((bbox.left - this.featureDx)/resolution - this.offset.x) | 0,
                                      (bbox.bottom/resolution - this.offset.y) | 0,
                                      ((bbox.right - this.featureDx)/resolution - this.offset.x) | 0,
                                      (bbox.top/resolution - this.offset.y) | 0);
            
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
            node.id = id;
        }
        
        // IE hack to make elements unselectable, to prevent 'blue flash'
        // while dragging vectors; #1410
        node.unselectable = 'on';
        node.onselectstart = OpenLayers.Function.False;
        
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
     * Parameters:
     * suffix - {String} suffix to append to the id
     *
     * Returns:
     * {DOMElement}
     */
    createRoot: function(suffix) {
        return this.nodeFactory(this.container.id + suffix, "olv:group");
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

            node.style.left = ((((geometry.x - this.featureDx) /resolution - this.offset.x) | 0) - radius) + "px";
            node.style.top = (((geometry.y /resolution - this.offset.y) | 0) - radius) + "px";
    
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
            x = ((comp.x - this.featureDx)/resolution - this.offset.x) | 0;
            y = (comp.y/resolution - this.offset.y) | 0;
            parts[i] = " " + x + "," + y + " l ";
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
        var j, jj, points, area, first, second, i, ii, comp, pathComp, x, y;
        for (j=0, jj=geometry.components.length; j<jj; j++) {
            path.push("m");
            points = geometry.components[j].components;
            // we only close paths of interior rings with area
            area = (j === 0);
            first = null;
            second = null;
            for (i=0, ii=points.length; i<ii; i++) {
                comp = points[i];
                x = ((comp.x - this.featureDx) / resolution - this.offset.x) | 0;
                y = (comp.y / resolution - this.offset.y) | 0;
                pathComp = " " + x + "," + y;
                path.push(pathComp);
                if (i==0) {
                    path.push(" l");
                }
                if (!area) {
                    // IE improperly renders sub-paths that have no area.
                    // Instead of checking the area of every ring, we confirm
                    // the ring has at least three distinct points.  This does
                    // not catch all non-zero area cases, but it greatly improves
                    // interior ring digitizing and is a minor performance hit
                    // when rendering rings with many points.
                    if (!first) {
                        first = pathComp;
                    } else if (first != pathComp) {
                        if (!second) {
                            second = pathComp;
                        } else if (second != pathComp) {
                            // stop looking
                            area = true;
                        }
                    }
                }
            }
            path.push(area ? " x " : " ");
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
    
        node.style.left = (((geometry.x - this.featureDx)/resolution - this.offset.x) | 0) + "px";
        node.style.top = ((geometry.y/resolution - this.offset.y) | 0) + "px";
        node.style.width = ((geometry.width/resolution) | 0) + "px";
        node.style.height = ((geometry.height/resolution) | 0) + "px";
        
        return node;
    },
    
    /**
     * Method: drawText
     * This method is only called by the renderer itself.
     * 
     * Parameters: 
     * featureId - {String}
     * style -
     * location - {<OpenLayers.Geometry.Point>}
     */
    drawText: function(featureId, style, location) {
        var label = this.nodeFactory(featureId + this.LABEL_ID_SUFFIX, "olv:rect");
        var textbox = this.nodeFactory(featureId + this.LABEL_ID_SUFFIX + "_textbox", "olv:textbox");
        
        var resolution = this.getResolution();
        label.style.left = (((location.x - this.featureDx)/resolution - this.offset.x) | 0) + "px";
        label.style.top = ((location.y/resolution - this.offset.y) | 0) + "px";
        label.style.flip = "y";

        textbox.innerText = style.label;

        if (style.cursor != "inherit" && style.cursor != null) {
            textbox.style.cursor = style.cursor;
        }
        if (style.fontColor) {
            textbox.style.color = style.fontColor;
        }
        if (style.fontOpacity) {
            textbox.style.filter = 'alpha(opacity=' + (style.fontOpacity * 100) + ')';
        }
        if (style.fontFamily) {
            textbox.style.fontFamily = style.fontFamily;
        }
        if (style.fontSize) {
            textbox.style.fontSize = style.fontSize;
        }
        if (style.fontWeight) {
            textbox.style.fontWeight = style.fontWeight;
        }
        if (style.fontStyle) {
            textbox.style.fontStyle = style.fontStyle;
        }
        if(style.labelSelect === true) {
            label._featureId = featureId;
            textbox._featureId = featureId;
            textbox._geometry = location;
            textbox._geometryClass = location.CLASS_NAME;
        }
        textbox.style.whiteSpace = "nowrap";
        // fun with IE: IE7 in standards compliant mode does not display any
        // text with a left inset of 0. So we set this to 1px and subtract one
        // pixel later when we set label.style.left
        textbox.inset = "1px,0px,0px,0px";

        if(!label.parentNode) {
            label.appendChild(textbox);
            this.textRoot.appendChild(label);
        }

        var align = style.labelAlign || "cm";
        if (align.length == 1) {
            align += "m";
        }
        var xshift = textbox.clientWidth *
            (OpenLayers.Renderer.VML.LABEL_SHIFT[align.substr(0,1)]);
        var yshift = textbox.clientHeight *
            (OpenLayers.Renderer.VML.LABEL_SHIFT[align.substr(1,1)]);
        label.style.left = parseInt(label.style.left)-xshift-1+"px";
        label.style.top = parseInt(label.style.top)+yshift+"px";
        
    },
    
    /**
     * Method: moveRoot
     * moves this renderer's root to a different renderer.
     * 
     * Parameters:
     * renderer - {<OpenLayers.Renderer>} target renderer for the moved root
     * root - {DOMElement} optional root node. To be used when this renderer
     *     holds roots from multiple layers to tell this method which one to
     *     detach
     * 
     * Returns:
     * {Boolean} true if successful, false otherwise
     */
    moveRoot: function(renderer) {
        var layer = this.map.getLayer(renderer.container.id);
        if(layer instanceof OpenLayers.Layer.Vector.RootContainer) {
            layer = this.map.getLayer(this.container.id);
        }
        layer && layer.renderer.clear();
        OpenLayers.Renderer.Elements.prototype.moveRoot.apply(this, arguments);
        layer && layer.redraw();
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
        }

        var symbolExtent = new OpenLayers.Bounds(
                                    Number.MAX_VALUE, Number.MAX_VALUE, 0, 0);
        
        var pathitems = ["m"];
        for (var i=0; i<symbol.length; i=i+2) {
            var x = symbol[i];
            var y = symbol[i+1];
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

        var diff = (symbolExtent.getWidth() - symbolExtent.getHeight()) / 2;
        if(diff > 0) {
            symbolExtent.bottom = symbolExtent.bottom - diff;
            symbolExtent.top = symbolExtent.top + diff;
        } else {
            symbolExtent.left = symbolExtent.left + diff;
            symbolExtent.right = symbolExtent.right - diff;
        }
        
        cache = {
            path: path,
            size: symbolExtent.getWidth(), // equals getHeight() now
            left: symbolExtent.left,
            bottom: symbolExtent.bottom
        };
        this.symbolCache[id] = cache;
        
        return cache;
    },
    
    CLASS_NAME: "OpenLayers.Renderer.VML"
});

/**
 * Constant: OpenLayers.Renderer.VML.LABEL_SHIFT
 * {Object}
 */
OpenLayers.Renderer.VML.LABEL_SHIFT = {
    "l": 0,
    "c": .5,
    "r": 1,
    "t": 0,
    "m": .5,
    "b": 1
};
