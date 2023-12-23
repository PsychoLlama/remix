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
import type { Syscall } from './values';
import { ValueType } from './values';

// Assumes the call stack is:
// <program> -> <builder> -> getLocation()
const getLocation = (): Location => {
  const { stack } = new Error();
  const source = stack!.split('\n')[3].split(/\s+/).at(-1);
  const chunks = source!.split(':');
  const [line, column] = chunks.slice(-2).map(Number);
  const file = chunks.slice(0, -2).join(':');

  return { file, line, column };
};

export const str = (value: string): StringLiteral => ({
  location: getLocation(),
  type: NodeType.StringLiteral,
  value,
});

export const num = (value: number): NumberLiteral => ({
  location: getLocation(),
  type: NodeType.NumberLiteral,
  value,
});

export const bool = (value: boolean): BooleanLiteral => ({
  location: getLocation(),
  type: NodeType.BooleanLiteral,
  value,
});

export const tuple = (elements: Array<Expression>): TupleExpression => ({
  location: getLocation(),
  type: NodeType.TupleExpression,
  elements,
});

export const list = (elements: Array<Expression>): ListExpression => ({
  location: getLocation(),
  type: NodeType.ListExpression,
  elements,
});

export const struct = (fields: Array<Binding>): StructExpression => ({
  location: getLocation(),
  type: NodeType.StructExpression,
  fields,
});

export const conditional = (
  condition: Expression,
  pass: Expression,
  fail: Expression,
): ConditionalExpression => ({
  location: getLocation(),
  type: NodeType.ConditionalExpression,
  condition,
  pass,
  fail,
});

export const ident = (name: string): Identifier => ({
  location: getLocation(),
  type: NodeType.Identifier,
  contextual: false,
  name,
});

export const context = (name: string): Identifier => ({
  location: getLocation(),
  type: NodeType.Identifier,
  contextual: true,
  name,
});

export const lambda = (
  parameters: Array<Identifier>,
  body: Expression,
): Lambda => ({
  location: getLocation(),
  type: NodeType.Lambda,
  parameters,
  body,
});

export const call = (
  callee: Lambda | Identifier,
  args: Array<Expression>,
): CallExpression => ({
  location: getLocation(),
  type: NodeType.CallExpression,
  callee,
  arguments: args,
});

export const bind = (
  bindings: Array<Binding>,
  body: Expression,
): BindExpression => ({
  location: getLocation(),
  type: NodeType.BindExpression,
  bindings,
  body,
});

export const assign = (ident: Identifier, value: Expression): Binding => ({
  location: getLocation(),
  type: NodeType.Binding,
  identifier: ident,
  value,
});

export const syscall = (handler: Syscall['handler']): Syscall => ({
  type: ValueType.Syscall,
  handler,
});

export const sandbox = (body: Expression): Sandbox => ({
  location: getLocation(),
  type: NodeType.Sandbox,
  body,
});
