goog.provide('ol.control.OverviewMap');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classlist');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.math.Size');
goog.require('goog.style');
goog.require('ol.Collection');
goog.require('ol.Map');
goog.require('ol.MapEventType');
goog.require('ol.Object');
goog.require('ol.Overlay');
goog.require('ol.OverlayPositioning');
goog.require('ol.View');
goog.require('ol.control.Control');
goog.require('ol.coordinate');
goog.require('ol.css');
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

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @type {boolean}
   * @private
   */
  this.collapsed_ = goog.isDef(options.collapsed) ? options.collapsed : true;

  /**
   * @private
   * @type {boolean}
   */
  this.collapsible_ = goog.isDef(options.collapsible) ?
      options.collapsible : true;

  if (!this.collapsible_) {
    this.collapsed_ = false;
  }

  var className = goog.isDef(options.className) ?
      options.className : 'ol-overviewmap';

  var tipLabel = goog.isDef(options.tipLabel) ?
      options.tipLabel : 'Overview map';

  /**
   * @private
   * @type {string}
   */
  this.collapseLabel_ = goog.isDef(options.collapseLabel) ?
      options.collapseLabel : '\u00AB';

  /**
   * @private
   * @type {string}
   */
  this.label_ = goog.isDef(options.label) ? options.label : '\u00BB';
  var label = goog.dom.createDom(goog.dom.TagName.SPAN, {},
      (this.collapsible_ && !this.collapsed_) ?
      this.collapseLabel_ : this.label_);

  /**
   * @private
   * @type {Element}
   */
  this.labelSpan_ = label;
  var button = goog.dom.createDom(goog.dom.TagName.BUTTON, {
    'type': 'button',
    'title': tipLabel
  }, this.labelSpan_);

  goog.events.listen(button, goog.events.EventType.CLICK,
      this.handleClick_, false, this);

  goog.events.listen(button, [
    goog.events.EventType.MOUSEOUT,
    goog.events.EventType.FOCUSOUT
  ], function() {
    this.blur();
  }, false);

  var ovmapDiv = goog.dom.createDom(goog.dom.TagName.DIV, 'ol-overviewmap-map');

  /**
   * @type {ol.Map}
   * @private
   */
  this.ovmap_ = new ol.Map({
    controls: new ol.Collection(),
    interactions: new ol.Collection(),
    target: ovmapDiv
  });
  var ovmap = this.ovmap_;

  if (goog.isDef(options.layers)) {
    options.layers.forEach(
        /**
       * @param {ol.layer.Layer} layer Layer.
       */
        function(layer) {
          ovmap.addLayer(layer);
        }, this);
  }

  var box = goog.dom.createDom(goog.dom.TagName.DIV, 'ol-overviewmap-box');

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
  var element = goog.dom.createDom(goog.dom.TagName.DIV,
      cssClasses, ovmapDiv, button);

  var render = goog.isDef(options.render) ?
      options.render : ol.control.OverviewMap.render;

  goog.base(this, {
    element: element,
    render: render,
    target: options.target
  });
};
goog.inherits(ol.control.OverviewMap, ol.control.Control);


/**
 * @inheritDoc
 * @api
 */
ol.control.OverviewMap.prototype.setMap = function(map) {
  var currentMap = this.getMap();

  if (goog.isNull(map) && !goog.isNull(currentMap)) {
    goog.events.unlisten(
        currentMap, ol.Object.getChangeEventType(ol.MapProperty.VIEW),
        this.handleViewChanged_, false, this);
  }

  goog.base(this, 'setMap', map);

  if (!goog.isNull(map)) {

    // if no layers were set for the overviewmap map, then bind with
    // those in the main map
    if (this.ovmap_.getLayers().getLength() === 0) {
      this.ovmap_.bindTo(ol.MapProperty.LAYERGROUP, map);
    }

    // bind current map view, or any new one
    this.bindView_();

    goog.events.listen(
        map, ol.Object.getChangeEventType(ol.MapProperty.VIEW),
        this.handleViewChanged_, false, this);

    this.ovmap_.updateSize();
    this.resetExtent_();
  }
};


/**
 * Bind some actions to the main map view.
 * @private
 */
ol.control.OverviewMap.prototype.bindView_ = function() {
  var map = this.getMap();
  var view = map.getView();

  // if the map does not have a view, we can't act upon it
  if (goog.isNull(view)) {
    return;
  }

  // FIXME - the overviewmap view rotation currently follows the one used
  // by the main map view.  We could support box rotation instead.  The choice
  // between the 2 modes would be made in a single option
  this.ovmap_.getView().bindTo(ol.ViewProperty.ROTATION, view);
};


/**
 * @param {ol.MapEvent} mapEvent Map event.
 * @this {ol.control.OverviewMap}
 * @api
 */
ol.control.OverviewMap.render = function(mapEvent) {
  this.validateExtent_();
  this.updateBox_();
};


/**
 * Called on main map view changed.
 * @param {goog.events.Event} event Event.
 * @private
 */
