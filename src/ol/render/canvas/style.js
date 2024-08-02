/**
 * @module ol/render/canvas/style
 */

import Circle from '../../style/Circle.js';
import Fill from '../../style/Fill.js';
import Icon from '../../style/Icon.js';
import RegularShape from '../../style/RegularShape.js';
import Stroke from '../../style/Stroke.js';
import Style from '../../style/Style.js';
import Text from '../../style/Text.js';
import {
  BooleanType,
  ColorType,
  NumberArrayType,
  NumberType,
  StringType,
  computeGeometryType,
  newParsingContext,
} from '../../expr/expression.js';
import {NO_COLOR} from '../../color.js';
import {buildExpression, newEvaluationContext} from '../../expr/cpu.js';
import {isEmpty} from '../../obj.js';
import {toSize} from '../../size.js';

/**
 * @fileoverview This module includes functions to build styles for the canvas renderer.  Building
 * is composed of two steps: parsing and compiling.  The parsing step takes an encoded expression
 * and returns an instance of one of the expression classes.  The compiling step takes the
 * expression instance and returns a function that can be evaluated to return a literal value.  The
 * evaluator function should do as little allocation and work as possible.
 */

/**
 * @typedef {import("../../style/flat.js").FlatStyle} FlatStyle
 */

/**
 * @typedef {import("../../expr/expression.js").EncodedExpression} EncodedExpression
 */

/**
 * @typedef {import("../../expr/expression.js").ParsingContext} ParsingContext
 */

/**
 * @typedef {import("../../expr/expression.js").CallExpression} CallExpression
 */

/**
 * @typedef {import("../../expr/cpu.js").EvaluationContext} EvaluationContext
 */

/**
 * @typedef {import("../../expr/cpu.js").ExpressionEvaluator} ExpressionEvaluator
 */

/**
 * @param {EvaluationContext} context The evaluation context.
 * @return {boolean} Always true.
 */
function always(context) {
  return true;
}

/**
 * This function adapts a rule evaluator to the existing style function interface.
 * After we have deprecated the style function, we can use the compiled rules directly
 * and pass a more complete evaluation context (variables, zoom, time, etc.).
 *
 * @param {Array<import('../../style/flat.js').Rule>} rules The rules.
 * @return {import('../../style/Style.js').StyleFunction} A style function.
 */
export function rulesToStyleFunction(rules) {
  const parsingContext = newParsingContext();
  const evaluator = buildRuleSet(rules, parsingContext);
  const evaluationContext = newEvaluationContext();
  return function (feature, resolution) {
    evaluationContext.properties = feature.getPropertiesInternal();
    evaluationContext.resolution = resolution;
    if (parsingContext.featureId) {
      const id = feature.getId();
      if (id !== undefined) {
        evaluationContext.featureId = id;
      } else {
        evaluationContext.featureId = null;
      }
    }
    if (parsingContext.geometryType) {
      evaluationContext.geometryType = computeGeometryType(
        feature.getGeometry(),
      );
    }
    return evaluator(evaluationContext);
  };
}

/**
 * This function adapts a style evaluator to the existing style function interface.
 * After we have deprecated the style function, we can use the compiled rules directly
 * and pass a more complete evaluation context (variables, zoom, time, etc.).
 *
 * @param {Array<import('../../style/flat.js').FlatStyle>} flatStyles The flat styles.
 * @return {import('../../style/Style.js').StyleFunction} A style function.
 */
export function flatStylesToStyleFunction(flatStyles) {
  const parsingContext = newParsingContext();
  const length = flatStyles.length;

  /**
   * @type {Array<StyleEvaluator>}
   */
  const evaluators = new Array(length);
  for (let i = 0; i < length; ++i) {
    evaluators[i] = buildStyle(flatStyles[i], parsingContext);
  }
  const evaluationContext = newEvaluationContext();

  /**
   * @type {Array<Style>}
   */
  const styles = new Array(length);

  return function (feature, resolution) {
    evaluationContext.properties = feature.getPropertiesInternal();
    evaluationContext.resolution = resolution;
    if (parsingContext.featureId) {
      const id = feature.getId();
      if (id !== undefined) {
        evaluationContext.featureId = id;
      } else {
        evaluationContext.featureId = null;
      }
    }
    let nonNullCount = 0;
    for (let i = 0; i < length; ++i) {
      const style = evaluators[i](evaluationContext);
      if (style) {
        styles[nonNullCount] = style;
        nonNullCount += 1;
      }
    }
    styles.length = nonNullCount;
    return styles;
  };
}

