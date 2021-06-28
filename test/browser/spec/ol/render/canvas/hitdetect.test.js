import Circle from '../../../../../../src/ol/style/Circle.js';
import Feature from '../../../../../../src/ol/Feature.js';
import Point from '../../../../../../src/ol/geom/Point.js';
import {Style} from '../../../../../../src/ol/style.js';
import {create} from '../../../../../../src/ol/transform.js';
import {createCanvasContext2D} from '../../../../../../src/ol/dom.js';
import {
  createHitDetectionImageData,
  hitDetect,
} from '../../../../../../src/ol/render/canvas/hitdetect.js';

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
      255, 255, 252,
    ]);
  });
  it('detects hit at the correct position', function () {
    const context = createCanvasContext2D(3, 3);
    context.fillStyle = '#ffffff';
    context.fillRect(1, 1, 1, 1);
    const features = [new Feature()];
    const imageData = context.getImageData(0, 0, 3, 3);
    expect(hitDetect([2, 2], features, imageData)).to.have.length(1);
    expect(hitDetect([2, 3], features, imageData)).to.have.length(1);
    expect(hitDetect([3, 2], features, imageData)).to.have.length(1);
    expect(hitDetect([3, 3], features, imageData)).to.have.length(1);

    expect(hitDetect([1.5, 1.5], features, imageData)).to.have.length(1);
    expect(hitDetect([3.4, 3.4], features, imageData)).to.have.length(1);

    expect(hitDetect([1.4, 1], features, imageData)).to.have.length(0);
    expect(hitDetect([1, 2.4], features, imageData)).to.have.length(0);
    expect(hitDetect([2.4, 1], features, imageData)).to.have.length(0);

    expect(hitDetect([3.5, 4.5], features, imageData)).to.have.length(0);
    expect(hitDetect([5, 4], features, imageData)).to.have.length(0);
    expect(hitDetect([4.5, 5], features, imageData)).to.have.length(0);

    expect(hitDetect([1.4, 3.5], features, imageData)).to.have.length(0);
    expect(hitDetect([1, 4.5], features, imageData)).to.have.length(0);
    expect(hitDetect([1.5, 5], features, imageData)).to.have.length(0);
  });
  it('correctly detects hit for pixel exceeding canvas dimension', function () {
    const features = [new Feature()];
    const context = createCanvasContext2D(2, 2);
    context.fillStyle = '#ffffff';

    context.fillRect(1, 1, 1, 1);
    let imageData = context.getImageData(0, 0, 2, 2);
    expect(hitDetect([4, 2], features, imageData)).to.have.length(1);
    expect(hitDetect([2, 4], features, imageData)).to.have.length(1);

    expect(hitDetect([-2, 4], features, imageData)).to.have.length(0);
    expect(hitDetect([4, -2], features, imageData)).to.have.length(0);

    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    context.fillRect(0, 0, 1, 1);
    imageData = context.getImageData(0, 0, 2, 2);
    expect(hitDetect([-2, 0], features, imageData)).to.have.length(1);
    expect(hitDetect([0, -2], features, imageData)).to.have.length(1);

    expect(hitDetect([-2, 4], features, imageData)).to.have.length(0);
    expect(hitDetect([4, -2], features, imageData)).to.have.length(0);
  });
});
