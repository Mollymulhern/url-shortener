import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { cp, mkdtemp, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

test('loads server .env independently of the working directory', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'shortener-test-'));
  let child;
  try {
    await cp(new URL('../src', import.meta.url), join(directory, 'src'), { recursive: true });
    await writeFile(join(directory, 'package.json'), '{"type":"module"}');
    await symlink(new URL('../node_modules', import.meta.url).pathname, join(directory, 'node_modules'));
    await writeFile(join(directory, '.env'), 'PORT=0\nNODE_ENV=production\nBASE_URL=https://short.example\n');
    const env = { ...process.env };
    delete env.PORT;
    delete env.BASE_URL;
    delete env.NODE_ENV;
    child = spawn(process.execPath, [join(directory, 'src/server.js')], { cwd: tmpdir(), env });
    const output = await Promise.race([
      once(child.stdout, 'data').then(([data]) => data.toString()),
      once(child, 'exit').then(([code]) => { throw new Error(`Server exited: ${code}`); })
    ]);
    assert.match(output, /listening on http:\/\/localhost:0/);
  } finally {
    if (child && child.exitCode === null) {
      child.kill();
      await once(child, 'exit');
    }
    await rm(directory, { recursive: true, force: true });
  }
});
