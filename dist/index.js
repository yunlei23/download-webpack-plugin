"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DownloadWebpackPlugin = void 0;

var _axios = _interopRequireDefault(require("axios"));

var _console = require("console");

var _lodash = require("lodash");

var _uuid = require("uuid");

var _webpack = require("webpack");

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const pluginName = "DownloadWebpackPlugin";

class DownloadWebpackPlugin {
  constructor(options) {
    this.userOption = options || {};
    this.downloads = [];
  }

  apply(compiler) {
    compiler.hooks.initialize.tap(pluginName, async () => {
      const {
        filePath,
        autoInject,
        template,
        assets
      } = this.userOption;
      /* check option */

      (0, _console.assert)(filePath === undefined || typeof filePath === "string", 'filePath need to be set to "string" or "null",default is "webpack.output.path"');
      (0, _console.assert)(autoInject === undefined || typeof autoInject === "boolean", 'autoInject need to be set to "boolean" or "null",default is "true"');
      (0, _console.assert)(template === undefined || typeof template === "string", 'template need to be set to "string" or "null",default is "index.html"');
      (0, _console.assert)(assets && assets.length > 0, "assets need to be set");
      /* default option */

      const defaultOption = {
        filePath: filePath || "",
        autoInject: autoInject || true,
        template: template || "index.html"
      };
      const downloads = (0, _lodash.uniqBy)(assets, "url").map((it, index) => ({
        index,
        status: "PENDING",
        url: it.url,
        filePath: it.filePath || defaultOption.filePath,
        autoInject: it.autoInject || defaultOption.autoInject,
        template: it.template || defaultOption.template,
        fileName: it.fileName || getRandomFileName()
      }));
      this.downloads = downloads;
      downloads.forEach(option => {
        this.hookDownloadInCompiler(compiler, option);
        this.hookDownloadInject(compiler, option);
      });
    });
  }

  changeDownloadStatus(i, status) {
    this.downloads[i].status = status;
  }

  async getDownloadSource(url, webpack, options) {
    const response = await _axios.default.get(url, options);
    const {
      data
    } = response;
    return new webpack.sources.RawSource(data);
  }

  hookDownloadInCompiler(compiler, download) {
    /* tapHook processAssets*/
    compiler.hooks.thisCompilation.tap(pluginName, compilation => {
      compilation.hooks.processAssets.tapAsync({
        name: pluginName,
        stage: _webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
      }, async (_assets, cb) => {
        const {
          fileName = "",
          filePath = "",
          url,
          index
        } = download;

        try {
          const source = await this.getDownloadSource(url, compiler.webpack);
          compilation.emitAsset(_path.default.join(filePath, fileName), source);
          this.changeDownloadStatus(index, "SUCCESS");
          cb();
        } catch (error) {
          this.changeDownloadStatus(index, "FAIL");
          throw error;
        }
      });
    });
  }

  getTargetAsset(assets, targetTemplate) {
    if (!assets || !assets.length || !targetTemplate) return;
    const templateIndex = (0, _lodash.findIndex)(assets, {
      name: targetTemplate
    });
    return assets[templateIndex];
  }

  getInjectedTemplateSourceData(source, download) {
    const {
      filePath = "",
      fileName = ""
    } = download;
    const originSource = source.source().toLocaleString();
    const scriptLink = `<script src='${_path.default.join(filePath, fileName)}'></script>`;
    const headerSplit = originSource.split("</head>");
    const [prevHeader, afterHeader, ...rest] = headerSplit;
    const newSource = `${prevHeader}${scriptLink}</head>${afterHeader}${rest && rest.join("")}`;
    return newSource;
  }

  hookDownloadInject(compiler, download) {
    if (!download.autoInject) return;
    compiler.hooks.thisCompilation.tap(pluginName, compilation => {
      compilation.hooks.processAssets.tapAsync({
        name: pluginName,
        stage: _webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE
      }, (_assets, cb) => {
        if (!download.template || download.status !== "SUCCESS") return;
        const templateSource = _assets[download.template];
        if (!templateSource) return;
        const newTemplateSourceData = this.getInjectedTemplateSourceData(templateSource, download);
        const newTemplateSource = new compiler.webpack.sources.RawSource(newTemplateSourceData);
        compilation.updateAsset(download.template, newTemplateSource);
        cb();
      });
    });
  }

}

exports.DownloadWebpackPlugin = DownloadWebpackPlugin;
const DEFAULT_FILE_TYPE = "js";

function getRandomFileName() {
  return `download-${(0, _uuid.v4)()}.${DEFAULT_FILE_TYPE}`;
}
//# sourceMappingURL=index.js.map