/**
 * @requires OpenLayers/BaseTypes/Class.js
 * @requires OpenLayers/Util.js
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Format.js
 * @requires OpenLayers/Request.js
 * @requires OpenLayers/Layer/WMS.js
 * @requires OpenLayers/Layer/MapServer.js
 * @requires OpenLayers/Tile.js
 * @requires OpenLayers/Request/XMLHttpRequest.js
 * @requires OpenLayers/Layer/Vector.js
 * @requires OpenLayers/Layer/Markers.js
 * @requires OpenLayers/Console.js
 * @requires OpenLayers/Lang.js
 * @requires OpenLayers/Feature.js
 * @requires OpenLayers/Layer/EventPane.js
 * @requires OpenLayers/Layer/FixedZoomLevels.js
 * @requires OpenLayers/Layer/SphericalMercator.js
 */

/**
 * Namespace: OpenLayers.Class
 */

/**
 * Property: isPrototype
 * *Deprecated*.  This is no longer needed and will be removed at 3.0.
 */
OpenLayers.Class.isPrototype = function () {};

/**
 * APIFunction: OpenLayers.create
 * *Deprecated*.  Old method to create an OpenLayers style class.  Use the
 *     <OpenLayers.Class> constructor instead.
 *
 * Returns:
 * An OpenLayers class
 */
OpenLayers.Class.create = function() {
    return function() {
        if (arguments && arguments[0] != OpenLayers.Class.isPrototype) {
            this.initialize.apply(this, arguments);
        }
    };
};

/**
 * APIFunction: inherit
 * *Deprecated*.  Old method to inherit from one or more OpenLayers style
 *     classes.  Use the <OpenLayers.Class> constructor instead.
 *
 * Parameters:
 * class - One or more classes can be provided as arguments
 *
 * Returns:
 * An object prototype
 */
OpenLayers.Class.inherit = function (P) {
    var C = function() {
       P.call(this);
    };
    var newArgs = [C].concat(Array.prototype.slice.call(arguments));
    OpenLayers.inherit.apply(null, newArgs);
    return C.prototype;
};

/**
 * Function: clearArray
 * *Deprecated*. This function will disappear in 3.0.
 * Please use "array.length = 0" instead.
 * 
 * Parameters:
 * array - {Array}
 */
OpenLayers.Util.clearArray = function(array) {
    OpenLayers.Console.warn(
        OpenLayers.i18n(
            "methodDeprecated", {'newMethod': 'array = []'}
        )
    );
    array.length = 0;
};

/**
 * Function: setOpacity
 * *Deprecated*.  This function has been deprecated. Instead, please use 
 *     <OpenLayers.Util.modifyDOMElement> 
 *     or 
 *     <OpenLayers.Util.modifyAlphaImageDiv>
 * 
 * Set the opacity of a DOM Element
 *     Note that for this function to work in IE, elements must "have layout"
 *     according to:
 *     http://msdn.microsoft.com/workshop/author/dhtml/reference/properties/haslayout.asp
 *
 * Parameters:
 * element - {DOMElement} Set the opacity on this DOM element
 * opacity - {Float} Opacity value (0.0 - 1.0)
 */
OpenLayers.Util.setOpacity = function(element, opacity) {
    OpenLayers.Util.modifyDOMElement(element, null, null, null,
                                     null, null, null, opacity);
};

/**
 * Function: safeStopPropagation
 * *Deprecated*. This function has been deprecated. Please use directly 
 *     <OpenLayers.Event.stop> passing 'true' as the 2nd 
 *     argument (preventDefault)
 * 
 * Safely stop the propagation of an event *without* preventing
 *   the default browser action from occurring.
 * 
 * Parameter:
 * evt - {Event}
 */
OpenLayers.Util.safeStopPropagation = function(evt) {
    OpenLayers.Event.stop(evt, true);
};

/**
 * Function: getArgs
 * *Deprecated*.  Will be removed in 3.0.  Please use instead
 *     <OpenLayers.Util.getParameters>
 * 
 * Parameters:
 * url - {String} Optional url used to extract the query string.
 *                If null, query string is taken from page location.
 * 
 * Returns:
 * {Object} An object of key/value pairs from the query string.
 */
OpenLayers.Util.getArgs = function(url) {
    OpenLayers.Console.warn(
        OpenLayers.i18n(
            "methodDeprecated", {'newMethod': 'OpenLayers.Util.getParameters'}
        )
    );
    return OpenLayers.Util.getParameters(url);
};

/**
 * Function: OpenLayers.nullHandler
 * @param {} request
 */
OpenLayers.nullHandler = function(request) {
    OpenLayers.Console.userError(OpenLayers.i18n("unhandledRequest", {'statusText':request.statusText}));
};

/** 
 * APIFunction: OpenLayers.loadURL
 * Background load a document.
 * *Deprecated*.  Use <OpenLayers.Request.GET> method instead.
 *
 * Parameters:
 * uri - {String} URI of source doc
 * params - {String} or {Object} GET params. Either a string in the form
 *     "?hello=world&foo=bar" (do not forget the leading question mark)
 *     or an object in the form {'hello': 'world', 'foo': 'bar}
 * caller - {Object} object which gets callbacks
 * onComplete - {Function} Optional callback for success.  The callback
 *     will be called with this set to caller and will receive the request
 *     object as an argument.  Note that if you do not specify an onComplete
 *     function, <OpenLayers.nullHandler> will be called (which pops up a 
 *     user friendly error message dialog).
 * onFailure - {Function} Optional callback for failure.  In the event of
 *     a failure, the callback will be called with this set to caller and will
 *     receive the request object as an argument.  Note that if you do not
 *     specify an onComplete function, <OpenLayers.nullHandler> will be called
 *     (which pops up a user friendly error message dialog).
 *
 * Returns:
 * {<OpenLayers.Request.XMLHttpRequest>}  The request object. To abort loading,
 *     call request.abort().
 */
OpenLayers.loadURL = function(uri, params, caller,
                                  onComplete, onFailure) {
    
    if(typeof params == 'string') {
        params = OpenLayers.Util.getParameters(params);
    }
    var success = (onComplete) ? onComplete : OpenLayers.nullHandler;
    var failure = (onFailure) ? onFailure : OpenLayers.nullHandler;
    
    return OpenLayers.Request.GET({
        url: uri, params: params,
        success: success, failure: failure, scope: caller
    });
};

/** 
 * Function: OpenLayers.parseXMLString
 * Parse XML into a doc structure
 * 
 * Parameters:
 * text - {String} 
 * 
 * Returns:
 * {?} Parsed AJAX Responsev
 */
