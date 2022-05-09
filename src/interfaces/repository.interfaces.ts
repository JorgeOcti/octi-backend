export interface IWrite<T> {
  create(item: Partial<T>): Promise<boolean>;

  update(id: string, fieldsToUpdate: Partial<T>): Promise<boolean>;

  delete(id: string): Promise<boolean>;
}

export interface IRead<T> {
  find(item: Partial<T>): Promise<T[]>;

  findOne(id: string): Promise<T>;
}
