/**
 * @module ol/Overlay
 */
import {inherits} from './index.js';
import _ol_MapEventType_ from './MapEventType.js';
import _ol_Object_ from './Object.js';
import _ol_OverlayPositioning_ from './OverlayPositioning.js';
import _ol_css_ from './css.js';
import _ol_dom_ from './dom.js';
import _ol_events_ from './events.js';
import _ol_extent_ from './extent.js';

/**
 * @classdesc
 * An element to be displayed over the map and attached to a single map
 * location.  Like {@link ol.control.Control}, Overlays are visible widgets.
 * Unlike Controls, they are not in a fixed position on the screen, but are tied
 * to a geographical coordinate, so panning the map will move an Overlay but not
 * a Control.
 *
 * Example:
 *
 *     var popup = new ol.Overlay({
 *       element: document.getElementById('popup')
 *     });
 *     popup.setPosition(coordinate);
 *     map.addOverlay(popup);
 *
 * @constructor
 * @extends {ol.Object}
 * @param {olx.OverlayOptions} options Overlay options.
 * @api
 */
var _ol_Overlay_ = function(options) {

  _ol_Object_.call(this);

  /**
   * @protected
   * @type {olx.OverlayOptions}
   */
  this.options = options;

  /**
   * @protected
   * @type {number|string|undefined}
   */
  this.id = options.id;

  /**
   * @protected
   * @type {boolean}
   */
  this.insertFirst = options.insertFirst !== undefined ?
    options.insertFirst : true;

  /**
   * @protected
   * @type {boolean}
   */
  this.stopEvent = options.stopEvent !== undefined ? options.stopEvent : true;

  /**
   * @protected
   * @type {Element}
   */
  this.element = document.createElement('DIV');
  this.element.className = options.className !== undefined ?
    options.className : 'ol-overlay-container ' + _ol_css_.CLASS_SELECTABLE;
  this.element.style.position = 'absolute';

  /**
   * @protected
   * @type {boolean}
   */
  this.autoPan = options.autoPan !== undefined ? options.autoPan : false;

  /**
   * @protected
   * @type {olx.OverlayPanOptions}
   */
  this.autoPanAnimation = options.autoPanAnimation ||
    /** @type {olx.OverlayPanOptions} */ ({});

  /**
   * @protected
   * @type {number}
   */
  this.autoPanMargin = options.autoPanMargin !== undefined ?
    options.autoPanMargin : 20;

  /**
   * @protected
   * @type {{bottom_: string,
   *         left_: string,
   *         right_: string,
   *         top_: string,
   *         visible: boolean}}
   */
  this.rendered = {
    bottom_: '',
    left_: '',
    right_: '',
    top_: '',
    visible: true
  };

  /**
   * @protected
   * @type {?ol.EventsKey}
   */
  this.mapPostrenderListenerKey = null;

  _ol_events_.listen(
      this, _ol_Object_.getChangeEventType(_ol_Overlay_.Property.ELEMENT),
      this.handleElementChanged, this);

  _ol_events_.listen(
      this, _ol_Object_.getChangeEventType(_ol_Overlay_.Property.MAP),
      this.handleMapChanged, this);

  _ol_events_.listen(
      this, _ol_Object_.getChangeEventType(_ol_Overlay_.Property.OFFSET),
      this.handleOffsetChanged, this);

  _ol_events_.listen(
      this, _ol_Object_.getChangeEventType(_ol_Overlay_.Property.POSITION),
      this.handlePositionChanged, this);

  _ol_events_.listen(
      this, _ol_Object_.getChangeEventType(_ol_Overlay_.Property.POSITIONING),
      this.handlePositioningChanged, this);

  if (options.element !== undefined) {
    this.setElement(options.element);
  }

  this.setOffset(options.offset !== undefined ? options.offset : [0, 0]);

  this.setPositioning(options.positioning !== undefined ?
    /** @type {ol.OverlayPositioning} */ (options.positioning) :
    _ol_OverlayPositioning_.TOP_LEFT);

  if (options.position !== undefined) {
    this.setPosition(options.position);
  }

};

