import Circle from '../../../../../src/ol/style/Circle.js';
import Feature from '../../../../../src/ol/Feature.js';
import Point from '../../../../../src/ol/geom/Point.js';
import {Style} from '../../../../../src/ol/style.js';
import {create} from '../../../../../src/ol/transform.js';
import {createHitDetectionImageData} from '../../../../../src/ol/render/canvas/hitdetect.js';

describe('hitdetect', function () {
  let features, styleFunction;

  beforeEach(function () {
    features = [
      new Feature(new Point([0, 75])),
      new Feature(new Point([0, 50])),
      new Feature(new Point([0, 25])),
      new Feature(new Point([0, 0])),
    ];
    styleFunction = function () {
      return new Style({
        image: new Circle({
          radius: 5,
        }),
      });
    };
  });

  it('does not exceed the color range', function () {
    const imageData = createHitDetectionImageData(
      [2, 2],
      [create()],
      features,
      styleFunction,
      [0, 0, 0, 0],
      1,
      0
    );
    expect(Array.prototype.slice.call(imageData.data, 0, 3)).to.eql([
      255,
      255,
      252,
    ]);
  });
});
