import {
  str,
  num,
  bool,
  tuple,
  list,
  struct,
  conditional,
  bind,
  assign,
  ident,
  context,
  lambda,
  call,
  syscall,
} from '../builders';
import { interpret } from '../interpreter';
import type { CompilerOptions } from '../compiler';
import { compile } from '../compiler';
import type * as T from '../values';
import { ValueType } from '../values';
import type { Expression } from '../syntax';

describe('interpreter', () => {
  function run(program: Expression, options?: CompilerOptions) {
    const compiled = compile(program, options);
    const { value } = interpret(compiled);

    return value;
  }

  it('can evaluate literal strings', () => {
    const value = run(str('hello world'));

    expect(value).toEqual<T.StringValue>({
      type: ValueType.String,
      value: 'hello world',
    });
  });

  it('can evaluate literal numbers', () => {
    const value = run(num(5));

    expect(value).toEqual<T.NumberValue>({
      type: ValueType.Number,
      value: 5,
    });
  });

  it('can evaluate booleans', () => {
    expect(run(bool(true))).toEqual<T.BooleanValue>({
      type: ValueType.Boolean,
      value: true,
    });

    expect(run(bool(false))).toEqual<T.BooleanValue>({
      type: ValueType.Boolean,
      value: false,
    });
  });

  it('can evaluate tuples', () => {
    const value = run(
      bind(
        [
          assign(ident('x'), num(1)),
          assign(ident('y'), num(2)),
          assign(ident('z'), num(3)),
        ],
        tuple([ident('x'), ident('y'), ident('z')]),
      ),
    );

    expect(value).toEqual<T.Tuple>({
      type: ValueType.Tuple,
      elements: [
        { type: ValueType.Number, value: 1 },
        { type: ValueType.Number, value: 2 },
        { type: ValueType.Number, value: 3 },
      ],
    });
  });

  it('can resolve identifiers where the value is in scope', () => {
    const program = bind(
      [assign(ident('msg'), str('hello world'))],
      ident('msg'),
    );

    expect(run(program)).toEqual<T.StringValue>({
      type: ValueType.String,
      value: 'hello world',
    });
  });

  it('can resolve identifiers from an outer scope', () => {
    const program = bind(
      [assign(ident('x'), num(1))],
      bind([assign(ident('y'), num(2))], ident('x')),
    );

    expect(run(program)).toEqual<T.NumberValue>({
      type: ValueType.Number,
      value: 1,
    });
  });

  it('can resolve identifiers defined in the same binding', () => {
    const program = bind(
      [assign(ident('x'), num(1)), assign(ident('y'), ident('x'))],
      ident('y'),
    );

    expect(run(program)).toEqual<T.NumberValue>({
      type: ValueType.Number,
      value: 1,
    });
  });

  it('can override identifiers from the outer scope', () => {
    const program = bind(
      [assign(ident('x'), num(1))],
      bind([assign(ident('x'), num(2))], ident('x')),
    );

    expect(run(program)).toEqual<T.NumberValue>({
      type: ValueType.Number,
      value: 2,
    });
  });

  it('can inject bindings defined by the system', () => {
    const value = run(ident('print'), {
      bindings: new Map([['print', { type: ValueType.String, value: 'test' }]]),
    });

    expect(value).toEqual<T.StringValue>({
      type: ValueType.String,
      value: 'test',
    });
  });

  it('can evaluate a lambda', () => {
    const program = bind(
      [assign(ident('identity'), lambda([ident('x')], ident('x')))],
      call(ident('identity'), [num(2)]),
    );

    expect(run(program)).toEqual<T.NumberValue>({
      type: ValueType.Number,
      value: 2,
    });
  });

  it('does not leak bindings from the callsite into the lambda', () => {
    const program = bind(
      [
        assign(ident('conflict'), num(10)),
        assign(ident('identity'), lambda([], ident('conflict'))),
      ],

      bind([assign(ident('conflict'), num(20))], call(ident('identity'), [])),
    );

    // Pull from the lambda's environment, not the callsite.
    expect(run(program)).toEqual<T.NumberValue>({
      type: ValueType.Number,
      value: 10,
    });
  });

  it('yells if you try to evaluate a lambda without enough arguments', () => {
    const program = bind(
      [assign(ident('identity'), lambda([ident('x')], ident('x')))],
      call(ident('identity'), []),
    );

    expect(() => run(program)).toThrowErrorMatchingInlineSnapshot(
      `[ArityMismatchError: Lambda called with incorrect number of arguments]`,
    );
  });

  it('yells if you try to call something that is not a lambda', () => {
    const program = bind(
      [assign(ident('x'), str('hello world'))],
      call(ident('x'), []),
    );

    expect(() => run(program)).toThrowErrorMatchingInlineSnapshot(
      `[RuntimeError: Attempted to call a non-lambda value: String]`,
    );
  });

  it('can evaluate inline lambdas', () => {
    const program = call(lambda([ident('x')], ident('x')), [num(2)]);

    expect(run(program)).toEqual<T.NumberValue>({
      type: ValueType.Number,
      value: 2,
    });
  });

  it('can invoke functions exposed by the host program', () => {
    const program = call(ident('print'), [str('hello world')]);

    const print = syscall((args) => {
      expect(args).toEqual([{ type: ValueType.String, value: 'hello world' }]);

      return { type: ValueType.Tuple, elements: [] };
    });

    const value = run(program, {
      bindings: new Map([['print', print]]),
    });

    expect(value).toEqual<T.Tuple>({
      type: ValueType.Tuple,
      elements: [],
    });
  });

  it('exposes the call function to syscalls', () => {
    const program = call(ident('apply'), [
      lambda([ident('x')], tuple([ident('x'), ident('x')])),
      num(1),
    ]);

    const apply = syscall((args, call) => {
      if (args[0].type !== ValueType.Lambda) {
        throw new Error('Expected a lambda');
      }

      return call(args[0], args.slice(1));
    });

    const value = run(program, {
      bindings: new Map([['apply', apply]]),
    });

    expect(value).toEqual<T.Tuple>({
      type: ValueType.Tuple,
      elements: [
        { type: ValueType.Number, value: 1 },
        { type: ValueType.Number, value: 1 },
      ],
    });
  });

  it('can evaluate a list', () => {
    const program = bind(
      [assign(ident('x'), list([num(1), num(2), num(3)]))],
      ident('x'),
    );

    expect(run(program)).toEqual<T.List>({
      type: ValueType.List,
      elements: [
        { type: ValueType.Number, value: 1 },
        { type: ValueType.Number, value: 2 },
        { type: ValueType.Number, value: 3 },
      ],
    });
  });

  it('can evaluate a struct', () => {
    const program = struct([
      assign(ident('a'), num(1)),
      assign(ident('b'), num(2)),
    ]);

    expect(run(program)).toEqual<T.Struct>({
      type: ValueType.Struct,
      value: new Map([
        ['a', { type: ValueType.Number, value: 1 }],
        ['b', { type: ValueType.Number, value: 2 }],
      ]),
    });
  });

  it('can evaluate a conditional', () => {
    const program1 = conditional(bool(true), num(1), num(2));
    const program2 = conditional(bool(false), num(1), num(2));

    expect(run(program1)).toEqual<T.NumberValue>({
      type: ValueType.Number,
      value: 1,
    });

    expect(run(program2)).toEqual<T.NumberValue>({
      type: ValueType.Number,
      value: 2,
    });
  });

  it('yells if you try to evaluate a conditional with a non-boolean condition', () => {
    const program = conditional(num(1), num(1), num(2));

    expect(() => run(program)).toThrowErrorMatchingInlineSnapshot(
      `[RuntimeError: Expected a boolean value, got: Number]`,
    );
  });

  it('resolves contextual identifiers through the stack', () => {
    const program = bind(
      [
        assign(context('conflict'), num(10)),
        assign(ident('identity'), lambda([], context('conflict'))),
      ],

      bind([assign(context('conflict'), num(20))], call(ident('identity'), [])),
    );

    // Pull from the lambda's environment, not the callsite.
    expect(run(program)).toEqual<T.NumberValue>({
      type: ValueType.Number,
      value: 20,
    });
  });

  it('can expose contextual bindings from the host platform', () => {
    const program = call(context('echo'), [str('Hello, world'), num(1)]);

    const echo = syscall((args) => {
      return { type: ValueType.List, elements: args };
    });

    const value = run(program, {
      context: new Map([['echo', echo]]),
    });

    expect(value).toEqual<T.List>({
      type: ValueType.List,
      elements: [
        { type: ValueType.String, value: 'Hello, world' },
        { type: ValueType.Number, value: 1 },
      ],
    });
  });
});