inherits(_ol_Overlay_, _ol_Object_);


/**
 * Get the DOM element of this overlay.
 * @return {Element|undefined} The Element containing the overlay.
 * @observable
 * @api
 */
_ol_Overlay_.prototype.getElement = function() {
  return (
    /** @type {Element|undefined} */ this.get(_ol_Overlay_.Property.ELEMENT)
  );
};


/**
 * Get the overlay identifier which is set on constructor.
 * @return {number|string|undefined} Id.
 * @api
 */
_ol_Overlay_.prototype.getId = function() {
  return this.id;
};


/**
 * Get the map associated with this overlay.
 * @return {ol.PluggableMap|undefined} The map that the overlay is part of.
 * @observable
 * @api
 */
_ol_Overlay_.prototype.getMap = function() {
  return (
    /** @type {ol.PluggableMap|undefined} */ this.get(_ol_Overlay_.Property.MAP)
  );
};


/**
 * Get the offset of this overlay.
 * @return {Array.<number>} The offset.
 * @observable
 * @api
 */
_ol_Overlay_.prototype.getOffset = function() {
  return (
    /** @type {Array.<number>} */ this.get(_ol_Overlay_.Property.OFFSET)
  );
};


/**
 * Get the current position of this overlay.
 * @return {ol.Coordinate|undefined} The spatial point that the overlay is
 *     anchored at.
 * @observable
 * @api
 */
_ol_Overlay_.prototype.getPosition = function() {
  return (
    /** @type {ol.Coordinate|undefined} */ this.get(_ol_Overlay_.Property.POSITION)
  );
};


/**
 * Get the current positioning of this overlay.
 * @return {ol.OverlayPositioning} How the overlay is positioned
 *     relative to its point on the map.
 * @observable
 * @api
 */
_ol_Overlay_.prototype.getPositioning = function() {
  return (
    /** @type {ol.OverlayPositioning} */ this.get(_ol_Overlay_.Property.POSITIONING)
  );
};


/**
 * @protected
 */
_ol_Overlay_.prototype.handleElementChanged = function() {
  _ol_dom_.removeChildren(this.element);
  var element = this.getElement();
  if (element) {
    this.element.appendChild(element);
  }
};


/**
 * @protected
 */
_ol_Overlay_.prototype.handleMapChanged = function() {
  if (this.mapPostrenderListenerKey) {
    _ol_dom_.removeNode(this.element);
    _ol_events_.unlistenByKey(this.mapPostrenderListenerKey);
    this.mapPostrenderListenerKey = null;
  }
  var map = this.getMap();
  if (map) {
    this.mapPostrenderListenerKey = _ol_events_.listen(map,
        _ol_MapEventType_.POSTRENDER, this.render, this);
    this.updatePixelPosition();
    var container = this.stopEvent ?
      map.getOverlayContainerStopEvent() : map.getOverlayContainer();
    if (this.insertFirst) {
      container.insertBefore(this.element, container.childNodes[0] || null);
    } else {
      container.appendChild(this.element);
    }
  }
};


/**
 * @protected
 */
_ol_Overlay_.prototype.render = function() {
  this.updatePixelPosition();
};


/**
 * @protected
 */
_ol_Overlay_.prototype.handleOffsetChanged = function() {
  this.updatePixelPosition();
};


/**
 * @protected
 */
_ol_Overlay_.prototype.handlePositionChanged = function() {
  this.updatePixelPosition();
  if (this.get(_ol_Overlay_.Property.POSITION) && this.autoPan) {
    this.panIntoView();
  }
};


/**
 * @protected
 */
_ol_Overlay_.prototype.handlePositioningChanged = function() {
  this.updatePixelPosition();
};


/**
 * Set the DOM element to be associated with this overlay.
 * @param {Element|undefined} element The Element containing the overlay.
 * @observable
 * @api
 */
