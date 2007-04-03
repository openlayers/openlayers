/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @class
 */
OpenLayers.Util = new Object();

/** 
 * This is the old $() from prototype
 */
OpenLayers.Util.getElement = function() {
    var elements = new Array();

    for (var i = 0; i < arguments.length; i++) {
        var element = arguments[i];
        if (typeof element == 'string') {
            element = document.getElementById(element);
        }
        if (arguments.length == 1) {
            return element;
        }
        elements.push(element);
    }
    return elements;
};

/** 
 * Maintain $() from prototype
 */
if ($ == null) {
    var $ = OpenLayers.Util.getElement;
}

/* from Prototype.js */
OpenLayers.Util.extend = function(destination, source) {
    for (property in source) {
      destination[property] = source[property];
    }
    return destination;
};


/** Remove an object from an array. Iterates through the array
*    to find the item, then removes it.
*
* @param {Object} item
* 
* @returns A reference to the array
* @type Array
*/
OpenLayers.Util.removeItem = function(array, item) {
    for(var i=0; i < array.length; i++) {
        if(array[i] == item) {
            array.splice(i,1);
            //break;more than once??
        }
    }
    return array;
};

/**
*/
OpenLayers.Util.clearArray = function(array) {
    array.length = 0;
};

/** Seems to exist already in FF, but not in MOZ.
 * 
 * @param {Array} array
 * @param {Object} obj
 */
OpenLayers.Util.indexOf = function(array, obj) {

    for(var i=0; i < array.length; i++) {
        if (array[i] == obj) return i;
    }
    return -1;   
};



/**
 * @param {String} id
 * @param {OpenLayers.Pixel} px
 * @param {OpenLayers.Size} sz
 * @param {String} position
 * @param {String} border
 * @param {String} overflow
 * @param {float} opacity Fractional value (0.0 - 1.0)
 */
