import { AxiosRequestConfig } from "axios";
import { Compiler, Compilation, Asset } from "webpack";

/* 资源定义 */
export interface IAsset {
  /* 资源地址 */
  url: string;
  filePath?: string;
  autoInject?: boolean;
  template?: string;
  /* 文件名称 */
  fileName?: string;
}

export interface IDownload extends IAsset {
  index: number;
  status: "PENDING" | "SUCCESS" | "FAIL";
}

export interface IOption {
  /* 资源打包后，相对于output的输出路径,默认即为 output.path */
  filePath?: string;
  /* 是否插入模板 Html，默认 true */
  autoInject?: boolean;
  /* 模板 html 路径，默认 index.html*/
  template?: string;
  assets: IAsset[];
}

export interface IDownloadWebpackPlugin {
  userOption: IOption;
  downloads: IDownload[];

  apply(compiler: Compiler): void;
  hookDownloadInCompiler(compiler: Compiler, downloads: IDownload): void;

  getDownloadSource(
    url: string,
    webpack: Compiler["webpack"],
    options?: AxiosRequestConfig
  ): Promise<any>;

  changeDownloadStatus(i: number, status: IDownload["status"]): void;
}
