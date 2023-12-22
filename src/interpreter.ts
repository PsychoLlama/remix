import type { CompilerMessage, CompilerOutput } from './compiler';
import type { Expression } from './syntax';
import { NodeType } from './syntax';
import type * as T from './values';
import { ValueType } from './values';

export function interpret(
  program: CompilerOutput,
  { bindings = new Map() }: InterpreterOptions = {},
): InterpreterOutput {
  return {
    warnings: program.warnings,
    value: run(program.program, {
      environment: bindings,
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
        throw new RuntimeError(
          `Could not resolve identifier "${expression.name}"`,
        );
      }

      return value;
    }

    case NodeType.Lambda: {
      return {
        type: ValueType.Lambda,
        environment: context.environment,
        parameters: expression.parameters,
        body: expression.body,
      };
    }

    case NodeType.CallExpression: {
      const callee = run(expression.callee, context);

      if (callee.type !== ValueType.Lambda) {
        throw new RuntimeError(
          `Attempted to call a non-lambda value: ${ValueType[callee.type]}`,
        );
      }

      if (callee.parameters.length !== expression.arguments.length) {
        throw new ArityMismatchError(
          callee.parameters.length,
          expression.arguments.length,
        );
      }

      const args = callee.parameters.map(
        (param, index) =>
          [param.name, run(expression.arguments[index], context)] as const,
      );

      return run(callee.body, {
        ...context,
        environment: new Map([...callee.environment, ...args]),
      });
    }

    default: {
      throw new InternalError(
        `Unexpected node type: ${(expression as Expression).type}`,
      );
    }
  }
}

interface InterpreterOptions {
  bindings?: Map<string, T.Value>;
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

/** These indicate a program bug. Many would be caught by a type system. */
class RuntimeError extends Error {
  name = 'RuntimeError';
}

class ArityMismatchError extends RuntimeError {
  name = 'ArityMismatchError';
  constructor(
    public expected: number,
    public actual: number,
  ) {
    super('Lambda called with incorrect number of arguments');
  }
}
