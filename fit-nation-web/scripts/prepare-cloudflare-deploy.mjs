import { readFile, writeFile } from 'node:fs/promises';

// Keep the Sites build intact; generate a separate config for the owner's account.
const settings = JSON.parse(await readFile(new URL('../cloudflare-deploy.json', import.meta.url), 'utf8'));
if (!/^[a-z0-9-]+$/.test(settings.name) || !/^[a-f0-9]{32}$/.test(settings.account_id) ||
    !/^[a-f0-9-]{36}$/.test(settings.database_id) || settings.database_id.startsWith('00000000-')) {
  throw new Error('Set valid Cloudflare account, Worker name and D1 database IDs in cloudflare-deploy.json.');
}
const configUrl = new URL('../dist/server/wrangler.json', import.meta.url);
const config = JSON.parse(await readFile(configUrl, 'utf8'));
if (!config.main || !config.assets?.directory || !config.d1_databases?.some(db => db.binding === 'DB')) {
  throw new Error('Expected a complete Workers build with the DB binding. Run npm run build first.');
}
config.name = settings.name;
config.topLevelName = settings.name;
config.account_id = settings.account_id;
config.workers_dev = true;
config.preview_urls = true;
config.keep_vars = true;
config.vars = { ...config.vars, STANDALONE_HOSTING: 'true' };
config.d1_databases = config.d1_databases.map(db => db.binding === 'DB' ? {
  ...db,
  database_name: settings.database_name,
  database_id: settings.database_id,
  migrations_dir: '../../drizzle',
} : db);
await writeFile(new URL('../dist/server/wrangler.cloudflare.json', import.meta.url), JSON.stringify(config, null, 2) + '\n');
console.log('Cloudflare deployment configuration ready for fit-nation; database migrations are required before deployment.');
