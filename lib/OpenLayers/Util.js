/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

/**
 * @class
 */
OpenLayers.Util = new Object();

/**
 * @param {String} id
 * @param {OpenLayers.Pixel} px
 * @param {OpenLayers.Size} sz
 * @param {String} position
 * @param {String} border
 * @param {String} overflow
 */
OpenLayers.Util.modifyDOMElement = function(element, id, px, sz, position, 
                                            border, overflow) {

    if (id) {
        element.id = id;
    }
    if (px) {
        element.style.left = px.x + "px";
        element.style.top = px.y + "px";
    }
    if (sz) {
        element.style.width = sz.w + "px";
        element.style.height = sz.h + "px";
    }
    if (position) {
        element.style.position = position;
    }
    if (border) {
        element.style.border = border;
    }
    if (overflow) {
        element.style.overflow = overflow;
    }
};

/** 
* zIndex is NOT set
*
* @param {String} id
* @param {OpenLayers.Pixel} px
* @param {OpenLayers.Size} sz
* @param {String} imgURL
* @param {String} position
* @param {String} border
* @param {String} overflow
*
* @returns A DOM Div created with the specified attributes.
* @type DOMElement
*/
OpenLayers.Util.createDiv = function(id, px, sz, imgURL, position, 
                                     border, overflow) {

    var dom = document.createElement('div');

    //set specific properties
    dom.style.padding = "0";
    dom.style.margin = "0";
    if (imgURL) {
        dom.style.backgroundImage = 'url(' + imgURL + ')';
    }

    //set generic properties
    if (!id) {
        id = OpenLayers.Util.createUniqueID("OpenLayersDiv");
    }
    if (!position) {
        position = "absolute";
    }
    OpenLayers.Util.modifyDOMElement(dom, id, px, sz, 
                                     position, border, overflow);

    return dom;
};

/** 
* @param {String} id
* @param {OpenLayers.Pixel} px
* @param {OpenLayers.Size} sz
* @param {String} imgURL
* @param {String} position
* @param {String} border
* @param {Boolean} delayDisplay
*
* @returns A DOM Image created with the specified attributes.
* @type DOMElement
*/
OpenLayers.Util.createImage = function(id, px, sz, imgURL, position, border, 
                                       delayDisplay) {

    image = document.createElement("img");

    if(delayDisplay) {
        image.style.display = "none";
        Event.observe(image, "load", 
                      OpenLayers.Util.onImageLoad.bindAsEventListener(image));
        Event.observe(image, "error", 
                      OpenLayers.Util.onImageLoadError.bindAsEventListener(image));
        
    }
    
    //set special properties
    image.style.alt = id;
    image.galleryImg = "no";
    if (imgURL) {
        image.src = imgURL;
    }

    //set generic properties
    if (!id) {
        id = OpenLayers.Util.createUniqueID("OpenLayersDiv");
    }
    if (!position) {
        position = "relative";
    }
    OpenLayers.Util.modifyDOMElement(image, id, px, sz, position, border);

        
    return image;
};

/**
 * Set the opacity of a DOM Element
 * Note that for this function to work in IE, elements must "have layout"
 * according to:
 * http://msdn.microsoft.com/workshop/author/dhtml/reference/properties/haslayout.asp
 *
 * @param {DOMElement} element Set the opacity on this DOM element
 * @param {Float} opacity Opacity value (0.0 - 1.0)
 */
OpenLayers.Util.setOpacity = function(element, opacity) {
    element.style.opacity = opacity;
    element.style.filter = 'alpha(opacity=' + (opacity * 100) + ')';
}

OpenLayers.Util.onImageLoad = function() {
    this.style.backgroundColor = null;
    this.style.display = "";  
};

OpenLayers.Util.onImageLoadErrorColor = "pink";

OpenLayers.Util.onImageLoadError = function() {
    this.style.backgroundColor = OpenLayers.Util.onImageLoadErrorColor;
};


