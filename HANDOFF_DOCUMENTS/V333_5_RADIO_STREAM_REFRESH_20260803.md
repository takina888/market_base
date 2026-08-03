# MARKET BASE V.333.6 radio stream refresh

Build: `MARKET_BASE_V333_6_RADIO_DOCK_READING_HALF_PC_UNIFICATION_20260803`

## Changes

- Updated Akashvani FM Gold Delhi from the retired CDN path to the current HLS path.
- Updated Akashvani Raagam from the retired CDN path to the current HLS path.
- Kept KPOA 93.5 FM and added automatic AAC-to-MP3 fallback.
- Removed Switzerland's LOUNGE-RADIO.COM.
- Added `🇪🇸 スペイン｜Flamenco Radio` (Canal Sur / Andalucía).
- Added automatic fallback when a configured stream errors or stays loading for 18 seconds.
- Advanced all current build/cache identifiers to V.333.6.

## Verification

- Both Akashvani master playlists and live AAC media segments returned successfully.
- KPOA AAC and MP3 streams both returned valid audio.
- Flamenco Radio returned a continuous 320 kbps MP3 stream.
- JavaScript syntax, manifest JSON, station configuration, fallback configuration, and build identifiers passed static checks.

## Install

Upload the ZIP contents to the web root and overwrite files with the same names. After upload, press MARKET BASE's 更新 button once.
