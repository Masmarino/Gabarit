#!/usr/bin/env python3
"""Checks GabaritWinUI's XAML without Windows (CI): what WinUI would only say when an app loads it.

    python3 tools/xaml_check.py

- every {StaticResource}/{ThemeResource} resolves, in Gabarit's files (in merge order) or among WinUI's own keys;
- a StaticResource is never used before its definition in the same file (WinUI reads a dictionary in order);
- the Light and Dark theme dictionaries define the same keys, and HighContrast every Gabarit key they define that a
  ThemeResource reads (otherwise the page fails to load under a contrast theme);
- the keys are XAML names (letters, digits, "_");
- every font address points to a file of Resources/Fonts.
"""
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RESOURCES = ROOT / "swift/GabaritWinUI/Resources"
# Controls.xaml merges these two first.
ORDER = ["Gabarit.xaml", "Icons.xaml", "Controls.xaml"]
X = "{http://schemas.microsoft.com/winfx/2006/xaml}Key"
REFERENCE = re.compile(r"\{(StaticResource|ThemeResource) ([^}]+)\}")
# WinUI's own resources Gabarit reads (the system's high-contrast colours).
WINUI_KEYS = re.compile(r"^SystemColor\w+Color$")
NAME = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
FONT = re.compile(r"ms-appx:///Gabarit/Fonts/([^#<\"]+)#")


def main() -> int:
    problems, defined, themed = [], set(), {}
    for name in ORDER:
        text = (RESOURCES / name).read_text(encoding="utf-8")
        tree = ET.fromstring(text)
        for theme in tree.iter():
            if theme.tag.endswith("ResourceDictionary") and theme.get(X):
                themed[theme.get(X)] = themed.get(theme.get(X), set()) | {child.get(X) for child in theme if child.get(X)}
        seen_here = set()
        for element in tree.iter():
            for value in list(element.attrib.values()) + [element.text or ""]:
                for kind, key in REFERENCE.findall(value):
                    key = key.strip()
                    if key in defined or key in seen_here or WINUI_KEYS.match(key):
                        continue
                    if any(key in keys for keys in themed.values()):
                        continue
                    later = re.search(rf'x:Key="{re.escape(key)}"', text)
                    problems.append(f"{name}: {kind} {key} " + ("used before its definition" if later else "not defined"))
            key = element.get(X)
            if key:
                seen_here.add(key)
                if not NAME.match(key):
                    problems.append(f"{name}: the key {key} is not a XAML name")
        defined |= seen_here
        for file in FONT.findall(text):
            if not (RESOURCES / "Fonts" / file).exists():
                problems.append(f"{name}: the font {file} is not in Resources/Fonts")
    light, dark, contrast = themed.get("Light", set()), themed.get("Dark", set()), themed.get("HighContrast", set())
    if light != dark:
        problems.append(f"Light and Dark differ: {sorted(light ^ dark)}")
    every = "\n".join((RESOURCES / name).read_text(encoding="utf-8") for name in ORDER)
    read = {key.strip() for kind, key in REFERENCE.findall(every) if kind == "ThemeResource"}
    missing = sorted(key for key in light & read if key.startswith("G") and key not in contrast)
    if missing:
        problems.append(f"HighContrast lacks: {missing}")
    print("\n".join(problems) or "XAML: every reference resolves")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
