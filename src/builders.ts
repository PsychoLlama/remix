import type { SyntaxNode } from 'tree-sitter';
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

const getLocation = (node: undefined | SyntaxNode): Location => {
  if (node === undefined) {
    return DEFAULT_LOCATION;
  }

  return {
    start: node.startPosition,
    end: node.endPosition,
  };
};

export const str = (value: string, node?: SyntaxNode): StringLiteral => ({
  location: getLocation(node),
  type: NodeType.StringLiteral,
  value,
});

export const num = (value: number, node?: SyntaxNode): NumberLiteral => ({
  location: getLocation(node),
  type: NodeType.NumberLiteral,
  value,
});

export const bool = (value: boolean, node?: SyntaxNode): BooleanLiteral => ({
  location: getLocation(node),
  type: NodeType.BooleanLiteral,
  value,
});

export const tuple = (
  elements: Array<Expression>,
  node?: SyntaxNode,
): TupleExpression => ({
  location: getLocation(node),
  type: NodeType.TupleExpression,
  elements,
});

export const list = (
  elements: Array<Expression>,
  node?: SyntaxNode,
): ListExpression => ({
  location: getLocation(node),
  type: NodeType.ListExpression,
  elements,
});

export const struct = (
  fields: Array<Binding>,
  node?: SyntaxNode,
): StructExpression => ({
  location: getLocation(node),
  type: NodeType.StructExpression,
  fields,
});

export const conditional = (
  condition: Expression,
  pass: Expression,
  fail: Expression,
  node?: SyntaxNode,
): ConditionalExpression => ({
  location: getLocation(node),
  type: NodeType.ConditionalExpression,
  condition,
  pass,
  fail,
});

export const ident = (name: string, node?: SyntaxNode): Identifier => ({
  location: getLocation(node),
  type: NodeType.Identifier,
  contextual: false,
  name,
});

export const context = (name: string, node?: SyntaxNode): Identifier => ({
  location: getLocation(node),
  type: NodeType.Identifier,
  contextual: true,
  name,
});

export const lambda = (
  parameters: Array<Identifier>,
  body: Expression,
  node?: SyntaxNode,
): Lambda => ({
  location: getLocation(node),
  type: NodeType.Lambda,
  parameters,
  body,
});

export const call = (
  callee: Lambda | Identifier,
  args: Array<Expression>,
  node?: SyntaxNode,
): CallExpression => ({
  location: getLocation(node),
  type: NodeType.CallExpression,
  callee,
  arguments: args,
});

export const bind = (
  bindings: Array<Binding>,
  body: Expression,
  node?: SyntaxNode,
): BindExpression => ({
  location: getLocation(node),
  type: NodeType.BindExpression,
  bindings,
  body,
});

export const assign = (
  ident: Identifier,
  value: Expression,
  node?: SyntaxNode,
): Binding => ({
  location: getLocation(node),
  type: NodeType.Binding,
  identifier: ident,
  value,
});

export const syscall = (handler: Syscall['handler']): Syscall => ({
  type: ValueType.Syscall,
  handler,
});

export const sandbox = (body: Expression, node?: SyntaxNode): Sandbox => ({
  location: getLocation(node),
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
