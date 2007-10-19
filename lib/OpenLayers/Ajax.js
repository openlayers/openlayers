/* Copyright (c) 2006-2007 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


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
* @param {} request
*/
OpenLayers.nullHandler = function(request) {
    alert("Unhandled request return " + request.statusText);
};

/** 
 * Function: loadURL
 * Background load a document.
 *
 * Parameters:
 * uri - {String} URI of source doc
 * params - {String} Params on get (doesnt seem to work)
 * caller - {Object} object which gets callbacks
 * onComplete - {Function} callback for success
 * onFailure - {Function} callback for failure
 *
 * Both callbacks optional (though silly)
 */
OpenLayers.loadURL = function(uri, params, caller,
                                  onComplete, onFailure) {

    if (OpenLayers.ProxyHost && OpenLayers.String.startsWith(uri, "http")) {
        uri = OpenLayers.ProxyHost + escape(uri);
    }

    var success = (onComplete) ? OpenLayers.Function.bind(onComplete, caller)
                                : OpenLayers.nullHandler;

    var failure = (onFailure) ? OpenLayers.Function.bind(onFailure, caller)
                           : OpenLayers.nullHandler;

    // from prototype.js
    new OpenLayers.Ajax.Request(uri, 
                     {   method: 'get', 
                         parameters: params,
                         onComplete: success, 
                         onFailure: failure
                      }
                     );
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
            function() {return new ActiveXObject('Msxml2.XMLHTTP');},
            function() {return new ActiveXObject('Microsoft.XMLHTTP');},
            function() {return new XMLHttpRequest();}
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
     * Method: dispatch
     * 
     * Parameters:
     * callback - {?}
     * request - {?}
     * transport - {?}
     * json - {?}
     */
    dispatch: function(callback, request, transport, json) {
        var responder;
        for (var i = 0; i < this.responders.length; i++) {
            responder = this.responders[i];
     
            if (responder[callback] && 
                typeof responder[callback] == 'function') {
                try {
                    responder[callback].apply(responder, 
                                              [request, transport, json]);
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
 * Namespace: OpenLayers.Ajax.Base
 * {Object}
 */
OpenLayers.Ajax.Base = function() {};
OpenLayers.Ajax.Base.prototype = {

    /**
     * Function: setOptions
     * 
     * Parameters:
     * options - {Object}
     */
    setOptions: function(options) {
        this.options = {
            'method': 'post',
            'asynchronous': true,
            'parameters': ''
        };
        OpenLayers.Util.extend(this.options, options || {});
    },

    /**
     * Function: responseIsSuccess
     * 
     * Returns:
     * {Boolean}
     */
    responseIsSuccess: function() {
        return this.transport.status == undefined || 
               this.transport.status == 0 || 
               (this.transport.status >= 200 && this.transport.status < 300);
    },

    /**
     * Function: responseIsFailure
     * 
     * Returns:
     * {Boolean}
     */
    responseIsFailure: function() {
        return !this.responseIsSuccess();
    }
};


/**
 * Class: OpenLayers.Ajax.Request
 *
 * Inherit:
 *  - <OpenLayers.Ajax.Base>
 */
OpenLayers.Ajax.Request = OpenLayers.Class(OpenLayers.Ajax.Base, {
      
      /**
       * Constructor: OpenLayers.Ajax.Request
       * 
       * Parameters: 
       * url - {String}
       * options - {Object}
       */
    initialize: function(url, options) {
        this.transport = OpenLayers.Ajax.getTransport();
        this.setOptions(options);
        this.request(url);
    },

    /**
     * Method: request
     * 
     * Parameters:
     * url - {String}
     */
    request: function(url) {
        var parameters = this.options.parameters || '';
        if (parameters.length > 0) {
            parameters += '&_=';
        }
        try {
            this.url = url;
            if (this.options.method == 'get' && parameters.length > 0) {
               this.url += (this.url.match(/\?/) ? '&' : '?') + parameters;
            }
            
            OpenLayers.Ajax.Responders.dispatch('onCreate', 
                                                this, 
                                                this.transport);
    
            this.transport.open(this.options.method, 
                                this.url,
                                this.options.asynchronous);
    
            if (this.options.asynchronous) {
                setTimeout(OpenLayers.Function.bind(
                    (function() {this.respondToReadyState(1);}),this), 10
                );
            }
            
            this.transport.onreadystatechange = 
                OpenLayers.Function.bind(this.onStateChange, this);    
            this.setRequestHeaders();
    
            var body = this.options.postBody ? this.options.postBody 
                                             : parameters;
            this.transport.send(this.options.method == 'post' ? body : null);
    
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
     * Method: setRequestHeaders
     */
    setRequestHeaders: function() {
        var requestHeaders = [
            'X-Requested-With',
            'XMLHttpRequest',
            'X-Prototype-Version',
            'OpenLayers'
        ];
    
        if (this.options.method == 'post' && !this.options.postBody) {
            requestHeaders.push('Content-type',
                                'application/x-www-form-urlencoded');
    
            // Force "Connection: close" for Mozilla browsers to work around
            // a bug where XMLHttpReqeuest sends an incorrect Content-length
            // header. See Mozilla Bugzilla #246651.
            if (this.transport.overrideMimeType) {
                requestHeaders.push('Connection', 'close');
            }
        }
    
        if (this.options.requestHeaders) {
            requestHeaders.push.apply(requestHeaders, 
                                      this.options.requestHeaders);
        }
          
        for (var i = 0; i < requestHeaders.length; i += 2) {
            this.transport.setRequestHeader(requestHeaders[i], 
                                            requestHeaders[i+1]);
        }
    },

    /**
     * Method: onStateChange
     */
    onStateChange: function() {
        var readyState = this.transport.readyState;
        if (readyState != 1) {
          this.respondToReadyState(this.transport.readyState);
        }
    },

    /** 
     * Method: header
     * 
     * Returns:
     * {?}
     */
    header: function(name) {
        try {
            return this.transport.getResponseHeader(name);
        } catch (e) {}
    },

    /** 
     * Method: evalJSON
     * 
     * Returns:
     * {?}
     */
    evalJSON: function() {
        try {
            return eval(this.header('X-JSON'));
        } catch (e) {}
    },

    /**
     * Method: evalResponse
     * 
     * Returns: 
     * {?}
     */
    evalResponse: function() {
        try {
            return eval(this.transport.responseText);
        } catch (e) {
            this.dispatchException(e);
        }
    },

    /**
     * Method: respondToReadyState
     *
     * Parameters:
     * readyState - {?}
     */
    respondToReadyState: function(readyState) {
        var event = OpenLayers.Ajax.Request.Events[readyState];
        var transport = this.transport, json = this.evalJSON();
    
        if (event == 'Complete') {
            try {
                var responseSuccess = this.responseIsSuccess() ? 'Success'
                                                                : 'Failure';
                                                                 
                (this.options['on' + this.transport.status] ||
                 this.options['on' + responseSuccess] ||
                 OpenLayers.Ajax.emptyFunction)(transport, json);
            } catch (e) {
                this.dispatchException(e);
            }
    
            var contentType = this.header('Content-type') || '';
            if (contentType.match(/^text\/javascript/i)) {
                this.evalResponse();
            }
        }
    
        try {
            (this.options['on' + event] || 
             OpenLayers.Ajax.emptyFunction)(transport, json);
             OpenLayers.Ajax.Responders.dispatch('on' + event, 
                                                 this, 
                                                 transport, 
                                                 json);
        } catch (e) {
            this.dispatchException(e);
        }
    
        // Avoid memory leak in MSIE: clean up the oncomplete event handler
        if (event == 'Complete') {
            this.transport.onreadystatechange = OpenLayers.Ajax.emptyFunction;
        }
    },

    /**
     * Method: dispatchException
     * 
     * Parameters:
     * exception - {?}
     */
    dispatchException: function(exception) {
        if (this.options.onException) {
            this.options.onException(this, exception);
        } else {
            // if we get here, Responders.dispatch('onException') will never
            // be called. too bad. we should probably take out the Responders
            // stuff anyway.
            throw exception;
        }
        OpenLayers.Ajax.Responders.dispatch('onException', this, exception);
    }
    
});

/** 
 * Property: Events
 * {Array(String)}
 */
OpenLayers.Ajax.Request.Events =
  ['Uninitialized', 'Loading', 'Loaded', 'Interactive', 'Complete'];

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
