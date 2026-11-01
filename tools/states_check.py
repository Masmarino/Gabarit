#!/usr/bin/env python3
"""Every control the pointer can reach answers it, on the desktop: under the pointer and held down.

GTK: each interactive selector of components.css has its :hover and its :active. WinUI: each control template of
Controls.xaml has its PointerOver and its Pressed state. Run in CI, next to xaml_check.py.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
errors = []

css = (ROOT / "swift/GabaritGtk/Resources/components.css").read_text(encoding="utf-8")
GTK = ["button.g-primary", "button.g-secondary", "button.g-ghost", "button.g-danger", "button.g-chip", "button.g-close",
       "button.g-stepper-step", "button.g-menu-item", "button.g-nav-tab", "button.g-rail-button", "button.g-rail-square",
       "button.g-row-button", "button.g-sheet-back", "button.g-command-k", ".g-rail-item", ".g-sidebar-row",
       "dropdown.g-menu > button", "menubutton.g-menu-button > button", "scale.g-slider > trough > slider"]
for selector in GTK:
    bare = selector.removeprefix("button")
    for state in (":hover", ":active"):
        if selector + state not in css and bare + state not in css:
            errors.append(f"GTK: {selector}{state} is missing")
for selector in ("entry.g-field", "textview.g-field", "switch.g-switch"):
    if selector + ":hover" not in css:
        errors.append(f"GTK: {selector}:hover is missing")

xaml = (ROOT / "swift/GabaritWinUI/Resources/Controls.xaml").read_text(encoding="utf-8")
for style in re.finditer(r'<Style x:Key="(\w+)".*?</Style>', xaml, re.S):
    if "<ControlTemplate" not in style.group(0) or "VisualStateGroup" not in style.group(0):
        continue
    for state in ("PointerOver", "Pressed"):
        if f'x:Name="{state}"' not in style.group(0):
            errors.append(f"WinUI: {style.group(1)} has no {state} state")

for error in errors:
    print(error, file=sys.stderr)
if errors:
    sys.exit(1)
print("States: every control answers the pointer")
