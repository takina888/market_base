#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
registry_path = ROOT / 'data/images/photo_registry.json'
embedded_path = ROOT / 'data/images/photo-registry-embedded.js'
js_path = ROOT / 'assets/js/retail-store-gallery-v2.js'
css_path = ROOT / 'assets/css/retail-store-gallery-v2.css'
html_path = ROOT / 'retail-sales-v273-db-title-r27.html'

registry = json.loads(registry_path.read_text(encoding='utf-8'))
embedded_text = embedded_path.read_text(encoding='utf-8')
match = re.fullmatch(r'\s*window\.MARKET_BASE_PHOTO_REGISTRY_EMBEDDED\s*=\s*(\{.*\});\s*', embedded_text, re.S)
assert match, 'embedded registry wrapper is invalid'
embedded = json.loads(match.group(1))
assert registry == embedded, 'external and embedded photo registries differ'

photos = registry['photos']
ids = [p['photo_id'] for p in photos]
assert len(ids) == len(set(ids)), 'duplicate photo_id exists'
retail = [
    p for p in photos
    if 'retail_sales_db' in (p.get('database_ids') or [])
    and 'photo_gallery' in (p.get('display_locations') or [])
    and p.get('status') == 'published'
]
by_company: dict[str, list[dict]] = defaultdict(list)
for photo in retail:
    by_company[photo['company_id']].append(photo)
assert len(by_company) == 63, f'expected 63 companies, got {len(by_company)}'
assert len(retail) == 252, f'expected 252 photos, got {len(retail)}'
assert Counter(len(items) for items in by_company.values()) == Counter({4: 63}), 'every company must have exactly four photos'

blocked = ('getty', 'bloomberg', 'alamy', 'shutterstock', 'watermark')
for photo in retail:
    haystack = ' '.join(str(photo.get(k, '')) for k in ('source_provider', 'source_page_url', 'image_url', 'thumbnail_url')).lower()
    assert not any(token in haystack for token in blocked), f'blocked source remains: {photo["photo_id"]}'

js = js_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')
html = html_path.read_text(encoding='utf-8')
assert 'group.photos.slice(0,4)' in js, 'gallery does not limit each company to four photos'
assert "button.addEventListener('click',()=>apply" in js, 'thumbnail click switching is missing'
assert 'ROTATE_INTERVAL=12000' in js, 'automatic gallery rotation is missing'
assert '@media(min-width:900px)' in css and 'grid-template-areas:"thumbs main"' in css, 'desktop one-large-plus-four layout is missing'
assert 'grid-template-columns:repeat(4,minmax(0,1fr))' in css, 'mobile four-thumbnail row is missing'
assert 'retail-store-gallery-v2.css?v=20260727-r11373-photo-final' in html, 'gallery CSS cache version is stale'
assert 'retail-store-gallery-v2.js?v=20260727-r11373-photo-final' in html, 'gallery JS cache version is stale'

print('RETAIL PHOTO GALLERY TEST: PASS — 63 companies, 252 photos, four per company, click switching and responsive gallery verified')
