import * as b from '../builders';

describe('builders', () => {
  it('attaches a location to the definition', () => {
    const node = b.ident('x');

    // Fragile test. Depends on how the test runner transforms the file.
    expect(node.location.file).toMatch(/builders\.test\.ts$/);
    expect(node.location.line).toBeGreaterThan(0);
    expect(node.location.column).toBeGreaterThan(0);
  });
});
