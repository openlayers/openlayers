/**
 * @requires OpenLayers/BaseTypes/Class.js
 * @requires OpenLayers/Util.js
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Format.js
 * @requires OpenLayers/Request.js
 * @requires OpenLayers/Layer/WMS.js
 * @requires OpenLayers/Layer/MapServer.js
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
