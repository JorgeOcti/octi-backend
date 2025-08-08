export interface IBaseCode {
  _id?: any;
  code: string;
  description: string;
  internalCode: string; 
  type:string;
  fileCode:{},
  fileUnit:{},
  
}

export interface ICode extends IBaseCode {
  _id?: any;
  updatedAt: Date;
  createdAt: Date;
}
