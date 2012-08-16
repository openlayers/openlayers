// FIXME better map browser event types
// FIXME recheck layer/map projection compatability when projection changes
// FIXME layer renderers should skip when they can't reproject
// FIXME add tilt and height?
// FIXME add postrender event

goog.provide('ol.Map');
goog.provide('ol.MapProperty');

goog.require('goog.array');
goog.require('goog.dispose');
goog.require('goog.dom');
goog.require('goog.dom.ViewportSizeMonitor');
goog.require('goog.events');
goog.require('goog.events.BrowserEvent');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('goog.events.KeyHandler');
goog.require('goog.events.KeyHandler.EventType');
goog.require('goog.events.MouseWheelEvent');
goog.require('goog.events.MouseWheelHandler');
goog.require('goog.events.MouseWheelHandler.EventType');
goog.require('goog.functions');
goog.require('goog.fx.DragEvent');
goog.require('goog.fx.Dragger');
goog.require('goog.fx.anim');
goog.require('goog.fx.anim.Animated');
goog.require('goog.object');
goog.require('ol.Collection');
goog.require('ol.Color');
goog.require('ol.Coordinate');
goog.require('ol.Extent');
goog.require('ol.Interaction');
goog.require('ol.LayerRenderer');
goog.require('ol.MapBrowserEvent');
goog.require('ol.Object');
goog.require('ol.Pixel');
goog.require('ol.Projection');
goog.require('ol.Size');
goog.require('ol.TransformFunction');


/**
 * @enum {string}
 */
ol.MapProperty = {
  BACKGROUND_COLOR: 'backgroundColor',
  CENTER: 'center',
  INTERACTIONS: 'interactions',
  LAYERS: 'layers',
  PROJECTION: 'projection',
  RESOLUTION: 'resolution',
  ROTATION: 'rotation',
  SIZE: 'size',
  USER_PROJECTION: 'userProjection'
};


/**
 * @enum {number}
 */
ol.MapPaneZIndex = {
  EVENTS: 1000
};



/**
 * @constructor
 * @extends {ol.Object}
 * @param {Element} target Target.
 * @param {function(new: ol.MapRenderer, Element, ol.Map)} rendererConstructor
 *     Renderer constructor.
 * @param {Object=} opt_values Values.
 * @param {goog.dom.ViewportSizeMonitor=} opt_viewportSizeMonitor
 *     Viewport size monitor.
 */
