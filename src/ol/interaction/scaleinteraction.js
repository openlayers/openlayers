goog.provide('ol.interaction.Scale');

goog.require('goog.events');
goog.require('ol.Collection');
goog.require('ol.CollectionEventType');
goog.require('ol.Feature');
goog.require('ol.FeatureOverlay');
goog.require('ol.events.condition');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.interaction.Pointer');



/**
 * @classdesc
 * Interaction for translating (moving) features.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @param {olx.interaction.ScaleOptions} options Options.
 * @api
 */
ol.interaction.Scale = function(options)
    {
  goog.base(this, {
    handleDownEvent: ol.interaction.Scale.handleDownEvent_,
    handleDragEvent: ol.interaction.Scale.handleDragEvent_,
    handleMoveEvent: ol.interaction.Scale.handleMoveEvent_,
    handleUpEvent: ol.interaction.Scale.handleUpEvent_
  });


  /**
   * @type {string|undefined}
   * @private
   */
  this.previousCursor_ = undefined;


  /**
   * The mouse position at which the current drag started.
   * @type {ol.Coordinate}
   * @private
   */
  this.dragStartCoordinate_ = null;


  /**
   * The width, height, and center coordinates of the handles when the
   * current drag started.
   * @type {Object}
   * @private
   */
  this.dragStartHandleSize_ = null;


  /**
   * Copies of the flat coordinates arrays from each geometry when the drag
   * started.
   * @type {Array.<Array.<number>>}
   * @private
   */
  this.dragStartGeomCoordinates_ = null;


  /**
   * The center point of the current selection.
   * @type {ol.Coordinate}
   * @private
   */
  this.selectionCenterPoint_ = null;

  /**
   * If true, we maintain aspect ratio while scaling.
   * @type {ol.events.ConditionType}
   * @private
   */
  this.condition_ = goog.isDef(options.condition) ?
      options.condition : ol.events.condition.shiftKeyOnly;


  /**
   * Draw overlay where are sketch features are drawn.
   * @type {ol.FeatureOverlay}
   * @private
   */
  this.overlay_ = new ol.FeatureOverlay({
    style: goog.isDef(options.style) ? options.style :
        ol.interaction.Scale.getDefaultStyleFunction()
  });

  /**
   * Current handle being dragged.
   * @type {ol.Feature}
   * @private
   */
  this.currentHandle_ = null;


  /**
   * Drag handle features.
   * @type {Object.<string, ol.Feature>}
   * @private
   */
  this.handles_ = {
    left: new ol.Feature(new ol.geom.LineString([[0, 0], [0, 0]])),
    top: new ol.Feature(new ol.geom.LineString([[0, 0], [0, 0]])),
    right: new ol.Feature(new ol.geom.LineString([[0, 0], [0, 0]])),
    bottom: new ol.Feature(new ol.geom.LineString([[0, 0], [0, 0]])),
    bottomLeft: new ol.Feature(new ol.geom.Point([0, 0])),
    topLeft: new ol.Feature(new ol.geom.Point([0, 0])),
    topRight: new ol.Feature(new ol.geom.Point([0, 0])),
    bottomRight: new ol.Feature(new ol.geom.Point([0, 0]))
  };


  /**
   * @type {ol.Collection.<ol.Feature>}
   * @private
   */
  this.sketchFeatures_ = new ol.Collection([
    this.handles_.left,
    this.handles_.top,
    this.handles_.right,
    this.handles_.bottom,
    this.handles_.bottomLeft,
    this.handles_.topLeft,
    this.handles_.topRight,
    this.handles_.bottomRight
  ]);


  /**
   * @type {ol.Collection.<ol.Feature>}
   * @private
   */
  this.features_ = options.features;

  goog.events.listen(this.features_, ol.CollectionEventType.ADD,
      this.handleFeatureAdd_, false, this);
  goog.events.listen(this.features_, ol.CollectionEventType.REMOVE,
      this.handleFeatureRemove_, false, this);

  this.updateSketchFeatures_();
};
goog.inherits(ol.interaction.Scale, ol.interaction.Pointer);


/**
 * @inheritDoc
 */
ol.interaction.Scale.prototype.setMap = function(map) {
  this.overlay_.setMap(map);
  goog.base(this, 'setMap', map);
};


