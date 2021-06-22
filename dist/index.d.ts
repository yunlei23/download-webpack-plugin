import { AxiosRequestConfig } from "axios";
import { sources, Compiler, Asset } from "webpack";
import { IDownload, IDownloadWebpackPlugin, IOption } from "./types";
export declare class DownloadWebpackPlugin implements IDownloadWebpackPlugin {
    userOption: IOption;
    downloads: IDownload[];
    constructor(options: IOption);
    apply(compiler: Compiler): void;
    changeDownloadStatus(i: number, status: IDownload["status"]): void;
    getDownloadSource(url: string, webpack: Compiler["webpack"], options?: AxiosRequestConfig): Promise<any>;
    hookDownloadInCompiler(compiler: Compiler, download: IDownload): void;
    getTargetAsset(assets: Asset[], targetTemplate?: string): Asset | undefined;
    getInjectedTemplateSourceData(source: sources.Source, download: IDownload): string;
    hookDownloadInject(compiler: Compiler, download: IDownload): void;
}
//# sourceMappingURL=index.d.ts.map