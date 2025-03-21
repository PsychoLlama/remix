import { parseToCst, parseToAst } from '../parser';
import type * as AST from '../syntax';
import { NodeType } from '../syntax';

describe('parser', () => {
  describe('parseToCst', () => {
    it('returns a parse tree', () => {
      const { rootNode } = parseToCst('1');

      expect(rootNode.type).toEqual('source_file');
      expect(rootNode.children).toHaveLength(1);
      expect(rootNode.children[0].type).toBe('number');
    });
  });

  describe('parseToAst', () => {
    it('converts the parse tree into a remix AST', () => {
      const ast = parseToAst('16');

      expect(ast.type).toEqual(NodeType.NumberLiteral);
      expect(ast).toEqual<AST.NumberLiteral>({
        type: NodeType.NumberLiteral,
        value: 16,
        location: {
          start: { row: 0, column: 0 },
          end: { row: 0, column: 2 },
        },
      });
    });

    it('yells if the program cannot be parsed', () => {
      expect(() => parseToAst('!#%#^&')).toThrow(/Unexpected node/);
    });

    it('parses string literals', () => {
      const ast = parseToAst('"hello"');

      expect(ast.type).toEqual(NodeType.StringLiteral);
      expect(ast).toEqual({
        type: NodeType.StringLiteral,
        value: 'hello',
        location: {
          start: { row: 0, column: 0 },
          end: { row: 0, column: 7 },
        },
      });
    });

    it('can parse strings with escape characters', () => {
      const ast = parseToAst('"hello\\nworld"');

      assert(ast.type === NodeType.StringLiteral);
      expect(ast.value).toBe('hello\nworld');
    });

    it('can parse booleans', () => {
      const ast = parseToAst('true');

      assert(ast.type === NodeType.BooleanLiteral);
      expect(ast.value).toBe(true);
    });

    it('can parse tuples', () => {
      const ast = parseToAst('(1, "a", true)');

      assert(ast.type === NodeType.TupleExpression);
      const [first, second, third] = ast.elements;

      assert(first.type === NodeType.NumberLiteral);
      assert(second.type === NodeType.StringLiteral);
      assert(third.type === NodeType.BooleanLiteral);

      expect(first.value).toBe(1);
      expect(second.value).toBe('a');
      expect(third.value).toBe(true);
    });

    it('can parse lexical identifiers', () => {
      const ast = parseToAst('lexical');

      assert(ast.type === NodeType.Identifier);
      expect(ast.name).toBe('lexical');
      expect(ast.contextual).toBe(false);
    });

    it('can parse dynamic identifiers', () => {
      const ast = parseToAst('@dynamic');

      assert(ast.type === NodeType.Identifier);
      expect(ast.name).toBe('dynamic');
      expect(ast.contextual).toBe(true);
    });

    it('can parse conditionals', () => {
      const ast = parseToAst('if true then 1 else "str"');

      assert(ast.type === NodeType.ConditionalExpression);
      assert(ast.condition.type === NodeType.BooleanLiteral);
      assert(ast.pass.type === NodeType.NumberLiteral);
      assert(ast.fail.type === NodeType.StringLiteral);

      expect(ast.condition.value).toBe(true);
      expect(ast.pass.value).toBe(1);
      expect(ast.fail.value).toBe('str');
    });

    it('can parse lambdas', () => {
      const ast = parseToAst('|x| 10');

      assert(ast.type === NodeType.Lambda);
      assert(ast.parameters.length === 1);
      expect(ast.parameters[0].name).toBe('x');

      assert(ast.body.type === NodeType.NumberLiteral);
      expect(ast.body.value).toBe(10);
    });

    it('can parse call expressions', () => {
      const ast = parseToAst('fn 10 "str" ()');

      assert(ast.type === NodeType.CallExpression);
      assert(ast.callee.type === NodeType.Identifier);
      expect(ast.callee.name).toBe('fn');

      expect(ast.arguments).toEqual([
        expect.objectContaining({ type: NodeType.NumberLiteral }),
        expect.objectContaining({ type: NodeType.StringLiteral }),
        expect.objectContaining({ type: NodeType.TupleExpression }),
      ]);
    });

    it('can parse variable bindings', () => {
      const ast = parseToAst('let x = 10, y = x in y');

      assert(ast.type === NodeType.BindExpression);
      assert(ast.bindings.length === 2);
      expect(ast.bindings[0].identifier.name).toBe('x');
      expect(ast.bindings[1].identifier.name).toBe('y');

      assert(ast.body.type === NodeType.Identifier);
      expect(ast.body.name).toBe('y');
    });

    it('can parse sandbox expressions', () => {
      const ast = parseToAst('sandbox fn ()');

      assert(ast.type === NodeType.Sandbox);
      assert(ast.body.type === NodeType.CallExpression);
    });
  });
});
