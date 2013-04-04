goog.provide('ol.Map2D');

goog.require('ol.IView2D');
goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.View2DProperty');
goog.require('ol.projection.EPSG3857');


/**
 * @enum {string}
 */
ol.Map2DProperty = {
  BACKGROUND_COLOR: ol.MapProperty.BACKGROUND_COLOR,
  CENTER: ol.View2DProperty.CENTER,
  LAYERS: ol.MapProperty.LAYERS,
  RESOLUTION: ol.View2DProperty.RESOLUTION,
  ROTATION: ol.View2DProperty.ROTATION,
  SIZE: ol.MapProperty.SIZE,
  PROJECTION: ol.View2DProperty.PROJECTION,
  VIEW: ol.MapProperty.VIEW
};



/**
 * @constructor
 * @extends {ol.Map}
 * @implements {ol.IView2D}
 * @param {ol.Map2DOptions} options Options.
 */
ol.Map2D = function(options) {

  /**
   * @private
   * @type {ol.View2D}
   */
  this.view2D_ = new ol.View2D({
    center: options.center,
    resolution: options.resolution,
    rotation: options.rotation,
    projection: options.projection,
    zoom: options.zoom
  });

  goog.base(this, {
    controls: options.controls,
    interactions: options.interactions,
    layers: options.layers,
    renderer: options.renderer,
    renderers: options.renderers,
    target: options.target,
    view: this.view2D_
  });

  this.bindTo(ol.Map2DProperty.CENTER, this.view2D_);
  this.bindTo(ol.Map2DProperty.RESOLUTION, this.view2D_);
  this.bindTo(ol.Map2DProperty.ROTATION, this.view2D_);
  this.bindTo(ol.Map2DProperty.PROJECTION, this.view2D_);

};
goog.inherits(ol.Map2D, ol.Map);


/**
 * @inheritDoc
 */
ol.Map2D.prototype.getCenter = function() {
  return /** @type {ol.Coordinate|undefined} */ (
      this.get(ol.Map2DProperty.CENTER));
};
goog.exportProperty(
    ol.Map2D.prototype,
    'getCenter',
    ol.Map2D.prototype.getCenter);


/**
 * @inheritDoc
 */
ol.Map2D.prototype.getProjection = function() {
  return /** @type {ol.Projection|undefined} */ (
      this.get(ol.Map2DProperty.PROJECTION));
};
goog.exportProperty(
    ol.Map2D.prototype,
    'getProjection',
    ol.Map2D.prototype.getProjection);


/**
 * @inheritDoc
 */
ol.Map2D.prototype.getResolution = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.Map2DProperty.RESOLUTION));
};
goog.exportProperty(
    ol.Map2D.prototype,
    'getResolution',
    ol.Map2D.prototype.getResolution);


/**
 * @inheritDoc
 */
ol.Map2D.prototype.getRotation = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.Map2DProperty.ROTATION)) || 0;
};
goog.exportProperty(
    ol.Map2D.prototype,
    'getRotation',
    ol.Map2D.prototype.getRotation);


/**
 * @inheritDoc
 */
ol.Map2D.prototype.getView2DState = function() {
  return this.view2D_.getView2DState();
};


/**
 * @return {number|undefined} Zoom.
 */
ol.Map2D.prototype.getZoom = function() {
  var resolution = this.getResolution();
  if (goog.isDef(resolution)) {
    return Math.round(Math.log(2 * ol.projection.EPSG3857.HALF_SIZE /
                               (ol.DEFAULT_TILE_SIZE * resolution)) / Math.LN2);
  } else {
    return undefined;
  }
};


/**
 * @param {ol.Coordinate|undefined} center Center.
 */
ol.Map2D.prototype.setCenter = function(center) {
  this.set(ol.Map2DProperty.CENTER, center);
};
goog.exportProperty(
    ol.Map2D.prototype,
    'setCenter',
    ol.Map2D.prototype.setCenter);


/**
 * @param {ol.Projection|undefined} projection Projection.
 */
ol.Map2D.prototype.setProjection = function(projection) {
  this.set(ol.Map2DProperty.PROJECTION, projection);
};
goog.exportProperty(
    ol.Map2D.prototype,
    'setProjection',
    ol.Map2D.prototype.setProjection);


/**
 * @param {number|undefined} resolution Resolution.
 */
ol.Map2D.prototype.setResolution = function(resolution) {
  this.set(ol.Map2DProperty.RESOLUTION, resolution);
};
goog.exportProperty(
    ol.Map2D.prototype,
    'setResolution',
    ol.Map2D.prototype.setResolution);


/**
 * @param {number|undefined} rotation Rotation.
 */
ol.Map2D.prototype.setRotation = function(rotation) {
  this.set(ol.Map2DProperty.ROTATION, rotation);
};
goog.exportProperty(
    ol.Map2D.prototype,
    'setRotation',
    ol.Map2D.prototype.setRotation);


/**
 * @param {number|undefined} zoom Zoom.
 */
ol.Map2D.prototype.setZoom = function(zoom) {
  var resolution;
  if (goog.isDef(zoom)) {
    resolution = 2 * ol.projection.EPSG3857.HALF_SIZE /
        (ol.DEFAULT_TILE_SIZE * Math.pow(2, zoom));
  } else {
    resolution = undefined;
  }
  this.setResolution(resolution);
};
