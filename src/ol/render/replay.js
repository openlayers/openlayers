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
ol.render.replay.TEXT_ALIGN = {};
ol.render.replay.TEXT_ALIGN['left'] = 0;
ol.render.replay.TEXT_ALIGN['end'] = 0;
ol.render.replay.TEXT_ALIGN['center'] = 0.5;
ol.render.replay.TEXT_ALIGN['right'] = 1;
ol.render.replay.TEXT_ALIGN['start'] = 1;
ol.render.replay.TEXT_ALIGN['top'] = 0;
ol.render.replay.TEXT_ALIGN['middle'] = 0.5;
ol.render.replay.TEXT_ALIGN['hanging'] = 0.2;
ol.render.replay.TEXT_ALIGN['alphabetic'] = 0.8;
ol.render.replay.TEXT_ALIGN['ideographic'] = 0.8;
ol.render.replay.TEXT_ALIGN['bottom'] = 1;
