import MVT from "../format/MVT";
import {loadFeaturesXhr} from "../featureloader";

const format = new MVT();

self.onmessage = function(event) {
  console.log('Received event in worker', event.data);
  if (event.data.action === 'load') {
    const url = event.data.url;
    loadFeaturesXhr(url, format, (features) => {
      self.postMessage({
        what: 'features',
        url,
        features,
        projection: format.readProjection(),
        extent: format.getLastExtent()
      });
    }, () => {
      self.postMessage({
        what: 'error',
        url
      });
    })();
  }
};
