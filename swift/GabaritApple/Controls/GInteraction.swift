#if canImport(SwiftUI)
import SwiftUI

// How Gabarit's clickable things answer the pointer: a hover state (Mac, iPad with a trackpad), read by `GHover`.

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
            .animation(.easeOut(duration: 0.12), value: hovering)
    }
}
#endif