OpenLayers.parseXMLString = function(text) {

    //MS sucks, if the server is bad it dies
    var index = text.indexOf('<');
    if (index > 0) {
        text = text.substring(index);
    }

    var ajaxResponse = OpenLayers.Util.Try(
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


/**
 * Namespace: OpenLayers.Ajax
 */
OpenLayers.Ajax = {

    /**
     * Method: emptyFunction
     */
    emptyFunction: function () {},

    /**
     * Method: getTransport
     * 
     * Returns: 
     * {Object} Transport mechanism for whichever browser we're in, or false if
     *          none available.
     */
    getTransport: function() {
        return OpenLayers.Util.Try(
            function() {return new XMLHttpRequest();},
            function() {return new ActiveXObject('Msxml2.XMLHTTP');},
            function() {return new ActiveXObject('Microsoft.XMLHTTP');}
        ) || false;
    },

    /**
     * Property: activeRequestCount
     * {Integer}
     */
    activeRequestCount: 0
};

/**
 * Namespace: OpenLayers.Ajax.Responders
 * {Object}
 */
OpenLayers.Ajax.Responders = {
  
    /**
     * Property: responders
     * {Array}
     */
    responders: [],

    /**
     * Method: register
     *  
     * Parameters:
     * responderToAdd - {?}
     */
    register: function(responderToAdd) {
        for (var i = 0; i < this.responders.length; i++){
            if (responderToAdd == this.responders[i]){
                return;
            }
        }
        this.responders.push(responderToAdd);
    },

    /**
     * Method: unregister
     *  
     * Parameters:
     * responderToRemove - {?}
     */
    unregister: function(responderToRemove) {
        OpenLayers.Util.removeItem(this.reponders, responderToRemove);
    },

    /**
     * Method: dispatch
     * 
     * Parameters:
     * callback - {?}
     * request - {?}
     * transport - {?}
     */
    dispatch: function(callback, request, transport) {
        var responder;
        for (var i = 0; i < this.responders.length; i++) {
            responder = this.responders[i];
     
            if (responder[callback] && 
                typeof responder[callback] == 'function') {
                try {
                    responder[callback].apply(responder, 
                                              [request, transport]);
                } catch (e) {}
            }
        }
    }
};

OpenLayers.Ajax.Responders.register({
    /** 
     * Function: onCreate
     */
    onCreate: function() {
        OpenLayers.Ajax.activeRequestCount++;
    },

    /**
     * Function: onComplete
     */
     onComplete: function() {
         OpenLayers.Ajax.activeRequestCount--;
     }
});

/**
 * Class: OpenLayers.Ajax.Base
 */
OpenLayers.Ajax.Base = OpenLayers.Class({
      
    /**
     * Constructor: OpenLayers.Ajax.Base
     * 
     * Parameters: 
     * options - {Object}
     */
    initialize: function(options) {
        this.options = {
            method:       'post',
            asynchronous: true,
            contentType:  'application/xml',
            parameters:   ''
        };
        OpenLayers.Util.extend(this.options, options || {});
        
        this.options.method = this.options.method.toLowerCase();
        
        if (typeof this.options.parameters == 'string') {
            this.options.parameters = 
                OpenLayers.Util.getParameters(this.options.parameters);
        }
    }
});

/**
 * Class: OpenLayers.Ajax.Request
 * *Deprecated*.  Use <OpenLayers.Request> method instead.
 *
 * Inherit:
 *  - <OpenLayers.Ajax.Base>
 */
OpenLayers.Ajax.Request = OpenLayers.Class(OpenLayers.Ajax.Base, {

    /**
     * Property: _complete
     *
     * {Boolean}
     */
    _complete: false,
      
    /**
     * Constructor: OpenLayers.Ajax.Request
     * 
     * Parameters: 
     * url - {String}
     * options - {Object}
     */
    initialize: function(url, options) {
        OpenLayers.Ajax.Base.prototype.initialize.apply(this, [options]);
        
        if (OpenLayers.ProxyHost && OpenLayers.String.startsWith(url, "http")) {
            url = OpenLayers.ProxyHost + encodeURIComponent(url);
        }
        
        this.transport = OpenLayers.Ajax.getTransport();
        this.request(url);
    },

    /**
     * Method: request
     * 
     * Parameters:
     * url - {String}
     */
    request: function(url) {
        this.url = url;
        this.method = this.options.method;
        var params = OpenLayers.Util.extend({}, this.options.parameters);
        
        if (this.method != 'get' && this.method != 'post') {
            // simulate other verbs over post
            params['_method'] = this.method;
            this.method = 'post';
        }

        this.parameters = params;        
        
        if (params = OpenLayers.Util.getParameterString(params)) {
            // when GET, append parameters to URL
            if (this.method == 'get') {
                this.url += ((this.url.indexOf('?') > -1) ? '&' : '?') + params;
            } else if (/Konqueror|Safari|KHTML/.test(navigator.userAgent)) {
                params += '&_=';
            }
        }
        try {
            var response = new OpenLayers.Ajax.Response(this);
            if (this.options.onCreate) {
                this.options.onCreate(response);
            }
            
            OpenLayers.Ajax.Responders.dispatch('onCreate', 
                                                this, 
                                                response);
    
            this.transport.open(this.method.toUpperCase(), 
                                this.url,
                                this.options.asynchronous);
    
            if (this.options.asynchronous) {
                window.setTimeout(
                    OpenLayers.Function.bind(this.respondToReadyState, this, 1),
                    10);
            }
            
            this.transport.onreadystatechange = 
                OpenLayers.Function.bind(this.onStateChange, this);    
            this.setRequestHeaders();
    
            this.body =  this.method == 'post' ?
                (this.options.postBody || params) : null;
            this.transport.send(this.body);
    
            // Force Firefox to handle ready state 4 for synchronous requests
            if (!this.options.asynchronous && 
                this.transport.overrideMimeType) {
                this.onStateChange();
            }
        } catch (e) {
            this.dispatchException(e);
        }
    },

    /**
     * Method: onStateChange
     */
    onStateChange: function() {
        var readyState = this.transport.readyState;
        if (readyState > 1 && !((readyState == 4) && this._complete)) {
            this.respondToReadyState(this.transport.readyState);
        }
    },
     
    /**
     * Method: setRequestHeaders
     */
    setRequestHeaders: function() {
        var headers = {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'text/javascript, text/html, application/xml, text/xml, */*',
            'OpenLayers': true
        };

        if (this.method == 'post') {
            headers['Content-type'] = this.options.contentType +
                (this.options.encoding ? '; charset=' + this.options.encoding : '');
    
            /* Force "Connection: close" for older Mozilla browsers to work
             * around a bug where XMLHttpRequest sends an incorrect
             * Content-length header. See Mozilla Bugzilla #246651.
             */
            if (this.transport.overrideMimeType &&
                (navigator.userAgent.match(/Gecko\/(\d{4})/) || [0,2005])[1] < 2005) {
                headers['Connection'] = 'close';
            }
        }
        // user-defined headers
        if (typeof this.options.requestHeaders == 'object') {    
            var extras = this.options.requestHeaders;
            
            if (typeof extras.push == 'function') {
                for (var i = 0, length = extras.length; i < length; i += 2) {
                    headers[extras[i]] = extras[i+1];
                }
            } else {
                for (var i in extras) {
                    headers[i] = extras[i];
                }
            }
        }
        
        for (var name in headers) {
            this.transport.setRequestHeader(name, headers[name]);
        }
    },
    
    /**
     * Method: success
     *
     * Returns:
     * {Boolean} - 
     */
    success: function() {
        var status = this.getStatus();
        return !status || (status >=200 && status < 300);
    },
    
    /**
     * Method: getStatus
     *
     * Returns:
     * {Integer} - Status
     */
    getStatus: function() {
        try {
            return this.transport.status || 0;
        } catch (e) {
            return 0;
        }
    },

    /**
     * Method: respondToReadyState
     *
     * Parameters:
     * readyState - {?}
     */
    respondToReadyState: function(readyState) {
        var state = OpenLayers.Ajax.Request.Events[readyState];
        var response = new OpenLayers.Ajax.Response(this);
    
        if (state == 'Complete') {
            try {
                this._complete = true;
                (this.options['on' + response.status] ||
                    this.options['on' + (this.success() ? 'Success' : 'Failure')] ||
                    OpenLayers.Ajax.emptyFunction)(response);
            } catch (e) {
                this.dispatchException(e);
            }
    
            var contentType = response.getHeader('Content-type');
        }
    
        try {
            (this.options['on' + state] || 
             OpenLayers.Ajax.emptyFunction)(response);
             OpenLayers.Ajax.Responders.dispatch('on' + state, 
                                                 this, 
                                                 response);
        } catch (e) {
            this.dispatchException(e);
        }
    
        if (state == 'Complete') {
            // avoid memory leak in MSIE: clean up
            this.transport.onreadystatechange = OpenLayers.Ajax.emptyFunction;
        }
    },
    
    /**
     * Method: getHeader
     * 
     * Parameters:
     * name - {String} Header name
     *
     * Returns:
     * {?} - response header for the given name
     */
    getHeader: function(name) {
        try {
            return this.transport.getResponseHeader(name);
        } catch (e) {
            return null;
        }
    },

    /**
     * Method: dispatchException
     * If the optional onException function is set, execute it
     * and then dispatch the call to any other listener registered
     * for onException.
     * 
     * If no optional onException function is set, we suspect that
     * the user may have also not used
     * OpenLayers.Ajax.Responders.register to register a listener
     * for the onException call.  To make sure that something
     * gets done with this exception, only dispatch the call if there
     * are listeners.
     *
     * If you explicitly want to swallow exceptions, set
     * request.options.onException to an empty function (function(){})
     * or register an empty function with <OpenLayers.Ajax.Responders>
     * for onException.
     * 
     * Parameters:
     * exception - {?}
     */
    dispatchException: function(exception) {
        var handler = this.options.onException;
        if(handler) {
            // call options.onException and alert any other listeners
            handler(this, exception);
            OpenLayers.Ajax.Responders.dispatch('onException', this, exception);
        } else {
            // check if there are any other listeners
            var listener = false;
            var responders = OpenLayers.Ajax.Responders.responders;
            for (var i = 0; i < responders.length; i++) {
                if(responders[i].onException) {
                    listener = true;
                    break;
                }
            }
            if(listener) {
                // call all listeners
                OpenLayers.Ajax.Responders.dispatch('onException', this, exception);
            } else {
                // let the exception through
                throw exception;
            }
        }
    }
});

/** 
 * Property: Events
 * {Array(String)}
 */
OpenLayers.Ajax.Request.Events =
  ['Uninitialized', 'Loading', 'Loaded', 'Interactive', 'Complete'];

/**
 * Class: OpenLayers.Ajax.Response
 */
OpenLayers.Ajax.Response = OpenLayers.Class({

    /**
     * Property: status
     *
     * {Integer}
     */
    status: 0,
    

    /**
     * Property: statusText
     *
     * {String}
     */
    statusText: '',
      
    /**
     * Constructor: OpenLayers.Ajax.Response
     * 
     * Parameters: 
     * request - {Object}
     */
    initialize: function(request) {
        this.request = request;
        var transport = this.transport = request.transport,
            readyState = this.readyState = transport.readyState;
        
        if ((readyState > 2 &&
            !(!!(window.attachEvent && !window.opera))) ||
            readyState == 4) {
            this.status       = this.getStatus();
            this.statusText   = this.getStatusText();
            this.responseText = transport.responseText == null ?
                '' : String(transport.responseText);
        }
        
        if(readyState == 4) {
            var xml = transport.responseXML;
            this.responseXML  = xml === undefined ? null : xml;
        }
    },
    
    /**
     * Method: getStatus
     */
    getStatus: OpenLayers.Ajax.Request.prototype.getStatus,
    
    /**
     * Method: getStatustext
     *
     * Returns:
     * {String} - statusText
     */
    getStatusText: function() {
        try {
            return this.transport.statusText || '';
        } catch (e) {
            return '';
        }
    },
    
    /**
     * Method: getHeader
     */
    getHeader: OpenLayers.Ajax.Request.prototype.getHeader,
    
    /** 
     * Method: getResponseHeader
     *
     * Returns:
     * {?} - response header for given name
     */
    getResponseHeader: function(name) {
        return this.transport.getResponseHeader(name);
    }
});


/**
 * Function: getElementsByTagNameNS
 * 
 * Parameters:
 * parentnode - {?}
 * nsuri - {?}
 * nsprefix - {?}
 * tagname - {?}
 * 
 * Returns:
 * {?}
 */
OpenLayers.Ajax.getElementsByTagNameNS  = function(parentnode, nsuri, 
                                                   nsprefix, tagname) {
    var elem = null;
    if (parentnode.getElementsByTagNameNS) {
        elem = parentnode.getElementsByTagNameNS(nsuri, tagname);
    } else {
        elem = parentnode.getElementsByTagName(nsprefix + ':' + tagname);
    }
    return elem;
};


/**
 * Function: serializeXMLToString
 * Wrapper function around XMLSerializer, which doesn't exist/work in
 *     IE/Safari. We need to come up with a way to serialize in those browser:
 *     for now, these browsers will just fail. #535, #536
 *
 * Parameters: 
 * xmldom {XMLNode} xml dom to serialize
 * 
 * Returns:
 * {?}
 */
OpenLayers.Ajax.serializeXMLToString = function(xmldom) {
    var serializer = new XMLSerializer();
    var data = serializer.serializeToString(xmldom);
    return data;
};

/**
 * Namespace: OpenLayers.Element
 */
OpenLayers.Util.extend(OpenLayers.Element, {

    /**
     * APIFunction: hide
     * *Deprecated*. Hide element(s) passed in
     * 
     * Parameters:
     * element - {DOMElement} Actually user can pass any number of elements
     */
    hide: function() {
        OpenLayers.Console.warn(OpenLayers.i18n("methodDeprecated", {
            newMethod: "element.style.display = 'none';"
        }));

        for (var i=0, len=arguments.length; i<len; i++) {
            var element = OpenLayers.Util.getElement(arguments[i]);
            if (element) {
                element.style.display = 'none';
            }
        }
    },

    /**
     * APIFunction: show
     * *Deprecated*. Show element(s) passed in
     * 
     * Parameters:
     * element - {DOMElement} Actually user can pass any number of elements
     */
    show: function() {
        OpenLayers.Console.warn(OpenLayers.i18n("methodDeprecated", {
            newMethod: "element.style.display = '';"
        }));

        for (var i=0, len=arguments.length; i<len; i++) {
            var element = OpenLayers.Util.getElement(arguments[i]);
            if (element) {
                element.style.display = '';
            }
        }
    },

    /**
     * APIFunction: getDimensions
     * *Deprecated*. Returns dimensions of the element passed in.
     *  
     * Parameters:
     * element - {DOMElement}
     * 
     * Returns:
     * {Object} Object with 'width' and 'height' properties which are the 
     *          dimensions of the element passed in.
     */
    getDimensions: function(element) {
        element = OpenLayers.Util.getElement(element);
        if (OpenLayers.Element.getStyle(element, 'display') != 'none') {
            return {width: element.offsetWidth, height: element.offsetHeight};
        }
    
        // All *Width and *Height properties give 0 on elements with display none,
        // so enable the element temporarily
        var els = element.style;
        var originalVisibility = els.visibility;
        var originalPosition = els.position;
        var originalDisplay = els.display;
        els.visibility = 'hidden';
        els.position = 'absolute';
        els.display = '';
        var originalWidth = element.clientWidth;
        var originalHeight = element.clientHeight;
        els.display = originalDisplay;
        els.position = originalPosition;
        els.visibility = originalVisibility;
        return {width: originalWidth, height: originalHeight};
    }
    
});

if (!String.prototype.startsWith) {
    /**
     * APIMethod: String.startsWith
     * *Deprecated*. Whether or not a string starts with another string. 
     * 
     * Parameters:
     * sStart - {String} The string we're testing for.
     *  
     * Returns:
     * {Boolean} Whether or not this string starts with the string passed in.
     */
    String.prototype.startsWith = function(sStart) {
        OpenLayers.Console.warn(OpenLayers.i18n("methodDeprecated",
                                {'newMethod':'OpenLayers.String.startsWith'}));
        return OpenLayers.String.startsWith(this, sStart);
    };
}

if (!String.prototype.contains) {
    /**
     * APIMethod: String.contains
     * *Deprecated*. Whether or not a string contains another string.
     * 
     * Parameters:
     * str - {String} The string that we're testing for.
     * 
     * Returns:
     * {Boolean} Whether or not this string contains with the string passed in.
     */
    String.prototype.contains = function(str) {
        OpenLayers.Console.warn(OpenLayers.i18n("methodDeprecated",
                                  {'newMethod':'OpenLayers.String.contains'}));
        return OpenLayers.String.contains(this, str);
    };
}

if (!String.prototype.trim) {
    /**
     * APIMethod: String.trim
     * *Deprecated*. Removes leading and trailing whitespace characters from a string.
     * 
     * Returns:
     * {String} A trimmed version of the string - all leading and 
     *          trailing spaces removed
     */
    String.prototype.trim = function() {
        OpenLayers.Console.warn(OpenLayers.i18n("methodDeprecated",
                                      {'newMethod':'OpenLayers.String.trim'}));
        return OpenLayers.String.trim(this);
    };
}

if (!String.prototype.camelize) {
    /**
     * APIMethod: String.camelize
     * *Deprecated*. Camel-case a hyphenated string. 
     *     Ex. "chicken-head" becomes "chickenHead", and
     *     "-chicken-head" becomes "ChickenHead".
     * 
     * Returns:
     * {String} The string, camelized
     */
    String.prototype.camelize = function() {
        OpenLayers.Console.warn(OpenLayers.i18n("methodDeprecated",
                                  {'newMethod':'OpenLayers.String.camelize'}));
        return OpenLayers.String.camelize(this);
    };
}

if (!String.prototype.startsWith) {
    /**
     * APIMethod: String.startsWith
     * *Deprecated*. Whether or not a string starts with another string. 
     * 
     * Parameters:
     * sStart - {String} The string we're testing for.
     *  
     * Returns:
     * {Boolean} Whether or not this string starts with the string passed in.
     */
    String.prototype.startsWith = function(sStart) {
        OpenLayers.Console.warn(OpenLayers.i18n("methodDeprecated",
                                {'newMethod':'OpenLayers.String.startsWith'}));
        return OpenLayers.String.startsWith(this, sStart);
    };
}

if (!String.prototype.contains) {
    /**
     * APIMethod: String.contains
     * *Deprecated*. Whether or not a string contains another string.
     * 
     * Parameters:
     * str - {String} The string that we're testing for.
     * 
     * Returns:
     * {Boolean} Whether or not this string contains with the string passed in.
     */
    String.prototype.contains = function(str) {
        OpenLayers.Console.warn(OpenLayers.i18n("methodDeprecated",
                                  {'newMethod':'OpenLayers.String.contains'}));
        return OpenLayers.String.contains(this, str);
    };
}

if (!String.prototype.trim) {
    /**
     * APIMethod: String.trim
     * *Deprecated*. Removes leading and trailing whitespace characters from a string.
     * 
     * Returns:
     * {String} A trimmed version of the string - all leading and 
     *          trailing spaces removed
     */
    String.prototype.trim = function() {
        OpenLayers.Console.warn(OpenLayers.i18n("methodDeprecated",
                                      {'newMethod':'OpenLayers.String.trim'}));
        return OpenLayers.String.trim(this);
    };
}

if (!String.prototype.camelize) {
    /**
     * APIMethod: String.camelize
     * *Deprecated*. Camel-case a hyphenated string. 
     *     Ex. "chicken-head" becomes "chickenHead", and
     *     "-chicken-head" becomes "ChickenHead".
     * 
     * Returns:
     * {String} The string, camelized
     */
    String.prototype.camelize = function() {
        OpenLayers.Console.warn(OpenLayers.i18n("methodDeprecated",
                                  {'newMethod':'OpenLayers.String.camelize'}));
        return OpenLayers.String.camelize(this);
    };
}

if (!Function.prototype.bind) {
    /**
     * APIMethod: Function.bind
     * *Deprecated*. Bind a function to an object. 
     * Method to easily create closures with 'this' altered.
     * 
     * Parameters:
     * object - {Object} the this parameter
     * 
     * Returns:
     * {Function} A closure with 'this' altered to the first
     *            argument.
     */
    Function.prototype.bind = function() {
        OpenLayers.Console.warn(OpenLayers.i18n("methodDeprecated",
                                {'newMethod':'OpenLayers.Function.bind'}));
        // new function takes the same arguments with this function up front
        Array.prototype.unshift.apply(arguments, [this]);
        return OpenLayers.Function.bind.apply(null, arguments);
    };
}

if (!Function.prototype.bindAsEventListener) {
    /**
     * APIMethod: Function.bindAsEventListener
     * *Deprecated*. Bind a function to an object, and configure it to receive the
     *     event object as first parameter when called. 
     * 
     * Parameters:
     * object - {Object} A reference to this.
     * 
     * Returns:
     * {Function}
     */
    Function.prototype.bindAsEventListener = function(object) {
        OpenLayers.Console.warn(OpenLayers.i18n("methodDeprecated",
                        {'newMethod':'OpenLayers.Function.bindAsEventListener'}));
        return OpenLayers.Function.bindAsEventListener(this, object);
    };
}

/**
 * Class: OpenLayers.Control.MouseDefaults
 * This class is DEPRECATED in 2.4 and will be removed by 3.0.
 * If you need this functionality, use <OpenLayers.Control.Navigation> 
 * instead!!!
 *
 * This class is DEPRECATED in 2.4 and will be removed by 3.0.
 *     If you need this functionality, use Control.Navigation instead!!!
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.MouseDefaults = OpenLayers.Class(OpenLayers.Control, {

    /** WARNING WARNING WARNING!!!
        This class is DEPRECATED in 2.4 and will be removed by 3.0.
        If you need this functionality, use Control.Navigation instead!!! */

    /** 
     * Property: performedDrag
     * {Boolean}
     */
    performedDrag: false,

    /** 
     * Property: wheelObserver 
     * {Function}
     */
    wheelObserver: null,

    /** 
     * Constructor: OpenLayers.Control.MouseDefaults
     */
    initialize: function() {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },

    /**
     * APIMethod: destroy
     */    
    destroy: function() {
        
        if (this.handler) {
            this.handler.destroy();
        }
        this.handler = null;

        this.map.events.un({
            "click": this.defaultClick,
            "dblclick": this.defaultDblClick,
            "mousedown": this.defaultMouseDown,
            "mouseup": this.defaultMouseUp,
            "mousemove": this.defaultMouseMove,
            "mouseout": this.defaultMouseOut,
            scope: this
        });

        //unregister mousewheel events specifically on the window and document
        OpenLayers.Event.stopObserving(window, "DOMMouseScroll", 
                                        this.wheelObserver);
        OpenLayers.Event.stopObserving(window, "mousewheel", 
                                        this.wheelObserver);
        OpenLayers.Event.stopObserving(document, "mousewheel", 
                                        this.wheelObserver);
        this.wheelObserver = null;
                      
        OpenLayers.Control.prototype.destroy.apply(this, arguments);        
    },

    /**
     * Method: draw
     */
    draw: function() {
        this.map.events.on({
            "click": this.defaultClick,
            "dblclick": this.defaultDblClick,
            "mousedown": this.defaultMouseDown,
            "mouseup": this.defaultMouseUp,
            "mousemove": this.defaultMouseMove,
            "mouseout": this.defaultMouseOut,
            scope: this
        });

        this.registerWheelEvents();

    },

    /**
     * Method: registerWheelEvents
     */
    registerWheelEvents: function() {

        this.wheelObserver = OpenLayers.Function.bindAsEventListener(
            this.onWheelEvent, this
        );
        
        //register mousewheel events specifically on the window and document
        OpenLayers.Event.observe(window, "DOMMouseScroll", this.wheelObserver);
        OpenLayers.Event.observe(window, "mousewheel", this.wheelObserver);
        OpenLayers.Event.observe(document, "mousewheel", this.wheelObserver);
    },

    /**
     * Method: defaultClick
     * 
     * Parameters:
     * evt - {Event} 
     *
     * Returns:
     * {Boolean}
     */
    defaultClick: function (evt) {
        if (!OpenLayers.Event.isLeftClick(evt)) {
            return;
        }
        var notAfterDrag = !this.performedDrag;
        this.performedDrag = false;
        return notAfterDrag;
    },

    /**
     * Method: defaultDblClick
     * 
     * Parameters:
     * evt - {Event} 
     */
    defaultDblClick: function (evt) {
        var newCenter = this.map.getLonLatFromViewPortPx( evt.xy ); 
        this.map.setCenter(newCenter, this.map.zoom + 1);
        OpenLayers.Event.stop(evt);
        return false;
    },

    /**
     * Method: defaultMouseDown
     * 
     * Parameters:
     * evt - {Event} 
     */
    defaultMouseDown: function (evt) {
        if (!OpenLayers.Event.isLeftClick(evt)) {
            return;
        }
        this.mouseDragStart = evt.xy.clone();
        this.performedDrag  = false;
        if (evt.shiftKey) {
            this.map.div.style.cursor = "crosshair";
            this.zoomBox = OpenLayers.Util.createDiv('zoomBox',
                                                     this.mouseDragStart,
                                                     null,
                                                     null,
                                                     "absolute",
                                                     "2px solid red");
            this.zoomBox.style.backgroundColor = "white";
            this.zoomBox.style.filter = "alpha(opacity=50)"; // IE
            this.zoomBox.style.opacity = "0.50";
            this.zoomBox.style.fontSize = "1px";
            this.zoomBox.style.zIndex = this.map.Z_INDEX_BASE["Popup"] - 1;
            this.map.eventsDiv.appendChild(this.zoomBox);
        }
        document.onselectstart = OpenLayers.Function.False;
        OpenLayers.Event.stop(evt);
    },

    /**
     * Method: defaultMouseMove
     *
     * Parameters:
     * evt - {Event} 
     */
    defaultMouseMove: function (evt) {
        // record the mouse position, used in onWheelEvent
        this.mousePosition = evt.xy.clone();

        if (this.mouseDragStart != null) {
            if (this.zoomBox) {
                var deltaX = Math.abs(this.mouseDragStart.x - evt.xy.x);
                var deltaY = Math.abs(this.mouseDragStart.y - evt.xy.y);
                this.zoomBox.style.width = Math.max(1, deltaX) + "px";
                this.zoomBox.style.height = Math.max(1, deltaY) + "px";
                if (evt.xy.x < this.mouseDragStart.x) {
                    this.zoomBox.style.left = evt.xy.x+"px";
                }
                if (evt.xy.y < this.mouseDragStart.y) {
                    this.zoomBox.style.top = evt.xy.y+"px";
                }
            } else {
                var deltaX = this.mouseDragStart.x - evt.xy.x;
                var deltaY = this.mouseDragStart.y - evt.xy.y;
                var size = this.map.getSize();
                var newXY = new OpenLayers.Pixel(size.w / 2 + deltaX,
                                                 size.h / 2 + deltaY);
                var newCenter = this.map.getLonLatFromViewPortPx( newXY ); 
                this.map.setCenter(newCenter, null, true);
                this.mouseDragStart = evt.xy.clone();
                this.map.div.style.cursor = "move";
            }
            this.performedDrag = true;
        }
    },

    /**
     * Method: defaultMouseUp
     * 
     * Parameters:
     * evt - {<OpenLayers.Event>} 
     */
    defaultMouseUp: function (evt) {
        if (!OpenLayers.Event.isLeftClick(evt)) {
            return;
        }
        if (this.zoomBox) {
            this.zoomBoxEnd(evt);    
        } else {
            if (this.performedDrag) {
                this.map.setCenter(this.map.center);
            }
        }
        document.onselectstart=null;
        this.mouseDragStart = null;
        this.map.div.style.cursor = "";
    },

    /**
     * Method: defaultMouseOut
     * 
     * Parameters:
     * evt - {Event} 
     */
    defaultMouseOut: function (evt) {
        if (this.mouseDragStart != null && 
            OpenLayers.Util.mouseLeft(evt, this.map.eventsDiv)) {
            if (this.zoomBox) {
                this.removeZoomBox();
            }
            this.mouseDragStart = null;
        }
    },


    /** 
     * Method: defaultWheelUp
     * User spun scroll wheel up
     * 
     */
    defaultWheelUp: function(evt) {
        if (this.map.getZoom() <= this.map.getNumZoomLevels()) {
            this.map.setCenter(this.map.getLonLatFromPixel(evt.xy),
                               this.map.getZoom() + 1);
        }
    },

    /**
     * Method: defaultWheelDown
     * User spun scroll wheel down
     */
    defaultWheelDown: function(evt) {
        if (this.map.getZoom() > 0) {
            this.map.setCenter(this.map.getLonLatFromPixel(evt.xy),
                               this.map.getZoom() - 1);
        }
    },

    /**
     * Method: zoomBoxEnd
     * Zoombox function. 
     */
    zoomBoxEnd: function(evt) {
        if (this.mouseDragStart != null) {
            if (Math.abs(this.mouseDragStart.x - evt.xy.x) > 5 ||    
                Math.abs(this.mouseDragStart.y - evt.xy.y) > 5) {   
                var start = this.map.getLonLatFromViewPortPx( this.mouseDragStart ); 
                var end = this.map.getLonLatFromViewPortPx( evt.xy );
                var top = Math.max(start.lat, end.lat);
                var bottom = Math.min(start.lat, end.lat);
                var left = Math.min(start.lon, end.lon);
                var right = Math.max(start.lon, end.lon);
                var bounds = new OpenLayers.Bounds(left, bottom, right, top);
                this.map.zoomToExtent(bounds);
            } else {
                var end = this.map.getLonLatFromViewPortPx( evt.xy );
                this.map.setCenter(new OpenLayers.LonLat(
                  (end.lon),
                  (end.lat)
                 ), this.map.getZoom() + 1);
            }    
            this.removeZoomBox();
       }
    },

    /**
     * Method: removeZoomBox
     * Remove the zoombox from the screen and nullify our reference to it.
     */
    removeZoomBox: function() {
        this.map.eventsDiv.removeChild(this.zoomBox);
        this.zoomBox = null;
    },


/**
 *  Mouse ScrollWheel code thanks to http://adomas.org/javascript-mouse-wheel/
 */


    /**
     * Method: onWheelEvent
     * Catch the wheel event and handle it xbrowserly
     *
     * Parameters: 
     * e - {Event} 
     */
    onWheelEvent: function(e){
    
        // first determine whether or not the wheeling was inside the map
        var inMap = false;
        var elem = OpenLayers.Event.element(e);
        while(elem != null) {
            if (this.map && elem == this.map.div) {
                inMap = true;
                break;
            }
            elem = elem.parentNode;
        }
        
        if (inMap) {
            
            var delta = 0;
            if (!e) {
                e = window.event;
            }
            if (e.wheelDelta) {
                delta = e.wheelDelta/120; 
                if (window.opera && window.opera.version() < 9.2) {
                    delta = -delta;
                }
            } else if (e.detail) {
                delta = -e.detail / 3;
            }
            if (delta) {
                // add the mouse position to the event because mozilla has a bug
                // with clientX and clientY (see https://bugzilla.mozilla.org/show_bug.cgi?id=352179)
                // getLonLatFromViewPortPx(e) returns wrong values
                e.xy = this.mousePosition;

                if (delta < 0) {
                   this.defaultWheelDown(e);
                } else {
                   this.defaultWheelUp(e);
                }
            }
            
            //only wheel the map, not the window
            OpenLayers.Event.stop(e);
        }
    },

    CLASS_NAME: "OpenLayers.Control.MouseDefaults"
});

