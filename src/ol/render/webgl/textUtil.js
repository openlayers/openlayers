/**
 * @module ol/render/webgl/textUtil
 */
import {ColorType, StringType} from '../../expr/expression.js';
import LineString from '../../geom/LineString.js';
import Point from '../../geom/Point.js';
import Polygon from '../../geom/Polygon.js';
import {
  create as createMat4,
  reset as resetMat4,
  rotate as rotateMat4,
  scale as scaleMat4,
  translate as translateMat4,
} from '../../vec/mat4.js';
import RenderFeature from '../Feature.js';
import {unpackColor} from './compileUtil.js';

export const Uniforms = {
  TEXT_OVERLAY_TEXTURE: 'u_textOverlay',
  TEXT_OVERLAY_MATRIX: 'u_textOverlayMatrix',
};

/**
 * @param {import('../../style/flat.js').FlatStyleLike} style Single flat style
 * @return {import('../../style/flat.js').FlatStyleLike} Style with text-related properties only;
 * NOTE: THIS MUTATES THE OBJECT
 */
export function stripNonTextStyleProperties(style) {
  function stripStyle(style) {
    for (const prop in style) {
      if (!prop.startsWith('text-')) {
        delete style[prop];
      }
    }
  }
  if (Array.isArray(style)) {
    for (let i = 0, ii = style.length; i < ii; i++) {
      const rule = style[i];
      if ('style' in rule) {
        stripStyle(rule.style);
      } else {
        stripStyle(rule);
      }
    }
    return style;
  }
  stripStyle(style);
  return style;
}

/**
 * @param {function(): HTMLCanvasElement} textOverlayCanvasGetter Function that returns the canvas where the text overlay was rendered
 * @param {function(): import('../../Map.js').FrameState} textOverlayFrameStateGetter Function that returns the frame state used for rendering the text overlay
 * @return {import("../../renderer/webgl/Layer.js").PostProcessesOptions} Post-process definition for text rendering
 */
export function createPostProcessDefinition(
  textOverlayCanvasGetter,
  textOverlayFrameStateGetter,
) {
  const tmpMatrix = createMat4();
  return {
    fragmentShader: `
      precision mediump float;
    
      uniform sampler2D u_image;
      uniform sampler2D ${Uniforms.TEXT_OVERLAY_TEXTURE};
      uniform mat4 ${Uniforms.TEXT_OVERLAY_MATRIX};
      
      varying vec2 v_texCoord;
    
      void main() {
        vec4 color = texture2D(u_image, v_texCoord);
    
        vec2 coords = v_texCoord * 2. - vec2(1.);
        coords = (${Uniforms.TEXT_OVERLAY_MATRIX} * vec4(coords.xy, 0., 1.)).xy;
        coords = coords * 0.5 + vec2(0.5);
        float outOfBounds = clamp(step(1., coords.x) + step(1., coords.y) + step(0., -coords.x) + step(0., -coords.y), 0., 1.);
    
        vec4 textColor = texture2D(${Uniforms.TEXT_OVERLAY_TEXTURE}, vec2(coords.x, 1. - coords.y));
        textColor.a *= 1. - outOfBounds; // if we're sampling out of the text overlay, make alpha 0 to avoid drawing anything

        gl_FragColor = textColor.a * textColor + (1. - textColor.a) * color;
      }`,
    uniforms: {
      [Uniforms.TEXT_OVERLAY_TEXTURE]: textOverlayCanvasGetter,
      [Uniforms.TEXT_OVERLAY_MATRIX]: (frameState) => {
        const textOverlayCanvas = textOverlayCanvasGetter();
        const textOverlayFrameState = textOverlayFrameStateGetter();
        if (!textOverlayCanvas || !textOverlayFrameState) {
          return tmpMatrix;
        }
        const textOverlayViewState = textOverlayFrameState.viewState;
        const viewState = frameState.viewState;
        const center = viewState.center;
        const resolution = viewState.resolution;
        const rotation = viewState.rotation;
        const size = frameState.size;
        const renderedCenter = textOverlayViewState.center;
        const renderedResolution = textOverlayViewState.resolution;
        const renderedWidth = textOverlayCanvas.width;
        const renderedHeight = textOverlayCanvas.height;
        resetMat4(tmpMatrix);
        translateMat4(
          tmpMatrix,
          (center[0] - renderedCenter[0]) /
            renderedResolution /
            (renderedWidth / 2),
          (center[1] - renderedCenter[1]) /
            renderedResolution /
            (renderedHeight / 2),
          0,
          tmpMatrix,
        );
        scaleMat4(
          tmpMatrix,
          1 / renderedWidth,
          1 / renderedHeight,
          1,
          tmpMatrix,
        );
        rotateMat4(tmpMatrix, -rotation, tmpMatrix);
        scaleMat4(tmpMatrix, size[0], size[1], 1, tmpMatrix);
        scaleMat4(
          tmpMatrix,
          resolution / renderedResolution,
          resolution / renderedResolution,
          1,
          tmpMatrix,
        );
        return tmpMatrix;
      },
    },
  };
}

