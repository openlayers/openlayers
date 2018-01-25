/**
 * @module ol/control/FullScreen
 */
import {inherits} from '../index.js';
import Control from '../control/Control.js';
import {CLASS_CONTROL, CLASS_UNSELECTABLE, CLASS_UNSUPPORTED} from '../css.js';
import {replaceNode} from '../dom.js';
import {listen} from '../events.js';
import EventType from '../events/EventType.js';

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
const FullScreen = function(opt_options) {

  const options = opt_options ? opt_options : {};

  /**
   * @private
   * @type {string}
   */
  this.cssClassName_ = options.className !== undefined ? options.className :
    'ol-full-screen';

  const label = options.label !== undefined ? options.label : '\u2922';

  /**
   * @private
   * @type {Node}
   */
  this.labelNode_ = typeof label === 'string' ?
    document.createTextNode(label) : label;

  const labelActive = options.labelActive !== undefined ? options.labelActive : '\u00d7';

  /**
   * @private
   * @type {Node}
   */
  this.labelActiveNode_ = typeof labelActive === 'string' ?
    document.createTextNode(labelActive) : labelActive;

  const tipLabel = options.tipLabel ? options.tipLabel : 'Toggle full-screen';
  const button = document.createElement('button');
  button.className = this.cssClassName_ + '-' + FullScreen.isFullScreen();
  button.setAttribute('type', 'button');
  button.title = tipLabel;
  button.appendChild(this.labelNode_);

  listen(button, EventType.CLICK,
    this.handleClick_, this);

  const cssClasses = this.cssClassName_ + ' ' + CLASS_UNSELECTABLE +
      ' ' + CLASS_CONTROL + ' ' +
      (!FullScreen.isFullScreenSupported() ? CLASS_UNSUPPORTED : '');
  const element = document.createElement('div');
  element.className = cssClasses;
  element.appendChild(button);

  Control.call(this, {
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

inherits(FullScreen, Control);


/**
 * @param {Event} event The event to handle
 * @private
 */
FullScreen.prototype.handleClick_ = function(event) {
  event.preventDefault();
  this.handleFullScreen_();
};


/**
 * @private
 */
FullScreen.prototype.handleFullScreen_ = function() {
  if (!FullScreen.isFullScreenSupported()) {
    return;
  }
  const map = this.getMap();
  if (!map) {
    return;
  }
  if (FullScreen.isFullScreen()) {
    FullScreen.exitFullScreen();
  } else {
    let element;
    if (this.source_) {
      element = typeof this.source_ === 'string' ?
        document.getElementById(this.source_) :
        this.source_;
    } else {
      element = map.getTargetElement();
    }
    if (this.keys_) {
      FullScreen.requestFullScreenWithKeys(element);

    } else {
      FullScreen.requestFullScreen(element);
    }
  }
};


/**
 * @private
 */
FullScreen.prototype.handleFullScreenChange_ = function() {
  const button = this.element.firstElementChild;
  const map = this.getMap();
  if (FullScreen.isFullScreen()) {
    button.className = this.cssClassName_ + '-true';
    replaceNode(this.labelActiveNode_, this.labelNode_);
  } else {
    button.className = this.cssClassName_ + '-false';
    replaceNode(this.labelNode_, this.labelActiveNode_);
  }
  if (map) {
    map.updateSize();
  }
};


/**
 * @inheritDoc
 * @api
 */
FullScreen.prototype.setMap = function(map) {
  Control.prototype.setMap.call(this, map);
  if (map) {
    this.listenerKeys.push(listen(document,
      FullScreen.getChangeType_(),
      this.handleFullScreenChange_, this)
    );
  }
};

/**
 * @return {boolean} Fullscreen is supported by the current platform.
 */
FullScreen.isFullScreenSupported = function() {
  const body = document.body;
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
FullScreen.isFullScreen = function() {
  return !!(
    document.webkitIsFullScreen || document.mozFullScreen ||
    document.msFullscreenElement || document.fullscreenElement
  );
};

/**
 * Request to fullscreen an element.
 * @param {Node} element Element to request fullscreen
 */
FullScreen.requestFullScreen = function(element) {
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
FullScreen.requestFullScreenWithKeys = function(element) {
  if (element.mozRequestFullScreenWithKeys) {
    element.mozRequestFullScreenWithKeys();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
  } else {
    FullScreen.requestFullScreen(element);
  }
};

/**
 * Exit fullscreen.
 */
FullScreen.exitFullScreen = function() {
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
FullScreen.getChangeType_ = (function() {
  let changeType;
  return function() {
    if (!changeType) {
      const body = document.body;
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
export default FullScreen;
