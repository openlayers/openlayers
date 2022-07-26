import Fill from '../../../../src/ol/style/Fill.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';
import Text from '../../../../src/ol/style/Text.js';
import {Circle} from '../../../../src/ol/style.js';

describe('ol/Style.js', () => {
  describe('change event', () => {
    it('is fired if the stroke changes', (done) => {
      const style = new Style({
        stroke: new Stroke({width: 10}),
      });
      style.on('change', () => done());

      style.setStroke(new Stroke({width: 20}));
    });

    it('is fired if the stroke width changes', (done) => {
      const style = new Style({
        stroke: new Stroke({width: 10}),
      });
      style.on('change', () => done());

      style.getStroke().setWidth(20);
    });

    it('is fired if the stroke color changes', (done) => {
      const style = new Style({
        stroke: new Stroke({width: 10}),
      });
      style.on('change', () => done());

      style.getStroke().setColor('green');
    });

    it('is fired if the fill changes', (done) => {
      const style = new Style({
        stroke: new Fill({color: 'red'}),
      });
      style.on('change', () => done());

      style.setFill(new Fill({color: 'blue'}));
    });

    it('is fired if the fill color changes', (done) => {
      const style = new Style({
        fill: new Fill({color: 'red'}),
      });
      style.on('change', () => done());

      style.getFill().setColor('blue');
    });

    it('is fired if the text changes', (done) => {
      const style = new Style({
        text: new Text({text: 'chicken'}),
      });
      style.on('change', () => done());

      style.setText(new Text({text: 'soup'}));
    });

    it('is fired if the text stroke changes', (done) => {
      const style = new Style({
        text: new Text({text: 'chicken', stroke: new Stroke({color: 'blue'})}),
      });
      style.on('change', () => done());

      style.getText().setStroke(new Stroke({color: 'red'}));
    });

    it('is fired if the text stroke width changes', (done) => {
      const style = new Style({
        text: new Text({text: 'chicken', stroke: new Stroke({color: 'blue'})}),
      });
      style.on('change', () => done());

      style.getText().getStroke().setWidth(10);
    });

    it('is fired if the image changes', (done) => {
      const style = new Style({
        image: new Circle({fill: new Fill({color: 'gray'})}),
      });
      style.on('change', () => done());

      style.setImage(new Circle({fill: new Fill({color: 'purple'})}));
    });

    it('is fired if the image fill changes', (done) => {
      const style = new Style({
        image: new Circle({fill: new Fill({color: 'gray'})}),
      });
      style.on('change', () => done());

      style.getImage().setFill(new Fill({color: 'purple'}));
    });

    it('is fired if the image fill color changes', (done) => {
      const style = new Style({
        image: new Circle({fill: new Fill({color: 'gray'})}),
      });
      style.on('change', () => done());

      style.getImage().getFill().setColor('purple');
    });
  });
});
