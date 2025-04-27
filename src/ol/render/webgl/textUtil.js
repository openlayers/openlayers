/**
 * @module ol/render/webgl/textUtil
 */
import {createCanvasContext2D} from '../../dom.js';
import {
  create as createMat4,
  reset as resetMat4,
  rotate as rotateMat4,
  scale as scaleMat4,
  translate as translateMat4,
} from '../../vec/mat4.js';
import {TextOverlayWorkerMessageType} from './constants.js';

export const Uniforms = {
  TEXT_OVERLAY_TEXTURE: 'u_textOverlay',
  TEXT_OVERLAY_MATRIX: 'u_textOverlayMatrix',
};

/**
 * @param {Worker} worker Worker instance used to render the text overlay
 * @param {function(HTMLCanvasElement, import('../../Map.js').FrameState): void} renderedCallback Callback function called when the text overlay is rendered, giving back
 *   the canvas containing the text overlay and the associated frame state
 */
export function setupTextOverlayWorker(worker, renderedCallback) {
  const canvas = createCanvasContext2D().canvas;
  worker.addEventListener('message', (message) => {
    const received = message.data;
    if (received.type === TextOverlayWorkerMessageType.RENDERED) {
      // the rendered image data is copied to the canvas and then given back to the worker
      const imageData = message.data.imageData;
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      canvas.getContext('2d').drawImage(imageData, 0, 0);
      canvas.style.transform = message.data.transform;
      worker.postMessage(
        {
          type: TextOverlayWorkerMessageType.RENDERED,
          imageData,
        },
        [imageData],
      );
      renderedCallback(canvas, message.data.frameState);
    }
  });
}

/**
 * @param {Array<import('../../style/flat.js').Rule>} style Style rules
 * @return {import("../../expr/expression.js").EncodedExpression} A single filter expression that can be used to keep
 *   only features associated with a text style
 */
export function createFilterForFeaturesWithText(style) {
  /** @type {import("../../expr/expression.js").EncodedExpression} */
  let textFilterExpression = false;
  /** @type {Array<import("../../expr/expression.js").EncodedExpression>} */
  const excludeFilters = [];

  function addExpressionToFilter(expr) {
    let exprWithExcludes;
    if (Array.isArray(expr) && expr[0] === 'all') {
      exprWithExcludes = ['all', ...excludeFilters, ...expr.slice(1)];
    } else if (excludeFilters.length) {
      exprWithExcludes = ['all', ...excludeFilters, expr];
    } else {
      exprWithExcludes = expr;
    }
    if (!Array.isArray(textFilterExpression)) {
      textFilterExpression = exprWithExcludes;
    } else if (textFilterExpression[0] !== 'any') {
      textFilterExpression = ['any', textFilterExpression, exprWithExcludes];
    } else {
      textFilterExpression.push(exprWithExcludes);
    }
  }

  for (const rule of style) {
    // this is not an else rule: empty the exclude filters
    if (!rule.else) {
      excludeFilters.length = 0;
    }
    const hasTextStyle = Object.keys(rule.style).some((key) =>
      key.startsWith('text-'),
    );
    if (hasTextStyle && textFilterExpression === false && !rule.filter) {
      textFilterExpression = true;
    }
    if (!rule.filter) {
      continue;
    }
    if (hasTextStyle) {
      addExpressionToFilter(rule.filter);
    } else {
      // no text style: store the filter as an exclude filter
      excludeFilters.push(['!', rule.filter]);
    }
  }
  return textFilterExpression;
}

/**
 * @param {Array<import('../../style/flat.js').Rule>} style Style rules
 * @return {function(Array<import('../../Feature.js').FeatureLike>): Array<import('../../Feature.js').FeatureLike>} This function will produce
 *   a filtered array of features from an array of features
 */
// export function createFeaturesWithTextFilter(style) {
//   return (features) => {
//     features;
//   };
// }

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
    
        vec4 textColor = texture2D(${Uniforms.TEXT_OVERLAY_TEXTURE}, vec2(coords.x, 1.-coords.y));
        gl_FragColor = textColor.a * textColor + (1. - textColor.a) * color;
      }`,
    uniforms: {
      [Uniforms.TEXT_OVERLAY_TEXTURE]: textOverlayCanvasGetter,
      [Uniforms.TEXT_OVERLAY_MATRIX]: (frameState) => {
        const textOverlayCanvas = textOverlayCanvasGetter();
        const textOverlayFrameState = textOverlayFrameStateGetter();
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
          (center[0] - renderedCenter[0]) / resolution / (renderedWidth / 2),
          (center[1] - renderedCenter[1]) / resolution / (renderedHeight / 2),
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
