#!/bin/sh
# Builds GabaritGtk and its gallery in a Linux image with GTK 4 (Swift 6.4.1), then draws each section, light and dark,
# at twice its size, as the Mac's gallery does (galerie/apple). Usage: galerie/gtk/capture.sh <output folder> [image]
# The image: the SkollN workshop's, with libgtk-4-dev, adwaita-icon-theme, librsvg2-common and xvfb installed.
set -e
here=$(cd "$(dirname "$0")/../.." && pwd)
out=$1; image=${2:-localhost/gabarit-gtk-arm64}
mkdir -p "$out"
podman run --rm -v "$here":/gabarit:ro -v "$out":/out "$image" sh -c '
set -e
command -v Xvfb >/dev/null || { apt-get update -qq >/dev/null && apt-get install -y -qq --no-install-recommends libgtk-4-dev adwaita-icon-theme librsvg2-common xvfb >/dev/null 2>&1; }
mkdir -p /tmp/gabarit && cd /gabarit && tar cf - --exclude=.build --exclude=node_modules --exclude=.git . | tar xf - -C /tmp/gabarit
cd /tmp/gabarit/galerie/gtk && swift build 2>&1 | grep -E "error|warning: |Build complete" | grep -v "^\[" | tail -30
Xvfb :9 -screen 0 1280x860x24 >/dev/null 2>&1 & sleep 1
DISPLAY=:9 GSK_RENDERER=cairo .build/debug/GabaritGtkGallery /out
'
