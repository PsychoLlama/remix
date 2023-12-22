import type { CompilerMessage, CompilerOutput } from './compiler';
import type { Expression } from './syntax';
import { NodeType } from './syntax';
import type * as T from './values';
import { ValueType } from './values';

export function interpret(program: CompilerOutput): InterpreterOutput {
  return {
    warnings: program.warnings,
    value: run(program.program),
  };
}

function run(expression: Expression): T.Value {
  switch (expression.type) {
    case NodeType.StringLiteral: {
      return {
        type: ValueType.String,
        value: expression.value,
      };
    }

    case NodeType.NumberLiteral: {
      return {
        type: ValueType.Number,
        value: expression.value,
      };
    }

    case NodeType.BooleanLiteral: {
      return {
        type: ValueType.Boolean,
        value: expression.value,
      };
    }

    default: {
      throw new Error(`Unexpected node type: ${expression.type}`);
    }
  }
}

interface InterpreterOutput {
  warnings: Array<CompilerMessage>;
  value: T.Value;
}
