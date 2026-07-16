import {assert} from 'chai';
import Feature from '../../../../../src/ol/Feature.js';
import Point from '../../../../../src/ol/geom/Point.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';
import {TextOverlayWorkerMessageType} from '../../../../../src/ol/render/webgl/constants.js';
import MixedGeometryBatch from '../../../../../src/ol/render/webgl/MixedGeometryBatch.js';
import {generatePointRenderInstructions} from '../../../../../src/ol/render/webgl/renderinstructions.js';
import {serializeFrameState} from '../../../../../src/ol/render/webgl/serialize.js';
import {create as createTransform} from '../../../../../src/ol/transform.js';
import LabelsArray from '../../../../../src/ol/webgl/LabelsArray.js';
import {create} from '../../../../../src/ol/worker/textOverlay.js';

describe('ol/worker/textOverlay', () => {
  let worker;
  beforeEach(() => {
    worker = create();
  });

  afterEach(() => {
    if (worker) {
      worker.terminate();
    }
    worker = null;
  });

  describe('messaging', () => {
    let geomBatch, labelsArray;

    beforeEach(() => {
      geomBatch = new MixedGeometryBatch();
      labelsArray = new LabelsArray();
    });

    describe('BUILD_INSTRUCTIONS, RENDER cycle', () => {
      async function postWorkerMessage(message, transferables) {
        const id = Math.floor(Math.random() * 10000);
        const responsePromise = new Promise((resolve) => {
          worker.addEventListener('message', (event) => {
            if (event.data.id === id) {
              resolve(event.data);
            }
          });
        });
        worker.postMessage({...message, id}, transferables ?? []);
        return responsePromise;
      }

      function areAllPixelsTransparent(imageData) {
        const offscreenCanvas = new OffscreenCanvas(
          imageData.width,
          imageData.height,
        );
        const context = offscreenCanvas.getContext('2d');
        context.drawImage(imageData, 0, 0);
        const pixelData = context.getImageData(
          0,
          0,
          imageData.width,
          imageData.height,
        ).data;
        for (let i = 0; i < pixelData.length; i += 4) {
          if (
            pixelData[i] !== 0 ||
            pixelData[i + 1] !== 0 ||
            pixelData[i + 2] !== 0 ||
            pixelData[i + 3] !== 0
          ) {
            return false;
          }
        }
        return true;
      }

      let frameState, transform;

      /** @type {import('../../../../../src/ol/style/flat.js').FlatStyleLike} */
      const style = {
        'circle-radius': 5,
        'circle-fill-color': 'red',
        'text-align': 'center',
        'text-baseline': 'middle',
        'text-font': '10px sans-serif',
        'text-value': ['get', 'name'],
      };

      const customAttributes = {
        prop_name: {
          size: 3,
          callback: (feature) => feature.get('name'),
        },
      };
      const customAttributesSizes = Object.keys(customAttributes).reduce(
        (prev, curr) => ({
          ...prev,
          [curr]: customAttributes[curr].size || 1,
        }),
        {},
      );

      /** @type {import('../../../../../src/ol/render/webgl/constants.js').TextOverlayWorkerMessage} */
      let message;

      beforeEach(() => {
        /** @type {import("../../../../../../src/ol/Map").FrameState} */
        frameState = serializeFrameState({
          viewState: {
            center: [0, 0],
            projection: getProjection('EPSG:3857'),
            resolution: 10,
            rotation: 0,
          },
          extent: [-50, -50, 50, 50],
          size: [10, 10],
          layerStatesArray: [],
          layerIndex: 0,
          pixelRatio: 1,
        });
        transform = createTransform();
      });

      it('returns an empty canvas at first', async () => {
        /** @type {import('../../../../../src/ol/render/webgl/constants.js').TextOverlayWorkerMessage} */
        message = {
          type: TextOverlayWorkerMessageType.RENDER,
          frameState,
          batchesToRender: new Set(),
        };
        const response = await postWorkerMessage(message);
        assert.deepEqual(response.type, TextOverlayWorkerMessageType.RENDER);
        const imageData = response.imageData;
        assert.instanceOf(imageData, ImageBitmap);
        assert.strictEqual(imageData.width, 10);
        assert.strictEqual(imageData.height, 10);
        assert.strictEqual(areAllPixelsTransparent(imageData), true);
      });

      it('builds canvas rending batch on the worker, sends back a batch id which can be used to render feature text', async () => {
        geomBatch.addFeature(
          new Feature({
            geometry: new Point([0, 0]),
            name: 'xxx',
          }),
        );
        const pointRenderInstructions = generatePointRenderInstructions(
          geomBatch.pointBatch,
          new Float32Array(0),
          labelsArray,
          customAttributes,
          transform,
        );
        message = {
          type: TextOverlayWorkerMessageType.BUILD_INSTRUCTIONS,
          labelsArray: labelsArray.getArray(),
          polygonRenderInstructions: new Float32Array(),
          lineStringRenderInstructions: new Float32Array(),
          pointRenderInstructions,
          style,
          customAttributesSizes,
          renderInstructionsTransform: transform,
          resolution: frameState.viewState.resolution,
        };
        let response = await postWorkerMessage(message, [
          labelsArray.getArray().buffer,
          pointRenderInstructions.buffer,
        ]);

        const textInstructionsKey = response.instructionsSetKey;
        assert.typeOf(textInstructionsKey, 'string');

        // without adding this key to the render list, the canvas given back is still empty
        message = {
          type: TextOverlayWorkerMessageType.RENDER,
          frameState,
          batchesToRender: new Set([]),
        };
        response = await postWorkerMessage(message);
        assert.strictEqual(areAllPixelsTransparent(response.imageData), true);

        // now we're adding the instructions set key to the render list, so the text should be rendered on the canvas
        message = {
          type: TextOverlayWorkerMessageType.RENDER,
          frameState,
          batchesToRender: new Set([textInstructionsKey]),
        };
        response = await postWorkerMessage(message);

        assert.strictEqual(areAllPixelsTransparent(response.imageData), false);
      });

      it('does not draw anything if the style is only a circle', async () => {
        geomBatch.addFeature(
          new Feature({
            geometry: new Point([0, 0]),
            name: '', // empty name means no text will be drawn
          }),
        );
        const pointRenderInstructions = generatePointRenderInstructions(
          geomBatch.pointBatch,
          new Float32Array(0),
          labelsArray,
          customAttributes,
          transform,
        );
        message = {
          type: TextOverlayWorkerMessageType.BUILD_INSTRUCTIONS,
          labelsArray: labelsArray.getArray(),
          polygonRenderInstructions: new Float32Array(),
          lineStringRenderInstructions: new Float32Array(),
          pointRenderInstructions,
          style,
          customAttributesSizes,
          renderInstructionsTransform: transform,
          resolution: frameState.viewState.resolution,
        };
        let response = await postWorkerMessage(message, [
          labelsArray.getArray().buffer,
          pointRenderInstructions.buffer,
        ]);
        const textInstructionsKey = response.instructionsSetKey;
        message = {
          type: TextOverlayWorkerMessageType.RENDER,
          frameState,
          batchesToRender: new Set([textInstructionsKey]),
        };
        response = await postWorkerMessage(message);

        // the canvas is still empty
        assert.strictEqual(areAllPixelsTransparent(response.imageData), true);
      });
    });
  });
});
