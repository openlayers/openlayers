/**
 * @module ol/render/replay
 */
import ReplayType from '../render/ReplayType.js';


/**
 * @const
 * @type {Array<ReplayType>}
 */
export const ORDER = [
  ReplayType.POLYGON,
  ReplayType.CIRCLE,
  ReplayType.LINE_STRING,
  ReplayType.IMAGE,
  ReplayType.TEXT,
  ReplayType.DEFAULT
];

/**
 * @const
 * @enum {number}
 */
export const TEXT_ALIGN = {};
TEXT_ALIGN['left'] = 0;
TEXT_ALIGN['end'] = 0;
TEXT_ALIGN['center'] = 0.5;
TEXT_ALIGN['right'] = 1;
TEXT_ALIGN['start'] = 1;
TEXT_ALIGN['top'] = 0;
TEXT_ALIGN['middle'] = 0.5;
TEXT_ALIGN['hanging'] = 0.2;
TEXT_ALIGN['alphabetic'] = 0.8;
TEXT_ALIGN['ideographic'] = 0.8;
TEXT_ALIGN['bottom'] = 1;