/**
 * Class: OpenLayers.Control.MouseToolbar
 * This class is DEPRECATED in 2.4 and will be removed by 3.0.
 * If you need this functionality, use <OpenLayers.Control.NavToolbar>
 * instead!!! 
 */
OpenLayers.Control.MouseToolbar = OpenLayers.Class(
                                            OpenLayers.Control.MouseDefaults, {
    
    /**
     * Property: mode
     */ 
    mode: null,
    /**
     * Property: buttons
     */
    buttons: null,
    
    /**
     * APIProperty: direction
     * {String} 'vertical' or 'horizontal'
     */
    direction: "vertical",
    
    /**
     * Property: buttonClicked
     * {String}
     */
    buttonClicked: null,
    
    /**
     * Constructor: OpenLayers.Control.MouseToolbar
     *
     * Parameters:
     * position - {<OpenLayers.Pixel>}
     * direction - {String}
     */
    initialize: function(position, direction) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
        this.position = new OpenLayers.Pixel(OpenLayers.Control.MouseToolbar.X,
                                             OpenLayers.Control.MouseToolbar.Y);
        if (position) {
            this.position = position;
        }
        if (direction) {
            this.direction = direction; 
        }
        this.measureDivs = [];
    },
    
    /**
     * APIMethod: destroy 
     */
    destroy: function() {
        for( var btnId in this.buttons) {
            var btn = this.buttons[btnId];
            btn.map = null;
            btn.events.destroy();
        }
        OpenLayers.Control.MouseDefaults.prototype.destroy.apply(this, 
                                                                 arguments);
    },
    
    /**
     * Method: draw
     */
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this, arguments); 
        OpenLayers.Control.MouseDefaults.prototype.draw.apply(this, arguments);
        this.buttons = {};
        var sz = new OpenLayers.Size(28,28);
        var centered = new OpenLayers.Pixel(OpenLayers.Control.MouseToolbar.X,0);
        this._addButton("zoombox", "drag-rectangle-off.png", "drag-rectangle-on.png", centered, sz, "Shift->Drag to zoom to area");
        centered = centered.add((this.direction == "vertical" ? 0 : sz.w), (this.direction == "vertical" ? sz.h : 0));
        this._addButton("pan", "panning-hand-off.png", "panning-hand-on.png", centered, sz, "Drag the map to pan.");
        centered = centered.add((this.direction == "vertical" ? 0 : sz.w), (this.direction == "vertical" ? sz.h : 0));
        this.switchModeTo("pan");

        return this.div;
    },
    
    /**
     * Method: _addButton
     */
    _addButton:function(id, img, activeImg, xy, sz, title) {
        var imgLocation = OpenLayers.Util.getImagesLocation() + img;
        var activeImgLocation = OpenLayers.Util.getImagesLocation() + activeImg;
        // var btn = new ol.AlphaImage("_"+id, imgLocation, xy, sz);
        var btn = OpenLayers.Util.createAlphaImageDiv(
                                    "OpenLayers_Control_MouseToolbar_" + id, 
                                    xy, sz, imgLocation, "absolute");

        //we want to add the outer div
        this.div.appendChild(btn);
        btn.imgLocation = imgLocation;
        btn.activeImgLocation = activeImgLocation;
        
        btn.events = new OpenLayers.Events(this, btn, null, true);
        btn.events.on({
            "mousedown": this.buttonDown,
            "mouseup": this.buttonUp,
            "dblclick": OpenLayers.Event.stop,
            scope: this
        });
        btn.action = id;
        btn.title = title;
        btn.alt = title;
        btn.map = this.map;

        //we want to remember/reference the outer div
        this.buttons[id] = btn;
        return btn;
    },

    /**
     * Method: buttonDown
     *
     * Parameters:
     * evt - {Event} 
     */
    buttonDown: function(evt) {
        if (!OpenLayers.Event.isLeftClick(evt)) {
            return;
        }
        this.buttonClicked = evt.element.action;
        OpenLayers.Event.stop(evt);
    },

    /**
     * Method: buttonUp
     *
     * Parameters:
     * evt - {Event} 
     */
    buttonUp: function(evt) {
        if (!OpenLayers.Event.isLeftClick(evt)) {
            return;
        }
        if (this.buttonClicked != null) {
            if (this.buttonClicked == evt.element.action) {
                this.switchModeTo(evt.element.action);
            }
            OpenLayers.Event.stop(evt);
            this.buttonClicked = null;
        }
    },
    
    /**
     * Method: defaultDblClick 
     *
     * Parameters:
     * evt - {Event} 
     */
    defaultDblClick: function (evt) {
        this.switchModeTo("pan");
        this.performedDrag = false;
        var newCenter = this.map.getLonLatFromViewPortPx( evt.xy ); 
        this.map.setCenter(newCenter, this.map.zoom + 1);
        OpenLayers.Event.stop(evt);
        return false;
    },

    /**
     * Method: defaultMouseDown
     *
     * Parameters:
     * evt - {Event} 
     */
    defaultMouseDown: function (evt) {
        if (!OpenLayers.Event.isLeftClick(evt)) {
            return;
        }
        this.mouseDragStart = evt.xy.clone();
        this.performedDrag = false;
        this.startViaKeyboard = false;
        if (evt.shiftKey && this.mode !="zoombox") {
            this.switchModeTo("zoombox");
            this.startViaKeyboard = true;
        } else if (evt.altKey && this.mode !="measure") {
            this.switchModeTo("measure");
        } else if (!this.mode) {
            this.switchModeTo("pan");
        }
        
        switch (this.mode) {
            case "zoombox":
                this.map.div.style.cursor = "crosshair";
                this.zoomBox = OpenLayers.Util.createDiv('zoomBox',
                                                         this.mouseDragStart,
                                                         null,
                                                         null,
                                                         "absolute",
                                                         "2px solid red");
                this.zoomBox.style.backgroundColor = "white";
                this.zoomBox.style.filter = "alpha(opacity=50)"; // IE
                this.zoomBox.style.opacity = "0.50";
                this.zoomBox.style.fontSize = "1px";
                this.zoomBox.style.zIndex = this.map.Z_INDEX_BASE["Popup"] - 1;
                this.map.eventsDiv.appendChild(this.zoomBox);
                this.performedDrag = true;
                break;
            case "measure":
                var distance = "";
                if (this.measureStart) {
                    var measureEnd = this.map.getLonLatFromViewPortPx(this.mouseDragStart);
                    distance = OpenLayers.Util.distVincenty(this.measureStart, measureEnd);
                    distance = Math.round(distance * 100) / 100;
                    distance = distance + "km";
                    this.measureStartBox = this.measureBox;
                }    
                this.measureStart = this.map.getLonLatFromViewPortPx(this.mouseDragStart);;
                this.measureBox = OpenLayers.Util.createDiv(null,
                                                         this.mouseDragStart.add(
                                                           -2-parseInt(this.map.layerContainerDiv.style.left),
                                                           -2-parseInt(this.map.layerContainerDiv.style.top)),
                                                         null,
                                                         null,
                                                         "absolute");
                this.measureBox.style.width="4px";
                this.measureBox.style.height="4px";
                this.measureBox.style.fontSize = "1px";
                this.measureBox.style.backgroundColor="red";
                this.measureBox.style.zIndex = this.map.Z_INDEX_BASE["Popup"] - 1;
                this.map.layerContainerDiv.appendChild(this.measureBox);
                if (distance) {
                    this.measureBoxDistance = OpenLayers.Util.createDiv(null,
                                                         this.mouseDragStart.add(
                                                           -2-parseInt(this.map.layerContainerDiv.style.left),
                                                           2-parseInt(this.map.layerContainerDiv.style.top)),
                                                         null,
                                                         null,
                                                         "absolute");
                    
                    this.measureBoxDistance.innerHTML = distance;
                    this.measureBoxDistance.style.zIndex = this.map.Z_INDEX_BASE["Popup"] - 1;
                    this.map.layerContainerDiv.appendChild(this.measureBoxDistance);
                    this.measureDivs.push(this.measureBoxDistance);
                }
                this.measureBox.style.zIndex = this.map.Z_INDEX_BASE["Popup"] - 1;
                this.map.layerContainerDiv.appendChild(this.measureBox);
                this.measureDivs.push(this.measureBox);
                break;
            default:
                this.map.div.style.cursor = "move";
                break;
        }
        document.onselectstart = OpenLayers.Function.False;
        OpenLayers.Event.stop(evt);
    },

    /**
     * Method: switchModeTo 
     *
     * Parameters:
     * mode - {String} 
     */
    switchModeTo: function(mode) {
        if (mode != this.mode) {
            

            if (this.mode && this.buttons[this.mode]) {
                OpenLayers.Util.modifyAlphaImageDiv(this.buttons[this.mode], null, null, null, this.buttons[this.mode].imgLocation);
            }
            if (this.mode == "measure" && mode != "measure") {
                for(var i=0, len=this.measureDivs.length; i<len; i++) {
                    if (this.measureDivs[i]) { 
                        this.map.layerContainerDiv.removeChild(this.measureDivs[i]);
                    }
                }
                this.measureDivs = [];
                this.measureStart = null;
            }
            this.mode = mode;
            if (this.buttons[mode]) {
                OpenLayers.Util.modifyAlphaImageDiv(this.buttons[mode], null, null, null, this.buttons[mode].activeImgLocation);
            }
            switch (this.mode) {
                case "zoombox":
                    this.map.div.style.cursor = "crosshair";
                    break;
                default:
                    this.map.div.style.cursor = "";
                    break;
            }

        } 
    }, 

    /**
     * Method: leaveMode
     */
    leaveMode: function() {
        this.switchModeTo("pan");
    },
    
    /**
     * Method: defaultMouseMove
     *
     * Parameters:
     * evt - {Event} 
     */
    defaultMouseMove: function (evt) {
        if (this.mouseDragStart != null) {
            switch (this.mode) {
                case "zoombox": 
                    var deltaX = Math.abs(this.mouseDragStart.x - evt.xy.x);
                    var deltaY = Math.abs(this.mouseDragStart.y - evt.xy.y);
                    this.zoomBox.style.width = Math.max(1, deltaX) + "px";
                    this.zoomBox.style.height = Math.max(1, deltaY) + "px";
                    if (evt.xy.x < this.mouseDragStart.x) {
                        this.zoomBox.style.left = evt.xy.x+"px";
                    }
                    if (evt.xy.y < this.mouseDragStart.y) {
                        this.zoomBox.style.top = evt.xy.y+"px";
                    }
                    break;
                default:
                    var deltaX = this.mouseDragStart.x - evt.xy.x;
                    var deltaY = this.mouseDragStart.y - evt.xy.y;
                    var size = this.map.getSize();
                    var newXY = new OpenLayers.Pixel(size.w / 2 + deltaX,
                                                     size.h / 2 + deltaY);
                    var newCenter = this.map.getLonLatFromViewPortPx( newXY ); 
                    this.map.setCenter(newCenter, null, true);
                    this.mouseDragStart = evt.xy.clone();
            }
            this.performedDrag = true;
        }
    },

    /**
     * Method: defaultMouseUp
     *
     * Parameters:
     * evt - {Event} 
     */
    defaultMouseUp: function (evt) {
        if (!OpenLayers.Event.isLeftClick(evt)) {
            return;
        }
        switch (this.mode) {
            case "zoombox":
                this.zoomBoxEnd(evt);
                if (this.startViaKeyboard) {
                    this.leaveMode();
                }
                break;
            case "pan":
                if (this.performedDrag) {
                    this.map.setCenter(this.map.center);
                }        
        }
        document.onselectstart = null;
        this.mouseDragStart = null;
        this.map.div.style.cursor = "default";
    },

    /**
     * Method: defaultMouseOut
     *
     * Parameters:
     * evt - {Event} 
     */
    defaultMouseOut: function (evt) {
        if (this.mouseDragStart != null
            && OpenLayers.Util.mouseLeft(evt, this.map.eventsDiv)) {
            if (this.zoomBox) {
                this.removeZoomBox();
                if (this.startViaKeyboard) {
                    this.leaveMode();
                }
            }
            this.mouseDragStart = null;
            this.map.div.style.cursor = "default";
        }
    },

    /**
     * Method: defaultClick
     *
     * Parameters:
     * evt - {Event} 
     */
    defaultClick: function (evt) {
        if (this.performedDrag)  {
            this.performedDrag = false;
            return false;
        }
    },
    
    CLASS_NAME: "OpenLayers.Control.MouseToolbar"
});

