// FIXME better map browser event types
// FIXME recheck layer/map projection compatability when projection changes
// FIXME layer renderers should skip when they can't reproject
// FIXME add tilt and height?

goog.provide('ol3.Map');
goog.provide('ol3.MapEventType');
goog.provide('ol3.MapProperty');

goog.require('goog.array');
goog.require('goog.debug.Logger');
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
goog.require('ol3.Collection');
goog.require('ol3.Color');
goog.require('ol3.Coordinate');
goog.require('ol3.Extent');
goog.require('ol3.Interaction');
goog.require('ol3.MapBrowserEvent');
goog.require('ol3.Object');
goog.require('ol3.Pixel');
goog.require('ol3.Projection');
goog.require('ol3.Size');
goog.require('ol3.TransformFunction');
goog.require('ol3.renderer.Layer');


/**
 * @enum {string}
 */
ol3.MapEventType = {
  POST_RENDER: 'postrender'
};


/**
 * @enum {string}
 */
ol3.MapProperty = {
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
ol3.MapPaneZIndex = {
  VIEWPORT: 1000
};



/**
 * @constructor
 * @extends {ol3.Object}
 * @implements {goog.fx.anim.Animated}
 * @param {Element} container Container.
 * @param {function(new: ol3.renderer.Map, Element, ol3.Map)} rendererConstructor
 *     Renderer constructor.
 * @param {Object=} opt_values Values.
 * @param {goog.dom.ViewportSizeMonitor=} opt_viewportSizeMonitor
 *     Viewport size monitor.
 */
ol3.Map = function(
    container, rendererConstructor, opt_values, opt_viewportSizeMonitor) {

  goog.base(this);

  if (goog.DEBUG) {
    /**
     * @protected
     * @type {goog.debug.Logger}
     */
    this.logger = goog.debug.Logger.getLogger('ol3.map.' + goog.getUid(this));
  }

  /**
   * @type {ol3.TransformFunction}
   * @private
   */
  this.userToMapTransform_ = ol3.Projection.identityTransform;

  /**
   * @type {ol3.TransformFunction}
   * @private
   */
  this.mapToUserTransform_ = ol3.Projection.cloneTransform;

  /**
   * @private
   * @type {boolean}
   */
  this.animatedRenderer_ = false;

  /**
   * @private
   * @type {number}
   */
  this.animatingCount_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.freezeRenderingCount_ = 0;

  /**
   * @private
   * @type {boolean}
   */
  this.dirty_ = false;

  /**
   * @private
   * @type {Element}
   */
  this.container_ = container;

  /**
   * @private
   * @type {Element}
   */
  this.viewport_ = goog.dom.createElement(goog.dom.TagName.DIV);
  this.viewport_.className = 'ol-viewport';
  this.viewport_.style.position = 'relative';
  this.viewport_.style.overflow = 'hidden';
  this.viewport_.style.width = '100%';
  this.viewport_.style.height = '100%';
  this.viewport_.style.zIndex = ol3.MapPaneZIndex.VIEWPORT;
  goog.dom.appendChild(container, this.viewport_);

  goog.events.listen(this.viewport_, [
    goog.events.EventType.DBLCLICK
  ], this.handleBrowserEvent, false, this);

  // FIXME we probably shouldn't listen on document...
  var keyHandler = new goog.events.KeyHandler(document);
  goog.events.listen(keyHandler, goog.events.KeyHandler.EventType.KEY,
      this.handleBrowserEvent, false, this);
  this.registerDisposable(keyHandler);

  var mouseWheelHandler = new goog.events.MouseWheelHandler(this.viewport_);
  goog.events.listen(mouseWheelHandler,
      goog.events.MouseWheelHandler.EventType.MOUSEWHEEL,
      this.handleBrowserEvent, false, this);
  this.registerDisposable(mouseWheelHandler);

  var dragger = new goog.fx.Dragger(this.viewport_);
  dragger.defaultAction = function() {};
  goog.events.listen(dragger, [
    goog.fx.Dragger.EventType.START,
    goog.fx.Dragger.EventType.DRAG,
    goog.fx.Dragger.EventType.END
  ], this.handleDraggerEvent, false, this);
  this.registerDisposable(dragger);

  /**
   * @type {ol3.renderer.Map}
   * @private
   */
  this.renderer_ = new rendererConstructor(this.viewport_, this);
  this.registerDisposable(this.renderer_);

  /**
   * @private
   * @type {goog.dom.ViewportSizeMonitor}
   */
  this.viewportSizeMonitor_ =
      opt_viewportSizeMonitor || new goog.dom.ViewportSizeMonitor();

  goog.events.listen(this.viewportSizeMonitor_, goog.events.EventType.RESIZE,
      this.handleBrowserWindowResize, false, this);

  goog.events.listen(
      this, ol3.Object.getChangedEventType(ol3.MapProperty.PROJECTION),
      this.handleProjectionChanged, false, this);

  goog.events.listen(
      this, ol3.Object.getChangedEventType(ol3.MapProperty.USER_PROJECTION),
      this.handleUserProjectionChanged, false, this);

  if (goog.isDef(opt_values)) {
    this.setValues(opt_values);
  }

  this.handleBrowserWindowResize();

};
goog.inherits(ol3.Map, ol3.Object);


/**
 * @return {boolean} Can rotate.
 */
ol3.Map.prototype.canRotate = function() {
  return this.renderer_.canRotate();
};


/**
 * @param {ol3.Extent} extent Extent.
 */
ol3.Map.prototype.fitExtent = function(extent) {
  this.withFrozenRendering(function() {
    this.setCenter(extent.getCenter());
    this.setResolution(this.getResolutionForExtent(extent));
    if (this.canRotate()) {
      this.setRotation(0);
    }
  }, this);
};


/**
 * @param {ol3.Extent} userExtent Extent in user projection.
 */
ol3.Map.prototype.fitUserExtent = function(userExtent) {
  this.fitExtent(userExtent.transform(this.userToMapTransform_));
};


/**
 */
ol3.Map.prototype.freezeRendering = function() {
  ++this.freezeRenderingCount_;
};


/**
 * @return {ol3.Color|undefined} Background color.
 */
ol3.Map.prototype.getBackgroundColor = function() {
  return /** @type {ol3.Color|undefined} */ (
      this.get(ol3.MapProperty.BACKGROUND_COLOR));
};
goog.exportProperty(
    ol3.Map.prototype,
    'getBackgroundColor',
    ol3.Map.prototype.getBackgroundColor);


/**
 * @return {ol3.Coordinate|undefined} Center.
 */
ol3.Map.prototype.getCenter = function() {
  return /** @type {ol3.Coordinate} */ this.get(ol3.MapProperty.CENTER);
};
goog.exportProperty(
    ol3.Map.prototype,
    'getCenter',
    ol3.Map.prototype.getCenter);


/**
 * @return {Element} Container.
 */
ol3.Map.prototype.getContainer = function() {
  return this.container_;
};


/**
 * @param {ol3.Pixel} pixel Pixel.
 * @return {ol3.Coordinate|undefined} Coordinate.
 */
ol3.Map.prototype.getCoordinateFromPixel = function(pixel) {
  if (this.isDef()) {
    return this.renderer_.getCoordinateFromPixel(pixel);
  } else {
    return undefined;
  }
};


/**
 * @return {ol3.Extent|undefined} Extent.
 */
ol3.Map.prototype.getExtent = function() {
  if (this.isDef()) {
    var center = this.getCenter();
    var resolution = this.getResolution();
    var size = this.getSize();
    var minX = center.x - resolution * size.width / 2;
    var minY = center.y - resolution * size.height / 2;
    var maxX = center.x + resolution * size.width / 2;
    var maxY = center.y + resolution * size.height / 2;
    return new ol3.Extent(minX, minY, maxX, maxY);
  } else {
    return undefined;
  }
};


/**
 * @return {ol3.Collection} Interactions.
 */
ol3.Map.prototype.getInteractions = function() {
  return /** @type {ol3.Collection} */ this.get(ol3.MapProperty.INTERACTIONS);
};
goog.exportProperty(
    ol3.Map.prototype,
    'getInteractions',
    ol3.Map.prototype.getInteractions);


/**
 * @return {ol3.Collection} Layers.
 */
ol3.Map.prototype.getLayers = function() {
  return /** @type {ol3.Collection} */ (this.get(ol3.MapProperty.LAYERS));
};


/**
 * @param {ol3.Coordinate} coordinate Coordinate.
 * @return {ol3.Pixel|undefined} Pixel.
 */
ol3.Map.prototype.getPixelFromCoordinate = function(coordinate) {
  if (this.isDef()) {
    return this.renderer_.getPixelFromCoordinate(coordinate);
  } else {
    return undefined;
  }
};


/**
 * @return {ol3.Projection|undefined} Projection.
 */
ol3.Map.prototype.getProjection = function() {
  return /** @type {ol3.Projection} */ this.get(ol3.MapProperty.PROJECTION);
};
goog.exportProperty(
    ol3.Map.prototype,
    'getProjection',
    ol3.Map.prototype.getProjection);


/**
 * @return {number|undefined} Resolution.
 */
ol3.Map.prototype.getResolution = function() {
  return /** @type {number} */ this.get(ol3.MapProperty.RESOLUTION);
};
goog.exportProperty(
    ol3.Map.prototype,
    'getResolution',
    ol3.Map.prototype.getResolution);


/**
 * @param {ol3.Extent} extent Extent.
 * @return {number|undefined} Resolution.
 */
ol3.Map.prototype.getResolutionForExtent = function(extent) {
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
 * @return {ol3.Extent} Rotated extent.
 */
ol3.Map.prototype.getRotatedExtent = function() {
  goog.asserts.assert(this.isDef());
  var center = /** @type {!ol3.Coordinate} */ this.getCenter();
  var resolution = this.getResolution();
  var rotation = this.getRotation() || 0;
  var size = this.getSize();
  var xScale = resolution * size.width / 2;
  var yScale = resolution * size.height / 2;
  var corners = [
    new ol3.Coordinate(-xScale, -yScale),
    new ol3.Coordinate(-xScale, yScale),
    new ol3.Coordinate(xScale, -yScale),
    new ol3.Coordinate(xScale, yScale)
  ];
  goog.array.forEach(corners, function(corner) {
    corner.rotate(rotation);
    corner.add(center);
  });
  return ol3.Extent.boundingExtent.apply(null, corners);
};


/**
 * @return {number|undefined} Rotation.
 */
ol3.Map.prototype.getRotation = function() {
  return /** @type {number|undefined} */ this.get(ol3.MapProperty.ROTATION);
};
goog.exportProperty(
    ol3.Map.prototype,
    'getRotation',
    ol3.Map.prototype.getRotation);


/**
 * @return {ol3.Size|undefined} Size.
 */
ol3.Map.prototype.getSize = function() {
  return /** @type {ol3.Size|undefined} */ this.get(ol3.MapProperty.SIZE);
};
goog.exportProperty(
    ol3.Map.prototype,
    'getSize',
    ol3.Map.prototype.getSize);


/**
 * @return {ol3.Coordinate|undefined} Center in user projection.
 */
ol3.Map.prototype.getUserCenter = function() {
  var center = this.getCenter();
  if (goog.isDef(center)) {
    return this.mapToUserTransform_(center);
  } else {
    return undefined;
  }
};


/**
 * @return {ol3.Extent|undefined} Extent in user projection.
 */
ol3.Map.prototype.getUserExtent = function() {
  var extent = this.getExtent();
  if (goog.isDef(extent)) {
    return extent.transform(this.mapToUserTransform_);
  } else {
    return undefined;
  }
};


/**
 * @export
 * @return {ol3.Projection|undefined} Projection.
 */
ol3.Map.prototype.getUserProjection = function() {
  return /** @type {ol3.Projection} */ this.get(
      ol3.MapProperty.USER_PROJECTION);
};
goog.exportProperty(
    ol3.Map.prototype,
    'getUserProjection',
    ol3.Map.prototype.getUserProjection);


/**
 * @return {Element} Viewport.
 */
ol3.Map.prototype.getViewport = function() {
  return this.viewport_;
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @param {string=} opt_type Type.
 */
ol3.Map.prototype.handleBrowserEvent = function(browserEvent, opt_type) {
  var type = opt_type || browserEvent.type;
  var mapBrowserEvent = new ol3.MapBrowserEvent(type, this, browserEvent);
  var interactions = this.getInteractions();
  var interactionsArray = /** @type {Array.<ol3.Interaction>} */
      interactions.getArray();
  goog.array.every(interactionsArray, function(interaction) {
    interaction.handleMapBrowserEvent(mapBrowserEvent);
    return !mapBrowserEvent.defaultPrevented;
  });
};


/**
 * @param {goog.fx.DragEvent} dragEvent Drag event.
 */
ol3.Map.prototype.handleDraggerEvent = function(dragEvent) {
  var browserEvent = dragEvent.browserEvent;
  this.handleBrowserEvent(browserEvent, dragEvent.type);
};


/**
 * @protected
 */
ol3.Map.prototype.handleProjectionChanged = function() {
  this.recalculateTransforms_();
};


/**
 * @protected
 */
ol3.Map.prototype.handleUserProjectionChanged = function() {
  this.recalculateTransforms_();
};


/**
 * @protected
 */
ol3.Map.prototype.handleBrowserWindowResize = function() {
  var size = new ol3.Size(this.container_.clientWidth,
      this.container_.clientHeight);
  this.setSize(size);
};


/**
 * @return {boolean} Is animating.
 */
ol3.Map.prototype.isAnimating = function() {
  return this.animatingCount_ > 0;
};


/**
 * @return {boolean} Is defined.
 */
ol3.Map.prototype.isDef = function() {
  return goog.isDefAndNotNull(this.getCenter()) &&
      goog.isDef(this.getResolution()) &&
      goog.isDefAndNotNull(this.getSize());
};


/**
 * @inheritDoc
 */
ol3.Map.prototype.onAnimationFrame = function() {
  if (goog.DEBUG) {
    this.logger.info('onAnimationFrame');
  }
  this.renderFrame_();
};


/**
 * @private
 */
ol3.Map.prototype.recalculateTransforms_ = function() {
  var projection = this.getProjection();
  var userProjection = this.getUserProjection();
  if (goog.isDefAndNotNull(projection) &&
      goog.isDefAndNotNull(userProjection)) {
    this.mapToUserTransform_ = ol3.Projection.getTransform(
        projection, userProjection);
    this.userToMapTransform_ = ol3.Projection.getTransform(
        userProjection, projection);
  } else {
    this.mapToUserTransform_ = ol3.Projection.cloneTransform;
    this.userToMapTransform_ = ol3.Projection.identityTransform;
  }
};


/**
 */
ol3.Map.prototype.render = function() {
  if (this.animatingCount_ < 1) {
    if (this.freezeRenderingCount_ === 0) {
      this.renderFrame_();
    } else {
      this.dirty_ = true;
    }
  }
};


/**
 * @private
 */
ol3.Map.prototype.renderFrame_ = function() {
  if (goog.DEBUG) {
    this.logger.info('renderFrame_');
  }
  var animatedRenderer = this.renderer_.render();
  this.dirty_ = false;
  if (animatedRenderer != this.animatedRenderer_) {
    if (animatedRenderer) {
      this.startAnimating();
    } else {
      this.stopAnimating();
    }
    this.animatedRenderer_ = animatedRenderer;
  }
  if (goog.DEBUG) {
    this.logger.info('postrender');
  }
  this.dispatchEvent(ol3.MapEventType.POST_RENDER);
};


/**
 * @param {ol3.Color} backgroundColor Background color.
 */
ol3.Map.prototype.setBackgroundColor = function(backgroundColor) {
  this.set(ol3.MapProperty.BACKGROUND_COLOR, backgroundColor);
};
goog.exportProperty(
    ol3.Map.prototype,
    'setBackgroundColor',
    ol3.Map.prototype.setBackgroundColor);


/**
 * @param {ol3.Coordinate|undefined} center Center.
 */
ol3.Map.prototype.setCenter = function(center) {
  this.set(ol3.MapProperty.CENTER, center);
};
goog.exportProperty(
    ol3.Map.prototype,
    'setCenter',
    ol3.Map.prototype.setCenter);


/**
 * @param {ol3.Collection} interactions Interactions.
 */
ol3.Map.prototype.setInteractions = function(interactions) {
  this.set(ol3.MapProperty.INTERACTIONS, interactions);
};
goog.exportProperty(
    ol3.Map.prototype,
    'setInteractions',
    ol3.Map.prototype.setInteractions);


/**
 * @export
 * @param {ol3.Collection} layers Layers.
 */
ol3.Map.prototype.setLayers = function(layers) {
  this.set(ol3.MapProperty.LAYERS, layers);
};
goog.exportProperty(
    ol3.Map.prototype,
    'setLayers',
    ol3.Map.prototype.setLayers);


/**
 * @export
 * @param {ol3.Projection} projection Projection.
 */
ol3.Map.prototype.setProjection = function(projection) {
  this.set(ol3.MapProperty.PROJECTION, projection);
};
goog.exportProperty(
    ol3.Map.prototype,
    'setProjection',
    ol3.Map.prototype.setProjection);


/**
 * @export
 * @param {number|undefined} resolution Resolution.
 */
ol3.Map.prototype.setResolution = function(resolution) {
  this.set(ol3.MapProperty.RESOLUTION, resolution);
};
goog.exportProperty(
    ol3.Map.prototype,
    'setResolution',
    ol3.Map.prototype.setResolution);


/**
 * @export
 * @param {number|undefined} rotation Rotation.
 */
ol3.Map.prototype.setRotation = function(rotation) {
  this.set(ol3.MapProperty.ROTATION, rotation);
};
goog.exportProperty(
    ol3.Map.prototype,
    'setRotation',
    ol3.Map.prototype.setRotation);


/**
 * @param {ol3.Size} size Size.
 */
ol3.Map.prototype.setSize = function(size) {
  var currentSize = this.getSize();
  if (!goog.isDef(currentSize) || !currentSize.equals(size)) {
    this.set(ol3.MapProperty.SIZE, size);
  }
};
goog.exportProperty(
    ol3.Map.prototype,
    'setSize',
    ol3.Map.prototype.setSize);


/**
 * @export
 * @param {ol3.Coordinate} userCenter Center in user projection.
 */
ol3.Map.prototype.setUserCenter = function(userCenter) {
  this.setCenter(this.userToMapTransform_(userCenter));
};
goog.exportProperty(
    ol3.Map.prototype,
    'setUserCenter',
    ol3.Map.prototype.setUserCenter);


/**
 * @export
 * @param {ol3.Projection} userProjection User projection.
 */
ol3.Map.prototype.setUserProjection = function(userProjection) {
  this.set(ol3.MapProperty.USER_PROJECTION, userProjection);
};
goog.exportProperty(
    ol3.Map.prototype,
    'setUserProjection',
    ol3.Map.prototype.setUserProjection);


/**
 */
ol3.Map.prototype.startAnimating = function() {
  if (++this.animatingCount_ == 1) {
    if (goog.DEBUG) {
      this.logger.info('startAnimating');
    }
    goog.fx.anim.registerAnimation(this);
  }
};


/**
 */
ol3.Map.prototype.stopAnimating = function() {
  goog.asserts.assert(this.animatingCount_ > 0);
  if (--this.animatingCount_ === 0) {
    if (goog.DEBUG) {
      this.logger.info('stopAnimating');
    }
    goog.fx.anim.unregisterAnimation(this);
  }
};


/**
 */
ol3.Map.prototype.unfreezeRendering = function() {
  goog.asserts.assert(this.freezeRenderingCount_ > 0);
  if (--this.freezeRenderingCount_ === 0 &&
      this.animatingCount_ < 1 &&
      this.dirty_) {
    this.renderFrame_();
  }
};


/**
 * @param {function(this: T)} f Function.
 * @param {T=} opt_obj Object.
 * @template T
 */
ol3.Map.prototype.withFrozenRendering = function(f, opt_obj) {
  this.freezeRendering();
  try {
    f.call(opt_obj);
  } finally {
    this.unfreezeRendering();
  }
};
