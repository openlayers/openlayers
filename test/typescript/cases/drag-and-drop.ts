import FeatureFormat from '../../../build/ol/format/Feature.js';
import GeoJSON from '../../../build/ol/format/GeoJSON.js';
import DragAndDrop, {
  DragAndDropEvent,
} from '../../../build/ol/interaction/DragAndDrop.js';

const file = new File([], 'features.geojson');
const format = new GeoJSON();

export const legacyEvent = new DragAndDropEvent(
  'addfeatures',
  file,
  [],
  undefined,
);
export const event = new DragAndDropEvent(
  'addfeatures',
  file,
  [],
  undefined,
  format,
);
export const eventFormat: FeatureFormat | undefined = event.format;

const interaction = new DragAndDrop({formatConstructors: [format]});
interaction.on('addfeatures', (event) => {
  const reader: FeatureFormat | undefined = event.format;
  reader?.readFeatures('');
});
