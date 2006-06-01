/*  Prototype JavaScript framework, version 1.4.0
 *  (c) 2005 Sam Stephenson <sam@conio.net>
 *
 *  Prototype is freely distributable under the terms of an MIT-style license.
 *  For details, see the Prototype web site: http://prototype.conio.net/
 *
/*--------------------------------------------------------------------------*/

var Prototype = {
  Version: '1.4.0',
  ScriptFragment: '(?:<script.*?>)((\n|\r|.)*?)(?:<\/script>)',

  emptyFunction: function() {},
  K: function(x) {return x}
}

var Class = {
  create: function() {
    return function() {
      this.initialize.apply(this, arguments);
    }
  }
}

var Abstract = new Object();

Object.extend = function(destination, source) {
  for (property in source) {
    destination[property] = source[property];
  }
  return destination;
}

Object.inspect = function(object) {
  try {
    if (object == undefined) return 'undefined';
    if (object == null) return 'null';
    return object.inspect ? object.inspect() : object.toString();
  } catch (e) {
    if (e instanceof RangeError) return '...';
    throw e;
  }
}

Function.prototype.bind = function() {
  var __method = this, args = $A(arguments), object = args.shift();
  return function() {
    return __method.apply(object, args.concat($A(arguments)));
  }
}

Function.prototype.bindAsEventListener = function(object) {
  var __method = this;
  return function(event) {
    return __method.call(object, event || window.event);
  }
}

Object.extend(Number.prototype, {
  toColorPart: function() {
    var digits = this.toString(16);
    if (this < 16) return '0' + digits;
    return digits;
  },

  succ: function() {
    return this + 1;
  },

  times: function(iterator) {
    $R(0, this, true).each(iterator);
    return this;
  }
});

var Try = {
  these: function() {
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
}

/*--------------------------------------------------------------------------*/

var PeriodicalExecuter = Class.create();
PeriodicalExecuter.prototype = {
  initialize: function(callback, frequency) {
    this.callback = callback;
    this.frequency = frequency;
    this.currentlyExecuting = false;

    this.registerCallback();
  },

  registerCallback: function() {
    setInterval(this.onTimerEvent.bind(this), this.frequency * 1000);
  },

  onTimerEvent: function() {
    if (!this.currentlyExecuting) {
      try {
        this.currentlyExecuting = true;
        this.callback();
      } finally {
        this.currentlyExecuting = false;
      }
    }
  }
}

/*--------------------------------------------------------------------------*/

function $() {
  var elements = new Array();

  for (var i = 0; i < arguments.length; i++) {
    var element = arguments[i];
    if (typeof element == 'string')
      element = document.getElementById(element);

    if (arguments.length == 1)
      return element;

    elements.push(element);
  }

  return elements;
}
Object.extend(String.prototype, {
  stripTags: function() {
    return this.replace(/<\/?[^>]+>/gi, '');
  },

  stripScripts: function() {
    return this.replace(new RegExp(Prototype.ScriptFragment, 'img'), '');
  },

  extractScripts: function() {
    var matchAll = new RegExp(Prototype.ScriptFragment, 'img');
    var matchOne = new RegExp(Prototype.ScriptFragment, 'im');
    return (this.match(matchAll) || []).map(function(scriptTag) {
      return (scriptTag.match(matchOne) || ['', ''])[1];
    });
  },

  evalScripts: function() {
    return this.extractScripts().map(eval);
  },

  escapeHTML: function() {
    var div = document.createElement('div');
    var text = document.createTextNode(this);
    div.appendChild(text);
    return div.innerHTML;
  },

  unescapeHTML: function() {
    var div = document.createElement('div');
    div.innerHTML = this.stripTags();
    return div.childNodes[0] ? div.childNodes[0].nodeValue : '';
  },

  toQueryParams: function() {
    var pairs = this.match(/^\??(.*)$/)[1].split('&');
    return pairs.inject({}, function(params, pairString) {
      var pair = pairString.split('=');
      params[pair[0]] = pair[1];
      return params;
    });
  },

  toArray: function() {
    return this.split('');
  },

  camelize: function() {
    var oStringList = this.split('-');
    if (oStringList.length == 1) return oStringList[0];

    var camelizedString = this.indexOf('-') == 0
      ? oStringList[0].charAt(0).toUpperCase() + oStringList[0].substring(1)
      : oStringList[0];

    for (var i = 1, len = oStringList.length; i < len; i++) {
      var s = oStringList[i];
      camelizedString += s.charAt(0).toUpperCase() + s.substring(1);
    }

    return camelizedString;
  },

  inspect: function() {
    return "'" + this.replace('\\', '\\\\').replace("'", '\\\'') + "'";
  }
});

String.prototype.parseQuery = String.prototype.toQueryParams;

var $break    = new Object();
var $continue = new Object();

var Enumerable = {
  each: function(iterator) {
    var index = 0;
    try {
      this._each(function(value) {
        try {
          iterator(value, index++);
        } catch (e) {
          if (e != $continue) throw e;
        }
      });
    } catch (e) {
      if (e != $break) throw e;
    }
  },

  all: function(iterator) {
    var result = true;
    this.each(function(value, index) {
      result = result && !!(iterator || Prototype.K)(value, index);
      if (!result) throw $break;
    });
    return result;
  },

  any: function(iterator) {
    var result = true;
    this.each(function(value, index) {
      if (result = !!(iterator || Prototype.K)(value, index))
        throw $break;
    });
    return result;
  },

  collect: function(iterator) {
    var results = [];
    this.each(function(value, index) {
      results.push(iterator(value, index));
    });
    return results;
  },

  detect: function (iterator) {
    var result;
    this.each(function(value, index) {
      if (iterator(value, index)) {
        result = value;
        throw $break;
      }
    });
    return result;
  },

  findAll: function(iterator) {
    var results = [];
    this.each(function(value, index) {
      if (iterator(value, index))
        results.push(value);
    });
    return results;
  },

  grep: function(pattern, iterator) {
    var results = [];
    this.each(function(value, index) {
      var stringValue = value.toString();
      if (stringValue.match(pattern))
        results.push((iterator || Prototype.K)(value, index));
    })
    return results;
  },

  include: function(object) {
    var found = false;
    this.each(function(value) {
      if (value == object) {
        found = true;
        throw $break;
      }
    });
    return found;
  },

  inject: function(memo, iterator) {
    this.each(function(value, index) {
      memo = iterator(memo, value, index);
    });
    return memo;
  },

  invoke: function(method) {
    var args = $A(arguments).slice(1);
    return this.collect(function(value) {
      return value[method].apply(value, args);
    });
  },

  max: function(iterator) {
    var result;
    this.each(function(value, index) {
      value = (iterator || Prototype.K)(value, index);
      if (value >= (result || value))
        result = value;
    });
    return result;
  },

  min: function(iterator) {
    var result;
    this.each(function(value, index) {
      value = (iterator || Prototype.K)(value, index);
      if (value <= (result || value))
        result = value;
    });
    return result;
  },

  partition: function(iterator) {
    var trues = [], falses = [];
    this.each(function(value, index) {
      ((iterator || Prototype.K)(value, index) ?
        trues : falses).push(value);
    });
    return [trues, falses];
  },

  pluck: function(property) {
    var results = [];
    this.each(function(value, index) {
      results.push(value[property]);
    });
    return results;
  },

  reject: function(iterator) {
    var results = [];
    this.each(function(value, index) {
      if (!iterator(value, index))
        results.push(value);
    });
    return results;
  },

  sortBy: function(iterator) {
    return this.collect(function(value, index) {
      return {value: value, criteria: iterator(value, index)};
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }).pluck('value');
  },

  toArray: function() {
    return this.collect(Prototype.K);
  },

  zip: function() {
    var iterator = Prototype.K, args = $A(arguments);
    if (typeof args.last() == 'function')
      iterator = args.pop();

    var collections = [this].concat(args).map($A);
    return this.map(function(value, index) {
      iterator(value = collections.pluck(index));
      return value;
    });
  },

  inspect: function() {
    return '#<Enumerable:' + this.toArray().inspect() + '>';
  }
}

Object.extend(Enumerable, {
  map:     Enumerable.collect,
  find:    Enumerable.detect,
  select:  Enumerable.findAll,
  member:  Enumerable.include,
  entries: Enumerable.toArray
});
var $A = Array.from = function(iterable) {
  if (!iterable) return [];
  if (iterable.toArray) {
    return iterable.toArray();
  } else {
    var results = [];
    for (var i = 0; i < iterable.length; i++)
      results.push(iterable[i]);
    return results;
  }
}

Object.extend(Array.prototype, Enumerable);

Array.prototype._reverse = Array.prototype.reverse;

Object.extend(Array.prototype, {
  _each: function(iterator) {
    for (var i = 0; i < this.length; i++)
      iterator(this[i]);
  },

  clear: function() {
    this.length = 0;
    return this;
  },

  first: function() {
    return this[0];
  },

  last: function() {
    return this[this.length - 1];
  },

  compact: function() {
    return this.select(function(value) {
      return value != undefined || value != null;
    });
  },

  flatten: function() {
    return this.inject([], function(array, value) {
      return array.concat(value.constructor == Array ?
        value.flatten() : [value]);
    });
  },

  without: function() {
    var values = $A(arguments);
    return this.select(function(value) {
      return !values.include(value);
    });
  },

  indexOf: function(object) {
    for (var i = 0; i < this.length; i++)
      if (this[i] == object) return i;
    return -1;
  },

  reverse: function(inline) {
    return (inline !== false ? this : this.toArray())._reverse();
  },

  shift: function() {
    var result = this[0];
    for (var i = 0; i < this.length - 1; i++)
      this[i] = this[i + 1];
    this.length--;
    return result;
  },

  inspect: function() {
    return '[' + this.map(Object.inspect).join(', ') + ']';
  }
});
var Hash = {
  _each: function(iterator) {
    for (key in this) {
      var value = this[key];
      if (typeof value == 'function') continue;

      var pair = [key, value];
      pair.key = key;
      pair.value = value;
      iterator(pair);
    }
  },

  keys: function() {
    return this.pluck('key');
  },

  values: function() {
    return this.pluck('value');
  },

  merge: function(hash) {
    return $H(hash).inject($H(this), function(mergedHash, pair) {
      mergedHash[pair.key] = pair.value;
      return mergedHash;
    });
  },

  toQueryString: function() {
    return this.map(function(pair) {
      return pair.map(encodeURIComponent).join('=');
    }).join('&');
  },

  inspect: function() {
    return '#<Hash:{' + this.map(function(pair) {
      return pair.map(Object.inspect).join(': ');
    }).join(', ') + '}>';
  }
}

function $H(object) {
  var hash = Object.extend({}, object || {});
  Object.extend(hash, Enumerable);
  Object.extend(hash, Hash);
  return hash;
}
ObjectRange = Class.create();
Object.extend(ObjectRange.prototype, Enumerable);
Object.extend(ObjectRange.prototype, {
  initialize: function(start, end, exclusive) {
    this.start = start;
    this.end = end;
    this.exclusive = exclusive;
  },

  _each: function(iterator) {
    var value = this.start;
    do {
      iterator(value);
      value = value.succ();
    } while (this.include(value));
  },

  include: function(value) {
    if (value < this.start)
      return false;
    if (this.exclusive)
      return value < this.end;
    return value <= this.end;
  }
});

var $R = function(start, end, exclusive) {
  return new ObjectRange(start, end, exclusive);
}

var Ajax = {
  getTransport: function() {
    return Try.these(
      function() {return new ActiveXObject('Msxml2.XMLHTTP')},
      function() {return new ActiveXObject('Microsoft.XMLHTTP')},
      function() {return new XMLHttpRequest()}
    ) || false;
  },

  activeRequestCount: 0
}

Ajax.Responders = {
  responders: [],

  _each: function(iterator) {
    this.responders._each(iterator);
  },

  register: function(responderToAdd) {
    if (!this.include(responderToAdd))
      this.responders.push(responderToAdd);
  },

  unregister: function(responderToRemove) {
    this.responders = this.responders.without(responderToRemove);
  },

  dispatch: function(callback, request, transport, json) {
    this.each(function(responder) {
      if (responder[callback] && typeof responder[callback] == 'function') {
        try {
          responder[callback].apply(responder, [request, transport, json]);
        } catch (e) {}
      }
    });
  }
};

Object.extend(Ajax.Responders, Enumerable);

Ajax.Responders.register({
  onCreate: function() {
    Ajax.activeRequestCount++;
  },

  onComplete: function() {
    Ajax.activeRequestCount--;
  }
});

Ajax.Base = function() {};
Ajax.Base.prototype = {
  setOptions: function(options) {
    this.options = {
      method:       'post',
      asynchronous: true,
      parameters:   ''
    }
    Object.extend(this.options, options || {});
  },

  responseIsSuccess: function() {
    return this.transport.status == undefined
        || this.transport.status == 0
        || (this.transport.status >= 200 && this.transport.status < 300);
  },

  responseIsFailure: function() {
    return !this.responseIsSuccess();
  }
}

Ajax.Request = Class.create();
Ajax.Request.Events =
  ['Uninitialized', 'Loading', 'Loaded', 'Interactive', 'Complete'];

Ajax.Request.prototype = Object.extend(new Ajax.Base(), {
  initialize: function(url, options) {
    this.transport = Ajax.getTransport();
    this.setOptions(options);
    this.request(url);
  },

  request: function(url) {
    var parameters = this.options.parameters || '';
    if (parameters.length > 0) parameters += '&_=';

    try {
      this.url = url;
      if (this.options.method == 'get' && parameters.length > 0)
        this.url += (this.url.match(/\?/) ? '&' : '?') + parameters;

      Ajax.Responders.dispatch('onCreate', this, this.transport);

      this.transport.open(this.options.method, this.url,
        this.options.asynchronous);

      if (this.options.asynchronous) {
        this.transport.onreadystatechange = this.onStateChange.bind(this);
        setTimeout((function() {this.respondToReadyState(1)}).bind(this), 10);
      }

      this.setRequestHeaders();

      var body = this.options.postBody ? this.options.postBody : parameters;
      this.transport.send(this.options.method == 'post' ? body : null);

    } catch (e) {
      this.dispatchException(e);
    }
  },

  setRequestHeaders: function() {
    var requestHeaders =
      ['X-Requested-With', 'XMLHttpRequest',
       'X-Prototype-Version', Prototype.Version];

    if (this.options.method == 'post') {
      requestHeaders.push('Content-type',
        'application/x-www-form-urlencoded');

      /* Force "Connection: close" for Mozilla browsers to work around
       * a bug where XMLHttpReqeuest sends an incorrect Content-length
       * header. See Mozilla Bugzilla #246651.
       */
      if (this.transport.overrideMimeType)
        requestHeaders.push('Connection', 'close');
    }

    if (this.options.requestHeaders)
      requestHeaders.push.apply(requestHeaders, this.options.requestHeaders);

    for (var i = 0; i < requestHeaders.length; i += 2)
      this.transport.setRequestHeader(requestHeaders[i], requestHeaders[i+1]);
  },

  onStateChange: function() {
    var readyState = this.transport.readyState;
    if (readyState != 1)
      this.respondToReadyState(this.transport.readyState);
  },

  header: function(name) {
    try {
      return this.transport.getResponseHeader(name);
    } catch (e) {}
  },

  evalJSON: function() {
    try {
      return eval(this.header('X-JSON'));
    } catch (e) {}
  },

  evalResponse: function() {
    try {
      return eval(this.transport.responseText);
    } catch (e) {
      this.dispatchException(e);
    }
  },

  respondToReadyState: function(readyState) {
    var event = Ajax.Request.Events[readyState];
    var transport = this.transport, json = this.evalJSON();

    if (event == 'Complete') {
      try {
        (this.options['on' + this.transport.status]
         || this.options['on' + (this.responseIsSuccess() ? 'Success' : 'Failure')]
         || Prototype.emptyFunction)(transport, json);
      } catch (e) {
        this.dispatchException(e);
      }

      if ((this.header('Content-type') || '').match(/^text\/javascript/i))
        this.evalResponse();
    }

    try {
      (this.options['on' + event] || Prototype.emptyFunction)(transport, json);
      Ajax.Responders.dispatch('on' + event, this, transport, json);
    } catch (e) {
      this.dispatchException(e);
    }

    /* Avoid memory leak in MSIE: clean up the oncomplete event handler */
    if (event == 'Complete')
      this.transport.onreadystatechange = Prototype.emptyFunction;
  },

  dispatchException: function(exception) {
    (this.options.onException || Prototype.emptyFunction)(this, exception);
    Ajax.Responders.dispatch('onException', this, exception);
  }
});

Ajax.Updater = Class.create();

Object.extend(Object.extend(Ajax.Updater.prototype, Ajax.Request.prototype), {
  initialize: function(container, url, options) {
    this.containers = {
      success: container.success ? $(container.success) : $(container),
      failure: container.failure ? $(container.failure) :
        (container.success ? null : $(container))
    }

    this.transport = Ajax.getTransport();
    this.setOptions(options);

    var onComplete = this.options.onComplete || Prototype.emptyFunction;
    this.options.onComplete = (function(transport, object) {
      this.updateContent();
      onComplete(transport, object);
    }).bind(this);

    this.request(url);
  },

  updateContent: function() {
    var receiver = this.responseIsSuccess() ?
      this.containers.success : this.containers.failure;
    var response = this.transport.responseText;

    if (!this.options.evalScripts)
      response = response.stripScripts();

    if (receiver) {
      if (this.options.insertion) {
        new this.options.insertion(receiver, response);
      } else {
        Element.update(receiver, response);
      }
    }

    if (this.responseIsSuccess()) {
      if (this.onComplete)
        setTimeout(this.onComplete.bind(this), 10);
    }
  }
});

Ajax.PeriodicalUpdater = Class.create();
Ajax.PeriodicalUpdater.prototype = Object.extend(new Ajax.Base(), {
  initialize: function(container, url, options) {
    this.setOptions(options);
    this.onComplete = this.options.onComplete;

    this.frequency = (this.options.frequency || 2);
    this.decay = (this.options.decay || 1);

    this.updater = {};
    this.container = container;
    this.url = url;

    this.start();
  },

  start: function() {
    this.options.onComplete = this.updateComplete.bind(this);
    this.onTimerEvent();
  },

  stop: function() {
    this.updater.onComplete = undefined;
    clearTimeout(this.timer);
    (this.onComplete || Prototype.emptyFunction).apply(this, arguments);
  },

  updateComplete: function(request) {
    if (this.options.decay) {
      this.decay = (request.responseText == this.lastText ?
        this.decay * this.options.decay : 1);

      this.lastText = request.responseText;
    }
    this.timer = setTimeout(this.onTimerEvent.bind(this),
      this.decay * this.frequency * 1000);
  },

  onTimerEvent: function() {
    this.updater = new Ajax.Updater(this.container, this.url, this.options);
  }
});
document.getElementsByClassName = function(className, parentElement) {
  var children = ($(parentElement) || document.body).getElementsByTagName('*');
  return $A(children).inject([], function(elements, child) {
    if (child.className.match(new RegExp("(^|\\s)" + className + "(\\s|$)")))
      elements.push(child);
    return elements;
  });
}

/*--------------------------------------------------------------------------*/

if (!window.Element) {
  var Element = new Object();
}

Object.extend(Element, {
  visible: function(element) {
    return $(element).style.display != 'none';
  },

  toggle: function() {
    for (var i = 0; i < arguments.length; i++) {
      var element = $(arguments[i]);
      Element[Element.visible(element) ? 'hide' : 'show'](element);
    }
  },

  hide: function() {
    for (var i = 0; i < arguments.length; i++) {
      var element = $(arguments[i]);
      element.style.display = 'none';
    }
  },

  show: function() {
    for (var i = 0; i < arguments.length; i++) {
      var element = $(arguments[i]);
      element.style.display = '';
    }
  },

  remove: function(element) {
    element = $(element);
    element.parentNode.removeChild(element);
  },

  update: function(element, html) {
    $(element).innerHTML = html.stripScripts();
    setTimeout(function() {html.evalScripts()}, 10);
  },

  getHeight: function(element) {
    element = $(element);
    return element.offsetHeight;
  },

  classNames: function(element) {
    return new Element.ClassNames(element);
  },

  hasClassName: function(element, className) {
    if (!(element = $(element))) return;
    return Element.classNames(element).include(className);
  },

  addClassName: function(element, className) {
    if (!(element = $(element))) return;
    return Element.classNames(element).add(className);
  },

  removeClassName: function(element, className) {
    if (!(element = $(element))) return;
    return Element.classNames(element).remove(className);
  },

  // removes whitespace-only text node children
  cleanWhitespace: function(element) {
    element = $(element);
    for (var i = 0; i < element.childNodes.length; i++) {
      var node = element.childNodes[i];
      if (node.nodeType == 3 && !/\S/.test(node.nodeValue))
        Element.remove(node);
    }
  },

  empty: function(element) {
    return $(element).innerHTML.match(/^\s*$/);
  },

  scrollTo: function(element) {
    element = $(element);
    var x = element.x ? element.x : element.offsetLeft,
        y = element.y ? element.y : element.offsetTop;
    window.scrollTo(x, y);
  },

  getStyle: function(element, style) {
    element = $(element);
    var value = element.style[style.camelize()];
    if (!value) {
      if (document.defaultView && document.defaultView.getComputedStyle) {
        var css = document.defaultView.getComputedStyle(element, null);
        value = css ? css.getPropertyValue(style) : null;
      } else if (element.currentStyle) {
        value = element.currentStyle[style.camelize()];
      }
    }

    if (window.opera && ['left', 'top', 'right', 'bottom'].include(style))
      if (Element.getStyle(element, 'position') == 'static') value = 'auto';

    return value == 'auto' ? null : value;
  },

  setStyle: function(element, style) {
    element = $(element);
    for (name in style)
      element.style[name.camelize()] = style[name];
  },

  getDimensions: function(element) {
    element = $(element);
    if (Element.getStyle(element, 'display') != 'none')
      return {width: element.offsetWidth, height: element.offsetHeight};

    // All *Width and *Height properties give 0 on elements with display none,
    // so enable the element temporarily
    var els = element.style;
    var originalVisibility = els.visibility;
    var originalPosition = els.position;
    els.visibility = 'hidden';
    els.position = 'absolute';
    els.display = '';
    var originalWidth = element.clientWidth;
    var originalHeight = element.clientHeight;
    els.display = 'none';
    els.position = originalPosition;
    els.visibility = originalVisibility;
    return {width: originalWidth, height: originalHeight};
  },

  makePositioned: function(element) {
    element = $(element);
    var pos = Element.getStyle(element, 'position');
    if (pos == 'static' || !pos) {
      element._madePositioned = true;
      element.style.position = 'relative';
      // Opera returns the offset relative to the positioning context, when an
      // element is position relative but top and left have not been defined
      if (window.opera) {
        element.style.top = 0;
        element.style.left = 0;
      }
    }
  },

  undoPositioned: function(element) {
    element = $(element);
    if (element._madePositioned) {
      element._madePositioned = undefined;
      element.style.position =
        element.style.top =
        element.style.left =
        element.style.bottom =
        element.style.right = '';
    }
  },

  makeClipping: function(element) {
    element = $(element);
    if (element._overflow) return;
    element._overflow = element.style.overflow;
    if ((Element.getStyle(element, 'overflow') || 'visible') != 'hidden')
      element.style.overflow = 'hidden';
  },

  undoClipping: function(element) {
    element = $(element);
    if (element._overflow) return;
    element.style.overflow = element._overflow;
    element._overflow = undefined;
  }
});

var Toggle = new Object();
Toggle.display = Element.toggle;

/*--------------------------------------------------------------------------*/

Abstract.Insertion = function(adjacency) {
  this.adjacency = adjacency;
}

Abstract.Insertion.prototype = {
  initialize: function(element, content) {
    this.element = $(element);
    this.content = content.stripScripts();

    if (this.adjacency && this.element.insertAdjacentHTML) {
      try {
        this.element.insertAdjacentHTML(this.adjacency, this.content);
      } catch (e) {
        if (this.element.tagName.toLowerCase() == 'tbody') {
          this.insertContent(this.contentFromAnonymousTable());
        } else {
          throw e;
        }
      }
    } else {
      this.range = this.element.ownerDocument.createRange();
      if (this.initializeRange) this.initializeRange();
      this.insertContent([this.range.createContextualFragment(this.content)]);
    }

    setTimeout(function() {content.evalScripts()}, 10);
  },

  contentFromAnonymousTable: function() {
    var div = document.createElement('div');
    div.innerHTML = '<table><tbody>' + this.content + '</tbody></table>';
    return $A(div.childNodes[0].childNodes[0].childNodes);
  }
}

var Insertion = new Object();

Insertion.Before = Class.create();
Insertion.Before.prototype = Object.extend(new Abstract.Insertion('beforeBegin'), {
  initializeRange: function() {
    this.range.setStartBefore(this.element);
  },

  insertContent: function(fragments) {
    fragments.each((function(fragment) {
      this.element.parentNode.insertBefore(fragment, this.element);
    }).bind(this));
  }
});

Insertion.Top = Class.create();
Insertion.Top.prototype = Object.extend(new Abstract.Insertion('afterBegin'), {
  initializeRange: function() {
    this.range.selectNodeContents(this.element);
    this.range.collapse(true);
  },

  insertContent: function(fragments) {
    fragments.reverse(false).each((function(fragment) {
      this.element.insertBefore(fragment, this.element.firstChild);
    }).bind(this));
  }
});

Insertion.Bottom = Class.create();
Insertion.Bottom.prototype = Object.extend(new Abstract.Insertion('beforeEnd'), {
  initializeRange: function() {
    this.range.selectNodeContents(this.element);
    this.range.collapse(this.element);
  },

  insertContent: function(fragments) {
    fragments.each((function(fragment) {
      this.element.appendChild(fragment);
    }).bind(this));
  }
});

Insertion.After = Class.create();
Insertion.After.prototype = Object.extend(new Abstract.Insertion('afterEnd'), {
  initializeRange: function() {
    this.range.setStartAfter(this.element);
  },

  insertContent: function(fragments) {
    fragments.each((function(fragment) {
      this.element.parentNode.insertBefore(fragment,
        this.element.nextSibling);
    }).bind(this));
  }
});

/*--------------------------------------------------------------------------*/

Element.ClassNames = Class.create();
Element.ClassNames.prototype = {
  initialize: function(element) {
    this.element = $(element);
  },

  _each: function(iterator) {
    this.element.className.split(/\s+/).select(function(name) {
      return name.length > 0;
    })._each(iterator);
  },

  set: function(className) {
    this.element.className = className;
  },

  add: function(classNameToAdd) {
    if (this.include(classNameToAdd)) return;
    this.set(this.toArray().concat(classNameToAdd).join(' '));
  },

  remove: function(classNameToRemove) {
    if (!this.include(classNameToRemove)) return;
    this.set(this.select(function(className) {
      return className != classNameToRemove;
    }).join(' '));
  },

  toString: function() {
    return this.toArray().join(' ');
  }
}

Object.extend(Element.ClassNames.prototype, Enumerable);
var Field = {
  clear: function() {
    for (var i = 0; i < arguments.length; i++)
      $(arguments[i]).value = '';
  },

  focus: function(element) {
    $(element).focus();
  },

  present: function() {
    for (var i = 0; i < arguments.length; i++)
      if ($(arguments[i]).value == '') return false;
    return true;
  },

  select: function(element) {
    $(element).select();
  },

  activate: function(element) {
    element = $(element);
    element.focus();
    if (element.select)
      element.select();
  }
}

/*--------------------------------------------------------------------------*/

var Form = {
  serialize: function(form) {
    var elements = Form.getElements($(form));
    var queryComponents = new Array();

    for (var i = 0; i < elements.length; i++) {
      var queryComponent = Form.Element.serialize(elements[i]);
      if (queryComponent)
        queryComponents.push(queryComponent);
    }

    return queryComponents.join('&');
  },

  getElements: function(form) {
    form = $(form);
    var elements = new Array();

    for (tagName in Form.Element.Serializers) {
      var tagElements = form.getElementsByTagName(tagName);
      for (var j = 0; j < tagElements.length; j++)
        elements.push(tagElements[j]);
    }
    return elements;
  },

  getInputs: function(form, typeName, name) {
    form = $(form);
    var inputs = form.getElementsByTagName('input');

    if (!typeName && !name)
      return inputs;

    var matchingInputs = new Array();
    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      if ((typeName && input.type != typeName) ||
          (name && input.name != name))
        continue;
      matchingInputs.push(input);
    }

    return matchingInputs;
  },

  disable: function(form) {
    var elements = Form.getElements(form);
    for (var i = 0; i < elements.length; i++) {
      var element = elements[i];
      element.blur();
      element.disabled = 'true';
    }
  },

  enable: function(form) {
    var elements = Form.getElements(form);
    for (var i = 0; i < elements.length; i++) {
      var element = elements[i];
      element.disabled = '';
    }
  },

  findFirstElement: function(form) {
    return Form.getElements(form).find(function(element) {
      return element.type != 'hidden' && !element.disabled &&
        ['input', 'select', 'textarea'].include(element.tagName.toLowerCase());
    });
  },

  focusFirstElement: function(form) {
    Field.activate(Form.findFirstElement(form));
  },

  reset: function(form) {
    $(form).reset();
  }
}

