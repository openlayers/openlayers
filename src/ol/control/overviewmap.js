import _ol_ from '../index';
import _ol_Collection_ from '../collection';
import _ol_PluggableMap_ from '../pluggablemap';
import _ol_MapEventType_ from '../mapeventtype';
import _ol_MapProperty_ from '../mapproperty';
import _ol_Object_ from '../object';
import _ol_ObjectEventType_ from '../objecteventtype';
import _ol_Overlay_ from '../overlay';
import _ol_OverlayPositioning_ from '../overlaypositioning';
import _ol_ViewProperty_ from '../viewproperty';
import _ol_control_Control_ from '../control/control';
import _ol_coordinate_ from '../coordinate';
import _ol_css_ from '../css';
import _ol_dom_ from '../dom';
import _ol_events_ from '../events';
import _ol_events_EventType_ from '../events/eventtype';
import _ol_extent_ from '../extent';

/**
 * Create a new control with a map acting as an overview map for an other
 * defined map.
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.OverviewMapOptions=} opt_options OverviewMap options.
 * @api
 */
var _ol_control_OverviewMap_ = function(opt_options) {

  var options = opt_options ? opt_options : {};

  /**
   * @type {boolean}
   * @private
   */
  this.collapsed_ = options.collapsed !== undefined ? options.collapsed : true;

  /**
   * @private
   * @type {boolean}
   */
  this.collapsible_ = options.collapsible !== undefined ?
    options.collapsible : true;

  if (!this.collapsible_) {
    this.collapsed_ = false;
  }

  var className = options.className !== undefined ? options.className : 'ol-overviewmap';

  var tipLabel = options.tipLabel !== undefined ? options.tipLabel : 'Overview map';

  var collapseLabel = options.collapseLabel !== undefined ? options.collapseLabel : '\u00AB';

  if (typeof collapseLabel === 'string') {
    /**
     * @private
     * @type {Node}
     */
    this.collapseLabel_ = document.createElement('span');
    this.collapseLabel_.textContent = collapseLabel;
  } else {
    this.collapseLabel_ = collapseLabel;
  }

  var label = options.label !== undefined ? options.label : '\u00BB';


  if (typeof label === 'string') {
    /**
     * @private
     * @type {Node}
     */
    this.label_ = document.createElement('span');
    this.label_.textContent = label;
  } else {
    this.label_ = label;
  }

  var activeLabel = (this.collapsible_ && !this.collapsed_) ?
    this.collapseLabel_ : this.label_;
  var button = document.createElement('button');
  button.setAttribute('type', 'button');
  button.title = tipLabel;
  button.appendChild(activeLabel);

  _ol_events_.listen(button, _ol_events_EventType_.CLICK,
      this.handleClick_, this);

  /**
   * @type {Element}
   * @private
   */
  this.ovmapDiv_ = document.createElement('DIV');
  this.ovmapDiv_.className = 'ol-overviewmap-map';

  /**
   * @type {ol.PluggableMap}
   * @private
   */
  this.ovmap_ = new _ol_PluggableMap_({
    controls: new _ol_Collection_(),
    interactions: new _ol_Collection_(),
    view: options.view
  });
  var ovmap = this.ovmap_;

  if (options.layers) {
    options.layers.forEach(
        /**
       * @param {ol.layer.Layer} layer Layer.
       */
        function(layer) {
          ovmap.addLayer(layer);
        }, this);
  }

  var box = document.createElement('DIV');
  box.className = 'ol-overviewmap-box';
  box.style.boxSizing = 'border-box';

  /**
   * @type {ol.Overlay}
   * @private
   */
  this.boxOverlay_ = new _ol_Overlay_({
    position: [0, 0],
    positioning: _ol_OverlayPositioning_.BOTTOM_LEFT,
    element: box
  });
  this.ovmap_.addOverlay(this.boxOverlay_);

  var cssClasses = className + ' ' + _ol_css_.CLASS_UNSELECTABLE + ' ' +
      _ol_css_.CLASS_CONTROL +
      (this.collapsed_ && this.collapsible_ ? ' ol-collapsed' : '') +
      (this.collapsible_ ? '' : ' ol-uncollapsible');
  var element = document.createElement('div');
  element.className = cssClasses;
  element.appendChild(this.ovmapDiv_);
  element.appendChild(button);

  var render = options.render ? options.render : _ol_control_OverviewMap_.render;

  _ol_control_Control_.call(this, {
    element: element,
    render: render,
    target: options.target
  });

  /* Interactive map */

  var scope = this;

  var overlay = this.boxOverlay_;
  var overlayBox = this.boxOverlay_.getElement();

  /* Functions definition */

  var computeDesiredMousePosition = function(mousePosition) {
    return {
      clientX: mousePosition.clientX - (overlayBox.offsetWidth / 2),
      clientY: mousePosition.clientY + (overlayBox.offsetHeight / 2)
    };
  };

  var move = function(event) {
    var coordinates = ovmap.getEventCoordinate(computeDesiredMousePosition(event));

    overlay.setPosition(coordinates);
  };

  var endMoving = function(event) {
    var coordinates = ovmap.getEventCoordinate(event);

    scope.getMap().getView().setCenter(coordinates);

    window.removeEventListener('mousemove', move);
    window.removeEventListener('mouseup', endMoving);
  };

  /* Binding */

  overlayBox.addEventListener('mousedown', function() {
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', endMoving);
  });
};

