/**
 * Utilities for parsing literal style objects
 * @module ol/webgl/styleparser
 */
import {ShaderBuilder} from './ShaderBuilder.js';
import {
  ValueTypes,
  arrayToGlsl,
  expressionToGlsl,
  getStringNumberEquivalent,
  stringToGlsl,
  uniformNameForVariable,
} from '../style/expressions.js';
import {asArray} from '../color.js';
import {getUid} from '../util.js';

/**
 * Packs all components of a color into a two-floats array
 * @param {import("../color.js").Color|string} color Color as array of numbers or string
 * @return {Array<number>} Vec2 array containing the color in compressed form
 */
export function packColor(color) {
  const array = asArray(color);
  const r = array[0] * 256;
  const g = array[1];
  const b = array[2] * 256;
  const a = Math.round(array[3] * 255);
  return [r + g, b + a];
}

const UNPACK_COLOR_FN = `vec4 unpackColor(vec2 packedColor) {
  return fract(packedColor[1] / 256.0) * vec4(
    fract(floor(packedColor[0] / 256.0) / 256.0),
    fract(packedColor[0] / 256.0),
    fract(floor(packedColor[1] / 256.0) / 256.0),
    1.0
  );
}`;

/**
 * @param {ValueTypes} type Value type
 * @return {1|2|3|4} The amount of components for this value
 */
function getGlslSizeFromType(type) {
  if (type === ValueTypes.COLOR) {
    return 2;
  }
  if (type === ValueTypes.NUMBER_ARRAY) {
    return 4;
  }
  return 1;
}

/**
 * @param {ValueTypes} type Value type
 * @return {'float'|'vec2'|'vec3'|'vec4'} The corresponding GLSL type for this value
 */
function getGlslTypeFromType(type) {
  const size = getGlslSizeFromType(type);
  if (size > 1) {
    return /** @type {'vec2'|'vec3'|'vec4'} */ (`vec${size}`);
  }
  return 'float';
}

/**
 * @param {import("../style/literal.js").LiteralStyle} style Style
 * @param {ShaderBuilder} builder Shader builder
 * @param {import("../style/expressions.js").ParsingContext} vertContext Vertex shader parsing context
 * @param {'shape-'|'circle-'|'icon-'} prefix Properties prefix
 */
function parseCommonSymbolProperties(style, builder, vertContext, prefix) {
  let radius;
  if (`${prefix}radius` in style && prefix !== 'icon-') {
    radius = expressionToGlsl(
      vertContext,
      style[`${prefix}radius`],
      ValueTypes.NUMBER
    );
  } else if (`${prefix}radius1` in style && prefix === 'shape-') {
    radius = expressionToGlsl(
      vertContext,
      style[`${prefix}radius1`],
      ValueTypes.NUMBER
    );
  }
  if (radius !== undefined) {
    if (`${prefix}stroke-width` in style) {
      radius = `(${radius} + ${expressionToGlsl(
        vertContext,
        style[`${prefix}stroke-width`],
        ValueTypes.NUMBER
      )} * 0.5)`;
    }
    builder.setSymbolSizeExpression(`vec2(${radius} * 2. + 0.5)`); // adding some padding for antialiasing
  }
  if (`${prefix}scale` in style) {
    const scale = expressionToGlsl(
      vertContext,
      style[`${prefix}scale`],
      ValueTypes.NUMBER | ValueTypes.NUMBER_ARRAY
    );
    builder.setSymbolSizeExpression(
      `${builder.getSymbolSizeExpression()} * ${scale}`
    );
  }
  if (`${prefix}displacement` in style) {
    builder.setSymbolOffsetExpression(
      expressionToGlsl(
        vertContext,
        style[`${prefix}displacement`],
        ValueTypes.NUMBER_ARRAY
      )
    );
  }
  if (`${prefix}rotation` in style) {
    builder.setSymbolRotationExpression(
      expressionToGlsl(
        vertContext,
        style[`${prefix}rotation`],
        ValueTypes.NUMBER
      )
    );
  }
  if (`${prefix}rotate-with-view` in style) {
    builder.setSymbolRotateWithView(!!style[`${prefix}rotate-with-view`]);
  }
}

