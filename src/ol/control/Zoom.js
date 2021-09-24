/**
 * @module ol/control/Zoom
 */
import Control from './Control.js';
import EventType from '../events/EventType.js';
import {CLASS_CONTROL, CLASS_UNSELECTABLE} from '../css.js';
import {easeOut} from '../easing.js';

/**
 * @typedef {Object} Options
 * @property {number} [duration=250] Animation duration in milliseconds.
 * @property {string} [className='ol-zoom'] CSS class name.
 * @property {string} [zoomInClassName=className + '-in'] CSS class name for the zoom-in button.
 * @property {string} [zoomOutClassName=className + '-out'] CSS class name for the zoom-out button.
 * @property {string|HTMLElement} [zoomInLabel='+'] Text label to use for the zoom-in
 * button. Instead of text, also an element (e.g. a `span` element) can be used.
 * @property {string|HTMLElement} [zoomOutLabel='–'] Text label to use for the zoom-out button.
 * Instead of text, also an element (e.g. a `span` element) can be used.
 * @property {string} [zoomInTipLabel='Zoom in'] Text label to use for the button tip.
 * @property {string} [zoomOutTipLabel='Zoom out'] Text label to use for the button tip.
 * @property {number} [delta=1] The zoom delta applied on each click.
 * @property {HTMLElement|string} [target] Specify a target if you want the control to be
 * rendered outside of the map's viewport.
 */

/**
 * @classdesc
 * A control with 2 buttons, one for zoom in and one for zoom out.
 * This control is one of the default controls of a map. To style this control
 * use css selectors `.ol-zoom-in` and `.ol-zoom-out`.
 *
 * @api
 */
class Zoom extends Control {
  /**
   * @param {Options} [opt_options] Zoom options.
   */
  constructor(opt_options) {
    const options = opt_options ? opt_options : {};

    super({
      element: document.createElement('div'),
      target: options.target,
    });

    const className =
      options.className !== undefined ? options.className : 'ol-zoom';

    const delta = options.delta !== undefined ? options.delta : 1;

    const zoomInClassName =
      options.zoomInClassName !== undefined
        ? options.zoomInClassName
        : className + '-in';

    const zoomOutClassName =
      options.zoomOutClassName !== undefined
        ? options.zoomOutClassName
        : className + '-out';

    const zoomInLabel =
      options.zoomInLabel !== undefined ? options.zoomInLabel : '+';
    const zoomOutLabel =
      options.zoomOutLabel !== undefined ? options.zoomOutLabel : '\u2013';

    const zoomInTipLabel =
      options.zoomInTipLabel !== undefined ? options.zoomInTipLabel : 'Zoom in';
    const zoomOutTipLabel =
      options.zoomOutTipLabel !== undefined
        ? options.zoomOutTipLabel
        : 'Zoom out';

    const inElement = document.createElement('button');
    inElement.className = zoomInClassName;
    inElement.setAttribute('type', 'button');
    inElement.title = zoomInTipLabel;
    inElement.appendChild(
      typeof zoomInLabel === 'string'
        ? document.createTextNode(zoomInLabel)
        : zoomInLabel
    );

    inElement.addEventListener(
      EventType.CLICK,
      this.handleClick_.bind(this, delta),
      false
    );

    const outElement = document.createElement('button');
    outElement.className = zoomOutClassName;
    outElement.setAttribute('type', 'button');
    outElement.title = zoomOutTipLabel;
    outElement.appendChild(
      typeof zoomOutLabel === 'string'
        ? document.createTextNode(zoomOutLabel)
        : zoomOutLabel
    );

    outElement.addEventListener(
      EventType.CLICK,
      this.handleClick_.bind(this, -delta),
      false
    );

    const cssClasses =
      className + ' ' + CLASS_UNSELECTABLE + ' ' + CLASS_CONTROL;
    const element = this.element;
    element.className = cssClasses;
    element.appendChild(inElement);
    element.appendChild(outElement);

    /**
     * @type {number}
     * @private
     */
    this.duration_ = options.duration !== undefined ? options.duration : 250;
  }

  /**
   * @param {number} delta Zoom delta.
   * @param {MouseEvent} event The event to handle
   * @private
   */
  handleClick_(delta, event) {
    event.preventDefault();
    this.zoomByDelta_(delta);
  }

  /**
   * @param {number} delta Zoom delta.
   * @private
   */
  zoomByDelta_(delta) {
    const map = this.getMap();
    const view = map.getView();
    if (!view) {
      // the map does not have a view, so we can't act
      // upon it
      return;
    }
    const currentZoom = view.getZoom();
    if (currentZoom !== undefined) {
      const newZoom = view.getConstrainedZoom(currentZoom + delta);
      if (this.duration_ > 0) {
        if (view.getAnimating()) {
          view.cancelAnimations();
        }
        view.animate({
          zoom: newZoom,
          duration: this.duration_,
          easing: easeOut,
        });
      } else {
        view.setZoom(newZoom);
      }
    }
  }
}

export default Zoom;