/**
 * @typedef {function(EvaluationContext):Array<Style>} RuleSetEvaluator
 */

/**
 * @typedef {Object} CompiledRule
 * @property {ExpressionEvaluator} filter The compiled filter evaluator.
 * @property {Array<StyleEvaluator>} styles The list of compiled style evaluators.
 */

/**
 * @param {Array<import('../../style/flat.js').Rule>} rules The rules.
 * @param {ParsingContext} context The parsing context.
 * @return {RuleSetEvaluator} The evaluator function.
 */
export function buildRuleSet(rules, context) {
  const length = rules.length;

  /**
   * @type {Array<CompiledRule>}
   */
  const compiledRules = new Array(length);

  for (let i = 0; i < length; ++i) {
    const rule = rules[i];
    const filter =
      'filter' in rule
        ? buildExpression(rule.filter, BooleanType, context)
        : always;

    /**
     * @type {Array<StyleEvaluator>}
     */
    let styles;
    if (Array.isArray(rule.style)) {
      const styleLength = rule.style.length;
      styles = new Array(styleLength);
      for (let j = 0; j < styleLength; ++j) {
        styles[j] = buildStyle(rule.style[j], context);
      }
    } else {
      styles = [buildStyle(rule.style, context)];
    }

    compiledRules[i] = {filter, styles};
  }

  return function (context) {
    /**
     * @type {Array<Style>}
     */
    const styles = [];

    let someMatched = false;
    for (let i = 0; i < length; ++i) {
      const filterEvaluator = compiledRules[i].filter;
      if (!filterEvaluator(context)) {
        continue;
      }
      if (rules[i].else && someMatched) {
        continue;
      }
      someMatched = true;
      for (const styleEvaluator of compiledRules[i].styles) {
        const style = styleEvaluator(context);
        if (!style) {
          continue;
        }
        styles.push(style);
      }
    }

    return styles;
  };
}

/**
 * @typedef {function(EvaluationContext):Style|null} StyleEvaluator
 */

/**
 * @param {FlatStyle} flatStyle A flat style literal.
 * @param {ParsingContext} context The parsing context.
 * @return {StyleEvaluator} A function that evaluates to a style.  The style returned by
 * this function will be reused between invocations.
 */
export function buildStyle(flatStyle, context) {
  const evaluateFill = buildFill(flatStyle, '', context);
  const evaluateStroke = buildStroke(flatStyle, '', context);
  const evaluateText = buildText(flatStyle, context);
  const evaluateImage = buildImage(flatStyle, context);
  const evaluateZIndex = numberEvaluator(flatStyle, 'z-index', context);

  if (
    !evaluateFill &&
    !evaluateStroke &&
    !evaluateText &&
    !evaluateImage &&
    !isEmpty(flatStyle)
  ) {
    // assume this is a user error
    // would be nice to check the properties and suggest "did you mean..."
    throw new Error(
      'No fill, stroke, point, or text symbolizer properties in style: ' +
        JSON.stringify(flatStyle),
    );
  }

  const style = new Style();
  return function (context) {
    let empty = true;
    if (evaluateFill) {
      const fill = evaluateFill(context);
      if (fill) {
        empty = false;
      }
      style.setFill(fill);
    }
    if (evaluateStroke) {
      const stroke = evaluateStroke(context);
      if (stroke) {
        empty = false;
      }
      style.setStroke(stroke);
    }
    if (evaluateText) {
      const text = evaluateText(context);
      if (text) {
        empty = false;
      }
      style.setText(text);
    }
    if (evaluateImage) {
      const image = evaluateImage(context);
      if (image) {
        empty = false;
      }
      style.setImage(image);
    }
    if (evaluateZIndex) {
      style.setZIndex(evaluateZIndex(context));
    }
    if (empty) {
      return null;
    }
    return style;
  };
}

/**
 * @typedef {function(EvaluationContext):Fill|null} FillEvaluator
 */

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @param {string} prefix The property prefix.
 * @param {ParsingContext} context The parsing context.
 * @return {FillEvaluator?} A function that evaluates to a fill.
 */