OpenLayers.Control.MouseToolbar.X = 6;
OpenLayers.Control.MouseToolbar.Y = 300;

/**
 * Class: OpenLayers.Format.XML
 */
OpenLayers.Util.extend(OpenLayers.Format.XML.prototype, {

    /**
     * APIMethod: concatChildValues
     * *Deprecated*. Use <getChildValue> instead.
     *
     * Concatenate the value of all child nodes if any exist, or return an
     *     optional default string.  Returns an empty string if no children
     *     exist and no default value is supplied.  Not optimized for large
     *     numbers of child nodes.
     *
     * Parameters:
     * node - {DOMElement} The element used to look for child values.
     * def - {String} Optional string to return in the event that no
     *     child exist.
     *
     * Returns:
     * {String} The concatenated value of all child nodes of the given node.
     */
    concatChildValues: function(node, def) {
        var value = "";
        var child = node.firstChild;
        var childValue;
        while(child) {
            childValue = child.nodeValue;
            if(childValue) {
                value += childValue;
            }
            child = child.nextSibling;
        }
        if(value == "" && def != undefined) {
            value = def;
        }
        return value;
    }

});

/**
 * Class: OpenLayers.Layer.WMS.Post
 * Instances of OpenLayers.Layer.WMS.Post are used to retrieve data from OGC
 * Web Mapping Services via HTTP-POST (application/x-www-form-urlencoded). 
 * Create a new WMS layer with the <OpenLayers.Layer.WMS.Post> constructor.
 *
 * *Deprecated*. Instead of this layer, use <OpenLayers.Layer.WMS> with
 * <OpenLayers.Tile.Image.maxGetUrlLength> configured in the layer's
 * <OpenLayers.Layer.WMS.tileOptions>.
 *
 * Inherits from:
 *  - <OpenLayers.Layer.WMS>
 */