ol.Map = function(
    target, rendererConstructor, opt_values, opt_viewportSizeMonitor) {

  goog.base(this);

  /**
   * @type {ol.TransformFunction}
   * @private
   */
  this.userToMapTransform_ = ol.Projection.identityTransform;

  /**
   * @type {ol.TransformFunction}
   * @private
   */
  this.mapToUserTransform_ = ol.Projection.cloneTransform;

  /**
   * @private
   * @type {boolean}
   */
  this.animating_ = false;

  /**
   * @private
   * @type {boolean}
   */
  this.dirty_ = false;

  /**
   * @private
   * @type {number}
   */
  this.freezeRenderingCount_ = 0;

  /**
   * @private
   * @type {Element}
   */
  this.eventsPane_ = goog.dom.createElement(goog.dom.TagName.DIV);
  this.eventsPane_.className = 'ol-pane-events';
  this.eventsPane_.style.position = 'absolute';
  // FIXME why can't we use width and height 100% here?
  this.eventsPane_.style.width = target.clientWidth + 'px';
  this.eventsPane_.style.height = target.clientHeight + 'px';
  this.eventsPane_.style.zIndex = ol.MapPaneZIndex.EVENTS;
  goog.dom.appendChild(target, this.eventsPane_);

  goog.events.listen(this.eventsPane_, [
    goog.events.EventType.DBLCLICK
  ], this.handleBrowserEvent, false, this);

  // FIXME we probably shouldn't listen on document...
  var keyHandler = new goog.events.KeyHandler(document);
  goog.events.listen(keyHandler, goog.events.KeyHandler.EventType.KEY,
      this.handleBrowserEvent, false, this);
  this.registerDisposable(keyHandler);

  var mouseWheelHandler = new goog.events.MouseWheelHandler(this.eventsPane_);
  goog.events.listen(mouseWheelHandler,
      goog.events.MouseWheelHandler.EventType.MOUSEWHEEL,
      this.handleBrowserEvent, false, this);
  this.registerDisposable(mouseWheelHandler);

  var dragger = new goog.fx.Dragger(this.eventsPane_);
  dragger.defaultAction = function() {};
  goog.events.listen(dragger, [
    goog.fx.Dragger.EventType.START,
    goog.fx.Dragger.EventType.DRAG,
    goog.fx.Dragger.EventType.END
  ], this.handleDraggerEvent, false, this);
  this.registerDisposable(dragger);

  /**
   * @type {ol.MapRenderer}
   * @private
   */
  this.renderer_ = new rendererConstructor(target, this);
  this.registerDisposable(this.renderer_);

  /**
   * @private
   * @type {ol.MapAnimation}
   */
  this.animation_ = new ol.MapAnimation(this.renderer_);

  /**
   * @private
   * @type {Element}
   */
  this.target_ = target;

  /**
   * @private
   * @type {goog.dom.ViewportSizeMonitor}
   */
  this.viewportSizeMonitor_ =
      opt_viewportSizeMonitor || new goog.dom.ViewportSizeMonitor();

  goog.events.listen(this.viewportSizeMonitor_, goog.events.EventType.RESIZE,
      this.handleViewportResize, false, this);

  goog.events.listen(
      this, ol.Object.getChangedEventType(ol.MapProperty.PROJECTION),
      this.handleProjectionChanged, false, this);

  goog.events.listen(
      this, ol.Object.getChangedEventType(ol.MapProperty.USER_PROJECTION),
      this.handleUserProjectionChanged, false, this);

  if (goog.isDef(opt_values)) {
    this.setValues(opt_values);
  }

  this.handleViewportResize();

};
goog.inherits(ol.Map, ol.Object);


/**
 * @private
 */
ol.Map.prototype.animate_ = function() {
  goog.asserts.assert(!this.animating_);
  goog.fx.anim.registerAnimation(this.animation_);
  this.animating_ = true;
};


/**
 * @return {boolean} Can rotate.
 */
ol.Map.prototype.canRotate = function() {
  return this.renderer_.canRotate();
};


/**
 * @param {ol.Extent} extent Extent.
 */
ol.Map.prototype.fitExtent = function(extent) {
  this.withFrozenRendering(function() {
    this.setCenter(extent.getCenter());
    this.setResolution(this.getResolutionForExtent(extent));
    if (this.canRotate()) {
      this.setRotation(0);
    }
  }, this);
};


/**
 * @param {ol.Extent} userExtent Extent in user projection.
 */
ol.Map.prototype.fitUserExtent = function(userExtent) {
  this.fitExtent(userExtent.transform(this.userToMapTransform_));
};


/**
 */
ol.Map.prototype.freezeRendering = function() {
  ++this.freezeRenderingCount_;
};


/**
 * @return {ol.Color|undefined} Background color.
 */
ol.Map.prototype.getBackgroundColor = function() {
  return /** @type {ol.Color|undefined} */ (
      this.get(ol.MapProperty.BACKGROUND_COLOR));
};
goog.exportProperty(
    ol.Map.prototype,
    'getBackgroundColor',
    ol.Map.prototype.getBackgroundColor);


/**
 * @return {ol.Coordinate|undefined} Center.
 */
ol.Map.prototype.getCenter = function() {
  return /** @type {ol.Coordinate} */ this.get(ol.MapProperty.CENTER);
};
goog.exportProperty(
    ol.Map.prototype,
    'getCenter',
    ol.Map.prototype.getCenter);


/**
 * @param {ol.Pixel} pixel Pixel.
 * @return {ol.Coordinate|undefined} Coordinate.
 */
ol.Map.prototype.getCoordinateFromPixel = function(pixel) {
  if (this.isDef()) {
    return this.renderer_.getCoordinateFromPixel(pixel);
  } else {
    return undefined;
  }
};


