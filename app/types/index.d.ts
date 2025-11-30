type ID = string;

type ISOTimeStamp = string;

type Edit<T extends object, Key, Type> = {
  [K in keyof T]: K extends Key ? Type : T[K];
};

type Extend<T, O> = T & O;

type Tuple<T extends Array<any>> = Readonly<[...T]>;

type Digit = `${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`;

type Falsy = false | 0 | "" | null | undefined;