_ol_Overlay_.prototype.setElement = function(element) {
  this.set(_ol_Overlay_.Property.ELEMENT, element);
};


/**
 * Set the map to be associated with this overlay.
 * @param {ol.PluggableMap|undefined} map The map that the overlay is part of.
 * @observable
 * @api
 */
_ol_Overlay_.prototype.setMap = function(map) {
  this.set(_ol_Overlay_.Property.MAP, map);
};


/**
 * Set the offset for this overlay.
 * @param {Array.<number>} offset Offset.
 * @observable
 * @api
 */
_ol_Overlay_.prototype.setOffset = function(offset) {
  this.set(_ol_Overlay_.Property.OFFSET, offset);
};


/**
 * Set the position for this overlay. If the position is `undefined` the
 * overlay is hidden.
 * @param {ol.Coordinate|undefined} position The spatial point that the overlay
 *     is anchored at.
 * @observable
 * @api
 */
_ol_Overlay_.prototype.setPosition = function(position) {
  this.set(_ol_Overlay_.Property.POSITION, position);
};


/**
 * Pan the map so that the overlay is entirely visible in the current viewport
 * (if necessary).
 * @protected
 */
_ol_Overlay_.prototype.panIntoView = function() {
  var map = this.getMap();

  if (!map || !map.getTargetElement()) {
    return;
  }

  var mapRect = this.getRect(map.getTargetElement(), map.getSize());
  var element = /** @type {!Element} */ (this.getElement());
  var overlayRect = this.getRect(element,
      [_ol_dom_.outerWidth(element), _ol_dom_.outerHeight(element)]);

  var margin = this.autoPanMargin;
  if (!_ol_extent_.containsExtent(mapRect, overlayRect)) {
    // the overlay is not completely inside the viewport, so pan the map
    var offsetLeft = overlayRect[0] - mapRect[0];
    var offsetRight = mapRect[2] - overlayRect[2];
    var offsetTop = overlayRect[1] - mapRect[1];
    var offsetBottom = mapRect[3] - overlayRect[3];

    var delta = [0, 0];
    if (offsetLeft < 0) {
      // move map to the left
      delta[0] = offsetLeft - margin;
    } else if (offsetRight < 0) {
      // move map to the right
      delta[0] = Math.abs(offsetRight) + margin;
    }
    if (offsetTop < 0) {
      // move map up
      delta[1] = offsetTop - margin;
    } else if (offsetBottom < 0) {
      // move map down
      delta[1] = Math.abs(offsetBottom) + margin;
    }

    if (delta[0] !== 0 || delta[1] !== 0) {
      var center = /** @type {ol.Coordinate} */ (map.getView().getCenter());
      var centerPx = map.getPixelFromCoordinate(center);
      var newCenterPx = [
        centerPx[0] + delta[0],
        centerPx[1] + delta[1]
      ];

      map.getView().animate({
        center: map.getCoordinateFromPixel(newCenterPx),
        duration: this.autoPanAnimation.duration,
        easing: this.autoPanAnimation.easing
      });
    }
  }
};


/**
 * Get the extent of an element relative to the document
 * @param {Element|undefined} element The element.
 * @param {ol.Size|undefined} size The size of the element.
 * @return {ol.Extent} The extent.
 * @protected
 */
_ol_Overlay_.prototype.getRect = function(element, size) {
  var box = element.getBoundingClientRect();
  var offsetX = box.left + window.pageXOffset;
  var offsetY = box.top + window.pageYOffset;
  return [
    offsetX,
    offsetY,
    offsetX + size[0],
    offsetY + size[1]
  ];
};


/**
 * Set the positioning for this overlay.
 * @param {ol.OverlayPositioning} positioning how the overlay is
 *     positioned relative to its point on the map.
 * @observable
 * @api
 */
_ol_Overlay_.prototype.setPositioning = function(positioning) {
  this.set(_ol_Overlay_.Property.POSITIONING, positioning);
};