function buildFill(flatStyle, prefix, context) {
  let evaluateColor;
  if (prefix + 'fill-pattern-src' in flatStyle) {
    evaluateColor = patternEvaluator(flatStyle, prefix + 'fill-', context);
  } else {
    if (flatStyle[prefix + 'fill-color'] === 'none') {
      // avoids hit detection
      return (context) => null;
    }

    evaluateColor = colorLikeEvaluator(
      flatStyle,
      prefix + 'fill-color',
      context,
    );
  }
  if (!evaluateColor) {
    return null;
  }

  const fill = new Fill();
  return function (context) {
    const color = evaluateColor(context);
    if (color === NO_COLOR) {
      return null;
    }
    fill.setColor(color);
    return fill;
  };
}

/**
 * @typedef {function(EvaluationContext):Stroke|null} StrokeEvaluator
 */

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @param {string} prefix The property prefix.
 * @param {ParsingContext} context The parsing context.
 * @return {StrokeEvaluator?} A function the evaluates to a stroke.
 */
function buildStroke(flatStyle, prefix, context) {
  const evaluateWidth = numberEvaluator(
    flatStyle,
    prefix + 'stroke-width',
    context,
  );

  const evaluateColor = colorLikeEvaluator(
    flatStyle,
    prefix + 'stroke-color',
    context,
  );

  if (!evaluateWidth && !evaluateColor) {
    return null;
  }

  const evaluateLineCap = stringEvaluator(
    flatStyle,
    prefix + 'stroke-line-cap',
    context,
  );

  const evaluateLineJoin = stringEvaluator(
    flatStyle,
    prefix + 'stroke-line-join',
    context,
  );

  const evaluateLineDash = numberArrayEvaluator(
    flatStyle,
    prefix + 'stroke-line-dash',
    context,
  );

  const evaluateLineDashOffset = numberEvaluator(
    flatStyle,
    prefix + 'stroke-line-dash-offset',
    context,
  );

  const evaluateMiterLimit = numberEvaluator(
    flatStyle,
    prefix + 'stroke-miter-limit',
    context,
  );

  const stroke = new Stroke();
  return function (context) {
    if (evaluateColor) {
      const color = evaluateColor(context);
      if (color === NO_COLOR) {
        return null;
      }
      stroke.setColor(color);
    }

    if (evaluateWidth) {
      stroke.setWidth(evaluateWidth(context));
    }

    if (evaluateLineCap) {
      const lineCap = evaluateLineCap(context);
      if (lineCap !== 'butt' && lineCap !== 'round' && lineCap !== 'square') {
        throw new Error('Expected butt, round, or square line cap');
      }
      stroke.setLineCap(lineCap);
    }

    if (evaluateLineJoin) {
      const lineJoin = evaluateLineJoin(context);
      if (
        lineJoin !== 'bevel' &&
        lineJoin !== 'round' &&
        lineJoin !== 'miter'
      ) {
        throw new Error('Expected bevel, round, or miter line join');
      }
      stroke.setLineJoin(lineJoin);
    }

    if (evaluateLineDash) {
      stroke.setLineDash(evaluateLineDash(context));
    }

    if (evaluateLineDashOffset) {
      stroke.setLineDashOffset(evaluateLineDashOffset(context));
    }

    if (evaluateMiterLimit) {
      stroke.setMiterLimit(evaluateMiterLimit(context));
    }

    return stroke;
  };
}

/**
 * @typedef {function(EvaluationContext):Text} TextEvaluator
 */

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @param {ParsingContext} context The parsing context.
 * @return {TextEvaluator?} A function that evaluates to a text symbolizer.
 */