/**
 * @return {ol.Extent|undefined} Extent.
 */
ol.Map.prototype.getExtent = function() {
  if (this.isDef()) {
    var center = this.getCenter();
    var resolution = this.getResolution();
    var size = this.getSize();
    var minX = center.x - resolution * size.width / 2;
    var minY = center.y - resolution * size.height / 2;
    var maxX = center.x + resolution * size.width / 2;
    var maxY = center.y + resolution * size.height / 2;
    return new ol.Extent(minX, minY, maxX, maxY);
  } else {
    return undefined;
  }
};


/**
 * @return {ol.Collection} Interactions.
 */
ol.Map.prototype.getInteractions = function() {
  return /** @type {ol.Collection} */ this.get(ol.MapProperty.INTERACTIONS);
};
goog.exportProperty(
    ol.Map.prototype,
    'getInteractions',
    ol.Map.prototype.getInteractions);


/**
 * @return {ol.Collection} Layers.
 */
ol.Map.prototype.getLayers = function() {
  return /** @type {ol.Collection} */ (this.get(ol.MapProperty.LAYERS));
};


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {ol.Pixel|undefined} Pixel.
 */
ol.Map.prototype.getPixelFromCoordinate = function(coordinate) {
  if (this.isDef()) {
    return this.renderer_.getPixelFromCoordinate(coordinate);
  } else {
    return undefined;
  }
};


/**
 * @return {ol.Projection|undefined} Projection.
 */
ol.Map.prototype.getProjection = function() {
  return /** @type {ol.Projection} */ this.get(ol.MapProperty.PROJECTION);
};
goog.exportProperty(
    ol.Map.prototype,
    'getProjection',
    ol.Map.prototype.getProjection);


/**
 * @return {number|undefined} Resolution.
 */
ol.Map.prototype.getResolution = function() {
  return /** @type {number} */ this.get(ol.MapProperty.RESOLUTION);
};
goog.exportProperty(
    ol.Map.prototype,
    'getResolution',
    ol.Map.prototype.getResolution);


/**
 * @param {ol.Extent} extent Extent.
 * @return {number|undefined} Resolution.
 */
ol.Map.prototype.getResolutionForExtent = function(extent) {
  var size = this.getSize();
  if (goog.isDef(size)) {
    var xResolution = (extent.maxX - extent.minX) / size.width;
    var yResolution = (extent.maxY - extent.minY) / size.height;
    return Math.max(xResolution, yResolution);
  } else {
    return undefined;
  }
};


/**
 * @return {ol.Extent} Rotated extent.
 */
ol.Map.prototype.getRotatedExtent = function() {
  goog.asserts.assert(this.isDef());
  var center = /** @type {!ol.Coordinate} */ this.getCenter();
  var resolution = this.getResolution();
  var rotation = this.getRotation() || 0;
  var size = this.getSize();
  var xScale = resolution * size.width / 2;
  var yScale = resolution * size.height / 2;
  var corners = [
    new ol.Coordinate(-xScale, -yScale),
    new ol.Coordinate(-xScale, yScale),
    new ol.Coordinate(xScale, -yScale),
    new ol.Coordinate(xScale, yScale)
  ];
  goog.array.forEach(corners, function(corner) {
    corner.rotate(rotation);
    corner.add(center);
  });
  return ol.Extent.boundingExtent.apply(null, corners);
};


/**
 * @return {number|undefined} Rotation.
 */
ol.Map.prototype.getRotation = function() {
  return /** @type {number|undefined} */ this.get(ol.MapProperty.ROTATION);
};
goog.exportProperty(
    ol.Map.prototype,
    'getRotation',
    ol.Map.prototype.getRotation);


/**
 * @return {ol.Size|undefined} Size.
 */
ol.Map.prototype.getSize = function() {
  return /** @type {ol.Size|undefined} */ this.get(ol.MapProperty.SIZE);
};
goog.exportProperty(
    ol.Map.prototype,
    'getSize',
    ol.Map.prototype.getSize);


/**
 * @return {Element} Target.
 */
