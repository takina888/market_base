#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SOURCE_PATH = path.join(ROOT, 'embedded-country-profile-data-v273-r28.js');
const OUTPUT_PATH = path.join(ROOT, 'data', 'images', 'todays-journey-image-manifest-r11370.js');
const SEARCH_ENDPOINT = 'https://en.wikipedia.org/w/index.php';
const THUMB_WIDTH = 960;
const MAX_CANDIDATES = 3;
const CONCURRENCY = 3;
const USER_AGENT = 'MarketBase-TodaysJourney-ImageResolver/1.0';
const REFRESH_LOW_CONFIDENCE = process.argv.includes('--refresh-low-confidence');
const FORCE_REFRESH_IDS = new Set(process.argv
  .filter(arg => arg.startsWith('--refresh-id='))
  .flatMap(arg => arg.slice('--refresh-id='.length).split(','))
  .map(value => value.trim())
  .filter(Boolean));

const JAPANESE_QUERY_OVERRIDES = {
  'EARTH-310': "Mapu'a 'a Vaea Blowholes Tonga",
  'EARTH-214': 'Madriu Perafita Claror Valley Andorra',
  'EARTH-031': 'Lake Saimaa ringed seal Finland',
  'EARTH-260': 'Chichen Itza Mexico',
  'EARTH-113': 'Akhal-Teke horse Turkmenistan',
  'EARTH-026': 'Laerdal Tunnel Norway',
  'EARTH-215': 'Niue dark sky stars',
  'EARTH-341': 'Virunga National Park Congo',
  'EARTH-080': 'Okavango Delta Botswana',
  'EARTH-302': 'Cholita wrestling Bolivia',
  'EARTH-092': 'Elephant Rock AlUla Saudi Arabia',
  'EARTH-027': 'Puerto Rico bioluminescent bay',
  'EARTH-066': 'Fujian Tulou China',
  'EARTH-301': 'Sigiriya Sri Lanka',
  'EARTH-361': 'Goree Island Senegal',
  'EARTH-224': 'Sassi di Matera Italy',
  'EARTH-058': 'Matmata underground houses Tunisia',
  'EARTH-210': 'Svalbard Global Seed Vault Norway',
  'EARTH-250': 'Namib Sand Sea Namibia',
  'EARTH-011': 'Coober Pedy underground Australia',
  'EARTH-008': 'Socotra dragon blood trees Yemen',
  'EARTH-200': 'Lesotho mountain horse riding',
  'EARTH-362': 'Visby city wall Sweden',
  'EARTH-135': 'Stone Town Zanzibar doors Tanzania',
  'EARTH-059': 'Wadi Rum rock arch Jordan',
  'EARTH-175': 'St Kitts Scenic Railway',
  'EARTH-303': 'Bwindi gorilla Uganda',
  'EARTH-147': 'Marble Caves Patagonia Chile',
  'EARTH-196': 'Cerro Negro volcano boarding Nicaragua',
  'EARTH-053': 'Namibia fairy circles grassland',
  'EARTH-209': 'Yanar Dag Azerbaijan',
  'EARTH-114': 'Kotor Montenegro old town bay',
  'EARTH-282': 'Longmen Grottoes China',
  'EARTH-174': 'Boiling Lake Dominica',
  'EARTH-139': 'Vlkolinec Slovakia traditional village',
  'EARTH-131': 'Chinguetti Mauritania library',
  'EARTH-294': 'Voru smoke sauna Estonia',
  'EARTH-076': 'Nanduti lace Paraguay',
  'EARTH-180': 'ylang ylang Comoros',
  'EARTH-121': 'Icehotel Jukkasjarvi Sweden',
  'EARTH-192': 'Sibebe Swaziland',
  'EARTH-111': 'Mesopotamian Marshes Iraq',
  'EARTH-157': 'Busanga Plains Zambia',
  'EARTH-213': 'Lope National Park Gabon',
  'EARTH-360': 'Iguazu Falls Brazil',
  'EARTH-067': 'Pentecost Island land diving',
  'EARTH-244': 'Trang Landscape Complex Vietnam',
  'EARTH-027': 'Mosquito Bay Vieques bioluminescence',
  'EARTH-073': 'Soomaa bog'
};

