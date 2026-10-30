import {assert} from 'chai';
import RBush from 'rbush';
import Feature from '../../../../../../src/ol/Feature.js';
import MultiPoint from '../../../../../../src/ol/geom/MultiPoint.js';
import Point from '../../../../../../src/ol/geom/Point.js';
import BuilderGroup from '../../../../../../src/ol/render/canvas/BuilderGroup.js';
import Executor from '../../../../../../src/ol/render/canvas/Executor.js';
import ExecutorGroup from '../../../../../../src/ol/render/canvas/ExecutorGroup.js';
import {renderFeature} from '../../../../../../src/ol/renderer/vector.js';
import CircleStyle from '../../../../../../src/ol/style/Circle.js';
import Fill from '../../../../../../src/ol/style/Fill.js';
import Style from '../../../../../../src/ol/style/Style.js';
import Text from '../../../../../../src/ol/style/Text.js';

function render(
  options,
  imageCollision,
  textCollision,
  multiPoint,
  parts,
  declutter = true,
) {
  const style = new Style({
    image:
      parts === 'text'
        ? undefined
        : new CircleStyle({
            radius: 5,
            fill: new Fill({color: 'blue'}),
            declutterMode: options.imageMode,
            optional: options.imageOptional,
          }),
    text:
      parts === 'image'
        ? undefined
        : new Text({
            text: 'X',
            font: '10px monospace',
            offsetX: 30,
            declutterMode: options.textMode,
            optional: options.textOptional,
          }),
  });
  const geometry = multiPoint
    ? new MultiPoint([
        [50, 50],
        [50, 80],
      ])
    : new Point([50, 50]);
  const builder = new BuilderGroup(0, [0, 0, 100, 100], 1, 1);
  renderFeature(
    builder,
    new Feature(geometry),
    style,
    0,
    () => {},
    undefined,
    declutter,
  );
  const executor = new ExecutorGroup(null, 1, 1, true, builder.finish());
  const tree = new RBush();
  if (imageCollision) {
    tree.insert({minX: 45, minY: 45, maxX: 55, maxY: 55});
  }
  if (textCollision) {
    tree.insert({minX: 75, minY: 45, maxX: 85, maxY: 55});
  }
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const replay = vi.spyOn(Executor.prototype, 'replayImageOrLabelArgs_');
  try {
    executor.execute(
      canvas.getContext('2d'),
      [100, 100],
      [1, 0, 0, 1, 0, 0],
      0,
      true,
      ['Image', 'Text'],
      declutter ? tree : undefined,
    );
    const rendered = replay.mock.calls.map(([args]) =>
      'contextInstructions' in args[2] ? 'text' : 'image',
    );
    const context = canvas.getContext('2d');
    const hasPixels = (x, y) =>
      context
        .getImageData(x, y - 10, 20, 20)
        .data.some((value, i) => i % 4 === 3 && value > 0);
    for (const y of multiPoint ? [50, 80] : [50]) {
      const renderedAtY = replay.mock.calls
        .filter(([args]) => Math.abs(args[3].declutterBox.minY - y) < 10)
        .map(([args]) => ('contextInstructions' in args[2] ? 'text' : 'image'));
      assert.equal(hasPixels(40, y), renderedAtY.includes('image'));
      assert.equal(hasPixels(70, y), renderedAtY.includes('text'));
    }
    const obstacles = Number(imageCollision) + Number(textCollision);
    if (declutter) {
      const inserted = rendered.filter(
        (part) => options[part + 'Mode'] !== 'none',
      ).length;
      assert.lengthOf(tree.all(), obstacles + inserted);
    }
    return rendered;
  } finally {
    replay.mockRestore();
  }
}

describe('image/text declutter dependencies', function () {
  it('does not suppress standalone image or text styles', function () {
    const options = {imageOptional: false, textOptional: false};
    assert.deepEqual(render(options, false, false, false, 'image'), ['image']);
    assert.deepEqual(render(options, false, false, false, 'text'), ['text']);
  });

  it('does not apply dependencies when decluttering is disabled', function () {
    assert.deepEqual(
      render(
        {imageOptional: false, textOptional: false},
        true,
        true,
        false,
        undefined,
        false,
      ),
      ['image', 'text'],
    );
  });

  for (const multiPoint of [false, true]) {
    for (const imageMode of [undefined, 'declutter', 'obstacle', 'none']) {
      for (const textMode of [undefined, 'declutter', 'obstacle', 'none']) {
        for (const imageOptional of [undefined, false, true]) {
          for (const textOptional of [undefined, false, true]) {
            it(`handles ${multiPoint ? 'MultiPoint' : 'Point'} ${imageMode}/${textMode}, optional ${imageOptional}/${textOptional}`, function () {
              for (const imageCollision of [false, true]) {
                for (const textCollision of [false, true]) {
                  const image =
                    (imageMode && imageMode !== 'declutter') || !imageCollision;
                  const text =
                    (textMode && textMode !== 'declutter') || !textCollision;
                  const independent =
                    (imageMode && imageMode !== 'declutter') ||
                    (textMode && textMode !== 'declutter') ||
                    false;
                  const expected = [];
                  // Dependencies apply to the independently computed collision results.
                  if (image && (text || (textOptional ?? independent))) {
                    expected.push('image');
                  }
                  if (text && (image || (imageOptional ?? independent))) {
                    expected.push('text');
                  }
                  if (multiPoint) {
                    // A collision at the first anchor must not suppress the second pair.
                    expected.push('image', 'text');
                  }
                  assert.deepEqual(
                    render(
                      {imageMode, textMode, imageOptional, textOptional},
                      imageCollision,
                      textCollision,
                      multiPoint,
                    ),
                    expected,
                  );
                }
              }
            });
          }
        }
      }
    }
  }
});
