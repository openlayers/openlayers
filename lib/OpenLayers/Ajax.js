/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Request/XMLHttpRequest.js
 * @requires OpenLayers/Console.js
 */

OpenLayers.ProxyHost = "";
//OpenLayers.ProxyHost = "examples/proxy.cgi?url=";

/**
 * Ajax reader for OpenLayers
 *
 *  @uri url to do remote XML http get
 *  @param {String} 'get' format params (x=y&a=b...)
 *  @who object to handle callbacks for this request
 *  @complete  the function to be called on success 
 *  @failure  the function to be called on failure
 *  
 *   example usage from a caller:
 *  
 *     caps: function(request) {
 *      -blah-  
 *     },
 *  
 *     OpenLayers.loadURL(url,params,this,caps);
 *
 * Notice the above example does not provide an error handler; a default empty
 * handler is provided which merely logs the error if a failure handler is not 
 * supplied
 *
 */


/**
 * Function: OpenLayers.nullHandler
 * @param {} request
 */
OpenLayers.nullHandler = function(request) {
    OpenLayers.Console.userError(OpenLayers.i18n("unhandledRequest", {'statusText':request.statusText}));
};

/** 
 * APIFunction: loadURL
 * Background load a document.  For more flexibility in using XMLHttpRequest,
 *     see the <OpenLayers.Request> methods.
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
 * Function: parseXMLString
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