/**
 * @param {string} distanceField The distance field expression
 * @param {string|null} fillColor The fill color expression; null if no fill
 * @param {string|null} strokeColor The stroke color expression; null if no stroke
 * @param {string|null} strokeWidth The stroke width expression; null if no stroke
 * @param {string|null} opacity The opacity expression; null if no stroke
 * @return {string} The final color expression, based on the distance field and given params
 */
function getColorFromDistanceField(
  distanceField,
  fillColor,
  strokeColor,
  strokeWidth,
  opacity
) {
  let color = 'vec4(0.)';
  if (fillColor !== null) {
    color = fillColor;
  }
  if (strokeColor !== null && strokeWidth !== null) {
    const strokeFillRatio = `smoothstep(-${strokeWidth} + 0.63, -${strokeWidth} - 0.58, ${distanceField})`;
    color = `mix(${strokeColor}, ${color}, ${strokeFillRatio})`;
  }
  const shapeOpacity = `(1.0 - smoothstep(-0.63, 0.58, ${distanceField}))`;
  let result = `${color} * ${shapeOpacity}`;
  if (opacity !== null) {
    result = `${result} * ${opacity}`;
  }
  return result;
}

/**
 * @param {import("../style/literal.js").LiteralStyle} style Style
 * @param {ShaderBuilder} builder Shader builder
 * @param {Object<string,import("../webgl/Helper").UniformValue>} uniforms Uniforms
 * @param {import("../style/expressions.js").ParsingContext} vertContext Vertex shader parsing context
 * @param {import("../style/expressions.js").ParsingContext} fragContext Fragment shader parsing context
 */
function parseCircleProperties(
  style,
  builder,
  uniforms,
  vertContext,
  fragContext
) {
  // this function takes in screen coordinates in pixels and returns the signed distance field
  // (0 on the boundary, negative inside the circle, positive outside, values in pixels)
  fragContext.functions[
    'circleDistanceField'
  ] = `float circleDistanceField(vec2 point, float radius) {
  return length(point) - radius;
}`;

  parseCommonSymbolProperties(style, builder, vertContext, 'circle-');

  // OPACITY
  let opacity = null;
  if ('circle-opacity' in style) {
    opacity = expressionToGlsl(
      fragContext,
      style['circle-opacity'],
      ValueTypes.NUMBER
    );
  }

  // SCALE
  let currentPoint = 'coordsPx';
  if ('circle-scale' in style) {
    const scale = expressionToGlsl(
      fragContext,
      style['circle-scale'],
      ValueTypes.NUMBER | ValueTypes.NUMBER_ARRAY
    );
    currentPoint = `coordsPx / ${scale}`;
  }

  // FILL COLOR
  let fillColor = null;
  if ('circle-fill-color' in style) {
    fillColor = expressionToGlsl(
      fragContext,
      style['circle-fill-color'],
      ValueTypes.COLOR
    );
  }

  // STROKE COLOR
  let strokeColor = null;
  if ('circle-stroke-color' in style) {
    strokeColor = expressionToGlsl(
      fragContext,
      style['circle-stroke-color'],
      ValueTypes.COLOR
    );
  }

  // RADIUS
  let radius = expressionToGlsl(
    fragContext,
    style['circle-radius'],
    ValueTypes.NUMBER
  );

  // STROKE WIDTH
  let strokeWidth = null;
  if ('circle-stroke-width' in style) {
    strokeWidth = expressionToGlsl(
      fragContext,
      style['circle-stroke-width'],
      ValueTypes.NUMBER
    );
    radius = `(${radius} + ${strokeWidth} * 0.5)`;
  }

  // FINAL COLOR
  const distanceField = `circleDistanceField(${currentPoint}, ${radius})`;
  const colorExpression = getColorFromDistanceField(
    distanceField,
    fillColor,
    strokeColor,
    strokeWidth,
    opacity
  );
  builder.setSymbolColorExpression(colorExpression);
}