const textFeatureProps = {};
const textFeature = new RenderFeature(
  'Point', // the feature holds a simple placeholder geometry
  [0, 0],
  [],
  2,
  textFeatureProps,
  'dummy',
);

const textDecoder = new TextDecoder();

function readCustomAttributeValue(
  propertyName,
  propertyType,
  customAttributesKeys,
  customAttributesSizes,
  customAttributesValues,
  labels,
) {
  const customAttrName = `prop_${propertyName}`;
  const customAttrPosition = customAttributesKeys.findIndex(
    (key) => key === customAttrName,
  );
  const customAttrOffset = customAttributesKeys
    .slice(0, customAttrPosition)
    .reduce((prev, curr) => prev + customAttributesSizes[curr], 0);
  const customAttrSize = customAttributesSizes[customAttrName];

  if (propertyType === StringType) {
    const start = customAttributesValues[customAttrOffset + 1];
    const length = customAttributesValues[customAttrOffset + 2];
    const bytes = labels.slice(start, start + length);
    return textDecoder.decode(bytes);
  }
  if (propertyType === ColorType) {
    const value = unpackColor(
      Array.from(
        customAttributesValues.slice(customAttrOffset, customAttrOffset + 2),
      ),
    );
    value[0] *= 255;
    value[1] *= 255;
    value[2] *= 255;
    return value;
  }
  if (customAttrSize > 1) {
    return Array.from(
      customAttributesValues.slice(
        customAttrOffset,
        customAttrOffset + customAttrSize,
      ),
    );
  }
  return customAttributesValues[customAttrOffset];
}

function drawTextGeometry(
  styleFunction,
  textBuilder,
  feature,
  geometry,
  sharedData,
) {
  let styles = styleFunction(feature, 1);
  if (!styles) {
    return;
  }
  styles = Array.isArray(styles) ? styles : [styles];
  for (let i = 0, ii = styles.length; i < ii; i++) {
    const textStyle = styles[i].getText();
    if (!textStyle) {
      continue;
    }
    textBuilder.setTextStyle(textStyle, sharedData);
    textBuilder.drawText(geometry, feature);
  }
}

/**
 * Pushes several triangles to form a polygon, including holes
 * @param {Float32Array} renderInstructions Array of render instructions for lines.
 * @param {Uint8Array} labels Integer array containing encoded labels
 * @param {Map<string,import('../../expr/expression.js').ValueType>} properties Custom attributes
 * @param {Record<string, number>} customAttributesSizes Custom attributes sizes
 * @param {import('../canvas/TextBuilder.js').default} textBuilder Text builder
 * @param {import('../../style/Style.js').StyleFunction} styleFunction Text style
 * @private
 */
export function convertPolygonRenderInstructionsToCanvasTextBuilder(
  renderInstructions,
  labels,
  properties,
  customAttributesSizes,
  textBuilder,
  styleFunction,
) {
  const customAttributesKeys = Object.keys(customAttributesSizes);
  const totalCustomAttributesSize = customAttributesKeys.reduce(
    (prev, curr) => prev + customAttributesSizes[curr],
    0,
  );
  const instructionsPerVertex = 2; // x, y
  const sharedData = {};

  let instructionsIndex = 0;
  while (instructionsIndex < renderInstructions.length) {
    const customAttributesValues = new Float32Array(
      renderInstructions.buffer,
      instructionsIndex * Float32Array.BYTES_PER_ELEMENT,
      totalCustomAttributesSize,
    );
    instructionsIndex += totalCustomAttributesSize;
    const ringsCount = renderInstructions[instructionsIndex++];
    let verticesCount = 0;
    const ends = new Array(ringsCount - 1);
    for (let i = 0; i < ringsCount; i++) {
      verticesCount += renderInstructions[instructionsIndex++];
      if (i < ringsCount - 1) {
        ends[i] = verticesCount;
      }
    }
    const newInstructionsIndex =
      instructionsIndex + verticesCount * instructionsPerVertex;

    const flatCoords = Array.from(
      new Float32Array(
        renderInstructions.buffer,
        instructionsIndex * Float32Array.BYTES_PER_ELEMENT,
        verticesCount * instructionsPerVertex,
      ),
    );
    const polygon = new Polygon(flatCoords, 'XY', ends);
    const propEntries = Array.from(properties.entries());
    for (let i = 0; i < propEntries.length; i++) {
      const [propName, propType] = propEntries[i];
      textFeatureProps[propName] = readCustomAttributeValue(
        propName,
        propType,
        customAttributesKeys,
        customAttributesSizes,
        customAttributesValues,
        labels,
      );
    }
    // console.log(textFeatureProps);

    drawTextGeometry(
      styleFunction,
      textBuilder,
      textFeature,
      polygon,
      sharedData,
    );

    instructionsIndex = newInstructionsIndex;
  }
}

