import {get as getProjection} from '../../../../../src/ol/proj.js';
import {
  deserializeFrameState,
  serializeFrameState,
} from '../../../../../src/ol/render/webgl/serialize.js';
import expect from '../../../expect.js';

describe('ol/render/webgl/serialize.js', function () {
  describe('serializeFrameState and deserializeFrameState', () => {
    /** @type {import("../../../../../src/ol/Map").FrameState} */
    const frameState = {
      viewState: {
        center: [0, 0],
        resolution: 1.123456789,
        rotation: 0,
        zoom: 2,
        projection: getProjection('EPSG:3857'),
      },
      viewHints: [0, 0],
      pixelRatio: 2,
      size: [800, 600],
      extent: [-100, -100, 100, 100],
      coordinateToPixelTransform: [1, 0, 0, 1, 0, 0],
      pixelToCoordinateTransform: [1, 0, 0, 1, 0, 0],
      layerStatesArray: [
        {
          zIndex: 0,
          visible: true,
          extent: undefined,
          maxResolution: Infinity,
          minResolution: 0,
          managed: true,
          opacity: 1,
        },
      ],
      layerIndex: 0,
      postRenderFunctions: [],
      time: Date.now(),
      usedTiles: {},
      wantedTiles: {},
    };

    describe('serializeFrameState and deserializeFrameState', () => {
      it('keeps the object intact (without unsupported properties)', () => {
        const roundTripResult = deserializeFrameState(
          serializeFrameState(frameState),
        );

        const {
          wantedTiles, // eslint-disable-line no-unused-vars
          usedTiles, // eslint-disable-line no-unused-vars
          postRenderFunctions, // eslint-disable-line no-unused-vars
          ...frameStateWithoutUnsupportedProps
        } = frameState;

        expect(roundTripResult).to.eql(frameStateWithoutUnsupportedProps);
      });
      it('generates a cloneable object in between', () => {
        const serialized = serializeFrameState(frameState);
        // check that serialized is cloneable by posting a message
        const {port1} = new MessageChannel();
        port1.postMessage(serialized);
        port1.close();
      });
    });
  });
});
