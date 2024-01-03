import { NodeType } from './syntax';
import type {
  Identifier,
  StringLiteral,
  NumberLiteral,
  BooleanLiteral,
  TupleExpression,
  ListExpression,
  StructExpression,
  CallExpression,
  BindExpression,
  Expression,
  Binding,
  Location,
  Lambda,
  ConditionalExpression,
  Sandbox,
} from './syntax';
import type { Syscall, Thunk, Value } from './values';
import { ValueType } from './values';

const DEFAULT_LOCATION: Location = {
  start: { row: 1, column: 1 },
  end: { row: 1, column: 1 },
};

export const str = (value: string, location?: Location): StringLiteral => ({
  location: location ?? DEFAULT_LOCATION,
  type: NodeType.StringLiteral,
  value,
});

export const num = (value: number, location?: Location): NumberLiteral => ({
  location: location ?? DEFAULT_LOCATION,
  type: NodeType.NumberLiteral,
  value,
});

export const bool = (value: boolean, location?: Location): BooleanLiteral => ({
  location: location ?? DEFAULT_LOCATION,
  type: NodeType.BooleanLiteral,
  value,
});

export const tuple = (
  elements: Array<Expression>,
  location?: Location,
): TupleExpression => ({
  location: location ?? DEFAULT_LOCATION,
  type: NodeType.TupleExpression,
  elements,
});

export const list = (
  elements: Array<Expression>,
  location?: Location,
): ListExpression => ({
  location: location ?? DEFAULT_LOCATION,
  type: NodeType.ListExpression,
  elements,
});

export const struct = (
  fields: Array<Binding>,
  location?: Location,
): StructExpression => ({
  location: location ?? DEFAULT_LOCATION,
  type: NodeType.StructExpression,
  fields,
});

export const conditional = (
  condition: Expression,
  pass: Expression,
  fail: Expression,
  location?: Location,
): ConditionalExpression => ({
  location: location ?? DEFAULT_LOCATION,
  type: NodeType.ConditionalExpression,
  condition,
  pass,
  fail,
});

export const ident = (name: string, location?: Location): Identifier => ({
  location: location ?? DEFAULT_LOCATION,
  type: NodeType.Identifier,
  contextual: false,
  name,
});

export const context = (name: string, location?: Location): Identifier => ({
  location: location ?? DEFAULT_LOCATION,
  type: NodeType.Identifier,
  contextual: true,
  name,
});

export const lambda = (
  parameters: Array<Identifier>,
  body: Expression,
  location?: Location,
): Lambda => ({
  location: location ?? DEFAULT_LOCATION,
  type: NodeType.Lambda,
  parameters,
  body,
});

export const call = (
  callee: Lambda | Identifier,
  args: Array<Expression>,
  location?: Location,
): CallExpression => ({
  location: location ?? DEFAULT_LOCATION,
  type: NodeType.CallExpression,
  callee,
  arguments: args,
});

export const bind = (
  bindings: Array<Binding>,
  body: Expression,
  location?: Location,
): BindExpression => ({
  location: location ?? DEFAULT_LOCATION,
  type: NodeType.BindExpression,
  bindings,
  body,
});

export const assign = (
  ident: Identifier,
  value: Expression,
  location?: Location,
): Binding => ({
  location: location ?? DEFAULT_LOCATION,
  type: NodeType.Binding,
  identifier: ident,
  value,
});

export const syscall = (handler: Syscall['handler']): Syscall => ({
  type: ValueType.Syscall,
  handler,
});

export const sandbox = (body: Expression, location?: Location): Sandbox => ({
  location: location ?? DEFAULT_LOCATION,
  type: NodeType.Sandbox,
  body,
});

export const thunk = (
  expression: Expression,
  run: (expression: Expression) => Value,
): Thunk => ({
  type: ValueType.Thunk,
  get: (() => {
    let value:
      | { evaluated: false; value: null }
      | { evaluated: true; value: Value } = { evaluated: false, value: null };

    return () => {
      if (!value.evaluated) {
        value = { evaluated: true, value: run(expression) };
      }

      return value.value;
    };
  })(),
});