/**
 * @param {import("../style/literal.js").LiteralStyle} style Style
 * @param {ShaderBuilder} builder Shader builder
 * @param {Object<string,import("../webgl/Helper").UniformValue>} uniforms Uniforms
 * @param {import("../style/expressions.js").ParsingContext} vertContext Vertex shader parsing context
 * @param {import("../style/expressions.js").ParsingContext} fragContext Fragment shader parsing context
 */
function parseShapeProperties(
  style,
  builder,
  uniforms,
  vertContext,
  fragContext
) {
  fragContext.functions['round'] = `float round(float v) {
  return sign(v) * floor(abs(v) + 0.5);
}`;

  // these functions take in screen coordinates in pixels and returns the signed distance field
  // (0 on the boundary, negative inside the circle, positive outside, values in pixels)
  // inspired by https://github.com/zranger1/PixelblazePatterns/blob/master/Toolkit/sdf2d.md#n-sided-regular-polygon
  fragContext.functions[
    'starDistanceField'
  ] = `float starDistanceField(vec2 point, float numPoints, float radiusIn, float radiusOut, float angle) {
  float startAngle = -PI * 0.5 + angle; // tip starts upwards and rotates clockwise with angle
  float c = cos(startAngle);
  float s = sin(startAngle);
  vec2 pointRotated = vec2(c * point.x - s * point.y, s * point.x + c * point.y); 
  float alpha = TWO_PI / numPoints; // the angle of one sector
  float beta = atan(pointRotated.y, pointRotated.x);
  float gamma = round(beta / alpha) * alpha; // angle in sector
  c = cos(-gamma);
  s = sin(-gamma);
  vec2 inSector = vec2(c * pointRotated.x - s * pointRotated.y, abs(s * pointRotated.x + c * pointRotated.y));
  vec2 tipToPoint = inSector + vec2(-radiusOut, 0.);
  vec2 edgeNormal = vec2(radiusIn * sin(alpha * 0.5), -radiusIn * cos(alpha * 0.5) + radiusOut);
  return dot(normalize(edgeNormal), tipToPoint);
}`;
  fragContext.functions[
    'regularDistanceField'
  ] = `float regularDistanceField(vec2 point, float numPoints, float radius, float angle) {
  float startAngle = -PI * 0.5 + angle; // tip starts upwards and rotates clockwise with angle
  float c = cos(startAngle);
  float s = sin(startAngle);
  vec2 pointRotated = vec2(c * point.x - s * point.y, s * point.x + c * point.y); 
  float alpha = TWO_PI / numPoints; // the angle of one sector
  float radiusIn = radius * cos(PI / numPoints);
  float beta = atan(pointRotated.y, pointRotated.x);
  float gamma = round((beta - alpha * 0.5) / alpha) * alpha + alpha * 0.5; // angle in sector from mid
  c = cos(-gamma);
  s = sin(-gamma);
  vec2 inSector = vec2(c * pointRotated.x - s * pointRotated.y, abs(s * pointRotated.x + c * pointRotated.y));
  return inSector.x - radiusIn;
}`;

  parseCommonSymbolProperties(style, builder, vertContext, 'shape-');

  // OPACITY
  let opacity = null;
  if ('shape-opacity' in style) {
    opacity = expressionToGlsl(
      fragContext,
      style['shape-opacity'],
      ValueTypes.NUMBER
    );
  }

  // SCALE
  let currentPoint = 'coordsPx';
  if ('shape-scale' in style) {
    const scale = expressionToGlsl(
      fragContext,
      style['shape-scale'],
      ValueTypes.NUMBER | ValueTypes.NUMBER_ARRAY
    );
    currentPoint = `coordsPx / ${scale}`;
  }

  // FILL COLOR
  let fillColor = null;
  if ('shape-fill-color' in style) {
    fillColor = expressionToGlsl(
      fragContext,
      style['shape-fill-color'],
      ValueTypes.COLOR
    );
  }

  // STROKE COLOR
  let strokeColor = null;
  if ('shape-stroke-color' in style) {
    strokeColor = expressionToGlsl(
      fragContext,
      style['shape-stroke-color'],
      ValueTypes.COLOR
    );
  }

  // STROKE WIDTH
  let strokeWidth = null;
  if ('shape-stroke-width' in style) {
    strokeWidth = expressionToGlsl(
      fragContext,
      style['shape-stroke-width'],
      ValueTypes.NUMBER
    );
  }

  // SHAPE TYPE
  const numPoints = expressionToGlsl(
    fragContext,
    style['shape-points'],
    ValueTypes.NUMBER
  );
  let angle = '0.';
  if ('shape-angle' in style) {
    angle = expressionToGlsl(
      fragContext,
      style['shape-angle'],
      ValueTypes.NUMBER
    );
  }
  let shapeField;
  if ('shape-radius' in style) {
    let radius = expressionToGlsl(
      fragContext,
      style['shape-radius'],
      ValueTypes.NUMBER
    );
    if (strokeWidth !== null) {
      radius = `${radius} + ${strokeWidth} * 0.5`;
    }
    shapeField = `regularDistanceField(${currentPoint}, ${numPoints}, ${radius}, ${angle})`;
  } else {
    let radiusOuter = expressionToGlsl(
      fragContext,
      style['shape-radius1'],
      ValueTypes.NUMBER
    );
    let radiusInner = expressionToGlsl(
      fragContext,
      style['shape-radius2'],
      ValueTypes.NUMBER
    );
    if (strokeWidth !== null) {
      radiusOuter = `${radiusOuter} + ${strokeWidth} * 0.5`;
      radiusInner = `${radiusInner} + ${strokeWidth} * 0.5`;
    }
    shapeField = `starDistanceField(${currentPoint}, ${numPoints}, ${radiusInner}, ${radiusOuter}, ${angle})`;
  }

  // FINAL COLOR
  const colorExpression = getColorFromDistanceField(
    shapeField,
    fillColor,
    strokeColor,
    strokeWidth,
    opacity
  );
  builder.setSymbolColorExpression(colorExpression);
}

