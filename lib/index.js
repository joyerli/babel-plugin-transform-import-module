const _ = require('lodash');

const DEFAULT_LIBRARY_NAME = 'element-ui';
const getModuleImport = _.memoize(
  (componentName, alias, source, getModules) => getModules(componentName, alias, source),
  (componentName, alias, source) => componentName + alias + source,
);

module.exports = ({ types }) => {
  const importComponent = (componentName, alias, source, getModules) => {
    const moduleImports = [].concat(getModuleImport(componentName, alias, source, getModules));
    return moduleImports.map(({ moduleId, source: targetSource }) => {
      if (moduleId) {
        const newImportSpecifier = types.importDefaultSpecifier(types.identifier(moduleId));
        return types.importDeclaration(
          [newImportSpecifier],
          types.stringLiteral(targetSource),
        );
      }
      return types.importDeclaration([], types.stringLiteral(targetSource));
    });
  };

  return {
    visitor: {
      ImportDeclaration(path, {
        opts: {
          library = {},
          preventFullImport = true,
        } = {},
      }) {
        const libraryNames = Object.keys(library);
        if (!libraryNames.length) {
          return;
        }

        const { node } = path;
        const source = node.source.value;

        if (!libraryNames.includes(source)) {
          return;
        }

        const libraryOptions = library[source];
        let getModules;
        if (_.isFunction(libraryOptions)) {
          getModules = libraryOptions;
        } else {
          ({ modules: getModules } = libraryOptions);
        }

        const transforms = [];

        const [memberImports, fullImports] = _.partition(node.specifiers || [],
          (specifier) => specifier.type === 'ImportSpecifier');

        if (preventFullImport && (
          _.isEmpty(node.specifiers) || !_.isEmpty(fullImports)
        )) {
          throw path.buildCodeFrameError('Not allowed import all module');
        }

        if (!_.isEmpty(fullImports) && !_.isEmpty(memberImports)) {
          transforms.push(types.importDeclaration(fullImports, types.stringLiteral(source)));
        }

        memberImports.reduce((_transforms, specifier) => {
          const alias = specifier.local.name;
          const componentName = specifier.imported.name;
          const componentTransforms = importComponent(componentName, alias, source, getModules);
          _transforms.push(...componentTransforms);
          return _transforms;
        }, transforms);

        if (transforms.length > 0) {
          path.replaceWithMultiple(transforms);
        }
      },
      ExportNamedDeclaration(path, {
        opts: {
          libraryName = DEFAULT_LIBRARY_NAME,
          preventExport = true,
        } = {},
      }) {
        const { node } = path;
        const importSource = _.get(node, 'source.value');
        if (preventExport && importSource === libraryName) {
          throw path.buildCodeFrameError('Not allowed due to preventExport setting');
        }
      },
    },
  };
};
