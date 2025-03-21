import type { Expression, Identifier } from './syntax';

export enum ValueType {
  String,
  Number,
  Boolean,
  Tuple,
  List,
  Struct,
  Lambda,
  Syscall,
  Thunk,
}

export interface StringValue {
  type: ValueType.String;
  value: string;
}

export interface NumberValue {
  type: ValueType.Number;
  value: number;
}

export interface BooleanValue {
  type: ValueType.Boolean;
  value: boolean;
}

export interface Tuple {
  type: ValueType.Tuple;
  elements: Array<Value>;
}

export interface List {
  type: ValueType.List;
  elements: Array<Value>;
}

export interface Struct {
  type: ValueType.Struct;
  value: Map<string, Value>;
}

export interface Lambda {
  type: ValueType.Lambda;
  environment: Map<string, Value>;
  parameters: Array<Identifier>;
  body: Expression;
}

/**
 * A syscall is a function provided by the runtime. It cannot be defined in
 * the language itself. It must be passed by the host environment.
 */
export interface Syscall {
  type: ValueType.Syscall;
  handler: (
    args: Array<Value>,
    call: (lambda: Lambda, args: Array<Value>) => Value,
  ) => Value;
}

export interface Thunk {
  type: ValueType.Thunk;
  get: () => Value;
}

export type Value =
  | StringValue
  | NumberValue
  | BooleanValue
  | Tuple
  | List
  | Struct
  | Lambda
  | Syscall
  | Thunk;
