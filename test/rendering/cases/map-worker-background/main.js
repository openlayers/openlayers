const worker = new Worker(new URL('./map.worker.js', import.meta.url), {
  type: 'module',
});
worker.onerror = (error) => {
  console.error('Worker error: ', error); // eslint-disable-line no-console
  worker.terminate();
};

const handleMessage = ({data: {action, bitmap}}) => {
  if (action !== 'rendered') {
    return;
  }
  const canvas = document.createElement('canvas');
  canvas.height = 256;
  canvas.width = 256;
  canvas.getContext('2d').drawImage(bitmap, 0, 0);
  document.getElementById('map').appendChild(canvas);
  render({
    message: 'draws background in a worker',
  });
  worker.terminate();
};
worker.addEventListener('message', handleMessage);
worker.postMessage({action: 'render'});