const PREFERRED_CANDIDATES = {
  'EARTH-133': [{
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Dorudon_atrox_fossil_at_Wadi_El-Hitan%2C_Egypt%2C_March_2008.jpg/960px-Dorudon_atrox_fossil_at_Wadi_El-Hitan%2C_Egypt%2C_March_2008.jpg',
    source_page: 'https://commons.wikimedia.org/wiki/File:Dorudon_atrox_fossil_at_Wadi_El-Hitan,_Egypt,_March_2008.jpg',
    photographer: 'Christoph Rohner (Clr202)',
    license: 'CC BY-SA 3.0',
    license_url: 'https://creativecommons.org/licenses/by-sa/3.0/',
    file_title: 'Dorudon atrox fossil at Wadi El-Hitan, Egypt, March 2008.jpg',
    width: 960,
    height: 640
  }],
  'EARTH-310': [{
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/TO-Mapu_a_Vaea.JPG/960px-TO-Mapu_a_Vaea.JPG',
    source_page: 'https://commons.wikimedia.org/wiki/File:TO-Mapu_a_Vaea.JPG',
    photographer: 'Holger Behr (Hobe)',
    license: 'Public domain',
    license_url: 'https://commons.wikimedia.org/wiki/File:TO-Mapu_a_Vaea.JPG',
    file_title: 'TO-Mapu a Vaea.JPG',
    width: 960,
    height: 720
  }],
  'EARTH-309': [{
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Interior_de_capilla_en_la_roca%2C_Geghard.jpg/960px-Interior_de_capilla_en_la_roca%2C_Geghard.jpg',
    source_page: 'https://commons.wikimedia.org/wiki/File:Interior_de_capilla_en_la_roca,_Geghard.jpg',
    photographer: 'AndyHM',
    license: 'CC BY-SA 4.0',
    license_url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    file_title: 'Interior de capilla en la roca, Geghard.jpg',
    width: 960,
    height: 640
  }],
  'EARTH-294': [{
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Leil_in_an_Estonian_smoke_sauna.jpg/960px-Leil_in_an_Estonian_smoke_sauna.jpg',
    source_page: 'https://commons.wikimedia.org/wiki/File:Leil_in_an_Estonian_smoke_sauna.jpg',
    photographer: 'Estoniansaunas',
    license: 'CC BY-SA 4.0',
    license_url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    file_title: 'Leil in an Estonian smoke sauna.jpg',
    width: 4020,
    height: 2680
  }],
  'EARTH-192': [{
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Granite_monolith.jpg/960px-Granite_monolith.jpg',
    source_page: 'https://commons.wikimedia.org/wiki/File:Granite_monolith.jpg',
    photographer: 'theswazigirl',
    license: 'CC BY-SA 3.0',
    license_url: 'https://creativecommons.org/licenses/by-sa/3.0/',
    file_title: 'Granite monolith.jpg',
    width: 1498,
    height: 1005
  }],
  'EARTH-157': [{
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Kafue_National_Park.jpg/960px-Kafue_National_Park.jpg',
    source_page: 'https://commons.wikimedia.org/wiki/File:Kafue_National_Park.jpg',
    photographer: 'LittleT889',
    license: 'CC BY-SA 4.0',
    license_url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    file_title: 'Kafue National Park.jpg',
    width: 1480,
    height: 775
  }]
};

const CANDIDATE_FILE_PRIORITIES = {
  'EARTH-159': 'Lake Assal 1-Djibouti.jpg',
  'EARTH-322': '1 hallstatt austria.jpg',
  'EARTH-298': 'Nossa Sra. do Carmo.jpg'
};

const SEARCH_STOP_WORDS = new Set([
  'a', 'an', 'and', 'at', 'by', 'for', 'from', 'in', 'into', 'near', 'of', 'on', 'the', 'to', 'with',
  'aerial', 'ancient', 'beautiful', 'blue', 'colorful', 'exterior', 'festival', 'historic', 'interior',
  'landscape', 'night', 'panorama', 'panoramic', 'photo', 'photography', 'scenery', 'sunrise', 'sunset',
  'traditional', 'travel', 'unesco', 'view', 'winter'
]);