function buildText(flatStyle, context) {
  const prefix = 'text-';

  // Currently, an Array<string> may be used for rich text support.  This doesn't
  // work with our expression syntax where arrays of strings are interpreted as
  // call expressions.  To support rich text, we could add a 'strings' operator
  // where all the following arguments would be string values.
  const evaluateValue = stringEvaluator(flatStyle, prefix + 'value', context);
  if (!evaluateValue) {
    return null;
  }

  const evaluateFill = buildFill(flatStyle, prefix, context);

  const evaluateBackgroundFill = buildFill(
    flatStyle,
    prefix + 'background-',
    context,
  );

  const evaluateStroke = buildStroke(flatStyle, prefix, context);

  const evaluateBackgroundStroke = buildStroke(
    flatStyle,
    prefix + 'background-',
    context,
  );

  const evaluateFont = stringEvaluator(flatStyle, prefix + 'font', context);

  const evaluateMaxAngle = numberEvaluator(
    flatStyle,
    prefix + 'max-angle',
    context,
  );

  const evaluateOffsetX = numberEvaluator(
    flatStyle,
    prefix + 'offset-x',
    context,
  );

  const evaluateOffsetY = numberEvaluator(
    flatStyle,
    prefix + 'offset-y',
    context,
  );

  const evaluateOverflow = booleanEvaluator(
    flatStyle,
    prefix + 'overflow',
    context,
  );

  const evaluatePlacement = stringEvaluator(
    flatStyle,
    prefix + 'placement',
    context,
  );

  const evaluateRepeat = numberEvaluator(flatStyle, prefix + 'repeat', context);

  const evaluateScale = sizeLikeEvaluator(flatStyle, prefix + 'scale', context);

  const evaluateRotateWithView = booleanEvaluator(
    flatStyle,
    prefix + 'rotate-with-view',
    context,
  );

  const evaluateRotation = numberEvaluator(
    flatStyle,
    prefix + 'rotation',
    context,
  );

  const evaluateAlign = stringEvaluator(flatStyle, prefix + 'align', context);

  const evaluateJustify = stringEvaluator(
    flatStyle,
    prefix + 'justify',
    context,
  );

  const evaluateBaseline = stringEvaluator(
    flatStyle,
    prefix + 'baseline',
    context,
  );

  const evaluatePadding = numberArrayEvaluator(
    flatStyle,
    prefix + 'padding',
    context,
  );

  // The following properties are not currently settable
  const declutterMode = optionalDeclutterMode(
    flatStyle,
    prefix + 'declutter-mode',
  );

  const text = new Text({declutterMode});

  return function (context) {
    text.setText(evaluateValue(context));

    if (evaluateFill) {
      text.setFill(evaluateFill(context));
    }

    if (evaluateBackgroundFill) {
      text.setBackgroundFill(evaluateBackgroundFill(context));
    }

    if (evaluateStroke) {
      text.setStroke(evaluateStroke(context));
    }

    if (evaluateBackgroundStroke) {
      text.setBackgroundStroke(evaluateBackgroundStroke(context));
    }

    if (evaluateFont) {
      text.setFont(evaluateFont(context));
    }

    if (evaluateMaxAngle) {
      text.setMaxAngle(evaluateMaxAngle(context));
    }

    if (evaluateOffsetX) {
      text.setOffsetX(evaluateOffsetX(context));
    }

    if (evaluateOffsetY) {
      text.setOffsetY(evaluateOffsetY(context));
    }

    if (evaluateOverflow) {
      text.setOverflow(evaluateOverflow(context));
    }

    if (evaluatePlacement) {
      const placement = evaluatePlacement(context);
      if (placement !== 'point' && placement !== 'line') {
        throw new Error('Expected point or line for text-placement');
      }
      text.setPlacement(placement);
    }

    if (evaluateRepeat) {
      text.setRepeat(evaluateRepeat(context));
    }

    if (evaluateScale) {
      text.setScale(evaluateScale(context));
    }

    if (evaluateRotateWithView) {
      text.setRotateWithView(evaluateRotateWithView(context));
    }

    if (evaluateRotation) {
      text.setRotation(evaluateRotation(context));
    }

    if (evaluateAlign) {
      const textAlign = evaluateAlign(context);
      if (
        textAlign !== 'left' &&
        textAlign !== 'center' &&
        textAlign !== 'right' &&
        textAlign !== 'end' &&
        textAlign !== 'start'
      ) {
        throw new Error(
          'Expected left, right, center, start, or end for text-align',
        );
      }
      text.setTextAlign(textAlign);
    }

    if (evaluateJustify) {
      const justify = evaluateJustify(context);
      if (justify !== 'left' && justify !== 'right' && justify !== 'center') {
        throw new Error('Expected left, right, or center for text-justify');
      }
      text.setJustify(justify);
    }

    if (evaluateBaseline) {
      const textBaseline = evaluateBaseline(context);
      if (
        textBaseline !== 'bottom' &&
        textBaseline !== 'top' &&
        textBaseline !== 'middle' &&
        textBaseline !== 'alphabetic' &&
        textBaseline !== 'hanging'
      ) {
        throw new Error(
          'Expected bottom, top, middle, alphabetic, or hanging for text-baseline',
        );
      }
      text.setTextBaseline(textBaseline);
    }

    if (evaluatePadding) {
      text.setPadding(evaluatePadding(context));
    }

    return text;
  };
}

/**
 * @typedef {function(EvaluationContext):import("../../style/Image.js").default} ImageEvaluator
 */

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @param {ParsingContext} context The parsing context.
 * @return {ImageEvaluator?} A function that evaluates to an image symbolizer.
 */
