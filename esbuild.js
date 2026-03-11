const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');

const ctxOptions = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'node20',
  outfile: 'dist/extension.js',
  external: ['vscode'],
  sourcemap: true,
  logLevel: 'info'
};

async function run() {
  if (watch) {
    const ctx = await esbuild.context(ctxOptions);
    await ctx.watch();
    return;
  }

  await esbuild.build(ctxOptions);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