const TITLE_BLOCKLIST = [
  '.svg', ' map', 'map of', 'flag', 'coat of arms', 'logo', 'diagram', 'chart', 'route map',
  'locator', 'stamp', 'poster', 'portrait', 'painting', 'engraving', 'drawing', 'illustration',
  'manuscript', 'book cover', 'coin', 'banknote', 'fresco', 'icon.'
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let nextRequestAt = 0;
const plainText = value => String(value || '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/\s+/g, ' ')
  .trim();

function loadEntries() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(SOURCE_PATH, 'utf8'), context, { filename: SOURCE_PATH });
  const entries = context.window.MARKET_BASE_TODAYS_JOURNEY?.data?.entries;
  if (!Array.isArray(entries) || entries.length !== 365) {
    throw new Error(`Today’s Journey entries must be 365; received ${entries?.length ?? 0}`);
  }
  return entries;
}

function loadExistingRows() {
  if (!fs.existsSync(OUTPUT_PATH)) return new Map();
  try {
    const context = { window: {} };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(OUTPUT_PATH, 'utf8'), context, { filename: OUTPUT_PATH });
    const rows = context.window.MARKET_BASE_TODAYS_JOURNEY_IMAGE_MANIFEST?.entries || {};
    return new Map(Object.entries(rows));
  } catch {
    return new Map();
  }
}