function buildImage(flatStyle, context) {
  if ('icon-src' in flatStyle) {
    return buildIcon(flatStyle, context);
  }

  if ('shape-points' in flatStyle) {
    return buildShape(flatStyle, context);
  }

  if ('circle-radius' in flatStyle) {
    return buildCircle(flatStyle, context);
  }

  return null;
}

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @param {ParsingContext} context The parsing context.
 * @return {ImageEvaluator} A function that evaluates to an image symbolizer.
 */
function buildIcon(flatStyle, context) {
  const prefix = 'icon-';

  // required property
  const srcName = prefix + 'src';
  const src = requireString(flatStyle[srcName], srcName);

  // settable properties
  const evaluateAnchor = coordinateEvaluator(
    flatStyle,
    prefix + 'anchor',
    context,
  );

  const evaluateScale = sizeLikeEvaluator(flatStyle, prefix + 'scale', context);

  const evaluateOpacity = numberEvaluator(
    flatStyle,
    prefix + 'opacity',
    context,
  );

  const evaluateDisplacement = coordinateEvaluator(
    flatStyle,
    prefix + 'displacement',
    context,
  );

  const evaluateRotation = numberEvaluator(
    flatStyle,
    prefix + 'rotation',
    context,
  );

  const evaluateRotateWithView = booleanEvaluator(
    flatStyle,
    prefix + 'rotate-with-view',
    context,
  );

  // the remaining symbolizer properties are not currently settable
  const anchorOrigin = optionalIconOrigin(flatStyle, prefix + 'anchor-origin');
  const anchorXUnits = optionalIconAnchorUnits(
    flatStyle,
    prefix + 'anchor-x-units',
  );
  const anchorYUnits = optionalIconAnchorUnits(
    flatStyle,
    prefix + 'anchor-y-units',
  );
  const color = optionalColorLike(flatStyle, prefix + 'color');
  const crossOrigin = optionalString(flatStyle, prefix + 'cross-origin');
  const offset = optionalNumberArray(flatStyle, prefix + 'offset');
  const offsetOrigin = optionalIconOrigin(flatStyle, prefix + 'offset-origin');
  const width = optionalNumber(flatStyle, prefix + 'width');
  const height = optionalNumber(flatStyle, prefix + 'height');
  const size = optionalSize(flatStyle, prefix + 'size');
  const declutterMode = optionalDeclutterMode(
    flatStyle,
    prefix + 'declutter-mode',
  );

  const icon = new Icon({
    src,
    anchorOrigin,
    anchorXUnits,
    anchorYUnits,
    color,
    crossOrigin,
    offset,
    offsetOrigin,
    height,
    width,
    size,
    declutterMode,
  });

  return function (context) {
    if (evaluateOpacity) {
      icon.setOpacity(evaluateOpacity(context));
    }

    if (evaluateDisplacement) {
      icon.setDisplacement(evaluateDisplacement(context));
    }

    if (evaluateRotation) {
      icon.setRotation(evaluateRotation(context));
    }

    if (evaluateRotateWithView) {
      icon.setRotateWithView(evaluateRotateWithView(context));
    }

    if (evaluateScale) {
      icon.setScale(evaluateScale(context));
    }

    if (evaluateAnchor) {
      icon.setAnchor(evaluateAnchor(context));
    }
    return icon;
  };
}

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @param {ParsingContext} context The parsing context.
 * @return {ImageEvaluator} A function that evaluates to an icon symbolizer.
 */
