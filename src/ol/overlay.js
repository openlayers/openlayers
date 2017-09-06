import _ol_ from './index';
import _ol_MapEventType_ from './mapeventtype';
import _ol_Object_ from './object';
import _ol_OverlayPositioning_ from './overlaypositioning';
import _ol_css_ from './css';
import _ol_dom_ from './dom';
import _ol_events_ from './events';
import _ol_extent_ from './extent';

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
   * @private
   * @type {number|string|undefined}
   */
  this.id_ = options.id;

  /**
   * @private
   * @type {boolean}
   */
  this.insertFirst_ = options.insertFirst !== undefined ?
    options.insertFirst : true;

  /**
   * @private
   * @type {boolean}
   */
  this.stopEvent_ = options.stopEvent !== undefined ? options.stopEvent : true;

  /**
   * @private
   * @type {Element}
   */
  this.element_ = document.createElement('DIV');
  this.element_.className = 'ol-overlay-container ' + _ol_css_.CLASS_SELECTABLE;
  this.element_.style.position = 'absolute';

  /**
   * @protected
   * @type {boolean}
   */
  this.autoPan = options.autoPan !== undefined ? options.autoPan : false;

  /**
   * @private
   * @type {olx.OverlayPanOptions}
   */
  this.autoPanAnimation_ = options.autoPanAnimation ||
    /** @type {olx.OverlayPanOptions} */ ({});

  /**
   * @private
   * @type {number}
   */
  this.autoPanMargin_ = options.autoPanMargin !== undefined ?
    options.autoPanMargin : 20;

  /**
   * @private
   * @type {{bottom_: string,
   *         left_: string,
   *         right_: string,
   *         top_: string,
   *         visible: boolean}}
   */
  this.rendered_ = {
    bottom_: '',
    left_: '',
    right_: '',
    top_: '',
    visible: true
  };

  /**
   * @private
   * @type {?ol.EventsKey}
   */
  this.mapPostrenderListenerKey_ = null;

  _ol_events_.listen(
      this, _ol_Object_.getChangeEventType(_ol_Overlay_.Property_.ELEMENT),
      this.handleElementChanged, this);

  _ol_events_.listen(
      this, _ol_Object_.getChangeEventType(_ol_Overlay_.Property_.MAP),
      this.handleMapChanged, this);

  _ol_events_.listen(
      this, _ol_Object_.getChangeEventType(_ol_Overlay_.Property_.OFFSET),
      this.handleOffsetChanged, this);

  _ol_events_.listen(
      this, _ol_Object_.getChangeEventType(_ol_Overlay_.Property_.POSITION),
      this.handlePositionChanged, this);

  _ol_events_.listen(
      this, _ol_Object_.getChangeEventType(_ol_Overlay_.Property_.POSITIONING),
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

_ol_.inherits(_ol_Overlay_, _ol_Object_);


/**
 * Get the DOM element of this overlay.
 * @return {Element|undefined} The Element containing the overlay.
 * @observable
 * @api
 */
_ol_Overlay_.prototype.getElement = function() {
  return (
    /** @type {Element|undefined} */ this.get(_ol_Overlay_.Property_.ELEMENT)
  );
};


/**
 * Get the overlay identifier which is set on constructor.
 * @return {number|string|undefined} Id.
 * @api
 */
_ol_Overlay_.prototype.getId = function() {
  return this.id_;
};


/**
 * Get the map associated with this overlay.
 * @return {ol.PluggableMap|undefined} The map that the overlay is part of.
 * @observable
 * @api
 */
_ol_Overlay_.prototype.getMap = function() {
  return (
    /** @type {ol.PluggableMap|undefined} */ this.get(_ol_Overlay_.Property_.MAP)
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
    /** @type {Array.<number>} */ this.get(_ol_Overlay_.Property_.OFFSET)
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
    /** @type {ol.Coordinate|undefined} */ this.get(_ol_Overlay_.Property_.POSITION)
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
    /** @type {ol.OverlayPositioning} */ this.get(_ol_Overlay_.Property_.POSITIONING)
  );
};


/**
 * @protected
 */
_ol_Overlay_.prototype.handleElementChanged = function() {
  _ol_dom_.removeChildren(this.element_);
  var element = this.getElement();
  if (element) {
    this.element_.appendChild(element);
  }
};


/**
 * @protected
 */
_ol_Overlay_.prototype.handleMapChanged = function() {
  if (this.mapPostrenderListenerKey_) {
    _ol_dom_.removeNode(this.element_);
    _ol_events_.unlistenByKey(this.mapPostrenderListenerKey_);
    this.mapPostrenderListenerKey_ = null;
  }
  var map = this.getMap();
  if (map) {
    this.mapPostrenderListenerKey_ = _ol_events_.listen(map,
        _ol_MapEventType_.POSTRENDER, this.render, this);
    this.updatePixelPosition();
    var container = this.stopEvent_ ?
      map.getOverlayContainerStopEvent() : map.getOverlayContainer();
    if (this.insertFirst_) {
      container.insertBefore(this.element_, container.childNodes[0] || null);
    } else {
      container.appendChild(this.element_);
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
  if (this.get(_ol_Overlay_.Property_.POSITION) && this.autoPan) {
    this.panIntoView_();
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
  this.set(_ol_Overlay_.Property_.ELEMENT, element);
};


/**
 * Set the map to be associated with this overlay.
 * @param {ol.PluggableMap|undefined} map The map that the overlay is part of.
 * @observable
 * @api
 */
_ol_Overlay_.prototype.setMap = function(map) {
  this.set(_ol_Overlay_.Property_.MAP, map);
};


/**
 * Set the offset for this overlay.
 * @param {Array.<number>} offset Offset.
 * @observable
 * @api
 */
_ol_Overlay_.prototype.setOffset = function(offset) {
  this.set(_ol_Overlay_.Property_.OFFSET, offset);
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
  this.set(_ol_Overlay_.Property_.POSITION, position);
};


/**
 * Pan the map so that the overlay is entirely visible in the current viewport
 * (if necessary).
 * @private
 */
_ol_Overlay_.prototype.panIntoView_ = function() {
  var map = this.getMap();

  if (!map || !map.getTargetElement()) {
    return;
  }

  var mapRect = this.getRect_(map.getTargetElement(), map.getSize());
  var element = /** @type {!Element} */ (this.getElement());
  var overlayRect = this.getRect_(element,
      [_ol_dom_.outerWidth(element), _ol_dom_.outerHeight(element)]);

  var margin = this.autoPanMargin_;
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
        duration: this.autoPanAnimation_.duration,
        easing: this.autoPanAnimation_.easing
      });
    }
  }
};


