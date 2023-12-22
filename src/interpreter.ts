import type { CompilerMessage, CompilerOutput } from './compiler';
import type { Expression } from './syntax';
import { NodeType } from './syntax';
import type * as T from './values';
import { ValueType } from './values';

export function interpret(program: CompilerOutput): InterpreterOutput {
  return {
    warnings: program.warnings,
    value: run(program.program, {
      environment: new Map(),
    }),
  };
}

function run(expression: Expression, context: EvaluationContext): T.Value {
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

    case NodeType.BindExpression: {
      // Evaluate the bindings in order, adding them to the environment.
      const contextWithBindings = expression.bindings.reduce(
        (layeredContext, binding) => ({
          ...layeredContext,
          environment: new Map([
            ...layeredContext.environment,
            [binding.identifier.name, run(binding.value, layeredContext)],
          ]),
        }),
        context,
      );

      return run(expression.body, contextWithBindings);
    }

    case NodeType.Identifier: {
      const value = context.environment.get(expression.name);

      // This should be caught by the compiler before it can get here.
      if (value === undefined) {
        throw new InternalError(
          `Could not resolve identifier "${expression.name}"`,
        );
      }

      return value;
    }

    default: {
      throw new InternalError(`Unexpected node type: ${expression.type}`);
    }
  }
}

interface InterpreterOutput {
  warnings: Array<CompilerMessage>;
  value: T.Value;
}

interface EvaluationContext {
  /** Any variables in scope. */
  environment: Map<string, T.Value>;
}

/** These indicate a language bug. */
class InternalError extends Error {
  name = 'InternalError';
}