function normalizedTokens(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[’‘`]/g, "'")
    .replace(/[^A-Za-z0-9À-ž'/-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function foldedSearchText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase();
}

function meaningfulQueryTerms(value) {
  return [...new Set(normalizedTokens(value)
    .map(token => foldedSearchText(token))
    .filter(token => token.length >= 3 && !SEARCH_STOP_WORDS.has(token)))];
}

function candidateTitleMatchCount(candidate, query) {
  const title = foldedSearchText(candidate?.file_title || candidate?.title || '');
  return meaningfulQueryTerms(query).filter(term => title.includes(term)).length;
}

function makeQueryVariants(entry) {
  const primary = JAPANESE_QUERY_OVERRIDES[entry.id] || entry.image_search || '';
  const tokens = normalizedTokens(primary);
  const meaningful = tokens.filter(token => !SEARCH_STOP_WORDS.has(token.toLowerCase()));
  const variants = [];
  const add = (value, quoted = false) => {
    const query = String(value || '').replace(/\s+/g, ' ').trim();
    if (query.length < 3) return;
    const key = `${quoted ? 'q' : 'u'}:${query.toLowerCase()}`;
    if (!variants.some(item => item.key === key)) variants.push({ key, query, quoted });
  };

  if (meaningful.length <= 5) add(meaningful.join(' '), false);
  if (tokens.length <= 6) add(tokens.join(' '), false);

  const anchorSource = meaningful.length >= 2 ? meaningful : tokens;
  const maxPrefix = Math.min(5, anchorSource.length);
  const prefixOrder = [4, 3, 2, 5].filter(size => size <= maxPrefix);
  for (const size of prefixOrder) {
    add(anchorSource.slice(0, size).join(' '), false);
  }
  if (anchorSource.length >= 2) add(anchorSource.slice(0, Math.min(4, anchorSource.length)).join(' '), true);

  if (tokens.length > 5) add(tokens.slice(0, 6).join(' '), false);
  if (meaningful.length > 5) add(meaningful.slice(0, 6).join(' '), false);

  const countryTail = meaningful.slice(-3);
  if (anchorSource.length >= 2 && countryTail.length) {
    add([...anchorSource.slice(0, Math.min(3, anchorSource.length)), ...countryTail.slice(-1)].join(' '), false);
  }

  return variants.slice(0, 8);
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function resizeWikiThumb(url, originalWidth) {
  const absolute = String(url || '').startsWith('//') ? `https:${url}` : String(url || '');
  if (!absolute.includes('/wikipedia/commons/')) return '';
  const width = Number(originalWidth || THUMB_WIDTH) >= THUMB_WIDTH ? THUMB_WIDTH : 500;
  return absolute
    .replace(/\/((?:lossy|lossless)-page\d+-)?\d+px-([^/?#]+)([?#].*)?$/, `/$1${width}px-$2$3`)
    .replace('/250px-', `/${width}px-`);
}

function parseSearchResults(html) {
  const rows = [];
  const pattern = /<li class="mw-search-result mw-search-result-ns-6">([\s\S]*?)<\/li>/g;
  for (const match of String(html || '').matchAll(pattern)) {
    const block = match[1];
    const titleMatch = block.match(/<div class="mw-search-result-heading">[\s\S]*?<a[^>]+title="(File:[^"]+)"/);
    const imageMatch = block.match(/<img[^>]+src="([^"]+)"[^>]+data-file-width="(\d+)"[^>]+data-file-height="(\d+)"/);
    if (!titleMatch || !imageMatch) continue;
    const title = decodeHtml(titleMatch[1]);
    const imageUrl = resizeWikiThumb(decodeHtml(imageMatch[1]), imageMatch[2]);
    if (!imageUrl) continue;
    const descriptionMatch = block.match(/<div class="searchresult">([\s\S]*?)<\/div>/);
    rows.push({
      title,
      image_url: imageUrl,
      width: Number(imageMatch[2]),
      height: Number(imageMatch[3]),
      description: plainText(decodeHtml(descriptionMatch?.[1] || ''))
    });
  }
  return rows;
}

async function fetchText(url, attempt = 1) {
  const waitMs = Math.max(0, nextRequestAt - Date.now());
  if (waitMs) await sleep(waitMs);
  nextRequestAt = Date.now() + 1500;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': USER_AGENT
      },
      signal: controller.signal
    });
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return await response.text();
  } catch (error) {
    if (attempt >= 4) throw error;
    const retryMs = error.status === 429 ? 15000 * attempt : 1200 * attempt;
    nextRequestAt = Math.max(nextRequestAt, Date.now() + retryMs);
    await sleep(retryMs);
    return fetchText(url, attempt + 1);
  } finally {
    clearTimeout(timer);
  }
}

async function searchCommons(variant) {
  const search = `${variant.quoted ? `"${variant.query}"` : variant.query} filetype:bitmap filew:>500 fileh:>300`;
  const params = new URLSearchParams({
    title: 'Special:Search',
    limit: '12',
    offset: '0',
    ns6: '1',
    search,
    printable: 'yes'
  });
  return parseSearchResults(await fetchText(`${SEARCH_ENDPOINT}?${params}`));
}

function scoreCandidate(page, variant) {
  if (!page?.image_url) return null;
  const width = Number(page.width || 0);
  const height = Number(page.height || 0);
  if (width < 500 || height < 300) return null;
  const ratio = width / height;
  if (ratio < 0.55 || ratio > 5.5) return null;

  const title = String(page.title || '');
  const titleLower = foldedSearchText(title);
  if (TITLE_BLOCKLIST.some(term => titleLower.includes(term))) return null;

  const description = plainText(page.description || '');
  const haystack = foldedSearchText(`${title} ${description}`);
  const uniqueTerms = meaningfulQueryTerms(variant.query);
  const matchedTerms = uniqueTerms.filter(term => haystack.includes(term));
  const titleMatchedTerms = uniqueTerms.filter(term => titleLower.includes(term));

  let score = Math.log10(Math.max(1, width * height)) * 12;
  score += ratio >= 1.3 && ratio <= 2.5 ? 34 : 12;
  score += matchedTerms.length * 14;
  score += titleMatchedTerms.length * 44;
  score += variant.quoted ? 24 : 0;
  if (width >= 1800) score += 12;
  if (/panorama|landscape|aerial|mountain|coast|valley|lake|waterfall|temple|monastery|castle|village|street|desert|forest|wildlife|festival/i.test(haystack)) score += 8;

  const sourcePage = `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_')).replace(/%3A/i, ':')}`;
  const caption = title.replace(/^File:/, '').replace(/\.[^.]+$/, '');

  return {
    score,
    titleMatchCount: titleMatchedTerms.length,
    candidate: {
      image_url: page.image_url,
      source_page: sourcePage,
      photographer: '',
      license: 'Wikimedia Commons（詳細は出典ページ）',
      license_url: sourcePage,
      alt: caption,
      caption,
      quality_status: 'preselected_online_manifest',
      provider: 'Wikimedia Commons',
      file_title: title.replace(/^File:/, ''),
      width,
      height,
      search_query: variant.query
    }
  };
}

async function resolveEntry(entry) {
  const ranked = [];
  const seenUrls = new Set();
  const variants = makeQueryVariants(entry);

  if (PREFERRED_CANDIDATES[entry.id]) {
    PREFERRED_CANDIDATES[entry.id].forEach((candidate, index) => {
      if (seenUrls.has(candidate.image_url)) return;
      seenUrls.add(candidate.image_url);
      ranked.push({
        score: 2000 - index,
        titleMatchCount: 99,
        candidate: {
          ...candidate,
          alt: `${entry.country}・${entry.title}`,
          caption: entry.title,
          quality_status: 'manually_verified_online_manifest',
          provider: 'Wikimedia Commons',
          search_query: JAPANESE_QUERY_OVERRIDES[entry.id] || entry.image_search || ''
        }
      });
    });
  }

  for (const variant of variants.slice(0, 6)) {
    if (ranked.some(row => row.titleMatchCount > 0)) break;
    let pages = [];
    try {
      pages = await searchCommons(variant);
    } catch (error) {
      process.stderr.write(`\n${entry.id} query failed (${variant.query}): ${error.message}\n`);
      continue;
    }
    for (const page of pages) {
      const row = scoreCandidate(page, variant);
      if (!row || seenUrls.has(row.candidate.image_url)) continue;
      seenUrls.add(row.candidate.image_url);
      ranked.push(row);
    }
  }

  ranked.sort((a, b) => b.score - a.score);
  const candidates = ranked.slice(0, MAX_CANDIDATES).map(row => ({
    ...row.candidate,
    alt: `${entry.country}・${entry.title}`,
    caption: entry.title,
    quality_status: row.titleMatchCount > 0
      ? 'query_title_matched_online_manifest'
      : row.candidate.quality_status
  }));
  return {
    article_id: entry.id,
    display_date: entry.display_date,
    country: entry.country,
    title: entry.title,
    query: JAPANESE_QUERY_OVERRIDES[entry.id] || entry.image_search || '',
    candidates
  };
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await mapper(items[index], index);
      if ((index + 1) % 25 === 0 || index + 1 === items.length) {
        process.stdout.write(`resolved ${index + 1}/${items.length}\n`);
      }
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

const entries = loadEntries();
const existingRows = loadExistingRows();
const reusableCount = entries.filter(entry => existingRows.get(entry.id)?.candidates?.length).length;
if (reusableCount) process.stdout.write(`reusing ${reusableCount}/${entries.length} resolved entries\n`);
const rows = (await mapLimit(entries, CONCURRENCY, entry => {
  const existing = existingRows.get(entry.id);
  const lowConfidence = existing?.candidates?.length
    && candidateTitleMatchCount(existing.candidates[0], existing.query) === 0;
  const preferredChanged = PREFERRED_CANDIDATES[entry.id]
    && existing?.candidates?.[0]?.file_title !== PREFERRED_CANDIDATES[entry.id][0]?.file_title;
  return existing?.candidates?.length
    && !FORCE_REFRESH_IDS.has(entry.id)
    && !(REFRESH_LOW_CONFIDENCE && (lowConfidence || preferredChanged))
    ? existing
    : resolveEntry(entry);
})).map(row => {
  const priority = CANDIDATE_FILE_PRIORITIES[row.article_id];
  const candidates = row.candidates.map(candidate => ({
    ...candidate,
    image_url: resizeWikiThumb(candidate.image_url, candidate.width) || candidate.image_url
  }));
  if (priority) {
    candidates.sort((a, b) => Number(b.file_title === priority) - Number(a.file_title === priority));
  }
  return { ...row, candidates };
});
const unresolved = rows.filter(row => !row.candidates.length).map(row => row.article_id);
const candidateCount = rows.reduce((sum, row) => sum + row.candidates.length, 0);
const manifest = {
  schema_version: '1.0',
  manifest_version: 'r11370-online-preselected-20260726',
  generated_at: new Date().toISOString(),
  provider: 'Wikimedia Commons',
  storage_mode: 'external_url_manifest',
  entry_count: rows.length,
  resolved_count: rows.length - unresolved.length,
  candidate_count: candidateCount,
  unresolved,
  entries: Object.fromEntries(rows.map(row => [row.article_id, row]))
};

const output = `window.MARKET_BASE_TODAYS_JOURNEY_IMAGE_MANIFEST=${JSON.stringify(manifest)};\n`;
fs.writeFileSync(OUTPUT_PATH, output);
process.stdout.write(`wrote ${OUTPUT_PATH}\n`);
process.stdout.write(`resolved ${manifest.resolved_count}/${manifest.entry_count}; candidates ${candidateCount}; unresolved ${unresolved.length}\n`);
if (unresolved.length) process.stdout.write(`${unresolved.join(',')}\n`);
