/* Copyright (c) 2009 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML.js
 * @requires OpenLayers/Geometry/Polygon.js
 * @requires OpenLayers/Geometry/Point.js
 * @requires OpenLayers/Geometry/MultiPolygon.js
 * @requires OpenLayers/Geometry/LinearRing.js
 */

/**
 * Class: OpenLayers.Format.ArcXML
 * Read/Wite ArcXML. Create a new instance with the <OpenLayers.Format.ArcXML>
 *     constructor.
 * 
 * Inherits from:
 *  - <OpenLayers.Format>
 */
OpenLayers.Format.ArcXML = OpenLayers.Class(OpenLayers.Format.XML, {

    /**
     * Property: fontStyleKeys
     * {Array} List of keys used in font styling.
     */
    fontStyleKeys: [
        'antialiasing', 'blockout', 'font', 'fontcolor','fontsize', 'fontstyle',
        'glowing', 'interval', 'outline', 'printmode', 'shadow', 'transparency'
    ],

    /**
     * Property: request
     * A get_image request destined for an ArcIMS server.
     */
    request: null,
    
    /**
     * Property: response
     * A parsed response from an ArcIMS server.
     */
    response: null,

    /**
     * Constructor: OpenLayers.Format.ArcXML
     * Create a new parser/writer for ArcXML.  Create an instance of this class
     *    to begin authoring a request to an ArcIMS service.  This is used
     *    primarily by the ArcIMS layer, but could be used to do other wild
     *    stuff, like geocoding.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        this.request = new OpenLayers.Format.ArcXML.Request();
        this.response = new OpenLayers.Format.ArcXML.Response();

        if (options) {
            if (options.requesttype == "feature") {
                this.request.get_image = null;
            
                var qry = this.request.get_feature.query;
                this.addCoordSys(qry.featurecoordsys, options.featureCoordSys);
                this.addCoordSys(qry.filtercoordsys, options.filterCoordSys);
            
                if (options.polygon) {
                    qry.isspatial = true;
                    qry.spatialfilter.polygon = options.polygon;
                } else if (options.envelope) {
                    qry.isspatial = true;
                    qry.spatialfilter.envelope = {minx:0, miny:0, maxx:0, maxy:0};
                    this.parseEnvelope(qry.spatialfilter.envelope, options.envelope);
                }
            } else if (options.requesttype == "image") {
                this.request.get_feature = null;
            
                var props = this.request.get_image.properties;
                this.parseEnvelope(props.envelope, options.envelope);
            
                this.addLayers(props.layerlist, options.layers);
                this.addImageSize(props.imagesize, options.tileSize);
                this.addCoordSys(props.featurecoordsys, options.featureCoordSys);
                this.addCoordSys(props.filtercoordsys, options.filterCoordSys);
            } else {
                // if an arcxml object is being created with no request type, it is
                // probably going to consume a response, so do not throw an error if
                // the requesttype is not defined
                this.request = null;
            }
        }
        
        OpenLayers.Format.XML.prototype.initialize.apply(this, [options]);
    },
    
    /**
     * Method: parseEnvelope
     * Parse an array of coordinates into an ArcXML envelope structure.
     *
     * Parameters:
     * env - {Object} An envelope object that will contain the parsed coordinates.
     * arr - {Array(double)} An array of coordinates in the order: [ minx, miny, maxx, maxy ]
     */
    parseEnvelope: function(env, arr) {
        if (arr && arr.length == 4) {          
            env.minx = arr[0];
            env.miny = arr[1];
            env.maxx = arr[2];
            env.maxy = arr[3];
        }
    },
    
    /** 
     * Method: addLayers
     * Add a collection of layers to another collection of layers. Each layer in the list is tuple of
     * { id, visible }.  These layer collections represent the 
     * /ARCXML/REQUEST/get_image/PROPERTIES/LAYERLIST/LAYERDEF items in ArcXML
     *
     * TODO: Add support for dynamic layer rendering.
     *
     * Parameters:
     * ll - {Array({id,visible})} A list of layer definitions.
     * lyrs - {Array({id,visible})} A list of layer definitions.
     */
    addLayers: function(ll, lyrs) {
        for(var lind = 0, len=lyrs.length; lind < len; lind++) {
            ll.push(lyrs[lind]);
        }
    },
    
    /**
     * Method: addImageSize
     * Set the size of the requested image.
     *
     * Parameters:
     * imsize - {Object} An ArcXML imagesize object.
     * olsize - {OpenLayers.Size} The image size to set.
     */
    addImageSize: function(imsize, olsize) {
        if (olsize !== null) {
            imsize.width = olsize.w;
            imsize.height = olsize.h;
            imsize.printwidth = olsize.w;
            imsize.printheight = olsize.h;
        }
    },

    /**
     * Method: addCoordSys
     * Add the coordinate system information to an object. The object may be 
     *
     * Parameters:
     * featOrFilt - {Object} A featurecoordsys or filtercoordsys ArcXML structure.
     * fsys - {String} or {OpenLayers.Projection} or {filtercoordsys} or 
     * {featurecoordsys} A projection representation. If it's a {String}, 
     * the value is assumed to be the SRID.  If it's a {OpenLayers.Projection} 
     * AND Proj4js is available, the projection number and name are extracted 
     * from there.  If it's a filter or feature ArcXML structure, it is copied.
     */
    addCoordSys: function(featOrFilt, fsys) {
        if (typeof fsys == "string") {
            featOrFilt.id = parseInt(fsys);
            featOrFilt.string = fsys;
        }
        // is this a proj4js instance?
        else if (typeof fsys == "object" && fsys.proj !== null){
            featOrFilt.id = fsys.proj.srsProjNumber;
            featOrFilt.string = fsys.proj.srsCode;
        } else {
            featOrFilt = fsys;
        }
    },

    /**
     * APIMethod: iserror
     * Check to see if the response from the server was an error.
     *
     * Parameters:
     * data - {String} or {DOMElement} data to read/parse. If nothing is supplied,
     * the current response is examined.
     *
     * Returns:
     * {Boolean} true if the response was an error.
     */
    iserror: function(data) {
        var ret = null; 
        
        if (!data) {
            ret = (this.response.error !== '');
        } else {
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
            var errorNodes = data.documentElement.getElementsByTagName("ERROR");
            ret = (errorNodes !== null && errorNodes.length > 0);
        }

        return ret;
    },

    /**
     * APIMethod: read
     * Read data from a string, and return an response. 
     * 
     * Parameters:
     * data - {String} or {DOMElement} data to read/parse.
     *
     * Returns:
     * {OpenLayers.Format.ArcXML.Response} An ArcXML response. Note that this response
     *     data may change in the future. 
     */
    read: function(data) {
        if(typeof data == "string") {
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }
        
        var arcNode = null;
        if (data && data.documentElement) {
            if(data.documentElement.nodeName == "ARCXML") {
                arcNode = data.documentElement;
            } else {
                arcNode = data.documentElement.getElementsByTagName("ARCXML")[0];
            }
        }
          
        if (!arcNode) {
            var error, source;
            try {
                error = data.firstChild.nodeValue;
                source = data.firstChild.childNodes[1].firstChild.nodeValue;
            } catch (err) {
                // pass
            }
            throw {
                message: "Error parsing the ArcXML request", 
                error: error,
                source: source
            };
        }
        
        var response = this.parseResponse(arcNode);
        return response;
    },
    
    /**
     * APIMethod: write
     * Generate an ArcXml document string for sending to an ArcIMS server. 
     * 
     * Returns:
     * {String} A string representing the ArcXML document request.
     */
    write: function(request) {       
        if (!request) {
            request = this.request;
        }    
        var root = this.createElementNS("", "ARCXML");
        root.setAttribute("version","1.1");

        var reqElem = this.createElementNS("", "REQUEST");
        
        if (request.get_image != null) {
            var getElem = this.createElementNS("", "GET_IMAGE");
            reqElem.appendChild(getElem);

            var propElem = this.createElementNS("", "PROPERTIES");
            getElem.appendChild(propElem);

            var props = request.get_image.properties;
            if (props.featurecoordsys != null) {
                var feat = this.createElementNS("", "FEATURECOORDSYS");
                propElem.appendChild(feat);
                
                if (props.featurecoordsys.id === 0) {
                    feat.setAttribute("string", props.featurecoordsys['string']);
                }
                else {
                    feat.setAttribute("id", props.featurecoordsys.id);
                }
            }
          
            if (props.filtercoordsys != null) {
                var filt = this.createElementNS("", "FILTERCOORDSYS");
                propElem.appendChild(filt);

                if (props.filtercoordsys.id === 0) {
                    filt.setAttribute("string", props.filtercoordsys.string);
                }
                else {
                    filt.setAttribute("id", props.filtercoordsys.id);
                }
            }
          
            if (props.envelope != null) {
                var env = this.createElementNS("", "ENVELOPE");
                propElem.appendChild(env);

                env.setAttribute("minx", props.envelope.minx);
                env.setAttribute("miny", props.envelope.miny);
                env.setAttribute("maxx", props.envelope.maxx);
                env.setAttribute("maxy", props.envelope.maxy);
            }        
          
            var imagesz = this.createElementNS("", "IMAGESIZE");
            propElem.appendChild(imagesz);
          
            imagesz.setAttribute("height", props.imagesize.height);
            imagesz.setAttribute("width", props.imagesize.width);
          
            if (props.imagesize.height != props.imagesize.printheight ||
                 props.imagesize.width != props.imagesize.printwidth) {
                imagesz.setAttribute("printheight", props.imagesize.printheight);
                imagesz.setArrtibute("printwidth", props.imagesize.printwidth);
            }
          
            if (props.background != null) {
                var backgrnd = this.createElementNS("", "BACKGROUND");
                propElem.appendChild(backgrnd);
            
                backgrnd.setAttribute("color", 
                    props.background.color.r + "," + 
                    props.background.color.g + "," + 
                    props.background.color.b);
              
                if (props.background.transcolor !== null) {
                    backgrnd.setAttribute("transcolor", 
                        props.background.transcolor.r + "," + 
                        props.background.transcolor.g + "," + 
                        props.background.transcolor.b);
                }
            }
          
            if (props.layerlist != null && props.layerlist.length > 0) {
                var layerlst = this.createElementNS("", "LAYERLIST");
                propElem.appendChild(layerlst);
            
                for (var ld = 0; ld < props.layerlist.length; ld++) {
                    var ldef = this.createElementNS("", "LAYERDEF");
                    layerlst.appendChild(ldef);
              
                    ldef.setAttribute("id", props.layerlist[ld].id);
                    ldef.setAttribute("visible", props.layerlist[ld].visible);
              
                    if (typeof props.layerlist[ld].query == "object") {
                        var query = props.layerlist[ld].query;

                        if (query.where.length < 0) {
                            continue;
                        }
                  
                        var queryElem = null;
                        if (typeof query.spatialfilter == "boolean" && query.spatialfilter) {
                            // handle spatial filter madness
                            queryElem = this.createElementNS("", "SPATIALQUERY");
                        }
                        else {
                            queryElem = this.createElementNS("", "QUERY");
                        }
                
                        queryElem.setAttribute("where", query.where);
                
                        if (typeof query.accuracy == "number" && query.accuracy > 0) {
                            queryElem.setAttribute("accuracy", query.accuracy);
                        }
                        if (typeof query.featurelimit == "number" && query.featurelimit < 2000) {
                            queryElem.setAttribute("featurelimit", query.featurelimit);
                        }
                        if (typeof query.subfields == "string" && query.subfields != "#ALL#") {
                            queryElem.setAttribute("subfields", query.subfields);
                        }
                        if (typeof query.joinexpression == "string" && query.joinexpression.length > 0) {
                            queryElem.setAttribute("joinexpression", query.joinexpression);
                        }
                        if (typeof query.jointables == "string" && query.jointables.length > 0) {
                            queryElem.setAttribute("jointables", query.jointables);
                        }

                        ldef.appendChild(queryElem);
                    }
              
                    if (typeof props.layerlist[ld].renderer == "object") {
                        this.addRenderer(ldef, props.layerlist[ld].renderer);                  
                    }
                }
            }
        } else if (request.get_feature != null) {
            var getElem = this.createElementNS("", "GET_FEATURES");
            getElem.setAttribute("outputmode", "newxml");
            getElem.setAttribute("checkesc", "true");
          
            if (request.get_feature.geometry) {
                getElem.setAttribute("geometry", request.get_feature.geometry);
            }
            else {
                getElem.setAttribute("geometry", "false");
            }
          
            if (request.get_feature.compact) {
                getElem.setAttribute("compact", request.get_feature.compact);
            }
          
            if (request.get_feature.featurelimit == "number") {
                getElem.setAttribute("featurelimit", request.get_feature.featurelimit);
            }
          
            getElem.setAttribute("globalenvelope", "true");
            reqElem.appendChild(getElem);
          
            if (request.get_feature.layer != null && request.get_feature.layer.length > 0) {
                var lyrElem = this.createElementNS("", "LAYER");
                lyrElem.setAttribute("id", request.get_feature.layer);
                getElem.appendChild(lyrElem);
            }
          
            var fquery = request.get_feature.query;
            if (fquery != null) {
                var qElem = null;
                if (fquery.isspatial) {
                    qElem = this.createElementNS("", "SPATIALQUERY");
                } else {
                    qElem = this.createElementNS("", "QUERY");
                }
                getElem.appendChild(qElem);
                
                if (typeof fquery.accuracy == "number") {
                    qElem.setAttribute("accuracy", fquery.accuracy);
                }
                //qElem.setAttribute("featurelimit", "5");
            
                if (fquery.featurecoordsys != null) {
                    var fcsElem1 = this.createElementNS("", "FEATURECOORDSYS");
              
                    if (fquery.featurecoordsys.id == 0) {
                        fcsElem1.setAttribute("string", fquery.featurecoordsys.string);
                    } else {
                        fcsElem1.setAttribute("id", fquery.featurecoordsys.id);
                    }
                    qElem.appendChild(fcsElem1);
                }
            
                if (fquery.filtercoordsys != null) {
                    var fcsElem2 = this.createElementNS("", "FILTERCOORDSYS");
              
                    if (fquery.filtercoordsys.id === 0) {
                        fcsElem2.setAttribute("string", fquery.filtercoordsys.string);
                    } else {
                        fcsElem2.setAttribute("id", fquery.filtercoordsys.id);
                    }
                    qElem.appendChild(fcsElem2);
                }
            
                if (fquery.buffer > 0) {   
                    var bufElem = this.createElementNS("", "BUFFER");
                    bufElem.setAttribute("distance", fquery.buffer);
                    qElem.appendChild(bufElem);
                }
            
                if (fquery.isspatial) {
                    var spfElem = this.createElementNS("", "SPATIALFILTER");
                    spfElem.setAttribute("relation", fquery.spatialfilter.relation);
                    qElem.appendChild(spfElem);
              
                    if (fquery.spatialfilter.envelope) {
                        var envElem = this.createElementNS("", "ENVELOPE"); 
                        envElem.setAttribute("minx", fquery.spatialfilter.envelope.minx);
                        envElem.setAttribute("miny", fquery.spatialfilter.envelope.miny);
                        envElem.setAttribute("maxx", fquery.spatialfilter.envelope.maxx);
                        envElem.setAttribute("maxy", fquery.spatialfilter.envelope.maxy);
                        spfElem.appendChild(envElem);
                    } else if(typeof fquery.spatialfilter.polygon == "object") {
                        spfElem.appendChild(this.writePolygonGeometry(fquery.spatialfilter.polygon));                
                    }
                }
            
                if (fquery.where != null && fquery.where.length > 0) {
                    qElem.setAttribute("where", fquery.where);
                }
            }
        }

        root.appendChild(reqElem);

        return OpenLayers.Format.XML.prototype.write.apply(this, [root]);
    },
    
    
    addGroupRenderer: function(ldef, toprenderer) {
        var topRelem = this.createElementNS("", "GROUPRENDERER");
        ldef.appendChild(topRelem);
      
        for (var rind = 0; rind < toprenderer.length; rind++) {
            var renderer = toprenderer[rind];
            this.addRenderer(topRelem, renderer);
        }
    },
    
    
    addRenderer: function(topRelem, renderer) {
        if (renderer instanceof Array) {
            this.addGroupRenderer(topRelem, renderer);
        } else {
            var renderElem = this.createElementNS("", renderer.type.toUpperCase() + "RENDERER");
            topRelem.appendChild(renderElem);
          
            if (renderElem.tagName == "VALUEMAPRENDERER") {
                this.addValueMapRenderer(renderElem, renderer);
            } else if (renderElem.tagName == "VALUEMAPLABELRENDERER") {
                this.addValueMapLabelRenderer(renderElem, renderer);
            } else if (renderElem.tagName == "SIMPLELABELRENDERER") {
                this.addSimpleLabelRenderer(renderElem, renderer);
            } else if (renderElem.tagName == "SCALEDEPENDENTRENDERER") {
                this.addScaleDependentRenderer(renderElem, renderer);
            }
        }             
    },
    
    
    addScaleDependentRenderer: function(renderElem, renderer) {
        if (typeof renderer.lower == "string" || typeof renderer.lower == "number") {
            renderElem.setAttribute("lower", renderer.lower);
        }
        if (typeof renderer.upper == "string" || typeof renderer.upper == "number") {
            renderElem.setAttribute("upper", renderer.upper);
        }
        
        this.addRenderer(renderElem, renderer.renderer);
    },
    
    
    addValueMapLabelRenderer: function(renderElem, renderer) {
        renderElem.setAttribute("lookupfield", renderer.lookupfield);
        renderElem.setAttribute("labelfield", renderer.labelfield);
      
        if (typeof renderer.exacts == "object") {
            for (var ext=0, extlen=renderer.exacts.length; ext<extlen; ext++) {
                var exact = renderer.exacts[ext];
          
                var eelem = this.createElementNS("", "EXACT");
          
                if (typeof exact.value == "string") {
                    eelem.setAttribute("value", exact.value);
                }
                if (typeof exact.label == "string") {
                    eelem.setAttribute("label", exact.label);
                }
                if (typeof exact.method == "string") {
                    eelem.setAttribute("method", exact.method);
                }

                renderElem.appendChild(eelem);
            
                if (typeof exact.symbol == "object") {
                    var selem = null;
                
                    if (exact.symbol.type == "text") {
                        selem = this.createElementNS("", "TEXTSYMBOL");
                    }
                
                    if (selem != null) {
                        var keys = this.fontStyleKeys;
                        for (var i = 0, len = keys.length; i < len; i++) {
                            var key = keys[i];
                            if (exact.symbol[key]) {
                                selem.setAttribute(key, exact.symbol[key]);
                            }
                        }    
                        eelem.appendChild(selem);
                    }
                }
            } // for each exact
        }      
    },
    
    addValueMapRenderer: function(renderElem, renderer) {
        renderElem.setAttribute("lookupfield", renderer.lookupfield);
        
        if (typeof renderer.ranges == "object") {
            for(var rng=0, rnglen=renderer.ranges.length; rng<rnglen; rng++) {
                var range = renderer.ranges[rng];
                
                var relem = this.createElementNS("", "RANGE");
                relem.setAttribute("lower", range.lower);
                relem.setAttribute("upper", range.upper);
                
                renderElem.appendChild(relem);
                
                if (typeof range.symbol == "object") {
                    var selem = null;
              
                    if (range.symbol.type == "simplepolygon") {
                        selem = this.createElementNS("", "SIMPLEPOLYGONSYMBOL");
                    }
              
                    if (selem != null) {
                        if (typeof range.symbol.boundarycolor == "string") {
                            selem.setAttribute("boundarycolor", range.symbol.boundarycolor);
                        }
                        if (typeof range.symbol.fillcolor == "string") {
                            selem.setAttribute("fillcolor", range.symbol.fillcolor);
                        }
                        if (typeof range.symbol.filltransparency == "number") {
                            selem.setAttribute("filltransparency", range.symbol.filltransparency);
                        }
                        relem.appendChild(selem);
                    }   
                }
            } // for each range
        } else if (typeof renderer.exacts == "object") {
            for (var ext=0, extlen=renderer.exacts.length; ext<extlen; ext++) {
                var exact = renderer.exacts[ext];
          
                var eelem = this.createElementNS("", "EXACT");
                if (typeof exact.value == "string") {
                    eelem.setAttribute("value", exact.value);
                }
                if (typeof exact.label == "string") {
                    eelem.setAttribute("label", exact.label);
                }
                if (typeof exact.method == "string") {
                    eelem.setAttribute("method", exact.method);
                }
            
                renderElem.appendChild(eelem);
            
                if (typeof exact.symbol == "object") {
                    var selem = null;
            
                    if (exact.symbol.type == "simplemarker") {
                        selem = this.createElementNS("", "SIMPLEMARKERSYMBOL");
                    }
            
                    if (selem != null) {
                        if (typeof exact.symbol.antialiasing == "string") {
                            selem.setAttribute("antialiasing", exact.symbol.antialiasing);
                        }
                        if (typeof exact.symbol.color == "string") {
                            selem.setAttribute("color", exact.symbol.color);
                        }
                        if (typeof exact.symbol.outline == "string") {
                            selem.setAttribute("outline", exact.symbol.outline);
                        }
                        if (typeof exact.symbol.overlap == "string") {
                            selem.setAttribute("overlap", exact.symbol.overlap);
                        }
                        if (typeof exact.symbol.shadow == "string") {
                            selem.setAttribute("shadow", exact.symbol.shadow);
                        }
                        if (typeof exact.symbol.transparency == "number") {
                            selem.setAttribute("transparency", exact.symbol.transparency);
                        }
                        //if (typeof exact.symbol.type == "string")
                        //    selem.setAttribute("type", exact.symbol.type);
                        if (typeof exact.symbol.usecentroid == "string") {
                            selem.setAttribute("usecentroid", exact.symbol.usecentroid);
                        }
                        if (typeof exact.symbol.width == "number") {
                            selem.setAttribute("width", exact.symbol.width);
                        }
                
                        eelem.appendChild(selem);
                    }
                }
            } // for each exact
        }
    },
    
    
    addSimpleLabelRenderer: function(renderElem, renderer) {
        renderElem.setAttribute("field", renderer.field);
        var keys = ['featureweight', 'howmanylabels', 'labelbufferratio', 
                    'labelpriorities', 'labelweight', 'linelabelposition',
                    'rotationalangles'];
        for (var i=0, len=keys.length; i<len; i++) {
            var key = keys[i];
            if (renderer[key]) {
                renderElem.setAttribute(key, renderer[key]);
            }
        }     
           
        if (renderer.symbol.type == "text") {
            var symbol = renderer.symbol;
            var selem = this.createElementNS("", "TEXTSYMBOL");
            renderElem.appendChild(selem);
          
            var keys = this.fontStyleKeys;
            for (var i=0, len=keys.length; i<len; i++) {
                var key = keys[i];
                if (symbol[key]) {
                    selem.setAttribute(key, renderer[key]);
                }
            }    
        }    
    },
    
    writePolygonGeometry: function(polygon) {
        if (!(polygon instanceof OpenLayers.Geometry.Polygon)) {
            throw { 
                message:'Cannot write polygon geometry to ArcXML with an ' +
                    polygon.CLASS_NAME + ' object.',
                geometry: polygon
            };
        }
        
        var polyElem = this.createElementNS("", "POLYGON");
      
        for (var ln=0, lnlen=polygon.components.length; ln<lnlen; ln++) {
            var ring = polygon.components[ln];
            var ringElem = this.createElementNS("", "RING");
        
            for (var rn=0, rnlen=ring.components.length; rn<rnlen; rn++) {
                var point = ring.components[rn];
                var pointElem = this.createElementNS("", "POINT");
            
                pointElem.setAttribute("x", point.x);
                pointElem.setAttribute("y", point.y);
            
                ringElem.appendChild(pointElem);
            }
        
            polyElem.appendChild(ringElem);
        }
      
        return polyElem;
    },
    
    /**
     * Method: parseResponse
     * Take an ArcXML response, and parse in into this object's internal properties.
     *
     * Parameters:
     * data - {String} or {DOMElement} The ArcXML response, as either a string or the
     * top level DOMElement of the response.
     */
    parseResponse: function(data) {
        if(typeof data == "string") { 
            var newData = new OpenLayers.Format.XML();
            data = newData.read(data);
        }
        var response = new OpenLayers.Format.ArcXML.Response();
        
        var errorNode = data.getElementsByTagName("ERROR");
        
        if (errorNode != null && errorNode.length > 0) {
            response.error = this.getChildValue(errorNode, "Unknown error.");
        } else {
            var responseNode = data.getElementsByTagName("RESPONSE");
          
            if (responseNode == null || responseNode.length == 0) {
                response.error = "No RESPONSE tag found in ArcXML response.";
                return response;
            }
          
            var rtype = responseNode[0].firstChild.nodeName;
            if (rtype == "#text") {
                rtype = responseNode[0].firstChild.nextSibling.nodeName;
            }
          
            if (rtype == "IMAGE") {
                var envelopeNode = data.getElementsByTagName("ENVELOPE");
                var outputNode = data.getElementsByTagName("OUTPUT");
                
                if (envelopeNode == null || envelopeNode.length == 0) {
                    response.error = "No ENVELOPE tag found in ArcXML response.";
                } else if (outputNode == null || outputNode.length == 0) {
                    response.error = "No OUTPUT tag found in ArcXML response.";
                } else {
                    var envAttr = this.parseAttributes(envelopeNode[0]);            
                    var outputAttr = this.parseAttributes(outputNode[0]);
                  
                    if (typeof outputAttr.type == "string") {
                        response.image = { 
                            envelope: envAttr, 
                            output: { 
                                type: outputAttr.type, 
                                data: this.getChildValue(outputNode[0])
                            }
                        };
                    } else {
                        response.image = { envelope: envAttr, output: outputAttr };
                    }
                }
            } else if (rtype == "FEATURES") {
                var features = responseNode[0].getElementsByTagName("FEATURES");
            
                // get the feature count
                var featureCount = features[0].getElementsByTagName("FEATURECOUNT");
                response.features.featurecount = featureCount[0].getAttribute("count");
            
                if (response.features.featurecount > 0) {
                    // get the feature envelope
                    var envelope = features[0].getElementsByTagName("ENVELOPE");
                    response.features.envelope = this.parseAttributes(envelope[0], typeof(0));

                    // get the field values per feature
                    var featureList = features[0].getElementsByTagName("FEATURE");
                    for (var fn = 0; fn < featureList.length; fn++) {
                        var feature = new OpenLayers.Feature.Vector();
                        var fields = featureList[fn].getElementsByTagName("FIELD");

                        for (var fdn = 0; fdn < fields.length; fdn++) {
                            var fieldName = fields[fdn].getAttribute("name");
                            var fieldValue = fields[fdn].getAttribute("value");
                            feature.attributes[ fieldName ] = fieldValue;
                        }

                        var geom = featureList[fn].getElementsByTagName("POLYGON");

                        if (geom.length > 0) {
                            // if there is a polygon, create an openlayers polygon, and assign
                            // it to the .geometry property of the feature
                            var ring = geom[0].getElementsByTagName("RING");

                            var polys = [];
                            for (var rn = 0; rn < ring.length; rn++) {
                                var linearRings = [];
                                linearRings.push(this.parsePointGeometry(ring[rn]));

                                var holes = ring[rn].getElementsByTagName("HOLE");
                                for (var hn = 0; hn < holes.length; hn++) {
                                    linearRings.push(this.parsePointGeometry(holes[hn]));
                                }
                                holes = null;
                                polys.push(new OpenLayers.Geometry.Polygon(linearRings));
                                linearRings = null;
                            }
                            ring = null;
                          
                            if (polys.length == 1) {
                                feature.geometry = polys[0];
                            } else
                            {
                                feature.geometry = new OpenLayers.Geometry.MultiPolygon(polys);
                            }
                        }

                        response.features.feature.push(feature);
                    }
                }
            } else {
                response.error = "Unidentified response type.";
            }
        }
        return response;
    },
    
    
    /**
     * Method: parseAttributes
     *
     * Parameters:
     * node - {<DOMElement>} An element to parse attributes from.
     *
     * Returns:
     * {Object} An attributes object, with properties set to attribute values.
     */
    parseAttributes: function(node,type) {
        var attributes = {};
        for(var attr = 0; attr < node.attributes.length; attr++) {
            if (type == "number") {
                attributes[node.attributes[attr].nodeName] = parseFloat(node.attributes[attr].nodeValue);
            } else {
                attributes[node.attributes[attr].nodeName] = node.attributes[attr].nodeValue;
            }
        }
        return attributes;
    },
    
    
    /**
     * Method: parsePointGeometry
     *
     * Parameters:
     * node - {<DOMElement>} An element to parse <COORDS> or <POINT> arcxml data from.
     *
     * Returns:
     * {OpenLayers.Geometry.LinearRing} A linear ring represented by the node's points.
     */
    parsePointGeometry: function(node) {
        var ringPoints = [];
        var coords = node.getElementsByTagName("COORDS");

        if (coords.length > 0) {
            // if coords is present, it's the only coords item
            var coordArr = this.getChildValue(coords[0]);
            coordArr = coordArr.split(/;/);
            for (var cn = 0; cn < coordArr.length; cn++) {
                var coordItems = coordArr[cn].split(/ /);
                ringPoints.push(new OpenLayers.Geometry.Point(parseFloat(coordItems[0]), parseFloat(coordItems[1])));
            }
            coords = null;
        } else {
            var point = node.getElementsByTagName("POINT");
            if (point.length > 0) {
                for (var pn = 0; pn < point.length; pn++) {
                    ringPoints.push(
                        new OpenLayers.Geometry.Point(
                            parseFloat(point[pn].getAttribute("x")),
                            parseFloat(point[pn].getAttribute("y"))
                        )
                    );
                }
            }
            point = null;
        }

        return new OpenLayers.Geometry.LinearRing(ringPoints);      
    },
    
    CLASS_NAME: "OpenLayers.Format.ArcXML" 
});

