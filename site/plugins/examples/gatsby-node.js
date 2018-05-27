const path = require('path');
const {createFilePath} = require('gatsby-source-filesystem');
const rollup = require('rollup');
const resolve = require('rollup-plugin-node-resolve');
const common = require('rollup-plugin-commonjs');
const fse = require('fs-extra');
const compileTemplate = require('string-template/compile');

let rollupCache;
const rollupPlugins = [resolve(), common()];

let olCss;
async function getOLCss() {
  if (olCss) {
    return olCss;
  }
  const cssPath = path.join(__dirname, '..', '..', '..', 'css', 'ol.css');
  olCss = await fse.readFile(cssPath, {encoding: 'utf8'});
  return olCss;
}

let embedTemplate;
async function getEmbedTemplate() {
  if (embedTemplate) {
    return embedTemplate;
  }
  const embedPath = path.join(__dirname, 'embed.html');
  const src = await fse.readFile(embedPath, {encoding: 'utf8'});
  embedTemplate = compileTemplate(src);
  return embedTemplate;
}

exports.onCreateNode = ({node, getNode, boundActionCreators}) => {
  const {createNodeField} = boundActionCreators;
  if (node.internal.type === 'MarkdownRemark') {
    const slug = createFilePath({node, getNode});
    createNodeField({
      node,
      name: 'slug',
      value: `/examples${slug}` // TODO: get this from options
    });
  }
};

exports.createPages = async (
  {graphql, boundActionCreators},
  {sourceInstanceName, baseCss = ''}
) => {
  const {createPage, createRedirect} = boundActionCreators;

  createRedirect({
    fromPath: `/examples/`,
    isPermanent: true,
    redirectInBrowser: true,
    toPath: `/examples/map/`
  });

  const {data} = await graphql(`
    {
      allFile(
        filter: {sourceInstanceName: {eq: "${sourceInstanceName}"}, extension: {ne: ""}}
      ) {
        edges {
          node {
            base
            name
            extension
            absolutePath
            childMarkdownRemark {
              frontmatter {
                title
              }
              fields {
                slug
              }
              html
            }
          }
        }
      }
    }
  `);

  const rollupInputs = [];

  const examples = {};
  data.allFile.edges.forEach(({node}) => {
    const name = node.name;
    if (!(name in examples)) {
      examples[name] = {};
    }
    examples[name][node.extension] = node;
    if (node.extension === 'js') {
      rollupInputs.push(node.absolutePath);
    }
  });

  const bundle = await rollup.rollup({
    input: rollupInputs,
    plugins: rollupPlugins,
    experimentalCodeSplitting: true,
    cache: rollupCache
  });

  const embedDirName = 'example-embeds';
  const embedDir = path.join(__dirname, '..', '..', 'public', embedDirName);
  const exampleDir = path.join(__dirname, '..', '..', 'public', 'examples');

  rollupCache = await bundle.write({
    format: 'es',
    sourcemap: true,
    dir: embedDir
  });

  const writes = [];
  const index = {};

  for (const name in examples) {
    const node = examples[name].md;
    if (!node) {
      throw new Error(`Missing ${name}.md`);
    }
    const markdownNode = node.childMarkdownRemark;
    if (!markdownNode) {
      throw new Error(`Expected a MarkdownRemark node for ${name}`);
    }

    const mainBundleUrl = `${name}.js`;
    const bundleInfo = rollupCache[mainBundleUrl];
    if (!bundleInfo) {
      throw new Error(`Expected a js bundle for ${name}`);
    }

    const jsNode = examples[name].js;
    if (!jsNode) {
      throw new Error(`Missing ${name}.js`);
    }

    const moduleIndex = bundleInfo.map.sources.findIndex(
      filepath => path.resolve(filepath) === jsNode.absolutePath
    );
    if (moduleIndex < 0) {
      throw new Error(`Could not find ${node.absolutePath} in module list`);
    }
    const source = bundleInfo.map.sourcesContent[moduleIndex];
    if (!source) {
      throw new Error(`Could not find source for ${jsNode.absolutePath}`);
    }

    let exampleCss = '';
    const cssNode = examples[name].css;
    if (cssNode) {
      exampleCss = await fse.readFile(cssNode.absolutePath, {encoding: 'utf8'});
      await fse.writeFile(path.join(embedDir, cssNode.base), exampleCss);
    }

    const embedTemplate = await getEmbedTemplate();
    const embed = embedTemplate({
      title: markdownNode.frontmatter.title,
      baseCss,
      olCss: await getOLCss(),
      exampleCss,
      html: markdownNode.html,
      mainBundleUrl
    });

    const embedName = `${name}.html`;
    writes.push(fse.writeFile(path.join(embedDir, embedName), embed));

    const slug = markdownNode.fields.slug;
    index[name] = {
      title: markdownNode.frontmatter.title,
      slug
    };

    createPage({
      path: slug,
      component: path.join(__dirname, 'components', 'Example.js'),
      context: {
        slug,
        frontmatter: markdownNode.frontmatter,
        embedUrl: `/${embedDirName}/${embedName}`,
        html: markdownNode.html,
        js: source.replace(/'\.\.\/\.\.\/\.\.\/src\/(.*?)\.js/g, "'$1"),
        css: exampleCss
      }
    });
  }

  await fse.ensureDir(exampleDir);

  writes.push(
    fse.writeFile(path.join(exampleDir, 'index.json'), JSON.stringify(index))
  );

  await Promise.all(writes);
};
