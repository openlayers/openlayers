goog.provide('ol.test.style.Circle');

goog.require('ol.style.AtlasManager');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');


describe('ol.style.Circle', function() {

  describe('#constructor', function() {

    it('creates a canvas if no atlas is used (no fill-style)', function() {
      var style = new ol.style.Circle({radius: 10});
      expect(style.getImage()).to.be.an(HTMLCanvasElement);
      expect(style.getSize()).to.eql([21, 21]);
      expect(style.getImageSize()).to.eql([21, 21]);
      expect(style.getOrigin()).to.eql([0, 0]);
      expect(style.getAnchor()).to.eql([10.5, 10.5]);
      // hit-detection image is created, because no fill style is set
      expect(style.getImage()).to.not.be(style.getHitDetectionImage());
      expect(style.getHitDetectionImage()).to.be.an(HTMLCanvasElement);
      expect(style.getHitDetectionImageSize()).to.eql([21, 21]);
    });

    it('creates a canvas if no atlas is used (fill-style)', function() {
      var style = new ol.style.Circle({
        radius: 10,
        fill: new ol.style.Fill({
          color: '#FFFF00'
        })
      });
      expect(style.getImage()).to.be.an(HTMLCanvasElement);
      expect(style.getSize()).to.eql([21, 21]);
      expect(style.getImageSize()).to.eql([21, 21]);
      expect(style.getOrigin()).to.eql([0, 0]);
      expect(style.getAnchor()).to.eql([10.5, 10.5]);
      // no hit-detection image is created, because fill style is set
      expect(style.getImage()).to.be(style.getHitDetectionImage());
      expect(style.getHitDetectionImage()).to.be.an(HTMLCanvasElement);
      expect(style.getHitDetectionImageSize()).to.eql([21, 21]);
    });

    it('adds itself to an atlas manager (no fill-style)', function() {
      var atlasManager = new ol.style.AtlasManager({initialSize: 512});
      var style = new ol.style.Circle({radius: 10, atlasManager: atlasManager});
      expect(style.getImage()).to.be.an(HTMLCanvasElement);
      expect(style.getSize()).to.eql([21, 21]);
      expect(style.getImageSize()).to.eql([512, 512]);
      expect(style.getOrigin()).to.eql([1, 1]);
      expect(style.getAnchor()).to.eql([10.5, 10.5]);
      // hit-detection image is created, because no fill style is set
      expect(style.getImage()).to.not.be(style.getHitDetectionImage());
      expect(style.getHitDetectionImage()).to.be.an(HTMLCanvasElement);
      expect(style.getHitDetectionImageSize()).to.eql([512, 512]);
    });

    it('adds itself to an atlas manager (fill-style)', function() {
      var atlasManager = new ol.style.AtlasManager({initialSize: 512});
      var style = new ol.style.Circle({
        radius: 10,
        atlasManager: atlasManager,
        fill: new ol.style.Fill({
          color: '#FFFF00'
        })
      });
      expect(style.getImage()).to.be.an(HTMLCanvasElement);
      expect(style.getSize()).to.eql([21, 21]);
      expect(style.getImageSize()).to.eql([512, 512]);
      expect(style.getOrigin()).to.eql([1, 1]);
      expect(style.getAnchor()).to.eql([10.5, 10.5]);
      // no hit-detection image is created, because fill style is set
      expect(style.getImage()).to.be(style.getHitDetectionImage());
      expect(style.getHitDetectionImage()).to.be.an(HTMLCanvasElement);
      expect(style.getHitDetectionImageSize()).to.eql([512, 512]);
    });
  });

  describe('#getChecksum', function() {

    it('calculates the same hash code for default options', function() {
      var style1 = new ol.style.Circle();
      var style2 = new ol.style.Circle();
      expect(style1.getChecksum()).to.eql(style2.getChecksum());
    });

    it('calculates not the same hash code (radius)', function() {
      var style1 = new ol.style.Circle();
      var style2 = new ol.style.Circle({
        radius: 5
      });
      expect(style1.getChecksum()).to.not.eql(style2.getChecksum());
    });

    it('calculates the same hash code (radius)', function() {
      var style1 = new ol.style.Circle({
        radius: 5
      });
      var style2 = new ol.style.Circle({
        radius: 5
      });
      expect(style1.getChecksum()).to.eql(style2.getChecksum());
    });

    it('calculates not the same hash code (color)', function() {
      var style1 = new ol.style.Circle({
        radius: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        })
      });
      var style2 = new ol.style.Circle({
        radius: 5,
        stroke: new ol.style.Stroke({
          color: '#319FD3'
        })
      });
      expect(style1.getChecksum()).to.not.eql(style2.getChecksum());
    });

    it('calculates the same hash code (everything set)', function() {
      var style1 = new ol.style.Circle({
        radius: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3',
          lineCap: 'round',
          lineDash: [5, 15, 25],
          lineJoin: 'miter',
          miterLimit: 4,
          width: 2
        })
      });
      var style2 = new ol.style.Circle({
        radius: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3',
          lineCap: 'round',
          lineDash: [5, 15, 25],
          lineJoin: 'miter',
          miterLimit: 4,
          width: 2
        })
      });
      expect(style1.getChecksum()).to.eql(style2.getChecksum());
    });

    it('calculates not the same hash code (stroke width differs)', function() {
      var style1 = new ol.style.Circle({
        radius: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3',
          lineCap: 'round',
          lineDash: [5, 15, 25],
          lineJoin: 'miter',
          miterLimit: 4,
          width: 3
        })
      });
      var style2 = new ol.style.Circle({
        radius: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3',
          lineCap: 'round',
          lineDash: [5, 15, 25],
          lineJoin: 'miter',
          miterLimit: 4,
          width: 2
        })
      });
      expect(style1.getChecksum()).to.not.eql(style2.getChecksum());
    });

    it('invalidates a cached checksum if values change (fill)', function() {
      var style1 = new ol.style.Circle({
        radius: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3'
        })
      });
      var style2 = new ol.style.Circle({
        radius: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3'
        })
      });
      expect(style1.getChecksum()).to.eql(style2.getChecksum());

      style1.getFill().setColor('red');
      expect(style1.getChecksum()).to.not.eql(style2.getChecksum());
    });

    it('invalidates a cached checksum if values change (stroke)', function() {
      var style1 = new ol.style.Circle({
        radius: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3'
        })
      });
      var style2 = new ol.style.Circle({
        radius: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3'
        })
      });
      expect(style1.getChecksum()).to.eql(style2.getChecksum());

      style1.getStroke().setWidth(4);
      expect(style1.getChecksum()).to.not.eql(style2.getChecksum());
    });

  });
});
