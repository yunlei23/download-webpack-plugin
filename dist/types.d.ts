import { AxiosRequestConfig } from "axios";
import { Compiler } from "webpack";
export interface IAsset {
    url: string;
    filePath?: string;
    autoInject?: boolean;
    template?: string;
    fileName?: string;
}
export interface IDownload extends IAsset {
    index: number;
    status: "PENDING" | "SUCCESS" | "FAIL";
}
export interface IOption {
    filePath?: string;
    autoInject?: boolean;
    template?: string;
    assets: IAsset[];
}
export interface IDownloadWebpackPlugin {
    userOption: IOption;
    downloads: IDownload[];
    apply(compiler: Compiler): void;
    hookDownloadInCompiler(compiler: Compiler, downloads: IDownload): void;
    getDownloadSource(url: string, webpack: Compiler["webpack"], options?: AxiosRequestConfig): Promise<any>;
    changeDownloadStatus(i: number, status: IDownload["status"]): void;
}
//# sourceMappingURL=types.d.ts.map