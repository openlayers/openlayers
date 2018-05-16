import React, {Component} from 'react';

import info from '../../../build/info.json';

const modules = [];
const moduleLookup = {};
info.modules.forEach(mod => {
  moduleLookup[mod.path] = mod;
  modules.push(mod);
});

info.symbols.forEach(symbol => {
  const mod = moduleLookup[symbol.path];
  if (!mod) {
    throw new Error(`No module for symbol ${symbol.name}`);
  }
  const kind = symbol.kind;
  if (!mod[kind]) {
    mod[kind] = [];
  }
  mod[kind].push(symbol);
});

function getModuleName(longname) {
  return longname.slice(7);
}

function getClassName(longname) {
  return longname.split('~').pop();
}

function slugify(name) {
  return name.replace(/[#~\.]/g, '-');
}

class Docs extends Component {
  renderModule = mod => {
    const slug = slugify(mod.name);
    return (
      <section key={mod.name}>
        <a name={slug} href={`#${slug}`}>
          <h1>{getModuleName(mod.name)}</h1>
          <h2>Classes</h2>
          {mod.class.map(cls => this.renderClass(cls, mod))}
        </a>
      </section>
    );
  };

  renderClass(cls, mod) {
    return (
      <p key={cls.name}>
        <code>
          import {getClassName(cls.name)} from &apos;{getModuleName(mod.name)}&apos;;
        </code>
      </p>
    );
  }

  render() {
    return (
      <div>{modules.filter(mod => !!mod.class).map(this.renderModule)}</div>
    );
  }
}

export default Docs;
