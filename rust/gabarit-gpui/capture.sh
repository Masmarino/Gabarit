#!/bin/sh
# Captures each page of the GPUI gallery, light and dark, as the Mac draws its window (screencapture -l, without its
# shadow), into captures/ (or the folder given). Usage: ./capture.sh [folder] [pages…]
# GROUND=aurore ./capture.sh …: on that ambiance (its own mode), one capture per page, named <page>-<ground>.png.
# The window is found by its number (CGWindowList), with a small Swift helper compiled on the fly.
set -e
here=$(cd "$(dirname "$0")" && pwd)
out=${1:-$here/captures}; shift 2>/dev/null || true
pages=${*:-"glass controls states forms frame feedback sheet menus text list"}
mkdir -p "$out"
tools=$(mktemp -d)
cat > "$tools/window.swift" <<'SWIFT'
import CoreGraphics
// The number of the largest normal window of the process given by its number (another app may be called galerie too).
let pid = Int(CommandLine.arguments[1]) ?? 0
let windows = CGWindowListCopyWindowInfo([.optionAll], kCGNullWindowID) as? [[String: Any]] ?? []
func area(_ w: [String: Any]) -> Double {
    let b = w[kCGWindowBounds as String] as? [String: Double] ?? [:]
    return (b["Width"] ?? 0) * (b["Height"] ?? 0)
}
if let window = windows.filter({ ($0[kCGWindowOwnerPID as String] as? Int) == pid && ($0[kCGWindowLayer as String] as? Int) == 0 }).max(by: { area($0) < area($1) }) {
    print(window[kCGWindowNumber as String]!)
}
SWIFT
swiftc -O "$tools/window.swift" -o "$tools/window" 2>/dev/null
cd "$here" && cargo build --bin galerie 2>&1 | grep -E "^(error|warning: unused)" || true
appearances="light dark"; [ -n "$GROUND" ] && appearances="$GROUND"
for page in $pages; do
    for appearance in $appearances; do
        extra=""; [ "$page" = sheet ] && extra="--sheet"
        if [ -n "$GROUND" ]; then extra="$extra --ground $GROUND"; mode=""; else mode="--$appearance"; fi
        ./target/debug/galerie --page "$page" $mode $extra &
        pid=$!
        sleep 4
        id=$("$tools/window" $pid)
        [ -n "$id" ] && screencapture -o -x -l "$id" "$out/$page-$appearance.png" && echo "$out/$page-$appearance.png"
        kill $pid 2>/dev/null; wait $pid 2>/dev/null || true
    done
done
rm -rf "$tools"