OpenLayers.Format.ArcXML.Request = OpenLayers.Class({
    initialize: function(params) {
        var defaults = {
            get_image: {
                properties: {
                    background: null,
                    /*{ 
                        color: { r:255, g:255, b:255 },
                        transcolor: null
                    },*/
                    draw: true,
                    envelope: {
                        minx: 0, 
                        miny: 0, 
                        maxx: 0, 
                        maxy: 0
                    },
                    featurecoordsys: { 
                        id:0, 
                        string:"",
                        datumtransformid:0,
                        datumtransformstring:""
                    },
                    filtercoordsys:{
                        id:0,
                        string:"",
                        datumtransformid:0,
                        datumtransformstring:""
                    },
                    imagesize:{
                        height:0,
                        width:0,
                        dpi:96,
                        printheight:0,
                        printwidth:0,
                        scalesymbols:false
                    },
                    layerlist:[],
                    /* no support for legends */
                    output:{
                        baseurl:"",
                        legendbaseurl:"",
                        legendname:"",
                        legendpath:"",
                        legendurl:"",
                        name:"",
                        path:"",
                        type:"jpg",
                        url:""
                    }
                }
            },

            get_feature: {
                layer: "",
                query: {
                    isspatial: false,
                    featurecoordsys: {
                        id:0,
                        string:"",
                        datumtransformid:0,
                        datumtransformstring:""
                    },
                    filtercoordsys: {
                        id:0,
                        string:"",
                        datumtransformid:0,
                        datumtransformstring:""
                    },
                    buffer:0,
                    where:"",
                    spatialfilter: {
                        relation: "envelope_intersection",
                        envelope: null
                    }
                }
            },
      
            environment: {
                separators: {
                    cs:" ",
                    ts:";"
                }
            },
      
            layer: [],
            workspaces: []
        };
      
        return OpenLayers.Util.extend(this, defaults);      
    },
  
    CLASS_NAME: "OpenLayers.Format.ArcXML.Request"
});

OpenLayers.Format.ArcXML.Response = OpenLayers.Class({  
    initialize: function(params) {
        var defaults = {
            image: {
                envelope:null,
                output:''
            },
      
            features: {
                featurecount: 0,
                envelope: null,
                feature: []
            },
      
            error:''
        };
  
        return OpenLayers.Util.extend(this, defaults);
    },
  
    CLASS_NAME: "OpenLayers.Format.ArcXML.Response"
});
