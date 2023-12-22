export enum ValueType {
  String,
  Number,
  Boolean,
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

export type Value = StringValue | NumberValue | BooleanValue;