OpenLayers.Layer.WMS.Post = OpenLayers.Class(OpenLayers.Layer.WMS, {

    /**
     * APIProperty: unsupportedBrowsers
     * {Array} Array with browsers, which should use the HTTP-GET protocol 
     * instead of HTTP-POST for fetching tiles from a WMS .
     * Defaults to ["mozilla", "firefox", "opera"], because Opera is not able 
     * to show transparent images in IFrames and Firefox/Mozilla has some ugly 
     * effects of viewport-shaking when panning the map. Both browsers, Opera
     * and Firefox/Mozilla, have no problem with long urls, which is the reason
     * for using POST instead of GET. The strings to pass to this array are
     * the ones returned by <OpenLayers.BROWSER_NAME>.
     */
    unsupportedBrowsers: ["mozilla", "firefox", "opera"],

    /**
     * Property: SUPPORTED_TRANSITIONS
     * {Array} 
     * no supported transitions for this type of layer, because it is not
     * possible to modify the initialized tiles (iframes)
     */
    SUPPORTED_TRANSITIONS: [],
    
    /**
     * Property: usePost
     * {Boolean}
     */
    usePost: null,

    /**
     * Constructor: OpenLayers.Layer.WMS.Post
     * Creates a new WMS layer object.
     *
     * Example:
     * (code)
     * var wms = new OpenLayers.Layer.WMS.Post(
     *  "NASA Global Mosaic",
     *  "http://wms.jpl.nasa.gov/wms.cgi",
     *  {layers: "modis, global_mosaic"});
     * (end)
     *
     * Parameters:
     * name - {String} A name for the layer
     * url - {String} Base url for the WMS
     *                (e.g. http://wms.jpl.nasa.gov/wms.cgi)
     * params - {Object} An object with key/value pairs representing the
     *                   GetMap query string parameters and parameter values.
     * options - {Object} Hashtable of extra options to tag onto the layer.
     */
    initialize: function(name, url, params, options) {
        var newArguments = [];
        newArguments.push(name, url, params, options);
        OpenLayers.Layer.WMS.prototype.initialize.apply(this, newArguments);

        this.usePost = OpenLayers.Util.indexOf(
            this.unsupportedBrowsers, OpenLayers.BROWSER_NAME) == -1;
    },
    
    /**
     * Method: addTile
     * addTile creates a tile, initializes it and adds it as iframe to the
     * layer div.
     *
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     * position - {<OpenLayers.Pixel>}
     *
     * Returns:
     * {<OpenLayers.Tile.Image.IFrame>} The added OpenLayers.Tile.Image.IFrame
     */
    addTile: function(bounds,position) {
        return new OpenLayers.Tile.Image(
            this, position, bounds, null, this.tileSize, {
                maxGetUrlLength: this.usePost ? 0 : null
            });
    },

    CLASS_NAME: 'OpenLayers.Layer.WMS.Post'
});

/**
 * Class: OpenLayers.Layer.WMS.Untiled
 * *Deprecated*.  To be removed in 3.0.  Instead use OpenLayers.Layer.WMS and 
 *     pass the option 'singleTile' as true.
 * 
 * Inherits from: 
 *  - <OpenLayers.Layer.WMS>
 */
OpenLayers.Layer.WMS.Untiled = OpenLayers.Class(OpenLayers.Layer.WMS, {

    /**
     * APIProperty: singleTile
     * {singleTile} Always true for untiled.
     */
    singleTile: true,

    /**
     * Constructor: OpenLayers.Layer.WMS.Untiled
     *
     * Parameters:
     * name - {String} 
     * url - {String} 
     * params - {Object} 
     * options - {Object} 
     */
    initialize: function(name, url, params, options) {
        OpenLayers.Layer.WMS.prototype.initialize.apply(this, arguments);
        
        var msg = "The OpenLayers.Layer.WMS.Untiled class is deprecated and " +
                  "will be removed in 3.0. Instead, you should use the " +
                  "normal OpenLayers.Layer.WMS class, passing it the option " +
                  "'singleTile' as true.";
        OpenLayers.Console.warn(msg);
    },    

    /**
     * Method: clone
     * Create a clone of this layer
     *
     * Returns:
     * {<OpenLayers.Layer.WMS.Untiled>} An exact clone of this layer
     */
    clone: function (obj) {
        
        if (obj == null) {
            obj = new OpenLayers.Layer.WMS.Untiled(this.name,
                                                   this.url,
                                                   this.params,
                                                   this.getOptions());
        }

        //get all additions from superclasses
        obj = OpenLayers.Layer.WMS.prototype.clone.apply(this, [obj]);

        // copy/set any non-init, non-simple values here

        return obj;
    }, 

    CLASS_NAME: "OpenLayers.Layer.WMS.Untiled"
});

/**
 * Class: OpenLayers.Layer.MapServer.Untiled
 * *Deprecated*.  To be removed in 3.0.  Instead use OpenLayers.Layer.MapServer
 *     and pass the option 'singleTile' as true.
 * 
 * Inherits from: 
 *  - <OpenLayers.Layer.MapServer>
 */
OpenLayers.Layer.MapServer.Untiled = OpenLayers.Class(OpenLayers.Layer.MapServer, {

    /**
     * APIProperty: singleTile
     * {singleTile} Always true for untiled.
     */
    singleTile: true,

    /**
     * Constructor: OpenLayers.Layer.MapServer.Untiled
     *
     * Parameters:
     * name - {String} 
     * url - {String} 
     * params - {Object} 
     * options - {Object} 
     */
    initialize: function(name, url, params, options) {
        OpenLayers.Layer.MapServer.prototype.initialize.apply(this, arguments);
        
        var msg = "The OpenLayers.Layer.MapServer.Untiled class is deprecated and " +
                  "will be removed in 3.0. Instead, you should use the " +
                  "normal OpenLayers.Layer.MapServer class, passing it the option " +
                  "'singleTile' as true.";
        OpenLayers.Console.warn(msg);
    },    

    /**
     * Method: clone
     * Create a clone of this layer
     *
     * Returns:
     * {<OpenLayers.Layer.MapServer.Untiled>} An exact clone of this layer
     */
    clone: function (obj) {
        
        if (obj == null) {
            obj = new OpenLayers.Layer.MapServer.Untiled(this.name,
                                                         this.url,
                                                         this.params,
                                                         this.getOptions());
        }

        //get all additions from superclasses
        obj = OpenLayers.Layer.MapServer.prototype.clone.apply(this, [obj]);

        // copy/set any non-init, non-simple values here
        
        return obj;
    }, 

    CLASS_NAME: "OpenLayers.Layer.MapServer.Untiled"
});

/**
 * Class: OpenLayers.Tile.WFS
 * Instances of OpenLayers.Tile.WFS are used to manage the image tiles
 * used by various layers.  Create a new image tile with the
 * <OpenLayers.Tile.WFS> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Tile>
 */
OpenLayers.Tile.WFS = OpenLayers.Class(OpenLayers.Tile, {

    /**
     * Property: features
     * {Array(<OpenLayers.Feature>)} list of features in this tile
     */
    features: null,

    /**
     * Property: url
     * {String}
     */
    url: null,

    /**
     * Property: request
     * {<OpenLayers.Request.XMLHttpRequest>}
     */
    request: null,

    /** TBD 3.0 - reorder the parameters to the init function to put URL
     *             as last, so we can continue to call tile.initialize()
     *             without changing the arguments.
     *
     * Constructor: OpenLayers.Tile.WFS
     * Constructor for a new <OpenLayers.Tile.WFS> instance.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer>} layer that the tile will go in.
     * position - {<OpenLayers.Pixel>}
     * bounds - {<OpenLayers.Bounds>}
     * url - {<String>}
     * size - {<OpenLayers.Size>}
     */
    initialize: function(layer, position, bounds, url, size) {
        OpenLayers.Tile.prototype.initialize.apply(this, arguments);
        this.url = url;
        this.features = [];
    },

    /**
     * APIMethod: destroy
     * nullify references to prevent circular references and memory leaks
     */
    destroy: function() {
        OpenLayers.Tile.prototype.destroy.apply(this, arguments);
        this.destroyAllFeatures();
        this.features = null;
        this.url = null;
        if(this.request) {
            this.request.abort();
            //this.request.destroy();
            this.request = null;
        }
    },

    /**
     * Method: clear
     *  Clear the tile of any bounds/position-related data so that it can
     *   be reused in a new location.
     */
    clear: function() {
        this.destroyAllFeatures();
    },

    /**
     * Method: draw
     * Check that a tile should be drawn, and load features for it.
     */
    draw:function() {
        if (OpenLayers.Tile.prototype.draw.apply(this, arguments)) {
            if (this.isLoading) {
                //if already loading, send 'reload' instead of 'loadstart'.
                this.events.triggerEvent("reload");
            } else {
                this.isLoading = true;
                this.events.triggerEvent("loadstart");
            }
            this.loadFeaturesForRegion(this.requestSuccess);
        }
    },

    /**
    * Method: loadFeaturesForRegion
    * Abort any pending requests and issue another request for data.
    *
    * Input are function pointers for what to do on success and failure.
    *
    * Parameters:
    * success - {function}
    * failure - {function}
    */
    loadFeaturesForRegion:function(success, failure) {
        if(this.request) {
            this.request.abort();
        }
        this.request = OpenLayers.Request.GET({
            url: this.url,
            success: success,
            failure: failure,
            scope: this
        });
    },

    /**
    * Method: requestSuccess
    * Called on return from request succcess. Adds results via
    * layer.addFeatures in vector mode, addResults otherwise.
    *
    * Parameters:
    * request - {<OpenLayers.Request.XMLHttpRequest>}
    */
    requestSuccess:function(request) {
        if (this.features) {
            var doc = request.responseXML;
            if (!doc || !doc.documentElement) {
                doc = request.responseText;
            }
            if (this.layer.vectorMode) {
                this.layer.addFeatures(this.layer.formatObject.read(doc));
            } else {
                var xml = new OpenLayers.Format.XML();
                if (typeof doc == "string") {
                    doc = xml.read(doc);
                }
                var resultFeatures = xml.getElementsByTagNameNS(
                    doc, "http://www.opengis.net/gml", "featureMember"
                );
                this.addResults(resultFeatures);
            }
        }
        if (this.events) {
            this.events.triggerEvent("loadend");
        }

        //request produced with success, we can delete the request object.
        //this.request.destroy();
        this.request = null;
    },

    /**
     * Method: addResults
     * Construct new feature via layer featureClass constructor, and add to
     * this.features.
     *
     * Parameters:
     * results - {Object}
     */
    addResults: function(results) {
        for (var i=0; i < results.length; i++) {
            var feature = new this.layer.featureClass(this.layer,
                                                      results[i]);
            this.features.push(feature);
        }
    },


    /**
     * Method: destroyAllFeatures
     * Iterate through and call destroy() on each feature, removing it from
     *   the local array
     */
    destroyAllFeatures: function() {
        while(this.features.length > 0) {
            var feature = this.features.shift();
            feature.destroy();
        }
    },

    CLASS_NAME: "OpenLayers.Tile.WFS"
  }
);