_ol_.inherits(_ol_control_OverviewMap_, _ol_control_Control_);


/**
 * @inheritDoc
 * @api
 */
_ol_control_OverviewMap_.prototype.setMap = function(map) {
  var oldMap = this.getMap();
  if (map === oldMap) {
    return;
  }
  if (oldMap) {
    var oldView = oldMap.getView();
    if (oldView) {
      this.unbindView_(oldView);
    }
    this.ovmap_.setTarget(null);
  }
  _ol_control_Control_.prototype.setMap.call(this, map);

  if (map) {
    this.ovmap_.setTarget(this.ovmapDiv_);
    this.listenerKeys.push(_ol_events_.listen(
        map, _ol_ObjectEventType_.PROPERTYCHANGE,
        this.handleMapPropertyChange_, this));

    // TODO: to really support map switching, this would need to be reworked
    if (this.ovmap_.getLayers().getLength() === 0) {
      this.ovmap_.setLayerGroup(map.getLayerGroup());
    }

    var view = map.getView();
    if (view) {
      this.bindView_(view);
      if (view.isDef()) {
        this.ovmap_.updateSize();
        this.resetExtent_();
      }
    }
  }
};


/**
 * Handle map property changes.  This only deals with changes to the map's view.
 * @param {ol.Object.Event} event The propertychange event.
 * @private
 */
_ol_control_OverviewMap_.prototype.handleMapPropertyChange_ = function(event) {
  if (event.key === _ol_MapProperty_.VIEW) {
    var oldView = /** @type {ol.View} */ (event.oldValue);
    if (oldView) {
      this.unbindView_(oldView);
    }
    var newView = this.getMap().getView();
    this.bindView_(newView);
  }
};


/**
 * Register listeners for view property changes.
 * @param {ol.View} view The view.
 * @private
 */
_ol_control_OverviewMap_.prototype.bindView_ = function(view) {
  _ol_events_.listen(view,
      _ol_Object_.getChangeEventType(_ol_ViewProperty_.ROTATION),
      this.handleRotationChanged_, this);
};


/**
 * Unregister listeners for view property changes.
 * @param {ol.View} view The view.
 * @private
 */
_ol_control_OverviewMap_.prototype.unbindView_ = function(view) {
  _ol_events_.unlisten(view,
      _ol_Object_.getChangeEventType(_ol_ViewProperty_.ROTATION),
      this.handleRotationChanged_, this);
};


/**
 * Handle rotation changes to the main map.
 * TODO: This should rotate the extent rectrangle instead of the
 * overview map's view.
 * @private
 */
_ol_control_OverviewMap_.prototype.handleRotationChanged_ = function() {
  this.ovmap_.getView().setRotation(this.getMap().getView().getRotation());
};


/**
 * Update the overview map element.
 * @param {ol.MapEvent} mapEvent Map event.
 * @this {ol.control.OverviewMap}
 * @api
 */
