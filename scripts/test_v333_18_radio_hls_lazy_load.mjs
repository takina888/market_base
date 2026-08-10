#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const html=read('world-radio/player.html');
const player=read('world-radio/assets/world-radio-player.js');

const scriptSources=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(match=>match[1]);
assert(!scriptSources.some(source=>/hls(?:\.min)?\.js/i.test(source)),'player HTML must not synchronously load hls.js');
assert.match(player,/const HLS_LIBRARY_URL = 'https:\/\/cdn\.jsdelivr\.net\/npm\/hls\.js@1\.6\.16\/dist\/hls\.min\.js';/);
assert.match(player,/script\.async = true;/,'fallback hls.js must load asynchronously');
assert.match(player,/script\.dataset\.marketBaseHlsRuntime = 'true';/,'dynamic runtime script must be identifiable and retryable');
assert.match(player,/HLS_LIBRARY_TIMEOUT_MS = 12000/,'a blocked CDN must not leave playback loading forever');

const prepare=player.slice(player.indexOf('function prepareHls'),player.indexOf('function hlsPlaybackStartsFromTransport'));
const nativePosition=prepare.indexOf("audio.canPlayType('application/vnd.apple.mpegurl')");
const dynamicPosition=prepare.indexOf('loadHlsLibrary()');
assert(nativePosition>=0&&dynamicPosition>nativePosition,'native HLS capability must be checked before any CDN request');
assert.match(prepare,/if \(nativeHls\) \{[\s\S]*?audio\.src = candidate\.url;[\s\S]*?return true;/);
assert.match(prepare,/hlsLibraryLoadingGeneration = generation;/);
assert.match(prepare,/!playbackIsCurrent\(generation\) \|\| hlsLibraryLoadingGeneration !== generation/,'late CDN completion must not revive a stopped or changed station');
assert.match(prepare,/tryNextStream\('hls-library-error', generation\)/,'CDN failure must fall through to the station fallback stream');

const helperCalls=[...player.matchAll(/hlsPlaybackStartsFromTransport\(candidate, generation\)/g)].length;
assert(helperCalls>=4,'play, fallback, and recovery paths must all wait for the HLS transport');
assert.match(player,/function destroyHls\(\)[\s\S]*?hlsLibraryLoadingGeneration = 0;/,'pause/station changes must invalidate a pending HLS load');

console.log('V333.18 native-first, on-demand hls.js radio contracts passed.');
