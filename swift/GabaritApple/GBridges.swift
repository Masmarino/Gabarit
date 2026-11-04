#if canImport(SwiftUI)
@_exported import GabaritCommon
import CoreText
import SwiftUI

// What turns the plain values of GabaritCommon into SwiftUI's colours, fonts and animations.

public extension Color {
    init(_ color: GRGBA) {
        self.init(.sRGB, red: color.red, green: color.green, blue: color.blue, opacity: color.alpha)
    }

    /// A colour that follows the appearance (light or dark).
    init(_ pair: GColorPair) {
        let light = Color(pair.light), dark = Color(pair.dark)
        #if os(macOS)
        self.init(nsColor: NSColor(name: nil) { appearance in
            appearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? NSColor(dark) : NSColor(light)
        })
        #else
        self.init(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark ? UIColor(dark) : UIColor(light)
        })
        #endif
    }
}

public extension Font {
    /// A text style of Gabarit at a given size, scaling with the system style it is tied to.
    init(_ style: GTextStyle, size: Double) {
        let font = Font.custom(style.family.rawValue, size: size, relativeTo: Font.TextStyle(gabarit: style.system))
        switch style.weight {
        case .regular: self = font
        case .medium: self = font.weight(.medium)
        case .semibold: self = font.weight(.semibold)
        }
    }
}

extension Font.TextStyle {
    init(gabarit name: String) {
        switch name {
        case "largeTitle": self = .largeTitle
        case "title": self = .title
        case "title2": self = .title2
        case "title3": self = .title3
        case "headline": self = .headline
        case "subheadline": self = .subheadline
        case "callout": self = .callout
        case "footnote": self = .footnote
        case "caption": self = .caption
        case "caption2": self = .caption2
        default: self = .body
        }
    }
}

public extension Animation {
    init(_ curve: GAnimationCurve) {
        switch curve {
        case let .spring(response, damping): self = .spring(response: response, dampingFraction: damping)
        case let .easeInOut(duration): self = .easeInOut(duration: duration)
        case let .easeOut(duration): self = .easeOut(duration: duration)
        case let .linear(duration): self = .linear(duration: duration)
        }
    }
}

public extension View {
    /// One of Gabarit's shadows.
    func gShadow(_ shadow: GShadowSpec) -> some View {
        self.shadow(color: Color(shadow.color), radius: shadow.radius, x: shadow.x, y: shadow.y)
    }
}

/// The IBM Plex fonts shipped with Gabarit: register them once, at launch, before the first text is drawn.
public enum GFonts {
    @MainActor private static var registered = false

    @MainActor public static func register() {
        guard !registered else { return }
        registered = true
        for file in GFamily.files {
            let name = (file as NSString).deletingPathExtension
            guard let url = Bundle.module.url(forResource: name, withExtension: "ttf", subdirectory: "Fonts") else { continue }
            CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
        }
    }
}
#endif
