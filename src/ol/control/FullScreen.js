/**
 * @module ol/control/FullScreen
 */
import Control from './Control.js';
import EventType from '../events/EventType.js';
import {CLASS_CONTROL, CLASS_UNSELECTABLE, CLASS_UNSUPPORTED} from '../css.js';
import {listen} from '../events.js';
import {replaceNode} from '../dom.js';

const events = [
  'fullscreenchange',
  'webkitfullscreenchange',
  'MSFullscreenChange',
];

/**
 * @enum {string}
 */
const FullScreenEventType = {
  /**
   * Triggered after the map entered fullscreen.
   * @event FullScreenEventType#enterfullscreen
   * @api
   */
  ENTERFULLSCREEN: 'enterfullscreen',

  /**
   * Triggered after the map leave fullscreen.
   * @event FullScreenEventType#leavefullscreen
   * @api
   */
  LEAVEFULLSCREEN: 'leavefullscreen',
};

/***
 * @template Return
 * @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes|
 *     'enterfullscreen'|'leavefullscreen', import("../events/Event.js").default, Return> &
 *   import("../Observable").OnSignature<import("../ObjectEventType").Types, import("../Object").ObjectEvent, Return> &
 *   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|
 *     'enterfullscreen'|'leavefullscreen'|import("../ObjectEventType").Types, Return>} FullScreenOnSignature
 */

/**
 * @typedef {Object} Options
 * @property {string} [className='ol-full-screen'] CSS class name.
 * @property {string|Text} [label='\u2922'] Text label to use for the button.
 * Instead of text, also an element (e.g. a `span` element) can be used.
 * @property {string|Text} [labelActive='\u00d7'] Text label to use for the
 * button when full-screen is active.
 * @property {string} [activeClassName=className + '-true'] CSS class name for the button
 * when full-screen is active.
 * @property {string} [inactiveClassName=className + '-false'] CSS class name for the button
 * when full-screen is inactive.
 * Instead of text, also an element (e.g. a `span` element) can be used.
 * @property {string} [tipLabel='Toggle full-screen'] Text label to use for the button tip.
 * @property {boolean} [keys=false] Full keyboard access.
 * @property {HTMLElement|string} [target] Specify a target if you want the
 * control to be rendered outside of the map's viewport.
 * @property {HTMLElement|string} [source] The element to be displayed
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
 * The [Fullscreen API](https://www.w3.org/TR/fullscreen/) is used to
 * toggle the map in full screen mode.
 *
 * @fires FullScreenEventType#enterfullscreen
 * @fires FullScreenEventType#leavefullscreen
 * @api
 */
class FullScreen extends Control {
  /**
   * @param {Options} [opt_options] Options.
   */
  constructor(opt_options) {
    const options = opt_options ? opt_options : {};

    super({
      element: document.createElement('div'),
      target: options.target,
    });

    /***
     * @type {FullScreenOnSignature<import("../Observable.js").OnReturn>}
     */
    this.on;

    /***
     * @type {FullScreenOnSignature<import("../Observable.js").OnReturn>}
     */
    this.once;

    /***
     * @type {FullScreenOnSignature<void>}
     */
    this.un;

    /**
     * @private
     * @type {string}
     */
    this.cssClassName_ =
      options.className !== undefined ? options.className : 'ol-full-screen';

    /**
     * @private
     * @type {Array<string>}
     */
    this.activeClassName_ =
      options.activeClassName !== undefined
        ? options.activeClassName.split(' ')
        : [this.cssClassName_ + '-true'];

    /**
     * @private
     * @type {Array<string>}
     */
    this.inactiveClassName_ =
      options.inactiveClassName !== undefined
        ? options.inactiveClassName.split(' ')
        : [this.cssClassName_ + '-false'];

    const label = options.label !== undefined ? options.label : '\u2922';

    /**
     * @private
     * @type {Text}
     */
    this.labelNode_ =
      typeof label === 'string' ? document.createTextNode(label) : label;

    const labelActive =
      options.labelActive !== undefined ? options.labelActive : '\u00d7';

    /**
     * @private
     * @type {Text}
     */
    this.labelActiveNode_ =
      typeof labelActive === 'string'
        ? document.createTextNode(labelActive)
        : labelActive;

    /**
     * @private
     * @type {HTMLElement}
     */
    this.button_ = document.createElement('button');

    const tipLabel = options.tipLabel ? options.tipLabel : 'Toggle full-screen';
    this.setClassName_(this.button_, isFullScreen());
    this.button_.setAttribute('type', 'button');
    this.button_.title = tipLabel;
    this.button_.appendChild(this.labelNode_);

    this.button_.addEventListener(
      EventType.CLICK,
      this.handleClick_.bind(this),
      false
    );

    const cssClasses =
      this.cssClassName_ +
      ' ' +
      CLASS_UNSELECTABLE +
      ' ' +
      CLASS_CONTROL +
      ' ' +
      (!isFullScreenSupported() ? CLASS_UNSUPPORTED : '');
    const element = this.element;
    element.className = cssClasses;
    element.appendChild(this.button_);

    /**
     * @private
     * @type {boolean}
     */
    this.keys_ = options.keys !== undefined ? options.keys : false;

    /**
     * @private
     * @type {HTMLElement|string|undefined}
     */
    this.source_ = options.source;
  }