function buildShape(flatStyle, context) {
  const prefix = 'shape-';

  // required property
  const pointsName = prefix + 'points';
  const radiusName = prefix + 'radius';
  const points = requireNumber(flatStyle[pointsName], pointsName);
  const radius = requireNumber(flatStyle[radiusName], radiusName);

  // settable properties
  const evaluateFill = buildFill(flatStyle, prefix, context);
  const evaluateStroke = buildStroke(flatStyle, prefix, context);
  const evaluateScale = sizeLikeEvaluator(flatStyle, prefix + 'scale', context);
  const evaluateDisplacement = coordinateEvaluator(
    flatStyle,
    prefix + 'displacement',
    context,
  );
  const evaluateRotation = numberEvaluator(
    flatStyle,
    prefix + 'rotation',
    context,
  );
  const evaluateRotateWithView = booleanEvaluator(
    flatStyle,
    prefix + 'rotate-with-view',
    context,
  );

  // the remaining properties are not currently settable
  const radius2 = optionalNumber(flatStyle, prefix + 'radius2');
  const angle = optionalNumber(flatStyle, prefix + 'angle');
  const declutterMode = optionalDeclutterMode(
    flatStyle,
    prefix + 'declutter-mode',
  );

  const shape = new RegularShape({
    points,
    radius,
    radius2,
    angle,
    declutterMode,
  });

  return function (context) {
    if (evaluateFill) {
      shape.setFill(evaluateFill(context));
    }
    if (evaluateStroke) {
      shape.setStroke(evaluateStroke(context));
    }
    if (evaluateDisplacement) {
      shape.setDisplacement(evaluateDisplacement(context));
    }
    if (evaluateRotation) {
      shape.setRotation(evaluateRotation(context));
    }
    if (evaluateRotateWithView) {
      shape.setRotateWithView(evaluateRotateWithView(context));
    }
    if (evaluateScale) {
      shape.setScale(evaluateScale(context));
    }

    return shape;
  };
}

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @param {ParsingContext} context The parsing context.
 * @return {ImageEvaluator} A function that evaluates to a circle symbolizer.
 */
function buildCircle(flatStyle, context) {
  const prefix = 'circle-';

  // settable properties
  const evaluateFill = buildFill(flatStyle, prefix, context);
  const evaluateStroke = buildStroke(flatStyle, prefix, context);
  const evaluateRadius = numberEvaluator(flatStyle, prefix + 'radius', context);
  const evaluateScale = sizeLikeEvaluator(flatStyle, prefix + 'scale', context);
  const evaluateDisplacement = coordinateEvaluator(
    flatStyle,
    prefix + 'displacement',
    context,
  );
  const evaluateRotation = numberEvaluator(
    flatStyle,
    prefix + 'rotation',
    context,
  );
  const evaluateRotateWithView = booleanEvaluator(
    flatStyle,
    prefix + 'rotate-with-view',
    context,
  );

  // the remaining properties are not currently settable
  const declutterMode = optionalDeclutterMode(
    flatStyle,
    prefix + 'declutter-mode',
  );

  const circle = new Circle({
    radius: 5, // this is arbitrary, but required - the evaluated radius is used below
    declutterMode,
  });

  return function (context) {
    if (evaluateRadius) {
      circle.setRadius(evaluateRadius(context));
    }
    if (evaluateFill) {
      circle.setFill(evaluateFill(context));
    }
    if (evaluateStroke) {
      circle.setStroke(evaluateStroke(context));
    }
    if (evaluateDisplacement) {
      circle.setDisplacement(evaluateDisplacement(context));
    }
    if (evaluateRotation) {
      circle.setRotation(evaluateRotation(context));
    }
    if (evaluateRotateWithView) {
      circle.setRotateWithView(evaluateRotateWithView(context));
    }
    if (evaluateScale) {
      circle.setScale(evaluateScale(context));
    }

    return circle;
  };
}

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @param {string} name The property name.
 * @param {ParsingContext} context The parsing context.
 * @return {import('../../expr/cpu.js').NumberEvaluator|undefined} The expression evaluator or undefined.
 */
function numberEvaluator(flatStyle, name, context) {
  if (!(name in flatStyle)) {
    return undefined;
  }
  const evaluator = buildExpression(flatStyle[name], NumberType, context);
  return function (context) {
    return requireNumber(evaluator(context), name);
  };
}

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @param {string} name The property name.
 * @param {ParsingContext} context The parsing context.
 * @return {import('../../expr/cpu.js').StringEvaluator?} The expression evaluator.
 */
function stringEvaluator(flatStyle, name, context) {
  if (!(name in flatStyle)) {
    return null;
  }
  const evaluator = buildExpression(flatStyle[name], StringType, context);
  return function (context) {
    return requireString(evaluator(context), name);
  };
}

function patternEvaluator(flatStyle, prefix, context) {
  const srcEvaluator = stringEvaluator(
    flatStyle,
    prefix + 'pattern-src',
    context,
  );
  const offsetEvaluator = sizeEvaluator(
    flatStyle,
    prefix + 'pattern-offset',
    context,
  );
  const patternSizeEvaluator = sizeEvaluator(
    flatStyle,
    prefix + 'pattern-size',
    context,
  );
  const colorEvaluator = colorLikeEvaluator(
    flatStyle,
    prefix + 'color',
    context,
  );
  return function (context) {
    return {
      src: srcEvaluator(context),
      offset: offsetEvaluator && offsetEvaluator(context),
      size: patternSizeEvaluator && patternSizeEvaluator(context),
      color: colorEvaluator && colorEvaluator(context),
    };
  };
}

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @param {string} name The property name.
 * @param {ParsingContext} context The parsing context.
 * @return {import('../../expr/cpu.js').BooleanEvaluator?} The expression evaluator.
 */
