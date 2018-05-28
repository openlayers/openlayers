function getLongModuleName(name) {
  return name.split(/[~\.]/).shift();
}

export function getShortModuleName(longname) {
  return getLongModuleName(longname).slice(7);
}

export function getShortName(longname) {
  return longname.split(/[~\.]/).pop();
}

export function slugify(name) {
  return name.replace(/[#~\.]/g, '-');
}

function getExported(name, exports) {
  const local = getShortName(name);
  for (const exported in exports) {
    if (exports[exported] === local) {
      return exported;
    }
  }
}

export function getModules(info) {
  const moduleLookup = {};
  info.modules.forEach(mod => {
    moduleLookup[mod.name] = {...mod, functions: [], classes: []};
  });

  // extract classes
  const classLookup = {};
  info.symbols.forEach(symbol => {
    const name = symbol.name;
    const parent = symbol.memberof;

    if (symbol.kind === 'class') {
      const mod = moduleLookup[parent];
      if (!mod) {
        throw new Error(
          `No module found for class ${name} with parent ${parent}`
        );
      }
      const cls = {
        ...symbol,
        methods: [],
        properties: [],
        exported: getExported(name, mod.exports)
      };

      mod.classes.push(cls);
      classLookup[name] = cls;
    }
  });

  info.symbols.forEach(symbol => {
    const name = symbol.name;
    const parent = symbol.memberof;

    if (symbol.kind === 'member') {
      if (parent in classLookup) {
        classLookup[parent].properties.push(symbol);
        return;
      }

      // instance property where constructor is not marked @api
      const moduleId = getLongModuleName(name);
      const mod = moduleLookup[moduleId];
      if (!mod) {
        throw new Error(`Unexpected member: ${name}`);
      }

      const cls = {name: parent, methods: [], properties: [symbol]};
      mod.classes.push(cls);
      classLookup[parent] = cls;
      return;
    }

    if (symbol.kind === 'function') {
      if (parent in moduleLookup) {
        moduleLookup[parent].functions.push({
          ...symbol,
          exported: getExported(name, moduleLookup[parent].exports)
        });
        return;
      }

      if (parent in classLookup) {
        classLookup[parent].methods.push(symbol);
        return;
      }

      // method where constructor is not marked @api
      const moduleId = getLongModuleName(name);
      const mod = moduleLookup[moduleId];
      if (!mod) {
        throw new Error(`Unexpected function: ${name}`);
      }

      const cls = {name: parent, methods: [symbol], properties: []};
      mod.classes.push(cls);
      classLookup[parent] = cls;
      return;
    }
  });

  return Object.keys(moduleLookup)
    .sort()
    .map(id => moduleLookup[id]);
}
