const tsickle = require('tsickle');
const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const currentPath = ts.normalizePath(process.cwd());
const projectDir = currentPath;

function getTsConfig(path) {
  const configPath = ts.findConfigFile(currentPath, ts.sys.fileExists);
  const fileReaderFn = path => fs.readFileSync(path, 'utf-8');
  const {config: jsonConfigFileContent, error: jsonConfigFileContentError} =
    ts.readConfigFile(configPath, fileReaderFn);
  if (jsonConfigFileContentError) {
    console.error(jsonConfigFileContentError);
    return null;
  }
  const {options, fileNames, errors: parseErrors} = ts.parseJsonConfigFileContent(
    jsonConfigFileContent, ts.sys, projectDir, {}, configPath);
  if (parseErrors.length > 0) {
    console.error(parseErrors);
    return null;
  }
  return {options, fileNames};
}

function toClosureJS(options, fileNames, settings, rootModulePath, writeFileFn) {
  const absoluteFileNames = fileNames.map(f => path.resolve(f));
  const compilerHost = ts.createCompilerHost(options);
  const program = ts.createProgram(absoluteFileNames, options, compilerHost);
  const filesToProcess = new Set(absoluteFileNames);
  const transformerHostConfig = {
    shouldSkipTsickleProcessing: filename => !filesToProcess.has(path.resolve(filename)),
    shouldIgnoreWarningsForPath: _ => !settings.fatalWarnings,
    pathToModuleName: (context, filename) =>
      tsickle.pathToModuleName(rootModulePath, context, filename),
    fileNameToModuleId: filename => path.relative(rootModulePath, filename),
    es5Mode: true,
    googmodule: false,
    transformDecorators: true,
    transformTypesToClosure: true,
    typeBlackListPaths: new Set(),
    untyped: false,
    logWarning: warning => console.error(ts.formatDiagnostics([warning], compilerHost)),
    options,
    moduleResolutionHost: compilerHost,
  };
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length > 0) {
    return {
      diagnostics,
      modulesManifest: new tsickle.ModulesManifest(),
      externs: {},
      emitSkipped: true,
      emittedFiles: [],
    };
  }
  return tsickle.emit(program, transformerHostConfig, writeFileFn);
}

const tsConfig = getTsConfig(currentPath);
if (!tsConfig) {
  return 'error with config';
}
const {options, fileNames} = tsConfig;

const fileWriterFn = (filepath, contents) => {
  // strip goog.requireType since this relies on the module-form of the code
  // but at the time rollup-gcc-plugin is run, rollup already clumped it to a single file
  const requireTypeStrippedContents = contents.split('\n')
    .filter(line => !line.includes('goog.requireType'))
    .join('\n');
  fs.writeFileSync(filepath, requireTypeStrippedContents, {encoding: 'utf-8'});
  // fs.writeFileSync(filepath, contents, {encoding: 'utf-8'})
};

const result = toClosureJS(options, fileNames, {}, './node_modules',
  fileWriterFn);

if (result.diagnostics.length > 0) {
  console.error(
    ts.formatDiagnostics(result.diagnostics, ts.createCompilerHost(options)));
  return 1;
}
return 0;