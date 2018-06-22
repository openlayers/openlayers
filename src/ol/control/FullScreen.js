/**
 * @module ol/control/FullScreen
 */
import {inherits} from '../util.js';
import Control from '../control/Control.js';
import {CLASS_CONTROL, CLASS_UNSELECTABLE, CLASS_UNSUPPORTED} from '../css.js';
import {replaceNode} from '../dom.js';
import {listen} from '../events.js';
import EventType from '../events/EventType.js';


/**
 * @return {string} Change type.
 */
const getChangeType = (function() {
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


/**
 * @typedef {Object} Options
 * @property {string} [className='ol-full-screen'] CSS class name.
 * @property {string|Element} [label='\u2922'] Text label to use for the button.
 * Instead of text, also an element (e.g. a `span` element) can be used.
 * @property {string|Element} [labelActive='\u00d7'] Text label to use for the
 * button when full-screen is active.
 * Instead of text, also an element (e.g. a `span` element) can be used.
 * @property {string} [tipLabel='Toggle full-screen'] Text label to use for the button tip.
 * @property {boolean} [keys=false] Full keyboard access.
 * @property {Element|string} [target] Specify a target if you want the
 * control to be rendered outside of the map's viewport.
 * @property {Element|string} [source] The element to be displayed
 * fullscreen. When not provided, the element containing the map viewport will
 * be displayed fullscreen.
 */


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
 * @extends {module:ol/control/Control}
 * @param {module:ol/control/FullScreen~Options=} opt_options Options.
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
   * @type {Element}
   */
  this.labelNode_ = typeof label === 'string' ?
    document.createTextNode(label) : label;

  const labelActive = options.labelActive !== undefined ? options.labelActive : '\u00d7';

  /**
   * @private
   * @type {Element}
   */
  this.labelActiveNode_ = typeof labelActive === 'string' ?
    document.createTextNode(labelActive) : labelActive;

  const tipLabel = options.tipLabel ? options.tipLabel : 'Toggle full-screen';
  const button = document.createElement('button');
  button.className = this.cssClassName_ + '-' + isFullScreen();
  button.setAttribute('type', 'button');
  button.title = tipLabel;
  button.appendChild(this.labelNode_);

  listen(button, EventType.CLICK,
    this.handleClick_, this);

  const cssClasses = this.cssClassName_ + ' ' + CLASS_UNSELECTABLE +
      ' ' + CLASS_CONTROL + ' ' +
      (!isFullScreenSupported() ? CLASS_UNSUPPORTED : '');
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
  if (!isFullScreenSupported()) {
    return;
  }
  const map = this.getMap();
  if (!map) {
    return;
  }
  if (isFullScreen()) {
    exitFullScreen();
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
      requestFullScreenWithKeys(element);

    } else {
      requestFullScreen(element);
    }
  }
};


/**
 * @private
 */
FullScreen.prototype.handleFullScreenChange_ = function() {
  const button = this.element.firstElementChild;
  const map = this.getMap();
  if (isFullScreen()) {
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
      getChangeType(),
      this.handleFullScreenChange_, this)
    );
  }
};

/**
 * @return {boolean} Fullscreen is supported by the current platform.
 */
function isFullScreenSupported() {
  const body = document.body;
  return !!(
    body.webkitRequestFullscreen ||
    (body.mozRequestFullScreen && document.mozFullScreenEnabled) ||
    (body.msRequestFullscreen && document.msFullscreenEnabled) ||
    (body.requestFullscreen && document.fullscreenEnabled)
  );
}

/**
 * @return {boolean} Element is currently in fullscreen.
 */
function isFullScreen() {
  return !!(
    document.webkitIsFullScreen || document.mozFullScreen ||
    document.msFullscreenElement || document.fullscreenElement
  );
}

/**
 * Request to fullscreen an element.
 * @param {Element} element Element to request fullscreen
 */
function requestFullScreen(element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  }
}

/**
 * Request to fullscreen an element with keyboard input.
 * @param {Element} element Element to request fullscreen
 */
function requestFullScreenWithKeys(element) {
  if (element.mozRequestFullScreenWithKeys) {
    element.mozRequestFullScreenWithKeys();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
  } else {
    requestFullScreen(element);
  }
}

/**
 * Exit fullscreen.
 */
function exitFullScreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
}

export default FullScreen;