/**
 * Get the extent of an element relative to the document
 * @param {Element|undefined} element The element.
 * @param {ol.Size|undefined} size The size of the element.
 * @return {ol.Extent} The extent.
 * @private
 */
_ol_Overlay_.prototype.getRect_ = function(element, size) {
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
  this.set(_ol_Overlay_.Property_.POSITIONING, positioning);
};


/**
 * Modify the visibility of the element.
 * @param {boolean} visible Element visibility.
 * @protected
 */
_ol_Overlay_.prototype.setVisible = function(visible) {
  if (this.rendered_.visible !== visible) {
    this.element_.style.display = visible ? '' : 'none';
    this.rendered_.visible = visible;
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
  var style = this.element_.style;
  var offset = this.getOffset();

  var positioning = this.getPositioning();

  this.setVisible(true);

  var offsetX = offset[0];
  var offsetY = offset[1];
  if (positioning == _ol_OverlayPositioning_.BOTTOM_RIGHT ||
      positioning == _ol_OverlayPositioning_.CENTER_RIGHT ||
      positioning == _ol_OverlayPositioning_.TOP_RIGHT) {
    if (this.rendered_.left_ !== '') {
      this.rendered_.left_ = style.left = '';
    }
    var right = (mapSize[0] - pixel[0] - offsetX) + 'px';
    if (this.rendered_.right_ != right) {
      this.rendered_.right_ = style.right = right;
    }
  } else {
    if (this.rendered_.right_ !== '') {
      this.rendered_.right_ = style.right = '';
    }
    if (positioning == _ol_OverlayPositioning_.BOTTOM_CENTER ||
        positioning == _ol_OverlayPositioning_.CENTER_CENTER ||
        positioning == _ol_OverlayPositioning_.TOP_CENTER) {
      offsetX -= this.element_.offsetWidth / 2;
    }
    var left = (pixel[0] + offsetX) + 'px';
    if (this.rendered_.left_ != left) {
      this.rendered_.left_ = style.left = left;
    }
  }
  if (positioning == _ol_OverlayPositioning_.BOTTOM_LEFT ||
      positioning == _ol_OverlayPositioning_.BOTTOM_CENTER ||
      positioning == _ol_OverlayPositioning_.BOTTOM_RIGHT) {
    if (this.rendered_.top_ !== '') {
      this.rendered_.top_ = style.top = '';
    }
    var bottom = (mapSize[1] - pixel[1] - offsetY) + 'px';
    if (this.rendered_.bottom_ != bottom) {
      this.rendered_.bottom_ = style.bottom = bottom;
    }
  } else {
    if (this.rendered_.bottom_ !== '') {
      this.rendered_.bottom_ = style.bottom = '';
    }
    if (positioning == _ol_OverlayPositioning_.CENTER_LEFT ||
        positioning == _ol_OverlayPositioning_.CENTER_CENTER ||
        positioning == _ol_OverlayPositioning_.CENTER_RIGHT) {
      offsetY -= this.element_.offsetHeight / 2;
    }
    var top = (pixel[1] + offsetY) + 'px';
    if (this.rendered_.top_ != top) {
      this.rendered_.top_ = style.top = top;
    }
  }
};


/**
 * @enum {string}
 * @private
 */
_ol_Overlay_.Property_ = {
  ELEMENT: 'element',
  MAP: 'map',
  OFFSET: 'offset',
  POSITION: 'position',
  POSITIONING: 'positioning'
};
export default _ol_Overlay_;
