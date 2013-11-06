goog.provide('ol.geom.Geometry');

goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');


/**
 * @enum {string}
 */
ol.geom.GeometryType = {
  POINT: 'point',
  LINE_STRING: 'line_string',
  POLYGON: 'polygon'
};



/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
ol.geom.Geometry = function() {

  goog.base(this);

  /**
   * @protected
   * @type {number}
   */
  this.revision = 0;

  /**
   * @protected
   * @type {ol.Extent|undefined}
   */
  this.extent = undefined;

  /**
   * @protected
   * @type {number}
   */
  this.extentRevision = -1;

};
goog.inherits(ol.geom.Geometry, goog.events.EventTarget);


/**
 * FIXME empty description for jsdoc
 */
ol.geom.Geometry.prototype.dispatchChangeEvent = function() {
  ++this.revision;
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
 * @param {ol.Extent=} opt_extent Extent.
 * @return {ol.Extent} extent Extent.
 */
ol.geom.Geometry.prototype.getExtent = goog.abstractMethod;


/**
 * @return {number} Revision.
 */
ol.geom.Geometry.prototype.getRevision = function() {
  return this.revision;
};


/**
 * @return {ol.geom.GeometryType} Geometry type.
 */
ol.geom.Geometry.prototype.getType = goog.abstractMethod;