/**
 * @return {ol.style.StyleFunction} Styles.
 */
ol.interaction.Scale.getDefaultStyleFunction = function() {
  var styles = ol.style.createDefaultEditingStyles();
  return function(feature, resolution) {
    return styles[feature.getGeometry().getType()];
  };
};


/**
 * @param {ol.CollectionEvent} evt Event.
 * @private
 */
ol.interaction.Scale.prototype.handleFeatureAdd_ = function(evt) {
  evt.element.on('change', this.updateSketchFeatures_.bind(this));
  this.updateSketchFeatures_();
};


/**
 * @param {ol.CollectionEvent} evt Event.
 * @private
 */
ol.interaction.Scale.prototype.handleFeatureRemove_ = function(evt) {
  evt.element.un('change', this.updateSketchFeatures_.bind(this));
  this.updateSketchFeatures_();
};


/**
 * Redraw the sketch features.
 * @private
 */
ol.interaction.Scale.prototype.updateSketchFeatures_ = function() {
  if (this.features_.getLength() === 0) {
    this.overlay_.setFeatures(new ol.Collection());
  } else {
    var minX = Infinity;
    var maxX = -Infinity;
    var minY = Infinity;
    var maxY = -Infinity;

    this.features_.forEach(function(feature) {
      var extent = feature.getGeometry().getExtent();
      minX = Math.min(extent[0], minX);
      minY = Math.min(extent[1], minY);
      maxX = Math.max(extent[2], maxX);
      maxY = Math.max(extent[3], maxY);
    });

    this.selectionCenterPoint_ = [(minX + maxX) / 2, (minY + maxY) / 2];

    var paddingX = Math.abs(maxX - minX) * 0.1;
    var paddingY = Math.abs(maxY - minY) * 0.1;

    minX -= paddingX;
    maxX += paddingX;
    minY -= paddingY;
    maxY += paddingY;

    this.handles_.left.getGeometry().setCoordinates([[minX, minY],
          [minX, maxY]]);
    this.handles_.top.getGeometry().setCoordinates([[minX, maxY],
          [maxX, maxY]]);
    this.handles_.right.getGeometry().setCoordinates([[maxX, minY],
          [maxX, maxY]]);
    this.handles_.bottom.getGeometry().setCoordinates([[minX, minY],
          [maxX, minY]]);

    this.handles_.bottomLeft.getGeometry().setCoordinates([minX, minY]);
    this.handles_.topLeft.getGeometry().setCoordinates([minX, maxY]);
    this.handles_.topRight.getGeometry().setCoordinates([maxX, maxY]);
    this.handles_.bottomRight.getGeometry().setCoordinates([maxX, minY]);

    this.overlay_.setFeatures(this.sketchFeatures_);
  }
};


/**
 * @param {ol.MapBrowserPointerEvent} event Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.Scale}
 * @private
 */
ol.interaction.Scale.handleDownEvent_ = function(event) {
  if (goog.isNull(this.dragStartCoordinate_)) {
    var handle = this.getHandle_(event.pixel, event.map);
    if (goog.isDef(handle))
    {
      this.dragStartCoordinate_ = event.coordinate;
      this.dragStartHandleSize_ = {
        width: this.handles_.top.getGeometry().getLength(),
        height: this.handles_.left.getGeometry().getLength(),
        center: this.selectionCenterPoint_
      };
      this.dragStartGeomCoordinates_ = this.features_.getArray()
          .map(function(feature) {


            var geom = /** @type {ol.geom.SimpleGeometry} */
                (feature.getGeometry());
            return geom.getFlatCoordinates().slice();
          });
      this.currentHandle_ = handle;
      return true;
    }
  }
  return false;
};


/**
 * @param {ol.MapBrowserPointerEvent} event Event.
 * @return {boolean} Stop drag sequence?
 * @this {ol.interaction.Scale}
 * @private
 */
ol.interaction.Scale.handleUpEvent_ = function(event) {
  if (!goog.isNull(this.dragStartCoordinate_)) {
    this.dragStartCoordinate_ = null;
    this.dragStartHandleSize_ = null;
    this.dragStartGeomCoordinates_ = null;
    this.currentHandle_ = null;
    return true;
  }
  return false;
};