/**
 * Pushes several triangles to form a polygon, including holes
 * @param {Float32Array} renderInstructions Array of render instructions for lines.
 * @param {import('../../transform.js').Transform} renderInstructionsTransform Transform applied to render instructions
 * @param {Uint8Array} labels Integer array containing encoded labels
 * @param {Map<string,import('../../expr/expression.js').ValueType>} properties Custom attributes
 * @param {Record<string, number>} customAttributesSizes Custom attributes sizes
 * @param {import('../canvas/TextBuilder.js').default} textBuilder Text builder
 * @param {import('../../style/Style.js').StyleFunction} styleFunction Text style
 * @private
 */
export function convertLineStringRenderInstructionsToCanvasTextBuilder(
  renderInstructions,
  renderInstructionsTransform,
  labels,
  properties,
  customAttributesSizes,
  textBuilder,
  styleFunction,
) {
  const customAttributesKeys = Object.keys(customAttributesSizes);
  const totalCustomAttributesSize = customAttributesKeys.reduce(
    (prev, curr) => prev + customAttributesSizes[curr],
    0,
  );
  const instructionsPerVertex = 3; // x, y
  const sharedData = {};

  let currentInstructionsIndex = 0;

  let verticesCount;
  while (currentInstructionsIndex < renderInstructions.length) {
    const customAttributesValues = new Float32Array(
      renderInstructions.buffer,
      currentInstructionsIndex * Float32Array.BYTES_PER_ELEMENT,
      totalCustomAttributesSize,
    );
    currentInstructionsIndex += totalCustomAttributesSize;

    verticesCount = renderInstructions[currentInstructionsIndex++];

    const flatCoords = Array.from(
      new Float32Array(
        renderInstructions.buffer,
        currentInstructionsIndex * Float32Array.BYTES_PER_ELEMENT,
        verticesCount * instructionsPerVertex,
      ),
    );

    const lineString = new LineString(flatCoords, 'XYM'); // render instructions always provide XYM coordinates
    const propEntries = Array.from(properties.entries());
    for (let i = 0; i < propEntries.length; i++) {
      const [propName, propType] = propEntries[i];
      textFeatureProps[propName] = readCustomAttributeValue(
        propName,
        propType,
        customAttributesKeys,
        customAttributesSizes,
        customAttributesValues,
        labels,
      );
    }
    // console.log(textFeatureProps);

    drawTextGeometry(
      styleFunction,
      textBuilder,
      textFeature,
      lineString,
      sharedData,
    );

    currentInstructionsIndex += verticesCount * instructionsPerVertex;
  }
}

/**
 * Pushes several triangles to form a polygon, including holes
 * @param {Float32Array} renderInstructions Array of render instructions for points.
 * @param {import('../../transform.js').Transform} renderInstructionsTransform Transform applied to render instructions
 * @param {Uint8Array} labels Integer array containing encoded labels
 * @param {Map<string,import('../../expr/expression.js').ValueType>} properties Custom attributes
 * @param {Record<string, number>} customAttributesSizes Custom attributes sizes
 * @param {import('../canvas/TextBuilder.js').default} textBuilder Text builder
 * @param {import('../../style/Style.js').StyleFunction} styleFunction Text style
 * @private
 */
export function convertPointRenderInstructionsToCanvasTextBuilder(
  renderInstructions,
  renderInstructionsTransform,
  labels,
  properties,
  customAttributesSizes,
  textBuilder,
  styleFunction,
) {
  const customAttributesKeys = Object.keys(customAttributesSizes);
  const totalCustomAttributesSize = customAttributesKeys.reduce(
    (prev, curr) => prev + customAttributesSizes[curr],
    0,
  );
  const instructionsPerVertex = 2; // x, y
  const sharedData = {};

  let currentInstructionsIndex = 0;
  while (currentInstructionsIndex < renderInstructions.length) {
    const flatCoords = [
      renderInstructions.at(currentInstructionsIndex),
      renderInstructions.at(currentInstructionsIndex + 1),
    ];
    currentInstructionsIndex += instructionsPerVertex;
    const customAttributesValues = new Float32Array(
      renderInstructions.buffer,
      currentInstructionsIndex * Float32Array.BYTES_PER_ELEMENT,
      totalCustomAttributesSize,
    );

    const point = new Point(flatCoords, 'XY');
    const propEntries = Array.from(properties.entries());
    for (let i = 0; i < propEntries.length; i++) {
      const [propName, propType] = propEntries[i];
      textFeatureProps[propName] = readCustomAttributeValue(
        propName,
        propType,
        customAttributesKeys,
        customAttributesSizes,
        customAttributesValues,
        labels,
      );
    }
    // console.log(textFeatureProps);

    drawTextGeometry(
      styleFunction,
      textBuilder,
      textFeature,
      point,
      sharedData,
    );

    currentInstructionsIndex += totalCustomAttributesSize;
  }
}