  /**
   * @param {MouseEvent} event The event to handle
   * @private
   */
  handleClick_(event) {
    event.preventDefault();
    this.handleFullScreen_();
  }

  /**
   * @private
   */
  handleFullScreen_() {
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
        element =
          typeof this.source_ === 'string'
            ? document.getElementById(this.source_)
            : this.source_;
      } else {
        element = map.getTargetElement();
      }
      if (this.keys_) {
        requestFullScreenWithKeys(element);
      } else {
        requestFullScreen(element);
      }
    }
  }

  /**
   * @private
   */
  handleFullScreenChange_() {
    const map = this.getMap();
    if (isFullScreen()) {
      this.setClassName_(this.button_, true);
      replaceNode(this.labelActiveNode_, this.labelNode_);
      this.dispatchEvent(FullScreenEventType.ENTERFULLSCREEN);
    } else {
      this.setClassName_(this.button_, false);
      replaceNode(this.labelNode_, this.labelActiveNode_);
      this.dispatchEvent(FullScreenEventType.LEAVEFULLSCREEN);
    }
    if (map) {
      map.updateSize();
    }
  }

  /**
   * @param {HTMLElement} element Target element
   * @param {boolean} fullscreen True if fullscreen class name should be active
   * @private
   */
  setClassName_(element, fullscreen) {
    const activeClassName = this.activeClassName_;
    const inactiveClassName = this.inactiveClassName_;
    const nextClassName = fullscreen ? activeClassName : inactiveClassName;
    element.classList.remove(...activeClassName);
    element.classList.remove(...inactiveClassName);
    element.classList.add(...nextClassName);
  }

  /**
   * Remove the control from its current map and attach it to the new map.
   * Subclasses may set up event handlers to get notified about changes to
   * the map here.
   * @param {import("../PluggableMap.js").default} map Map.
   * @api
   */
  setMap(map) {
    super.setMap(map);
    if (map) {
      for (let i = 0, ii = events.length; i < ii; ++i) {
        this.listenerKeys.push(
          listen(document, events[i], this.handleFullScreenChange_, this)
        );
      }
    }
  }
}

/**
 * @return {boolean} Fullscreen is supported by the current platform.
 */
function isFullScreenSupported() {
  const body = document.body;
  return !!(
    body['webkitRequestFullscreen'] ||
    (body['msRequestFullscreen'] && document['msFullscreenEnabled']) ||
    (body.requestFullscreen && document.fullscreenEnabled)
  );
}

/**
 * @return {boolean} Element is currently in fullscreen.
 */
function isFullScreen() {
  return !!(
    document['webkitIsFullScreen'] ||
    document['msFullscreenElement'] ||
    document.fullscreenElement
  );
}

/**
 * Request to fullscreen an element.
 * @param {HTMLElement} element Element to request fullscreen
 */
function requestFullScreen(element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element['msRequestFullscreen']) {
    element['msRequestFullscreen']();
  } else if (element['webkitRequestFullscreen']) {
    element['webkitRequestFullscreen']();
  }
}

/**
 * Request to fullscreen an element with keyboard input.
 * @param {HTMLElement} element Element to request fullscreen
 */
function requestFullScreenWithKeys(element) {
  if (element['webkitRequestFullscreen']) {
    element['webkitRequestFullscreen']();
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
  } else if (document['msExitFullscreen']) {
    document['msExitFullscreen']();
  } else if (document['webkitExitFullscreen']) {
    document['webkitExitFullscreen']();
  }
}

export default FullScreen;
