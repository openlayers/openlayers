/**
 * Utilities for parsing flat styles for WebGL renderers
 * @module ol/render/webgl/style
 */
import {assert} from '../../asserts.js';
import {
  BooleanType,
  ColorType,
  NumberArrayType,
  NumberType,
  SizeType,
  StringType,
  computeGeometryType,
} from '../../expr/expression.js';
import {
  FEATURE_ID_PROPERTY_NAME,
  GEOMETRY_TYPE_PROPERTY_NAME,
  getStringNumberEquivalent,
  newCompilationContext,
  stringToGlsl,
} from '../../expr/gpu.js';
import {ShaderBuilder} from './ShaderBuilder.js';
import {
  applyContextToBuilder,
  expressionToGlsl,
  generateAttributesFromContext,
  generateUniformsFromContext,
  getGlslSizeFromType,
  getGlslTypeFromType,
} from './compileUtil.js';

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
 * @param {import("../../style/flat.js").FlatStyle} style Style
 * @param {ShaderBuilder} builder Shader builder
 * @param {import("../../expr/gpu.js").CompilationContext} vertContext Vertex shader compilation context
 * @param {'shape-'|'circle-'|'icon-'} prefix Properties prefix
 */
function parseCommonSymbolProperties(style, builder, vertContext, prefix) {
  if (`${prefix}radius` in style && prefix !== 'icon-') {
    let radius = expressionToGlsl(
      vertContext,
      style[`${prefix}radius`],
      NumberType,
    );
    if (`${prefix}radius2` in style) {
      const radius2 = expressionToGlsl(
        vertContext,
        style[`${prefix}radius2`],
        NumberType,
      );
      radius = `max(${radius}, ${radius2})`;
    }
    if (`${prefix}stroke-width` in style) {
      radius = `(${radius} + ${expressionToGlsl(
        vertContext,
        style[`${prefix}stroke-width`],
        NumberType,
      )} * 0.5)`;
    }
    builder.setSymbolSizeExpression(`vec2(${radius} * 2. + 0.5)`); // adding some padding for antialiasing
  }
  if (`${prefix}scale` in style) {
    const scale = expressionToGlsl(
      vertContext,
      style[`${prefix}scale`],
      SizeType,
    );
    builder.setSymbolSizeExpression(
      `${builder.getSymbolSizeExpression()} * ${scale}`,
    );
  }
  if (`${prefix}displacement` in style) {
    builder.setSymbolOffsetExpression(
      expressionToGlsl(
        vertContext,
        style[`${prefix}displacement`],
        NumberArrayType,
      ),
    );
  }
  if (`${prefix}rotation` in style) {
    builder.setSymbolRotationExpression(
      expressionToGlsl(vertContext, style[`${prefix}rotation`], NumberType),
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
  opacity,
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
  let result = `${color} * vec4(1.0, 1.0, 1.0, ${shapeOpacity})`;
  if (opacity !== null) {
    result = `${result} * vec4(1.0, 1.0, 1.0, ${opacity})`;
  }
  return result;
}

/**
 * This will parse an image property provided by `<prefix>-src`
 * The image size expression in GLSL will be returned
 * @param {import("../../style/flat.js").FlatStyle} style Style
 * @param {ShaderBuilder} builder Shader builder
 * @param {Object<string,import("../../webgl/Helper").UniformValue>} uniforms Uniforms
 * @param {'icon-'|'fill-pattern-'|'stroke-pattern-'} prefix Property prefix
 * @param {string} textureId A identifier that will be used in the generated uniforms: `sample2d u_texture<id>` and `vec2 u_texture<id>_size`
 * @return {string} The image size expression
 */
function parseImageProperties(style, builder, uniforms, prefix, textureId) {
  const image = new Image();
  image.crossOrigin =
    style[`${prefix}cross-origin`] === undefined
      ? 'anonymous'
      : style[`${prefix}cross-origin`];
  assert(
    typeof style[`${prefix}src`] === 'string',
    `WebGL layers do not support expressions for the ${prefix}src style property`,
  );
  image.src = /** @type {string} */ (style[`${prefix}src`]);

  // the size is provided asynchronously using a uniform
  uniforms[`u_texture${textureId}_size`] = () => {
    return image.complete ? [image.width, image.height] : [0, 0];
  };
  builder.addUniform(`vec2 u_texture${textureId}_size`);
  const size = `u_texture${textureId}_size`;

  uniforms[`u_texture${textureId}`] = image;
  builder.addUniform(`sampler2D u_texture${textureId}`);
  return size;
}

/**
 * This will parse an image's offset properties provided by `<prefix>-offset`, `<prefix>-offset-origin` and `<prefix>-size`
 * @param {import("../../style/flat.js").FlatStyle} style Style
 * @param {'icon-'|'fill-pattern-'|'stroke-pattern-'} prefix Property prefix
 * @param {import("../../expr/gpu.js").CompilationContext} context Shader compilation context (vertex or fragment)
 * @param {string} imageSize Pixel size of the full image as a GLSL expression
 * @param {string} sampleSize Pixel size of the sample in the image as a GLSL expression
 * @return {string} The offset expression
 */
function parseImageOffsetProperties(
  style,
  prefix,
  context,
  imageSize,
  sampleSize,
) {
  let offsetExpression = expressionToGlsl(
    context,
    style[`${prefix}offset`],
    NumberArrayType,
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
 * @param {import("../../style/flat.js").FlatStyle} style Style
 * @param {ShaderBuilder} builder Shader builder
 * @param {Object<string,import("../../webgl/Helper").UniformValue>} uniforms Uniforms
 * @param {import("../../expr/gpu.js").CompilationContext} context Shader compilation context
 */
function parseCircleProperties(style, builder, uniforms, context) {
  // this function takes in screen coordinates in pixels and returns the signed distance field
  // (0 on the boundary, negative inside the circle, positive outside, values in pixels)
  context.functions['circleDistanceField'] =
    `float circleDistanceField(vec2 point, float radius) {
  return length(point) - radius;
}`;

  parseCommonSymbolProperties(style, builder, context, 'circle-');

  // OPACITY
  let opacity = null;
  if ('circle-opacity' in style) {
    opacity = expressionToGlsl(context, style['circle-opacity'], NumberType);
  }

  // SCALE
  let currentPoint = 'coordsPx';
  if ('circle-scale' in style) {
    const scale = expressionToGlsl(context, style['circle-scale'], SizeType);
    currentPoint = `coordsPx / ${scale}`;
  }

  // FILL COLOR
  let fillColor = null;
  if ('circle-fill-color' in style) {
    fillColor = expressionToGlsl(
      context,
      style['circle-fill-color'],
      ColorType,
    );
  }

  // STROKE COLOR
  let strokeColor = null;
  if ('circle-stroke-color' in style) {
    strokeColor = expressionToGlsl(
      context,
      style['circle-stroke-color'],
      ColorType,
    );
  }

  // RADIUS
  let radius = expressionToGlsl(context, style['circle-radius'], NumberType);

  // STROKE WIDTH
  let strokeWidth = null;
  if ('circle-stroke-width' in style) {
    strokeWidth = expressionToGlsl(
      context,
      style['circle-stroke-width'],
      NumberType,
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
    opacity,
  );
  builder.setSymbolColorExpression(colorExpression);
}

/**
 * @param {import("../../style/flat.js").FlatStyle} style Style
 * @param {ShaderBuilder} builder Shader builder
 * @param {Object<string,import("../../webgl/Helper").UniformValue>} uniforms Uniforms
 * @param {import("../../expr/gpu.js").CompilationContext} context Shader compilation context
 */
function parseShapeProperties(style, builder, uniforms, context) {
  context.functions['round'] = `float round(float v) {
  return sign(v) * floor(abs(v) + 0.5);
}`;

  // these functions take in screen coordinates in pixels and returns the signed distance field
  // (0 on the boundary, negative inside the polygon, positive outside, values in pixels)
  // inspired by https://github.com/zranger1/PixelblazePatterns/blob/master/Toolkit/sdf2d.md#n-sided-regular-polygon
  context.functions['starDistanceField'] =
    `float starDistanceField(vec2 point, float numPoints, float radius, float radius2, float angle) {
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
  vec2 tipToPoint = inSector + vec2(-radius, 0.);
  vec2 edgeNormal = vec2(radius2 * sin(alpha * 0.5), -radius2 * cos(alpha * 0.5) + radius);
  return dot(normalize(edgeNormal), tipToPoint);
}`;
  context.functions['regularDistanceField'] =
    `float regularDistanceField(vec2 point, float numPoints, float radius, float angle) {
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

  parseCommonSymbolProperties(style, builder, context, 'shape-');

  // OPACITY
  let opacity = null;
  if ('shape-opacity' in style) {
    opacity = expressionToGlsl(context, style['shape-opacity'], NumberType);
  }

  // SCALE
  let currentPoint = 'coordsPx';
  if ('shape-scale' in style) {
    const scale = expressionToGlsl(context, style['shape-scale'], SizeType);
    currentPoint = `coordsPx / ${scale}`;
  }

  // FILL COLOR
  let fillColor = null;
  if ('shape-fill-color' in style) {
    fillColor = expressionToGlsl(context, style['shape-fill-color'], ColorType);
  }

  // STROKE COLOR
  let strokeColor = null;
  if ('shape-stroke-color' in style) {
    strokeColor = expressionToGlsl(
      context,
      style['shape-stroke-color'],
      ColorType,
    );
  }

  // STROKE WIDTH
  let strokeWidth = null;
  if ('shape-stroke-width' in style) {
    strokeWidth = expressionToGlsl(
      context,
      style['shape-stroke-width'],
      NumberType,
    );
  }

  // SHAPE TYPE
  const numPoints = expressionToGlsl(
    context,
    style['shape-points'],
    NumberType,
  );
  let angle = '0.';
  if ('shape-angle' in style) {
    angle = expressionToGlsl(context, style['shape-angle'], NumberType);
  }
  let shapeField;
  let radius = expressionToGlsl(context, style['shape-radius'], NumberType);
  if (strokeWidth !== null) {
    radius = `${radius} + ${strokeWidth} * 0.5`;
  }
  if ('shape-radius2' in style) {
    let radius2 = expressionToGlsl(context, style['shape-radius2'], NumberType);
    if (strokeWidth !== null) {
      radius2 = `${radius2} + ${strokeWidth} * 0.5`;
    }
    shapeField = `starDistanceField(${currentPoint}, ${numPoints}, ${radius}, ${radius2}, ${angle})`;
  } else {
    shapeField = `regularDistanceField(${currentPoint}, ${numPoints}, ${radius}, ${angle})`;
  }

  // FINAL COLOR
  const colorExpression = getColorFromDistanceField(
    shapeField,
    fillColor,
    strokeColor,
    strokeWidth,
    opacity,
  );
  builder.setSymbolColorExpression(colorExpression);
}

/**
 * @param {import("../../style/flat.js").FlatStyle} style Style
 * @param {ShaderBuilder} builder Shader builder
 * @param {Object<string,import("../../webgl/Helper").UniformValue>} uniforms Uniforms
 * @param {import("../../expr/gpu.js").CompilationContext} context Shader compilation context
 */
function parseIconProperties(style, builder, uniforms, context) {
  // COLOR
  let color = 'vec4(1.0)';
  if ('icon-color' in style) {
    color = expressionToGlsl(context, style['icon-color'], ColorType);
  }

  // OPACITY
  if ('icon-opacity' in style) {
    color = `${color} * vec4(1.0, 1.0, 1.0, ${expressionToGlsl(
      context,
      style['icon-opacity'],
      NumberType,
    )})`;
  }

  // IMAGE & SIZE
  const textureId = computeHash(style['icon-src']);
  const sizeExpression = parseImageProperties(
    style,
    builder,
    uniforms,
    'icon-',
    textureId,
  );
  builder
    .setSymbolColorExpression(
      `${color} * texture2D(u_texture${textureId}, v_texCoord)`,
    )
    .setSymbolSizeExpression(sizeExpression);

  // override size if width/height were specified
  if ('icon-width' in style && 'icon-height' in style) {
    builder.setSymbolSizeExpression(
      `vec2(${expressionToGlsl(
        context,
        style['icon-width'],
        NumberType,
      )}, ${expressionToGlsl(context, style['icon-height'], NumberType)})`,
    );
  }

  // tex coord
  if ('icon-offset' in style && 'icon-size' in style) {
    const sampleSize = expressionToGlsl(
      context,
      style['icon-size'],
      NumberArrayType,
    );
    const fullsize = builder.getSymbolSizeExpression();
    builder.setSymbolSizeExpression(sampleSize);
    const offset = parseImageOffsetProperties(
      style,
      'icon-',
      context,
      'v_quadSizePx',
      sampleSize,
    );
    builder.setTextureCoordinateExpression(
      `(vec4((${offset}).xyxy) + vec4(0., 0., ${sampleSize})) / (${fullsize}).xyxy`,
    );
  }

  parseCommonSymbolProperties(style, builder, context, 'icon-');

  if ('icon-anchor' in style) {
    const anchor = expressionToGlsl(
      context,
      style['icon-anchor'],
      NumberArrayType,
    );
    let scale = `1.0`;
    if (`icon-scale` in style) {
      scale = expressionToGlsl(context, style[`icon-scale`], SizeType);
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
      `${builder.getSymbolOffsetExpression()} + ${offsetPx}`,
    );
  }
}

/**
 * @param {import("../../style/flat.js").FlatStyle} style Style
 * @param {ShaderBuilder} builder Shader Builder
 * @param {Object<string,import("../../webgl/Helper").UniformValue>} uniforms Uniforms
 * @param {import("../../expr/gpu.js").CompilationContext} context Shader compilation context
 */
function parseStrokeProperties(style, builder, uniforms, context) {
  if ('stroke-color' in style) {
    builder.setStrokeColorExpression(
      expressionToGlsl(context, style['stroke-color'], ColorType),
    );
  }
  if ('stroke-pattern-src' in style) {
    const textureId = computeHash(style['stroke-pattern-src']);
    const sizeExpression = parseImageProperties(
      style,
      builder,
      uniforms,
      'stroke-pattern-',
      textureId,
    );
    let sampleSizeExpression = sizeExpression;
    let offsetExpression = 'vec2(0.)';
    if ('stroke-pattern-offset' in style && 'stroke-pattern-size' in style) {
      sampleSizeExpression = expressionToGlsl(
        context,
        style[`stroke-pattern-size`],
        NumberArrayType,
      );
      offsetExpression = parseImageOffsetProperties(
        style,
        'stroke-pattern-',
        context,
        sizeExpression,
        sampleSizeExpression,
      );
    }
    let spacingExpression = '0.';
    if ('stroke-pattern-spacing' in style) {
      spacingExpression = expressionToGlsl(
        context,
        style['stroke-pattern-spacing'],
        NumberType,
      );
    }
    context.functions['sampleStrokePattern'] =
      `vec4 sampleStrokePattern(sampler2D texture, vec2 textureSize, vec2 textureOffset, vec2 sampleSize, float spacingPx, float currentLengthPx, float currentRadiusRatio, float lineWidth) {
  float currentLengthScaled = currentLengthPx * sampleSize.y / lineWidth;
  float spacingScaled = spacingPx * sampleSize.y / lineWidth;
  float uCoordPx = mod(currentLengthScaled, (sampleSize.x + spacingScaled));
  // make sure that we're not sampling too close to the borders to avoid interpolation with outside pixels
  uCoordPx = clamp(uCoordPx, 0.5, sampleSize.x - 0.5);
  float vCoordPx = (-currentRadiusRatio * 0.5 + 0.5) * sampleSize.y;
  vec2 texCoord = (vec2(uCoordPx, vCoordPx) + textureOffset) / textureSize;
  return texture2D(texture, texCoord);
}`;
    const textureName = `u_texture${textureId}`;
    let tintExpression = '1.';
    if ('stroke-color' in style) {
      tintExpression = builder.getStrokeColorExpression();
    }
    builder.setStrokeColorExpression(
      `${tintExpression} * sampleStrokePattern(${textureName}, ${sizeExpression}, ${offsetExpression}, ${sampleSizeExpression}, ${spacingExpression}, currentLengthPx, currentRadiusRatio, v_width)`,
    );
  }

  if ('stroke-width' in style) {
    builder.setStrokeWidthExpression(
      expressionToGlsl(context, style['stroke-width'], NumberType),
    );
  }

  if ('stroke-offset' in style) {
    builder.setStrokeOffsetExpression(
      expressionToGlsl(context, style['stroke-offset'], NumberType),
    );
  }

  if ('stroke-line-cap' in style) {
    builder.setStrokeCapExpression(
      expressionToGlsl(context, style['stroke-line-cap'], StringType),
    );
  }

  if ('stroke-line-join' in style) {
    builder.setStrokeJoinExpression(
      expressionToGlsl(context, style['stroke-line-join'], StringType),
    );
  }

  if ('stroke-miter-limit' in style) {
    builder.setStrokeMiterLimitExpression(
      expressionToGlsl(context, style['stroke-miter-limit'], NumberType),
    );
  }

  if ('stroke-line-dash' in style) {
    context.functions['getSingleDashDistance'] =
      `float getSingleDashDistance(float distance, float radius, float dashOffset, float dashLength, float dashLengthTotal, float capType, float lineWidth) {
  float localDistance = mod(distance, dashLengthTotal);
  float distanceSegment = abs(localDistance - dashOffset - dashLength * 0.5) - dashLength * 0.5;
  distanceSegment = min(distanceSegment, dashLengthTotal - localDistance);
  if (capType == ${stringToGlsl('square')}) {
    distanceSegment -= lineWidth * 0.5;
  } else if (capType == ${stringToGlsl('round')}) {
    distanceSegment = min(distanceSegment, sqrt(distanceSegment * distanceSegment + radius * radius) - lineWidth * 0.5);
  }
  return distanceSegment;
}`;

    let dashPattern = style['stroke-line-dash'].map((v) =>
      expressionToGlsl(context, v, NumberType),
    );
    // if pattern has odd length, concatenate it with itself to be even
    if (dashPattern.length % 2 === 1) {
      dashPattern = [...dashPattern, ...dashPattern];
    }

    let offsetExpression = '0.';
    if ('stroke-line-dash-offset' in style) {
      offsetExpression = expressionToGlsl(
        context,
        style['stroke-line-dash-offset'],
        NumberType,
      );
    }

    // define a function for this dash specifically
    const uniqueDashKey = computeHash(style['stroke-line-dash']);
    const dashFunctionName = `dashDistanceField_${uniqueDashKey}`;

    const dashLengthsDef = dashPattern.map(
      (v, i) => `float dashLength${i} = ${v};`,
    );
    const totalLengthDef = dashPattern
      .map((v, i) => `dashLength${i}`)
      .join(' + ');
    let currentDashOffset = '0.';
    let distanceExpression = `getSingleDashDistance(distance, radius, ${currentDashOffset}, dashLength0, totalDashLength, capType, lineWidth)`;
    for (let i = 2; i < dashPattern.length; i += 2) {
      currentDashOffset = `${currentDashOffset} + dashLength${
        i - 2
      } + dashLength${i - 1}`;
      distanceExpression = `min(${distanceExpression}, getSingleDashDistance(distance, radius, ${currentDashOffset}, dashLength${i}, totalDashLength, capType, lineWidth))`;
    }

    context.functions[dashFunctionName] =
      `float ${dashFunctionName}(float distance, float radius, float capType, float lineWidth) {
  ${dashLengthsDef.join('\n  ')}
  float totalDashLength = ${totalLengthDef};
  return ${distanceExpression};
}`;
    builder.setStrokeDistanceFieldExpression(
      `${dashFunctionName}(currentLengthPx + ${offsetExpression}, currentRadiusPx, capType, v_width)`,
    );
  }
}

/**
 * @param {import("../../style/flat.js").FlatStyle} style Style
 * @param {ShaderBuilder} builder Shader Builder
 * @param {Object<string,import("../../webgl/Helper").UniformValue>} uniforms Uniforms
 * @param {import("../../expr/gpu.js").CompilationContext} context Shader compilation context
 */
function parseFillProperties(style, builder, uniforms, context) {
  if ('fill-color' in style) {
    builder.setFillColorExpression(
      expressionToGlsl(context, style['fill-color'], ColorType),
    );
  }
  if ('fill-pattern-src' in style) {
    const textureId = computeHash(style['fill-pattern-src']);
    const sizeExpression = parseImageProperties(
      style,
      builder,
      uniforms,
      'fill-pattern-',
      textureId,
    );
    let sampleSizeExpression = sizeExpression;
    let offsetExpression = 'vec2(0.)';
    if ('fill-pattern-offset' in style && 'fill-pattern-size' in style) {
      sampleSizeExpression = expressionToGlsl(
        context,
        style[`fill-pattern-size`],
        NumberArrayType,
      );
      offsetExpression = parseImageOffsetProperties(
        style,
        'fill-pattern-',
        context,
        sizeExpression,
        sampleSizeExpression,
      );
    }
    context.functions['sampleFillPattern'] =
      `vec4 sampleFillPattern(sampler2D texture, vec2 textureSize, vec2 textureOffset, vec2 sampleSize, vec2 pxOrigin, vec2 pxPosition) {
  float scaleRatio = pow(2., mod(u_zoom + 0.5, 1.) - 0.5);
  vec2 pxRelativePos = pxPosition - pxOrigin;
  // rotate the relative position from origin by the current view rotation
  pxRelativePos = vec2(pxRelativePos.x * cos(u_rotation) - pxRelativePos.y * sin(u_rotation), pxRelativePos.x * sin(u_rotation) + pxRelativePos.y * cos(u_rotation));
  // sample position is computed according to the sample offset & size
  vec2 samplePos = mod(pxRelativePos / scaleRatio, sampleSize);
  // also make sure that we're not sampling too close to the borders to avoid interpolation with outside pixels
  samplePos = clamp(samplePos, vec2(0.5), sampleSize - vec2(0.5));
  samplePos.y = sampleSize.y - samplePos.y; // invert y axis so that images appear upright
  return texture2D(texture, (samplePos + textureOffset) / textureSize);
}`;
    const textureName = `u_texture${textureId}`;
    let tintExpression = '1.';
    if ('fill-color' in style) {
      tintExpression = builder.getFillColorExpression();
    }
    builder.setFillColorExpression(
      `${tintExpression} * sampleFillPattern(${textureName}, ${sizeExpression}, ${offsetExpression}, ${sampleSizeExpression}, pxOrigin, pxPos)`,
    );
  }
}

/**
 * @typedef {Object} StyleParseResult
 * @property {ShaderBuilder} builder Shader builder pre-configured according to a given style
 * @property {import("./VectorStyleRenderer.js").UniformDefinitions} uniforms Uniform definitions
 * @property {import("./VectorStyleRenderer.js").AttributeDefinitions} attributes Attribute definitions
 */

/**
 * Parses a {@link import("../../style/flat.js").FlatStyle} object and returns a {@link ShaderBuilder}
 * object that has been configured according to the given style, as well as `attributes` and `uniforms`
 * arrays to be fed to the `WebGLPointsRenderer` class.
 *
 * Also returns `uniforms` and `attributes` properties as expected by the
 * {@link module:ol/renderer/webgl/PointsLayer~WebGLPointsLayerRenderer}.
 *
 * @param {import("../../style/flat.js").FlatStyle} style Flat style.
 * @param {import('../../style/flat.js').StyleVariables} [variables] Style variables.
 * @param {import("../../expr/expression.js").EncodedExpression} [filter] Filter (if any)
 * @return {StyleParseResult} Result containing shader params, attributes and uniforms.
 */
export function parseLiteralStyle(style, variables, filter) {
  const context = newCompilationContext();

  const builder = new ShaderBuilder();

  /** @type {Object<string,import("../../webgl/Helper").UniformValue>} */
  const uniforms = {};

  if ('icon-src' in style) {
    parseIconProperties(style, builder, uniforms, context);
  } else if ('shape-points' in style) {
    parseShapeProperties(style, builder, uniforms, context);
  } else if ('circle-radius' in style) {
    parseCircleProperties(style, builder, uniforms, context);
  }
  parseStrokeProperties(style, builder, uniforms, context);
  parseFillProperties(style, builder, uniforms, context);

  // note that the style filter may have already been applied earlier when building the rendering instructions
  // this is still needed in case a filter cannot be evaluated statically beforehand (e.g. depending on time)
  if (filter) {
    const parsedFilter = expressionToGlsl(context, filter, BooleanType);
    builder.setFragmentDiscardExpression(`!${parsedFilter}`);
  }

  /**
   * @type {import('./VectorStyleRenderer.js').AttributeDefinitions}
   */
  const attributes = {};

  // Define attributes for special inputs
  function defineSpecialInput(contextPropName, glslPropName, type, callback) {
    if (!context[contextPropName]) {
      return;
    }
    const glslType = getGlslTypeFromType(type);
    const attrSize = getGlslSizeFromType(type);
    builder.addAttribute(`a_${glslPropName}`, glslType);

    attributes[glslPropName] = {
      size: attrSize,
      callback,
    };
  }
  defineSpecialInput(
    'geometryType',
    GEOMETRY_TYPE_PROPERTY_NAME,
    StringType,
    (feature) =>
      getStringNumberEquivalent(computeGeometryType(feature.getGeometry())),
  );
  defineSpecialInput(
    'featureId',
    FEATURE_ID_PROPERTY_NAME,
    StringType | NumberType,
    (feature) => {
      const id = feature.getId() ?? null;
      return typeof id === 'string' ? getStringNumberEquivalent(id) : id;
    },
  );

  applyContextToBuilder(builder, context);

  return {
    builder,
    attributes: {...attributes, ...generateAttributesFromContext(context)},
    uniforms: {
      ...uniforms,
      ...generateUniformsFromContext(context, variables),
    },
  };
}

/**
 * @typedef {import('./VectorStyleRenderer.js').AsShaders} StyleAsShaders
 */
/**
 * @typedef {import('./VectorStyleRenderer.js').AsRule} StyleAsRule
 */

/**
 * Takes in either a Flat Style or an array of shaders (used as input for the webgl vector layer classes)
 * and breaks it down into separate styles to be used by the VectorStyleRenderer class.
 * @param {import('../../style/flat.js').FlatStyleLike | Array<StyleAsShaders> | StyleAsShaders} style Flat style or shaders
 * @return {Array<StyleAsShaders | StyleAsRule>} Separate styles as shaders or rules with a single flat style and a filter
 */
export function breakDownFlatStyle(style) {
  // possible cases:
  // - single shader
  // - multiple shaders
  // - single style
  // - multiple styles
  // - multiple rules
  const asArray = Array.isArray(style) ? style : [style];

  // if array of rules: break rules into separate styles, compute "else" filters
  if ('style' in asArray[0]) {
    /** @type {Array<StyleAsRule>} */
    const styles = [];
    const rules = /** @type {Array<import('../../style/flat.js').Rule>} */ (
      asArray
    );
    const previousFilters = [];
    for (const rule of rules) {
      const ruleStyles = Array.isArray(rule.style) ? rule.style : [rule.style];
      /** @type {import("../../expr/expression.js").EncodedExpression} */
      let currentFilter = rule.filter;
      if (rule.else && previousFilters.length) {
        currentFilter = [
          'all',
          ...previousFilters.map((filter) => ['!', filter]),
        ];
        if (rule.filter) {
          currentFilter.push(rule.filter);
        }
        if (currentFilter.length < 3) {
          currentFilter = currentFilter[1];
        }
      }
      if (rule.filter) {
        previousFilters.push(rule.filter);
      }
      /** @type {Array<StyleAsRule>} */
      const stylesWithFilters = ruleStyles.map((style) => ({
        style,
        ...(currentFilter && {filter: currentFilter}),
      }));
      styles.push(...stylesWithFilters);
    }
    return styles;
  }

  // if array of shaders: return as is
  if ('builder' in asArray[0]) {
    return /** @type {Array<StyleAsShaders>} */ (asArray);
  }

  return asArray.map(
    (style) =>
      /** @type {StyleAsRule} */ ({
        style,
      }),
  );
}