/**
 * @param {import("../style/literal.js").LiteralStyle} style Style
 * @param {ShaderBuilder} builder Shader builder
 * @param {Object<string,import("../webgl/Helper").UniformValue>} uniforms Uniforms
 * @param {import("../style/expressions.js").ParsingContext} vertContext Vertex shader parsing context
 * @param {import("../style/expressions.js").ParsingContext} fragContext Fragment shader parsing context
 */
function parseIconProperties(
  style,
  builder,
  uniforms,
  vertContext,
  fragContext
) {
  fragContext.functions[
    'samplePremultiplied'
  ] = `vec4 samplePremultiplied(sampler2D sampler, vec2 texCoord) {
  vec4 color = texture2D(sampler, texCoord);
  return vec4(color.rgb * color.a, color.a);
}`;

  // COLOR
  let color = 'vec4(1.0)';
  if ('icon-color' in style) {
    color = expressionToGlsl(
      fragContext,
      style['icon-color'],
      ValueTypes.COLOR
    );
  }

  // OPACITY
  if ('icon-opacity' in style) {
    color = `${color} * ${expressionToGlsl(
      fragContext,
      style['icon-opacity'],
      ValueTypes.NUMBER
    )}`;
  }

  // IMAGE & SIZE
  let image;
  let size;
  const textureId = getUid(style);
  if ('icon-src' in style) {
    image = new Image();
    image.crossOrigin =
      style['icon-cross-origin'] === undefined
        ? 'anonymous'
        : style['icon-cross-origin'];
    image.src = style['icon-src'];
    // the size is provided asynchronously using a uniform
    uniforms[`u_texture${textureId}_size`] = () => {
      return image.complete ? [image.width, image.height] : [0, 0];
    };
    size = `u_texture${textureId}_size`;
    builder.addUniform(`vec2 u_texture${textureId}_size`);
  } else {
    image = style['icon-img'];
    if (image instanceof HTMLImageElement) {
      if (image.complete && image.width && image.height) {
        size = arrayToGlsl([image.width, image.height]);
      } else {
        // the size is provided asynchronously using a uniform
        uniforms[`u_texture${textureId}_size`] = () => {
          return image.complete ? [image.width, image.height] : [0, 0];
        };
        size = `u_texture${textureId}_size`;
      }
    } else {
      size = arrayToGlsl([image.width, image.height]);
    }
  }
  uniforms[`u_texture${textureId}`] = image;
  builder
    .addUniform(`sampler2D u_texture${textureId}`)
    .setSymbolColorExpression(
      `${color} * samplePremultiplied(u_texture${textureId}, v_texCoord)`
    )
    .setSymbolSizeExpression(size);

  // override size if width/height were specified
  if ('icon-width' in style && 'icon-height' in style) {
    builder.setSymbolSizeExpression(
      `vec2(${expressionToGlsl(
        vertContext,
        style['icon-width'],
        ValueTypes.NUMBER
      )}, ${expressionToGlsl(
        vertContext,
        style['icon-height'],
        ValueTypes.NUMBER
      )})`
    );
  }

  // tex coord
  if ('icon-offset' in style && 'icon-size' in style) {
    let offset = expressionToGlsl(
      vertContext,
      style['icon-offset'],
      ValueTypes.NUMBER_ARRAY
    );
    const sampleSize = expressionToGlsl(
      vertContext,
      style['icon-size'],
      ValueTypes.NUMBER_ARRAY
    );
    const fullsize = builder.getSymbolSizeExpression();
    builder.setSymbolSizeExpression(sampleSize);

    if ('icon-offset-origin' in style) {
      switch (style['icon-offset-origin']) {
        case 'top-right':
          offset = `vec2(v_quadSizePx.x, 0.) + ${sampleSize} * vec2(-1., 0.) + ${offset} * vec2(-1., 1.)`;
          break;
        case 'bottom-left':
          offset = `vec2(0., v_quadSizePx.y) + ${sampleSize} * vec2(0., -1.) + ${offset} * vec2(1., -1.)`;
          break;
        case 'bottom-right':
          offset = `v_quadSizePx - ${sampleSize} - ${offset}`;
          break;
        default: // pass
      }
    }
    builder.setTextureCoordinateExpression(
      `(vec4((${offset}).xyxy) + vec4(0., 0., ${sampleSize})) / (${fullsize}).xyxy`
    );
  }

  parseCommonSymbolProperties(style, builder, vertContext, 'icon-');

  if ('icon-anchor' in style) {
    const anchor = expressionToGlsl(
      vertContext,
      style['icon-anchor'],
      ValueTypes.NUMBER_ARRAY
    );
    let scale = `1.0`;
    if (`icon-scale` in style) {
      scale = expressionToGlsl(
        vertContext,
        style[`icon-scale`],
        ValueTypes.NUMBER | ValueTypes.NUMBER_ARRAY
      );
    }
    let shiftPx;
    if (
      style['icon-anchor-x-units'] === 'pixels' &&
      style['icon-anchor-y-units'] === 'pixels'
    ) {
      shiftPx = `${anchor} * ${scale}`;
    } else if (style['icon-anchor-x-units'] === 'pixels') {
      shiftPx = `${anchor} * vec2(vec2(${scale}).x, v_quadSizePx.y)`;
    } else if (style['icon-anchor-y-units'] === 'pixels') {
      shiftPx = `${anchor} * vec2(v_quadSizePx.x, vec2(${scale}).x)`;
    } else {
      shiftPx = `${anchor} * v_quadSizePx`;
    }
    // default origin is top-left
    let offsetPx = `v_quadSizePx * vec2(0.5, -0.5) + ${shiftPx} * vec2(-1., 1.)`;
    if ('icon-anchor-origin' in style) {
      switch (style['icon-anchor-origin']) {
        case 'top-right':
          offsetPx = `v_quadSizePx * -0.5 + ${shiftPx}`;
          break;
        case 'bottom-left':
          offsetPx = `v_quadSizePx * 0.5 - ${shiftPx}`;
          break;
        case 'bottom-right':
          offsetPx = `v_quadSizePx * vec2(-0.5, 0.5) + ${shiftPx} * vec2(1., -1.)`;
          break;
        default: // pass
      }
    }
    builder.setSymbolOffsetExpression(
      `${builder.getSymbolOffsetExpression()} + ${offsetPx}`
    );
  }
}

