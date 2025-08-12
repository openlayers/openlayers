import Group from '../../../build/ol/layer/Group.js';

const group = new Group();
group.on('change', () => {});
group.on('addlayer', (evt) => evt.layer);
group.on('removelayer', (evt) => evt.layer);
group.on(['addlayer', 'removelayer', 'change:layers'], () => {});
