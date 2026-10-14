import {assert} from 'chai';
import {
  collectStickyIds,
  resolveDeclutter,
  retainVisibleIdentities,
} from '../../../../../src/ol/render/webgpu/declutter.js';

describe('ol/render/webgpu/declutter', () => {
  it('keeps non-overlapping labels', () => {
    const visible = resolveDeclutter(
      [
        {minX: 0, minY: 0, maxX: 10, maxY: 10, priority: 0},
        {minX: 20, minY: 0, maxX: 30, maxY: 10, priority: 1},
      ],
      8,
      64,
      64,
    );
    assert.deepEqual(visible, [true, true]);
  });

  it('places within the viewport padding and ignores farther labels', () => {
    const visible = resolveDeclutter(
      [
        {minX: 150, minY: 0, maxX: 160, maxY: 10, priority: 0},
        {minX: 170, minY: 0, maxX: 180, maxY: 10, priority: 1},
      ],
      8,
      64,
      64,
    );
    assert.deepEqual(visible, [true, false]);
  });

  it('hides a later overlapping label without occupying for the hidden one', () => {
    const visible = resolveDeclutter(
      [
        {minX: 0, minY: 0, maxX: 16, maxY: 16, priority: 0},
        {minX: 4, minY: 4, maxX: 20, maxY: 20, priority: 1},
        {minX: 40, minY: 0, maxX: 48, maxY: 10, priority: 2},
      ],
      8,
      64,
      64,
    );
    assert.strictEqual(visible[0], true);
    assert.strictEqual(visible[1], false);
    assert.strictEqual(visible[2], true);
  });

  it('does not let a hidden high-priority-overlap block a later label', () => {
    const visible = resolveDeclutter(
      [
        {minX: 0, minY: 0, maxX: 8, maxY: 8, priority: 0},
        {minX: 0, minY: 0, maxX: 24, maxY: 8, priority: 1},
        {minX: 16, minY: 0, maxX: 24, maxY: 8, priority: 2},
      ],
      8,
      64,
      64,
    );
    assert.deepEqual(visible, [true, false, true]);
  });

  it('always shows mode none without claiming occupancy', () => {
    const visible = resolveDeclutter(
      [
        {minX: 0, minY: 0, maxX: 16, maxY: 16, priority: 0, mode: 'none'},
        {minX: 0, minY: 0, maxX: 16, maxY: 16, priority: 1},
      ],
      8,
      64,
      64,
    );
    assert.deepEqual(visible, [true, true]);
  });

  it('shows obstacles and still claims occupancy', () => {
    const visible = resolveDeclutter(
      [
        {minX: 0, minY: 0, maxX: 16, maxY: 16, priority: 0, mode: 'obstacle'},
        {minX: 0, minY: 0, maxX: 16, maxY: 16, priority: 1},
      ],
      8,
      64,
      64,
    );
    assert.deepEqual(visible, [true, false]);
  });

  it('treats image+text pairs as all-or-nothing', () => {
    const visible = resolveDeclutter(
      [
        {
          minX: 0,
          minY: 0,
          maxX: 8,
          maxY: 8,
          priority: 0,
          pairId: 1,
        },
        {
          minX: 0,
          minY: 8,
          maxX: 8,
          maxY: 16,
          priority: 0,
          pairId: 1,
        },
        {
          minX: 0,
          minY: 0,
          maxX: 8,
          maxY: 16,
          priority: 1,
        },
      ],
      8,
      64,
      64,
    );
    assert.deepEqual(visible, [true, true, false]);
  });

  it('hides the whole pair when the union is blocked', () => {
    const visible = resolveDeclutter(
      [
        {minX: 0, minY: 0, maxX: 16, maxY: 16, priority: 0},
        {
          minX: 0,
          minY: 0,
          maxX: 8,
          maxY: 8,
          priority: 1,
          pairId: 7,
        },
        {
          minX: 8,
          minY: 8,
          maxX: 16,
          maxY: 16,
          priority: 1,
          pairId: 7,
        },
      ],
      8,
      64,
      64,
    );
    assert.deepEqual(visible, [true, false, false]);
  });

  it('shares occupancy across calls in the same group and frame', () => {
    const first = resolveDeclutter(
      [{minX: 0, minY: 0, maxX: 16, maxY: 16, priority: 0}],
      8,
      64,
      64,
      'group-a',
      3,
    );
    const second = resolveDeclutter(
      [{minX: 0, minY: 0, maxX: 16, maxY: 16, priority: 1}],
      8,
      64,
      64,
      'group-a',
      3,
    );
    assert.deepEqual(first, [true]);
    assert.deepEqual(second, [false]);
  });

  it('keeps the same winner when labels pan by a sub-cell offset', () => {
    const labels = [
      {minX: 7, minY: 0, maxX: 15, maxY: 8, priority: 0, id: 1},
      {minX: 16, minY: 0, maxX: 24, maxY: 8, priority: 0, id: 2},
    ];
    const atRest = resolveDeclutter(labels, 8, 64, 64);
    const panned = resolveDeclutter(
      labels.map((label) => ({
        ...label,
        minX: label.minX + 3.5,
        maxX: label.maxX + 3.5,
      })),
      8,
      64,
      64,
    );
    assert.deepEqual(atRest, panned);
  });

  it('picks a stable winner regardless of input order', () => {
    const low = {minX: 0, minY: 0, maxX: 16, maxY: 8, priority: 0, id: 1};
    const high = {minX: 8, minY: 0, maxX: 24, maxY: 8, priority: 0, id: 2};
    assert.deepEqual(resolveDeclutter([low, high]), [true, false]);
    assert.deepEqual(resolveDeclutter([high, low]), [false, true]);
  });

  it('hides a previous winner when a neighbor appears without hysteresis', () => {
    const zoomedOut = resolveDeclutter([
      {minX: 0, minY: 0, maxX: 15, maxY: 8, priority: 0, id: 1},
      {minX: 8, minY: 0, maxX: 23, maxY: 8, priority: 0, id: 2},
      {minX: 16, minY: 0, maxX: 31, maxY: 8, priority: 0, id: 3},
    ]);
    assert.deepEqual(zoomedOut, [true, false, true]);

    const zoomedIn = [
      {minX: 0, minY: 0, maxX: 10, maxY: 8, priority: 0, id: 1},
      {minX: 12, minY: 0, maxX: 24, maxY: 8, priority: 0, id: 2},
      {minX: 16, minY: 0, maxX: 31, maxY: 8, priority: 0, id: 3},
    ];
    assert.deepEqual(resolveDeclutter(zoomedIn), [true, true, false]);
  });

  it('keeps a previous winner with sticky ids', () => {
    const zoomedOut = [
      {minX: 0, minY: 0, maxX: 15, maxY: 8, priority: 0, id: 1},
      {minX: 8, minY: 0, maxX: 23, maxY: 8, priority: 0, id: 2},
      {minX: 16, minY: 0, maxX: 31, maxY: 8, priority: 0, id: 3},
    ];
    const previous = resolveDeclutter(zoomedOut);
    assert.deepEqual(previous, [true, false, true]);

    const zoomedIn = [
      {minX: 0, minY: 0, maxX: 10, maxY: 8, priority: 0, id: 1},
      {minX: 12, minY: 0, maxX: 24, maxY: 8, priority: 0, id: 2},
      {minX: 16, minY: 0, maxX: 31, maxY: 8, priority: 0, id: 3},
    ];
    assert.deepEqual(
      resolveDeclutter(
        zoomedIn,
        8,
        64,
        64,
        undefined,
        undefined,
        collectStickyIds(zoomedOut, previous),
      ),
      [true, false, true],
    );
  });

  it('collects only visible label ids for hysteresis', () => {
    assert.deepEqual(
      [
        ...collectStickyIds(
          [
            {minX: 0, minY: 0, maxX: 1, maxY: 1, id: 10},
            {minX: 0, minY: 0, maxX: 1, maxY: 1, id: 20},
            {minX: 0, minY: 0, maxX: 1, maxY: 1},
          ],
          [true, false, true],
        ),
      ],
      [10],
    );
  });

  it('keeps a surviving copy visible when the placed copy has left', () => {
    const visibility = [false, false];
    assert.isTrue(
      retainVisibleIdentities(visibility, [7, 7], new Set([7]), [40075016, 0]),
    );
    assert.deepEqual(visibility, [false, true]);
    assert.isFalse(
      retainVisibleIdentities(visibility, [7, 7], new Set([7]), [40075016, 0]),
    );
  });

  it('keeps the earlier sequence when priorities match', () => {
    const visible = resolveDeclutter(
      [
        {
          minX: 0,
          minY: 0,
          maxX: 16,
          maxY: 16,
          priority: 0,
          id: 1,
          sequence: 5,
        },
        {
          minX: 0,
          minY: 0,
          maxX: 16,
          maxY: 16,
          priority: 0,
          id: 9,
          sequence: 1,
        },
      ],
      8,
      64,
      64,
    );
    assert.deepEqual(visible, [false, true]);
  });
});
