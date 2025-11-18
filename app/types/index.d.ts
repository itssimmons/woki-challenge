type ID = string;

type Timestamp = string;

type Edit<T extends object, Key, Type> = {
  [K in keyof T]: K extends Key ? Type : T[K];
};

type Extend<T, O> = T & O;