Form.Element = {
  serialize: function(element) {
    element = $(element);
    var method = element.tagName.toLowerCase();
    var parameter = Form.Element.Serializers[method](element);

    if (parameter) {
      var key = encodeURIComponent(parameter[0]);
      if (key.length == 0) return;

      if (parameter[1].constructor != Array)
        parameter[1] = [parameter[1]];

      return parameter[1].map(function(value) {
        return key + '=' + encodeURIComponent(value);
      }).join('&');
    }
  },

  getValue: function(element) {
    element = $(element);
    var method = element.tagName.toLowerCase();
    var parameter = Form.Element.Serializers[method](element);

    if (parameter)
      return parameter[1];
  }
}

Form.Element.Serializers = {
  input: function(element) {
    switch (element.type.toLowerCase()) {
      case 'submit':
      case 'hidden':
      case 'password':
      case 'text':
        return Form.Element.Serializers.textarea(element);
      case 'checkbox':
      case 'radio':
        return Form.Element.Serializers.inputSelector(element);
    }
    return false;
  },

  inputSelector: function(element) {
    if (element.checked)
      return [element.name, element.value];
  },

  textarea: function(element) {
    return [element.name, element.value];
  },

  select: function(element) {
    return Form.Element.Serializers[element.type == 'select-one' ?
      'selectOne' : 'selectMany'](element);
  },

  selectOne: function(element) {
    var value = '', opt, index = element.selectedIndex;
    if (index >= 0) {
      opt = element.options[index];
      value = opt.value;
      if (!value && !('value' in opt))
        value = opt.text;
    }
    return [element.name, value];
  },

  selectMany: function(element) {
    var value = new Array();
    for (var i = 0; i < element.length; i++) {
      var opt = element.options[i];
      if (opt.selected) {
        var optValue = opt.value;
        if (!optValue && !('value' in opt))
          optValue = opt.text;
        value.push(optValue);
      }
    }
    return [element.name, value];
  }
}

/*--------------------------------------------------------------------------*/

var $F = Form.Element.getValue;

/*--------------------------------------------------------------------------*/

Abstract.TimedObserver = function() {}
Abstract.TimedObserver.prototype = {
  initialize: function(element, frequency, callback) {
    this.frequency = frequency;
    this.element   = $(element);
    this.callback  = callback;

    this.lastValue = this.getValue();
    this.registerCallback();
  },

  registerCallback: function() {
    setInterval(this.onTimerEvent.bind(this), this.frequency * 1000);
  },

  onTimerEvent: function() {
    var value = this.getValue();
    if (this.lastValue != value) {
      this.callback(this.element, value);
      this.lastValue = value;
    }
  }
}

Form.Element.Observer = Class.create();
Form.Element.Observer.prototype = Object.extend(new Abstract.TimedObserver(), {
  getValue: function() {
    return Form.Element.getValue(this.element);
  }
});

Form.Observer = Class.create();
Form.Observer.prototype = Object.extend(new Abstract.TimedObserver(), {
  getValue: function() {
    return Form.serialize(this.element);
  }
});

/*--------------------------------------------------------------------------*/

Abstract.EventObserver = function() {}
Abstract.EventObserver.prototype = {
  initialize: function(element, callback) {
    this.element  = $(element);
    this.callback = callback;

    this.lastValue = this.getValue();
    if (this.element.tagName.toLowerCase() == 'form')
      this.registerFormCallbacks();
    else
      this.registerCallback(this.element);
  },

  onElementEvent: function() {
    var value = this.getValue();
    if (this.lastValue != value) {
      this.callback(this.element, value);
      this.lastValue = value;
    }
  },

  registerFormCallbacks: function() {
    var elements = Form.getElements(this.element);
    for (var i = 0; i < elements.length; i++)
      this.registerCallback(elements[i]);
  },

  registerCallback: function(element) {
    if (element.type) {
      switch (element.type.toLowerCase()) {
        case 'checkbox':
        case 'radio':
          Event.observe(element, 'click', this.onElementEvent.bind(this));
          break;
        case 'password':
        case 'text':
        case 'textarea':
        case 'select-one':
        case 'select-multiple':
          Event.observe(element, 'change', this.onElementEvent.bind(this));
          break;
      }
    }
  }
}

Form.Element.EventObserver = Class.create();
Form.Element.EventObserver.prototype = Object.extend(new Abstract.EventObserver(), {
  getValue: function() {
    return Form.Element.getValue(this.element);
  }
});

Form.EventObserver = Class.create();
Form.EventObserver.prototype = Object.extend(new Abstract.EventObserver(), {
  getValue: function() {
    return Form.serialize(this.element);
  }
});
if (!window.Event) {
  var Event = new Object();
}

Object.extend(Event, {
  KEY_BACKSPACE: 8,
  KEY_TAB:       9,
  KEY_RETURN:   13,
  KEY_ESC:      27,
  KEY_LEFT:     37,
  KEY_UP:       38,
  KEY_RIGHT:    39,
  KEY_DOWN:     40,
  KEY_DELETE:   46,

  element: function(event) {
    return event.target || event.srcElement;
  },

  isLeftClick: function(event) {
    return (((event.which) && (event.which == 1)) ||
            ((event.button) && (event.button == 1)));
  },

  pointerX: function(event) {
    return event.pageX || (event.clientX +
      (document.documentElement.scrollLeft || document.body.scrollLeft));
  },

  pointerY: function(event) {
    return event.pageY || (event.clientY +
      (document.documentElement.scrollTop || document.body.scrollTop));
  },

  stop: function(event) {
    if (event.preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      event.returnValue = false;
      event.cancelBubble = true;
    }
  },

  // find the first node with the given tagName, starting from the
  // node the event was triggered on; traverses the DOM upwards
  findElement: function(event, tagName) {
    var element = Event.element(event);
    while (element.parentNode && (!element.tagName ||
        (element.tagName.toUpperCase() != tagName.toUpperCase())))
      element = element.parentNode;
    return element;
  },

  observers: false,

  _observeAndCache: function(element, name, observer, useCapture) {
    if (!this.observers) this.observers = [];
    if (element.addEventListener) {
      this.observers.push([element, name, observer, useCapture]);
      element.addEventListener(name, observer, useCapture);
    } else if (element.attachEvent) {
      this.observers.push([element, name, observer, useCapture]);
      element.attachEvent('on' + name, observer);
    }
  },

  unloadCache: function() {
    if (!Event.observers) return;
    for (var i = 0; i < Event.observers.length; i++) {
      Event.stopObserving.apply(this, Event.observers[i]);
      Event.observers[i][0] = null;
    }
    Event.observers = false;
  },

  observe: function(elementParam, name, observer, useCapture) {
    var element = $(elementParam);
    useCapture = useCapture || false;

    if (name == 'keypress' &&
        (navigator.appVersion.match(/Konqueror|Safari|KHTML/)
        || element.attachEvent))
      name = 'keydown';

    this._observeAndCache(element, name, observer, useCapture);
  },

  stopObserving: function(elementParam, name, observer, useCapture) {
    var element = $(elementParam);
    useCapture = useCapture || false;

    if (name == 'keypress' &&
        (navigator.appVersion.match(/Konqueror|Safari|KHTML/)
        || element.detachEvent))
      name = 'keydown';

    if (element.removeEventListener) {
      element.removeEventListener(name, observer, useCapture);
    } else if (element.detachEvent) {
      element.detachEvent('on' + name, observer);
    }
  }
});

/* prevent memory leaks in IE */
Event.observe(window, 'unload', Event.unloadCache, false);
var Position = {
  // set to true if needed, warning: firefox performance problems
  // NOT neeeded for page scrolling, only if draggable contained in
  // scrollable elements
  includeScrollOffsets: false,

  // must be called before calling withinIncludingScrolloffset, every time the
  // page is scrolled
  prepare: function() {
    this.deltaX =  window.pageXOffset
                || document.documentElement.scrollLeft
                || document.body.scrollLeft
                || 0;
    this.deltaY =  window.pageYOffset
                || document.documentElement.scrollTop
                || document.body.scrollTop
                || 0;
  },

  realOffset: function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.scrollTop  || 0;
      valueL += element.scrollLeft || 0;
      element = element.parentNode;
    } while (element);
    return [valueL, valueT];
  },

  cumulativeOffset: function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      element = element.offsetParent;
    } while (element);
    return [valueL, valueT];
  },

  positionedOffset: function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      element = element.offsetParent;
      if (element) {
        p = Element.getStyle(element, 'position');
        if (p == 'relative' || p == 'absolute') break;
      }
    } while (element);
    return [valueL, valueT];
  },

  offsetParent: function(element) {
    if (element.offsetParent) return element.offsetParent;
    if (element == document.body) return element;

    while ((element = element.parentNode) && element != document.body)
      if (Element.getStyle(element, 'position') != 'static')
        return element;

    return document.body;
  },

  // caches x/y coordinate pair to use with overlap
  within: function(element, x, y) {
    if (this.includeScrollOffsets)
      return this.withinIncludingScrolloffsets(element, x, y);
    this.xcomp = x;
    this.ycomp = y;
    this.offset = this.cumulativeOffset(element);

    return (y >= this.offset[1] &&
            y <  this.offset[1] + element.offsetHeight &&
            x >= this.offset[0] &&
            x <  this.offset[0] + element.offsetWidth);
  },

  withinIncludingScrolloffsets: function(element, x, y) {
    var offsetcache = this.realOffset(element);

    this.xcomp = x + offsetcache[0] - this.deltaX;
    this.ycomp = y + offsetcache[1] - this.deltaY;
    this.offset = this.cumulativeOffset(element);

    return (this.ycomp >= this.offset[1] &&
            this.ycomp <  this.offset[1] + element.offsetHeight &&
            this.xcomp >= this.offset[0] &&
            this.xcomp <  this.offset[0] + element.offsetWidth);
  },

  // within must be called directly before
  overlap: function(mode, element) {
    if (!mode) return 0;
    if (mode == 'vertical')
      return ((this.offset[1] + element.offsetHeight) - this.ycomp) /
        element.offsetHeight;
    if (mode == 'horizontal')
      return ((this.offset[0] + element.offsetWidth) - this.xcomp) /
        element.offsetWidth;
  },

  clone: function(source, target) {
    source = $(source);
    target = $(target);
    target.style.position = 'absolute';
    var offsets = this.cumulativeOffset(source);
    target.style.top    = offsets[1] + 'px';
    target.style.left   = offsets[0] + 'px';
    target.style.width  = source.offsetWidth + 'px';
    target.style.height = source.offsetHeight + 'px';
  },

  page: function(forElement) {
    var valueT = 0, valueL = 0;

    var element = forElement;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;

      // Safari fix
      if (element.offsetParent==document.body)
        if (Element.getStyle(element,'position')=='absolute') break;

    } while (element = element.offsetParent);

    element = forElement;
    do {
      valueT -= element.scrollTop  || 0;
      valueL -= element.scrollLeft || 0;
    } while (element = element.parentNode);

    return [valueL, valueT];
  },

  clone: function(source, target) {
    var options = Object.extend({
      setLeft:    true,
      setTop:     true,
      setWidth:   true,
      setHeight:  true,
      offsetTop:  0,
      offsetLeft: 0
    }, arguments[2] || {})

    // find page position of source
    source = $(source);
    var p = Position.page(source);

    // find coordinate system to use
    target = $(target);
    var delta = [0, 0];
    var parent = null;
    // delta [0,0] will do fine with position: fixed elements,
    // position:absolute needs offsetParent deltas
    if (Element.getStyle(target,'position') == 'absolute') {
      parent = Position.offsetParent(target);
      delta = Position.page(parent);
    }

    // correct by body offsets (fixes Safari)
    if (parent == document.body) {
      delta[0] -= document.body.offsetLeft;
      delta[1] -= document.body.offsetTop;
    }

    // set position
    if(options.setLeft)   target.style.left  = (p[0] - delta[0] + options.offsetLeft) + 'px';
    if(options.setTop)    target.style.top   = (p[1] - delta[1] + options.offsetTop) + 'px';
    if(options.setWidth)  target.style.width = source.offsetWidth + 'px';
    if(options.setHeight) target.style.height = source.offsetHeight + 'px';
  },

  absolutize: function(element) {
    element = $(element);
    if (element.style.position == 'absolute') return;
    Position.prepare();

    var offsets = Position.positionedOffset(element);
    var top     = offsets[1];
    var left    = offsets[0];
    var width   = element.clientWidth;
    var height  = element.clientHeight;

    element._originalLeft   = left - parseFloat(element.style.left  || 0);
    element._originalTop    = top  - parseFloat(element.style.top || 0);
    element._originalWidth  = element.style.width;
    element._originalHeight = element.style.height;

    element.style.position = 'absolute';
    element.style.top    = top + 'px';;
    element.style.left   = left + 'px';;
    element.style.width  = width + 'px';;
    element.style.height = height + 'px';;
  },

  relativize: function(element) {
    element = $(element);
    if (element.style.position == 'relative') return;
    Position.prepare();

    element.style.position = 'relative';
    var top  = parseFloat(element.style.top  || 0) - (element._originalTop || 0);
    var left = parseFloat(element.style.left || 0) - (element._originalLeft || 0);

    element.style.top    = top + 'px';
    element.style.left   = left + 'px';
    element.style.height = element._originalHeight;
    element.style.width  = element._originalWidth;
  }
}

