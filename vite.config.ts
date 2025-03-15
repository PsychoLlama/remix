import * as fs from 'node:fs/promises';
import { builtinModules } from 'node:module';
import * as path from 'node:path';

import { defineConfig } from 'vite';

export default async () => {
  const pkg = JSON.parse(await fs.readFile('./package.json', 'utf8'));
  const natives = builtinModules.map((mod) => `node:${mod}`);
  const deps = Object.keys(pkg.dependencies ?? {});

  return defineConfig({
    build: {
      target: 'esnext',
      lib: {
        entry: path.join(__dirname, './src/index.ts'),
        fileName: 'remix',
        formats: ['es'],
      },
      rollupOptions: {
        external: builtinModules.concat(natives).concat(deps),
      },
    },
  });
};
