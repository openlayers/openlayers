import {assert} from 'chai';
import Feature from '../../../../../../src/ol/Feature.js';
import MultiLineString from '../../../../../../src/ol/geom/MultiLineString.js';
import {buildVectorRequest} from '../../../../../../src/ol/render/webgpu/buffers.js';
import Fill from '../../../../../../src/ol/style/Fill.js';
import Style from '../../../../../../src/ol/style/Style.js';
import Text from '../../../../../../src/ol/style/Text.js';
import FontAtlas from '../../../../../../src/ol/webgpu/FontAtlas.js';

describe('ol/render/webgpu/buffers', () => {
  it('keeps repeated line labels on the parts of a MultiLineString', () => {
    const feature = new Feature(
      new MultiLineString([
        [
          [-1000, 0],
          [-500, 0],
        ],
        [
          [500, 0],
          [1500, 0],
        ],
      ]),
    );
    const style = new Style({
      text: new Text({
        text: 'Road',
        font: '16px sans-serif',
        placement: 'line',
        repeat: 250,
        fill: new Fill({color: '#000'}),
      }),
    });
    const {labelData} = buildVectorRequest(
      [feature],
      () => style,
      1,
      new FontAtlas(),
    );

    assert.lengthOf(labelData.labels, 6);
    for (const label of labelData.labels) {
      const x = label._anchor[0];
      assert.isTrue(
        (x >= -1000 && x <= -500) || (x >= 500 && x <= 1500),
        `expected ${x} to be on a MultiLineString part`,
      );
    }
  });
});