/**
 * @param {import("../style/literal.js").LiteralStyle} style Style
 * @param {ShaderBuilder} builder Shader Builder
 * @param {Object<string,import("../webgl/Helper").UniformValue>} uniforms Uniforms
 * @param {import("../style/expressions.js").ParsingContext} vertContext Vertex shader parsing context
 * @param {import("../style/expressions.js").ParsingContext} fragContext Fragment shader parsing context
 */
function parseStrokeProperties(
  style,
  builder,
  uniforms,
  vertContext,
  fragContext
) {
  if ('stroke-color' in style) {
    builder.setStrokeColorExpression(
      expressionToGlsl(fragContext, style['stroke-color'], ValueTypes.COLOR)
    );
  }

  if ('stroke-width' in style) {
    builder.setStrokeWidthExpression(
      expressionToGlsl(vertContext, style['stroke-width'], ValueTypes.NUMBER)
    );
  }

  if ('stroke-offset' in style) {
    builder.setStrokeOffsetExpression(
      expressionToGlsl(vertContext, style['stroke-offset'], ValueTypes.NUMBER)
    );
  }

  if ('stroke-line-cap' in style) {
    builder.setStrokeCapExpression(
      expressionToGlsl(vertContext, style['stroke-line-cap'], ValueTypes.STRING)
    );
  }

  if ('stroke-line-join' in style) {
    builder.setStrokeJoinExpression(
      expressionToGlsl(
        vertContext,
        style['stroke-line-join'],
        ValueTypes.STRING
      )
    );
  }

  if ('stroke-miter-limit' in style) {
    builder.setStrokeMiterLimitExpression(
      expressionToGlsl(
        vertContext,
        style['stroke-miter-limit'],
        ValueTypes.NUMBER
      )
    );
  }

  if ('stroke-line-dash' in style) {
    fragContext.functions[
      'getSingleDashDistance'
    ] = `float getSingleDashDistance(float distance, float radius, float dashOffset, float dashLength, float dashLengthTotal, float capType) {
  float localDistance = mod(distance, dashLengthTotal);
  float distanceSegment = abs(localDistance - dashOffset - dashLength * 0.5) - dashLength * 0.5;
  distanceSegment = min(distanceSegment, dashLengthTotal - localDistance);
  if (capType == ${stringToGlsl('square')}) {
    distanceSegment -= v_width * 0.5;
  } else if (capType == ${stringToGlsl('round')}) {
    distanceSegment = min(distanceSegment, sqrt(distanceSegment * distanceSegment + radius * radius) - v_width * 0.5);
  }
  return distanceSegment;
}`;

    let dashPattern = style['stroke-line-dash'].map((v) =>
      expressionToGlsl(fragContext, v, ValueTypes.NUMBER)
    );
    // if pattern has odd length, concatenate it with itself to be even
    if (dashPattern.length % 2 === 1) {
      dashPattern = [...dashPattern, ...dashPattern];
    }

    let offsetExpression = '0.';
    if ('stroke-line-dash-offset' in style) {
      offsetExpression = expressionToGlsl(
        vertContext,
        style['stroke-line-dash-offset'],
        ValueTypes.NUMBER
      );
    }

    // define a function for this dash specifically (identified using a simple hash)
    // see https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
    let uniqueDashKey = JSON.stringify(style['stroke-line-dash'])
      .split('')
      .reduce((prev, curr) => (prev << 5) - prev + curr.charCodeAt(0), 0);
    uniqueDashKey = uniqueDashKey >>> 0;
    const dashFunctionName = `dashDistanceField_${uniqueDashKey}`;

    const dashLengthsDef = dashPattern.map(
      (v, i) => `float dashLength${i} = ${v};`
    );
    const totalLengthDef = dashPattern
      .map((v, i) => `dashLength${i}`)
      .join(' + ');
    let currentDashOffset = '0.';
    let distanceExpression = `getSingleDashDistance(distance, radius, ${currentDashOffset}, dashLength0, totalDashLength, capType)`;
    for (let i = 2; i < dashPattern.length; i += 2) {
      currentDashOffset = `${currentDashOffset} + dashLength${
        i - 2
      } + dashLength${i - 1}`;
      distanceExpression = `min(${distanceExpression}, getSingleDashDistance(distance, radius, ${currentDashOffset}, dashLength${i}, totalDashLength, capType))`;
    }

    fragContext.functions[
      dashFunctionName
    ] = `float ${dashFunctionName}(float distance, float radius, float capType) {
  ${dashLengthsDef.join('\n  ')}
  float totalDashLength = ${totalLengthDef};
  return ${distanceExpression};
}`;
    builder.setStrokeDistanceFieldExpression(
      `${dashFunctionName}(currentLengthPx + ${offsetExpression}, currentRadiusPx, capType)`
    );
  }
}

