import _ol_ from '../index';
import _ol_control_Control_ from '../control/control';
import _ol_css_ from '../css';
import _ol_dom_ from '../dom';
import _ol_events_ from '../events';
import _ol_events_EventType_ from '../events/eventtype';

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
var _ol_control_FullScreen_ = function(opt_options) {

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
  button.className = this.cssClassName_ + '-' + _ol_control_FullScreen_.isFullScreen();
  button.setAttribute('type', 'button');
  button.title = tipLabel;
  button.appendChild(this.labelNode_);

  _ol_events_.listen(button, _ol_events_EventType_.CLICK,
      this.handleClick_, this);

  var cssClasses = this.cssClassName_ + ' ' + _ol_css_.CLASS_UNSELECTABLE +
      ' ' + _ol_css_.CLASS_CONTROL + ' ' +
      (!_ol_control_FullScreen_.isFullScreenSupported() ? _ol_css_.CLASS_UNSUPPORTED : '');
  var element = document.createElement('div');
  element.className = cssClasses;
  element.appendChild(button);

  _ol_control_Control_.call(this, {
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

_ol_.inherits(_ol_control_FullScreen_, _ol_control_Control_);


/**
 * @param {Event} event The event to handle
 * @private
 */
_ol_control_FullScreen_.prototype.handleClick_ = function(event) {
  event.preventDefault();
  this.handleFullScreen_();
};


/**
 * @private
 */
_ol_control_FullScreen_.prototype.handleFullScreen_ = function() {
  if (!_ol_control_FullScreen_.isFullScreenSupported()) {
    return;
  }
  var map = this.getMap();
  if (!map) {
    return;
  }
  if (_ol_control_FullScreen_.isFullScreen()) {
    _ol_control_FullScreen_.exitFullScreen();
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
      _ol_control_FullScreen_.requestFullScreenWithKeys(element);

    } else {
      _ol_control_FullScreen_.requestFullScreen(element);
    }
  }
};


/**
 * @private
 */
_ol_control_FullScreen_.prototype.handleFullScreenChange_ = function() {
  var button = this.element.firstElementChild;
  var map = this.getMap();
  if (_ol_control_FullScreen_.isFullScreen()) {
    button.className = this.cssClassName_ + '-true';
    _ol_dom_.replaceNode(this.labelActiveNode_, this.labelNode_);
  } else {
    button.className = this.cssClassName_ + '-false';
    _ol_dom_.replaceNode(this.labelNode_, this.labelActiveNode_);
  }
  if (map) {
    map.updateSize();
  }
};


/**
 * @inheritDoc
 * @api
 */
_ol_control_FullScreen_.prototype.setMap = function(map) {
  _ol_control_Control_.prototype.setMap.call(this, map);
  if (map) {
    this.listenerKeys.push(_ol_events_.listen(document,
        _ol_control_FullScreen_.getChangeType_(),
        this.handleFullScreenChange_, this)
    );
  }
};

/**
 * @return {boolean} Fullscreen is supported by the current platform.
 */
_ol_control_FullScreen_.isFullScreenSupported = function() {
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
_ol_control_FullScreen_.isFullScreen = function() {
  return !!(
    document.webkitIsFullScreen || document.mozFullScreen ||
    document.msFullscreenElement || document.fullscreenElement
  );
};

/**
 * Request to fullscreen an element.
 * @param {Node} element Element to request fullscreen
 */
_ol_control_FullScreen_.requestFullScreen = function(element) {
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
_ol_control_FullScreen_.requestFullScreenWithKeys = function(element) {
  if (element.mozRequestFullScreenWithKeys) {
    element.mozRequestFullScreenWithKeys();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
  } else {
    _ol_control_FullScreen_.requestFullScreen(element);
  }
};

/**
 * Exit fullscreen.
 */
_ol_control_FullScreen_.exitFullScreen = function() {
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
_ol_control_FullScreen_.getChangeType_ = (function() {
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
export default _ol_control_FullScreen_;
