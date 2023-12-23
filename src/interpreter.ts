import { thunk } from './builders';
import type { CompilerMessage, CompilerOutput } from './compiler';
import type * as A from './syntax';
import { NodeType } from './syntax';
import type * as T from './values';
import { ValueType } from './values';

export function interpret(program: CompilerOutput): InterpreterOutput {
  const context: EvaluationContext = {
    lexicalEnvironment: program.bindings,
    contextualEnvironment: program.context,
    invoke: (lambda, args) => invoke(lambda, args, context),
  };

  return {
    warnings: program.warnings,
    value: run(program.program, context),
  };
}

function run(expression: A.Expression, context: EvaluationContext): T.Value {
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

    case NodeType.TupleExpression: {
      return {
        type: ValueType.Tuple,
        elements: expression.elements.map((element) => run(element, context)),
      };
    }

    case NodeType.ListExpression: {
      return {
        type: ValueType.List,
        elements: expression.elements.map((element) => run(element, context)),
      };
    }

    case NodeType.StructExpression: {
      return {
        type: ValueType.Struct,
        value: new Map(
          expression.fields.map((field) => [
            field.identifier.name,
            run(field.value, context),
          ]),
        ),
      };
    }

    case NodeType.ConditionalExpression: {
      const condition = run(expression.condition, context);

      if (condition.type !== ValueType.Boolean) {
        throw new RuntimeError(
          `Expected a boolean value, got: ${ValueType[condition.type]}`,
        );
      }

      const branch = condition.value ? expression.pass : expression.fail;
      return run(branch, context);
    }

    case NodeType.BindExpression: {
      // Clone the inherited environment.
      const newEnvironment: EvaluationContext = {
        ...context,
        contextualEnvironment: new Map(context.contextualEnvironment),
        lexicalEnvironment: new Map(context.lexicalEnvironment),
      };

      // Assign the variables, but don't evaluate them yet.
      expression.bindings.forEach((binding) => {
        const environmentType = binding.identifier.contextual
          ? 'contextualEnvironment'
          : 'lexicalEnvironment';

        newEnvironment[environmentType].set(
          binding.identifier.name,
          thunk(binding.value, () => run(binding.value, newEnvironment)),
        );
      });

      return run(expression.body, newEnvironment);
    }

    case NodeType.Identifier: {
      const value = expression.contextual
        ? context.contextualEnvironment.get(expression.name)
        : context.lexicalEnvironment.get(expression.name);

      // This should be caught by the compiler before it can get here.
      if (value === undefined) {
        throw new RuntimeError(
          `Could not resolve identifier "${expression.name}"`,
        );
      }

      return value.type === ValueType.Thunk ? value.get() : value;
    }

    case NodeType.Lambda: {
      return {
        type: ValueType.Lambda,
        environment: context.lexicalEnvironment,
        parameters: expression.parameters,
        body: expression.body,
      };
    }

    case NodeType.CallExpression: {
      const callee = run(expression.callee, context);

      if (
        callee.type !== ValueType.Lambda &&
        callee.type !== ValueType.Syscall
      ) {
        throw new RuntimeError(
          `Attempted to call a non-lambda value: ${ValueType[callee.type]}`,
        );
      }

      const args = expression.arguments.map((arg) => run(arg, context));
      return invoke(callee, args, context);
    }

    case NodeType.Sandbox: {
      return run(expression.body, {
        ...context,
        contextualEnvironment: new Map(),
      });
    }

    default: {
      throw new InternalError(
        `Unexpected node type: ${(expression as A.Expression).type}`,
      );
    }
  }
}

function invoke(
  callee: T.Lambda | T.Syscall,
  args: Array<T.Value>,
  context: EvaluationContext,
) {
  if (callee.type === ValueType.Syscall) {
    return callee.handler(args, context.invoke);
  }

  if (callee.parameters.length !== args.length) {
    throw new ArityMismatchError(callee.parameters.length, args.length);
  }

  return run(callee.body, {
    ...context,
    lexicalEnvironment: new Map([
      ...callee.environment,
      ...callee.parameters.map(
        (param, index) => [param.name, args[index]] as const,
      ),
    ]),
  });
}

interface InterpreterOutput {
  warnings: Array<CompilerMessage>;
  value: T.Value;
}

interface EvaluationContext {
  /** Any variables in scope. */
  lexicalEnvironment: Map<string, T.Value>;

  /** Any variables passed through the stack. */
  contextualEnvironment: Map<string, T.Value>;

  /** Invoke a lambda or host function. */
  invoke: (lambda: T.Lambda | T.Syscall, args: Array<T.Value>) => T.Value;
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