OpenLayers.Util.alphaHack = function() {
    var arVersion = navigator.appVersion.split("MSIE");
    var version = parseFloat(arVersion[1]);
    
    return ( (document.body.filters) &&
                      (version >= 5.5) && (version < 7) );
}

/** 
* @param {DOMElement} div Div containing Alpha-adjusted Image
* @param {String} id
* @param {OpenLayers.Pixel} px
* @param {OpenLayers.Size} sz
* @param {String} imgURL
* @param {String} position
* @param {String} border
* @param {String} sizing 'crop', 'scale', or 'image'. Default is "scale"
*/ 
OpenLayers.Util.modifyAlphaImageDiv = function(div, id, px, sz, imgURL, 
                                               position, border, sizing) {

    OpenLayers.Util.modifyDOMElement(div, id, px, sz);

    var img = div.childNodes[0];

    if (imgURL) {
        img.src = imgURL;
    }
    OpenLayers.Util.modifyDOMElement(img, div.id + "_innerImage", null, sz, 
                                     "relative", border);

    if (OpenLayers.Util.alphaHack()) {
        div.style.display = "inline-block";
        if (sizing == null) {
            sizing = "scale";
        }
        div.style.filter = "progid:DXImageTransform.Microsoft" +
                           ".AlphaImageLoader(src='" + img.src + "', " +
                           "sizingMethod='" + sizing + "')";
        img.style.filter = "progid:DXImageTransform.Microsoft" +
                                ".Alpha(opacity=0)";
    }
};

/** 
* @param {String} id
* @param {OpenLayers.Pixel} px
* @param {OpenLayers.Size} sz
* @param {String} imgURL
* @param {String} position
* @param {String} border
* @param {String} sizing 'crop', 'scale', or 'image'. Default is "scale"
* @param {Boolean} delayDisplay
*
* @returns A DOM Div created with a DOM Image inside it. If the hack is 
*           needed for transparency in IE, it is added.
* @type DOMElement
*/ 
OpenLayers.Util.createAlphaImageDiv = function(id, px, sz, imgURL, 
                                               position, border, sizing, delayDisplay) {
    
    var div = OpenLayers.Util.createDiv();
    var img = OpenLayers.Util.createImage(null, null, null, null, null, null, 
                                          false);
    div.appendChild(img);

    if (delayDisplay) {
        img.style.display = "none";
        Event.observe(img, "load",
                      OpenLayers.Util.onImageLoad.bindAsEventListener(div));
        Event.observe(img, "error",
                      OpenLayers.Util.onImageLoadError.bindAsEventListener(div));
    }

    OpenLayers.Util.modifyAlphaImageDiv(div, id, px, sz, imgURL, 
                                        position, border, sizing);
    
    return div;
};


/** Creates a new hashtable and copies over all the keys from the 
*    passed-in object, but storing them under an uppercased
*    version of the key at which they were stored.
* 
* @param {Object} object
*
* @returns A new Object with all the same keys but uppercased
* @type Object
*/
OpenLayers.Util.upperCaseObject = function (object) {
    var uObject = new Object();
    for (var key in object) {
        uObject[key.toUpperCase()] = object[key];
    }
    return uObject;
};

/** Takes a hashtable and copies any keys that don't exist from
*   another hashtable, by analogy with Object.extend() from
*   Prototype.js.
*
* @param {Object} to
* @param {Object} from
*/
OpenLayers.Util.applyDefaults = function (to, from) {
    for (var key in from) {
        if (to[key] == null) {
            to[key] = from[key];
        }
    }
};

/**
* @param {Object} params
*
* @returns a concatenation of the properties of an object in 
*    http parameter notation. 
*    (ex. <i>"key1=value1&key2=value2&key3=value3"</i>)
* @type String
*/
OpenLayers.Util.getParameterString = function(params) {
    paramsArray = new Array();
    
    for (var key in params) {
        var value = params[key];
        if ((value != null) && (typeof value != 'function')) {
            paramsArray.push(key + "=" + value);
        }
    }
    
    return paramsArray.join("&");
};

