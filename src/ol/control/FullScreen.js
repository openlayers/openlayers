/**
 * @module ol/control/FullScreen
 */
import MapProperty from '../MapProperty.js';
import {CLASS_CONTROL, CLASS_UNSELECTABLE, CLASS_UNSUPPORTED} from '../css.js';
import {replaceNode} from '../dom.js';
import EventType from '../events/EventType.js';
import {listen, unlistenByKey} from '../events.js';
import Control from './Control.js';

const events = ['fullscreenchange', 'webkitfullscreenchange'];

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
 * @property {string|Text|HTMLElement} [label='\u2922'] Text label to use for the button.
 * Instead of text, also an element (e.g. a `span` element) can be used.
 * @property {string|Text|HTMLElement} [labelActive='\u00d7'] Text label to use for the
 * button when full-screen is active.
 * Instead of text, also an element (e.g. a `span` element) can be used.
 * @property {string} [activeClassName=className + '-true'] CSS class name for the button
 * when full-screen is active.
 * @property {string} [inactiveClassName=className + '-false'] CSS class name for the button
 * when full-screen is inactive.
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
   * @param {Options} [options] Options.
   */
  constructor(options) {
    options = options ? options : {};

    super({
      element: document.createElement('div'),
      target: options.target,
    });

    /***
     * @type {FullScreenOnSignature<import("../events").EventsKey>}
     */
    this.on;

    /***
     * @type {FullScreenOnSignature<import("../events").EventsKey>}
     */
    this.once;

    /***
     * @type {FullScreenOnSignature<void>}
     */
    this.un;

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

    /**
     * @type {boolean}
     * @private
     */
    this.isInFullscreen_ = false;

    /**
     * @private
     */
    this.boundHandleMapTargetChange_ = this.handleMapTargetChange_.bind(this);

    /**
     * @private
     * @type {string}
     */
    this.cssClassName_ =
      options.className !== undefined ? options.className : 'ol-full-screen';

    /**
     * @private
     * @type {Array<import("../events.js").EventsKey>}
     */
    this.documentListeners_ = [];

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
     * @type {Text|HTMLElement}
     */
    this.labelNode_ =
      typeof label === 'string' ? document.createTextNode(label) : label;

    const labelActive =
      options.labelActive !== undefined ? options.labelActive : '\u00d7';

    /**
     * @private
     * @type {Text|HTMLElement}
     */
    this.labelActiveNode_ =
      typeof labelActive === 'string'
        ? document.createTextNode(labelActive)
        : labelActive;

    const tipLabel = options.tipLabel ? options.tipLabel : 'Toggle full-screen';

    /**
     * @private
     * @type {HTMLElement}
     */
    this.button_ = document.createElement('button');
    this.button_.title = tipLabel;
    this.button_.setAttribute('type', 'button');
    this.button_.appendChild(this.labelNode_);
    this.button_.addEventListener(
      EventType.CLICK,
      this.handleClick_.bind(this),
      false,
    );
    this.setClassName_(this.button_, this.isInFullscreen_);

    this.element.className = `${this.cssClassName_} ${CLASS_UNSELECTABLE} ${CLASS_CONTROL}`;
    this.element.appendChild(this.button_);
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
    const map = this.getMap();
    if (!map) {
      return;
    }
    const doc = map.getOwnerDocument();
    if (!isFullScreenSupported(doc)) {
      return;
    }
    if (isFullScreen(doc)) {
      exitFullScreen(doc);
    } else {
      let element;
      if (this.source_) {
        element =
          typeof this.source_ === 'string'
            ? doc.getElementById(this.source_)
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
    if (!map) {
      return;
    }
    const wasInFullscreen = this.isInFullscreen_;
    this.isInFullscreen_ = isFullScreen(map.getOwnerDocument());
    if (wasInFullscreen !== this.isInFullscreen_) {
      this.setClassName_(this.button_, this.isInFullscreen_);
      if (this.isInFullscreen_) {
        replaceNode(this.labelActiveNode_, this.labelNode_);
        this.dispatchEvent(FullScreenEventType.ENTERFULLSCREEN);
      } else {
        replaceNode(this.labelNode_, this.labelActiveNode_);
        this.dispatchEvent(FullScreenEventType.LEAVEFULLSCREEN);
      }
      map.updateSize();
    }
  }

  /**
   * @param {HTMLElement} element Target element
   * @param {boolean} fullscreen True if fullscreen class name should be active
   * @private
   */
  setClassName_(element, fullscreen) {
    if (fullscreen) {
      element.classList.remove(...this.inactiveClassName_);
      element.classList.add(...this.activeClassName_);
    } else {
      element.classList.remove(...this.activeClassName_);
      element.classList.add(...this.inactiveClassName_);
    }
  }

  /**
   * Remove the control from its current map and attach it to the new map.
   * Pass `null` to just remove the control from the current map.
   * Subclasses may set up event handlers to get notified about changes to
   * the map here.
   * @param {import("../Map.js").default|null} map Map.
   * @api
   * @override
   */
  setMap(map) {
    const oldMap = this.getMap();
    if (oldMap) {
      oldMap.removeChangeListener(
        MapProperty.TARGET,
        this.boundHandleMapTargetChange_,
      );
    }

    super.setMap(map);

    this.handleMapTargetChange_();
    if (map) {
      map.addChangeListener(
        MapProperty.TARGET,
        this.boundHandleMapTargetChange_,
      );
    }
  }

  /**
   * @private
   */
  handleMapTargetChange_() {
    const listeners = this.documentListeners_;
    for (let i = 0, ii = listeners.length; i < ii; ++i) {
      unlistenByKey(listeners[i]);
    }
    listeners.length = 0;

    const map = this.getMap();
    if (map) {
      const doc = map.getOwnerDocument();
      if (isFullScreenSupported(doc)) {
        this.element.classList.remove(CLASS_UNSUPPORTED);
      } else {
        this.element.classList.add(CLASS_UNSUPPORTED);
      }

      for (let i = 0, ii = events.length; i < ii; ++i) {
        listeners.push(
          listen(doc, events[i], this.handleFullScreenChange_, this),
        );
      }
      this.handleFullScreenChange_();
    }
  }
}

/**
 * @param {Document} doc The root document to check.
 * @return {boolean} Fullscreen is supported by the current platform.
 */
function isFullScreenSupported(doc) {
  const body = doc.body;
  return !!(
    body['webkitRequestFullscreen'] ||
    (body.requestFullscreen && doc.fullscreenEnabled)
  );
}

/**
 * @param {Document} doc The root document to check.
 * @return {boolean} Element is currently in fullscreen.
 */
function isFullScreen(doc) {
  return !!(doc['webkitIsFullScreen'] || doc.fullscreenElement);
}

/**
 * Request to fullscreen an element.
 * @param {HTMLElement} element Element to request fullscreen
 */
function requestFullScreen(element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
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
 * @param {Document} doc The document to exit fullscren from
 */
function exitFullScreen(doc) {
  if (doc.exitFullscreen) {
    doc.exitFullscreen();
  } else if (doc['webkitExitFullscreen']) {
    doc['webkitExitFullscreen']();
  }
}

export default FullScreen;
