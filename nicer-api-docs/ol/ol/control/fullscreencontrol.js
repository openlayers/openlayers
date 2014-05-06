goog.provide('ol.control.FullScreen');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('googx.dom.fullscreen');
goog.require('googx.dom.fullscreen.EventType');
goog.require('ol.control.Control');
goog.require('ol.css');
goog.require('ol.pointer.PointerEventHandler');



/**
 * Provides a button that when clicked fills up the full screen with the map.
 * When in full screen mode, a close button is shown to exit full screen mode.
 * The [Fullscreen API](http://www.w3.org/TR/fullscreen/) is used to
 * toggle the map in full screen mode.
 *
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.FullScreenOptions=} opt_options Options.
 * @todo api
 */
ol.control.FullScreen = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {string}
   */
  this.cssClassName_ = goog.isDef(options.className) ?
      options.className : 'ol-full-screen';

  var tipLabel = goog.isDef(options.tipLabel) ?
      options.tipLabel : 'Toggle full-screen';
  var tip = goog.dom.createDom(goog.dom.TagName.SPAN, {
    'role' : 'tooltip'
  }, tipLabel);

  var button = goog.dom.createDom(goog.dom.TagName.BUTTON, {
    'class': this.cssClassName_ + '-' + googx.dom.fullscreen.isFullScreen() +
        ' ol-has-tooltip'
  });
  goog.dom.appendChild(button, tip);
  var buttonHandler = new ol.pointer.PointerEventHandler(button);
  this.registerDisposable(buttonHandler);
  goog.events.listen(buttonHandler,
      ol.pointer.EventType.POINTERUP, this.handleClick_, false, this);

  goog.events.listen(button, [
    goog.events.EventType.MOUSEOUT,
    goog.events.EventType.FOCUSOUT
  ], function() {
    this.blur();
  }, false);

  goog.events.listen(goog.global.document,
      googx.dom.fullscreen.EventType.CHANGE,
      this.handleFullScreenChange_, false, this);

  var element = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': this.cssClassName_ + ' ' + ol.css.CLASS_UNSELECTABLE + ' ' +
        (!googx.dom.fullscreen.isSupported() ? ol.css.CLASS_UNSUPPORTED : '')
  }, button);

  goog.base(this, {
    element: element,
    target: options.target
  });

  /**
   * @private
   * @type {boolean}
   */
  this.keys_ = goog.isDef(options.keys) ? options.keys : false;

};
goog.inherits(ol.control.FullScreen, ol.control.Control);


/**
 * @param {ol.pointer.PointerEvent} pointerEvent Pointer event.
 * @private
 */
ol.control.FullScreen.prototype.handleClick_ = function(pointerEvent) {
  if (!googx.dom.fullscreen.isSupported()) {
    return;
  }
  pointerEvent.browserEvent.preventDefault();
  var map = this.getMap();
  if (goog.isNull(map)) {
    return;
  }
  if (googx.dom.fullscreen.isFullScreen()) {
    googx.dom.fullscreen.exitFullScreen();
  } else {
    var target = map.getTarget();
    goog.asserts.assert(goog.isDefAndNotNull(target));
    var element = goog.dom.getElement(target);
    goog.asserts.assert(goog.isDefAndNotNull(element));
    if (this.keys_) {
      googx.dom.fullscreen.requestFullScreenWithKeys(element);
    } else {
      googx.dom.fullscreen.requestFullScreen(element);
    }
  }
};


/**
 * @private
 */
ol.control.FullScreen.prototype.handleFullScreenChange_ = function() {
  var opened = this.cssClassName_ + '-true';
  var closed = this.cssClassName_ + '-false';
  var anchor = goog.dom.getFirstElementChild(this.element);
  var map = this.getMap();
  if (googx.dom.fullscreen.isFullScreen()) {
    goog.dom.classes.swap(anchor, closed, opened);
  } else {
    goog.dom.classes.swap(anchor, opened, closed);
  }
  if (!goog.isNull(map)) {
    map.updateSize();
  }
};