function booleanEvaluator(flatStyle, name, context) {
  if (!(name in flatStyle)) {
    return null;
  }
  const evaluator = buildExpression(flatStyle[name], BooleanType, context);
  return function (context) {
    const value = evaluator(context);
    if (typeof value !== 'boolean') {
      throw new Error(`Expected a boolean for ${name}`);
    }
    return value;
  };
}

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @param {string} name The property name.
 * @param {ParsingContext} context The parsing context.
 * @return {import('../../expr/cpu.js').ColorLikeEvaluator?} The expression evaluator.
 */
function colorLikeEvaluator(flatStyle, name, context) {
  if (!(name in flatStyle)) {
    return null;
  }
  const evaluator = buildExpression(flatStyle[name], ColorType, context);
  return function (context) {
    return requireColorLike(evaluator(context), name);
  };
}

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @param {string} name The property name.
 * @param {ParsingContext} context The parsing context.
 * @return {import('../../expr/cpu.js').NumberArrayEvaluator?} The expression evaluator.
 */
function numberArrayEvaluator(flatStyle, name, context) {
  if (!(name in flatStyle)) {
    return null;
  }
  const evaluator = buildExpression(flatStyle[name], NumberArrayType, context);
  return function (context) {
    return requireNumberArray(evaluator(context), name);
  };
}

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @param {string} name The property name.
 * @param {ParsingContext} context The parsing context.
 * @return {import('../../expr/cpu.js').CoordinateEvaluator?} The expression evaluator.
 */
function coordinateEvaluator(flatStyle, name, context) {
  if (!(name in flatStyle)) {
    return null;
  }
  const evaluator = buildExpression(flatStyle[name], NumberArrayType, context);
  return function (context) {
    const array = requireNumberArray(evaluator(context), name);
    if (array.length !== 2) {
      throw new Error(`Expected two numbers for ${name}`);
    }
    return array;
  };
}

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @param {string} name The property name.
 * @param {ParsingContext} context The parsing context.
 * @return {import('../../expr/cpu.js').SizeEvaluator?} The expression evaluator.
 */
function sizeEvaluator(flatStyle, name, context) {
  if (!(name in flatStyle)) {
    return null;
  }
  const evaluator = buildExpression(flatStyle[name], NumberArrayType, context);
  return function (context) {
    return requireSize(evaluator(context), name);
  };
}

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @param {string} name The property name.
 * @param {ParsingContext} context The parsing context.
 * @return {import('../../expr/cpu.js').SizeLikeEvaluator?} The expression evaluator.
 */
function sizeLikeEvaluator(flatStyle, name, context) {
  if (!(name in flatStyle)) {
    return null;
  }
  const evaluator = buildExpression(
    flatStyle[name],
    NumberArrayType | NumberType,
    context,
  );
  return function (context) {
    return requireSizeLike(evaluator(context), name);
  };
}

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @param {string} property The symbolizer property.
 * @return {number|undefined} A number or undefined.
 */
function optionalNumber(flatStyle, property) {
  const value = flatStyle[property];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'number') {
    throw new Error(`Expected a number for ${property}`);
  }
  return value;
}

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @param {string} property The symbolizer property.
 * @return {import("../../size.js").Size|undefined} A size or undefined.
 */
function optionalSize(flatStyle, property) {
  const encoded = flatStyle[property];
  if (encoded === undefined) {
    return undefined;
  }
  if (typeof encoded === 'number') {
    return toSize(encoded);
  }
  if (!Array.isArray(encoded)) {
    throw new Error(`Expected a number or size array for ${property}`);
  }
  if (
    encoded.length !== 2 ||
    typeof encoded[0] !== 'number' ||
    typeof encoded[1] !== 'number'
  ) {
    throw new Error(`Expected a number or size array for ${property}`);
  }
  return encoded;
}

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @param {string} property The symbolizer property.
 * @return {string|undefined} A string or undefined.
 */