ol.Map.prototype.getTarget = function() {
  return this.target_;
};


/**
 * @return {ol.Coordinate|undefined} Center in user projection.
 */
ol.Map.prototype.getUserCenter = function() {
  var center = this.getCenter();
  if (goog.isDef(center)) {
    return this.mapToUserTransform_(center);
  } else {
    return undefined;
  }
};


/**
 * @return {ol.Extent|undefined} Extent in user projection.
 */
ol.Map.prototype.getUserExtent = function() {
  var extent = this.getExtent();
  if (goog.isDef(extent)) {
    return extent.transform(this.mapToUserTransform_);
  } else {
    return undefined;
  }
};


/**
 * @export
 * @return {ol.Projection|undefined} Projection.
 */
ol.Map.prototype.getUserProjection = function() {
  return /** @type {ol.Projection} */ this.get(ol.MapProperty.USER_PROJECTION);
};
goog.exportProperty(
    ol.Map.prototype,
    'getUserProjection',
    ol.Map.prototype.getUserProjection);


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @param {string=} opt_type Type.
 */
ol.Map.prototype.handleBrowserEvent = function(browserEvent, opt_type) {
  var type = opt_type || browserEvent.type;
  var mapBrowserEvent = new ol.MapBrowserEvent(type, this, browserEvent);
  var interactions = this.getInteractions();
  var interactionsArray = /** @type {Array.<ol.Interaction>} */
      interactions.getArray();
  goog.array.every(interactionsArray, function(interaction) {
    interaction.handleMapBrowserEvent(mapBrowserEvent);
    return !mapBrowserEvent.defaultPrevented;
  });
};


/**
 * @param {goog.fx.DragEvent} dragEvent Drag event.
 */
ol.Map.prototype.handleDraggerEvent = function(dragEvent) {
  var browserEvent = dragEvent.browserEvent;
  this.handleBrowserEvent(browserEvent, dragEvent.type);
};


/**
 * @protected
 */
ol.Map.prototype.handleProjectionChanged = function() {
  this.recalculateTransforms_();
};


/**
 * @protected
 */
ol.Map.prototype.handleUserProjectionChanged = function() {
  this.recalculateTransforms_();
};


/**
 * @protected
 */
ol.Map.prototype.handleViewportResize = function() {
  var size = new ol.Size(this.target_.clientWidth, this.target_.clientHeight);
  this.setSize(size);
};


/**
 * @return {boolean} Is defined.
 */
ol.Map.prototype.isDef = function() {
  return goog.isDefAndNotNull(this.getCenter()) &&
      goog.isDef(this.getResolution()) &&
      goog.isDefAndNotNull(this.getSize());
};


/**
 * @private
 */
ol.Map.prototype.recalculateTransforms_ = function() {
  var projection = this.getProjection();
  var userProjection = this.getUserProjection();
  if (goog.isDefAndNotNull(projection) &&
      goog.isDefAndNotNull(userProjection)) {
    this.mapToUserTransform_ = ol.Projection.getTransform(
        projection, userProjection);
    this.userToMapTransform_ = ol.Projection.getTransform(
        userProjection, projection);
  } else {
    this.mapToUserTransform_ = ol.Projection.cloneTransform;
    this.userToMapTransform_ = ol.Projection.identityTransform;
  }
};


/**
 */
ol.Map.prototype.render = function() {
  if (!this.animating_) {
    if (this.freezeRenderingCount_ === 0) {
      if (this.renderer_.render()) {
        this.animate_();
      }
    } else {
      this.dirty_ = true;
    }
  }
};


/**
 * @param {ol.Color} backgroundColor Background color.
 */
ol.Map.prototype.setBackgroundColor = function(backgroundColor) {
  this.set(ol.MapProperty.BACKGROUND_COLOR, backgroundColor);
};
goog.exportProperty(
    ol.Map.prototype,
    'setBackgroundColor',
    ol.Map.prototype.setBackgroundColor);


/**
 * @param {ol.Coordinate|undefined} center Center.
 */
