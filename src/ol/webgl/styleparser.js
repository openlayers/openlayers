/**
 * Utilities for parsing literal style objects
 * @module ol/webgl/styleparser
 */
import {
  BooleanType,
  ColorType,
  NumberArrayType,
  NumberType,
  StringType,
  newParsingContext,
} from '../expr/expression.js';
import {ShaderBuilder} from './ShaderBuilder.js';
import {
  arrayToGlsl,
  buildExpression,
  getStringNumberEquivalent,
  stringToGlsl,
  uniformNameForVariable,
} from '../expr/gpu.js';
import {asArray} from '../color.js';

/**
 * Recursively parses a style expression and outputs a GLSL-compatible string. Takes in a compilation context that
 * will be read and modified during the parsing operation.
 * @param {import("../expr/gpu.js").CompilationContext} compilationContext Compilation context
 * @param {import("../expr/expression.js").EncodedExpression} value Value
 * @param {number} [expectedType] Expected final type (can be several types combined)
 * @return {string} GLSL-compatible output
 */
export function expressionToGlsl(compilationContext, value, expectedType) {
  const parsingContext = newParsingContext();
  parsingContext.style = compilationContext.style;
  return buildExpression(
    value,
    expectedType,
    parsingContext,
    compilationContext
  );
}

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
 * @param {number} type Value type
 * @return {1|2|3|4} The amount of components for this value
 */
function getGlslSizeFromType(type) {
  if (type === ColorType) {
    return 2;
  }
  if (type === NumberArrayType) {
    return 4;
  }
  return 1;
}

/**
 * @param {number} type Value type
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
 * see https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
 * @param {Object|string} input The hash input, either an object or string
 * @return {string} Hash (if the object cannot be serialized, it is based on `getUid`)
 */
export function computeHash(input) {
  const hash = JSON.stringify(input)
    .split('')
    .reduce((prev, curr) => (prev << 5) - prev + curr.charCodeAt(0), 0);
  return (hash >>> 0).toString();
}

/**
 * @param {import("../style/webgl.js").WebGLStyle} style Style
 * @param {ShaderBuilder} builder Shader builder
 * @param {import("../expr/gpu.js").CompilationContext} vertContext Vertex shader compilation context
 * @param {'shape-'|'circle-'|'icon-'} prefix Properties prefix
 */
