import axios, { AxiosRequestConfig } from "axios";
import { assert } from "console";
import { findIndex, uniqBy } from "lodash";
import { v4 as uuidv4 } from "uuid";
import { sources, Compilation, Compiler, Asset } from "webpack";
import { IDownload, IDownloadWebpackPlugin, IOption } from "./types";
import path from "path";

const pluginName = "DownloadWebpackPlugin";

export class DownloadWebpackPlugin implements IDownloadWebpackPlugin {
  userOption: IOption;
  downloads: IDownload[];

  constructor(options: IOption) {
    this.userOption = options || {};
    this.downloads = [];
  }

  apply(compiler: Compiler): void {
    compiler.hooks.initialize.tap(pluginName, async () => {
      const { filePath, autoInject, template, assets } = this.userOption;

      /* check option */
      assert(
        filePath === undefined || typeof filePath === "string",
        'filePath need to be set to "string" or "null",default is "webpack.output.path"'
      );
      assert(
        autoInject === undefined || typeof autoInject === "boolean",
        'autoInject need to be set to "boolean" or "null",default is "true"'
      );
      assert(
        template === undefined || typeof template === "string",
        'template need to be set to "string" or "null",default is "index.html"'
      );
      assert(assets && assets.length > 0, "assets need to be set");

      /* default option */
      const defaultOption: Omit<IOption, "assets"> = {
        filePath: filePath || "",
        autoInject: autoInject || true,
        template: template || "index.html",
      };

      const downloads: IDownload[] = uniqBy(assets, "url").map((it, index) => ({
        index,
        status: "PENDING",
        url: it.url,
        filePath: it.filePath || defaultOption.filePath,
        autoInject: it.autoInject || defaultOption.autoInject,
        template: it.template || defaultOption.template,
        fileName: it.fileName || getRandomFileName(),
      }));

      this.downloads = downloads;
      downloads.forEach((option) => {
        this.hookDownloadInCompiler(compiler, option);
        this.hookDownloadInject(compiler, option);
      });
    });
  }

  changeDownloadStatus(i: number, status: IDownload["status"]) {
    this.downloads[i].status = status;
  }

  async getDownloadSource(
    url: string,
    webpack: Compiler["webpack"],
    options?: AxiosRequestConfig
  ): Promise<any> {
    const response = await axios.get(url, options);
    const { data } = response;
    return new webpack.sources.RawSource(data);
  }

  hookDownloadInCompiler(compiler: Compiler, download: IDownload) {
    /* tapHook processAssets*/
    compiler.hooks.thisCompilation.tap(
      pluginName,
      (compilation: Compilation) => {
        compilation.hooks.processAssets.tapAsync(
          {
            name: pluginName,
            stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
          },
          async (_assets, cb) => {
            const { fileName = "", filePath = "", url, index } = download;
            try {
              const source = await this.getDownloadSource(
                url,
                compiler.webpack
              );
              compilation.emitAsset(path.join(filePath, fileName), source);
              this.changeDownloadStatus(index, "SUCCESS");
              cb();
            } catch (error) {
              this.changeDownloadStatus(index, "FAIL");
              throw error;
            }
          }
        );
      }
    );
  }

  getTargetAsset(assets: Asset[], targetTemplate?: string): Asset | undefined {
    if (!assets || !assets.length || !targetTemplate) return;
    const templateIndex = findIndex(assets, { name: targetTemplate });
    return assets[templateIndex];
  }

  getInjectedTemplateSourceData(source: sources.Source, download: IDownload) {
    const { filePath = "", fileName = "" } = download;
    const originSource = source.source().toLocaleString();
    const scriptLink = `<script src='${path.join(
      filePath,
      fileName
    )}'></script>`;
    const headerSplit = originSource.split("</head>");
    const [prevHeader, afterHeader, ...rest] = headerSplit;
    const newSource = `${prevHeader}${scriptLink}</head>${afterHeader}${
      rest && rest.join("")
    }`;
    return newSource;
  }

  hookDownloadInject(compiler: Compiler, download: IDownload) {
    if (!download.autoInject) return;
    compiler.hooks.thisCompilation.tap(
      pluginName,
      (compilation: Compilation) => {
        compilation.hooks.processAssets.tapAsync(
          {
            name: pluginName,
            stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
          },
          (_assets, cb) => {
            if (!download.template || download.status !== "SUCCESS") return;
            const templateSource = _assets[download.template];
            if (!templateSource) return;
            const newTemplateSourceData = this.getInjectedTemplateSourceData(
              templateSource,
              download
            );
            const newTemplateSource = new compiler.webpack.sources.RawSource(
              newTemplateSourceData
            );
            compilation.updateAsset(download.template, newTemplateSource);
            cb();
          }
        );
      }
    );
  }
}

const DEFAULT_FILE_TYPE = "js";
function getRandomFileName() {
  return `download-${uuidv4()}.${DEFAULT_FILE_TYPE}`;
}