/** 
* @returns The fully formatted image location string
* @type String
*/
OpenLayers.Util.getImagesLocation = function() {
    return OpenLayers._getScriptLocation() + "img/";
};



/** These could/should be made namespace aware?
*
* @param {} p
* @param {str} tagName
*
* @return {Array}
*/
OpenLayers.Util.getNodes=function(p, tagName) {
    var nodes = Try.these(
        function () {
            return OpenLayers.Util._getNodes(p.documentElement.childNodes,
                                            tagName);
        },
        function () {
            return OpenLayers.Util._getNodes(p.childNodes, tagName);
        }
    );
    return nodes;
};

/**
* @param {Array} nodes
* @param {str} tagName
*
* @return {Array}
*/
OpenLayers.Util._getNodes=function(nodes, tagName) {
    var retArray = new Array();
    for (var i=0;i<nodes.length;i++) {
        if (nodes[i].nodeName==tagName) {
            retArray.push(nodes[i]);
        }
    }

    return retArray;
};



/**
* @param {} parent
* @param {str} item
* @param {int} index
*
* @return {str}
*/
OpenLayers.Util.getTagText = function (parent, item, index) {
    var result = OpenLayers.Util.getNodes(parent, item);
    if (result && (result.length > 0))
    {
        if (!index) {
            index=0;
        }
        if (result[index].childNodes.length > 1) {
            return result.childNodes[1].nodeValue; 
        }
        else if (result[index].childNodes.length == 1) {
            return result[index].firstChild.nodeValue; 
        }
    } else { 
        return ""; 
    }
};

/**
 * @param {XMLNode} node
 * 
 * @returns The text value of the given node, without breaking in firefox or IE
 * @type String
 */
OpenLayers.Util.getXmlNodeValue = function(node) {
    var val = null;
    Try.these( 
        function() {
            val = node.text;
            if (!val)
                val = node.textContent;
        }, 
        function() {
            val = node.textContent;
        }); 
    return val;
};

/** 
* @param {Event} evt
* @param {HTMLDivElement} div
*
* @return {boolean}
*/
OpenLayers.Util.mouseLeft = function (evt, div) {
    // start with the element to which the mouse has moved
    var target = (evt.relatedTarget) ? evt.relatedTarget : evt.toElement;
    // walk up the DOM tree.
    while (target != div && target != null) {
        target = target.parentNode;
    }
    // if the target we stop at isn't the div, then we've left the div.
    return (target != div);
};

OpenLayers.Util.rad = function(x) {return x*Math.PI/180;};
OpenLayers.Util.distVincenty=function(p1, p2) {
    var a = 6378137, b = 6356752.3142,  f = 1/298.257223563;
    var L = OpenLayers.Util.rad(p2.lon - p1.lon);
    var U1 = Math.atan((1-f) * Math.tan(OpenLayers.Util.rad(p1.lat)));
    var U2 = Math.atan((1-f) * Math.tan(OpenLayers.Util.rad(p2.lat)));
    var sinU1 = Math.sin(U1), cosU1 = Math.cos(U1);
    var sinU2 = Math.sin(U2), cosU2 = Math.cos(U2);
    var lambda = L, lambdaP = 2*Math.PI;
    var iterLimit = 20;
    while (Math.abs(lambda-lambdaP) > 1e-12 && --iterLimit>0) {
        var sinLambda = Math.sin(lambda), cosLambda = Math.cos(lambda);
        var sinSigma = Math.sqrt((cosU2*sinLambda) * (cosU2*sinLambda) +
        (cosU1*sinU2-sinU1*cosU2*cosLambda) * (cosU1*sinU2-sinU1*cosU2*cosLambda));
        if (sinSigma==0) return 0;  // co-incident points
        var cosSigma = sinU1*sinU2 + cosU1*cosU2*cosLambda;
        var sigma = Math.atan2(sinSigma, cosSigma);
        var alpha = Math.asin(cosU1 * cosU2 * sinLambda / sinSigma);
        var cosSqAlpha = Math.cos(alpha) * Math.cos(alpha);
        var cos2SigmaM = cosSigma - 2*sinU1*sinU2/cosSqAlpha;
        var C = f/16*cosSqAlpha*(4+f*(4-3*cosSqAlpha));
        lambdaP = lambda;
        lambda = L + (1-C) * f * Math.sin(alpha) *
        (sigma + C*sinSigma*(cos2SigmaM+C*cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)));
    }
    if (iterLimit==0) return NaN  // formula failed to converge
    var uSq = cosSqAlpha * (a*a - b*b) / (b*b);
    var A = 1 + uSq/16384*(4096+uSq*(-768+uSq*(320-175*uSq)));
    var B = uSq/1024 * (256+uSq*(-128+uSq*(74-47*uSq)));
    var deltaSigma = B*sinSigma*(cos2SigmaM+B/4*(cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)-
        B/6*cos2SigmaM*(-3+4*sinSigma*sinSigma)*(-3+4*cos2SigmaM*cos2SigmaM)));
    var s = b*A*(sigma-deltaSigma);
    var d = s.toFixed(3)/1000; // round to 1mm precision
    return d;
};
    
