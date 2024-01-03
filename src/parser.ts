import Parser from 'tree-sitter';
import remixGrammar from 'tree-sitter-remix';
import type * as AST from './syntax';
import * as build from './builders';

const parser = new Parser();
parser.setLanguage(remixGrammar);

declare module 'tree-sitter' {
  export interface SyntaxNode {
    parametersNodes: Array<Parser.SyntaxNode>;
    bodyNodes: Array<Parser.SyntaxNode>;
  }
}

export const parseToCst = (input: string): Parser.Tree => {
  return parser.parse(input);
};

export const parseToAst = (input: string): AST.Expression => {
  const cst = parseToCst(input);
  return parseRecursively(cst.rootNode);
};

const parseRecursively = (node: Parser.SyntaxNode): AST.Expression => {
  switch (node.type) {
    case 'source_file': {
      if (node.children.length !== 1) {
        throw new ParseError('Programs must have exactly one expression');
      }

      return parseRecursively(node.children[0]);
    }

    case 'boolean': {
      return build.bool(node.text === 'true', node);
    }

    case 'number': {
      return build.num(Number(node.text), node);
    }

    // NOTE: This won't work for all escape characters. It's a hack.
    case 'string': {
      const rawString = node.children.map((n) => n.text).join('');
      return build.str(JSON.parse(rawString), node);
    }

    case 'tuple': {
      return build.tuple(
        node.children.filter((n) => n.isNamed).map(parseRecursively),
        node,
      );
    }

    case 'identifier': {
      return build.ident(node.text, node);
    }

    case 'condition': {
      const [condition, pass, fail] = node.children
        .filter((n) => n.isNamed)
        .map(parseRecursively);

      return build.conditional(condition, pass, fail, node);
    }

    case 'lambda': {
      const body = parseRecursively(node.bodyNodes[0]);
      const parameters = node.parametersNodes.map((node) =>
        build.ident(node.text, node),
      );

      return build.lambda(parameters, body, node);
    }

    default: {
      throw new ParseError(`Unknown node type: ${node.type}`);
    }
  }
};

class ParseError extends Error {
  name = 'ParseError';
}
