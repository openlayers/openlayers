goog.provide('ol.control.OverviewMap');

goog.require('ol');
goog.require('ol.Collection');
goog.require('ol.Map');
goog.require('ol.MapEventType');
goog.require('ol.Object');
goog.require('ol.ObjectEventType');
goog.require('ol.Overlay');
goog.require('ol.OverlayPositioning');
goog.require('ol.View');
goog.require('ol.control.Control');
goog.require('ol.coordinate');
goog.require('ol.css');
goog.require('ol.dom');
goog.require('ol.events');
goog.require('ol.events.EventType');
goog.require('ol.extent');


/**
 * Create a new control with a map acting as an overview map for an other
 * defined map.
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.OverviewMapOptions=} opt_options OverviewMap options.
 * @api
 */
ol.control.OverviewMap = function(opt_options) {

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

  ol.events.listen(button, ol.events.EventType.CLICK,
      this.handleClick_, this);

  var ovmapDiv = document.createElement('DIV');
  ovmapDiv.className = 'ol-overviewmap-map';

  /**
   * @type {ol.Map}
   * @private
   */
  this.ovmap_ = new ol.Map({
    controls: new ol.Collection(),
    interactions: new ol.Collection(),
    target: ovmapDiv,
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
  this.boxOverlay_ = new ol.Overlay({
    position: [0, 0],
    positioning: ol.OverlayPositioning.BOTTOM_LEFT,
    element: box
  });
  this.ovmap_.addOverlay(this.boxOverlay_);

  var cssClasses = className + ' ' + ol.css.CLASS_UNSELECTABLE + ' ' +
      ol.css.CLASS_CONTROL +
      (this.collapsed_ && this.collapsible_ ? ' ol-collapsed' : '') +
      (this.collapsible_ ? '' : ' ol-uncollapsible');
  var element = document.createElement('div');
  element.className = cssClasses;
  element.appendChild(ovmapDiv);
  element.appendChild(button);

  var render = options.render ? options.render : ol.control.OverviewMap.render;

  ol.control.Control.call(this, {
    element: element,
    render: render,
    target: options.target
  });
};
ol.inherits(ol.control.OverviewMap, ol.control.Control);


/**
 * @inheritDoc
 * @api
 */
ol.control.OverviewMap.prototype.setMap = function(map) {
  var oldMap = this.getMap();
  if (map === oldMap) {
    return;
  }
  if (oldMap) {
    var oldView = oldMap.getView();
    if (oldView) {
      this.unbindView_(oldView);
    }
  }
  ol.control.Control.prototype.setMap.call(this, map);

  if (map) {
    this.listenerKeys.push(ol.events.listen(
        map, ol.ObjectEventType.PROPERTYCHANGE,
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
 * @param {ol.ObjectEvent} event The propertychange event.
 * @private
 */
ol.control.OverviewMap.prototype.handleMapPropertyChange_ = function(event) {
  if (event.key === ol.MapProperty.VIEW) {
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
ol.control.OverviewMap.prototype.bindView_ = function(view) {
  ol.events.listen(view,
      ol.Object.getChangeEventType(ol.View.Property.ROTATION),
      this.handleRotationChanged_, this);
};


/**
 * Unregister listeners for view property changes.
 * @param {ol.View} view The view.
 * @private
 */
ol.control.OverviewMap.prototype.unbindView_ = function(view) {
  ol.events.unlisten(view,
      ol.Object.getChangeEventType(ol.View.Property.ROTATION),
      this.handleRotationChanged_, this);
};


/**
 * Handle rotation changes to the main map.
 * TODO: This should rotate the extent rectrangle instead of the
 * overview map's view.
 * @private
 */
ol.control.OverviewMap.prototype.handleRotationChanged_ = function() {
  this.ovmap_.getView().setRotation(this.getMap().getView().getRotation());
};


/**
 * Update the overview map element.
 * @param {ol.MapEvent} mapEvent Map event.
 * @this {ol.control.OverviewMap}
 * @api
 */
ol.control.OverviewMap.render = function(mapEvent) {
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
ol.control.OverviewMap.prototype.validateExtent_ = function() {
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
      ovmap.getPixelFromCoordinate(ol.extent.getTopLeft(extent));
  var bottomRightPixel =
      ovmap.getPixelFromCoordinate(ol.extent.getBottomRight(extent));

  var boxWidth = Math.abs(topLeftPixel[0] - bottomRightPixel[0]);
  var boxHeight = Math.abs(topLeftPixel[1] - bottomRightPixel[1]);

  var ovmapWidth = ovmapSize[0];
  var ovmapHeight = ovmapSize[1];

  if (boxWidth < ovmapWidth * ol.OVERVIEWMAP_MIN_RATIO ||
      boxHeight < ovmapHeight * ol.OVERVIEWMAP_MIN_RATIO ||
      boxWidth > ovmapWidth * ol.OVERVIEWMAP_MAX_RATIO ||
      boxHeight > ovmapHeight * ol.OVERVIEWMAP_MAX_RATIO) {
    this.resetExtent_();
  } else if (!ol.extent.containsExtent(ovextent, extent)) {
    this.recenter_();
  }
};


/**
 * Reset the overview map extent to half calculated min and max ratio times
 * the extent of the main map.
 * @private
 */
ol.control.OverviewMap.prototype.resetExtent_ = function() {
  if (ol.OVERVIEWMAP_MAX_RATIO === 0 || ol.OVERVIEWMAP_MIN_RATIO === 0) {
    return;
  }

  var map = this.getMap();
  var ovmap = this.ovmap_;

  var mapSize = /** @type {ol.Size} */ (map.getSize());

  var view = map.getView();
  var extent = view.calculateExtent(mapSize);

  var ovmapSize = /** @type {ol.Size} */ (ovmap.getSize());

  var ovview = ovmap.getView();

  // get how many times the current map overview could hold different
  // box sizes using the min and max ratio, pick the step in the middle used
  // to calculate the extent from the main map to set it to the overview map,
  var steps = Math.log(
      ol.OVERVIEWMAP_MAX_RATIO / ol.OVERVIEWMAP_MIN_RATIO) / Math.LN2;
  var ratio = 1 / (Math.pow(2, steps / 2) * ol.OVERVIEWMAP_MIN_RATIO);
  ol.extent.scaleFromCenter(extent, ratio);
  ovview.fit(extent, ovmapSize);
};


/**
 * Set the center of the overview map to the map center without changing its
 * resolution.
 * @private
 */
ol.control.OverviewMap.prototype.recenter_ = function() {
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
ol.control.OverviewMap.prototype.updateBox_ = function() {
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
  var bottomLeft = ol.extent.getBottomLeft(extent);
  var topRight = ol.extent.getTopRight(extent);

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
ol.control.OverviewMap.prototype.calculateCoordinateRotate_ = function(
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
    ol.coordinate.rotate(coordinateRotate, rotation);
    ol.coordinate.add(coordinateRotate, currentCenter);
  }
  return coordinateRotate;
};


/**
 * @param {Event} event The event to handle
 * @private
 */
ol.control.OverviewMap.prototype.handleClick_ = function(event) {
  event.preventDefault();
  this.handleToggle_();
};


/**
 * @private
 */
ol.control.OverviewMap.prototype.handleToggle_ = function() {
  this.element.classList.toggle('ol-collapsed');
  if (this.collapsed_) {
    ol.dom.replaceNode(this.collapseLabel_, this.label_);
  } else {
    ol.dom.replaceNode(this.label_, this.collapseLabel_);
  }
  this.collapsed_ = !this.collapsed_;

  // manage overview map if it had not been rendered before and control
  // is expanded
  var ovmap = this.ovmap_;
  if (!this.collapsed_ && !ovmap.isRendered()) {
    ovmap.updateSize();
    this.resetExtent_();
    ol.events.listenOnce(ovmap, ol.MapEventType.POSTRENDER,
        function(event) {
          this.updateBox_();
        },
        this);
  }
};


/**
 * Return `true` if the overview map is collapsible, `false` otherwise.
 * @return {boolean} True if the widget is collapsible.
 * @api stable
 */
ol.control.OverviewMap.prototype.getCollapsible = function() {
  return this.collapsible_;
};


/**
 * Set whether the overview map should be collapsible.
 * @param {boolean} collapsible True if the widget is collapsible.
 * @api stable
 */
ol.control.OverviewMap.prototype.setCollapsible = function(collapsible) {
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
 * @api stable
 */
ol.control.OverviewMap.prototype.setCollapsed = function(collapsed) {
  if (!this.collapsible_ || this.collapsed_ === collapsed) {
    return;
  }
  this.handleToggle_();
};


/**
 * Determine if the overview map is collapsed.
 * @return {boolean} The overview map is collapsed.
 * @api stable
 */
ol.control.OverviewMap.prototype.getCollapsed = function() {
  return this.collapsed_;
};


/**
 * Return the overview map.
 * @return {ol.Map} Overview map.
 * @api
 */
ol.control.OverviewMap.prototype.getOverviewMap = function() {
  return this.ovmap_;
};