/**
 * @param {ol.MapBrowserPointerEvent} event Event.
 * @this {ol.interaction.Scale}
 * @private
 */
ol.interaction.Scale.handleDragEvent_ = function(event) {
  if (!goog.isNull(this.dragStartCoordinate_)) {
    var newCoordinate = event.coordinate;
    var deltaX = newCoordinate[0] - this.dragStartCoordinate_[0];
    var deltaY = newCoordinate[1] - this.dragStartCoordinate_[1];

    var maintainAspectRatio = this.condition_(event);

    var handles = this.handles_;
    var currentHandle = this.currentHandle_;

    if (currentHandle == handles.topLeft ||
            currentHandle == handles.bottomLeft ||
            currentHandle == handles.left) {
      deltaX *= -1;
    }
    if (currentHandle == handles.bottomLeft ||
            currentHandle == handles.bottomRight ||
            currentHandle == handles.bottom) {
      deltaY *= -1;
    }

    if (currentHandle == handles.top ||
            currentHandle == handles.bottom) {
      deltaX = maintainAspectRatio ? deltaY : 0;
    }
    if (currentHandle == handles.left ||
            currentHandle == handles.right) {
      deltaY = maintainAspectRatio ? deltaX : 0;
    }

    var width = this.dragStartHandleSize_.width;
    var height = this.dragStartHandleSize_.height;

    var scaleX = 1 + 2 * deltaX / width;
    var scaleY = 1 + 2 * deltaY / height;
    if (maintainAspectRatio) {
      scaleX = scaleY = Math.max(scaleX, scaleY);
      if (scaleX < 0) {
        if (currentHandle == handles.top || currentHandle == handles.bottom) {
          scaleX = -scaleX;
        } else if (currentHandle == handles.left ||
            currentHandle == handles.right) {
          scaleY = -scaleY;
        }
      }
    }
    var centerPoint = this.dragStartHandleSize_.center;
    var dragStartGeomCoords = this.dragStartGeomCoordinates_;

    this.features_.forEach(function(feature, i) {
      var geom = /** @type {ol.geom.SimpleGeometry} */
          (feature.getGeometry());

      var initialCoords = dragStartGeomCoords[i];
      var coords = geom.getFlatCoordinates();
      for (var j = 0; j < coords.length; j++) {
        coords[j] = initialCoords[j];
      }

      geom.scale(scaleX, scaleY, centerPoint);

      feature.setGeometry(geom);
    });

    this.updateSketchFeatures_();
  }
};


/**
 * @param {ol.MapBrowserEvent} event Event.
 * @this ol.interaction.Scale
 * @private
 */
ol.interaction.Scale.handleMoveEvent_ = function(event) {
  var handles = this.handles_;
  var elem = event.map.getTargetElement();
  var handle = this.getHandle_(event.pixel, event.map);

  if (handle == handles.top || handle == handles.bottom) {
    this.previousCursor_ = elem.style.cursor;
    elem.style.cursor = 'ns-resize';
  } else if (handle == handles.left || handle == handles.right) {
    this.previousCursor_ = elem.style.cursor;
    elem.style.cursor = 'ew-resize';
  } else if (handle == handles.topLeft || handle == handles.bottomRight) {
    this.previousCursor_ = elem.style.cursor;
    elem.style.cursor = 'nwse-resize';
  } else if (handle == handles.topRight || handle == handles.bottomLeft) {
    this.previousCursor_ = elem.style.cursor;
    elem.style.cursor = 'nesw-resize';
  } else {
    elem.style.cursor = this.previousCursor_ || '';
    this.previousCursor_ = undefined;
  }
};


/**
 * Returns the handle that is being dragged, if any.
 * @param {ol.Pixel} pixel The pixel to get the handle at.
 * @param {ol.Map} map The map.
 * @return {ol.Feature} Returns the feature of the handle being dragged,
 * if any.
 * @private
 */
ol.interaction.Scale.prototype.getHandle_ = function(pixel, map) {
  var handle;

  var intersectingFeature = map.forEachFeatureAtPixel(pixel,
      function(feature) {
        return feature;
      });

  this.sketchFeatures_.forEach(function(feature) {
    if (!handle && feature == intersectingFeature) {
      handle = feature;
    }
  });

  return handle;
};