_ol_control_OverviewMap_.render = function(mapEvent) {
  this.validateExtent_();
  this.updateBox_();
};


/**
 * Reset the overview map extent if the box size (width or
 * height) is less than the size of the overview map size times minRatio
 * or is greater than the size of the overview size times maxRatio.
 *
 * If the map extent was not reset, the box size can fits in the defined
 * ratio sizes. This method then checks if is contained inside the overview
 * map current extent. If not, recenter the overview map to the current
 * main map center location.
 * @private
 */
_ol_control_OverviewMap_.prototype.validateExtent_ = function() {
  var map = this.getMap();
  var ovmap = this.ovmap_;

  if (!map.isRendered() || !ovmap.isRendered()) {
    return;
  }

  var mapSize = /** @type {ol.Size} */ (map.getSize());

  var view = map.getView();
  var extent = view.calculateExtent(mapSize);

  var ovmapSize = /** @type {ol.Size} */ (ovmap.getSize());

  var ovview = ovmap.getView();
  var ovextent = ovview.calculateExtent(ovmapSize);

  var topLeftPixel =
      ovmap.getPixelFromCoordinate(_ol_extent_.getTopLeft(extent));
  var bottomRightPixel =
      ovmap.getPixelFromCoordinate(_ol_extent_.getBottomRight(extent));

  var boxWidth = Math.abs(topLeftPixel[0] - bottomRightPixel[0]);
  var boxHeight = Math.abs(topLeftPixel[1] - bottomRightPixel[1]);

  var ovmapWidth = ovmapSize[0];
  var ovmapHeight = ovmapSize[1];

  if (boxWidth < ovmapWidth * _ol_.OVERVIEWMAP_MIN_RATIO ||
      boxHeight < ovmapHeight * _ol_.OVERVIEWMAP_MIN_RATIO ||
      boxWidth > ovmapWidth * _ol_.OVERVIEWMAP_MAX_RATIO ||
      boxHeight > ovmapHeight * _ol_.OVERVIEWMAP_MAX_RATIO) {
    this.resetExtent_();
  } else if (!_ol_extent_.containsExtent(ovextent, extent)) {
    this.recenter_();
  }
};


/**
 * Reset the overview map extent to half calculated min and max ratio times
 * the extent of the main map.
 * @private
 */
_ol_control_OverviewMap_.prototype.resetExtent_ = function() {
  if (_ol_.OVERVIEWMAP_MAX_RATIO === 0 || _ol_.OVERVIEWMAP_MIN_RATIO === 0) {
    return;
  }

  var map = this.getMap();
  var ovmap = this.ovmap_;

  var mapSize = /** @type {ol.Size} */ (map.getSize());

  var view = map.getView();
  var extent = view.calculateExtent(mapSize);

  var ovview = ovmap.getView();

  // get how many times the current map overview could hold different
  // box sizes using the min and max ratio, pick the step in the middle used
  // to calculate the extent from the main map to set it to the overview map,
  var steps = Math.log(
      _ol_.OVERVIEWMAP_MAX_RATIO / _ol_.OVERVIEWMAP_MIN_RATIO) / Math.LN2;
  var ratio = 1 / (Math.pow(2, steps / 2) * _ol_.OVERVIEWMAP_MIN_RATIO);
  _ol_extent_.scaleFromCenter(extent, ratio);
  ovview.fit(extent);
};


/**
 * Set the center of the overview map to the map center without changing its
 * resolution.
 * @private
 */
_ol_control_OverviewMap_.prototype.recenter_ = function() {
  var map = this.getMap();
  var ovmap = this.ovmap_;

  var view = map.getView();

  var ovview = ovmap.getView();

  ovview.setCenter(view.getCenter());
};


/**
 * Update the box using the main map extent
 * @private
 */