// Safari returns margins on body which is incorrect if the child is absolutely
// positioned.  For performance reasons, redefine Position.cumulativeOffset for
// KHTML/WebKit only.
if (/Konqueror|Safari|KHTML/.test(navigator.userAgent)) {
  Position.cumulativeOffset = function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      if (element.offsetParent == document.body)
        if (Element.getStyle(element, 'position') == 'absolute') break;

      element = element.offsetParent;
    } while (element);

    return [valueL, valueT];
  }
}
/**  
*  
*  Copyright 2005 Sabre Airline Solutions  
*  
*  Licensed under the Apache License, Version 2.0 (the "License"); you may not use this  
*  file except in compliance with the License. You may obtain a copy of the License at  
*  
*         http://www.apache.org/licenses/LICENSE-2.0  
*  
*  Unless required by applicable law or agreed to in writing, software distributed under the  
*  License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,  
*  either express or implied. See the License for the specific language governing permissions  
*  and limitations under the License.  
**/  


var Rico = new Object();
Rico.Corner = {

   round: function(e, options) {
      var e = $(e);
      this._setOptions(options);

      var color = this.options.color;
      if ( this.options.color == "fromElement" )
         color = this._background(e);

      var bgColor = this.options.bgColor;
      if ( this.options.bgColor == "fromParent" )
         bgColor = this._background(e.offsetParent);

      this._roundCornersImpl(e, color, bgColor);
   },

    /**   This is a helper function to change the background
    *     color of <div> that has had Rico rounded corners added.
    *
    *     It seems we cannot just set the background color for the
    *     outer <div> so each <span> element used to create the
    *     corners must have its background color set individually.
    *
    * @param {DOM} theDiv - A child of the outer <div> that was
    *                        supplied to the `round` method.
    *
    * @param {str} newColor - The new background color to use.
    */
    changeColor: function(theDiv, newColor) {
   
        theDiv.style.backgroundColor = newColor;

        var spanElements = theDiv.parentNode.getElementsByTagName("span");
        
        for (var currIdx = 0; currIdx < spanElements.length; currIdx++) {
            spanElements[currIdx].style.backgroundColor = newColor;
        }
    }, 


    /**   This is a helper function to change the background
    *     opacity of <div> that has had Rico rounded corners added.
    *
    *     See changeColor (above) for algorithm explanation
    *
    * @param {DOM} theDiv A child of the outer <div> that was
    *                        supplied to the `round` method.
    *
    * @param {int} newOpacity The new opacity to use (0-1).
    */
    changeOpacity: function(theDiv, newOpacity) {
   
        var mozillaOpacity = newOpacity;
        var ieOpacity = 'alpha(opacity=' + newOpacity * 100 + ')';
        
        theDiv.style.opacity = mozillaOpacity;
        theDiv.style.filter = ieOpacity;

        var spanElements = theDiv.parentNode.getElementsByTagName("span");
        
        for (var currIdx = 0; currIdx < spanElements.length; currIdx++) {
            spanElements[currIdx].style.opacity = mozillaOpacity;
            spanElements[currIdx].style.filter = ieOpacity;
        }

    },

    /** this function takes care of redoing the rico cornering
    *    
    *    you can't just call updateRicoCorners() again and pass it a 
    *    new options string. you have to first remove the divs that 
    *    rico puts on top and below the content div.
    *
    * @param {DOM} theDiv - A child of the outer <div> that was
    *                        supplied to the `round` method.
    *
    * @param {Array} options - list of options
    */
    reRound: function(theDiv, options) {

        var topRico = theDiv.parentNode.childNodes[0];
        //theDiv would be theDiv.parentNode.childNodes[1]
        var bottomRico = theDiv.parentNode.childNodes[2];
       
        theDiv.parentNode.removeChild(topRico);
        theDiv.parentNode.removeChild(bottomRico); 

        this.round(theDiv.parentNode, options);
    }, 

   _roundCornersImpl: function(e, color, bgColor) {
      if(this.options.border)
         this._renderBorder(e,bgColor);
      if(this._isTopRounded())
         this._roundTopCorners(e,color,bgColor);
      if(this._isBottomRounded())
         this._roundBottomCorners(e,color,bgColor);
   },

   _renderBorder: function(el,bgColor) {
      var borderValue = "1px solid " + this._borderColor(bgColor);
      var borderL = "border-left: "  + borderValue;
      var borderR = "border-right: " + borderValue;
      var style   = "style='" + borderL + ";" + borderR +  "'";
      el.innerHTML = "<div " + style + ">" + el.innerHTML + "</div>"
   },

   _roundTopCorners: function(el, color, bgColor) {
      var corner = this._createCorner(bgColor);
      for(var i=0 ; i < this.options.numSlices ; i++ )
         corner.appendChild(this._createCornerSlice(color,bgColor,i,"top"));
      el.style.paddingTop = 0;
      el.insertBefore(corner,el.firstChild);
   },

   _roundBottomCorners: function(el, color, bgColor) {
      var corner = this._createCorner(bgColor);
      for(var i=(this.options.numSlices-1) ; i >= 0 ; i-- )
         corner.appendChild(this._createCornerSlice(color,bgColor,i,"bottom"));
      el.style.paddingBottom = 0;
      el.appendChild(corner);
   },

   _createCorner: function(bgColor) {
      var corner = document.createElement("div");
      corner.style.backgroundColor = (this._isTransparent() ? "transparent" : bgColor);
      return corner;
   },

   _createCornerSlice: function(color,bgColor, n, position) {
      var slice = document.createElement("span");

      var inStyle = slice.style;
      inStyle.backgroundColor = color;
      inStyle.display  = "block";
      inStyle.height   = "1px";
      inStyle.overflow = "hidden";
      inStyle.fontSize = "1px";

      var borderColor = this._borderColor(color,bgColor);
      if ( this.options.border && n == 0 ) {
         inStyle.borderTopStyle    = "solid";
         inStyle.borderTopWidth    = "1px";
         inStyle.borderLeftWidth   = "0px";
         inStyle.borderRightWidth  = "0px";
         inStyle.borderBottomWidth = "0px";
         inStyle.height            = "0px"; // assumes css compliant box model
         inStyle.borderColor       = borderColor;
      }
      else if(borderColor) {
         inStyle.borderColor = borderColor;
         inStyle.borderStyle = "solid";
         inStyle.borderWidth = "0px 1px";
      }

      if ( !this.options.compact && (n == (this.options.numSlices-1)) )
         inStyle.height = "2px";

      this._setMargin(slice, n, position);
      this._setBorder(slice, n, position);
      return slice;
   },

   _setOptions: function(options) {
      this.options = {
         corners : "all",
         color   : "fromElement",
         bgColor : "fromParent",
         blend   : true,
         border  : false,
         compact : false
      }
      Object.extend(this.options, options || {});

      this.options.numSlices = this.options.compact ? 2 : 4;
      if ( this._isTransparent() )
         this.options.blend = false;
   },

   _whichSideTop: function() {
      if ( this._hasString(this.options.corners, "all", "top") )
         return "";

      if ( this.options.corners.indexOf("tl") >= 0 && this.options.corners.indexOf("tr") >= 0 )
         return "";

      if (this.options.corners.indexOf("tl") >= 0)
         return "left";
      else if (this.options.corners.indexOf("tr") >= 0)
          return "right";
      return "";
   },

   _whichSideBottom: function() {
      if ( this._hasString(this.options.corners, "all", "bottom") )
         return "";

      if ( this.options.corners.indexOf("bl")>=0 && this.options.corners.indexOf("br")>=0 )
         return "";

      if(this.options.corners.indexOf("bl") >=0)
         return "left";
      else if(this.options.corners.indexOf("br")>=0)
         return "right";
      return "";
   },

   _borderColor : function(color,bgColor) {
      if ( color == "transparent" )
         return bgColor;
      else if ( this.options.border )
         return this.options.border;
      else if ( this.options.blend )
         return this._blend( bgColor, color );
      else
         return "";
   },


   _setMargin: function(el, n, corners) {
      var marginSize = this._marginSize(n);
      var whichSide = corners == "top" ? this._whichSideTop() : this._whichSideBottom();

      if ( whichSide == "left" ) {
         el.style.marginLeft = marginSize + "px"; el.style.marginRight = "0px";
      }
      else if ( whichSide == "right" ) {
         el.style.marginRight = marginSize + "px"; el.style.marginLeft  = "0px";
      }
      else {
         el.style.marginLeft = marginSize + "px"; el.style.marginRight = marginSize + "px";
      }
   },

   _setBorder: function(el,n,corners) {
      var borderSize = this._borderSize(n);
      var whichSide = corners == "top" ? this._whichSideTop() : this._whichSideBottom();
      if ( whichSide == "left" ) {
         el.style.borderLeftWidth = borderSize + "px"; el.style.borderRightWidth = "0px";
      }
      else if ( whichSide == "right" ) {
         el.style.borderRightWidth = borderSize + "px"; el.style.borderLeftWidth  = "0px";
      }
      else {
         el.style.borderLeftWidth = borderSize + "px"; el.style.borderRightWidth = borderSize + "px";
      }
      if (this.options.border != false)
        el.style.borderLeftWidth = borderSize + "px"; el.style.borderRightWidth = borderSize + "px";
   },

   _marginSize: function(n) {
      if ( this._isTransparent() )
         return 0;

      var marginSizes          = [ 5, 3, 2, 1 ];
      var blendedMarginSizes   = [ 3, 2, 1, 0 ];
      var compactMarginSizes   = [ 2, 1 ];
      var smBlendedMarginSizes = [ 1, 0 ];

      if ( this.options.compact && this.options.blend )
         return smBlendedMarginSizes[n];
      else if ( this.options.compact )
         return compactMarginSizes[n];
      else if ( this.options.blend )
         return blendedMarginSizes[n];
      else
         return marginSizes[n];
   },

   _borderSize: function(n) {
      var transparentBorderSizes = [ 5, 3, 2, 1 ];
      var blendedBorderSizes     = [ 2, 1, 1, 1 ];
      var compactBorderSizes     = [ 1, 0 ];
      var actualBorderSizes      = [ 0, 2, 0, 0 ];

      if ( this.options.compact && (this.options.blend || this._isTransparent()) )
         return 1;
      else if ( this.options.compact )
         return compactBorderSizes[n];
      else if ( this.options.blend )
         return blendedBorderSizes[n];
      else if ( this.options.border )
         return actualBorderSizes[n];
      else if ( this._isTransparent() )
         return transparentBorderSizes[n];
      return 0;
   },

   _hasString: function(str) { for(var i=1 ; i<arguments.length ; i++) if (str.indexOf(arguments[i]) >= 0) return true; return false; },
   _blend: function(c1, c2) { var cc1 = Rico.Color.createFromHex(c1); cc1.blend(Rico.Color.createFromHex(c2)); return cc1; },
   _background: function(el) { try { return Rico.Color.createColorFromBackground(el).asHex(); } catch(err) { return "#ffffff"; } },
   _isTransparent: function() { return this.options.color == "transparent"; },
   _isTopRounded: function() { return this._hasString(this.options.corners, "all", "top", "tl", "tr"); },
   _isBottomRounded: function() { return this._hasString(this.options.corners, "all", "bottom", "bl", "br"); },
   _hasSingleTextChild: function(el) { return el.childNodes.length == 1 && el.childNodes[0].nodeType == 3; }
}
Rico.Color = Class.create();

Rico.Color.prototype = {

   initialize: function(red, green, blue) {
      this.rgb = { r: red, g : green, b : blue };
   },

   setRed: function(r) {
      this.rgb.r = r;
   },

   setGreen: function(g) {
      this.rgb.g = g;
   },

   setBlue: function(b) {
      this.rgb.b = b;
   },

   setHue: function(h) {

      // get an HSB model, and set the new hue...
      var hsb = this.asHSB();
      hsb.h = h;

      // convert back to RGB...
      this.rgb = Rico.Color.HSBtoRGB(hsb.h, hsb.s, hsb.b);
   },

   setSaturation: function(s) {
      // get an HSB model, and set the new hue...
      var hsb = this.asHSB();
      hsb.s = s;

      // convert back to RGB and set values...
      this.rgb = Rico.Color.HSBtoRGB(hsb.h, hsb.s, hsb.b);
   },

   setBrightness: function(b) {
      // get an HSB model, and set the new hue...
      var hsb = this.asHSB();
      hsb.b = b;

      // convert back to RGB and set values...
      this.rgb = Rico.Color.HSBtoRGB( hsb.h, hsb.s, hsb.b );
   },

   darken: function(percent) {
      var hsb  = this.asHSB();
      this.rgb = Rico.Color.HSBtoRGB(hsb.h, hsb.s, Math.max(hsb.b - percent,0));
   },

   brighten: function(percent) {
      var hsb  = this.asHSB();
      this.rgb = Rico.Color.HSBtoRGB(hsb.h, hsb.s, Math.min(hsb.b + percent,1));
   },

   blend: function(other) {
      this.rgb.r = Math.floor((this.rgb.r + other.rgb.r)/2);
      this.rgb.g = Math.floor((this.rgb.g + other.rgb.g)/2);
      this.rgb.b = Math.floor((this.rgb.b + other.rgb.b)/2);
   },

   isBright: function() {
      var hsb = this.asHSB();
      return this.asHSB().b > 0.5;
   },

   isDark: function() {
      return ! this.isBright();
   },

   asRGB: function() {
      return "rgb(" + this.rgb.r + "," + this.rgb.g + "," + this.rgb.b + ")";
   },

   asHex: function() {
      return "#" + this.rgb.r.toColorPart() + this.rgb.g.toColorPart() + this.rgb.b.toColorPart();
   },

   asHSB: function() {
      return Rico.Color.RGBtoHSB(this.rgb.r, this.rgb.g, this.rgb.b);
   },

   toString: function() {
      return this.asHex();
   }

};

Rico.Color.createFromHex = function(hexCode) {
  if(hexCode.length==4) {
    var shortHexCode = hexCode; 
    var hexCode = '#';
    for(var i=1;i<4;i++) hexCode += (shortHexCode.charAt(i) + 
shortHexCode.charAt(i));
  }
   if ( hexCode.indexOf('#') == 0 )
      hexCode = hexCode.substring(1);
   var red   = hexCode.substring(0,2);
   var green = hexCode.substring(2,4);
   var blue  = hexCode.substring(4,6);
   return new Rico.Color( parseInt(red,16), parseInt(green,16), parseInt(blue,16) );
}

/**
 * Factory method for creating a color from the background of
 * an HTML element.
 */
Rico.Color.createColorFromBackground = function(elem) {

   var actualColor = RicoUtil.getElementsComputedStyle($(elem), "backgroundColor", "background-color");

   if ( actualColor == "transparent" && elem.parentNode )
      return Rico.Color.createColorFromBackground(elem.parentNode);

   if ( actualColor == null )
      return new Rico.Color(255,255,255);

   if ( actualColor.indexOf("rgb(") == 0 ) {
      var colors = actualColor.substring(4, actualColor.length - 1 );
      var colorArray = colors.split(",");
      return new Rico.Color( parseInt( colorArray[0] ),
                            parseInt( colorArray[1] ),
                            parseInt( colorArray[2] )  );

   }
   else if ( actualColor.indexOf("#") == 0 ) {
      return Rico.Color.createFromHex(actualColor);
   }
   else
      return new Rico.Color(255,255,255);
}

Rico.Color.HSBtoRGB = function(hue, saturation, brightness) {

   var red   = 0;
    var green = 0;
    var blue  = 0;

   if (saturation == 0) {
      red = parseInt(brightness * 255.0 + 0.5);
       green = red;
       blue = red;
    }
    else {
      var h = (hue - Math.floor(hue)) * 6.0;
      var f = h - Math.floor(h);
      var p = brightness * (1.0 - saturation);
      var q = brightness * (1.0 - saturation * f);
      var t = brightness * (1.0 - (saturation * (1.0 - f)));

      switch (parseInt(h)) {
         case 0:
            red   = (brightness * 255.0 + 0.5);
            green = (t * 255.0 + 0.5);
            blue  = (p * 255.0 + 0.5);
            break;
         case 1:
            red   = (q * 255.0 + 0.5);
            green = (brightness * 255.0 + 0.5);
            blue  = (p * 255.0 + 0.5);
            break;
         case 2:
            red   = (p * 255.0 + 0.5);
            green = (brightness * 255.0 + 0.5);
            blue  = (t * 255.0 + 0.5);
            break;
         case 3:
            red   = (p * 255.0 + 0.5);
            green = (q * 255.0 + 0.5);
            blue  = (brightness * 255.0 + 0.5);
            break;
         case 4:
            red   = (t * 255.0 + 0.5);
            green = (p * 255.0 + 0.5);
            blue  = (brightness * 255.0 + 0.5);
            break;
          case 5:
            red   = (brightness * 255.0 + 0.5);
            green = (p * 255.0 + 0.5);
            blue  = (q * 255.0 + 0.5);
            break;
        }
    }

   return { r : parseInt(red), g : parseInt(green) , b : parseInt(blue) };
}

Rico.Color.RGBtoHSB = function(r, g, b) {

   var hue;
   var saturation;
   var brightness;

   var cmax = (r > g) ? r : g;
   if (b > cmax)
      cmax = b;

   var cmin = (r < g) ? r : g;
   if (b < cmin)
      cmin = b;

   brightness = cmax / 255.0;
   if (cmax != 0)
      saturation = (cmax - cmin)/cmax;
   else
      saturation = 0;

   if (saturation == 0)
      hue = 0;
   else {
      var redc   = (cmax - r)/(cmax - cmin);
        var greenc = (cmax - g)/(cmax - cmin);
        var bluec  = (cmax - b)/(cmax - cmin);

        if (r == cmax)
           hue = bluec - greenc;
        else if (g == cmax)
           hue = 2.0 + redc - bluec;
      else
           hue = 4.0 + greenc - redc;

        hue = hue / 6.0;
        if (hue < 0)
           hue = hue + 1.0;
   }

   return { h : hue, s : saturation, b : brightness };
}

