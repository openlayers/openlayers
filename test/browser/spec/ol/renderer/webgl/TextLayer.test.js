import { spy as sinonSpy } from 'sinon';
import Feature from '../../../../../../src/ol/Feature.js';
import Map from '../../../../../../src/ol/Map.js';
import View from '../../../../../../src/ol/View.js';
import Point from '../../../../../../src/ol/geom/Point.js';
import LineString from '../../../../../../src/ol/geom/LineString.js';
import WebGLTextLayer from '../../../../../../src/ol/layer/WebGLText.js';
import Projection from '../../../../../../src/ol/proj/Projection.js';
import WebGLTextLayerRenderer from '../../../../../../src/ol/renderer/webgl/TextLayer.js';
import VectorSource from '../../../../../../src/ol/source/Vector.js';
import VectorEventType from '../../../../../../src/ol/source/VectorEventType.js';
import { create as createTransform } from '../../../../../../src/ol/transform.js';
import { getUid } from '../../../../../../src/ol/util.js';

describe('ol/renderer/webgl/TextLayer', () => {
    /** @type {WebGLTextLayerRenderer} */
    let renderer;
    /** @type {WebGLTextLayer} */
    let textLayer;
    /** @type {VectorSource} */
    let vectorSource;
    /** @type {import('../../../../../../src/ol/Map.js').FrameState} */
    let frameState;
    /** @type {Map} */
    let map;

    /** @type {Feature} */
    let feature1;
    /** @type {Feature} */
    let feature2;
    /** @type {Feature} */
    let feature3;

    beforeEach(() => {
        feature1 = new Feature({
            geometry: new Point([1, 2]),
            name: 'City A',
        });
        feature2 = new Feature({
            geometry: new Point([3, 4]),
            name: 'City B',
        });
        feature3 = new Feature({
            geometry: new LineString([
                [1, 2],
                [3, 4],
            ]),
            name: 'Road',
        });
        vectorSource = new VectorSource({
            features: [feature1, feature2, feature3],
        });
        textLayer = new WebGLTextLayer({
            source: vectorSource,
            style: {
                'text-value': ['get', 'name'],
            },
        });

        const proj = new Projection({
            code: 'custom',
            units: 'pixels',
            extent: [-128, -128, 128, 128],
        });
        frameState = {
            layerStatesArray: [textLayer.getLayerState()],
            layerIndex: 0,
            extent: [-32, 0, 32, 32],
            pixelRatio: 1,
            coordinateToPixelTransform: createTransform(),
            pixelToCoordinateTransform: createTransform(),
            postRenderFunctions: [],
            time: Date.now(),
            viewHints: [0, 0],
            viewState: {
                center: [0, 16],
                resolution: 0.25,
                rotation: 0,
                projection: proj,
            },
            size: [200, 100],
            renderTargets: {},
        };

        map = new Map({
            view: new View(),
        });
        textLayer.set('map', map, true);
    });

    afterEach(() => {
        textLayer.dispose();
        if (renderer) {
            renderer.dispose();
        }
        map.dispose();
    });

    describe('source changes', () => {
        beforeEach(() => {
            renderer = textLayer.createRenderer();
            // call prepareFrame to initialize helper and add initial features
            renderer.prepareFrame(frameState);

            sinonSpy(renderer.batch_, 'addFeature');
            sinonSpy(renderer.batch_, 'removeFeature');
            sinonSpy(renderer.batch_, 'changeFeature');
            sinonSpy(renderer.batch_, 'clear');
        });

        describe('initial state', () => {
            it('batch contains only point features', () => {
                const pointIds = Object.keys(renderer.batch_.pointBatch.entries);
                // feature1 and feature2 are Points, feature3 is a LineString
                expect(pointIds.length).to.be(2);
                expect(pointIds).to.contain(getUid(feature1));
                expect(pointIds).to.contain(getUid(feature2));
            });
            it('batch does not contain non-point features in pointBatch', () => {
                const pointIds = Object.keys(renderer.batch_.pointBatch.entries);
                expect(pointIds).not.to.contain(getUid(feature3));
            });
            it('batch tracks LineString features in lineStringBatch', () => {
                const lineIds = Object.keys(
                    renderer.batch_.lineStringBatch.entries,
                );
                expect(lineIds).to.contain(getUid(feature3));
            });
        });

        describe('on feature added', () => {
            it('calls batch.addFeature', () => {
                const feature4 = new Feature({
                    geometry: new Point([5, 6]),
                    name: 'City C',
                });
                vectorSource.addFeature(feature4);
                expect(renderer.batch_.addFeature.calledWith(feature4)).to.be(true);
            });
        });

        describe('on feature changed', () => {
            it('calls batch.changeFeature', () => {
                feature1.set('name', 'Updated City');
                expect(renderer.batch_.changeFeature.calledWith(feature1)).to.be(
                    true,
                );
            });
        });

        describe('on feature deleted', () => {
            it('calls batch.removeFeature', () => {
                vectorSource.removeFeature(feature2);
                expect(renderer.batch_.removeFeature.calledWith(feature2)).to.be(
                    true,
                );
            });
        });

        describe('on source clear', () => {
            it('calls batch.clear', () => {
                vectorSource.clear();
                expect(renderer.batch_.clear.calledOnce).to.be(true);
            });
        });
    });

    describe('#prepareFrame', () => {
        beforeEach(() => {
            renderer = textLayer.createRenderer();
            sinonSpy(vectorSource, 'loadFeatures');
            renderer.prepareFrame(frameState);
        });

        it('loads the data on first call', () => {
            expect(vectorSource.loadFeatures.calledOnce).to.eql(true);
        });

        describe('new frame without change', () => {
            beforeEach(() => {
                renderer.prepareFrame(frameState);
            });
            it('does not load the data again', () => {
                expect(vectorSource.loadFeatures.calledTwice).to.eql(false);
            });
        });

        describe('on source change', () => {
            beforeEach(() => {
                vectorSource.changed();
                renderer.prepareFrame(frameState);
            });
            it('loads the data again', () => {
                expect(vectorSource.loadFeatures.calledTwice).to.eql(true);
            });
        });

        describe('on view extent change', () => {
            beforeEach(() => {
                frameState.extent = [0, 10, 0, 10];
                renderer.prepareFrame(frameState);
            });
            it('loads the data again', () => {
                expect(vectorSource.loadFeatures.calledTwice).to.eql(true);
            });
        });

        describe('during animation', () => {
            beforeEach(() => {
                vectorSource.changed();
                frameState.viewHints[0] = 1; // ViewHint.ANIMATING
                renderer.prepareFrame(frameState);
            });
            it('does not load the data during animation', () => {
                expect(vectorSource.loadFeatures.calledTwice).to.eql(false);
            });
        });

        describe('during interaction', () => {
            beforeEach(() => {
                vectorSource.changed();
                frameState.viewHints[1] = 1; // ViewHint.INTERACTING
                renderer.prepareFrame(frameState);
            });
            it('does not load the data during interaction', () => {
                expect(vectorSource.loadFeatures.calledTwice).to.eql(false);
            });
        });
    });

    describe('#dispose', () => {
        beforeEach(() => {
            renderer = textLayer.createRenderer();
            renderer.prepareFrame(frameState);
            sinonSpy(vectorSource, 'removeEventListener');
            renderer.dispose();
        });

        it('unlistens to source events', () => {
            expect(
                vectorSource.removeEventListener.calledWith(
                    VectorEventType.ADDFEATURE,
                ),
            ).to.be(true);
            expect(
                vectorSource.removeEventListener.calledWith(
                    VectorEventType.CHANGEFEATURE,
                ),
            ).to.be(true);
            expect(
                vectorSource.removeEventListener.calledWith(
                    VectorEventType.REMOVEFEATURE,
                ),
            ).to.be(true);
            expect(
                vectorSource.removeEventListener.calledWith(VectorEventType.CLEAR),
            ).to.be(true);
        });
    });
});
