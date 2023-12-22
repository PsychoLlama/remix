import type { Expression, Identifier } from './syntax';

export enum ValueType {
  String,
  Number,
  Boolean,
  Tuple,
  Lambda,
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

export interface Lambda {
  type: ValueType.Lambda;
  environment: Map<string, Value>;
  parameters: Array<Identifier>;
  body: Expression;
}

export type Value = StringValue | NumberValue | BooleanValue | Tuple | Lambda;