/**
 * Class: OpenLayers.Feature.WFS
 * WFS handling class, for use as a featureClass on the WFS layer for handling
 * 'point' WFS types. Good for subclassing when creating a custom WFS like
 * XML application.
 *
 * Inherits from:
 *  - <OpenLayers.Feature>
 */
OpenLayers.Feature.WFS = OpenLayers.Class(OpenLayers.Feature, {

    /**
     * Constructor: OpenLayers.Feature.WFS
     * Create a WFS feature.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer>}
     * xmlNode - {XMLNode}
     */
    initialize: function(layer, xmlNode) {
        var newArguments = arguments;
        var data = this.processXMLNode(xmlNode);
        newArguments = new Array(layer, data.lonlat, data);
        OpenLayers.Feature.prototype.initialize.apply(this, newArguments);
        this.createMarker();
        this.layer.addMarker(this.marker);
    },

    /**
     * Method: destroy
     * nullify references to prevent circular references and memory leaks
     */
    destroy: function() {
        if (this.marker != null) {
            this.layer.removeMarker(this.marker);
        }
        OpenLayers.Feature.prototype.destroy.apply(this, arguments);
    },

    /**
     * Method: processXMLNode
     * When passed an xmlNode, parses it for a GML point, and passes
     * back an object describing that point.
     *
     * For subclasses of Feature.WFS, this is the feature to change.
     *
     * Parameters:
     * xmlNode - {XMLNode}
     *
     * Returns:
     * {Object} Data Object with 'id', 'lonlat', and private properties set
     */
    processXMLNode: function(xmlNode) {
        //this should be overridden by subclasses
        // must return an Object with 'id' and 'lonlat' values set
        var point = OpenLayers.Ajax.getElementsByTagNameNS(xmlNode, "http://www.opengis.net/gml", "gml", "Point");
        var text  = OpenLayers.Util.getXmlNodeValue(OpenLayers.Ajax.getElementsByTagNameNS(point[0], "http://www.opengis.net/gml","gml", "coordinates")[0]);
        var floats = text.split(",");
        return {lonlat: new OpenLayers.LonLat(parseFloat(floats[0]),
                                              parseFloat(floats[1])),
                id: null};

    },

    CLASS_NAME: "OpenLayers.Feature.WFS"
});


/**
 * Class: OpenLayers.Layer.WFS
 * *Deprecated*.  To be removed in 3.0.  Instead use OpenLayers.Layer.Vector
 *     with a Protocol.WFS and one or more Strategies.
 *
 * Inherits from:
 *  - <OpenLayers.Layer.Vector>
 *  - <OpenLayers.Layer.Markers>
 */
OpenLayers.Layer.WFS = OpenLayers.Class(
  OpenLayers.Layer.Vector, OpenLayers.Layer.Markers, {

    /**
     * APIProperty: isBaseLayer
     * {Boolean} WFS layer is not a base layer by default.
     */
    isBaseLayer: false,

    /**
     * Property: tile
     * {<OpenLayers.Tile.WFS>}
     */
    tile: null,

    /**
     * APIProperty: ratio
     * {Float} The ratio property determines the size of the serverside query
     *    relative to the map viewport size. By default, we load an area twice
     *    as big as the map, to allow for panning without immediately reload.
     *    Setting this to 1 will cause the area of the WFS request to match
     *    the map area exactly. It is recommended to set this to some number
     *    at least slightly larger than 1, otherwise accidental clicks can
     *    cause a data reload, by moving the map only 1 pixel.
     */
    ratio: 2,

    /**
     * Property: DEFAULT_PARAMS
     * {Object} Hashtable of default key/value parameters
     */
    DEFAULT_PARAMS: { service: "WFS",
                      version: "1.0.0",
                      request: "GetFeature"
                    },

    /**
     * APIProperty: featureClass
     * {<OpenLayers.Feature>} If featureClass is defined, an old-style markers
     *     based WFS layer is created instead of a new-style vector layer. If
     *     sent, this should be a subclass of OpenLayers.Feature
     */
    featureClass: null,

    /**
      * APIProperty: format
      * {<OpenLayers.Format>} The format you want the data to be parsed with.
      * Must be passed in the constructor. Should be a class, not an instance.
      * This option can only be used if no featureClass is passed / vectorMode
      * is false: if a featureClass is passed, then this parameter is ignored.
      */
    format: null,

    /**
     * Property: formatObject
     * {<OpenLayers.Format>} Internally created/managed format object, used by
     * the Tile to parse data.
     */
    formatObject: null,

    /**
     * APIProperty: formatOptions
     * {Object} Hash of options which should be passed to the format when it is
     * created. Must be passed in the constructor.
     */
    formatOptions: null,

    /**
     * Property: vectorMode
     * {Boolean} Should be calculated automatically. Determines whether the
     *     layer is in vector mode or marker mode.
     */
    vectorMode: true,

    /**
     * APIProperty: encodeBBOX
     * {Boolean} Should the BBOX commas be encoded? The WMS spec says 'no',
     *     but some services want it that way. Default false.
     */
    encodeBBOX: false,

    /**
     * APIProperty: extractAttributes
     * {Boolean} Should the WFS layer parse attributes from the retrieved
     *     GML? Defaults to false. If enabled, parsing is slower, but
     *     attributes are available in the attributes property of
     *     layer features.
     */
    extractAttributes: false,

    /**
     * Constructor: OpenLayers.Layer.WFS
     *
     * Parameters:
     * name - {String}
     * url - {String}
     * params - {Object}
     * options - {Object} Hashtable of extra options to tag onto the layer
     */
    initialize: function(name, url, params, options) {
        if (options == undefined) { options = {}; }

        if (options.featureClass ||
            !OpenLayers.Layer.Vector ||
            !OpenLayers.Feature.Vector) {
            this.vectorMode = false;
        }

        // Uppercase params
        params = OpenLayers.Util.upperCaseObject(params);

        // Turn off error reporting, browsers like Safari may work
        // depending on the setup, and we don't want an unneccesary alert.
        OpenLayers.Util.extend(options, {'reportError': false});
        var newArguments = [];
        newArguments.push(name, options);
        OpenLayers.Layer.Vector.prototype.initialize.apply(this, newArguments);
        if (!this.renderer || !this.vectorMode) {
            this.vectorMode = false;
            if (!options.featureClass) {
                options.featureClass = OpenLayers.Feature.WFS;
            }
            OpenLayers.Layer.Markers.prototype.initialize.apply(this,
                                                                newArguments);
        }

        if (this.params && this.params.typename && !this.options.typename) {
            this.options.typename = this.params.typename;
        }

        if (!this.options.geometry_column) {
            this.options.geometry_column = "the_geom";
        }

        this.params = OpenLayers.Util.applyDefaults(
            params,
            OpenLayers.Util.upperCaseObject(this.DEFAULT_PARAMS)
        );
        this.url = url;
    },


    /**
     * APIMethod: destroy
     */
    destroy: function() {
        if (this.vectorMode) {
            OpenLayers.Layer.Vector.prototype.destroy.apply(this, arguments);
        } else {
            OpenLayers.Layer.Markers.prototype.destroy.apply(this, arguments);
        }
        if (this.tile) {
            this.tile.destroy();
        }
        this.tile = null;

        this.ratio = null;
        this.featureClass = null;
        this.format = null;

        if (this.formatObject && this.formatObject.destroy) {
            this.formatObject.destroy();
        }
        this.formatObject = null;

        this.formatOptions = null;
        this.vectorMode = null;
        this.encodeBBOX = null;
        this.extractAttributes = null;
    },

    /**
     * Method: setMap
     *
     * Parameters:
     * map - {<OpenLayers.Map>}
     */
    setMap: function(map) {
        if (this.vectorMode) {
            OpenLayers.Layer.Vector.prototype.setMap.apply(this, arguments);

            var options = {
              'extractAttributes': this.extractAttributes
            };

            OpenLayers.Util.extend(options, this.formatOptions);
            if (this.map && !this.projection.equals(this.map.getProjectionObject())) {
                options.externalProjection = this.projection;
                options.internalProjection = this.map.getProjectionObject();
            }

            this.formatObject = this.format ? new this.format(options) : new OpenLayers.Format.GML(options);
        } else {
            OpenLayers.Layer.Markers.prototype.setMap.apply(this, arguments);
        }
    },

    /**
     * Method: moveTo
     *
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     * zoomChanged - {Boolean}
     * dragging - {Boolean}
     */
    moveTo:function(bounds, zoomChanged, dragging) {
        if (this.vectorMode) {
            OpenLayers.Layer.Vector.prototype.moveTo.apply(this, arguments);
        } else {
            OpenLayers.Layer.Markers.prototype.moveTo.apply(this, arguments);
        }

        // don't load wfs features while dragging, wait for drag end
        if (dragging) {
            // TBD try to hide the vector layer while dragging
            // this.setVisibility(false);
            // this will probably help for panning performances
            return false;
        }

        if ( zoomChanged ) {
            if (this.vectorMode) {
                this.renderer.clear();
            }
        }

    //DEPRECATED - REMOVE IN 3.0
        // don't load data if current zoom level doesn't match
        if (this.options.minZoomLevel) {
            OpenLayers.Console.warn(OpenLayers.i18n('minZoomLevelError'));

            if (this.map.getZoom() < this.options.minZoomLevel) {
                return null;
            }
        }

        if (bounds == null) {
            bounds = this.map.getExtent();
        }

        var firstRendering = (this.tile == null);

        //does the new bounds to which we need to move fall outside of the
        // current tile's bounds?
        var outOfBounds = (!firstRendering &&
                           !this.tile.bounds.containsBounds(bounds));

        if (zoomChanged || firstRendering || (!dragging && outOfBounds)) {
            //determine new tile bounds
            var center = bounds.getCenterLonLat();
            var tileWidth = bounds.getWidth() * this.ratio;
            var tileHeight = bounds.getHeight() * this.ratio;
            var tileBounds =
                new OpenLayers.Bounds(center.lon - (tileWidth / 2),
                                      center.lat - (tileHeight / 2),
                                      center.lon + (tileWidth / 2),
                                      center.lat + (tileHeight / 2));

            //determine new tile size
            var tileSize = this.map.getSize();
            tileSize.w = tileSize.w * this.ratio;
            tileSize.h = tileSize.h * this.ratio;

            //determine new position (upper left corner of new bounds)
            var ul = new OpenLayers.LonLat(tileBounds.left, tileBounds.top);
            var pos = this.map.getLayerPxFromLonLat(ul);

            //formulate request url string
            var url = this.getFullRequestString();

            var params = null;

            // Cant combine "filter" and "BBOX". This is a cheap hack to help
            // people out who can't migrate to the WFS protocol immediately.
            var filter = this.params.filter || this.params.FILTER;
            if (filter) {
                params = {FILTER: filter};
            }
            else {
                params = {BBOX: this.encodeBBOX ? tileBounds.toBBOX()
                                                    : tileBounds.toArray()};
            }

            if (this.map && !this.projection.equals(this.map.getProjectionObject())) {
                var projectedBounds = tileBounds.clone();
                projectedBounds.transform(this.map.getProjectionObject(),
                                          this.projection);
                if (!filter){
                    params.BBOX = this.encodeBBOX ? projectedBounds.toBBOX()
                                                : projectedBounds.toArray();
                }
            }

            url += "&" + OpenLayers.Util.getParameterString(params);

            if (!this.tile) {
                this.tile = new OpenLayers.Tile.WFS(this, pos, tileBounds,
                                                     url, tileSize);
                this.addTileMonitoringHooks(this.tile);
                this.tile.draw();
            } else {
                if (this.vectorMode) {
                    this.destroyFeatures();
                    this.renderer.clear();
                } else {
                    this.clearMarkers();
                }
                this.removeTileMonitoringHooks(this.tile);
                this.tile.destroy();

                this.tile = null;
                this.tile = new OpenLayers.Tile.WFS(this, pos, tileBounds,
                                                     url, tileSize);
                this.addTileMonitoringHooks(this.tile);
                this.tile.draw();
            }
        }
    },

    /**
     * Method: addTileMonitoringHooks
     * This function takes a tile as input and adds the appropriate hooks to
     *     the tile so that the layer can keep track of the loading tile
     *     (making sure to check that the tile is always the layer's current
     *     tile before taking any action).
     *
     * Parameters:
     * tile - {<OpenLayers.Tile>}
     */
    addTileMonitoringHooks: function(tile) {
        tile.onLoadStart = function() {
            //if this is the the layer's current tile, then trigger
            // a 'loadstart'
            if (this == this.layer.tile) {
                this.layer.events.triggerEvent("loadstart");
            }
        };
        tile.events.register("loadstart", tile, tile.onLoadStart);

        tile.onLoadEnd = function() {
            //if this is the the layer's current tile, then trigger
            // a 'tileloaded' and 'loadend'
            if (this == this.layer.tile) {
                this.layer.events.triggerEvent("tileloaded");
                this.layer.events.triggerEvent("loadend");
            }
        };
        tile.events.register("loadend", tile, tile.onLoadEnd);
        tile.events.register("unload", tile, tile.onLoadEnd);
    },

    /**
     * Method: removeTileMonitoringHooks
     * This function takes a tile as input and removes the tile hooks
     *     that were added in addTileMonitoringHooks()
     *
     * Parameters:
     * tile - {<OpenLayers.Tile>}
     */
    removeTileMonitoringHooks: function(tile) {
        tile.unload();
        tile.events.un({
            "loadstart": tile.onLoadStart,
            "loadend": tile.onLoadEnd,
            "unload": tile.onLoadEnd,
            scope: tile
        });
    },

    /**
     * Method: onMapResize
     * Call the onMapResize method of the appropriate parent class.
     */
    onMapResize: function() {
        if(this.vectorMode) {
            OpenLayers.Layer.Vector.prototype.onMapResize.apply(this,
                                                                arguments);
        } else {
            OpenLayers.Layer.Markers.prototype.onMapResize.apply(this,
                                                                 arguments);
        }
    },

    /**
     * Method: display
     * Call the display method of the appropriate parent class.
     */
    display: function() {
        if(this.vectorMode) {
            OpenLayers.Layer.Vector.prototype.display.apply(this,
                                                                arguments);
        } else {
            OpenLayers.Layer.Markers.prototype.display.apply(this,
                                                                 arguments);
        }
    },

    /**
     * APIMethod: mergeNewParams
     * Modify parameters for the layer and redraw.
     *
     * Parameters:
     * newParams - {Object}
     */
    mergeNewParams:function(newParams) {
        var upperParams = OpenLayers.Util.upperCaseObject(newParams);
        var newArguments = [upperParams];
        return OpenLayers.Layer.HTTPRequest.prototype.mergeNewParams.apply(this,
                                                                 newArguments);
    },

    /**
     * APIMethod: clone
     *
     * Parameters:
     * obj - {Object}
     *
     * Returns:
     * {<OpenLayers.Layer.WFS>} An exact clone of this OpenLayers.Layer.WFS
     */
    clone: function (obj) {

        if (obj == null) {
            obj = new OpenLayers.Layer.WFS(this.name,
                                           this.url,
                                           this.params,
                                           this.getOptions());
        }

        //get all additions from superclasses
        if (this.vectorMode) {
            obj = OpenLayers.Layer.Vector.prototype.clone.apply(this, [obj]);
        } else {
            obj = OpenLayers.Layer.Markers.prototype.clone.apply(this, [obj]);
        }

        // copy/set any non-init, non-simple values here

        return obj;
    },

    /**
     * APIMethod: getFullRequestString
     * combine the layer's url with its params and these newParams.
     *
     *    Add the SRS parameter from 'projection' -- this is probably
     *     more eloquently done via a setProjection() method, but this
     *     works for now and always.
     *
     * Parameters:
     * newParams - {Object}
     * altUrl - {String} Use this as the url instead of the layer's url
     */
    getFullRequestString:function(newParams, altUrl) {
        var projectionCode = this.projection.getCode() || this.map.getProjection();
        this.params.SRS = (projectionCode == "none") ? null : projectionCode;

        return OpenLayers.Layer.Grid.prototype.getFullRequestString.apply(
                                                    this, arguments);
    },

    /**
     * APIMethod: commit
     * Write out the data to a WFS server.
     */
    commit: function() {
        if (!this.writer) {
            var options = {};
            if (this.map && !this.projection.equals(this.map.getProjectionObject())) {
                options.externalProjection = this.projection;
                options.internalProjection = this.map.getProjectionObject();
            }

            this.writer = new OpenLayers.Format.WFS(options,this);
        }

        var data = this.writer.write(this.features);

        OpenLayers.Request.POST({
            url: this.url,
            data: data,
            success: this.commitSuccess,
            failure: this.commitFailure,
            scope: this
        });
    },

    /**
     * Method: commitSuccess
     * Called when the Ajax request returns a response
     *
     * Parameters:
     * response - {XmlNode} from server
     */
    commitSuccess: function(request) {
        var response = request.responseText;
        if (response.indexOf('SUCCESS') != -1) {
            this.commitReport(OpenLayers.i18n("commitSuccess", {'response':response}));

            for(var i = 0; i < this.features.length; i++) {
                this.features[i].state = null;
            }
            // TBD redraw the layer or reset the state of features
            // foreach features: set state to null
        } else if (response.indexOf('FAILED') != -1 ||
            response.indexOf('Exception') != -1) {
            this.commitReport(OpenLayers.i18n("commitFailed", {'response':response}));
        }
    },

    /**
     * Method: commitFailure
     * Called when the Ajax request fails
     *
     * Parameters:
     * response - {XmlNode} from server
     */
    commitFailure: function(request) {},

    /**
     * APIMethod: commitReport
     * Called with a 'success' message if the commit succeeded, otherwise
     *     a failure message, and the full request text as a second parameter.
     *     Override this function to provide custom transaction reporting.
     *
     * string - {String} reporting string
     * response - {String} full XML response
     */
    commitReport: function(string, response) {
        OpenLayers.Console.userError(string);
    },


    /**
     * APIMethod: refresh
     * Refreshes all the features of the layer
     */
    refresh: function() {
        if (this.tile) {
            if (this.vectorMode) {
                this.renderer.clear();
                this.features.length = 0;
            } else {
                this.clearMarkers();
                this.markers.length = 0;
            }
            this.tile.draw();
        }
    },

    /**
     * APIMethod: getDataExtent
     * Calculates the max extent which includes all of the layer data.
     *
     * Returns:
     * {<OpenLayers.Bounds>}
     */
    getDataExtent: function () {
        var extent;
        //get all additions from superclasses
        if (this.vectorMode) {
            extent = OpenLayers.Layer.Vector.prototype.getDataExtent.apply(this);
        } else {
            extent = OpenLayers.Layer.Markers.prototype.getDataExtent.apply(this);
        }

        return extent;
    },

    /**
     * APIMethod: setOpacity
     * Call the setOpacity method of the appropriate parent class to set the
     *     opacity.
     *
     * Parameter:
     * opacity - {Float}
     */
    setOpacity: function (opacity) {
        if (this.vectorMode) {
            OpenLayers.Layer.Vector.prototype.setOpacity.apply(this, [opacity]);
        } else {
            OpenLayers.Layer.Markers.prototype.setOpacity.apply(this, [opacity]);
        }
    },

    CLASS_NAME: "OpenLayers.Layer.WFS"
});

