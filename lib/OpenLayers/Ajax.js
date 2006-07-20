/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

OpenLayers.ProxyHost = "/proxy/?url=";
//OpenLayers.ProxyHost = "examples/proxy.cgi?url=";

/**
* Ajax reader for OpenLayers
*
*@uri url to do remote XML http get
*@param 'get' format params (x=y&a=b...)
*@who object to handle callbacks for this request
*@complete  the function to be called on success 
*@failure  the function to be called on failure
*
* example usage from a caller:
*
*   caps: function(request) {
*    -blah-  
*   },
*
*   OpenLayers.loadURL(url,params,this,caps);
*
* Notice the above example does not provide an error handler; a default empty
* handler is provided which merely logs the error if a failure handler is not 
* supplied
*
*/


/** 
* @param {} request
*/
OpenLayers.nullHandler = function(request) {
    alert("Unhandled request return " + request.statusText);
};

/** Background load a document
*
* @param {String} uri URI of source doc
* @param {String} params Params on get (doesnt seem to work)
* @param {Object} caller object which gets callbacks
* @param {Function} onComplete callback for success
* @param {Function} onFailure callback for failure
*
* Both callbacks optional (though silly)
*/
OpenLayers.loadURL = function(uri, params, caller,
                                  onComplete, onFailure) {

    if (OpenLayers.ProxyHost && uri.startsWith("http")) {
        uri = OpenLayers.ProxyHost + escape(uri);
    }

    var success = (onComplete) ? onComplete.bind(caller)
                                : OpenLayers.nullHandler;

    var failure = (onFailure) ? onFailure.bind(caller)
                           : OpenLayers.nullHandler;

    // from prototype.js
    new Ajax.Request(uri, 
                     {   method: 'get', 
                         parameters: params,
                         onComplete: success, 
                         onFailure: failure
                      }
                     );
};

/** Parse XML into a doc structure
* @param {String} text
*
* @returns Parsed Ajax Response ??
* @type ?
*/
OpenLayers.parseXMLString = function(text) {

    //MS sucks, if the server is bad it dies
    var index = text.indexOf('<');
    if (index > 0) {
        text = text.substring(index);
    }

    var ajaxResponse = Try.these(
        function() {
            var xmldom = new ActiveXObject('Microsoft.XMLDOM');
            xmldom.loadXML(text);
            return xmldom;
        },
        function() {
            return new DOMParser().parseFromString(text, 'text/xml');
        },
        function() {
            var req = new XMLHttpRequest();
            req.open("GET", "data:" + "text/xml" +
                     ";charset=utf-8," + encodeURIComponent(text), false);
            if (req.overrideMimeType) {
                req.overrideMimeType("text/xml");
            }
            req.send(null);
            return req.responseXML;
        }
    );

    return ajaxResponse;
};

/** Adds a new script element to the head of the current document, 
 *   whose src is set to the url passed-in.
 * 
 * @param {String} url
 */
OpenLayers.addScript = function(url) {
    var head = document.getElementsByTagName("HEAD")[0];
    var scriptElem = document.createElement("script");
    scriptElem.src = url;
    head.appendChild(scriptElem);
};


(function () {
    var m = {
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        s = {
            array: function (x) {
                var a = ['['], b, f, i, l = x.length, v;
                for (i = 0; i < l; i += 1) {
                    v = x[i];
                    f = s[typeof v];
                    if (f) {
                        v = f(v);
                        if (typeof v == 'string') {
                            if (b) {
                                a[a.length] = ',';
                            }
                            a[a.length] = v;
                            b = true;
                        }
                    }
                }
                a[a.length] = ']';
                return a.join('');
            },
            'boolean': function (x) {
                return String(x);
            },
            'null': function (x) {
                return "null";
            },
            number: function (x) {
                return isFinite(x) ? String(x) : 'null';
            },
            object: function (x) {
                if (x) {
                    if (x instanceof Array) {
                        return s.array(x);
                    }
                    var a = ['{'], b, f, i, v;
                    for (i in x) {
                        v = x[i];
                        f = s[typeof v];
                        if (f) {
                            v = f(v);
                            if (typeof v == 'string') {
                                if (b) {
                                    a[a.length] = ',';
                                }
                                a.push(s.string(i), ':', v);
                                b = true;
                            }
                        }
                    }
                    a[a.length] = '}';
                    return a.join('');
                }
                return 'null';
            },
            string: function (x) {
                if (/["\\\x00-\x1f]/.test(x)) {
                    x = x.replace(/([\x00-\x1f\\"])/g, function(a, b) {
                        var c = m[b];
                        if (c) {
                            return c;
                        }
                        c = b.charCodeAt();
                        return '\\u00' +
                            Math.floor(c / 16).toString(16) +
                            (c % 16).toString(16);
                    });
                }
                return '"' + x + '"';
            }
        };

    Object.prototype.toJSONString = function () {
        return s.object(this);
    };

    Array.prototype.toJSONString = function () {
        return s.array(this);
    };
})();

String.prototype.parseJSON = function () {
    try {
        return !(/[^,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]/.test(
                this.replace(/"(\\.|[^"\\])*"/g, ''))) &&
            eval('(' + this + ')');
    } catch (e) {
        return false;
    }
};
