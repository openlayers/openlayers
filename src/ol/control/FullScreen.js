goog.provide('ol.control.FullScreen');

goog.require('ol');
goog.require('ol.control.Control');
goog.require('ol.css');
goog.require('ol.dom');
goog.require('ol.events');
goog.require('ol.events.EventType');


/**
 * @classdesc
 * Provides a button that when clicked fills up the full screen with the map.
 * The full screen source element is by default the element containing the map viewport unless
 * overridden by providing the `source` option. In which case, the dom
 * element introduced using this parameter will be displayed in full screen.
 *
 * When in full screen mode, a close button is shown to exit full screen mode.
 * The [Fullscreen API](http://www.w3.org/TR/fullscreen/) is used to
 * toggle the map in full screen mode.
 *
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.FullScreenOptions=} opt_options Options.
 * @api
 */
ol.control.FullScreen = function(opt_options) {

  var options = opt_options ? opt_options : {};

  /**
   * @private
   * @type {string}
   */
  this.cssClassName_ = options.className !== undefined ? options.className :
    'ol-full-screen';

  var label = options.label !== undefined ? options.label : '\u2922';

  /**
   * @private
   * @type {Node}
   */
  this.labelNode_ = typeof label === 'string' ?
    document.createTextNode(label) : label;

  var labelActive = options.labelActive !== undefined ? options.labelActive : '\u00d7';

  /**
   * @private
   * @type {Node}
   */
  this.labelActiveNode_ = typeof labelActive === 'string' ?
    document.createTextNode(labelActive) : labelActive;

  var tipLabel = options.tipLabel ? options.tipLabel : 'Toggle full-screen';
  var button = document.createElement('button');
  button.className = this.cssClassName_ + '-' + ol.control.FullScreen.isFullScreen();
  button.setAttribute('type', 'button');
  button.title = tipLabel;
  button.appendChild(this.labelNode_);

  ol.events.listen(button, ol.events.EventType.CLICK,
      this.handleClick_, this);

  var cssClasses = this.cssClassName_ + ' ' + ol.css.CLASS_UNSELECTABLE +
      ' ' + ol.css.CLASS_CONTROL + ' ' +
      (!ol.control.FullScreen.isFullScreenSupported() ? ol.css.CLASS_UNSUPPORTED : '');
  var element = document.createElement('div');
  element.className = cssClasses;
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

  /**
   * @private
   * @type {boolean}
   */
  this.keys_ = options.keys !== undefined ? options.keys : false;

  /**
   * @private
   * @type {Element|string|undefined}
   */
  this.source_ = options.source;

};
ol.inherits(ol.control.FullScreen, ol.control.Control);


/**
 * @param {Event} event The event to handle
 * @private
 */
ol.control.FullScreen.prototype.handleClick_ = function(event) {
  event.preventDefault();
  this.handleFullScreen_();
};


/**
 * @private
 */
ol.control.FullScreen.prototype.handleFullScreen_ = function() {
  if (!ol.control.FullScreen.isFullScreenSupported()) {
    return;
  }
  var map = this.getMap();
  if (!map) {
    return;
  }
  if (ol.control.FullScreen.isFullScreen()) {
    ol.control.FullScreen.exitFullScreen();
  } else {
    var element;
    if (this.source_) {
      element = typeof this.source_ === 'string' ?
        document.getElementById(this.source_) :
        this.source_;
    } else {
      element = map.getTargetElement();
    }
    if (this.keys_) {
      ol.control.FullScreen.requestFullScreenWithKeys(element);

    } else {
      ol.control.FullScreen.requestFullScreen(element);
    }
  }
};


/**
 * @private
 */
ol.control.FullScreen.prototype.handleFullScreenChange_ = function() {
  var button = this.element.firstElementChild;
  var map = this.getMap();
  if (ol.control.FullScreen.isFullScreen()) {
    button.className = this.cssClassName_ + '-true';
    ol.dom.replaceNode(this.labelActiveNode_, this.labelNode_);
  } else {
    button.className = this.cssClassName_ + '-false';
    ol.dom.replaceNode(this.labelNode_, this.labelActiveNode_);
  }
  if (map) {
    map.updateSize();
  }
};


/**
 * @inheritDoc
 * @api
 */
ol.control.FullScreen.prototype.setMap = function(map) {
  ol.control.Control.prototype.setMap.call(this, map);
  if (map) {
    this.listenerKeys.push(ol.events.listen(document,
        ol.control.FullScreen.getChangeType_(),
        this.handleFullScreenChange_, this)
    );
  }
};

/**
 * @return {boolean} Fullscreen is supported by the current platform.
 */
ol.control.FullScreen.isFullScreenSupported = function() {
  var body = document.body;
  return !!(
    body.webkitRequestFullscreen ||
    (body.mozRequestFullScreen && document.mozFullScreenEnabled) ||
    (body.msRequestFullscreen && document.msFullscreenEnabled) ||
    (body.requestFullscreen && document.fullscreenEnabled)
  );
};

/**
 * @return {boolean} Element is currently in fullscreen.
 */
ol.control.FullScreen.isFullScreen = function() {
  return !!(
    document.webkitIsFullScreen || document.mozFullScreen ||
    document.msFullscreenElement || document.fullscreenElement
  );
};

/**
 * Request to fullscreen an element.
 * @param {Node} element Element to request fullscreen
 */
ol.control.FullScreen.requestFullScreen = function(element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  }
};

/**
 * Request to fullscreen an element with keyboard input.
 * @param {Node} element Element to request fullscreen
 */
ol.control.FullScreen.requestFullScreenWithKeys = function(element) {
  if (element.mozRequestFullScreenWithKeys) {
    element.mozRequestFullScreenWithKeys();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
  } else {
    ol.control.FullScreen.requestFullScreen(element);
  }
};

/**
 * Exit fullscreen.
 */
ol.control.FullScreen.exitFullScreen = function() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
};

/**
 * @return {string} Change type.
 * @private
 */
ol.control.FullScreen.getChangeType_ = (function() {
  var changeType;
  return function() {
    if (!changeType) {
      var body = document.body;
      if (body.webkitRequestFullscreen) {
        changeType = 'webkitfullscreenchange';
      } else if (body.mozRequestFullScreen) {
        changeType = 'mozfullscreenchange';
      } else if (body.msRequestFullscreen) {
        changeType = 'MSFullscreenChange';
      } else if (body.requestFullscreen) {
        changeType = 'fullscreenchange';
      }
    }
    return changeType;
  };
})();
