#if canImport(SwiftUI)
import SwiftUI

// How Gabarit's clickable things answer the pointer: a hover state (Mac, iPad with a trackpad), read by `GHover`, and
// the pointing hand over them on the Mac (`gPointer`).

public extension View {
    /// Dimmed when disabled (`GOpacity.disabled`), the same for every control.
    func gDimmedWhenDisabled() -> some View { modifier(GDimmed()) }

    /// The pointing hand over this view on the Mac: it can be clicked.
    @ViewBuilder func gPointer() -> some View {
        #if os(macOS)
        pointerStyle(.link)
        #else
        self
        #endif
    }
}

/// Reads whether the pointer is over its content, and redraws it so: `GHover { hovering in … }`.
public struct GHover<Content: View>: View {
    @State private var hovering = false
    @Environment(\.isEnabled) private var isEnabled
    let content: (Bool) -> Content

    public init(@ViewBuilder content: @escaping (_ hovering: Bool) -> Content) {
        self.content = content
    }

    public var body: some View {
        content(hovering && isEnabled)
            .onHover { hovering = $0 }
            .gPointer()
            .animation(.easeOut(duration: 0.12), value: hovering)
    }
}

private struct GDimmed: ViewModifier {
    @Environment(\.isEnabled) private var isEnabled

    func body(content: Content) -> some View {
        content.opacity(isEnabled ? 1 : GOpacity.disabled)
    }
}
#endif
