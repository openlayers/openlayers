import {assert} from 'chai';
import Feature from '../../../../../../src/ol/Feature.js';
import MultiLineString from '../../../../../../src/ol/geom/MultiLineString.js';
import Point from '../../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../../src/ol/geom/Polygon.js';
import {
  buildVectorRequest,
  STYLE_STRIDE,
} from '../../../../../../src/ol/render/webgpu/buffers.js';
import {layoutPointLabel} from '../../../../../../src/ol/render/webgpu/glyphLayout.js';
import Fill from '../../../../../../src/ol/style/Fill.js';
import Style from '../../../../../../src/ol/style/Style.js';
import Text from '../../../../../../src/ol/style/Text.js';
import FontAtlas from '../../../../../../src/ol/webgpu/FontAtlas.js';
import ImageAtlas from '../../../../../../src/ol/webgpu/ImageAtlas.js';

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

  it('gives point text the corners of its text box for collisions', () => {
    const text = new Text({
      text: 'Label',
      font: '16px sans-serif',
      rotation: 0.5,
      rotateWithView: true,
      fill: new Fill({color: '#000'}),
    });
    const atlas = new FontAtlas();
    const {labelData} = buildVectorRequest(
      [new Feature(new Point([0, 0]))],
      () => new Style({text}),
      1,
      atlas,
    );
    const [x1, y1, x2, y2] = layoutPointLabel(
      [],
      text,
      [0, 0],
      atlas,
      [0, 0, 0, 1],
    ).textBox;

    assert.lengthOf(labelData.labels, 1);
    const label = labelData.labels[0];
    assert.deepEqual(label._corners, [x1, y1, x2, y1, x2, y2, x1, y2]);
    assert.strictEqual(label._rotation, 0.5);
    assert.isTrue(label._rotateWithView);
  });

  it('repeats a pattern scaled down to fit the atlas at its own size', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 5000;
    canvas.height = 10;
    const fill = new Fill({color: {src: canvas.toDataURL()}});
    await fill.ready();
    const feature = new Feature(
      new Polygon([
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 0],
        ],
      ]),
    );
    const {request} = buildVectorRequest(
      [feature],
      () => new Style({fill}),
      1,
      new FontAtlas(),
      undefined,
      1,
      NaN,
      null,
      new ImageAtlas(),
    );

    assert.lengthOf(request.styles, STYLE_STRIDE);
    const [width, , scale] = request.styles.slice(10, 13);
    assert.isAtMost(width, 4094);
    assert.closeTo(width * scale, 5000, 0.01);
  });
});
