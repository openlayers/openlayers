import {assert} from 'chai';
import {
  activeLabelIndices,
  fadeClock,
  LABEL_FADE_DURATION,
  LabelFade,
  writeGpuTransition,
} from '../../../../../src/ol/render/webgpu/labelFade.js';

describe('ol/render/webgpu/labelFade', () => {
  it('activates only accepted instances of a shared identity', () => {
    const labels = [{id: 1}, {id: 1}, {id: 2}, {id: 2}];
    const active = activeLabelIndices(
      labels,
      [true, false, true, true],
      [false, true, false, false],
      [10, 10, 20, 20],
    );
    assert.deepEqual(Array.from(active), [0, 2, 3]);
  });

  it('keeps only the previous winner when an identity fades out', () => {
    const labels = [{id: 1}, {id: 1}, {id: 1}];
    const active = activeLabelIndices(
      labels,
      [false, false, false],
      [false, true, false],
      [10, 10, 10],
    );
    assert.deepEqual(Array.from(active), [1]);
  });

  it('fades a new label from 0 to 1 over the duration', () => {
    const fade = new LabelFade(200);
    const labels = [{id: 1}];
    assert.isTrue(fade.update(labels, [true], 1000));
    assert.strictEqual(fade.opacity(1, 1000), 0);
    assert.strictEqual(fade.opacity(1, 1100), 0.5);
    assert.strictEqual(fade.opacity(1, 1200), 1);
    assert.isFalse(fade.update(labels, [true], 1200));
  });

  it('restarts the fade after a label is hidden', () => {
    const fade = new LabelFade(200);
    fade.update([{id: 1}], [true], 0);
    fade.update([{id: 1}], [false], 200);
    fade.update([{id: 1}], [true], 500);
    assert.strictEqual(fade.opacity(1, 500), 0);
    assert.strictEqual(fade.opacity(1, 600), 0.5);
  });

  it('fades out and reverses continuously from the current opacity', () => {
    const fade = new LabelFade(200);
    const labels = [{id: 1}];
    fade.update(labels, [true], 0);
    assert.strictEqual(fade.opacity(1, 100), 0.5);

    fade.update(labels, [false], 100);
    assert.strictEqual(fade.opacity(1, 150), 0.375);

    fade.update(labels, [true], 150);
    assert.strictEqual(fade.opacity(1, 150), 0.375);
    assert.closeTo(fade.opacity(1, 250), 0.6875, 1e-9);
  });

  it('exposes a stable GPU transition without changing it each frame', () => {
    const fade = new LabelFade(200);
    fade.update([{id: 1}], [true], 1000);
    assert.deepEqual(fade.transition(1), [0, 1, 1000]);
    fade.update([{id: 1}], [true], 1100);
    assert.deepEqual(fade.transition(1), [0, 1, 1000]);
  });

  it('keeps animation running while an absent label fades out', () => {
    const fade = new LabelFade(200);
    fade.update([{id: 1}], [true], 0);
    fade.update([{id: 1}], [true], 200);
    assert.isTrue(fade.update([], [], 300));
    assert.isTrue(fade.update([], [], 400));
    assert.isFalse(fade.update([], [], 500));
  });

  it('does not treat unlabeled or already-opaque labels as fading', () => {
    const fade = new LabelFade(200);
    assert.isFalse(fade.update([{}], [true], 0));
    assert.strictEqual(fade.opacity(undefined, 0), 1);
    fade.update([{id: 1}], [true], 0);
    fade.update([{id: 1}], [true], LABEL_FADE_DURATION);
    assert.isFalse(fade.update([{id: 1}], [true], LABEL_FADE_DURATION));
  });

  it('reuses fade when the same text appears nearby with a new id', () => {
    const fade = new LabelFade(200);
    fade.update([{id: 1, text: 'Montana', _anchor: [0, 0]}], [true], 0, 100);
    fade.update([{id: 1, text: 'Montana', _anchor: [0, 0]}], [true], 200, 100);
    const fading = fade.update(
      [{id: 2, text: 'Montana', _anchor: [10, 0]}],
      [true],
      1000,
      100,
    );
    assert.isFalse(fading);
    assert.strictEqual(fade.opacity(2, 1000), 1);
  });

  it('fades in when the same text is farther than maxWorldDistance', () => {
    const fade = new LabelFade(200);
    fade.update([{id: 1, text: 'Montana', _anchor: [0, 0]}], [true], 0, 100);
    fade.update(
      [{id: 2, text: 'Montana', _anchor: [1000, 0]}],
      [true],
      1000,
      100,
    );
    assert.strictEqual(fade.opacity(2, 1000), 0);
    assert.strictEqual(fade.opacity(2, 1100), 0.5);
  });

  it('does not match by text when maxWorldDistance is omitted', () => {
    const fade = new LabelFade(200);
    fade.update([{id: 1, text: 'Montana', _anchor: [0, 0]}], [true], 0);
    fade.update([{id: 2, text: 'Montana', _anchor: [0, 0]}], [true], 1000);
    assert.strictEqual(fade.opacity(2, 1000), 0);
  });

  it('propagates a matched text fade to a paired symbol with the same id', () => {
    const fade = new LabelFade(200);
    fade.update(
      [{id: 1, text: 'Montana', _anchor: [0, 0]}, {id: 1}],
      [true, true],
      0,
      100,
    );
    fade.update(
      [{id: 1, text: 'Montana', _anchor: [0, 0]}, {id: 1}],
      [true, true],
      200,
      100,
    );
    fade.update(
      [{id: 2, text: 'Montana', _anchor: [0, 0]}, {id: 2}],
      [true, true],
      1000,
      100,
    );
    assert.strictEqual(fade.opacity(2, 1000), 1);
  });

  it('stores the fade clock at a resolution float32 can fade with', () => {
    const now = Date.now();
    const clock = fadeClock(now);
    const later = fadeClock(now + LABEL_FADE_DURATION);
    // Epoch milliseconds collapse in float32; the session clock must not.
    assert.strictEqual(
      Math.fround(now),
      Math.fround(now + LABEL_FADE_DURATION),
    );
    assert.notStrictEqual(Math.fround(clock), Math.fround(later));
    const fade = new LabelFade(LABEL_FADE_DURATION);
    fade.update([{id: 1}], [true], now);
    const packed = new Float32Array(3);
    writeGpuTransition(packed, 0, fade.transition(1));
    assert.deepEqual(Array.from(packed), [0, 1, clock]);
  });
});