function parseCommonSymbolProperties(style, builder, vertContext, prefix) {
  let radius;
  if (`${prefix}radius` in style && prefix !== 'icon-') {
    radius = expressionToGlsl(
      vertContext,
      style[`${prefix}radius`],
      NumberType
    );
  } else if (`${prefix}radius1` in style && prefix === 'shape-') {
    radius = expressionToGlsl(
      vertContext,
      style[`${prefix}radius1`],
      NumberType
    );
  }
  if (radius !== undefined) {
    if (`${prefix}stroke-width` in style) {
      radius = `(${radius} + ${expressionToGlsl(
        vertContext,
        style[`${prefix}stroke-width`],
        NumberType
      )} * 0.5)`;
    }
    builder.setSymbolSizeExpression(`vec2(${radius} * 2. + 0.5)`); // adding some padding for antialiasing
  }
  if (`${prefix}scale` in style) {
    const scale = expressionToGlsl(
      vertContext,
      style[`${prefix}scale`],
      NumberType | NumberArrayType
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
        NumberArrayType
      )
    );
  }
  if (`${prefix}rotation` in style) {
    builder.setSymbolRotationExpression(
      expressionToGlsl(vertContext, style[`${prefix}rotation`], NumberType)
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
 * This will parse an image property provided by `<prefix>-src`
 * The image size expression in GLSL will be returned
 * @param {import("../style/webgl.js").WebGLStyle} style Style
 * @param {ShaderBuilder} builder Shader builder
 * @param {Object<string,import("../webgl/Helper").UniformValue>} uniforms Uniforms
 * @param {'icon-'|'fill-pattern-'|'stroke-pattern-'} prefix Property prefix
 * @param {string} textureId A identifier that will be used in the generated uniforms: `sample2d u_texture<id>` and `vec2 u_texture<id>_size`
 * @return {string} The image size expression
 */
function parseImageProperties(style, builder, uniforms, prefix, textureId) {
  const image = new Image();
  let size;
  image.crossOrigin =
    style[`${prefix}cross-origin`] === undefined
      ? 'anonymous'
      : style[`${prefix}cross-origin`];
  image.src = style[`${prefix}src`];

  if (image.complete && image.width && image.height) {
    size = arrayToGlsl([image.width, image.height]);
  } else {
    // the size is provided asynchronously using a uniform
    uniforms[`u_texture${textureId}_size`] = () => {
      return image.complete ? [image.width, image.height] : [0, 0];
    };
    builder.addUniform(`vec2 u_texture${textureId}_size`);
    size = `u_texture${textureId}_size`;
  }
  uniforms[`u_texture${textureId}`] = image;
  builder.addUniform(`sampler2D u_texture${textureId}`);
  return size;
}

/**
 * This will parse an image's offset properties provided by `<prefix>-offset`, `<prefix>-offset-origin` and `<prefix>-size`
 * @param {import("../style/webgl.js").WebGLStyle} style Style
 * @param {'icon-'|'fill-pattern-'|'stroke-pattern-'} prefix Property prefix
 * @param {import("../expr/gpu.js").CompilationContext} context Shader compilation context (vertex or fragment)
 * @param {string} imageSize Pixel size of the full image as a GLSL expression
 * @param {string} sampleSize Pixel size of the sample in the image as a GLSL expression
 * @return {string} The offset expression
 */
function parseImageOffsetProperties(
  style,
  prefix,
  context,
  imageSize,
  sampleSize
) {
  let offsetExpression = expressionToGlsl(
    context,
    style[`${prefix}offset`],
    NumberArrayType
  );
  if (`${prefix}offset-origin` in style) {
    switch (style[`${prefix}offset-origin`]) {
      case 'top-right':
        offsetExpression = `vec2(${imageSize}.x, 0.) + ${sampleSize} * vec2(-1., 0.) + ${offsetExpression} * vec2(-1., 1.)`;
        break;
      case 'bottom-left':
        offsetExpression = `vec2(0., ${imageSize}.y) + ${sampleSize} * vec2(0., -1.) + ${offsetExpression} * vec2(1., -1.)`;
        break;
      case 'bottom-right':
        offsetExpression = `${imageSize} - ${sampleSize} - ${offsetExpression}`;
        break;
      default: // pass
    }
  }
  return offsetExpression;
}

/**
 * @param {import("../style/webgl.js").WebGLStyle} style Style
 * @param {ShaderBuilder} builder Shader builder
 * @param {Object<string,import("../webgl/Helper").UniformValue>} uniforms Uniforms
 * @param {import("../expr/gpu.js").CompilationContext} vertContext Vertex shader compilation context
 * @param {import("../expr/gpu.js").CompilationContext} fragContext Fragment shader compilation context
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
      NumberType
    );
  }

  // SCALE
  let currentPoint = 'coordsPx';
  if ('circle-scale' in style) {
    const scale = expressionToGlsl(
      fragContext,
      style['circle-scale'],
      NumberType | NumberArrayType
    );
    currentPoint = `coordsPx / ${scale}`;
  }

  // FILL COLOR
  let fillColor = null;
  if ('circle-fill-color' in style) {
    fillColor = expressionToGlsl(
      fragContext,
      style['circle-fill-color'],
      ColorType
    );
  }

  // STROKE COLOR
  let strokeColor = null;
  if ('circle-stroke-color' in style) {
    strokeColor = expressionToGlsl(
      fragContext,
      style['circle-stroke-color'],
      ColorType
    );
  }

  // RADIUS
  let radius = expressionToGlsl(
    fragContext,
    style['circle-radius'],
    NumberType
  );

  // STROKE WIDTH
  let strokeWidth = null;
  if ('circle-stroke-width' in style) {
    strokeWidth = expressionToGlsl(
      fragContext,
      style['circle-stroke-width'],
      NumberType
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
 * @param {import("../style/webgl.js").WebGLStyle} style Style
 * @param {ShaderBuilder} builder Shader builder
 * @param {Object<string,import("../webgl/Helper").UniformValue>} uniforms Uniforms
 * @param {import("../expr/gpu.js").CompilationContext} vertContext Vertex shader compilation context
 * @param {import("../expr/gpu.js").CompilationContext} fragContext Fragment shader compilation context
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
    opacity = expressionToGlsl(fragContext, style['shape-opacity'], NumberType);
  }

  // SCALE
  let currentPoint = 'coordsPx';
  if ('shape-scale' in style) {
    const scale = expressionToGlsl(
      fragContext,
      style['shape-scale'],
      NumberType | NumberArrayType
    );
    currentPoint = `coordsPx / ${scale}`;
  }

  // FILL COLOR
  let fillColor = null;
  if ('shape-fill-color' in style) {
    fillColor = expressionToGlsl(
      fragContext,
      style['shape-fill-color'],
      ColorType
    );
  }

  // STROKE COLOR
  let strokeColor = null;
  if ('shape-stroke-color' in style) {
    strokeColor = expressionToGlsl(
      fragContext,
      style['shape-stroke-color'],
      ColorType
    );
  }

  // STROKE WIDTH
  let strokeWidth = null;
  if ('shape-stroke-width' in style) {
    strokeWidth = expressionToGlsl(
      fragContext,
      style['shape-stroke-width'],
      NumberType
    );
  }

  // SHAPE TYPE
  const numPoints = expressionToGlsl(
    fragContext,
    style['shape-points'],
    NumberType
  );
  let angle = '0.';
  if ('shape-angle' in style) {
    angle = expressionToGlsl(fragContext, style['shape-angle'], NumberType);
  }
  let shapeField;
  if ('shape-radius' in style) {
    let radius = expressionToGlsl(
      fragContext,
      style['shape-radius'],
      NumberType
    );
    if (strokeWidth !== null) {
      radius = `${radius} + ${strokeWidth} * 0.5`;
    }
    shapeField = `regularDistanceField(${currentPoint}, ${numPoints}, ${radius}, ${angle})`;
  } else {
    let radiusOuter = expressionToGlsl(
      fragContext,
      style['shape-radius1'],
      NumberType
    );
    let radiusInner = expressionToGlsl(
      fragContext,
      style['shape-radius2'],
      NumberType
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
 * @param {import("../style/webgl.js").WebGLStyle} style Style
 * @param {ShaderBuilder} builder Shader builder
 * @param {Object<string,import("../webgl/Helper").UniformValue>} uniforms Uniforms
 * @param {import("../expr/gpu.js").CompilationContext} vertContext Vertex shader compilation context
 * @param {import("../expr/gpu.js").CompilationContext} fragContext Fragment shader compilation context
 */
function parseIconProperties(
  style,
  builder,
  uniforms,
  vertContext,
  fragContext
) {
  // COLOR
  let color = 'vec4(1.0)';
  if ('icon-color' in style) {
    color = expressionToGlsl(fragContext, style['icon-color'], ColorType);
  }

  // OPACITY
  if ('icon-opacity' in style) {
    color = `${color} * ${expressionToGlsl(
      fragContext,
      style['icon-opacity'],
      NumberType
    )}`;
  }

  // IMAGE & SIZE
  const textureId = computeHash(style['icon-src']);
  const sizeExpression = parseImageProperties(
    style,
    builder,
    uniforms,
    'icon-',
    textureId
  );
  builder
    .setSymbolColorExpression(
      `${color} * samplePremultiplied(u_texture${textureId}, v_texCoord)`
    )
    .setSymbolSizeExpression(sizeExpression);

  // override size if width/height were specified
  if ('icon-width' in style && 'icon-height' in style) {
    builder.setSymbolSizeExpression(
      `vec2(${expressionToGlsl(
        vertContext,
        style['icon-width'],
        NumberType
      )}, ${expressionToGlsl(vertContext, style['icon-height'], NumberType)})`
    );
  }

  // tex coord
  if ('icon-offset' in style && 'icon-size' in style) {
    const sampleSize = expressionToGlsl(
      vertContext,
      style['icon-size'],
      NumberArrayType
    );
    const fullsize = builder.getSymbolSizeExpression();
    builder.setSymbolSizeExpression(sampleSize);
    const offset = parseImageOffsetProperties(
      style,
      'icon-',
      vertContext,
      'v_quadSizePx',
      sampleSize
    );
    builder.setTextureCoordinateExpression(
      `(vec4((${offset}).xyxy) + vec4(0., 0., ${sampleSize})) / (${fullsize}).xyxy`
    );
  }

  parseCommonSymbolProperties(style, builder, vertContext, 'icon-');

  if ('icon-anchor' in style) {
    const anchor = expressionToGlsl(
      vertContext,
      style['icon-anchor'],
      NumberArrayType
    );
    let scale = `1.0`;
    if (`icon-scale` in style) {
      scale = expressionToGlsl(
        vertContext,
        style[`icon-scale`],
        NumberType | NumberArrayType
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
 * @param {import("../style/webgl.js").WebGLStyle} style Style
 * @param {ShaderBuilder} builder Shader Builder
 * @param {Object<string,import("../webgl/Helper").UniformValue>} uniforms Uniforms
 * @param {import("../expr/gpu.js").CompilationContext} vertContext Vertex shader compilation context
 * @param {import("../expr/gpu.js").CompilationContext} fragContext Fragment shader compilation context
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
      expressionToGlsl(fragContext, style['stroke-color'], ColorType)
    );
  }
  if ('stroke-pattern-src' in style) {
    const textureId = computeHash(style['stroke-pattern-src']);
    const sizeExpression = parseImageProperties(
      style,
      builder,
      uniforms,
      'stroke-pattern-',
      textureId
    );
    let sampleSizeExpression = sizeExpression;
    let offsetExpression = 'vec2(0.)';
    if ('stroke-pattern-offset' in style && 'stroke-pattern-size' in style) {
      sampleSizeExpression = expressionToGlsl(
        fragContext,
        style[`stroke-pattern-size`],
        NumberArrayType
      );
      offsetExpression = parseImageOffsetProperties(
        style,
        'stroke-pattern-',
        fragContext,
        sizeExpression,
        sampleSizeExpression
      );
    }
    let spacingExpression = '0.';
    if ('stroke-pattern-spacing' in style) {
      spacingExpression = expressionToGlsl(
        fragContext,
        style['stroke-pattern-spacing'],
        NumberType
      );
    }
    fragContext.functions[
      'sampleStrokePattern'
    ] = `vec4 sampleStrokePattern(sampler2D texture, vec2 textureSize, vec2 textureOffset, vec2 sampleSize, float spacingPx, float currentLengthPx, float currentRadiusRatio) {
      float currentLengthScaled = currentLengthPx * sampleSize.y / v_width;
      float spacingScaled = spacingPx * sampleSize.y / v_width;
      float uCoordPx = mod(currentLengthScaled, (sampleSize.x + spacingScaled));
      float vCoordPx = (currentRadiusRatio * 0.5 + 0.5) * sampleSize.y;
      vec2 texCoord = (vec2(uCoordPx, vCoordPx) + textureOffset) / textureSize;
      return uCoordPx > sampleSize.x ? vec4(0.) : samplePremultiplied(texture, texCoord);
    }`;
    const textureName = `u_texture${textureId}`;
    let tintExpression = '1.';
    if ('stroke-color' in style) {
      tintExpression = builder.getStrokeColorExpression();
    }
    builder.setStrokeColorExpression(
      `${tintExpression} * sampleStrokePattern(${textureName}, ${sizeExpression}, ${offsetExpression}, ${sampleSizeExpression}, ${spacingExpression}, currentLengthPx, currentRadiusRatio)`
    );
  }

  if ('stroke-width' in style) {
    builder.setStrokeWidthExpression(
      expressionToGlsl(vertContext, style['stroke-width'], NumberType)
    );
  }

  if ('stroke-offset' in style) {
    builder.setStrokeOffsetExpression(
      expressionToGlsl(vertContext, style['stroke-offset'], NumberType)
    );
  }

  if ('stroke-line-cap' in style) {
    builder.setStrokeCapExpression(
      expressionToGlsl(vertContext, style['stroke-line-cap'], StringType)
    );
  }

  if ('stroke-line-join' in style) {
    builder.setStrokeJoinExpression(
      expressionToGlsl(vertContext, style['stroke-line-join'], StringType)
    );
  }

  if ('stroke-miter-limit' in style) {
    builder.setStrokeMiterLimitExpression(
      expressionToGlsl(vertContext, style['stroke-miter-limit'], NumberType)
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
      expressionToGlsl(fragContext, v, NumberType)
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
        NumberType
      );
    }

    // define a function for this dash specifically
    const uniqueDashKey = computeHash(style['stroke-line-dash']);
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
 * @param {import("../style/webgl.js").WebGLStyle} style Style
 * @param {ShaderBuilder} builder Shader Builder
 * @param {Object<string,import("../webgl/Helper").UniformValue>} uniforms Uniforms
 * @param {import("../expr/gpu.js").CompilationContext} vertContext Vertex shader compilation context
 * @param {import("../expr/gpu.js").CompilationContext} fragContext Fragment shader compilation context
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
      expressionToGlsl(fragContext, style['fill-color'], ColorType)
    );
  }
  if ('fill-pattern-src' in style) {
    const textureId = computeHash(style['fill-pattern-src']);
    const sizeExpression = parseImageProperties(
      style,
      builder,
      uniforms,
      'fill-pattern-',
      textureId
    );
    let sampleSizeExpression = sizeExpression;
    let offsetExpression = 'vec2(0.)';
    if ('fill-pattern-offset' in style && 'fill-pattern-size' in style) {
      sampleSizeExpression = expressionToGlsl(
        fragContext,
        style[`fill-pattern-size`],
        NumberArrayType
      );
      offsetExpression = parseImageOffsetProperties(
        style,
        'fill-pattern-',
        fragContext,
        sizeExpression,
        sampleSizeExpression
      );
    }
    fragContext.functions[
      'sampleFillPattern'
    ] = `vec4 sampleFillPattern(sampler2D texture, vec2 textureSize, vec2 textureOffset, vec2 sampleSize, vec2 pxOrigin, vec2 pxPosition) {
  float scaleRatio = pow(2., mod(u_zoom + 0.5, 1.) - 0.5);
  vec2 samplePos = mod((pxPosition - pxOrigin) / scaleRatio, sampleSize);
  samplePos.y = sampleSize.y - samplePos.y; // invert y axis so that images appear upright
  return samplePremultiplied(texture, (samplePos + textureOffset) / textureSize);
}`;
    const textureName = `u_texture${textureId}`;
    let tintExpression = '1.';
    if ('fill-color' in style) {
      tintExpression = builder.getFillColorExpression();
    }
    builder.setFillColorExpression(
      `${tintExpression} * sampleFillPattern(${textureName}, ${sizeExpression}, ${offsetExpression}, ${sampleSizeExpression}, pxOrigin, pxPos)`
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
 * Parses a {@link import("../style/webgl.js").WebGLStyle} object and returns a {@link ShaderBuilder}
 * object that has been configured according to the given style, as well as `attributes` and `uniforms`
 * arrays to be fed to the `WebGLPointsRenderer` class.
 *
 * Also returns `uniforms` and `attributes` properties as expected by the
 * {@link module:ol/renderer/webgl/PointsLayer~WebGLPointsLayerRenderer}.
 *
 * @param {import("../style/webgl.js").WebGLStyle} style Literal style.
 * @return {StyleParseResult} Result containing shader params, attributes and uniforms.
 */
export function parseLiteralStyle(style) {
  /**
   * @type {import("../expr/gpu.js").CompilationContext}
   */
  const vertContext = {
    inFragmentShader: false,
    properties: {},
    variables: {},
    functions: {},
    style,
  };

  /**
   * @type {import("../expr/gpu.js").CompilationContext}
   */
  const fragContext = {
    inFragmentShader: true,
    variables: vertContext.variables,
    properties: {},
    functions: {},
    style,
  };

  const builder = new ShaderBuilder();

  /** @type {Object<string,import("../webgl/Helper").UniformValue>} */
  const uniforms = {};

  if ('icon-src' in style) {
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
      BooleanType
    );
    builder.setFragmentDiscardExpression(`!${parsedFilter}`);
  }

  // define one uniform per variable
  Object.keys(fragContext.variables).forEach(function (varName) {
    const variable = fragContext.variables[varName];
    const uniformName = uniformNameForVariable(variable.name);
    builder.addUniform(`${getGlslTypeFromType(variable.type)} ${uniformName}`);

    let callback;
    if (variable.type === StringType) {
      callback = () =>
        getStringNumberEquivalent(
          /** @type {string} */ (style.variables[variable.name])
        );
    } else if (variable.type === ColorType) {
      callback = () =>
        packColor([
          ...asArray(
            /** @type {string|Array<number>} */ (
              style.variables[variable.name]
            ) || '#eee'
          ),
        ]);
    } else if (variable.type === BooleanType) {
      callback = () =>
        /** @type {boolean} */ (style.variables[variable.name]) ? 1.0 : 0.0;
    } else {
      callback = () => /** @type {number} */ (style.variables[variable.name]);
    }
    uniforms[uniformName] = callback;
  });

  // for each feature attribute used in the fragment shader, define a varying that will be used to pass data
  // from the vertex to the fragment shader, as well as an attribute in the vertex shader (if not already present)
  Object.keys(fragContext.properties).forEach(function (propName) {
    const property = fragContext.properties[propName];
    if (!vertContext.properties[propName]) {
      vertContext.properties[propName] = property;
    }
    let type = getGlslTypeFromType(property.type);
    let expression = `a_prop_${property.name}`;
    if (property.type === ColorType) {
      type = 'vec4';
      expression = `unpackColor(${expression})`;
      builder.addVertexShaderFunction(UNPACK_COLOR_FN);
    }
    builder.addVarying(`v_prop_${property.name}`, type, expression);
  });

  // for each feature attribute used in the vertex shader, define an attribute in the vertex shader.
  Object.keys(vertContext.properties).forEach(function (propName) {
    const property = vertContext.properties[propName];
    builder.addAttribute(
      `${getGlslTypeFromType(property.type)} a_prop_${property.name}`
    );
  });

  const attributes = Object.keys(vertContext.properties).map(function (
    propName
  ) {
    const property = vertContext.properties[propName];
    let callback;
    if (property.evaluator) {
      callback = property.evaluator;
    } else if (property.type === StringType) {
      callback = (feature) =>
        getStringNumberEquivalent(feature.get(property.name));
    } else if (property.type === ColorType) {
      callback = (feature) =>
        packColor([...asArray(feature.get(property.name) || '#eee')]);
    } else if (property.type === BooleanType) {
      callback = (feature) => (feature.get(property.name) ? 1.0 : 0.0);
    } else {
      callback = (feature) => feature.get(property.name);
    }

    return {
      name: property.name,
      size: getGlslSizeFromType(property.type),
      callback,
    };
  });

  // add functions that were collected in the compilation contexts
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