_ol_control_OverviewMap_.prototype.updateBox_ = function() {
  var map = this.getMap();
  var ovmap = this.ovmap_;

  if (!map.isRendered() || !ovmap.isRendered()) {
    return;
  }

  var mapSize = /** @type {ol.Size} */ (map.getSize());

  var view = map.getView();

  var ovview = ovmap.getView();

  var rotation = view.getRotation();

  var overlay = this.boxOverlay_;
  var box = this.boxOverlay_.getElement();
  var extent = view.calculateExtent(mapSize);
  var ovresolution = ovview.getResolution();
  var bottomLeft = _ol_extent_.getBottomLeft(extent);
  var topRight = _ol_extent_.getTopRight(extent);

  // set position using bottom left coordinates
  var rotateBottomLeft = this.calculateCoordinateRotate_(rotation, bottomLeft);
  overlay.setPosition(rotateBottomLeft);

  // set box size calculated from map extent size and overview map resolution
  if (box) {
    box.style.width = Math.abs((bottomLeft[0] - topRight[0]) / ovresolution) + 'px';
    box.style.height = Math.abs((topRight[1] - bottomLeft[1]) / ovresolution) + 'px';
  }
};


/**
 * @param {number} rotation Target rotation.
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {ol.Coordinate|undefined} Coordinate for rotation and center anchor.
 * @private
 */
_ol_control_OverviewMap_.prototype.calculateCoordinateRotate_ = function(
    rotation, coordinate) {
  var coordinateRotate;

  var map = this.getMap();
  var view = map.getView();

  var currentCenter = view.getCenter();

  if (currentCenter) {
    coordinateRotate = [
      coordinate[0] - currentCenter[0],
      coordinate[1] - currentCenter[1]
    ];
    _ol_coordinate_.rotate(coordinateRotate, rotation);
    _ol_coordinate_.add(coordinateRotate, currentCenter);
  }
  return coordinateRotate;
};


/**
 * @param {Event} event The event to handle
 * @private
 */
_ol_control_OverviewMap_.prototype.handleClick_ = function(event) {
  event.preventDefault();
  this.handleToggle_();
};


/**
 * @private
 */
_ol_control_OverviewMap_.prototype.handleToggle_ = function() {
  this.element.classList.toggle('ol-collapsed');
  if (this.collapsed_) {
    _ol_dom_.replaceNode(this.collapseLabel_, this.label_);
  } else {
    _ol_dom_.replaceNode(this.label_, this.collapseLabel_);
  }
  this.collapsed_ = !this.collapsed_;

  // manage overview map if it had not been rendered before and control
  // is expanded
  var ovmap = this.ovmap_;
  if (!this.collapsed_ && !ovmap.isRendered()) {
    ovmap.updateSize();
    this.resetExtent_();
    _ol_events_.listenOnce(ovmap, _ol_MapEventType_.POSTRENDER,
        function(event) {
          this.updateBox_();
        },
        this);
  }
};


/**
 * Return `true` if the overview map is collapsible, `false` otherwise.
 * @return {boolean} True if the widget is collapsible.
 * @api
 */
_ol_control_OverviewMap_.prototype.getCollapsible = function() {
  return this.collapsible_;
};


/**
 * Set whether the overview map should be collapsible.
 * @param {boolean} collapsible True if the widget is collapsible.
 * @api
 */
_ol_control_OverviewMap_.prototype.setCollapsible = function(collapsible) {
  if (this.collapsible_ === collapsible) {
    return;
  }
  this.collapsible_ = collapsible;
  this.element.classList.toggle('ol-uncollapsible');
  if (!collapsible && this.collapsed_) {
    this.handleToggle_();
  }
};


/**
 * Collapse or expand the overview map according to the passed parameter. Will
 * not do anything if the overview map isn't collapsible or if the current
 * collapsed state is already the one requested.
 * @param {boolean} collapsed True if the widget is collapsed.
 * @api
 */
_ol_control_OverviewMap_.prototype.setCollapsed = function(collapsed) {
  if (!this.collapsible_ || this.collapsed_ === collapsed) {
    return;
  }
  this.handleToggle_();
};


/**
 * Determine if the overview map is collapsed.
 * @return {boolean} The overview map is collapsed.
 * @api
 */
_ol_control_OverviewMap_.prototype.getCollapsed = function() {
  return this.collapsed_;
};


/**
 * Return the overview map.
 * @return {ol.PluggableMap} Overview map.
 * @api
 */
_ol_control_OverviewMap_.prototype.getOverviewMap = function() {
  return this.ovmap_;
};
export default _ol_control_OverviewMap_;
