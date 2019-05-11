
function getDocs() {
  // TODO: build if not present
  const info = require('./build/api-info.json');

  return info.docs.filter(doc => !doc.ignore && (doc.api || doc.kind === 'module'));
}

function createPages({actions: {createPage}}) {
  createPage({
    path: '/api',
    component: require.resolve('./site/pages/API.js'),
    context: {docs: getDocs()}
  });

  createPage({
    path: '/info',
    component: require.resolve('./site/pages/Info.js'),
    context: {docs: getDocs()}
  });
}

exports.createPages = createPages;