/**
* @class
*/
OpenLayers.Util = new Object();




/**
* @class This class represents a screen coordinate, in x and y coordinates
*/
OpenLayers.Pixel = Class.create();
OpenLayers.Pixel.prototype = {
    
    /** @type float */
    x: 0.0,

    /** @type float */
    y: 0.0,
    
    /** 
    * @constructor
    *
    * @param {float} x
    * @param {float} y
    */
    initialize: function(x, y) {
        this.x = x;
        this.y = y;
    },
    
    /**
    * @return string representation of Pixel. ex: "x=200.4,y=242.2"
    * @type str
    */
    toString:function() {
        return ("x=" + this.x + ",y=" + this.y);
    },

    /**
    * @type OpenLayers.Pixel
    */
    copyOf:function() {
        return new OpenLayers.Pixel(this.x, this.y); 
    },
    
    /** 
    * @param {OpenLayers.Pixel} px
    * 
    * @return whether or not the point passed in as parameter is equal to this
    * @type bool
    */
    equals:function(px) {
        return ((this.x == px.x) && (this.y == px.y));
    },

    /**
    * @param {int} x
    * @param {int} y
    * 
    * @return a new Pixel with this pixel's x&y augmented by the 
    *         values passed in.
    * @type OpenLayers.Pixel
    */
    add:function(x, y) {
        return new OpenLayers.Pixel(this.x + x, this.y + y);
    },

    /**
    * @param {OpenLayers.Pixel} px
    * 
    * @return a new Pixel with this pixel's x&y augmented by the 
    *         x&y values of the pixel passed in.
    * @type OpenLayers.Pixel
    */
    offset:function(px) {
        return this.add(px.x, px.y);                
    },
    
    /** @final @type str */
    CLASS_NAME: "OpenLayers.Pixel"
};