/**
 * @param {import("../style/literal.js").LiteralStyle} style Style
 * @param {ShaderBuilder} builder Shader Builder
 * @param {Object<string,import("../webgl/Helper").UniformValue>} uniforms Uniforms
 * @param {import("../style/expressions.js").ParsingContext} vertContext Vertex shader parsing context
 * @param {import("../style/expressions.js").ParsingContext} fragContext Fragment shader parsing context
 */
function parseFillProperties(
  style,
  builder,
  uniforms,
  vertContext,
  fragContext
) {
  if ('fill-color' in style) {
    builder.setFillColorExpression(
      expressionToGlsl(fragContext, style['fill-color'], ValueTypes.COLOR)
    );
  }
}

/**
 * @typedef {Object} StyleParseResult
 * @property {ShaderBuilder} builder Shader builder pre-configured according to a given style
 * @property {import("../render/webgl/VectorStyleRenderer.js").UniformDefinitions} uniforms Uniform definitions
 * @property {import("../render/webgl/VectorStyleRenderer.js").AttributeDefinitions} attributes Attribute definitions
 */

/**
 * Parses a {@link import("../style/literal.js").LiteralStyle} object and returns a {@link ShaderBuilder}
 * object that has been configured according to the given style, as well as `attributes` and `uniforms`
 * arrays to be fed to the `WebGLPointsRenderer` class.
 *
 * Also returns `uniforms` and `attributes` properties as expected by the
 * {@link module:ol/renderer/webgl/PointsLayer~WebGLPointsLayerRenderer}.
 *
 * @param {import("../style/literal.js").LiteralStyle} style Literal style.
 * @return {StyleParseResult} Result containing shader params, attributes and uniforms.
 */
