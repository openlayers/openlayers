goog.provide('ol.render.replay');

goog.require('ol.render.ReplayType');


/**
 * @const
 * @type {Array.<ol.render.ReplayType>}
 */
ol.render.replay.ORDER = [
  ol.render.ReplayType.POLYGON,
  ol.render.ReplayType.CIRCLE,
  ol.render.ReplayType.LINE_STRING,
  ol.render.ReplayType.IMAGE,
  ol.render.ReplayType.TEXT,
  ol.render.ReplayType.DEFAULT
];

/**
 * @const
 * @enum {number}
 */
ol.render.replay.TEXT_ALIGN = {
  left: 0,
  end: 0,
  center: 0.5,
  right: 1,
  start: 1,
  top: 0,
  middle: 0.5,
  hanging: 0.2,
  alphabetic: 0.8,
  ideographic: 0.8,
  bottom: 1
};
