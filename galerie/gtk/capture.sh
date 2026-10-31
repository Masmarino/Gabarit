#!/bin/sh
# Builds GabaritGtk and its gallery in the SkollN Linux workshop image (Swift 6.4.1), then captures each window, light
# and dark, under Xvfb. Usage: galerie/gtk/capture.sh <output folder> [image]
set -e
here=$(cd "$(dirname "$0")/../.." && pwd)
out=$1; image=${2:-localhost/skolln-atelier-amd64}
mkdir -p "$out"
podman run --rm --platform linux/amd64 -v "$here":/gabarit:ro -v "$out":/out "$image" sh -c '
set -e
apt-get update -qq >/dev/null && apt-get install -y -qq --no-install-recommends libgtk-4-dev adwaita-icon-theme librsvg2-common xvfb imagemagick >/dev/null 2>&1
cp -r /gabarit /tmp/gabarit && cd /tmp/gabarit && rm -rf .build galerie/gtk/.build
swift build --product GabaritGtk 2>&1 | grep -E "error|warning: |Compiling|Build complete" | grep -v "^\[" | tail -20
cd galerie/gtk && swift build 2>&1 | grep -E "error|Build complete" | tail -20
Xvfb :9 -screen 0 1280x860x24 >/dev/null 2>&1 & sleep 1
export DISPLAY=:9 GSK_RENDERER=cairo
for which in shell window; do for scheme in light dark; do
  .build/debug/GabaritGtkGallery $which $scheme >/dev/null 2>&1 & pid=$!; sleep 6
  import -window root /out/$which-$scheme.png; kill $pid; sleep 1
done; done
'