function optionalString(flatStyle, property) {
  const encoded = flatStyle[property];
  if (encoded === undefined) {
    return undefined;
  }
  if (typeof encoded !== 'string') {
    throw new Error(`Expected a string for ${property}`);
  }
  return encoded;
}

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @param {string} property The symbolizer property.
 * @return {import("../../style/Icon.js").IconOrigin|undefined} An icon origin or undefined.
 */
function optionalIconOrigin(flatStyle, property) {
  const encoded = flatStyle[property];
  if (encoded === undefined) {
    return undefined;
  }
  if (
    encoded !== 'bottom-left' &&
    encoded !== 'bottom-right' &&
    encoded !== 'top-left' &&
    encoded !== 'top-right'
  ) {
    throw new Error(
      `Expected bottom-left, bottom-right, top-left, or top-right for ${property}`,
    );
  }
  return encoded;
}

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @param {string} property The symbolizer property.
 * @return {import("../../style/Icon.js").IconAnchorUnits|undefined} Icon anchor units or undefined.
 */
function optionalIconAnchorUnits(flatStyle, property) {
  const encoded = flatStyle[property];
  if (encoded === undefined) {
    return undefined;
  }
  if (encoded !== 'pixels' && encoded !== 'fraction') {
    throw new Error(`Expected pixels or fraction for ${property}`);
  }
  return encoded;
}

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @param {string} property The symbolizer property.
 * @return {Array<number>|undefined} An array of numbers or undefined.
 */
function optionalNumberArray(flatStyle, property) {
  const encoded = flatStyle[property];
  if (encoded === undefined) {
    return undefined;
  }
  return requireNumberArray(encoded, property);
}

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @param {string} property The symbolizer property.
 * @return {import('../../style/Style.js').DeclutterMode} Icon declutter mode.
 */
function optionalDeclutterMode(flatStyle, property) {
  const encoded = flatStyle[property];
  if (encoded === undefined) {
    return undefined;
  }
  if (typeof encoded !== 'string') {
    throw new Error(`Expected a string for ${property}`);
  }
  if (encoded !== 'declutter' && encoded !== 'obstacle' && encoded !== 'none') {
    throw new Error(`Expected declutter, obstacle, or none for ${property}`);
  }
  return encoded;
}

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @param {string} property The symbolizer property.
 * @return {string|Array<number>|undefined} A string or an array of color values or undefined.
 */
function optionalColorLike(flatStyle, property) {
  const encoded = flatStyle[property];
  if (encoded === undefined) {
    return undefined;
  }
  return requireColorLike(encoded, property);
}

/**
 * @param {any} value The value.
 * @param {string} property The property.
 * @return {Array<number>} An array of numbers.
 */
function requireNumberArray(value, property) {
  if (!Array.isArray(value)) {
    throw new Error(`Expected an array for ${property}`);
  }
  const length = value.length;
  for (let i = 0; i < length; ++i) {
    if (typeof value[i] !== 'number') {
      throw new Error(`Expected an array of numbers for ${property}`);
    }
  }
  return value;
}

/**
 * @param {any} value The value.
 * @param {string} property The property.
 * @return {string} A string.
 */
function requireString(value, property) {
  if (typeof value !== 'string') {
    throw new Error(`Expected a string for ${property}`);
  }
  return value;
}

/**
 * @param {any} value The value.
 * @param {string} property The property.
 * @return {number} A number.
 */
function requireNumber(value, property) {
  if (typeof value !== 'number') {
    throw new Error(`Expected a number for ${property}`);
  }
  return value;
}

/**
 * @param {any} value The value.
 * @param {string} property The property.
 * @return {Array<number>|string} A color.
 */
function requireColorLike(value, property) {
  if (typeof value === 'string') {
    return value;
  }
  const array = requireNumberArray(value, property);
  const length = array.length;
  if (length < 3 || length > 4) {
    throw new Error(`Expected a color with 3 or 4 values for ${property}`);
  }
  return array;
}

/**
 * @param {any} value The value.
 * @param {string} property The property.
 * @return {Array<number>} A number or an array of two numbers.
 */
function requireSize(value, property) {
  const size = requireNumberArray(value, property);
  if (size.length !== 2) {
    throw new Error(`Expected an array of two numbers for ${property}`);
  }
  return size;
}

/**
 * @param {any} value The value.
 * @param {string} property The property.
 * @return {number|Array<number>} A number or an array of two numbers.
 */
function requireSizeLike(value, property) {
  if (typeof value === 'number') {
    return value;
  }
  return requireSize(value, property);
}
