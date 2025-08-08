

interface IIFile {
  url: string;
  type: string;
  name: string;
  size: number;
}

export interface ICodeFile {
  _id?: any;
  file: IIFile;
}