/**
 * Class: OpenLayers.Layer.MultiMap
 * Note that MultiMap does not fully support the sphericalMercator
 * option. See Ticket #953 for more details.
 * *Deprecated*.  Use OpenLayers.Layer.Bing instead. See #3063
 *
 * Inherits from:
 *  - <OpenLayers.Layer.EventPane>
 *  - <OpenLayers.Layer.FixedZoomLevels>
 */
OpenLayers.Layer.MultiMap = OpenLayers.Class(
  OpenLayers.Layer.EventPane, OpenLayers.Layer.FixedZoomLevels, {

    /**
     * Constant: MIN_ZOOM_LEVEL
     * {Integer} 1
     */
    MIN_ZOOM_LEVEL: 1,

    /**
     * Constant: MAX_ZOOM_LEVEL
     * {Integer} 17
     */
    MAX_ZOOM_LEVEL: 17,

    /**
     * Constant: RESOLUTIONS
     * {Array(Float)} Hardcode these resolutions so that they are more closely
     *                tied with the standard wms projection
     */
    RESOLUTIONS: [
        9,
        1.40625,
        0.703125,
        0.3515625,
        0.17578125,
        0.087890625,
        0.0439453125,
        0.02197265625,
        0.010986328125,
        0.0054931640625,
        0.00274658203125,
        0.001373291015625,
        0.0006866455078125,
        0.00034332275390625,
        0.000171661376953125,
        0.0000858306884765625,
        0.00004291534423828125
    ],

    /**
     * APIProperty: type
     * {?}
     */
    type: null,

    /**
     * Constructor: OpenLayers.Layer.MultiMap
     *
     * Parameters:
     * name - {String}
     * options - {Object}
     */
    initialize: function(name, options) {
        OpenLayers.Layer.EventPane.prototype.initialize.apply(this, arguments);
        OpenLayers.Layer.FixedZoomLevels.prototype.initialize.apply(this,
                                                                    arguments);
        if (this.sphericalMercator) {
            OpenLayers.Util.extend(this, OpenLayers.Layer.SphericalMercator);
            this.initMercatorParameters();
            this.RESOLUTIONS.unshift(10);
        }
    },

    /**
     * Method: loadMapObject
     */
    loadMapObject:function() {
        try { //crash proofing
            this.mapObject = new MultimapViewer(this.div);
        } catch (e) { }
    },

    /**
     * APIMethod: getWarningHTML
     *
     * Returns:
     * {String} String with information on why layer is broken, how to get
     *          it working.
     */
    getWarningHTML:function() {
        return OpenLayers.i18n(
            "getLayerWarning", {'layerType':"MM", 'layerLib':"MultiMap"}
        );
    },



    /************************************
     *                                  *
     *   MapObject Interface Controls   *
     *                                  *
     ************************************/


  // Get&Set Center, Zoom

    /**
     * APIMethod: setMapObjectCenter
     * Set the mapObject to the specified center and zoom
     *
     * Parameters:
     * center - {Object} MapObject LonLat format
     * zoom - {int} MapObject zoom format
     */
    setMapObjectCenter: function(center, zoom) {
        this.mapObject.goToPosition(center, zoom);
    },

    /**
     * APIMethod: getMapObjectCenter
     *
     * Returns:
     * {Object} The mapObject's current center in Map Object format
     */
    getMapObjectCenter: function() {
        return this.mapObject.getCurrentPosition();
    },

    /**
     * APIMethod: getMapObjectZoom
     *
     * Returns:
     * {Integer} The mapObject's current zoom, in Map Object format
     */
    getMapObjectZoom: function() {
        return this.mapObject.getZoomFactor();
    },


  // LonLat - Pixel Translation

    /**
     * APIMethod: getMapObjectLonLatFromMapObjectPixel
     *
     * Parameters:
     * moPixel - {Object} MapObject Pixel format
     *
     * Returns:
     * {Object} MapObject LonLat translated from MapObject Pixel
     */
    getMapObjectLonLatFromMapObjectPixel: function(moPixel) {
        moPixel.x = moPixel.x - (this.map.getSize().w/2);
        moPixel.y = moPixel.y - (this.map.getSize().h/2);
        return this.mapObject.getMapPositionAt(moPixel);
    },

    /**
     * APIMethod: getMapObjectPixelFromMapObjectLonLat
     *
     * Parameters:
     * moLonLat - {Object} MapObject LonLat format
     *
     * Returns:
     * {Object} MapObject Pixel transtlated from MapObject LonLat
     */
    getMapObjectPixelFromMapObjectLonLat: function(moLonLat) {
        return this.mapObject.geoPosToContainerPixels(moLonLat);
    },


    /************************************
     *                                  *
     *       MapObject Primitives       *
     *                                  *
     ************************************/


  // LonLat

    /**
     * APIMethod: getLongitudeFromMapObjectLonLat
     *
     * Parameters:
     * moLonLat - {Object} MapObject LonLat format
     *
     * Returns:
     * {Float} Longitude of the given MapObject LonLat
     */
    getLongitudeFromMapObjectLonLat: function(moLonLat) {
        return this.sphericalMercator ?
            this.forwardMercator(moLonLat.lon, moLonLat.lat).lon :
            moLonLat.lon;
    },

    /**
     * APIMethod: getLatitudeFromMapObjectLonLat
     *
     * Parameters:
     * moLonLat - {Object} MapObject LonLat format
     *
     * Returns:
     * {Float} Latitude of the given MapObject LonLat
     */
    getLatitudeFromMapObjectLonLat: function(moLonLat) {
        return this.sphericalMercator ?
            this.forwardMercator(moLonLat.lon, moLonLat.lat).lat :
            moLonLat.lat;
    },

    /**
     * APIMethod: getMapObjectLonLatFromLonLat
     *
     * Parameters:
     * lon - {Float}
     * lat - {Float}
     *
     * Returns:
     * {Object} MapObject LonLat built from lon and lat params
     */
    getMapObjectLonLatFromLonLat: function(lon, lat) {
        var mmLatLon;
        if(this.sphericalMercator) {
            var lonlat = this.inverseMercator(lon, lat);
            mmLatLon = new MMLatLon(lonlat.lat, lonlat.lon);
        } else {
            mmLatLon = new MMLatLon(lat, lon);
        }
        return mmLatLon;
    },

  // Pixel

    /**
     * APIMethod: getXFromMapObjectPixel
     *
     * Parameters:
     * moPixel - {Object} MapObject Pixel format
     *
     * Returns:
     * {Integer} X value of the MapObject Pixel
     */
    getXFromMapObjectPixel: function(moPixel) {
        return moPixel.x;
    },

    /**
     * APIMethod: getYFromMapObjectPixel
     *
     * Parameters:
     * moPixel - {Object} MapObject Pixel format
     *
     * Returns:
     * {Integer} Y value of the MapObject Pixel
     */
    getYFromMapObjectPixel: function(moPixel) {
        return moPixel.y;
    },

    /**
     * APIMethod: getMapObjectPixelFromXY
     *
     * Parameters:
     * x - {Integer}
     * y - {Integer}
     *
     * Returns:
     * {Object} MapObject Pixel from x and y parameters
     */
    getMapObjectPixelFromXY: function(x, y) {
        return new MMPoint(x, y);
    },

    CLASS_NAME: "OpenLayers.Layer.MultiMap"
});