export function parseLiteralStyle(style) {
  /**
   * @type {import("../style/expressions.js").ParsingContext}
   */
  const vertContext = {
    inFragmentShader: false,
    variables: [],
    attributes: [],
    functions: {},
    style: style,
  };

  /**
   * @type {import("../style/expressions.js").ParsingContext}
   */
  const fragContext = {
    inFragmentShader: true,
    variables: vertContext.variables,
    attributes: [],
    functions: {},
    style: style,
  };

  const builder = new ShaderBuilder();

  /** @type {Object<string,import("../webgl/Helper").UniformValue>} */
  const uniforms = {};

  if ('icon-src' in style || 'icon-img' in style) {
    parseIconProperties(style, builder, uniforms, vertContext, fragContext);
  } else if ('shape-points' in style) {
    parseShapeProperties(style, builder, uniforms, vertContext, fragContext);
  } else if ('circle-radius' in style) {
    parseCircleProperties(style, builder, uniforms, vertContext, fragContext);
  }
  parseStrokeProperties(style, builder, uniforms, vertContext, fragContext);
  parseFillProperties(style, builder, uniforms, vertContext, fragContext);

  if (style.filter) {
    const parsedFilter = expressionToGlsl(
      fragContext,
      style.filter,
      ValueTypes.BOOLEAN
    );
    builder.setFragmentDiscardExpression(`!${parsedFilter}`);
  }

  // define one uniform per variable
  fragContext.variables.forEach(function (variable) {
    const uniformName = uniformNameForVariable(variable.name);
    builder.addUniform(`${getGlslTypeFromType(variable.type)} ${uniformName}`);

    let callback;
    if (variable.type === ValueTypes.STRING) {
      callback = () =>
        getStringNumberEquivalent(
          /** @type {string} */ (style.variables[variable.name])
        );
    } else if (variable.type === ValueTypes.COLOR) {
      callback = () =>
        packColor([
          ...asArray(
            /** @type {string|Array<number>} */ (
              style.variables[variable.name]
            ) || '#eee'
          ),
        ]);
    } else if (variable.type === ValueTypes.BOOLEAN) {
      callback = () =>
        /** @type {boolean} */ (style.variables[variable.name]) ? 1.0 : 0.0;
    } else {
      callback = () => /** @type {number} */ (style.variables[variable.name]);
    }
    uniforms[uniformName] = callback;
  });

  // for each feature attribute used in the fragment shader, define a varying that will be used to pass data
  // from the vertex to the fragment shader, as well as an attribute in the vertex shader (if not already present)
  fragContext.attributes.forEach(function (attribute) {
    if (!vertContext.attributes.find((a) => a.name === attribute.name)) {
      vertContext.attributes.push(attribute);
    }
    let type = getGlslTypeFromType(attribute.type);
    let expression = `a_${attribute.name}`;
    if (attribute.type === ValueTypes.COLOR) {
      type = 'vec4';
      expression = `unpackColor(${expression})`;
      builder.addVertexShaderFunction(UNPACK_COLOR_FN);
    }
    builder.addVarying(`v_${attribute.name}`, type, expression);
  });

  // for each feature attribute used in the vertex shader, define an attribute in the vertex shader.
  vertContext.attributes.forEach(function (attribute) {
    builder.addAttribute(
      `${getGlslTypeFromType(attribute.type)} a_${attribute.name}`
    );
  });

  const attributes = vertContext.attributes.map(function (attribute) {
    let callback;
    if (attribute.callback) {
      callback = attribute.callback;
    } else if (attribute.type === ValueTypes.STRING) {
      callback = (feature) =>
        getStringNumberEquivalent(feature.get(attribute.name));
    } else if (attribute.type === ValueTypes.COLOR) {
      callback = (feature) =>
        packColor([...asArray(feature.get(attribute.name) || '#eee')]);
    } else if (attribute.type === ValueTypes.BOOLEAN) {
      callback = (feature) => (feature.get(attribute.name) ? 1.0 : 0.0);
    } else {
      callback = (feature) => feature.get(attribute.name);
    }

    return {
      name: attribute.name,
      size: getGlslSizeFromType(attribute.type),
      callback,
    };
  });

  // add functions that were collected in the parsing contexts
  for (const functionName in vertContext.functions) {
    builder.addVertexShaderFunction(vertContext.functions[functionName]);
  }
  for (const functionName in fragContext.functions) {
    builder.addFragmentShaderFunction(fragContext.functions[functionName]);
  }

  return {
    builder: builder,
    attributes: attributes.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.name]: {callback: curr.callback, size: curr.size},
      }),
      {}
    ),
    uniforms: uniforms,
  };
}
