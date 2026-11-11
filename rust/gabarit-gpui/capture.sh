#!/bin/sh
# Captures each page of the GPUI gallery, light and dark, as the Mac draws its window (screencapture -l, without its
# shadow), into captures/ (or the folder given). Usage: ./capture.sh [folder] [pages…]
# The window is found by its number (CGWindowList), with a small Swift helper compiled on the fly.
set -e
here=$(cd "$(dirname "$0")" && pwd)
out=${1:-$here/captures}; shift 2>/dev/null || true
pages=${*:-"controls states forms frame feedback sheet menus text list"}
mkdir -p "$out"
tools=$(mktemp -d)
cat > "$tools/window.swift" <<'SWIFT'
import CoreGraphics
// The number of the first normal window of the process given by its name.
let owner = CommandLine.arguments[1]
let windows = CGWindowListCopyWindowInfo([.optionAll], kCGNullWindowID) as? [[String: Any]] ?? []
if let window = windows.first(where: { ($0[kCGWindowOwnerName as String] as? String) == owner && ($0[kCGWindowLayer as String] as? Int) == 0 }) {
    print(window[kCGWindowNumber as String]!)
}
SWIFT
swiftc -O "$tools/window.swift" -o "$tools/window" 2>/dev/null
cd "$here" && cargo build --bin galerie 2>&1 | grep -E "^(error|warning: unused)" || true
for page in $pages; do
    for appearance in light dark; do
        extra=""; [ "$page" = sheet ] && extra="--sheet"
        ./target/debug/galerie --page "$page" --$appearance $extra &
        pid=$!
        sleep 4
        id=$("$tools/window" galerie)
        [ -n "$id" ] && screencapture -o -x -l "$id" "$out/$page-$appearance.png" && echo "$out/$page-$appearance.png"
        kill $pid 2>/dev/null; wait $pid 2>/dev/null || true
    done
done
rm -rf "$tools"
