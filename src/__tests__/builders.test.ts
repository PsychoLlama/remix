import * as b from '../builders';
import type { Location } from '../syntax';

describe('builders', () => {
  it('attaches a location to the definition', () => {
    const location: Location = {
      start: { row: 1, column: 2 },
      end: { row: 2, column: 20 },
    };

    const node = b.ident('x', location);

    expect(node.location).toEqual(location);
  });
});