/**
 * Class: OpenLayers.Layer.VirtualEarth
 * *Deprecated*. Use <OpenLayers.Layer.Bing> instead.
 *
 * Instances of OpenLayers.Layer.VirtualEarth are used to display the data from
 *     the Bing Maps AJAX Control (see e.g.
 *     http://msdn.microsoft.com/library/bb429619.aspx). Create a VirtualEarth
 *     layer with the <OpenLayers.Layer.VirtualEarth> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Layer.EventPane>
 *  - <OpenLayers.Layer.FixedZoomLevels>
 */
OpenLayers.Layer.VirtualEarth = OpenLayers.Class(
    OpenLayers.Layer.EventPane,
    OpenLayers.Layer.FixedZoomLevels, {

    /**
     * Constant: MIN_ZOOM_LEVEL
     * {Integer} 1
     */
    MIN_ZOOM_LEVEL: 1,

    /**
     * Constant: MAX_ZOOM_LEVEL
     * {Integer} 19
     */
    MAX_ZOOM_LEVEL: 19,

    /**
     * Constant: RESOLUTIONS
     * {Array(Float)} Hardcode these resolutions so that they are more closely
     *                tied with the standard wms projection
     */
    RESOLUTIONS: [
        1.40625,
        0.703125,
        0.3515625,
        0.17578125,
        0.087890625,
        0.0439453125,
        0.02197265625,
        0.010986328125,
        0.0054931640625,
        0.00274658203125,
        0.001373291015625,
        0.0006866455078125,
        0.00034332275390625,
        0.000171661376953125,
        0.0000858306884765625,
        0.00004291534423828125,
        0.00002145767211914062,
        0.00001072883605957031,
        0.00000536441802978515
    ],

    /**
     * APIProperty: type
     * {VEMapType}
     */
    type: null,

    /**
     * APIProperty: wrapDateLine
     * {Boolean} Allow user to pan forever east/west.  Default is true.
     *     Setting this to false only restricts panning if
     *     <sphericalMercator> is true.
     */
    wrapDateLine: true,

    /**
     * APIProperty: sphericalMercator
     * {Boolean} Should the map act as a mercator-projected map? This will
     *     cause all interactions with the map to be in the actual map
     *     projection, which allows support for vector drawing, overlaying
     *     other maps, etc.
     */
    sphericalMercator: false,

    /**
     * APIProperty: animationEnabled
     * {Boolean} If set to true, the transition between zoom levels will be
     *     animated. Set to false to match the zooming experience of other
     *     layer types. Default is true.
     */
    animationEnabled: true,

    /**
     * Constructor: OpenLayers.Layer.VirtualEarth
     * Creates a new instance of a OpenLayers.Layer.VirtualEarth. If you use an
     *     instance of OpenLayers.Layer.VirtualEarth in you map, you should set
     *     the <OpenLayers.Map> option restrictedExtent to a meaningful value,
     *     e.g.:
     * (code)
     * var map = new OpenLayers.Map( 'map', {
     *     // other map options
     *     restrictedExtent : OpenLayers.Bounds(-20037508, -20037508, 20037508, 20037508)
     * } );
     *
     * var veLayer = new OpenLayers.Layer.VirtualEarth (
     *     "Virtual Earth Layer"
     * );
     *
     * map.addLayer( veLayer );
     * (end)
     *
     * Parameters:
     * name - {String}
     * options - {Object}
     */
    initialize: function(name, options) {
        OpenLayers.Layer.EventPane.prototype.initialize.apply(this, arguments);
        OpenLayers.Layer.FixedZoomLevels.prototype.initialize.apply(this,
                                                                    arguments);
        if(this.sphericalMercator) {
            OpenLayers.Util.extend(this, OpenLayers.Layer.SphericalMercator);
            this.initMercatorParameters();
        }
    },

    /**
     * Method: loadMapObject
     */
    loadMapObject:function() {

        // create div and set to same size as map
        var veDiv = OpenLayers.Util.createDiv(this.name);
        var sz = this.map.getSize();
        veDiv.style.width = sz.w + "px";
        veDiv.style.height = sz.h + "px";
        this.div.appendChild(veDiv);

        try { // crash prevention
            this.mapObject = new VEMap(this.name);
        } catch (e) { }

        if (this.mapObject != null) {
            try { // this is to catch a Mozilla bug without falling apart

                // The fourth argument is whether the map is 'fixed' -- not
                // draggable. See:
                // http://blogs.msdn.com/virtualearth/archive/2007/09/28/locking-a-virtual-earth-map.aspx
                //
                this.mapObject.LoadMap(null, null, this.type, true);
                this.mapObject.AttachEvent("onmousedown", OpenLayers.Function.True);

            } catch (e) { }
            this.mapObject.HideDashboard();
            if(typeof this.mapObject.SetAnimationEnabled == "function") {
                this.mapObject.SetAnimationEnabled(this.animationEnabled);
            }
        }

        //can we do smooth panning? this is an unpublished method, so we need
        // to be careful
        if ( !this.mapObject ||
             !this.mapObject.vemapcontrol ||
             !this.mapObject.vemapcontrol.PanMap ||
             (typeof this.mapObject.vemapcontrol.PanMap != "function")) {

            this.dragPanMapObject = null;
        }

    },

    /**
     * Method: onMapResize
     */
    onMapResize: function() {
        this.mapObject.Resize(this.map.size.w, this.map.size.h);
    },

    /**
     * APIMethod: getWarningHTML
     *
     * Returns:
     * {String} String with information on why layer is broken, how to get
     *          it working.
     */
    getWarningHTML:function() {
        return OpenLayers.i18n(
            "getLayerWarning", {'layerType':'VE', 'layerLib':'VirtualEarth'}
        );
    },



    /************************************
     *                                  *
     *   MapObject Interface Controls   *
     *                                  *
     ************************************/


  // Get&Set Center, Zoom

    /**
     * APIMethod: setMapObjectCenter
     * Set the mapObject to the specified center and zoom
     *
     * Parameters:
     * center - {Object} MapObject LonLat format
     * zoom - {int} MapObject zoom format
     */
    setMapObjectCenter: function(center, zoom) {
        this.mapObject.SetCenterAndZoom(center, zoom);
    },

    /**
     * APIMethod: getMapObjectCenter
     *
     * Returns:
     * {Object} The mapObject's current center in Map Object format
     */
    getMapObjectCenter: function() {
        return this.mapObject.GetCenter();
    },

    /**
     * APIMethod: dragPanMapObject
     *
     * Parameters:
     * dX - {Integer}
     * dY - {Integer}
     */
    dragPanMapObject: function(dX, dY) {
        this.mapObject.vemapcontrol.PanMap(dX, -dY);
    },

    /**
     * APIMethod: getMapObjectZoom
     *
     * Returns:
     * {Integer} The mapObject's current zoom, in Map Object format
     */
    getMapObjectZoom: function() {
        return this.mapObject.GetZoomLevel();
    },


  // LonLat - Pixel Translation

    /**
     * APIMethod: getMapObjectLonLatFromMapObjectPixel
     *
     * Parameters:
     * moPixel - {Object} MapObject Pixel format
     *
     * Returns:
     * {Object} MapObject LonLat translated from MapObject Pixel
     */
    getMapObjectLonLatFromMapObjectPixel: function(moPixel) {
        //the conditional here is to test if we are running the v6 of VE
        return (typeof VEPixel != 'undefined')
            ? this.mapObject.PixelToLatLong(moPixel)
            : this.mapObject.PixelToLatLong(moPixel.x, moPixel.y);
    },

    /**
     * APIMethod: getMapObjectPixelFromMapObjectLonLat
     *
     * Parameters:
     * moLonLat - {Object} MapObject LonLat format
     *
     * Returns:
     * {Object} MapObject Pixel transtlated from MapObject LonLat
     */
    getMapObjectPixelFromMapObjectLonLat: function(moLonLat) {
        return this.mapObject.LatLongToPixel(moLonLat);
    },


    /************************************
     *                                  *
     *       MapObject Primitives       *
     *                                  *
     ************************************/


  // LonLat

    /**
     * APIMethod: getLongitudeFromMapObjectLonLat
     *
     * Parameters:
     * moLonLat - {Object} MapObject LonLat format
     *
     * Returns:
     * {Float} Longitude of the given MapObject LonLat
     */
    getLongitudeFromMapObjectLonLat: function(moLonLat) {
        return this.sphericalMercator ?
            this.forwardMercator(moLonLat.Longitude, moLonLat.Latitude).lon :
            moLonLat.Longitude;
    },

    /**
     * APIMethod: getLatitudeFromMapObjectLonLat
     *
     * Parameters:
     * moLonLat - {Object} MapObject LonLat format
     *
     * Returns:
     * {Float} Latitude of the given MapObject LonLat
     */
    getLatitudeFromMapObjectLonLat: function(moLonLat) {
        return this.sphericalMercator ?
            this.forwardMercator(moLonLat.Longitude, moLonLat.Latitude).lat :
            moLonLat.Latitude;
    },

    /**
     * APIMethod: getMapObjectLonLatFromLonLat
     *
     * Parameters:
     * lon - {Float}
     * lat - {Float}
     *
     * Returns:
     * {Object} MapObject LonLat built from lon and lat params
     */
    getMapObjectLonLatFromLonLat: function(lon, lat) {
        var veLatLong;
        if(this.sphericalMercator) {
            var lonlat = this.inverseMercator(lon, lat);
            veLatLong = new VELatLong(lonlat.lat, lonlat.lon);
        } else {
            veLatLong = new VELatLong(lat, lon);
        }
        return veLatLong;
    },

  // Pixel

    /**
     * APIMethod: getXFromMapObjectPixel
     *
     * Parameters:
     * moPixel - {Object} MapObject Pixel format
     *
     * Returns:
     * {Integer} X value of the MapObject Pixel
     */
    getXFromMapObjectPixel: function(moPixel) {
        return moPixel.x;
    },

    /**
     * APIMethod: getYFromMapObjectPixel
     *
     * Parameters:
     * moPixel - {Object} MapObject Pixel format
     *
     * Returns:
     * {Integer} Y value of the MapObject Pixel
     */
    getYFromMapObjectPixel: function(moPixel) {
        return moPixel.y;
    },

    /**
     * APIMethod: getMapObjectPixelFromXY
     *
     * Parameters:
     * x - {Integer}
     * y - {Integer}
     *
     * Returns:
     * {Object} MapObject Pixel from x and y parameters
     */
    getMapObjectPixelFromXY: function(x, y) {
        //the conditional here is to test if we are running the v6 of VE
        return (typeof VEPixel != 'undefined') ? new VEPixel(x, y)
                         : new Msn.VE.Pixel(x, y);
    },

    CLASS_NAME: "OpenLayers.Layer.VirtualEarth"
});