/**
* @class This class represents a width and height pair
*/
OpenLayers.Size = Class.create();
OpenLayers.Size.prototype = {

    /** @type float */
    w: 0.0,
    
    /** @type float */
    h: 0.0,


    /** 
    * @constructor
    * 
    * @param {float} w 
    * @param {float} h 
    */
    initialize: function(w, h) {
        this.w = w;
        this.h = h;
    },

    /** 
    * @return String representation of OpenLayers.Size object. 
    *         (ex. <i>"w=55,h=66"</i>)
    * @type String
    */
    toString:function() {
        return ("w=" + this.w + ",h=" + this.h);
    },

    /** 
    * @return New OpenLayers.Size object with the same w and h values
    * @type OpenLayers.Size
    */
    copyOf:function() {
        return new OpenLayers.Size(this.w, this.h);
    },

    /** 
    * @param {OpenLayers.Size} sz
    * @returns Boolean value indicating whether the passed-in OpenLayers.Size 
    *          object has the same w and h components as this
    *
    * @type bool
    */
    equals:function(sz) {
        return ((this.w == sz.w) && (this.h == sz.h));
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Size"
};

/**
* @class This class represents a longitude and latitude pair
*/
OpenLayers.LonLat = Class.create();
OpenLayers.LonLat.prototype = {

    /** @type float */
    lon: 0.0,
    
    /** @type float */
    lat: 0.0,

    /**
    * @constructor
    * 
    * @param {float} lon
    * @param {float} lat
    */
    initialize: function(lon, lat) {
        this.lon = lon;
        this.lat = lat;
    },
    
    /** 
    * @return String representation of OpenLayers.LonLat object. 
    *         (ex. <i>"lon=5,lat=42"</i>)
    * @type String
    */
    toString:function() {
        return ("lon=" + this.lon + ",lat=" + this.lat);
    },

    /** 
    * @return Shortened String representation of OpenLayers.LonLat object. 
    *         (ex. <i>"5, 42"</i>)
    * @type String
    */
    toShortString:function() {
        return (this.lon + ", " + this.lat);
    },

    /** 
    * @return New OpenLayers.LonLat object with the same lon and lat values
    * @type OpenLayers.LonLat
    */
    copyOf:function() {
        return new OpenLayers.LonLat(this.lon, this.lat);
    },

    /** 
    * @param {float} lon
    * @param {float} lat
    *
    * @return A new OpenLayers.LonLat object with the lon and lat passed-in
    *         added to this's. 
    * @type OpenLayers.Pixel
    */
    add:function(lon, lat) {
        return new OpenLayers.LonLat(this.lon + lon, this.lat + lat);
    },

    /** 
    * @param {OpenLayers.LonLat} ll
    * @returns Boolean value indicating whether the passed-in OpenLayers.LonLat
    *          object has the same lon and lat components as this
    *
    * @type bool
    */
    equals:function(ll) {
        return ((this.lon == ll.lon) && (this.lat == ll.lat));
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.LonLat"
};

/** Alternative constructor that builds a new OpenLayers.LonLat from a 
*    parameter string
* 
* @constructor
* 
* @param {String} str Comma-separated Lon,Lat coordinate string. 
*                     (ex. <i>"5,40"</i>)
*
* @returns New OpenLayers.LonLat object built from the passed-in String.
* @type OpenLayers.LonLat
*/
OpenLayers.LonLat.fromString = function(str) {
    var pair = str.split(",");
    return new OpenLayers.LonLat(parseFloat(pair[0]), 
                                 parseFloat(pair[1]));
};




/**
* @class This class represents a bounding box. 
*        Data stored as left, bottom, right, top floats
*/
OpenLayers.Bounds = Class.create();
OpenLayers.Bounds.prototype = {

    /** @type float */
    left: 0.0,

    /** @type float */
    bottom: 0.0,

    /** @type float */
    right: 0.0,

    /** @type float */
    top: 0.0,    

    /**
    * @constructor
    *
    * @param {float} left
    * @param {float} bottom
    * @param {float} right
    * @param {float} top
    *
    */
    initialize: function(left, bottom, right, top) {
        this.left = left;
        this.bottom = bottom;
        this.right = right;
        this.top = top;
    },

    /**
    * @returns A fresh copy of the bounds
    * @type OpenLayers.Bounds
    */
    copyOf:function() {
        return new OpenLayers.Bounds(this.left, this.bottom, 
                                     this.right, this.top);
    },

    /** 
    * @param {OpenLayers.Bounds} bounds
    * @returns Boolean value indicating whether the passed-in OpenLayers.Bounds
    *          object has the same left, right, top, bottom components as this
    *
    * @type bool
    */
    equals:function(bounds) {
        return ((this.left == bounds.left) && (this.right == bounds.right) &&
                (this.top == bounds.top) && (this.bottom == bounds.bottom));
    },

    /** 
    * @return String representation of OpenLayers.Bounds object. 
    *         (ex.<i>"left-bottom=(5,42) right-top=(10,45)"</i>)
    * @type String
    */
    toString:function(){
        return ( "left-bottom=(" + this.left + "," + this.bottom + ")"
                 + " right-top=(" + this.right + "," + this.top + ")" );
    },

    /** 
    * @return Simple String representation of OpenLayers.Bounds object.
    *         (ex. <i>"5,42,10,45"</i>)
    * @type String
    */
    toBBOX:function() {
        return (this.left + "," + this.bottom + ","
                + this.right + "," + this.top);
    },
    
    /**
    * @returns The width of the bounds
    * @type float
    */
    getWidth:function() {
        return (this.right - this.left);
    },

    /**
    * @returns The height of the bounds
    * @type float
    */
    getHeight:function() {
        return (this.top - this.bottom);
    },

    /**
    * @returns An OpenLayers.Size which represents the size of the box
    * @type OpenLayers.Size
    */
    getSize:function() {
        return new OpenLayers.Size(this.getWidth(), this.getHeight());
    },

    /**
    * @returns An OpenLayers.Pixel which represents the center of the bounds
    * @type OpenLayers.Pixel
    */
    getCenterPixel:function() {
        return new OpenLayers.Pixel( (this.left + this.right) / 2,
                                     (this.bottom + this.top) / 2);
    },

    /**
    * @returns An OpenLayers.LonLat which represents the center of the bounds
    * @type OpenLayers.LonLat
    */
    getCenterLonLat:function() {
        return new OpenLayers.LonLat( (this.left + this.right) / 2,
                                      (this.bottom + this.top) / 2);
    },

    /**
    * @param {float} x
    * @param {float} y
    *
    * @returns A new OpenLayers.Bounds whose coordinates are the same as this, 
    *          but shifted by the passed-in x and y values
    * @type OpenLayers.Bounds
    */
    add:function(x, y){
        return new OpenLayers.Box(this.left + x, this.bottom + y,
                                  this.right + x, this.top + y);
    },

    /**
    * @param {float} x
    * @param {float} y
    * @param {Boolean} inclusive Whether or not to include the border. 
    *                            Default is true
    *
    * @return Whether or not the passed-in coordinates are within this bounds
    * @type Boolean
    */
    contains:function(x, y, inclusive) {
    
        //set default
        if (inclusive == null) {
            inclusive = true;
        }
        
        var contains = false;
        if (inclusive) {
            contains = ((x >= this.left) && (x <= this.right) && 
                        (y >= this.bottom) && (y <= this.top));
        } else {
            contains = ((x > this.left) && (x < this.right) && 
                        (y > this.bottom) && (y < this.top));
        }              
        return contains;
    },
 
    /**
    * @param {OpenLayers.Bounds} bounds
    * @param {Boolean} partial If true, only part of passed-in 
    *                          OpenLayers.Bounds needs be within this bounds. 
    *                          If false, the entire passed-in bounds must be
    *                          within. Default is false
    * @param {Boolean} inclusive Whether or not to include the border. 
    *                            Default is true
    *
    * @return Whether or not the passed-in OpenLayers.Bounds object is 
    *         contained within this bounds. 
    * @type Boolean
    */
    containsBounds:function(bounds, partial, inclusive) {

        //set defaults
        if (partial == null) {
            partial = false;
        }
        if (inclusive == null) {
            inclusive = true;
        }

        var inLeft;
        var inTop;
        var inRight;
        var inBottom;
        
        if (inclusive) {
            inLeft = (bounds.left >= this.left) && (bounds.left <= this.right);
            inTop = (bounds.top >= this.bottom) && (bounds.top <= this.top);
            inRight= (bounds.right >= this.left) && (bounds.right <= this.right);
            inBottom = (bounds.bottom >= this.bottom) && (bounds.bottom <= this.top);
        } else {
            inLeft = (bounds.left > this.left) && (bounds.left < this.right);
            inTop = (bounds.top > this.bottom) && (bounds.top < this.top);
            inRight= (bounds.right > this.left) && (bounds.right < this.right);
            inBottom = (bounds.bottom > this.bottom) && (bounds.bottom < this.top);
        }
        
        return (partial) ? (inTop || inBottom) && (inLeft || inRight )
                         : (inTop && inLeft && inBottom && inRight);
    },

    /** 
     * @param {OpenLayers.LonLat} lonlat
     *
     * @returns The quadrant ("br" "tr" "tl" "bl") of the bounds in which 
     *           the coordinate lies.
     * @type String
     */
    determineQuadrant: function(lonlat) {
    
        var quadrant = "";
        var center = this.getCenterLonLat();
        
        quadrant += (lonlat.lat < center.lat) ? "b" : "t";
        quadrant += (lonlat.lon < center.lon) ? "l" : "r";
    
        return quadrant; 
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Bounds"
};

/** Alternative constructor that builds a new OpenLayers.Bounds from a 
*    parameter string
* 
* @constructor
* 
* @param {String} str Comma-separated bounds string. (ex. <i>"5,42,10,45"</i>)
*
* @returns New OpenLayers.Bounds object built from the passed-in String.
* @type OpenLayers.Bounds
*/
OpenLayers.Bounds.fromString = function(str) {
    var bounds = str.split(",");
    return OpenLayers.Bounds.fromArray(bounds);
};

/** Alternative constructor that builds a new OpenLayers.Bounds
*    from an array
* 
* @constructor
* 
* @param {Array} bbox Array of bounds values (ex. <i>[5,42,10,45]</i>)
*
* @returns New OpenLayers.Bounds object built from the passed-in Array.
* @type OpenLayers.Bounds
*/
OpenLayers.Bounds.fromArray = function(bbox) {
    return new OpenLayers.Bounds(parseFloat(bbox[0]),
                                 parseFloat(bbox[1]),
                                 parseFloat(bbox[2]),
                                 parseFloat(bbox[3]));
};

/**
 * @param {String} quadrant 
 * 
 * @returns The opposing quadrant ("br" "tr" "tl" "bl"). For Example, if 
 *           you pass in "bl" it returns "tr", if you pass in "br" it 
 *           returns "tl", etc.
 * @type String
 */
OpenLayers.Bounds.oppositeQuadrant = function(quadrant) {
    var opp = "";
    
    opp += (quadrant.charAt(0) == 't') ? 'b' : 't';
    opp += (quadrant.charAt(1) == 'l') ? 'r' : 'l';
    
    return opp;
};

// Some other helpful things

/**
* @param {String} sStart
* 
* @returns Whether or not this string starts with the string passed in.
* @type Boolean
*/
String.prototype.startsWith = function(sStart){
    return (this.substr(0,sStart.length) == sStart);
};

/**
* @returns A trimmed version of the string - all leading and 
*          trailing spaces removed
* @type String
*/
String.prototype.trim = function() {
    
    var b = 0;
    while(this.substr(b,1) == " ") {
        b++;
    }
    
    var e = this.length - 1;
    while(this.substr(e,1) == " ") {
        e--;
    }
    
    return this.substring(b, e+1);
};

/** Remove an object from an array. Iterates through the array
*    to find the item, then removes it.
*
* @param {Object} item
* 
* @returns A reference to the array
* @type Array
*/
Array.prototype.remove = function(item) {
    for(var i=0; i < this.length; i++) {
        if(this[i] == item) {
            this.splice(i,1);
            //break;more than once??
        }
    }
    return this;
}

/**
* @returns A fresh copy of the array
* @type Array
*/
Array.prototype.copyOf = function() {
  var copy = new Array();
  for (var i = 0; i < this.length; i++) {
      copy[i] = this[i];
  }
  return copy;
};

/**
* @param  {Object} item
*/
Array.prototype.prepend = function(item) {
    this.splice(0, 0, item);
};

/**
* @param  {Object} item
*/
Array.prototype.append = function(item){
    this[this.length] = item;
};

/**
*/
Array.prototype.clear = function() {
    this.length = 0;
};

/**
* @param {Object} element
*
* @returns The first index of the element in the array if found. Else returns -1
* @type int
*/
Array.prototype.indexOf = function(element) {
    var index = -1;
    for(var i=0; i < this.length; i++) {
        if (this[i] == element) {
            index = i;
            break;
        }
    }
    return index;    
}

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
        element.style.left = px.x;
        element.style.top = px.y;
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
    dom.style.cursor = "inherit";
    if (imgURL) {
        dom.style.backgroundImage = 'url(' + imgURL + ')';
    }

    //set generic properties
    if (!id) {
        id = "OpenLayersDiv" + (Math.random() * 10000 % 10000);
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
*
* @returns A DOM Image created with the specified attributes.
* @type DOMElement
*/
OpenLayers.Util.createImage = function(id, px, sz, imgURL, position, border) {

    image = document.createElement("img");

    //set special properties
    image.style.alt = id;
    image.style.cursor = "inherit";
    image.galleryImg = "no";
    if (imgURL) {
        image.src = imgURL;
    }

    //set generic properties
    if (!id) {
        id = "OpenLayersDiv" + (Math.random() * 10000 % 10000);
    }
    if (!position) {
        position = "relative";
    }
    OpenLayers.Util.modifyDOMElement(image, id, px, sz, position, border);
        
    return image;
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
*
* @returns A DOM Div created with a DOM Image inside it. If the hack is 
*           needed for transparency in IE, it is added.
* @type DOMElement
*/ 
OpenLayers.Util.createAlphaImageDiv = function(id, px, sz, imgURL, 
                                               position, border, sizing) {
    
    var div = OpenLayers.Util.createDiv();
    var img = OpenLayers.Util.createImage();
    div.appendChild(img);

    OpenLayers.Util.modifyAlphaImageDiv(div, id, px, sz, imgURL, 
                                        position, border, sizing);
    
    return div;
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
        //skip functions
        if (typeof value == 'function') continue;
    
        paramsArray.push(key + "=" + value);
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

/** Takes a hash and copies any keys that don't exist from
*   another hash, by analogy with Object.extend() from
*   Prototype.js.
*
* @param {Object} to
* @param {Object} from
*
* @type Object
*/
OpenLayers.Util.applyDefaults = function (to, from) {
    for (var key in from) {
        if (to[key] == null) {
            to[key] = from[key];
        }
    }
    return to;
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

OpenLayers.ProxyHost = "/viewer/Crossbrowser/blindproxy.py?url=";
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
//    ol.Log.warn("Unhandled request return " + request.statusText);
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

        if (!params) {
            params="";
        }
        params += "&cachehack=" + new Date().getTime();
    }

//    ol.Log.debug("loadURL [" + uri + "]");

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
};OpenLayers.Events = Class.create();

OpenLayers.Events.prototype = {
    // Array: supported events
    BROWSER_EVENTS: [
        "mouseover", "mouseout",
        "mousedown", "mouseup", "mousemove", 
        "click", "dblclick",
        "resize", "focus", "blur"
    ],

    // hash of Array(Function): events listener functions
    listeners: null,

    // Object: the code object issuing application events
    object: null,

    // DOMElement: the DOM element receiving browser events
    div: null,

    // Array: list of support application events
    eventTypes: null,

    /**
    * @param {OpenLayers.Map} map
    * @param {DOMElement} div
    */
    initialize: function (object, div, eventTypes) {
        this.listeners  = {};
        this.object     = object;
        this.div        = div;
        this.eventTypes = eventTypes;
        if (eventTypes) {
            for (var i = 0; i < this.eventTypes.length; i++) {
                // create a listener list for every custom application event
                this.listeners[ this.eventTypes[i] ] = [];
            }
        }
        for (var i = 0; i < this.BROWSER_EVENTS.length; i++) {
            var eventType = this.BROWSER_EVENTS[i];

            // every browser event has a corresponding application event 
            // (whether it's listened for or not).
            this.listeners[ eventType ] = [];

            Event.observe(div, eventType, 
                this.handleBrowserEvent.bindAsEventListener(this));
        }
        // disable dragstart in IE so that mousedown/move/up works normally
        Event.observe(div, "dragstart", Event.stop);
    },

    /**
    * @param {str} type
    * @param {Object} obj
    * @param {Function} func
    */
    register: function (type, obj, func) {
        var listeners = this.listeners[type];
        listeners.push( func.bindAsEventListener(obj) );
    },
    
    remove: function(type) {
        this.listeners[type].pop();
    },

    /**
    * @param {event} evt
    */
    handleBrowserEvent: function (evt) {
        evt.xy = this.getMousePosition(evt); 
        this.triggerEvent(evt.type, evt)
    },

    /**
    * @param {event} evt
    * 
    * @return {OpenLayers.Pixel}
    */
    getMousePosition: function (evt) {
        if (!this.div.offsets) {
            this.div.offsets = Position.page(this.div);
        }
        return new OpenLayers.Pixel(
                        evt.clientX - this.div.offsets[0], 
                        evt.clientY - this.div.offsets[1]); 
    },

    /**
    * @param {str} type
    * @param {event} evt
    */
    triggerEvent: function (type, evt) {
        if (evt == null) {
            evt = {};
        }
        evt.object = this.object;

        var listeners = this.listeners[type];
        for (var i = 0; i < listeners.length; i++) {
            var callback = listeners[i];
            callback(evt);
        }
    }
};
// @require: OpenLayers/Util.js
/**
* @class
*
*
*/

OpenLayers.Map = Class.create();
OpenLayers.Map.prototype = {
    // Hash: base z-indexes for different classes of thing 
    Z_INDEX_BASE: { Layer: 100, Popup: 200, Control: 1000 },

    // Array: supported application event types
    EVENT_TYPES: [ 
        "addlayer", "removelayer", "movestart", "move", "moveend",
        "zoomend", "layerchanged", "popupopen", "popupclose",
        "addmarker", "removemarker", "clearmarkers", "mouseover",
        "mouseout", "mousemove", "dragstart", "drag", "dragend" ],

    // int: zoom levels, used to draw zoom dragging control and limit zooming
    maxZoomLevel: 16,

    // OpenLayers.Bounds
    maxExtent: new OpenLayers.Bounds(-180, -90, 180, 90),

    /* projection */
    projection: "EPSG:4326",

    // float
    maxResolution: null, // degrees per pixel

    // DOMElement: the div that our map lives in
    div: null,

    // HTMLDivElement: the map's view port             
    viewPortDiv: null,

    // HTMLDivElement: the map's layer container
    layerContainerDiv: null,

    // Array(OpenLayers.Layer): ordered list of layers in the map
    layers: null,

    // Array(OpenLayers.Control)
    controls: null,

    // Array(OpenLayers.Popup)
    popups: null,

    // OpenLayers.LonLat
    center: null,

    // int
    zoom: null,

    // OpenLayers.Events
    events: null,

    // OpenLayers.Pixel
    mouseDragStart: null,

    /**
    * @param {DOMElement} div
    */    
    initialize: function (div, options) {
        Object.extend(this, options);

        this.div = div = $(div);

        // the viewPortDiv is the outermost div we modify
        var id = div.id + "_OpenLayers_ViewPort";
        this.viewPortDiv = OpenLayers.Util.createDiv(id, null, null, null,
                                                     "relative", null,
                                                     "hidden");
        this.viewPortDiv.style.width = "100%";
        this.viewPortDiv.style.height = "100%";
        this.div.appendChild(this.viewPortDiv);

        // the layerContainerDiv is the one that holds all the layers
        id = div.id + "_OpenLayers_Container";
        this.layerContainerDiv = OpenLayers.Util.createDiv(id);
        this.viewPortDiv.appendChild(this.layerContainerDiv);

        this.events = new OpenLayers.Events(this, div, this.EVENT_TYPES);

        this.updateSize();
        // make the entire maxExtent fix in zoom level 0 by default
        if (this.maxResolution == null) {
            this.maxResolution = Math.max(
                this.maxExtent.getWidth()  / this.size.w,
                this.maxExtent.getHeight() / this.size.h );
        }
        // update the internal size register whenever the div is resized
        this.events.register("resize", this, this.updateSize);

        this.layers = [];
        
        if (!this.controls) {
            this.controls = [];
            this.addControl(new OpenLayers.Control.MouseDefaults());
            this.addControl(new OpenLayers.Control.PanZoom());
        }

        this.popups = new Array();

        // always call map.destroy()
        Event.observe(window, 'unload', 
            this.destroy.bindAsEventListener(this));
    },

    /**
    */
    destroy:function() {
        if (this.layers != null) {
            for(var i=0; i< this.layers.length; i++) {
                this.layers[i].destroy();
            } 
            this.layers = null;
        }
        if (this.controls != null) {
            for(var i=0; i< this.controls.length; i++) {
                this.controls[i].destroy();
            } 
            this.controls = null;
        }
    },

    /**
    * @param {OpenLayers.Layer} layer
    */    
    addLayer: function (layer, zIndex) {
        layer.map = this;
        layer.projection = this.projection;
        layer.div.style.overflow = "";
        if (zIndex) {
            layer.div.style.zIndex = zIndex;
        } else {
            layer.div.style.zIndex = this.Z_INDEX_BASE['Layer'] + this.layers.length;
        }
        this.layerContainerDiv.appendChild(layer.div);
        this.layers.push(layer);
        this.events.triggerEvent("addlayer");
    },

    /**
    * @param {Array(OpenLayers.Layer)} layers
    */    
    addLayers: function (layers) {
        for (var i = 0; i <  layers.length; i++) {
            this.addLayer(layers[i]);
        }
    },

    /**
    * @param {OpenLayers.Control} control
    * @param {OpenLayers.Pixel} px
    */    
    addControl: function (control, px) {
        control.map = this;
        this.controls.push(control);
        var div = control.draw(px);
        if (div) {
            div.style.zIndex = this.Z_INDEX_BASE['Control'] +
                                this.controls.length;
            this.viewPortDiv.appendChild( div );
        }
    },

    /** 
    * @param {OpenLayers.Popup} popup
    */
    addPopup: function(popup) {
        popup.map = this;
        this.popups.push(popup);
        var popupDiv = popup.draw();
        if (popupDiv) {
            popupDiv.style.zIndex = this.Z_INDEX_BASE['Popup'] +
                                    this.popups.length;
            this.layerContainerDiv.appendChild(popupDiv);
        }
    },
    
    /** 
    * @param {OpenLayers.Popup} popup
    */
    removePopup: function(popup) {
        this.popups.remove(popup);
        if (popup.div) {
            this.layerContainerDiv.removeChild(popup.div);
        }
    },
        
    /**
    * @return {float}
    */
    getResolution: function () {
        // return degrees per pixel
        return this.maxResolution / Math.pow(2, this.zoom);
    },

    /**
    * @return {int}
    */
    getZoom: function () {
        return this.zoom;
    },

    /**
    * @returns {OpenLayers.Size}
    */
    getSize: function () {
        return this.size;
    },

    updateSize: function() {
        this.size = new OpenLayers.Size(
                    this.div.clientWidth, this.div.clientHeight);
        this.events.div.offsets = null;
        // Workaround for the fact that hidden elements return 0 for size.
        if (this.size.w == 0 && this.size.h == 0) {
            this.size.w = parseInt(this.div.style.width);
            this.size.h = parseInt(this.div.style.height);
        }
    },
    /**
    * @return {OpenLayers.LonLat}
    */
    getCenter: function () {
        return this.center;
    },

    /**
    * @return {OpenLayers.Bounds}
    */
    getExtent: function () {
        if (this.center) {
            var res = this.getResolution();
            var size = this.getSize();
            var w_deg = size.w * res;
            var h_deg = size.h * res;
            return new OpenLayers.Bounds(
                this.center.lon - w_deg / 2, 
                this.center.lat - h_deg / 2,
                this.center.lon + w_deg / 2,
                this.center.lat + h_deg / 2);
        } else {
            return null;
        }
    },

    /**
    * @return {OpenLayers.Bounds}
    */
    getFullExtent: function () {
        return this.maxExtent;
    },
    
    getZoomLevels: function() {
        return this.maxZoomLevel;
    },

    /**
    * @param {OpenLayers.Bounds} bounds
    *
    * @return {int}
    */
    getZoomForExtent: function (bounds) {
        var size = this.getSize();
        var width = bounds.getWidth();
        var height = bounds.getHeight();
        var deg_per_pixel = (width > height ? width / size.w : height / size.h);
        var zoom = Math.log(this.maxResolution / deg_per_pixel) / Math.log(2);
        return Math.floor(Math.max(zoom, 0)); 
    },
    
    /**
     * @param {OpenLayers.Pixel} layerPx
     * 
     * @returns px translated into screen pixel coordinates
     * @type OpenLayers.Pixel
     */
    getScreenPxFromLayerPx:function(layerPx) {
        var screenPx = layerPx.copyOf();

        screenPx.x += parseInt(this.layerContainerDiv.style.left);
        screenPx.y += parseInt(this.layerContainerDiv.style.top);

        return screenPx;
    },
    
    /**
     * @param {OpenLayers.Pixel} screenPx
     * 
     * @returns px translated into screen pixel coordinates
     * @type OpenLayers.Pixel
     */
    getLayerPxFromScreenPx:function(screenPx) {
        var layerPx = screenPx.copyOf();

        layerPx.x -= parseInt(this.layerContainerDiv.style.left);
        layerPx.y -= parseInt(this.layerContainerDiv.style.top);

        return layerPx;
    },


    /**
    * @param {OpenLayers.Pixel} px
    *
    * @return {OpenLayers.LonLat} 
    */
    getLonLatFromLayerPx: function (px) {
       //adjust for displacement of layerContainerDiv
       px = this.getScreenPxFromLayerPx(px);
       return this.getLonLatFromScreenPx(px);         
    },
    
    /**
    * @param {OpenLayers.Pixel} screenPx
    *
    * @returns An OpenLayers.LonLat which is the passed-in screen 
    *          OpenLayers.Pixel, translated into lon/lat given the 
    *          current extent and resolution
    * @type OpenLayers.LonLat
    */
    getLonLatFromScreenPx: function (screenPx) {
        var center = this.getCenter();        //map center lon/lat
        var res  = this.getResolution();
        var size = this.getSize();
    
        var delta_x = screenPx.x - (size.w / 2);
        var delta_y = screenPx.y - (size.h / 2);
        
        return new OpenLayers.LonLat(center.lon + delta_x * res ,
                                     center.lat - delta_y * res); 
    },

    /**
    * @param {OpenLayers.LonLat} lonlat
    *
    * @returns An OpenLayers.Pixel which is the passed-in OpenLayers.LonLat, 
    *          translated into layer pixels given the current extent 
    *          and resolution
    * @type OpenLayers.Pixel
    */
    getLayerPxFromLonLat: function (lonlat) {
       //adjust for displacement of layerContainerDiv
       var px = this.getScreenPxFromLonLat(lonlat);
       return this.getLayerPxFromScreenPx(px);         
    },

    /**
    * @param {OpenLayers.LonLat} lonlat
    *
    * @returns An OpenLayers.Pixel which is the passed-in OpenLayers.LonLat, 
    *          translated into screen pixels given the current extent 
    *          and resolution
    * @type OpenLayers.Pixel
    */
    getScreenPxFromLonLat: function (lonlat) {
        var resolution = this.getResolution();
        var extent = this.getExtent();
        return new OpenLayers.Pixel(
                       Math.round(1/resolution * (lonlat.lon - extent.left)),
                       Math.round(1/resolution * (extent.top - lonlat.lat))
                       );    
    },

    /**
    * @param {OpenLayers.LonLat} lonlat
    * @param {int} zoom
    */
    setCenter: function (lonlat, zoom) {
        if (this.center) { // otherwise there's nothing to move yet
            this.moveLayerContainer(lonlat);
        }
        this.center = lonlat.copyOf();
        var zoomChanged = null;
        if (zoom != null && zoom != this.zoom 
            && zoom >= 0 && zoom <= this.getZoomLevels()) {
            zoomChanged = (this.zoom == null ? 0 : this.zoom);
            this.zoom = zoom;
        }

        this.events.triggerEvent("movestart");
        this.moveToNewExtent(zoomChanged);
        this.events.triggerEvent("moveend");
    },
    
    moveToNewExtent: function (zoomChanged) {
        if (zoomChanged != null) { // reset the layerContainerDiv's location
            this.layerContainerDiv.style.left = "0px";
            this.layerContainerDiv.style.top  = "0px";

            //redraw popups
            for (var i = 0; i < this.popups.length; i++) {
                this.popups[i].updatePosition();
            }

        }
        var bounds = this.getExtent();
        for (var i = 0; i < this.layers.length; i++) {
            this.layers[i].moveTo(bounds, (zoomChanged != null));
        }
        this.events.triggerEvent("move");
        if (zoomChanged != null)
            this.events.triggerEvent("zoomend", 
                {oldZoom: zoomChanged, newZoom: this.zoom});
    },

    /**
     * zoomIn
     * Increase zoom level by one.
     */
    zoomIn: function() {
        if (this.zoom != null && this.zoom <= this.getZoomLevels()) {
            this.zoomTo( this.zoom += 1 );
        }
        
    },
    
    /**
     * zoomTo
     * Set Zoom To int
     */
    zoomTo: function(zoom) {
       if (zoom >= 0 && zoom <= this.getZoomLevels()) {
            var oldZoom = this.zoom;
            this.zoom = zoom;
            this.moveToNewExtent(oldZoom);
       }
    },

    /**
     * zoomOut
     * Decrease zoom level by one.
     */
    zoomOut: function() {
        if (this.zoom != null && this.zoom > 0) {
            this.zoomTo( this.zoom - 1 );
        }
    },
    
    zoomExtent: function() {
        var fullExtent = this.getFullExtent();
        var oldZoom = this.zoom;
        this.setCenter(
          new OpenLayers.LonLat((fullExtent.left+fullExtent.right)/2,
                                (fullExtent.bottom+fullExtent.top)/2),
                                0
                               );
    },

    /**
    * @param {OpenLayers.LonLat} lonlat
    */
    moveLayerContainer: function (lonlat) {
        var container = this.layerContainerDiv;
        var resolution = this.getResolution();

        var deltaX = Math.round((this.center.lon - lonlat.lon) / resolution);
        var deltaY = Math.round((this.center.lat - lonlat.lat) / resolution);
     
        var offsetLeft = parseInt(container.style.left);
        var offsetTop  = parseInt(container.style.top);

        container.style.left = (offsetLeft + deltaX) + "px";
        container.style.top  = (offsetTop  - deltaY) + "px";
    },

    CLASS_NAME: "OpenLayers.Map"
};
OpenLayers.Layer = Class.create();

OpenLayers.Layer.prototype = {

    // str
    name: null,

    // DOMElement
    div: null,

    /** This variable is set in map.addLayer, not within the layer itself
    * @type OpenLayers.Map */
    map: null,

    // str -- projection for use in WFS, WMS, etc.
    projection: null,
    
    /**
    * @param {str} name
    */
    initialize: function(name) {
        if (arguments.length > 0) {
            this.name = name;
            if (this.div == null) {
                this.div = OpenLayers.Util.createDiv();
                this.div.style.width = "100%";
                this.div.style.height = "100%";
            }
        }
    },
    
    /**
     * Destroy is a destructor: this is to alleviate cyclic references which
     * the Javascript garbage cleaner can not take care of on its own.
    */
    destroy: function() {
        this.map = null;
    },

    /**
    * @params {OpenLayers.Bounds} bound
    * @params {bool} zoomChanged tells when zoom has changed, as layers have to do some init work in that case.
    */
    moveTo: function (bound,zoomChanged) {
        // not implemented here
        return;
    },
    
    /**
    * @return {bool}
    */
    getVisibility: function() {
        return (this.div.style.display != "none");
    },

    /** 
    * @param {bool} visible
    */
    setVisibility: function(visible) {
        this.div.style.display = (visible) ? "block" : "none";
        if ((visible) && (this.map != null)) {
            this.moveTo(this.map.getExtent());
        }
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer"
};
/**
* @class
*/
OpenLayers.Icon = Class.create();
OpenLayers.Icon.prototype = {
    
    /** image url
    * @type String */
    url: null,
    
    /** @type OpenLayers.Size */
    size:null,

    /** distance in pixels to offset the image when being rendered
    * @type OpenLayers.Pixel */
    offset: null,    
    
    /** Function to calculate the offset (based on the size) 
     * @type OpenLayers.Pixel */
    calculateOffset: null,    
    
    /** @type DOMElement */
    imageDiv: null,

    /** @type OpenLayers.Pixel */
    px: null,
    
    /** 
    * @constructor
    *
    * @param {String} url
    * @param {OpenLayers.Size} size
    * @param {Function} calculateOffset
    */
    initialize: function(url, size, offset, calculateOffset) {
        this.url = url;
        this.size = (size) ? size : new OpenLayers.Size(20,20);
        this.offset = (offset) ? offset : new OpenLayers.Pixel(0,0);
        this.calculateOffset = calculateOffset;

        this.imageDiv = OpenLayers.Util.createAlphaImageDiv();
    },

    /** 
    * @returns A fresh copy of the icon.
    * @type OpenLayers.Icon
    */
    clone: function() {
        return new OpenLayers.Icon(this.size, this.url, this.offset);
    },
    
    /**
     * @param {OpenLayers.Size} size
     */
    setSize: function(size) {
        if (size != null) {
            this.size = size;
        }
        this.draw();
    },

    /** 
    * @param {OpenLayers.Pixel} px
    * 
    * @return A new DOM Image of this icon set at the location passed-in
    * @type DOMElement
    */
    draw: function(px) {
        OpenLayers.Util.modifyAlphaImageDiv(this.imageDiv, 
                                            null, 
                                            null, 
                                            this.size, 
                                            this.url, 
                                            "absolute");
        this.moveTo(px);
        return this.imageDiv;
    }, 

    /**
    * @param {OpenLayers.Pixel} px
    */
    moveTo: function (px) {
        //if no px passed in, use stored location
        if (px != null) {
            this.px = px;
        }

        if ((this.px != null) && (this.imageDiv != null)) {
            if (this.calculateOffset) {
                this.offset = this.calculateOffset(this.size);  
            }
            var offsetPx = this.px.offset(this.offset);
            OpenLayers.Util.modifyAlphaImageDiv(this.imageDiv, null, offsetPx);
        }
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Icon"
};/**
* @class
*/
OpenLayers.Marker = Class.create();
OpenLayers.Marker.prototype = {
    
    /** @type OpenLayers.Icon */
    icon: null,

    /** location of object
    * @type OpenLayers.LonLat */
    lonlat: null,
    
    /** @type OpenLayers.Events*/
    events: null,
    
    /** @type OpenLayers.Map */
    map: null,
    
    /** 
    * @constructor
    *
    * @param {OpenLayers.Icon} icon
    * @param {OpenLayers.LonLat lonlat
    */
    initialize: function(lonlat, icon) {
        this.lonlat = lonlat;
        this.icon = (icon) ? icon : OpenLayers.Marker.defaultIcon();

        this.events = new OpenLayers.Events(this, this.icon.imageDiv, null);
    },
    
    /** 
    * @param {OpenLayers.Pixel} px
    * 
    * @return A new DOM Image with this marker´s icon set at the 
    *         location passed-in
    * @type DOMElement
    */
    draw: function(px) {
        return this.icon.draw(px);
    }, 

    /**
    * @param {OpenLayers.Pixel} px
    */
    moveTo: function (px) {
        if ((px != null) && (this.icon != null)) {
            this.icon.moveTo(px);
        }            
    },

    /**
     * @param {float} inflate
     */
    inflate: function(inflate) {
        if (this.icon) {
            var newSize = new OpenLayers.Size(this.icon.size.w * inflate,
                                              this.icon.size.h * inflate);
            this.icon.setSize(newSize);
        }        
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Marker"
};


/** 
 * @returns A default OpenLayers.Icon to use for a marker
 * @type OpenLayers.Icon
 */
OpenLayers.Marker.defaultIcon = function() {
    var url = OpenLayers.Util.getImagesLocation() + "marker.png";
    var size = new OpenLayers.Size(21, 25);
    var calculateOffset = function(size) {
                    return new OpenLayers.Pixel(-(size.w/2), -size.h);
                 };

    return new OpenLayers.Icon(url, size, null, calculateOffset);        
};
    

/**
* @class
*/
OpenLayers.Popup = Class.create();

OpenLayers.Popup.count = 0;
OpenLayers.Popup.WIDTH = 200;
OpenLayers.Popup.HEIGHT = 200;
OpenLayers.Popup.COLOR = "white";
OpenLayers.Popup.OPACITY = 1;
OpenLayers.Popup.BORDER = "0px";

OpenLayers.Popup.prototype = {

    /** @type OpenLayers.Events*/
    events: null,
    
    /** @type String */
    id: "",

    /** @type OpenLayers.LonLat */
    lonlat: null,

    /** @type DOMElement */
    div: null,

    /** @type OpenLayers.Size*/
    size: null,    

    /** @type String */
    contentHTML: "",
    
    /** @type String */
    backgroundColor: "",
    
    /** @type float */
    opacity: "",

    /** @type String */
    border: "",

    /** this gets set in Map.js when the popup is added to the map
     * @type OpenLayers.Map */
    map: null,

    /** 
    * @constructor
    * 
    * @param {String} id
    * @param {OpenLayers.LonLat} lonlat
    * @param {OpenLayers.Size} size
    * @param {String} contentHTML
    */
    initialize:function(id, lonlat, size, contentHTML) {
        OpenLayers.Popup.count += 1;
        this.id = (id != null) ? id : "Popup" + OpenLayers.Popup.count;
        this.lonlat = lonlat;
        this.size = (size != null) ? size 
                                  : new OpenLayers.Size(
                                                   OpenLayers.Popup.WIDTH,
                                                   OpenLayers.Popup.HEIGHT);
        if (contentHTML != null) { 
             this.contentHTML = contentHTML;
        }
        this.backgroundColor = OpenLayers.Popup.COLOR;
        this.opacity = OpenLayers.Popup.OPACITY;
        this.border = OpenLayers.Popup.BORDER;

        this.div = OpenLayers.Util.createDiv(this.id + "_div", null, null, 
                                             null, null, null, "hidden");

        this.events = new OpenLayers.Events(this, this.div, null);
    },

    /** 
    */
    destroy: function() {
        if ((this.div) && (this.div.parentNode)) {
            this.div.parentNode.removeChild(this.div);
        }
        this.div = null;
        this.map = null;
    },

    /** 
    * @param {OpenLayers.Pixel} px
    * 
    * @returns Reference to a div that contains the drawn popup
    * @type DOMElement
    */
    draw: function(px) {
        if (px == null) {
            if ((this.lonlat != null) && (this.map != null)) {
                px = this.map.getLayerPxFromLonLat(this.lonlat);
            }
        }
        
        this.setSize();
        this.setBackgroundColor();
        this.setOpacity();
        this.setBorder();
        this.setContentHTML();
        this.moveTo(px);

        return this.div;
    },

    /** 
     * if the popup has a lonlat and its map members set, 
     *  then have it move itself to its proper position
     */
    updatePosition: function() {
        if ((this.lonlat) && (this.map)) {
                var px = this.map.getLayerPxFromLonLat(this.lonlat);
                this.moveTo(px);            
        }
    },

    /**
    * @param {OpenLayers.Pixel} px
    */
    moveTo: function(px) {
        if ((px != null) && (this.div != null)) {
            this.div.style.left = px.x + "px";
            this.div.style.top = px.y + "px";
        }
    },

    /**
     * @returns Boolean indicating whether or not the popup is visible
     * @type Boolean
     */
    visible: function() {
        return Element.visible(this.div);
    },

    /**
     * 
     */
    toggle: function() {
        Element.toggle(this.div);
    },

    /**
     *
     */
    show: function() {
        Element.show(this.div);
    },

    /**
     *
     */
    hide: function() {
        Element.hide(this.div);
    },

    /**
    * @param {OpenLayers.Size} size
    */
    setSize:function(size) { 
        if (size != undefined) {
            this.size = size; 
        }
        
        if (this.div != null) {
            this.div.style.width = this.size.w;
            this.div.style.height = this.size.h;
        }
    },  

    /**
    * @param {String} color
    */
    setBackgroundColor:function(color) { 
        if (color != undefined) {
            this.backgroundColor = color; 
        }
        
        if (this.div != null) {
            this.div.style.backgroundColor = this.backgroundColor;
        }
    },  
    
    /**
    * @param {float} opacity
    */
    setOpacity:function(opacity) { 
        if (opacity != undefined) {
            this.opacity = opacity; 
        }
        
        if (this.div != null) {
            // for Mozilla and Safari
            this.div.style.opacity = this.opacity;

            // for IE
            this.div.style.filter = 'alpha(opacity=' + this.opacity*100 + ')';
        }
    },  
    
    /**
    * @param {int} border
    */
    setBorder:function(border) { 
        if (border != undefined) {
            this.border = border;
        }
        
        if (this.div != null) {
            this.div.style.border = this.border;
        }
    },      
    
    /**
    * @param {String} contentHTML
    */
    setContentHTML:function(contentHTML) {
        if (contentHTML != null) {
            this.contentHTML = contentHTML;
        }
        
        if (this.div != null) {
            this.div.innerHTML = this.contentHTML;
        }    
    },

    CLASS_NAME: "OpenLayers.Popup"
};
/*
 * OpenLayers.Tile 
 *
 * @class This is a class designed to designate a single tile, however
 * it is explicitly designed to do relatively little. Tiles store information
 * about themselves -- such as the URL that they are related to, and their 
 * size - but do not add themselves to the layer div automatically, for 
 * example.
 */
OpenLayers.Tile = Class.create();
OpenLayers.Tile.prototype = {
    
    /** @type OpenLayers.Layer */
    layer: null,
    
    /** @type String url of the request */
    url:null,

    /** @type OpenLayers.Bounds */
    bounds:null,
    
    /** @type OpenLayers.Size */
    size:null,
    
    /** Top Left pixel of the tile
    * @type OpenLayers.Pixel */
    position:null,

    /**
    * @constructor
    *
    * @param {OpenLayers.Layer} layer
    * @param {OpenLayers.Pixel} position
    * @param {OpenLayers.Bounds} bounds
    * @param {String} url
    * @param {OpenLayers.Size} size
    */   
    initialize: function(layer, position, bounds, url, size) {
        if (arguments.length > 0) {
            this.layer = layer;
            this.position = position;
            this.bounds = bounds;
            this.url = url;
            this.size = size;
        }
    },
    
    /** nullify references to prevent circular references and memory leaks
    */
    destroy:function() {
        this.layer  = null;
        this.bounds = null;
        this.size = null;
    },

    /**
    */
    draw:function() {

    // HACK HACK - should we make it a standard to put this sort of warning
    //             message in functions that are supposed to be overridden?
    //
    //        ol.Log.warn(this.CLASS_NAME + ": draw() not implemented");

    },

    /** remove this tile from the ds
    */
    remove:function() {
    },

    /**
    * @type OpenLayers.Pixel
    */
    getPosition: function() {
        return this.position;
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Tile"
};

/**
 * @class
 */
OpenLayers.Feature = Class.create();
OpenLayers.Feature.prototype= {

    /** @type OpenLayers.Events */
    events:null,

    /** @type OpenLayers.Layer */
    layer: null,

    /** @type String */
    id: null,
    
    /** @type OpenLayers.LonLat */
    lonlat:null,

    /** @type Object */
    data:null,

    /** @type OpenLayers.Marker */
    marker: null,

    /** @type OpenLayers.Popup */
    popup: null,

    /** 
     * @constructor
     * 
     * @param {OpenLayers.Layer} layer
     * @param {String} id
     * @param {OpenLayers.LonLat} lonlat
     * @param {Object} data
     */
    initialize: function(layer, lonlat, data, id) {
        this.layer = layer;
        this.lonlat = lonlat;
        this.data = (data != null) ? data : new Object();
        this.id = (id ? id : 'f' + Math.random());
    },

    /**
     * 
     */
    destroy: function() {
        this.layer = null;
    },
    

    /**
     * @returns A Marker Object created from the 'lonlat' and 'icon' properties
     *          set in this.data. If no 'lonlat' is set, returns null. If no
     *          'icon' is set, OpenLayers.Marker() will load the default image
     * @type OpenLayers.Marker
     */
    createMarker: function() {

        var marker = null;
        
        if (this.lonlat != null) {
            this.marker = new OpenLayers.Marker(this.lonlat, this.data.icon);
        }
        return this.marker;
    },

    /**
     * 
     */
    createPopup: function() {

        if (this.lonlat != null) {
            
            var id = this.id + "_popup";
            var anchor = (this.marker) ? this.marker.icon : null;

            this.popup = new OpenLayers.Popup.AnchoredBubble(id, 
                                                    this.lonlat,
                                                    this.data.popupSize,
                                                    this.data.popupContentHTML,
                                                    anchor); 
        }        
        return this.popup;
    },

    CLASS_NAME: "OpenLayers.Feature"
};
/**
 * @class
 */
OpenLayers.Feature.WFS = Class.create();
OpenLayers.Feature.WFS.prototype = 
  Object.extend( new OpenLayers.Feature(), {
      
    /** 
     * @constructor
     * 
     * @param {OpenLayers.Layer} layer
     * @param {XMLNode} xmlNode
     */
    initialize: function(layer, xmlNode) {
        var newArguments = arguments;
        if (arguments.length > 0) {
            var data = this.processXMLNode(xmlNode);
            newArguments = new Array(layer, data.lonlat, data, data.id)
        }
        OpenLayers.Feature.prototype.initialize.apply(this, newArguments);
        
        if (arguments.length > 0) {
            this.createMarker();
            this.layer.addMarker(this.marker);
        }
    },

    /**
     * @param {XMLNode} xmlNode
     * 
     * @returns Data Object with 'id', 'lonlat', and private properties set
     * @type Object
     */
    processXMLNode: function(xmlNode) {
        //this should be overridden by subclasses

        // must return an Object with 'id' and 'lonlat' values set
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Feature.WFS"
});
  
  
  
  

// @require: OpenLayers/Tile.js
/**
* @class
*/
OpenLayers.Tile.Image = Class.create();
OpenLayers.Tile.Image.prototype = 
  Object.extend( new OpenLayers.Tile(), {
    
    /** @type DOMElement img */
    img:null,

    /** 
    * @constructor
    *
    * @param {OpenLayers.Grid} layer
    * @param {OpenLayers.Pixel} position
    * @param {OpenLayers.Bounds} bounds
    * @param {String} url
    * @param {OpenLayers.Size} size
    */
    initialize: function(layer, position, bounds, url, size) {
        OpenLayers.Tile.prototype.initialize.apply(this, arguments);
    },

    /**
    */
    draw:function() {
        OpenLayers.Tile.prototype.draw.apply(this, arguments);
        this.img = OpenLayers.Util.createImage(null,
                                               this.position,
                                               this.size,
                                               this.url,
                                               "absolute");
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Tile.Image"
  }
);
// @require: OpenLayers/Tile.js
/**
* @class
*/
OpenLayers.Tile.WFS = Class.create();
OpenLayers.Tile.WFS.prototype = 
  Object.extend( new OpenLayers.Tile(), {

    /** @type Array of Function */
    handlers: null,
    
    /** @type Array(OpenLayers.Feature)*/ 
    features: null,


    /** 
    * @constructor
    *
    * @param {OpenLayers.Layer} layer
    * @param {OpenLayers.Pixel} position
    * @param {OpenLayers.Bounds} bounds
    * @param {String} url
    * @param {OpenLayers.Size} size
    */
    initialize: function(layer, position, bounds, url, size) {
        OpenLayers.Tile.prototype.initialize.apply(this, arguments);
        
        this.features = new Array();
    },

    /**
    */
    draw:function() {
        OpenLayers.Tile.prototype.draw.apply(this, arguments);
        this.loadFeaturesForRegion(this.requestSuccess);        
    },

    
    /** get the full request string from the ds and the tile params 
    *     and call the AJAX loadURL(). 
    *
    *     input are function pointers for what to do on success and failure.
    * 
    * @param {function} success
    * @param {function} failure
    */
    loadFeaturesForRegion:function(success, failure) {

        if (!this.loaded) {
        
            if (this.url != "") {
        
                // TODO: Hmmm, this stops multiple loads of the data when a 
                //       result isn't immediately retrieved, but it's hacky. 
                //       Do it better.
                this.loaded = true; 
//                ol.Log.info("request string: " + this.url);
                OpenLayers.loadURL(this.url, null, this, success, failure);
            }
        }
    },
    
    /** Return from AJAX request
    *
    * @param {} request
    */
    requestSuccess:function(request) {
        var doc = request.responseXML;
        
        if (!doc || request.fileType!="XML") {
            doc = OpenLayers.parseXMLString(request.responseText);
        }
        
        var resultFeatures = OpenLayers.Util.getNodes(doc, "gml:featureMember");
//        ol.Log.info(this.layer.name + " found " +
//                     resultFeatures.length + " features");
            
        //clear old featureList
        this.features = new Array();

        for (var i=0; i < resultFeatures.length; i++) {
        
            var feature = new this.layer.featureClass(this.layer, 
                                                      resultFeatures[i]);
            this.features.append(feature);
        }
        
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Tile.WFS"
  }
);

// @require: OpenLayers/Layer.js

OpenLayers.Layer.Google = Class.create();
OpenLayers.Layer.Google.prototype = Object.extend( new OpenLayers.Layer(), {
    // gmap stores the Google Map element
    gmap:null,
    initialize: function(name) {
        OpenLayers.Layer.prototype.initialize.apply(this, [name]);
        this.gmap = new GMap2(this.div);
    },
    moveTo: function() {
        center = this.map.getCenter();
        this.gmap.setCenter(
           new GLatLng(center.lat, center.lon), 
           this.map.getZoom()
        );
    } 
    
});
// @require: OpenLayers/Layer.js
// @require: OpenLayers/Util.js
OpenLayers.Layer.Grid = Class.create();
OpenLayers.Layer.Grid.TILE_WIDTH = 256;
OpenLayers.Layer.Grid.TILE_HEIGHT = 256;
OpenLayers.Layer.Grid.prototype = Object.extend( new OpenLayers.Layer(), {
    
    // str: url
    url: null,

    // hash: params
    params: null,

    // tileSize: OpenLayers.Size
    tileSize: null,
    
    // grid: Array(Array())
    // this is an array of rows, each row is an array of tiles
    grid: null,

    /**
    * @param {str} name
    * @param {str} url
    * @param {hash} params
    */
    initialize: function(name, url, params) {
        var newArguments = arguments;
        if (arguments.length > 0) {
            newArguments = [name];
        }          
        OpenLayers.Layer.prototype.initialize.apply(this, newArguments);
        this.url = url;
        this.params = params;
        this.tileSize = new OpenLayers.Size(OpenLayers.Layer.Grid.TILE_WIDTH,
                                            OpenLayers.Layer.Grid.TILE_HEIGHT);
    },

    setTileSize: function (size) {
        this.tileSize = size.copyOf();
    },

    /** 
     * moveTo
     * moveTo is a function called whenever the map is moved. All the moving
     * of actual 'tiles' is done by the map, but moveTo's role is to accept
     * a bounds and make sure the data that that bounds requires is pre-loaded.
     * @param {OpenLayers.Bounds}
     */
    moveTo:function(bounds,zoomChanged) {
        if (!this.getVisibility()) {
            if (zoomChanged) {
                this.grid = null;
            }
            return;
        }
        if (!this.grid || zoomChanged) {
            this._initTiles();
        } else { 
            var i = 0;
            while (this.getGridBounds().bottom > bounds.bottom) {
               this.insertRow(false); 
            }
            while (this.getGridBounds().left > bounds.left) {
               this.insertColumn(true); 
            }
            while (this.getGridBounds().top < bounds.top) {
               this.insertRow(true); 
            }
            while (this.getGridBounds().right < bounds.right) {
               this.insertColumn(false); 
            }
        }
    },
    getGridBounds:function() {
        var topLeftTile = this.grid[0][0];
        var bottomRightTile = this.grid[this.grid.length-1][this.grid[0].length-1];
        return new OpenLayers.Bounds(topLeftTile.bounds.left, 
                                     bottomRightTile.bounds.bottom,
                                     bottomRightTile.bounds.right, 
                                     topLeftTile.bounds.top);
    },
    
    /**
    */
    _initTiles:function() {

        //first of all, clear out the main div
        this.div.innerHTML = "";

        //now clear out the old grid and start a new one
        this.clearGrid();
        this.grid = new Array();

        var viewSize = this.map.getSize();
        var bounds = this.map.getExtent();
        var extent = this.map.getFullExtent();
        var resolution = this.map.getResolution();
        var tilelon = resolution*this.tileSize.w;
        var tilelat = resolution*this.tileSize.h;
        
        var offsetlon = bounds.left - extent.left;
        var tilecol = Math.floor(offsetlon/tilelon);
        var tilecolremain = offsetlon/tilelon - tilecol;
        var tileoffsetx = -tilecolremain * this.tileSize.w;
        var tileoffsetlon = extent.left + tilecol * tilelon;
        
        var offsetlat = bounds.top - (extent.bottom + tilelat);  
        var tilerow = Math.ceil(offsetlat/tilelat);
        var tilerowremain = tilerow - offsetlat/tilelat;
        var tileoffsety = -tilerowremain * this.tileSize.h;
        var tileoffsetlat = extent.bottom + tilerow * tilelat;
        
        tileoffsetx = Math.round(tileoffsetx); // heaven help us
        tileoffsety = Math.round(tileoffsety);

        this.origin = new OpenLayers.Pixel(tileoffsetx,tileoffsety);

        var startX = tileoffsetx; 
        var startLon = tileoffsetlon;
        
        do {
            var row = new Array();
            this.grid.append(row);
            tileoffsetlon = startLon;
            tileoffsetx = startX;
            do {
                var tileBounds = new OpenLayers.Bounds(tileoffsetlon, 
                                                       tileoffsetlat, 
                                                       tileoffsetlon+tilelon,
                                                       tileoffsetlat+tilelat);

                var tile = this.addTile(tileBounds, 
                                        new OpenLayers.Pixel(tileoffsetx,
                                                             tileoffsety)
                                                            );
                row.append(tile);
     
                tileoffsetlon += tilelon;       
                tileoffsetx += this.tileSize.w;
            } while (tileoffsetlon < bounds.right)  
            
            tileoffsetlat -= tilelat;
            tileoffsety += this.tileSize.h;
        } while(tileoffsetlat > bounds.bottom - tilelat)

    },
    
    /**
    * @param {bool} prepend - if true, prepend to beginning.
    *                         if false, then append to end
    */
    insertRow:function(prepend) {
        var modelRowIndex = (prepend) ? 0 : (this.grid.length - 1);
        var modelRow = this.grid[modelRowIndex];

        var newRow = new Array();

        var resolution = this.map.getResolution();
        var deltaY = (prepend) ? -this.tileSize.h : this.tileSize.h;
        var deltaLat = resolution * -deltaY;

        for (var i=0; i < modelRow.length; i++) {
            var modelTile = modelRow[i];
            var bounds = modelTile.bounds.copyOf();
            var position = modelTile.position.copyOf();
            bounds.bottom = bounds.bottom + deltaLat;
            bounds.top = bounds.top + deltaLat;
            position.y = position.y + deltaY;
            var newTile = this.addTile(bounds, position);
            newRow.append(newTile);
        }
        
        if (newRow.length>0){
            if (prepend) {
                this.grid.prepend(newRow);
            } else {
                this.grid.append(newRow);
            }
        }       
    },

    /**
    * @param {bool} prepend - if true, prepend to beginning.
    *                         if false, then append to end
    */
    insertColumn:function(prepend) {
        var modelCellIndex;
        var deltaX = (prepend) ? -this.tileSize.w : this.tileSize.w;
        var resolution = this.map.getResolution();
        var deltaLon = resolution * deltaX;

        for (var i=0; i<this.grid.length; i++) {
            var row = this.grid[i];
            modelTileIndex = (prepend) ? 0 : (row.length - 1);
            var modelTile = row[modelTileIndex];
            
            var bounds = modelTile.bounds.copyOf();
            var position = modelTile.position.copyOf();
            bounds.left = bounds.left + deltaLon;
            bounds.right = bounds.right + deltaLon;
            position.x = position.x + deltaX;
            var newTile = this.addTile(bounds, position);
            
            if (prepend) {
                row = row.prepend(newTile);
            } else {
                row = row.append(newTile);
            }
        }
    },
    /** combine the ds's serverPath with its params and the tile's params. 
    *   
    *    does checking on the serverPath variable, allowing for cases when it 
    *     is supplied with trailing ? or &, as well as cases where not. 
    *
    *    return in formatted string like this:
    *        "server?key1=value1&key2=value2&key3=value3"
    *
    * @return {str}
    */
    getFullRequestString:function(params) {
        var requestString = "";        
        this.params.srs = this.projection;
        // concat tile params with layer params and convert to string
        var allParams = Object.extend(params, this.params);
        var paramsString = OpenLayers.Util.getParameterString(allParams);

        var server = this.url;
        var lastServerChar = server.charAt(server.length - 1);

        if ((lastServerChar == "&") || (lastServerChar == "?")) {
            requestString = server + paramsString;
        } else {
            if (server.indexOf('?') == -1) {
                //serverPath has no ? -- add one
                requestString = server + '?' + paramsString;
            } else {
                //serverPath contains ?, so must already have paramsString at the end
                requestString = server + '&' + paramsString;
            }
        }
        return requestString;
    },
    
    /** go through and remove all tiles from the grid, calling
    *    destroy() on each of them to kill circular references
    * 
    * @private
    */
    clearGrid:function() {
        if (this.grid) {
            while(this.grid.length > 0) {
                var row = this.grid[0];
                while(row.length > 0) {
                    var tile = row[0];
                    tile.destroy();
                    row.remove(tile);
                }
                this.grid.remove(row);                   
            }
        }
    }
    
});
// @require: OpenLayers/Layer.js
/**
* @class
*/
OpenLayers.Layer.Markers = Class.create();
OpenLayers.Layer.Markers.prototype = 
  Object.extend( new OpenLayers.Layer(), {
    
    /** internal marker list
    * @type Array(OpenLayers.Marker) */
    markers: null,
    
    /**
    * @constructor
    *
    * @param {String} name
    */
    initialize: function(name) {
        OpenLayers.Layer.prototype.initialize.apply(this, arguments);
        this.markers = new Array();
    },
    
    /** 
    * @param {OpenLayers.Bounds} bounds
    * @param {Boolean} zoomChanged
    */
    moveTo: function(bounds, zoomChanged) {
        if (zoomChanged) {
            this.redraw();
        }
    },

    /**
    * @param {OpenLayers.Marker} marker
    */
    addMarker: function(marker) {
        this.markers.append(marker);
        if (this.map && this.map.getExtent()) {
            this.drawMarker(marker);
        }
    },


    /** clear all the marker div's from the layer and then redraw all of them.
    *    Use the map to recalculate new placement of markers.
    */
    redraw: function() {
        for(i=0; i < this.markers.length; i++) {
            this.drawMarker(this.markers[i]);
        }
    },

    /** Calculate the screen pixel location for the marker, create it, and 
    *    add it to the layer's div
    * 
    * @private 
    * 
    * @param {OpenLayers.Marker} marker
    */
    drawMarker: function(marker) {
        var px = this.map.getLayerPxFromLonLat(marker.lonlat);
        var markerImg = marker.draw(px);
        if (!marker.drawn) {
            this.div.appendChild(markerImg);
            marker.drawn = true;
        }
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.Markers"
});
// @require: OpenLayers/Layer/Markers.js

/**
* @class
*/
OpenLayers.Layer.Text = Class.create();
OpenLayers.Layer.Text.prototype = 
  Object.extend( new OpenLayers.Layer.Markers(), {

    /** store url of text file
    * @type str */
    location:null,

    /** @type OpenLayers.Feature */
    selectedFeature: null,

    /**
    * @constructor
    *
    * @param {String} name
    * @param {String} location
    */
    initialize: function(name, location) {
        OpenLayers.Layer.Markers.prototype.initialize.apply(this, [name]);
        this.location = location;
        new Ajax.Request(location, 
          { method: 'get', onComplete:this.parseData.bind(this) } );
    },
    
    /**
     * @param {?} ajaxRequest
     */
    parseData: function(ajaxRequest) {
        var text = ajaxRequest.responseText;
        var lines = text.split('\n');
        var columns;
        // length - 1 to allow for trailing new line
        for (var lcv = 0; lcv < (lines.length - 1); lcv++) {
            var currLine = lines[lcv].replace(/^\s*/,'').replace(/\s*$/,'');
        
            if (currLine.charAt(0) != '#') { /* not a comment */
            
                if (!columns) {
                    //First line is columns
                    columns = currLine.split('\t');
                } else {
                    var vals = currLine.split('\t');
                    var location = new OpenLayers.LonLat(0,0);
                    var title; var url;
                    var icon, iconSize, iconOffset;
                    var set = false;
                    for (var valIndex = 0; valIndex < vals.length; valIndex++) {
                        if (vals[valIndex]) {
                            if (columns[valIndex] == 'point') {
                                var coords = vals[valIndex].split(',');
                                location.lat = parseFloat(coords[0]);
                                location.lon = parseFloat(coords[1]);
                                set = true;
                            } else if (columns[valIndex] == 'lat') {
                                location.lat = parseFloat(vals[valIndex]);
                                set = true;
                            } else if (columns[valIndex] == 'lon') {
                                location.lon = parseFloat(vals[valIndex]);
                                set = true;
                            } else if (columns[valIndex] == 'title')
                                title = vals[valIndex];
                            else if (columns[valIndex] == 'image' ||
                                     columns[valIndex] == 'icon')
                                url = vals[valIndex];
                            else if (columns[valIndex] == 'iconSize') {
                                var size = vals[valIndex].split(',');
                                iconSize = new OpenLayers.Size(parseFloat(size[0]),
                                                           parseFloat(size[1]));
                            } else if (columns[valIndex] == 'iconOffset') {
                                var offset = vals[valIndex].split(',');
                                iconOffset = new OpenLayers.Pixel(parseFloat(offset[0]),
                                                           parseFloat(offset[1]));
                            } else if (columns[valIndex] == 'title') {
                                title = vals[valIndex];
                            } else if (columns[valIndex] == 'description') {
                                description = vals[valIndex];
                            }
                        }
                    }
                    if (set) {
                      var data = new Object();
                      if (url != null) {
                          data.icon = new OpenLayers.Icon(url, 
                                                          iconSize, 
                                                          iconOffset);
                      } else {
                          data.icon = OpenLayers.Marker.defaultIcon();

                          //allows for the case where the image url is not 
                          // specified but the size is. use a default icon
                          // but change the size
                          if (iconSize != null) {
                              data.icon.setSize(iconSize);
                          }
                        
                      }
                      if ((title != null) && (description != null)) {
                          data['popupContentHTML'] = '<h2>'+title+'</h2><p>'+description+'</p>';
                      }
                      var feature = new OpenLayers.Feature(this, location, data);
                      var marker = feature.createMarker();
                      marker.events.register('click', feature, this.markerClick);
                      this.addMarker(marker);
                    }
                }
            }
        }
    },
    
    /**
     * @param {Event} evt
     */
    markerClick: function(evt) {
        sameMarkerClicked = (this == this.layer.selectedFeature);
        this.layer.selectedFeature = (!sameMarkerClicked) ? this : null;
        for(var i=0; i < this.layer.map.popups.length; i++) {
            this.layer.map.removePopup(this.layer.map.popups[i]);
        }
        if (!sameMarkerClicked) {
            this.layer.map.addPopup(this.createPopup()); 
        }
        Event.stop(evt);
    }
});
     
    
// @require: OpenLayers/Layer/Grid.js
/**
* @class
*/
OpenLayers.Layer.WMS = Class.create();
OpenLayers.Layer.WMS.prototype = 
  Object.extend( new OpenLayers.Layer.Grid(), {

    /** @final @type hash */
    DEFAULT_PARAMS: { service: "WMS",
                      version: "1.1.1",
                      request: "GetMap",
                      styles: "",
                      exceptions: "application/vnd.ogc.se_inimage",
                      format: "image/jpeg"
                     },

    /**
    * @constructor
    *
    * @param {str} name
    * @param {str} url
    * @param {hash} params
    */
    initialize: function(name, url, params) {
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, arguments);
        OpenLayers.Util.applyDefaults(this.params, this.DEFAULT_PARAMS);
    },    
    
    /**
    * @param {String} name
    * @param {hash} params
    *
    * @returns A clone of this OpenLayers.Layer.WMS, with the passed-in
    *          parameters merged in.
    * @type OpenLayers.Layer.WMS
    */
    clone: function (name, params) {
        var mergedParams = {};
        Object.extend(mergedParams, this.params);
        Object.extend(mergedParams, params);
        var obj = new OpenLayers.Layer.WMS(name, this.url, mergedParams);
        obj.setTileSize(this.tileSize);
        return obj;
    },

    /**
    * addTile creates a tile, initializes it (via 'draw' in this case), and 
    * adds it to the layer div. 
    *
    * @param {OpenLayers.Bounds} bounds
    *
    * @returns The added OpenLayers.Tile.Image
    * @type OpenLayers.Tile.Image
    */
    addTile:function(bounds,position) {
        url = this.getFullRequestString(
                     {bbox:bounds.toBBOX(),
                      width:this.tileSize.w,
                      height:this.tileSize.h});
        var tile = new OpenLayers.Tile.Image(this, position, bounds, 
                                             url, this.tileSize);
        tile.draw();
        this.div.appendChild(tile.img);
        return tile;
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.WMS"
});
// @require: OpenLayers/Layer/Grid.js
// @require: OpenLayers/Layer/Markers.js
/**
* @class
*/
OpenLayers.Layer.WFS = Class.create();
OpenLayers.Layer.WFS.prototype = 
  Object.extend(new OpenLayers.Layer.Grid(),
    Object.extend(new OpenLayers.Layer.Markers(), {

    /** @type Object */
    featureClass: null,

    /** @final @type hash */
    DEFAULT_PARAMS: { service: "WFS",
                      version: "1.0.0",
                      request: "GetFeature",
                      typename: "docpoint"
                    },

    /**
    * @constructor
    *
    * @param {str} name
    * @param {str} url
    * @param {hash} params
    * @param {Object} featureClass
    */
    initialize: function(name, url, params, featureClass) {
        this.featureClass = featureClass;
        
        var newArguments = new Array();
        if (arguments.length > 0) {
            newArguments.push(name, url, params);
        }
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, newArguments);
        OpenLayers.Layer.Markers.prototype.initialize.apply(this, newArguments);
    
        if (arguments.length > 0) {
            OpenLayers.Util.applyDefaults(this.params, this.DEFAULT_PARAMS);
        }
    },    
    
    /** 
    * @param {OpenLayers.Bounds} bounds
    * @param {Boolean} zoomChanged
    */
    moveTo: function(bounds, zoomChanged) {
        OpenLayers.Layer.Grid.prototype.moveTo.apply(this, arguments);
        OpenLayers.Layer.Markers.prototype.moveTo.apply(this, arguments);
    },
    
    /**
    * @param {String} name
    * @param {hash} params
    *
    * @returns A clone of this OpenLayers.Layer.WMS, with the passed-in
    *          parameters merged in.
    * @type OpenLayers.Layer.WMS
    */
    clone: function (name, params) {
        var mergedParams = {}
        Object.extend(mergedParams, this.params);
        Object.extend(mergedParams, params);
        var obj = new OpenLayers.Layer.WFS(name, this.url, mergedParams);
        obj.setTileSize(this.tileSize);
        return obj;
    },

    /**
    * addTile creates a tile, initializes it (via 'draw' in this case), and 
    * adds it to the layer div. 
    *
    * @param {OpenLayers.Bounds} bounds
    *
    * @returns The added OpenLayers.Tile.WFS
    * @type OpenLayers.Tile.WFS
    */
    addTile:function(bounds, position) {
        url = this.getFullRequestString(
                     { bbox:bounds.toBBOX() });
        var tile = new OpenLayers.Tile.WFS(this, position, bounds, 
                                           url, this.tileSize);
        tile.draw();
        return tile;
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.WFS"
}
)
);
// @require: OpenLayers/Popup.js

/**
* @class
*/
OpenLayers.Popup.Anchored = Class.create();
OpenLayers.Popup.Anchored.prototype =
   Object.extend( new OpenLayers.Popup(), {

    /** "lr", "ll", "tr", "tl" - relative position of the popup.
     * @type String */
    relativePosition: null,

    /** Object which must have expose a 'size' (OpenLayers.Size) and 
     *                                 'offset' (OpenLayers.Pixel) 
     * @type Object */
    anchor: null,

    /** 
    * @constructor
    * 
    * @param {String} id
    * @param {OpenLayers.LonLat} lonlat
    * @param {OpenLayers.Size} size
    * @param {String} contentHTML
    * @param {Object} anchor  Object which must expose a 
    *                         - 'size' (OpenLayers.Size) and 
    *                         - 'offset' (OpenLayers.Pixel) 
    *                         (this is generally an OpenLayers.Icon)
    */
    initialize:function(id, lonlat, size, contentHTML, anchor) {
        var newArguments = new Array(id, lonlat, size, contentHTML);
        OpenLayers.Popup.prototype.initialize.apply(this, newArguments);

        this.anchor = (anchor != null) ? anchor 
                                       : { size: new OpenLayers.Size(0,0),
                                           offset: new OpenLayers.Pixel(0,0)};
    },

    /** 
    * @param {OpenLayers.Pixel} px
    * 
    * @returns Reference to a div that contains the drawn popup
    * @type DOMElement
    */
    draw: function(px) {
        if (px == null) {
            if ((this.lonlat != null) && (this.map != null)) {
                px = this.map.getLayerPxFromLonLat(this.lonlat);
            }
        }
        
        //calculate relative position
        this.relativePosition = this.calculateRelativePosition(px);
        
        return OpenLayers.Popup.prototype.draw.apply(this, arguments);
    },
    
    /** 
     * @private
     * 
     * @param {OpenLayers.Pixel} px
     * 
     * @returns The relative position ("br" "tr" "tl "bl") at which the popup
     *           should be placed
     * @type String
     */
    calculateRelativePosition:function(px) {
        var lonlat = this.map.getLonLatFromLayerPx(px);        
        
        var extent = this.map.getExtent();
        var quadrant = extent.determineQuadrant(lonlat);
        
        return OpenLayers.Bounds.oppositeQuadrant(quadrant);
    }, 

    /**
    * @param {OpenLayers.Pixel} px
    */
    moveTo: function(px) {
        
        var newPx = this.calculateNewPx(px);
        
        var newArguments = new Array(newPx);        
        OpenLayers.Popup.prototype.moveTo.apply(this, newArguments);
    },
    
    /**
    * @param {OpenLayers.Size} size
    */
    setSize:function(size) { 
        OpenLayers.Popup.prototype.setSize.apply(this, arguments);

        if ((this.lonlat) && (this.map)) {
            var px = this.map.getLayerPxFromLonLat(this.lonlat);
            this.moveTo(px);
        }
    },  
    
    /** 
     * @private 
     * 
     * @param {OpenLayers.Pixel} px
     * 
     * @returns The the new px position of the popup on the screen
     *           relative to the passed-in px
     * @type OpenLayers.Pixel
     */
    calculateNewPx:function(px) {
        var newPx = px.offset(this.anchor.offset);

        var top = (this.relativePosition.charAt(0) == 't');
        newPx.y += (top) ? -this.size.h : this.anchor.size.h;
        
        var left = (this.relativePosition.charAt(1) == 'l');
        newPx.x += (left) ? -this.size.w : this.anchor.size.w;

        return newPx;   
    },

    CLASS_NAME: "OpenLayers.Popup.Anchored"
});
// @require: OpenLayers/Popup/Anchored.js

/**
* @class
*/
OpenLayers.Popup.AnchoredBubble = Class.create();

//Border space for the rico corners
OpenLayers.Popup.AnchoredBubble.CORNER_SIZE = 5;

OpenLayers.Popup.AnchoredBubble.prototype =
   Object.extend( new OpenLayers.Popup.Anchored(), {

    /** @type DOMElement */
    contentDiv:null,

    
    /** 
    * @constructor
    * 
    * @param {String} id
    * @param {OpenLayers.LonLat} lonlat
    * @param {OpenLayers.Size} size
    * @param {String} contentHTML
    * @param {Object} anchor  Object which must expose a 
    *                         - 'size' (OpenLayers.Size) and 
    *                         - 'offset' (OpenLayers.Pixel) 
    *                         (this is generally an OpenLayers.Icon)
    */
    initialize:function(id, lonlat, size, contentHTML, anchor) {
        OpenLayers.Popup.Anchored.prototype.initialize.apply(this, arguments);
    },

    /** 
    * @param {OpenLayers.Pixel} px
    * 
    * @returns Reference to a div that contains the drawn popup
    * @type DOMElement
    */
    draw: function(px) {
        
        OpenLayers.Popup.Anchored.prototype.draw.apply(this, arguments);

        // make the content Div
        var contentSize = this.size.copyOf();
        contentSize.h -= (2 * OpenLayers.Popup.AnchoredBubble.CORNER_SIZE);

        var id = this.div.id + "-contentDiv";
        this.contentDiv = OpenLayers.Util.createDiv(id, null, contentSize, 
                                                    null, "relative", null,
                                                    "auto");
        this.div.appendChild(this.contentDiv);
        this.setContentHTML();
        
        this.setRicoCorners(true);
        
        //set the popup color and opacity           
        this.setBackgroundColor(); 
        this.setOpacity();

        return this.div;
    },

    /**
    * @param {OpenLayers.Size} size
    */
    setSize:function(size) { 
        OpenLayers.Popup.Anchored.prototype.setSize.apply(this, arguments);
        
        if (this.contentDiv != null) {

            var contentSize = this.size.copyOf();
            contentSize.h -= (2 * OpenLayers.Popup.AnchoredBubble.CORNER_SIZE);
    
            this.contentDiv.style.height = contentSize.h + "px";
            
            //size has changed - must redo corners        
            this.setRicoCorners(false);
        }
    },  

    /**
     * @param {String} color
     */
    setBackgroundColor:function(color) { 
        if (color != undefined) {
            this.backgroundColor = color; 
        }
        
        if (this.div != null) {
            if (this.contentDiv != null) {
                this.div.style.background = "transparent";
                Rico.Corner.changeColor(this.contentDiv, this.backgroundColor);
            }
        }
    },  
    
    /**
     * @param {float} opacity
     */
    setOpacity:function(opacity) { 
        if (opacity != undefined) {
            this.opacity = opacity; 
        }
        
        if (this.div != null) {
            if (this.contentDiv != null) {
            Rico.Corner.changeOpacity(this.contentDiv, this.opacity);
            }
        }
    },  
 
    /** Bubble Popups can not have a border
     * 
     * @param {int} border
     */
    setBorder:function(border) { 
        this.border = 0;
    },      
 
    /**
     * @param {String} contentHTML
     */
    setContentHTML:function(contentHTML) {
        if (contentHTML != null) {
            this.contentHTML = contentHTML;
        }
        
        if (this.contentDiv != null) {
            this.contentDiv.innerHTML = this.contentHTML;
        }    
    },
    
    /** 
     * @private
     * 
     * @param {Boolean} firstTime Is this the first time the corners are being
     *                             rounded?
     * 
     * update the rico corners according to the popup's
     * current relative postion 
     */
    setRicoCorners:function(firstTime) {
    
        var corners = this.getCornersToRound(this.relativePosition);
        var options = {corners: corners,
                         color: this.backgroundColor,
                       bgColor: "transparent",
                         blend: false};

        if (firstTime) {
            Rico.Corner.round(this.div, options);
        } else {
            Rico.Corner.reRound(this.contentDiv, options);
            //set the popup color and opacity
            this.setBackgroundColor(); 
            this.setOpacity();
        }
    },

    /** 
     * @private
     * 
     * @returns The proper corners string ("tr tl bl br") for rico
     *           to round
     * @type String
     */
    getCornersToRound:function() {

        var corners = ['tl', 'tr', 'bl', 'br'];

        //we want to round all the corners _except_ the opposite one. 
        var corner = OpenLayers.Bounds.oppositeQuadrant(this.relativePosition);
        corners.remove(corner);

        return corners.join(" ");
    },

    CLASS_NAME: "OpenLayers.Popup.AnchoredBubble"
});
/**
* @class
*/
OpenLayers.Control = Class.create();
OpenLayers.Control.prototype = {

    /** this gets set in the addControl() function in OpenLayers.Map
    * @type OpenLayers.Map */
    map: null,

    /** @type DOMElement */
    div: null,

    /** @type OpenLayers.Pixel */
    position: null,

    /**
    * @constructor
    */
    initialize: function (options) {
        Object.extend(this, options);
    },

    /**
    * @param {OpenLayers.Pixel} px
    *
    * @returns A reference to the DIV DOMElement containing the control
    * @type DOMElement
    */
    draw: function (px) {
        if (this.div == null) {
            this.div = OpenLayers.Util.createDiv();
        }
        if (px != null) {
            this.position = px.copyOf();
        }
        this.moveTo(this.position);        
        return this.div;
    },

    /**
    * @param {OpenLayers.Pixel} px
    */
    moveTo: function (px) {
        if ((px != null) && (this.div != null)) {
            this.div.style.left = px.x + "px";
            this.div.style.top = px.x + "px";
        }
    },

    /**
    */
    destroy: function () {
        // eliminate circular references
        this.map = null;
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control"
};
// @require: OpenLayers/Control.js
OpenLayers.Control.MouseDefaults = Class.create();
OpenLayers.Control.MouseDefaults.prototype = 
  Object.extend( new OpenLayers.Control(), {

    initialize: function() {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },
    
    draw: function() {
        this.map.events.register( "dblclick", this, this.defaultDblClick );
        this.map.events.register( "mousedown", this, this.defaultMouseDown );
        this.map.events.register( "mouseup", this, this.defaultMouseUp );
        this.map.events.register( "mousemove", this, this.defaultMouseMove );
        this.map.events.register( "mouseout", this, this.defaultMouseOut );
    },
    
    /**
    * @param {Event} evt
    */
    defaultDblClick: function (evt) {
        var newCenter = this.map.getLonLatFromScreenPx( evt.xy ); 
        this.map.setCenter(newCenter, this.map.zoom + 1);
    },

    /**
    * @param {Event} evt
    */
    defaultMouseDown: function (evt) {
        this.mouseDragStart = evt.xy.copyOf();
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
            this.zoomBox.style.zIndex = this.map.Z_INDEX_BASE["Popup"] - 1;
            this.map.viewPortDiv.appendChild(this.zoomBox);
        } else {
            this.map.div.style.cursor = "move";
        }
        Event.stop(evt);
    },

    /**
    * @param {Event} evt
    */
    defaultMouseMove: function (evt) {
        if (this.mouseDragStart != null) {
            if (this.zoomBox) {
                var deltaX = Math.abs(this.mouseDragStart.x - evt.xy.x);
                var deltaY = Math.abs(this.mouseDragStart.y - evt.xy.y);
                this.zoomBox.style.width = deltaX+"px";
                this.zoomBox.style.height = deltaY+"px";
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
                var newCenter = this.map.getLonLatFromScreenPx( newXY ); 
                this.map.setCenter(newCenter);
                this.mouseDragStart = evt.xy.copyOf();
            }
        }
    },

    /**
    * @param {Event} evt
    */
    defaultMouseUp: function (evt) {
        if (this.zoomBox) {
            var start = this.map.getLonLatFromScreenPx( this.mouseDragStart ); 
            var end = this.map.getLonLatFromScreenPx( evt.xy );
            var top = Math.max(start.lat, end.lat);
            var bottom = Math.min(start.lat, end.lat);
            var left = Math.min(start.lon, end.lon);
            var right = Math.max(start.lon, end.lon);
            var bounds = new OpenLayers.Bounds(left, bottom, right, top);
            var zoom = this.map.getZoomForExtent(bounds);
            this.map.setCenter(new OpenLayers.LonLat(
              (start.lon + end.lon) / 2,
              (start.lat + end.lat) / 2
             ), zoom);
            this.map.viewPortDiv.removeChild(document.getElementById("zoomBox"));
            this.zoomBox = null;
        }
        this.mouseDragStart = null;
        this.map.div.style.cursor = "default";
    },

    defaultMouseOut: function (evt) {
        if (this.mouseDragStart != null
            && OpenLayers.Util.mouseLeft(evt, this.map.div)) {
                this.defaultMouseUp(evt);
        }
    }
});

// @require: OpenLayers/Control.js

OpenLayers.Control.KeyboardDefaults = Class.create();
OpenLayers.Control.KeyboardDefaults.prototype = 
  Object.extend( new OpenLayers.Control(), {

    initialize: function() {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },
    
    draw: function() {
        Event.observe(document, 'keypress', this.defaultKeyDown.bind(this.map));
    },
    
    /**
    * @param {Event} evt
    */
    defaultKeyDown: function (evt) {
        var i = 0;
        switch(evt.keyCode) {
            case Event.KEY_LEFT:
                var resolution = this.getResolution();
                var center = this.getCenter();
                this.setCenter(
                  new OpenLayers.LonLat(center.lon - (resolution * 50), 
                                        center.lat)
                                       );
                Event.stop(evt);
                break;
            case Event.KEY_RIGHT: 
                var resolution = this.getResolution();
                var center = this.getCenter();
                this.setCenter(
                  new OpenLayers.LonLat(center.lon + (resolution * 50),
                                        center.lat)
                                       );
                Event.stop(evt);
                break;
            case Event.KEY_UP:
                var resolution = this.getResolution();
                var center = this.getCenter();
                this.setCenter(
                  new OpenLayers.LonLat(center.lon, 
                                        center.lat + (resolution * 50))
                                       );
                Event.stop(evt);
                break;
            case Event.KEY_DOWN:
                var resolution = this.getResolution();
                var center = this.getCenter();
                this.setCenter(
                  new OpenLayers.LonLat(center.lon, 
                                        center.lat - (resolution * 50))
                                       );
                Event.stop(evt);
                break;
        }
    }

});
// @require: OpenLayers/Control.js
//
// default zoom/pan controls
//
OpenLayers.Control.PanZoom = Class.create();
OpenLayers.Control.PanZoom.X = 4;
OpenLayers.Control.PanZoom.Y = 4;
OpenLayers.Control.PanZoom.prototype = 
  Object.extend( new OpenLayers.Control(), {

    /** @type Array(...) */
    buttons: null,

    initialize: function() {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
        this.position = new OpenLayers.Pixel(OpenLayers.Control.PanZoom.X,
                                             OpenLayers.Control.PanZoom.Y);
    },

    /**
    * @param {OpenLayers.Pixel} px
    */
    draw: function(px) {
        // initialize our internal div
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        px = this.position;

        // place the controls
        this.buttons = new Array();

        var sz = new OpenLayers.Size(18,18);
        var centered = new OpenLayers.Pixel(px.x+sz.w/2, px.y);

        this._addButton("panup", "north-mini.png", centered, sz);
        px.y = centered.y+sz.h;
        this._addButton("panleft", "west-mini.png", px, sz);
        this._addButton("panright", "east-mini.png", px.add(sz.w, 0), sz);
        this._addButton("pandown", "south-mini.png", centered.add(0, sz.h*2), sz);
        this._addButton("zoomin", "zoom-plus-mini.png", centered.add(0, sz.h*3+5), sz);
        this._addButton("zoomworld", "zoom-world-mini.png", centered.add(0, sz.h*4+5), sz);
        this._addButton("zoomout", "zoom-minus-mini.png", centered.add(0, sz.h*5+5), sz);
        return this.div;
    },
    _addButton:function(id, img, xy, sz) {
        var imgLocation = OpenLayers.Util.getImagesLocation() + img;
        // var btn = new ol.AlphaImage("_"+id, imgLocation, xy, sz);
        var btn = OpenLayers.Util.createAlphaImageDiv(
                                    "OpenLayers_Control_PanZoom_" + id, 
                                    xy, sz, imgLocation, "absolute");

        //we want to add the outer div
        this.div.appendChild(btn);

        btn.onmousedown = this.buttonDown.bindAsEventListener(btn);
        btn.ondblclick  = this.doubleClick.bindAsEventListener(btn);
        btn.action = id;
        btn.map = this.map;

        //we want to remember/reference the outer div
        this.buttons.push(btn);
        return btn;
    },
    
    doubleClick: function (evt) {
        Event.stop(evt);
    },
    
    buttonDown: function (evt) {
        switch (this.action) {
            case "panup": 
                var resolution = this.map.getResolution();
                var center = this.map.getCenter();
                this.map.setCenter(
                  new OpenLayers.LonLat(center.lon, 
                                        center.lat + (resolution * 50))
                                       );
                break;
            case "pandown": 
                var resolution = this.map.getResolution();
                var center = this.map.getCenter();
                this.map.setCenter(
                  new OpenLayers.LonLat(center.lon,
                                        center.lat - (resolution * 50))
                                       );
                break;
            case "panleft": 
                var resolution = this.map.getResolution();
                var center = this.map.getCenter();
                this.map.setCenter(
                  new OpenLayers.LonLat(center.lon - (resolution * 50), 
                                        center.lat)
                                       );
                break;
            case "panright": 
                var resolution = this.map.getResolution();
                var center = this.map.getCenter();
                this.map.setCenter(
                  new OpenLayers.LonLat(center.lon + (resolution * 50),
                                        center.lat)
                                       );
                break;
            case "zoomin": this.map.zoomIn(); break;
            case "zoomout": this.map.zoomOut(); break;
            case "zoomworld": this.map.zoomExtent(); break;
        }
        Event.stop(evt);
    },
    destroy: function() {
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
        for(i=0; i<this.buttons.length; i++) {
            this.buttons[i].map = null;
        }
    }
});
// @require: OpenLayers/Control/PanZoom.js

//
// default zoom/pan controls
//
OpenLayers.Control.PanZoomBar = Class.create();
OpenLayers.Control.PanZoomBar.X = 4;
OpenLayers.Control.PanZoomBar.Y = 4;
OpenLayers.Control.PanZoomBar.prototype = 
  Object.extend( new OpenLayers.Control.PanZoom(), {
    /** @type Array(...) */
    buttons: null,

    /** @type int */
    zoomStopWidth: 18,

    /** @type int */
    zoomStopHeight: 11,

    initialize: function() {
        OpenLayers.Control.PanZoom.prototype.initialize.apply(this, arguments);
        this.position = new OpenLayers.Pixel(OpenLayers.Control.PanZoomBar.X,
                                             OpenLayers.Control.PanZoomBar.Y);
    },

    /**
    * @param {OpenLayers.Pixel} px
    */
    draw: function(px) {
        // initialize our internal div
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        px = this.position;

        // place the controls
        this.buttons = new Array();

        var sz = new OpenLayers.Size(18,18);
        var centered = new OpenLayers.Pixel(px.x+sz.w/2, px.y);

        this._addButton("panup", "north-mini.png", centered, sz);
        px.y = centered.y+sz.h;
        this._addButton("panleft", "west-mini.png", px, sz);
        this._addButton("panright", "east-mini.png", px.add(sz.w, 0), sz);
        this._addButton("pandown", "south-mini.png", centered.add(0, sz.h*2), sz);
        this._addButton("zoomin", "zoom-plus-mini.png", centered.add(0, sz.h*3+5), sz);
        centered = this._addZoomBar(centered.add(0, sz.h*4 + 5));
        this._addButton("zoomout", "zoom-minus-mini.png", centered, sz);
        return this.div;
    },

    /** 
    * @param {OpenLayers.Pixel} location where zoombar drawing is to start.
    */
    _addZoomBar:function(centered) {
        var imgLocation = OpenLayers.Util.getImagesLocation();
        
        var id = "OpenLayers_Control_PanZoomBar_Slider" + this.map.id;
        var slider = OpenLayers.Util.createAlphaImageDiv(id,
                       centered.add(-1, 
                         (this.map.getZoomLevels())*this.zoomStopHeight), 
                       new OpenLayers.Size(20,9), 
                       imgLocation+"slider.png",
                       "absolute");
        slider.style.zIndex = this.div.zIndex + 5;
        this.slider = slider;
        
        this.sliderEvents = new OpenLayers.Events(this, slider);
        this.sliderEvents.register("mousedown", this, this.zoomBarDown);
        this.sliderEvents.register("mousemove", this, this.zoomBarDrag);
        this.sliderEvents.register("mouseup", this, this.zoomBarUp);
        this.sliderEvents.register("dblclick", this, this.doubleClick);
        
        sz = new OpenLayers.Size();
        sz.h = this.zoomStopHeight*(this.map.getZoomLevels()+1);
        sz.w = this.zoomStopWidth;
        var div = null
        
        if (OpenLayers.Util.alphaHack()) {
            var id = "OpenLayers_Control_PanZoomBar" + this.map.id;
            div = OpenLayers.Util.createAlphaImageDiv(id, centered,
                                      new OpenLayers.Size(sz.w, 
                                              this.zoomStopHeight),
                                      imgLocation + "zoombar.png", 
                                      "absolute", null, "crop");
            div.style.height = sz.h;
        } else {
            div = OpenLayers.Util.createDiv(
                        'OpenLayers_Control_PanZoomBar_Zoombar' + this.map.id,
                        centered,
                        sz,
                        imgLocation+"zoombar.png");
        }
        
        this.zoombarDiv = div;
        
        this.divEvents = new OpenLayers.Events(this, div);
        this.divEvents.register("mousedown", this, this.divClick);
        this.divEvents.register("mousemove", this, this.passEventToSlider);
        this.divEvents.register("dblclick", this, this.doubleClick);
        
        this.div.appendChild(div);

        this.startTop = parseInt(div.style.top);
        this.div.appendChild(slider);

        this.map.events.register("zoomend", this, this.moveZoomBar);

        centered = centered.add(0, 
            this.zoomStopHeight*(this.map.getZoomLevels()+1));
        return centered; 
    },
    /* 
     * @param evt
     * This function is used to pass events that happen on the div, or the map,
     * through to the slider, which then does its moving thing.
     */
    passEventToSlider:function(evt) {
        this.sliderEvents.handleBrowserEvent(evt);
    },
    
    /*
     * divClick: Picks up on clicks directly on the zoombar div
     *           and sets the zoom level appropriately.
     */
    divClick: function (evt) {
        var y = evt.xy.y;
        var top = Position.page(evt.object)[1];
        var levels = Math.floor((y - top)/this.zoomStopHeight);
        this.map.zoomTo(this.map.getZoomLevels() - levels);
        Event.stop(evt);
    },
    
    /* 
     * @param evt
     * event listener for clicks on the slider
     */
    zoomBarDown:function(evt) {
        this.map.events.register("mousemove", this, this.passEventToSlider);
        this.map.events.register("mouseup", this, this.passEventToSlider);
        this.mouseDragStart = evt.xy.copyOf();
        this.zoomStart = evt.xy.copyOf();
        this.div.style.cursor = "move";
        Event.stop(evt);
    },
    
    /*
     * @param evt
     * This is what happens when a click has occurred, and the client is dragging.
     * Here we must ensure that the slider doesn't go beyond the bottom/top of the 
     * zoombar div, as well as moving the slider to its new visual location
     */
    zoomBarDrag:function(evt) {
        if (this.mouseDragStart != null) {
            var deltaY = this.mouseDragStart.y - evt.xy.y
            var offsets = Position.page(this.zoombarDiv);
            if ((evt.clientY - offsets[1]) > 0 && 
                (evt.clientY - offsets[1]) < parseInt(this.zoombarDiv.style.height) - 2) {
                var newTop = parseInt(this.slider.style.top) - deltaY;
                this.slider.style.top = newTop+"px";
            }
            this.mouseDragStart = evt.xy.copyOf();
        }
        Event.stop(evt);
    },
    
    /* 
     * @param evt
     * Perform cleanup when a mouseup event is received -- discover new zoom level
     * and switch to it.
     */
    zoomBarUp:function(evt) {
        if (this.zoomStart) {
            this.div.style.cursor="default";
            this.map.events.remove("mousemove");
            this.map.events.remove("mouseup");
            var deltaY = this.zoomStart.y - evt.xy.y
            this.map.zoomTo(this.map.zoom + Math.round(deltaY/this.zoomStopHeight));
            this.moveZoomBar();
            this.mouseDragStart = null;
            Event.stop(evt);
        }
    },
    
    /* 
    * Change the location of the slider to match the current zoom level.
    */
    moveZoomBar:function() {
        var newTop = 
            (this.map.getZoomLevels() - this.map.getZoom()) * this.zoomStopHeight
            + this.startTop + 1;
        this.slider.style.top = newTop + "px";
    },    
    
    CLASS_NAME: "OpenLayers.Control.PanZoomBar"
});
// @require: OpenLayers/Control.js
/** 
* @class
*/
OpenLayers.Control.LayerSwitcher = Class.create();

/** color used in the UI to show a layer is active/displayed
*
* @final
* @type String 
*/
OpenLayers.Control.LayerSwitcher.ACTIVE_COLOR = "darkblue";

/** color used in the UI to show a layer is deactivated/hidden
*
* @final
* @type String 
*/
OpenLayers.Control.LayerSwitcher.NONACTIVE_COLOR = "lightblue";


OpenLayers.Control.LayerSwitcher.prototype = 
  Object.extend( new OpenLayers.Control(), {

    /** @type String */
    activeColor: "",
    
    /** @type String */
    nonActiveColor: "",
    
    /** @type String */
    mode: "checkbox",

    /**
    * @constructor
    */
    initialize: function(options) {
        this.activeColor = OpenLayers.Control.LayerSwitcher.ACTIVE_COLOR;
        this.nonActiveColor = OpenLayers.Control.LayerSwitcher.NONACTIVE_COLOR;
        this.backdrops = [];
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },

    /**
    * @returns A reference to the DIV DOMElement containing the switcher tabs
    * @type DOMElement
    */  
    draw: function() {
        // initialize our internal div
        OpenLayers.Control.prototype.draw.apply(this);

        this.div.style.position = "absolute";
        this.div.style.top = "10px";
        this.div.style.right = "0px";
        this.div.style.left = "";
        this.div.style.fontFamily = "sans-serif";
        this.div.style.color = "white";
        this.div.style.fontWeight = "bold";
        this.div.style.marginTop = "3px";
        this.div.style.marginLeft = "3px";
        this.div.style.marginBottom = "3px";
        this.div.style.fontSize="smaller";   
        this.div.style.width = "10em";

        this.map.events.register("addlayer", this, this.redraw);
        return this.redraw();    
    },

    /**
    * @returns A reference to the DIV DOMElement containing the switcher tabs
    * @type DOMElement
    */  
    redraw: function() {

        //clear out previous incarnation of LayerSwitcher tabs
        this.div.innerHTML = "";
        var visible = false;
        for( var i = 0; i < this.map.layers.length; i++) {
            if (visible && this.mode == "radio") {
                this.map.layers[i].setVisibility(false);
            } else {
                visible = this.map.layers[i].getVisibility();
            }
            this.addTab(this.map.layers[i]);
        }
            
        return this.div;
    },
    
    /** 
    * @param {event} evt
    */
    singleClick: function(evt) {
        var div = Event.element(evt);
        var layer = div.layer;
        if (this.mode == "radio") {
            for(var i=0; i < this.backdrops.length; i++) {
                this.setTabActivation(this.backdrops[i], false);
                this.backdrops[i].layer.setVisibility(false);
            }
            this.setTabActivation(div, true);
            layer.setVisibility(true);
        } else {
            var visible = layer.getVisibility();
            
            this.setTabActivation(div, !visible);
            layer.setVisibility(!visible);
        }
        Event.stop(evt);
    },
    
    /** 
    * @param {event} evt
    */
    doubleClick: function(evt) {
        Event.stop(evt);
    },

    /** 
    * @private
    * 
    * @param {OpenLayers.Layer} layer
    */            
    addTab: function(layer) {

        // Outer DIV - for Rico Corners
        //
        var backdropLabelOuter = document.createElement('div');
        backdropLabelOuter.id = "LayerSwitcher_" + layer.name + "_Tab";
        backdropLabelOuter.style.marginTop = "4px";
        backdropLabelOuter.style.marginBottom = "4px";
        
        // Inner Label - for Rico Corners
        //
        var backdropLabel = document.createElement('p');
        backdropLabel.innerHTML = layer.name;
        backdropLabel.style.marginTop = "0px";
        backdropLabel.style.marginBottom = "0px";
        backdropLabel.style.paddingLeft = "10px";
        backdropLabel.style.paddingRight = "10px";
        
        // add reference to layer onto the div for use in event handlers
        backdropLabel.layer = layer;

        // set event handlers
        backdropLabel.ondblclick = this.doubleClick.bindAsEventListener(this);
        backdropLabel.onmousedown = this.singleClick.bindAsEventListener(this);

        
        // add label to div
        backdropLabelOuter.appendChild(backdropLabel);
        
        this.backdrops.append(backdropLabel); 
        
        // add div to main LayerSwitcher Div
        this.div.appendChild(backdropLabelOuter);

        Rico.Corner.round(backdropLabelOuter, {corners: "tl bl",
                                      bgColor: "transparent",
                                      color: "white",
                                      blend: false});

        this.setTabActivation(backdropLabel, layer.getVisibility());
    },



    /**
    * @private
    *
    * @param {DOMElement} div
    * @param {Boolean} activate
    */
    setTabActivation:function(div, activate) {
        var color = (activate) ? this.activeColor : this.nonActiveColor;
        Rico.Corner.changeColor(div, color);
    },



    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control.LayerSwitcher"
});

