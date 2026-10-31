#!/usr/bin/env python3
"""Phosphor's icons (MIT) for GTK, from the @phosphor-icons/core package (`npm pack @phosphor-icons/core`, unpacked).

    python3 tools/phosphor.py <package folder>

Copies the regular and filled icons to swift/GabaritGtk/Resources/icons/hicolor/scalable/actions as GTK symbolic icons
(gabarit-ph-<name>-symbolic.svg, gabarit-ph-<name>-fill-symbolic.svg: GTK paints them in the text's colour), with the
licence. tokens/symbols.json says which Phosphor icon draws each SF Symbol.
"""
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
THEME = ROOT / "swift/GabaritGtk/Resources/icons/hicolor"
# In an icon theme (hicolor, which GTK always searches): GTK paints only a theme's icons in the text's colour.
OUT = THEME / "scalable/actions"


def symbolic(text: str) -> str:
    """As GTK's symbolic icons are drawn: a size of 16 and one plain colour (GTK replaces it with the text's)."""
    return (text.replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">',
                         '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="#2e3436">')
                .replace("currentColor", "#2e3436"))


def main() -> int:
    package = Path(sys.argv[1])
    version = json.loads((package / "package.json").read_text())["version"]
    shutil.rmtree(THEME, ignore_errors=True)
    OUT.mkdir(parents=True)
    (THEME / "index.theme").write_text("[Icon Theme]\nName=Hicolor\nComment=Gabarit's icons (Phosphor)\nDirectories=scalable/actions\n\n"
                                       "[scalable/actions]\nSize=16\nMinSize=8\nMaxSize=512\nType=Scalable\nContext=Actions\n")
    count = 0
    for weight, suffix in (("regular", ""), ("fill", "-fill")):
        for svg in sorted((package / "assets" / weight).glob("*.svg")):
            name = svg.stem.removesuffix("-fill")
            (OUT / f"gabarit-ph-{name}{suffix}-symbolic.svg").write_text(symbolic(svg.read_text()))
            count += 1
    shutil.copy(package / "LICENSE", THEME / "PHOSPHOR-LICENSE")
    (THEME / "PHOSPHOR-VERSION").write_text(f"@phosphor-icons/core {version}\n")
    missing = [ph for ph in json.loads((ROOT / "tokens/symbols.json").read_text())["symbols"].values()
               if not (OUT / f"gabarit-ph-{ph}-symbolic.svg").exists()]
    print(f"Phosphor {version}: {count} icons" + (f", missing for symbols.json: {missing}" if missing else ""))
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())
