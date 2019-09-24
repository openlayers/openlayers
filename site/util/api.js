class FunctionDoc {
  constructor(doc) {
    this.name = doc.name;
    this.doc = doc;
  }
}

class TypedefDoc {
  constructor(doc) {
    this.name = doc.name;
    this.doc = doc;
  }
}

class ClassDoc {
  constructor(name) {
    this.name = name;
  }

  processDoc(doc) {
    if (doc.kind === 'class') {
      this.doc = doc;
    }
  }
}

class ModuleDoc {
  constructor(id) {
    this.id = id;

    this.classLookup = {};
    this.classes = [];

    this.functionLookup = {};
    this.functions = [];
  }

  processDoc(doc) {
    if (doc.kind === 'module') {
      this.doc = doc;
      //console.log('processing module: ' + doc.longname)
      return;
    }

    if (doc.kind === 'class') {
      const name = nameFromLongname(doc.longname);
      if (!(name in this.classLookup)) {
        const cls = new ClassDoc(name);
        this.classLookup[name] = cls;
        this.classes.push(cls);
      }

      this.classLookup[name].processDoc(doc);
      return;
    }

    if (doc.kind === 'function') {
      if (nameFromLongname(doc.memberof)) {
        // belongs to a class or other
        return;
      }

      if (doc.name in this.functionLookup) {
        throw new Error(`Duplicate function ${doc.name} in ${this.id}`);
      }

      const func = new FunctionDoc(doc);
      this.functionLookup[doc.name] = func;
      this.functions.push(func);
      return;
    }
  }

  finalize() {
    this.classes.sort(byName);
    this.functions.sort(byName);
    this.visible = this.classes.length > 0 || this.functions.length > 0;
  }

  getExportedName(localName) {
    if (!this.doc || !this.doc.exportMap) {
      throw new Error(`Expected to find export map in module doc: ${this.id}`);
    }

    if (!(localName in this.doc.exportMap)) {
      throw new Error(
        `No local name "${localName}" in export map for module: ${this.id}`
      );
    }

    return this.doc.exportMap[localName];
  }
}

const longnameRE = /^module:(?<module>.*?)([~\.](?<name>\w+)(#(?<member>\w+))?(:(?<type>\w+))?)?$/;

function moduleIDFromLongname(longname) {
  const match = longname.match(longnameRE);
  if (!match) {
    throw new Error(`could not match module id in longname: ${longname}`);
  }
  return match.groups.module;
}

export function nameFromLongname(longname) {
  const match = longname.match(longnameRE);
  if (!match) {
    throw new Error(`could not match name in longname: ${longname}`);
  }
  return match.groups.name;
}

function memberFromLongname(longname) {
  const match = longname.match(longnameRE);
  if (!match) {
    throw new Error(`could not match member in longname: ${longname}`);
  }
  return match.groups.member;
}

function byName(a, b) {
  if (a.name < b.name) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }
  return 0;
}

function byModuleId(a, b) {
  const aParts = a.id.split('/');
  const bParts = b.id.split('/');
  const len = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < len; ++i) {
    if (aParts[i] && bParts[i]) {
      if (aParts[i] < bParts[i]) {
        return -1;
      }
      if (aParts[i] > bParts[i]) {
        return 1;
      }
    } else if (!aParts[i]) {
      return -1;
    } else {
      return 1;
    }
  }
  return 0;
}

class DocHelper {
  constructor(docs) {
    this.moduleLookup = {};
    this.modules = [];

    this.typedefLookup = {};

    docs.forEach(doc => {
      // typedef are indexed by long name
      if (doc.kind === 'typedef') {
        if (doc.name in this.typedefLookup) {
          throw new Error(`Duplicate type definition ${doc.name} in ${this.id}`);
        }

        const type = new TypedefDoc(doc);
        this.typedefLookup[doc.longname] = type;
        return;
      }

      const moduleID = moduleIDFromLongname(doc.longname);
      if (!(moduleID in this.moduleLookup)) {
        const module = new ModuleDoc(moduleID);
        this.moduleLookup[moduleID] = module;
        this.modules.push(module);
      }

      const module = this.moduleLookup[moduleID];
      module.processDoc(doc);
    });

    this.modules.sort(byModuleId);
    this.modules.forEach(module => module.finalize());
  }

  getTypeDef(longName) {
    this.typedefLookup[longName] && console.log(this.typedefLookup[longName]);
    return this.typedefLookup[longName];
  }
}

let cachedDocs;
let cachedHelper;

export function getHelper(docs) {
  if (docs !== cachedDocs) {
    if (cachedDocs) {
      console.warn('creating new doc helper'); // eslint-disable-line
    }
    cachedHelper = new DocHelper(docs);
    cachedDocs = docs;
  }

  return cachedHelper;
}