/**
 * Modify the visibility of the element.
 * @param {boolean} visible Element visibility.
 * @protected
 */
_ol_Overlay_.prototype.setVisible = function(visible) {
  if (this.rendered.visible !== visible) {
    this.element.style.display = visible ? '' : 'none';
    this.rendered.visible = visible;
  }
};


/**
 * Update pixel position.
 * @protected
 */
_ol_Overlay_.prototype.updatePixelPosition = function() {
  var map = this.getMap();
  var position = this.getPosition();
  if (!map || !map.isRendered() || !position) {
    this.setVisible(false);
    return;
  }

  var pixel = map.getPixelFromCoordinate(position);
  var mapSize = map.getSize();
  this.updateRenderedPosition(pixel, mapSize);
};


/**
 * @param {ol.Pixel} pixel The pixel location.
 * @param {ol.Size|undefined} mapSize The map size.
 * @protected
 */
_ol_Overlay_.prototype.updateRenderedPosition = function(pixel, mapSize) {
  var style = this.element.style;
  var offset = this.getOffset();

  var positioning = this.getPositioning();

  this.setVisible(true);

  var offsetX = offset[0];
  var offsetY = offset[1];
  if (positioning == _ol_OverlayPositioning_.BOTTOM_RIGHT ||
      positioning == _ol_OverlayPositioning_.CENTER_RIGHT ||
      positioning == _ol_OverlayPositioning_.TOP_RIGHT) {
    if (this.rendered.left_ !== '') {
      this.rendered.left_ = style.left = '';
    }
    var right = Math.round(mapSize[0] - pixel[0] - offsetX) + 'px';
    if (this.rendered.right_ != right) {
      this.rendered.right_ = style.right = right;
    }
  } else {
    if (this.rendered.right_ !== '') {
      this.rendered.right_ = style.right = '';
    }
    if (positioning == _ol_OverlayPositioning_.BOTTOM_CENTER ||
        positioning == _ol_OverlayPositioning_.CENTER_CENTER ||
        positioning == _ol_OverlayPositioning_.TOP_CENTER) {
      offsetX -= this.element.offsetWidth / 2;
    }
    var left = Math.round(pixel[0] + offsetX) + 'px';
    if (this.rendered.left_ != left) {
      this.rendered.left_ = style.left = left;
    }
  }
  if (positioning == _ol_OverlayPositioning_.BOTTOM_LEFT ||
      positioning == _ol_OverlayPositioning_.BOTTOM_CENTER ||
      positioning == _ol_OverlayPositioning_.BOTTOM_RIGHT) {
    if (this.rendered.top_ !== '') {
      this.rendered.top_ = style.top = '';
    }
    var bottom = Math.round(mapSize[1] - pixel[1] - offsetY) + 'px';
    if (this.rendered.bottom_ != bottom) {
      this.rendered.bottom_ = style.bottom = bottom;
    }
  } else {
    if (this.rendered.bottom_ !== '') {
      this.rendered.bottom_ = style.bottom = '';
    }
    if (positioning == _ol_OverlayPositioning_.CENTER_LEFT ||
        positioning == _ol_OverlayPositioning_.CENTER_CENTER ||
        positioning == _ol_OverlayPositioning_.CENTER_RIGHT) {
      offsetY -= this.element.offsetHeight / 2;
    }
    var top = Math.round(pixel[1] + offsetY) + 'px';
    if (this.rendered.top_ != top) {
      this.rendered.top_ = style.top = top;
    }
  }
};


/**
 * returns the options this Overlay has been created with
 * @public
 * @return {olx.OverlayOptions} overlay options
 */
_ol_Overlay_.prototype.getOptions = function() {
  return this.options;
};


/**
 * @enum {string}
 * @protected
 */
_ol_Overlay_.Property = {
  ELEMENT: 'element',
  MAP: 'map',
  OFFSET: 'offset',
  POSITION: 'position',
  POSITIONING: 'positioning'
};
export default _ol_Overlay_;