ol.Map.prototype.setCenter = function(center) {
  this.set(ol.MapProperty.CENTER, center);
};
goog.exportProperty(
    ol.Map.prototype,
    'setCenter',
    ol.Map.prototype.setCenter);


/**
 * @param {ol.Collection} interactions Interactions.
 */
ol.Map.prototype.setInteractions = function(interactions) {
  this.set(ol.MapProperty.INTERACTIONS, interactions);
};
goog.exportProperty(
    ol.Map.prototype,
    'setInteractions',
    ol.Map.prototype.setInteractions);


/**
 * @export
 * @param {ol.Collection} layers Layers.
 */
ol.Map.prototype.setLayers = function(layers) {
  this.set(ol.MapProperty.LAYERS, layers);
};
goog.exportProperty(
    ol.Map.prototype,
    'setLayers',
    ol.Map.prototype.setLayers);


/**
 * @export
 * @param {ol.Projection} projection Projection.
 */
ol.Map.prototype.setProjection = function(projection) {
  this.set(ol.MapProperty.PROJECTION, projection);
};
goog.exportProperty(
    ol.Map.prototype,
    'setProjection',
    ol.Map.prototype.setProjection);


/**
 * @export
 * @param {number|undefined} resolution Resolution.
 */
ol.Map.prototype.setResolution = function(resolution) {
  this.set(ol.MapProperty.RESOLUTION, resolution);
};
goog.exportProperty(
    ol.Map.prototype,
    'setResolution',
    ol.Map.prototype.setResolution);


/**
 * @export
 * @param {number|undefined} rotation Rotation.
 */
ol.Map.prototype.setRotation = function(rotation) {
  this.set(ol.MapProperty.ROTATION, rotation);
};
goog.exportProperty(
    ol.Map.prototype,
    'setRotation',
    ol.Map.prototype.setRotation);


/**
 * @param {ol.Size} size Size.
 */
ol.Map.prototype.setSize = function(size) {
  var currentSize = this.getSize();
  if (!goog.isDef(currentSize) || !currentSize.equals(size)) {
    this.set(ol.MapProperty.SIZE, size);
  }
};
goog.exportProperty(
    ol.Map.prototype,
    'setSize',
    ol.Map.prototype.setSize);


/**
 * @export
 * @param {ol.Coordinate} userCenter Center in user projection.
 */
ol.Map.prototype.setUserCenter = function(userCenter) {
  this.setCenter(this.userToMapTransform_(userCenter));
};
goog.exportProperty(
    ol.Map.prototype,
    'setUserCenter',
    ol.Map.prototype.setUserCenter);


/**
 * @export
 * @param {ol.Projection} userProjection User projection.
 */
ol.Map.prototype.setUserProjection = function(userProjection) {
  this.set(ol.MapProperty.USER_PROJECTION, userProjection);
};
goog.exportProperty(
    ol.Map.prototype,
    'setUserProjection',
    ol.Map.prototype.setUserProjection);


/**
 */
ol.Map.prototype.unfreezeRendering = function() {
  goog.asserts.assert(this.freezeRenderingCount_ > 0);
  if (--this.freezeRenderingCount_ === 0) {
    if (!this.animating_ && this.dirty_) {
      if (this.renderer_.render()) {
        this.animate_();
      }
    }
  }
};


/**
 * @param {function(this: T)} f Function.
 * @param {T=} opt_obj Object.
 * @template T
 */
ol.Map.prototype.withFrozenRendering = function(f, opt_obj) {
  this.freezeRendering();
  try {
    f.call(opt_obj);
  } finally {
    this.unfreezeRendering();
  }
};



/**
 * @constructor
 * @implements {goog.fx.anim.Animated}
 * @param {!ol.MapRenderer} renderer Map renderer.
 */
ol.MapAnimation = function(renderer) {

  /**
   * @private
   * @type {ol.MapRenderer}
   */
  this.renderer_ = renderer;

};


/**
 * @inheritDoc
 */
ol.MapAnimation.prototype.onAnimationFrame = function() {
  if (!this.renderer_.render()) {
    goog.fx.anim.unregisterAnimation(this);
  }
};
