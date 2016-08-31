goog.provide('ol.render.canvas.Instruction');

/**
 * @enum {number}
 */
ol.render.canvas.Instruction = {
  BEGIN_GEOMETRY: 0,
  BEGIN_PATH: 1,
  CIRCLE: 2,
  CLOSE_PATH: 3,
  DRAW_IMAGE: 4,
  DRAW_TEXT: 5,
  END_GEOMETRY: 6,
  FILL: 7,
  MOVE_TO_LINE_TO: 8,
  SET_FILL_STYLE: 9,
  SET_STROKE_STYLE: 10,
  SET_TEXT_STYLE: 11,
  STROKE: 12
};
