#!/usr/bin/env python3
"""Checks GabaritWinUI's XAML without Windows (CI): what WinUI would only say when an app loads it.

    python3 tools/xaml_check.py

- every {StaticResource}/{ThemeResource} resolves, in Gabarit's files (in merge order) or among WinUI's own keys;
- a StaticResource is never used before its definition in the same file (WinUI reads a dictionary in order);
- the Light and Dark theme dictionaries define the same keys, and HighContrast every Gabarit key they define that a
  ThemeResource reads (otherwise the page fails to load under a contrast theme);
- the keys are XAML names (letters, digits, "_");
- every font address points to a file of Resources/Fonts;
- no dictionary defines a key twice (loading tolerates it, Microsoft's XAML compiler refuses it: WMC0065);
- a style for a RadioButton or a ToggleSwitch sets MinWidth (WinUI's own are 120 and 154 wide), and the switch has its
  own template (WinUI's keeps 154 inside whatever the style says);
- a field's padding, rim and line of body text fit its 30, as on the Mac;
- the page's style draws the frame behind its corner, the header's behind its line;
- the caption buttons' hover and press colours are solid (the system ignores their alpha);
- every Gabarit key the README names exists.
"""
import json
import math
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
# IBM Plex's line, ascent and descent over the size.
LINE_HEIGHT = 1.3


def repeated_keys(tree: ET.Element) -> list[str]:
    """The keys defined twice in one dictionary (the root, each theme's, each ResourceDictionary inside)."""
    found = []
    for dictionary in tree.iter():
        if dictionary.tag.endswith("ResourceDictionary"):
            keys = [child.get(X) for child in dictionary if child.get(X)]
            found += sorted({key for key in keys if keys.count(key) > 1})
    return found


def style_problems(controls: str, gabarit: str) -> list[str]:
    """What the Windows trial showed and a reference check cannot see."""
    problems = []
    styles = {m.group(1): m.group(0) for m in re.finditer(r'<Style x:Key="(\w+)".*?</Style>', controls, re.S)}
    for key, style in styles.items():
        if re.search(r'TargetType="(RadioButton|ToggleSwitch)"', style.split(">", 1)[0]) and '<Setter Property="MinWidth"' not in style:
            problems.append(f"Controls.xaml: {key} does not set MinWidth, WinUI's would stay")
    if '<ControlTemplate TargetType="ToggleSwitch">' not in styles.get("GSwitchStyle", ""):
        problems.append("Controls.xaml: GSwitchStyle has no template, WinUI's keeps 154 wide")
    if "GFrameBrush" not in styles.get("GShellPageStyle", ""):
        problems.append("Controls.xaml: GShellPageStyle does not draw the frame behind its corner")
    if 'Property="BackgroundSizing" Value="OuterBorderEdge"' not in styles.get("GWindowHeaderStyle", ""):
        problems.append("Controls.xaml: GWindowHeaderStyle's translucent line would show what is behind the header")
    body = json.loads((ROOT / "tokens/gabarit.json").read_text(encoding="utf-8"))["text"]["body"]["desktop"]
    height = float(re.search(r'"TextControlThemeMinHeight">([\d.]+)<', gabarit).group(1))
    _, top, _, bottom = (float(v) for v in re.search(r'"TextControlThemePadding">([^<]+)<', gabarit).group(1).split(","))
    if top + bottom + 2 + math.ceil(body * LINE_HEIGHT) != height:
        problems.append(f"Gabarit.xaml: a field's padding {top} + {bottom}, rim and line of {body} are not {height} high")
    for key in ("GFrameCaptionHoverBrush", "GFrameCaptionPressedBrush"):
        colours = re.findall(rf'x:Key="{key}" Color="(#\w+)"', gabarit)
        if len(colours) != 2 or any(not colour.startswith("#FF") for colour in colours):
            problems.append(f"Gabarit.xaml: {key} must be solid in Light and Dark: {colours}")
    return problems


def main() -> int:
    problems, defined, themed = [], set(), {}
    for name in ORDER:
        text = (RESOURCES / name).read_text(encoding="utf-8")
        tree = ET.fromstring(text)
        problems += [f"{name}: the key {key} is defined twice in a dictionary" for key in repeated_keys(tree)]
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
    problems += style_problems((RESOURCES / "Controls.xaml").read_text(encoding="utf-8"), (RESOURCES / "Gabarit.xaml").read_text(encoding="utf-8"))
    readme = (RESOURCES.parent / "README.md").read_text(encoding="utf-8")
    for key in sorted(set(re.findall(r"`(G[A-Z]\w+(?:Style|Brush))`", readme))):
        if not re.search(rf'x:Key="{key}"', every):
            problems.append(f"README.md: {key} does not exist")
    print("\n".join(problems) or "XAML: every reference resolves")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
