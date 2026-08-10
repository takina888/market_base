#!/usr/bin/env sh
set -eu

if [ "$#" -ne 2 ]; then
    echo "Usage: MARKET_BASE_SHA256_CERT_FINGERPRINT=AA:... $0 TEMPLATE OUTPUT" >&2
    exit 2
fi

template=$1
output=$2
fingerprint=${MARKET_BASE_SHA256_CERT_FINGERPRINT:-}

if ! printf '%s\n' "$fingerprint" | grep -Eq '^([0-9A-F]{2}:){31}[0-9A-F]{2}$'; then
    echo "MARKET_BASE_SHA256_CERT_FINGERPRINT must be an uppercase, colon-separated SHA-256 fingerprint." >&2
    exit 2
fi

if [ ! -f "$template" ]; then
    echo "Template not found: $template" >&2
    exit 2
fi

output_dir=$(dirname "$output")
mkdir -p "$output_dir"
temporary_output="${output}.tmp.$$"

sed "s/__MARKET_BASE_SHA256_CERT_FINGERPRINT__/$fingerprint/g" "$template" > "$temporary_output"
mv "$temporary_output" "$output"

echo "Generated $output"
echo "Publish it exactly at: https://takina888.github.io/.well-known/assetlinks.json"
