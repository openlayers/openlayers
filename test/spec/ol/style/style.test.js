

import _ol_Feature_ from '../../../../src/ol/feature';
import _ol_geom_Point_ from '../../../../src/ol/geom/point';
import _ol_style_Style_ from '../../../../src/ol/style/style';
import _ol_style_Fill_ from '../../../../src/ol/style/fill';
import _ol_style_Circle_ from '../../../../src/ol/style/circle';
import _ol_style_Stroke_ from '../../../../src/ol/style/stroke';
import _ol_style_Text_ from '../../../../src/ol/style/text';


describe('ol.style.Style', function() {

  var testFill = new _ol_style_Fill_({
    color: 'rgba(255, 255, 255, 0.6)'
  });

  var testStroke = new _ol_style_Stroke_({
    color: '#319FD3',
    width: 1
  });

  var testText = new _ol_style_Text_({
    font: '12px Calibri,sans-serif',
    fill: new _ol_style_Fill_({
      color: '#000'
    }),
    stroke: new _ol_style_Stroke_({
      color: '#fff',
      width: 3
    })
  });

  var testImage = new _ol_style_Circle_({
    radius: 5
  });

  describe('#clone', function() {

    it('creates a new ol.style.Style', function() {
      var original = new _ol_style_Style_();
      var clone = original.clone();
      expect(clone).to.be.an(_ol_style_Style_);
      expect(clone).to.not.be(original);
    });

    it('copies all values', function() {
      var original = new _ol_style_Style_({
        geometry: new _ol_geom_Point_([0, 0, 0]),
        fill: new _ol_style_Fill_({
          color: '#319FD3'
        }),
        image: new _ol_style_Circle_({
          radius: 5
        }),
        stroke: new _ol_style_Stroke_({
          color: '#319FD3'
        }),
        text: new _ol_style_Text_({
          text: 'test'
        }),
        zIndex: 2
      });
      var clone = original.clone();
      expect(original.getGeometry().getCoordinates()).to.eql(clone.getGeometry().getCoordinates());
      expect(original.getFill().getColor()).to.eql(clone.getFill().getColor());
      expect(original.getImage().getRadius()).to.eql(clone.getImage().getRadius());
      expect(original.getStroke().getColor()).to.eql(clone.getStroke().getColor());
      expect(original.getText().getText()).to.eql(clone.getText().getText());
      expect(original.getZIndex()).to.eql(clone.getZIndex());
    });

    it('the clone does not reference the same objects as the original', function() {
      var original = new _ol_style_Style_({
        geometry: new _ol_geom_Point_([0, 0, 0]),
        fill: new _ol_style_Fill_({
          color: '#319FD3'
        }),
        image: new _ol_style_Circle_({
          radius: 5
        }),
        stroke: new _ol_style_Stroke_({
          color: '#319FD3'
        }),
        text: new _ol_style_Text_({
          text: 'test'
        })
      });
      var clone = original.clone();
      expect(original.getGeometry()).not.to.be(clone.getGeometry());
      expect(original.getFill()).not.to.be(clone.getFill());
      expect(original.getImage()).not.to.be(clone.getImage());
      expect(original.getStroke()).not.to.be(clone.getStroke());
      expect(original.getText()).not.to.be(clone.getText());

      clone.getGeometry().setCoordinates([1, 1, 1]);
      clone.getFill().setColor('#012345');
      clone.getImage().setScale(2);
      clone.getStroke().setColor('#012345');
      clone.getText().setText('other');
      expect(original.getGeometry().getCoordinates()).not.to.eql(clone.getGeometry().getCoordinates());
      expect(original.getFill().getColor()).not.to.eql(clone.getFill().getColor());
      expect(original.getImage().getScale()).not.to.eql(clone.getImage().getScale());
      expect(original.getStroke().getColor()).not.to.eql(clone.getStroke().getColor());
      expect(original.getText().getText()).not.to.eql(clone.getText().getText());
    });
  });

  describe('#setZIndex', function() {

    it('sets the zIndex', function() {
      var style = new _ol_style_Style_();

      style.setZIndex(0.7);
      expect(style.getZIndex()).to.be(0.7);
    });
  });

  describe('#getFill', function() {
    var style = new _ol_style_Style_({
      fill: testFill
    });

    it('returns the fill style of a style', function() {
      expect(style.getFill()).to.eql(testFill);
    });
  });

  describe('#setFill', function() {
    var style = new _ol_style_Style_();

    it('sets the fill style of a style', function() {
      style.setFill(testFill);
      expect(style.getFill()).to.eql(testFill);
    });
  });

  describe('#getImage', function() {
    var style = new _ol_style_Style_({
      image: testImage
    });

    it('returns the image style of a style', function() {
      expect(style.getImage()).to.eql(testImage);
    });
  });

  describe('#setImage', function() {
    var style = new _ol_style_Style_();

    it('sets the image style of a style', function() {
      style.setImage(testImage);
      expect(style.getImage()).to.eql(testImage);
    });
  });

  describe('#getStroke', function() {
    var style = new _ol_style_Style_({
      stroke: testStroke
    });

    it('returns the stroke style of a style', function() {
      expect(style.getStroke()).to.eql(testStroke);
    });
  });

  describe('#setStroke', function() {
    var style = new _ol_style_Style_();

    it('sets the stroke style of a style', function() {
      style.setStroke(testStroke);
      expect(style.getStroke()).to.eql(testStroke);
    });
  });

  describe('#getText', function() {
    var style = new _ol_style_Style_({
      text: testText
    });

    it('returns the text style of a style', function() {
      expect(style.getText()).to.eql(testText);
    });
  });

  describe('#setText', function() {
    var style = new _ol_style_Style_();

    it('sets the text style of a style', function() {
      style.setText(testText);
      expect(style.getText()).to.eql(testText);
    });
  });

  describe('#setGeometry', function() {
    var style = new _ol_style_Style_();

    it('creates a geometry function from a string', function() {
      var feature = new _ol_Feature_();
      feature.set('myGeom', new _ol_geom_Point_([0, 0]));
      style.setGeometry('myGeom');
      expect(style.getGeometryFunction()(feature))
          .to.eql(feature.get('myGeom'));
    });

    it('creates a geometry function from a geometry', function() {
      var geom = new _ol_geom_Point_([0, 0]);
      style.setGeometry(geom);
      expect(style.getGeometryFunction()())
          .to.eql(geom);
    });

    it('returns the configured geometry function', function() {
      var geom = new _ol_geom_Point_([0, 0]);
      style.setGeometry(function() {
        return geom;
      });
      expect(style.getGeometryFunction()())
          .to.eql(geom);
    });
  });

  describe('#getGeometry', function() {

    it('returns whatever was passed to setGeometry', function() {
      var style = new _ol_style_Style_();
      style.setGeometry('foo');
      expect(style.getGeometry()).to.eql('foo');
      var geom = new _ol_geom_Point_([1, 2]);
      style.setGeometry(geom);
      expect(style.getGeometry()).to.eql(geom);
      var fn = function() {
        return geom;
      };
      style.setGeometry(fn);
      expect(style.getGeometry()).to.eql(fn);
      style.setGeometry(null);
      expect(style.getGeometry()).to.eql(null);
    });

  });

});

describe('ol.style.Style.createFunction()', function() {
  var style = new _ol_style_Style_();

  it('creates a style function from a single style', function() {
    var styleFunction = _ol_style_Style_.createFunction(style);
    expect(styleFunction()).to.eql([style]);
  });

  it('creates a style function from an array of styles', function() {
    var styleFunction = _ol_style_Style_.createFunction([style]);
    expect(styleFunction()).to.eql([style]);
  });

  it('passes through a function', function() {
    var original = function() {
      return [style];
    };
    var styleFunction = _ol_style_Style_.createFunction(original);
    expect(styleFunction).to.be(original);
  });

  it('throws on (some) unexpected input', function() {
    expect(function() {
      _ol_style_Style_.createFunction({bogus: 'input'});
    }).to.throwException();
  });

});
