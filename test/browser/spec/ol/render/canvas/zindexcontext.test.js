import {createCanvasContext2D} from '../../../../../../src/ol/dom.js';
import ZIndexContext from '../../../../../../src/ol/render/canvas/ZIndexContext.js';

describe('ol/render/canvas/ZIndexContext', () => {
  let target;
  beforeEach(() => {
    target = createCanvasContext2D(1, 1);
  });
  it('creates a proxy and records instructions', () => {
    const zIndexContext = new ZIndexContext();
    const context = zIndexContext.getContext();
    expect(zIndexContext.zIndex).to.be(0);
    zIndexContext.zIndex = 1;
    context.fillStyle = 'red';
    context.fillRect(0, 0, 1, 1);
    zIndexContext.draw(target);
    let imageData = target.getImageData(0, 0, 1, 1).data;
    expect(Array.from(imageData)).to.eql([255, 0, 0, 255]);
    zIndexContext.clear();
    expect(zIndexContext.instructions_).to.eql([]);
    context.clearRect(0, 0, 1, 1);
    zIndexContext.draw(target);
    imageData = target.getImageData(0, 0, 1, 1).data;
    expect(Array.from(imageData)).to.eql([0, 0, 0, 0]);
    expect(zIndexContext.instructions_[0]).to.eql(['clearRect', [0, 0, 1, 1]]);
  });
});
