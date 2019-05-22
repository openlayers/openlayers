import Feature from '../../../../../src/ol/Feature.js';
import MultiPolygon from '../../../../../src/ol/geom/MultiPolygon.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import TextBuilder from '../../../../../src/ol/render/canvas/TextBuilder.js';
import Executor from '../../../../../src/ol/render/canvas/Executor.js';
import Text from '../../../../../src/ol/style/Text.js';
import {create as createTransform} from '../../../../../src/ol/transform.js';

function createBuilder() {
  return new TextBuilder(1, [-180, -90, 180, 90], 0.02, 1, true);
}

function createContext() {
  return {
    fill: function() {},
    stroke: function() {},
    beginPath: function() {},
    clip: function() {},
    moveTo: function() {},
    lineTo: function() {},
    closePath: function() {},
    setLineDash: function() {},
    save: function() {},
    restore: function() {}
  };
}

function executeInstructions(builder, expectedDrawTextImageCalls, expectedBuilderImageCalls) {
  const transform = createTransform();
  const context = createContext();
  const executor = new Executor(0.02, 1, false, builder.finish());
  sinon.spy(executor, 'drawTextImageWithPointPlacement_');
  const replayImageStub = sinon.stub(executor, 'replayImage_');
  executor.execute(context, transform);
  expect(executor.drawTextImageWithPointPlacement_.callCount).to.be(expectedDrawTextImageCalls);
  expect(replayImageStub.callCount).to.be(expectedBuilderImageCalls);
}

describe('ol.render.canvas.TextBuilder', function() {

  it('renders polygon labels only when they fit', function() {
    let builder = createBuilder();
    const geometry = new Polygon([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]);
    const feature = new Feature(geometry);

    builder.setTextStyle(new Text({
      text: 'This is a long text'
    }));
    builder.drawText(geometry, feature);
    expect(builder.instructions.length).to.be(3);
    executeInstructions(builder, 1, 0);


    builder = createBuilder();
    builder.setTextStyle(new Text({
      text: 'short'
    }));
    builder.drawText(geometry, feature);
    expect(builder.instructions.length).to.be(3);
    executeInstructions(builder, 1, 1);
  });

  it('renders multipolygon labels only when they fit', function() {
    const geometry = new MultiPolygon([
      [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]],
      [[[1, 1], [1, 2], [2, 2], [2, 1], [1, 1]]]
    ]);
    const feature = new Feature(geometry);

    let builder = createBuilder();
    builder.setTextStyle(new Text({
      text: 'This is a long text'
    }));
    builder.drawText(geometry, feature);
    expect(builder.instructions.length).to.be(3);
    executeInstructions(builder, 1, 0);

    builder = createBuilder();
    builder.setTextStyle(new Text({
      text: 'short'
    }));
    builder.drawText(geometry, feature);
    expect(builder.instructions.length).to.be(3);
    executeInstructions(builder, 1, 2);
  });

});