OpenLayers.Util.getArgs = function() {
    var args = new Object();
    var query = location.search.substring(1);  // Get query string.
    var pairs = query.split("&");              // Break at ampersand. //+pjl

    for(var i = 0; i < pairs.length; i++) {
        var pos = pairs[i].indexOf('=');       // Look for "name=value".
        if (pos == -1) continue;               // If not found, skip.
        var argname = pairs[i].substring(0,pos);  // Extract the name.
        var value = pairs[i].substring(pos+1); // Extract the value.
        args[argname] = unescape(value);          // Store as a property.
    }
    return args;                               // Return the object.
};

/**
 * @param {String} prefix String to prefix random id. If null, default
 *                         is "id_"
 * 
 * @returns A unique id string, built on the passed in prefix
 * @type String
 */
OpenLayers.Util.createUniqueID = function(prefix) {
    if (prefix == null) {
        prefix = "id_";
    }
    return prefix + Math.round(Math.random() * 10000);        
};

/** Constant inches per unit 
 *    -- borrowed from MapServer mapscale.c
 * 
 * @type Object */
OpenLayers.INCHES_PER_UNIT = { 
    'inches': 1.0,
    'ft': 12.0,
    'mi': 63360.0,
    'm': 39.3701,
    'km': 39370.1,
    'dd': 4374754
};
OpenLayers.INCHES_PER_UNIT["in"]= OpenLayers.INCHES_PER_UNIT.inches;
OpenLayers.INCHES_PER_UNIT["degrees"] = OpenLayers.INCHES_PER_UNIT.dd;

/** A sensible default 
 * @type int */
OpenLayers.DOTS_PER_INCH = 72;

/**
 * @param {float} scale
 * 
 * @returns A normalized scale value, in 1 / X format. 
 *          This means that if a value less than one ( already 1/x) is passed
 *          in, it just returns scale directly. Otherwise, it returns 
 *          1 / scale
 * @type float
 */
OpenLayers.Util.normalizeScale = function (scale) {
    var normScale = (scale > 1.0) ? (1.0 / scale) 
                                  : scale;
    return normScale;
};

/**
 * @param {float} scale
 * @param {String} units Index into OpenLayers.INCHES_PER_UNIT hashtable.
 *                       Default is degrees
 * 
 * @returns The corresponding resolution given passed-in scale and unit 
 *          parameters.
 * @type float
 */
OpenLayers.Util.getResolutionFromScale = function (scale, units) {

    if (units == null) {
        units = "degrees";
    }

    var normScale = OpenLayers.Util.normalizeScale(scale);

    var resolution = 1 / (normScale * OpenLayers.INCHES_PER_UNIT[units]
                                    * OpenLayers.DOTS_PER_INCH);
    return resolution;
};