ol.control.OverviewMap.prototype.handleViewChanged_ = function(event) {
  this.bindView_();
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

  var mapSize = map.getSize();
  goog.asserts.assertArray(mapSize);

  var view = map.getView();
  goog.asserts.assert(goog.isDef(view));
  var extent = view.calculateExtent(mapSize);

  var ovmapSize = ovmap.getSize();
  goog.asserts.assertArray(ovmapSize);

  var ovview = ovmap.getView();
  goog.asserts.assert(goog.isDef(ovview));
  var ovextent = ovview.calculateExtent(ovmapSize);

  var topLeftPixel =
      ovmap.getPixelFromCoordinate(ol.extent.getTopLeft(extent));
  var bottomRightPixel =
      ovmap.getPixelFromCoordinate(ol.extent.getBottomRight(extent));
  var boxSize = new goog.math.Size(
      Math.abs(topLeftPixel[0] - bottomRightPixel[0]),
      Math.abs(topLeftPixel[1] - bottomRightPixel[1]));

  var ovmapWidth = ovmapSize[0];
  var ovmapHeight = ovmapSize[1];

  if (boxSize.width < ovmapWidth * ol.OVERVIEWMAP_MIN_RATIO ||
      boxSize.height < ovmapHeight * ol.OVERVIEWMAP_MIN_RATIO ||
      boxSize.width > ovmapWidth * ol.OVERVIEWMAP_MAX_RATIO ||
      boxSize.height > ovmapHeight * ol.OVERVIEWMAP_MAX_RATIO) {
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

  var mapSize = map.getSize();
  goog.asserts.assertArray(mapSize);

  var view = map.getView();
  goog.asserts.assert(goog.isDef(view));
  var extent = view.calculateExtent(mapSize);

  var ovmapSize = ovmap.getSize();
  goog.asserts.assertArray(ovmapSize);

  var ovview = ovmap.getView();
  goog.asserts.assert(goog.isDef(ovview));

  // get how many times the current map overview could hold different
  // box sizes using the min and max ratio, pick the step in the middle used
  // to calculate the extent from the main map to set it to the overview map,
  var steps = Math.log(
      ol.OVERVIEWMAP_MAX_RATIO / ol.OVERVIEWMAP_MIN_RATIO) / Math.LN2;
  var ratio = 1 / (Math.pow(2, steps / 2) * ol.OVERVIEWMAP_MIN_RATIO);
  ol.extent.scaleFromCenter(extent, ratio);
  ovview.fitExtent(extent, ovmapSize);
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
  goog.asserts.assert(goog.isDef(view));

  var ovview = ovmap.getView();
  goog.asserts.assert(goog.isDef(ovview));

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

  var mapSize = map.getSize();
  goog.asserts.assertArray(mapSize);

  var view = map.getView();
  goog.asserts.assert(goog.isDef(view));

  var ovview = ovmap.getView();
  goog.asserts.assert(goog.isDef(ovview));

  var ovmapSize = ovmap.getSize();
  goog.asserts.assertArray(ovmapSize);

  var rotation = view.getRotation();
  goog.asserts.assert(goog.isDef(rotation));

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
  if (goog.isDefAndNotNull(box)) {
    var boxWidth = Math.abs((bottomLeft[0] - topRight[0]) / ovresolution);
    var boxHeight = Math.abs((topRight[1] - bottomLeft[1]) / ovresolution);
    goog.style.setBorderBoxSize(box, new goog.math.Size(
        boxWidth, boxHeight));
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
  goog.asserts.assert(goog.isDef(view));

  var currentCenter = view.getCenter();

  if (goog.isDef(currentCenter)) {
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
 * @param {goog.events.BrowserEvent} event The event to handle
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
  goog.dom.classlist.toggle(this.element, 'ol-collapsed');
  goog.dom.setTextContent(this.labelSpan_,
      (this.collapsed_) ? this.collapseLabel_ : this.label_);
  this.collapsed_ = !this.collapsed_;

  // manage overview map if it had not been rendered before and control
  // is expanded
  var ovmap = this.ovmap_;
  if (!this.collapsed_ && !ovmap.isRendered()) {
    ovmap.updateSize();
    this.resetExtent_();
    goog.events.listenOnce(ovmap, ol.MapEventType.POSTRENDER,
        function(event) {
          this.updateBox_();
        },
        false, this);
  }
};


/**
 * @return {boolean} True if the widget is collapsible.
 * @api stable
 */
ol.control.OverviewMap.prototype.getCollapsible = function() {
  return this.collapsible_;
};


/**
 * @param {boolean} collapsible True if the widget is collapsible.
 * @api stable
 */
ol.control.OverviewMap.prototype.setCollapsible = function(collapsible) {
  if (this.collapsible_ === collapsible) {
    return;
  }
  this.collapsible_ = collapsible;
  goog.dom.classlist.toggle(this.element, 'ol-uncollapsible');
  if (!collapsible && this.collapsed_) {
    this.handleToggle_();
  }
};


/**
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
 * @return {boolean} True if the widget is collapsed.
 * @api stable
 */
ol.control.OverviewMap.prototype.getCollapsed = function() {
  return this.collapsed_;
};
