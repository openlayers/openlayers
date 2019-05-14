import WebGLLayerRenderer, {getBlankTexture, pushFeatureInBuffer} from '../../../../../src/ol/renderer/webgl/Layer';
import WebGLArrayBuffer from '../../../../../src/ol/webgl/Buffer';
import Layer from '../../../../../src/ol/layer/Layer';


describe('ol.renderer.webgl.Layer', function() {

  describe('constructor', function() {

    let target;

    beforeEach(function() {
      target = document.createElement('div');
      target.style.width = '256px';
      target.style.height = '256px';
      document.body.appendChild(target);
    });

    afterEach(function() {
      document.body.removeChild(target);
    });

    it('creates a new instance', function() {
      const layer = new Layer({});
      const renderer = new WebGLLayerRenderer(layer);
      expect(renderer).to.be.a(WebGLLayerRenderer);
    });

  });

  describe('pushFeatureInBuffer', function() {
    let vertexBuffer, indexBuffer;

    beforeEach(function() {
      vertexBuffer = new WebGLArrayBuffer();
      indexBuffer = new WebGLArrayBuffer();
    });

    it('does nothing if the feature has no geometry', function() {
      const feature = {
        type: 'Feature',
        id: 'AFG',
        properties: {
          color: [0.5, 1, 0.2, 0.7],
          size: 3
        },
        geometry: null
      };
      pushFeatureInBuffer(vertexBuffer, indexBuffer, feature);
      expect(vertexBuffer.getArray().length).to.eql(0);
      expect(indexBuffer.getArray().length).to.eql(0);
    });

    it('adds two triangles with the correct attributes for a point geometry', function() {
      const feature = {
        type: 'Feature',
        id: 'AFG',
        properties: {
          color: [0.5, 1, 0.2, 0.7],
          size: 3
        },
        geometry: {
          type: 'Point',
          coordinates: [-75, 47]
        }
      };
      const attributePerVertex = 12;
      pushFeatureInBuffer(vertexBuffer, indexBuffer, feature);
      expect(vertexBuffer.getArray().length).to.eql(attributePerVertex * 4);
      expect(indexBuffer.getArray().length).to.eql(6);
    });

    it('correctly sets indices & coordinates for several features', function() {
      const feature = {
        type: 'Feature',
        id: 'AFG',
        properties: {
          color: [0.5, 1, 0.2, 0.7],
          size: 3
        },
        geometry: {
          type: 'Point',
          coordinates: [-75, 47]
        }
      };
      const attributePerVertex = 12;
      pushFeatureInBuffer(vertexBuffer, indexBuffer, feature);
      pushFeatureInBuffer(vertexBuffer, indexBuffer, feature);
      expect(vertexBuffer.getArray()[0]).to.eql(-75);
      expect(vertexBuffer.getArray()[1]).to.eql(47);
      expect(vertexBuffer.getArray()[0 + attributePerVertex]).to.eql(-75);
      expect(vertexBuffer.getArray()[1 + attributePerVertex]).to.eql(47);

      // first point
      expect(indexBuffer.getArray()[0]).to.eql(0);
      expect(indexBuffer.getArray()[1]).to.eql(1);
      expect(indexBuffer.getArray()[2]).to.eql(3);
      expect(indexBuffer.getArray()[3]).to.eql(1);
      expect(indexBuffer.getArray()[4]).to.eql(2);
      expect(indexBuffer.getArray()[5]).to.eql(3);

      // second point
      expect(indexBuffer.getArray()[6]).to.eql(4);
      expect(indexBuffer.getArray()[7]).to.eql(5);
      expect(indexBuffer.getArray()[8]).to.eql(7);
      expect(indexBuffer.getArray()[9]).to.eql(5);
      expect(indexBuffer.getArray()[10]).to.eql(6);
      expect(indexBuffer.getArray()[11]).to.eql(7);
    });

    it('correctly adds custom attributes', function() {
      const feature = {
        type: 'Feature',
        id: 'AFG',
        properties: {
          color: [0.5, 1, 0.2, 0.7],
          custom: 4,
          customString: '5',
          custom2: 12.4,
          customString2: 'abc'
        },
        geometry: {
          type: 'Point',
          coordinates: [-75, 47]
        }
      };
      const attributePerVertex = 16;
      pushFeatureInBuffer(vertexBuffer, indexBuffer, feature, ['custom', 'custom2', 'customString', 'customString2']);
      expect(vertexBuffer.getArray().length).to.eql(attributePerVertex * 4);
      expect(indexBuffer.getArray().length).to.eql(6);
      expect(vertexBuffer.getArray()[12]).to.eql(4);
      expect(vertexBuffer.getArray()[13]).to.eql(12.4);
      expect(vertexBuffer.getArray()[14]).to.eql(5);
      expect(vertexBuffer.getArray()[15]).to.eql(0);
    });
  });

  describe('getBlankTexture', function() {
    it('creates a 1x1 white texture', function() {
      const texture = getBlankTexture();
      expect(texture.height).to.eql(1);
      expect(texture.width).to.eql(1);
      expect(texture.data[0]).to.eql(255);
      expect(texture.data[1]).to.eql(255);
      expect(texture.data[2]).to.eql(255);
      expect(texture.data[3]).to.eql(255);
    });
  });

});
