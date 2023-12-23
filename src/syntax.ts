export enum NodeType {
  Identifier,
  StringLiteral,
  NumberLiteral,
  BooleanLiteral,
  TupleExpression,
  ListExpression,
  StructExpression,
  ConditionalExpression,
  CallExpression,
  BindExpression,
  Binding,
  Lambda,
}

export interface Location {
  file: string;
  line: number;
  column: number;
}

export interface AstNode {
  location: Location;
  type: NodeType;
}

export interface Identifier extends AstNode {
  type: NodeType.Identifier;
  contextual: boolean;
  name: string;
}

export interface StringLiteral extends AstNode {
  type: NodeType.StringLiteral;
  value: string;
}

export interface NumberLiteral extends AstNode {
  type: NodeType.NumberLiteral;
  value: number;
}

export interface BooleanLiteral extends AstNode {
  type: NodeType.BooleanLiteral;
  value: boolean;
}

export interface TupleExpression extends AstNode {
  type: NodeType.TupleExpression;
  elements: Array<Expression>;
}

export interface ListExpression extends AstNode {
  type: NodeType.ListExpression;
  elements: Array<Expression>;
}

export interface StructExpression extends AstNode {
  type: NodeType.StructExpression;
  fields: Array<Binding>;
}

export interface ConditionalExpression extends AstNode {
  type: NodeType.ConditionalExpression;
  condition: Expression;
  pass: Expression;
  fail: Expression;
}

export interface CallExpression extends AstNode {
  type: NodeType.CallExpression;
  callee: Identifier | Lambda;
  arguments: Array<Expression>;
}

export interface BindExpression extends AstNode {
  type: NodeType.BindExpression;
  bindings: Array<Binding>;
  body: Expression;
}

export interface Binding extends AstNode {
  type: NodeType.Binding;
  identifier: Identifier;
  value: Expression;
}

export interface Lambda extends AstNode {
  type: NodeType.Lambda;
  parameters: Array<Identifier>;
  body: Expression;
}

export type Expression =
  | Identifier
  | StringLiteral
  | NumberLiteral
  | BooleanLiteral
  | TupleExpression
  | ListExpression
  | StructExpression
  | ConditionalExpression
  | CallExpression
  | BindExpression
  | Lambda;
