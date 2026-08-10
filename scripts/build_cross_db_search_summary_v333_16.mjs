import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const source = path.join(root, 'embedded-cross-db-search-index-v273-db-title-r27.js');
const output = path.join(root, 'embedded-cross-db-search-summary-v333-16.js');
const context = { window: {} };

vm.runInNewContext(fs.readFileSync(source, 'utf8'), context, { filename: source });
const full = context.window.MARKET_BASE_CROSS_DB_SEARCH_INDEX;
if (!full || !Array.isArray(full.dbs)) {
  throw new Error('MARKET_BASE_CROSS_DB_SEARCH_INDEX is unavailable');
}

const summary = {
  meta: {
    ...full.meta,
    version: 'V333_16_LAZY_SEARCH_SUMMARY_20260810',
    fulltext_enabled: false,
    source: path.basename(source)
  },
  dbs: full.dbs.map(db => ({
    id: db.id,
    title: db.title,
    category: db.category,
    url: db.url,
    record_count: db.record_count,
    countries: Array.isArray(db.countries) ? db.countries : []
  }))
};

const content = `window.MARKET_BASE_CROSS_DB_SEARCH_SUMMARY=${JSON.stringify(summary)};\n`;
fs.writeFileSync(output, content);
console.log(JSON.stringify({
  sourceBytes: fs.statSync(source).size,
  outputBytes: Buffer.byteLength(content),
  databases: summary.dbs.length
}, null, 2));