OpenLayers.Util.modifyDOMElement = function(element, id, px, sz, position, 
                                            border, overflow, opacity) {

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
    if (opacity) {
        element.style.opacity = opacity;
        element.style.filter = 'alpha(opacity=' + (opacity * 100) + ')';
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
* @param {float} opacity Fractional value (0.0 - 1.0)
*
* @returns A DOM Div created with the specified attributes.
* @type DOMElement
*/
OpenLayers.Util.createDiv = function(id, px, sz, imgURL, position, 
                                     border, overflow, opacity) {

    var dom = document.createElement('div');

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
    OpenLayers.Util.modifyDOMElement(dom, id, px, sz, position, 
                                     border, overflow, opacity);

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
* @param {float} opacity Fractional value (0.0 - 1.0)
*
* @returns A DOM Image created with the specified attributes.
* @type DOMElement
*/
OpenLayers.Util.createImage = function(id, px, sz, imgURL, position, border,
                                       opacity, delayDisplay) {

    image = document.createElement("img");

    //set generic properties
    if (!id) {
        id = OpenLayers.Util.createUniqueID("OpenLayersDiv");
    }
    if (!position) {
        position = "relative";
    }
    OpenLayers.Util.modifyDOMElement(image, id, px, sz, position, 
                                     border, null, opacity);

    if(delayDisplay) {
        image.style.display = "none";
        OpenLayers.Event.observe(image, "load", 
                      OpenLayers.Util.onImageLoad.bindAsEventListener(image));
        OpenLayers.Event.observe(image, "error", 
                      OpenLayers.Util.onImageLoadError.bindAsEventListener(image));
        
    }
    
    //set special properties
    image.style.alt = id;
    image.galleryImg = "no";
    if (imgURL) {
        image.src = imgURL;
    }


        
    return image;
};

/**
 * @deprecated -- Use OpenLayers.Util.modifyDOMElement() or 
 *                    OpenLayers.Util.modifyAlphaImageDiv()
 * 
 * Set the opacity of a DOM Element
 * Note that for this function to work in IE, elements must "have layout"
 * according to:
 * http://msdn.microsoft.com/workshop/author/dhtml/reference/properties/haslayout.asp
 *
 * @param {DOMElement} element Set the opacity on this DOM element
 * @param {Float} opacity Opacity value (0.0 - 1.0)
 */
OpenLayers.Util.setOpacity = function(element, opacity) {
    OpenLayers.Util.modifyDOMElement(element, null, null, null,
                                     null, null, null, opacity);
}

OpenLayers.Util.onImageLoad = function() {
    // The complex check here is to solve issues described in #480.
    // Every time a map view changes, it increments the 'viewRequestID' 
    // property. As the requests for the images for the new map view are sent
    // out, they are tagged with this unique viewRequestID. 
    // 
    // If an image has no viewRequestID property set, we display it regardless, 
    // but if it does have a viewRequestID property, we check that it matches 
    // the viewRequestID set on the map.
    // 
    // If the viewRequestID on the map has changed, that means that the user
    // has changed the map view since this specific request was sent out, and
    // therefore this tile does not need to be displayed (so we do not execute
    // this code that turns its display on).
    //
    if (!this.viewRequestID ||
        (this.map && this.viewRequestID == this.map.viewRequestID)) { 
        this.style.backgroundColor = null;
        this.style.display = "";  
    }
};

OpenLayers.Util.onImageLoadErrorColor = "pink";
OpenLayers.IMAGE_RELOAD_ATTEMPTS = 0;
OpenLayers.Util.onImageLoadError = function() {
    this._attempts = (this._attempts) ? (this._attempts + 1) : 1;
    if(this._attempts <= OpenLayers.IMAGE_RELOAD_ATTEMPTS) {
        this.src = this.src;
    } else {
        this.style.backgroundColor = OpenLayers.Util.onImageLoadErrorColor;
    }
    this.style.display = "";
};


OpenLayers.Util.alphaHack = function() {
    var arVersion = navigator.appVersion.split("MSIE");
    var version = parseFloat(arVersion[1]);
    var filter = false;
    
    // IEs4Lin dies when trying to access document.body.filters, because 
    // the property is there, but requires a DLL that can't be provided. This
    // means that we need to wrap this in a try/catch so that this can
    // continue.
    
    try { 
        filter = document.body.filters;
    } catch (e) {
    }    
    
    return ( filter &&
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
* @param {float} opacity Specified as fraction (0.4, etc)
*/ 
OpenLayers.Util.modifyAlphaImageDiv = function(div, id, px, sz, imgURL, 
                                               position, border, sizing, 
                                               opacity) {

    OpenLayers.Util.modifyDOMElement(div, id, px, sz);

    var img = div.childNodes[0];

    if (imgURL) {
        img.src = imgURL;
    }
    OpenLayers.Util.modifyDOMElement(img, div.id + "_innerImage", null, sz, 
                                     "relative", border);
    if (opacity) {
        div.style.opacity = opacity;
        div.style.filter = 'alpha(opacity=' + (opacity * 100) + ')';
    }
    
    if (OpenLayers.Util.alphaHack()) {

        div.style.display = "inline-block";
        if (sizing == null) {
            sizing = "scale";
        }
        
        div.style.filter = "progid:DXImageTransform.Microsoft" +
                           ".AlphaImageLoader(src='" + img.src + "', " +
                           "sizingMethod='" + sizing + "')";
        if (div.style.opacity) {
            div.style.filter += " alpha(opacity=" + div.style.opacity * 100 + ")";
        }

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
                                               position, border, sizing, 
                                               opacity, delayDisplay) {
    
    var div = OpenLayers.Util.createDiv();
    var img = OpenLayers.Util.createImage(null, null, null, null, null, null, 
                                          null, false);
    div.appendChild(img);

    if (delayDisplay) {
        img.style.display = "none";
        OpenLayers.Event.observe(img, "load",
                      OpenLayers.Util.onImageLoad.bindAsEventListener(div));
        OpenLayers.Event.observe(img, "error",
                      OpenLayers.Util.onImageLoadError.bindAsEventListener(div));
    }

    OpenLayers.Util.modifyAlphaImageDiv(div, id, px, sz, imgURL, position, 
                                        border, sizing, opacity);
    
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
*   another hashtable, by analogy with OpenLayers.Util.extend() from
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
*    If a parameter is actually a list, that parameter will then
*    be set to a comma-seperated list of values (foo,bar) instead
*    of being URL escaped (foo%3Abar). 
* @type String
*/
OpenLayers.Util.getParameterString = function(params) {
    paramsArray = new Array();
    
    for (var key in params) {
      var value = params[key];
      if ((value != null) && (typeof value != 'function')) {
        var encodedValue;
        if (typeof value == 'object' && value.constructor == Array) {
          /* value is an array; encode items and separate with "," */
          var encodedItemArray = new Array();
          for (var itemIndex=0; itemIndex<value.length; itemIndex++) {
            encodedItemArray.push(encodeURIComponent(value[itemIndex]));
          }
          encodedValue = encodedItemArray.join(",");
        }
        else {
          /* value is a string; simply encode */
          encodedValue = encodeURIComponent(value);
        }
        paramsArray.push(encodeURIComponent(key) + "=" + encodedValue);
      }
    }
    
    return paramsArray.join("&");
};

/** 
* @returns The fully formatted image location string
* @type String
*/

OpenLayers.ImgPath = '';
OpenLayers.Util.getImagesLocation = function() {
    return OpenLayers.ImgPath || (OpenLayers._getScriptLocation() + "img/");
};

/* Originally from Prototype */

OpenLayers.Util.Try = function() {
    var returnValue;

    for (var i = 0; i < arguments.length; i++) {
      var lambda = arguments[i];
      try {
        returnValue = lambda();
        break;
      } catch (e) {}
    }

    return returnValue;
}


/** These could/should be made namespace aware?
*
* @param {} p
* @param {str} tagName
*
* @return {Array}
*/
OpenLayers.Util.getNodes=function(p, tagName) {
    var nodes = OpenLayers.Util.Try(
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
    OpenLayers.Util.Try( 
        function() {
            val = node.text;
            if (!val)
                val = node.textContent;
            if (!val)
                val = node.firstChild.nodeValue;
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

/**
 * @param {String} url Optional url used to extract the query string.
 *                     If null, query string is taken from page location.
 * 
 * @returns An object of key/value pairs from the query string.
 * @type Object
 */
OpenLayers.Util.getArgs = function(url) {
    if(url == null) {
        url = window.location.href;
    }
    var query = (url.indexOf('?') != -1) ? url.substring(url.indexOf('?') + 1) 
                                         : '';
    
    var args = new Object();
    pairs = query.split(/[&;]/);
    for(var i = 0; i < pairs.length; ++i) {
        keyValue = pairs[i].split(/=/);
        if(keyValue.length == 2) {
            args[decodeURIComponent(keyValue[0])] =
                decodeURIComponent(keyValue[1]);
        }
    }
    return args;
}

OpenLayers.Util.lastSeqID = 0;

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
    OpenLayers.Util.lastSeqID += 1; 
    return prefix + OpenLayers.Util.lastSeqID;        
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

/**
 * @param {float} resolution
 * @param {String} units Index into OpenLayers.INCHES_PER_UNIT hashtable.
 *                       Default is degrees
 * 
 * @returns The corresponding scale given passed-in resolution and unit 
 *          parameters.
 * @type float
 */
OpenLayers.Util.getScaleFromResolution = function (resolution, units) {

    if (units == null) {
        units = "degrees";
    }

    var scale = resolution * OpenLayers.INCHES_PER_UNIT[units] *
                    OpenLayers.DOTS_PER_INCH;
    return scale;
};

/** @deprecated Please use directly OpenLayers.Event.stop() passing 'true' as 
 *              the 2nd argument (preventDefault)
 * 
 * Safely stop the propagation of an event *without* preventing
 *   the default browser action from occurring.
 * 
 * @param {Event} evt
 */
OpenLayers.Util.safeStopPropagation = function(evt) {
    OpenLayers.Event.stop(evt, true);
};

OpenLayers.Util.pagePosition = function(forElement) {
    var valueT = 0, valueL = 0;

    var element = forElement;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;

      // Safari fix
      if (element.offsetParent==document.body)
        if (OpenLayers.Element.getStyle(element,'position')=='absolute') break;

    } while (element = element.offsetParent);

    element = forElement;
    do {
      valueT -= element.scrollTop  || 0;
      valueL -= element.scrollLeft || 0;
    } while (element = element.parentNode);

    return [valueL, valueT];
};


/** Test two URLs for equivalence. 
 * 
 * Setting 'ignoreCase' allows for case-independent comparison.
 * 
 * Comparison is based on: 
 *  - Protocol
 *  - Host (evaluated without the port)
 *  - Port (set 'ignorePort80' to ignore "80" values)
 *  - Hash ( set 'ignoreHash' to disable)
 *  - Pathname (for relative <-> absolute comparison) 
 *  - Arguments (so they can be out of order)
 *  
 * 
 *
 * @param {String} url1
 * @param {String} url2
 * @param {Object} options allows for customization of comparison:
 *                         'ignoreCase' - Default is True
 *                         'ignorePort80' - Default is True
 *                         'ignoreHash' - Default is True
 *
 * @returns Whether or not the two URLs are equivalent
 * @type Boolean
 */
OpenLayers.Util.isEquivalentUrl = function(url1, url2, options) {
    options = options || new Object();

    OpenLayers.Util.applyDefaults(options, {
        ignoreCase: true,
        ignorePort80: true,
        ignoreHash: true
    });

    urlObj1 = OpenLayers.Util.createUrlObject(url1, options);
    urlObj2 = OpenLayers.Util.createUrlObject(url2, options);

    //compare all keys (host, port, etc)
    for(var key in urlObj1) {
        if (options.test) {
            alert(key + "\n1:" + urlObj1[key] + "\n2:" + urlObj2[key]);
        }
        var val1 = urlObj1[key];
        var val2 = urlObj2[key];
        
        switch(key) {
            case "args":
                //do nothing, they'll be treated below
                break;
            case "host":
            case "port":
            case "protocol":
                if ((val1 == "") || (val2 == "")) {
                    //these will be blank for relative urls, so no need to 
                    // compare them here -- call break. 
                    // 
                    break;
                } 
                // otherwise continue with default compare
                //
            default: 
                if ( (key != "args") && (urlObj1[key] != urlObj2[key]) ) {
                    return false;
                }
                break;
        }
        
    }

    // compare search args - irrespective of order
    for(var key in urlObj1.args) {
        if(urlObj1.args[key] != urlObj2.args[key]) {
            return false;
        }
        delete urlObj2.args[key];
    }
    // urlObj2 shouldn't have any args left
    for(var key in urlObj2.args) {
        return false;
    }
    
    return true;
};

/**
 * @private
 *
 * @param {String} url
 * @param {Object} options
 * 
 * @returns An object with separate url, a, port, host, and args parsed out 
 *            and ready for comparison
 * @type Object
 */
OpenLayers.Util.createUrlObject = function(url, options) {
    options = options || new Object();

    var urlObject = new Object();
  
    if (options.ignoreCase) {
        url = url.toLowerCase(); 
    }

    var a = document.createElement('a');
    a.href = url;
    
  //host (without port)
    urlObject.host = a.host;
    var port = a.port;
    if (port.length <= 0) {
        var newHostLength = urlObject.host.length - (port.length);
        urlObject.host = urlObject.host.substring(0, newHostLength); 
    }

  //protocol
    urlObject.protocol = a.protocol;  

  //port
    urlObject.port = ((port == "80") && (options.ignorePort80)) ? "" : port;
                                                                     
  //hash
    urlObject.hash = (options.ignoreHash) ? "" : a.hash;  
    
  //args
    var queryString = a.search;
    if (!queryString) {
        var qMark = url.indexOf("?");
        queryString = (qMark != -1) ? url.substr(qMark) : "";
    }
    urlObject.args = OpenLayers.Util.getArgs(queryString);


  //pathname (this part allows for relative <-> absolute comparison)
    if ( ((urlObject.protocol == "file:") && (url.indexOf("file:") != -1)) || 
         ((urlObject.protocol != "file:") && (urlObject.host != "")) ) {

        urlObject.pathname = a.pathname;  

        //Test to see if the pathname includes the arguments (Opera)
        var qIndex = urlObject.pathname.indexOf("?");
        if (qIndex != -1) {
            urlObject.pathname = urlObject.pathname.substring(0, qIndex);
        }

    } else {
        var relStr = OpenLayers.Util.removeTail(url);

        var backs = 0;
        do {
            var index = relStr.indexOf("../");

            if (index == 0) {
                backs++
                relStr = relStr.substr(3);
            } else if (index >= 0) {
                var prevChunk = relStr.substr(0,index - 1);
                
                var slash = prevChunk.indexOf("/");
                prevChunk = (slash != -1) ? prevChunk.substr(0, slash +1)
                                          : "";
                
                var postChunk = relStr.substr(index + 3);                
                relStr = prevChunk + postChunk;
            }
        } while(index != -1)

        var windowAnchor = document.createElement("a");
        var windowUrl = window.location.href;
        if (options.ignoreCase) {
            windowUrl = windowUrl.toLowerCase();
        }
        windowAnchor.href = windowUrl;

      //set protocol of window
        urlObject.protocol = windowAnchor.protocol;

        var splitter = (windowAnchor.pathname.indexOf("/") != -1) ? "/" : "\\";
        var dirs = windowAnchor.pathname.split(splitter);
        dirs.pop(); //remove filename
        while ((backs > 0) && (dirs.length > 0)) {
            dirs.pop();
            backs--;
        }
        relStr = dirs.join("/") + "/"+ relStr;
        urlObject.pathname = relStr;
    }
    
    if ((urlObject.protocol == "file:") || (urlObject.protocol == "")) {
        urlObject.host = "localhost";
    }

    return urlObject; 
};
 
/**
 * @param {String} url
 * 
 * @returns The string with all queryString and Hash removed
 * @type String
 */
OpenLayers.Util.removeTail = function(url) {
    var head = null;
    
    var qMark = url.indexOf("?");
    var hashMark = url.indexOf("#");

    if (qMark == -1) {
        head = (hashMark != -1) ? url.substr(0,hashMark) : url;
    } else {
        head = (hashMark != -1) ? url.substr(0,Math.min(qMark, hashMark)) 
                                  : url.substr(0, qMark);
    }
    return head;
};
