#if canImport(SwiftUI)
import SwiftUI

// MARK: The page's ground

/// How a page's ground is painted (a page, a form, a sheet). By default, Gabarit's background; an application with
/// colour themes paints its own (a gradient under a veil) through `gGround`. `edges`: up to the screen's edges.
public struct GGround: Sendable {
    let paint: @MainActor @Sendable (AnyView, _ edges: Bool) -> AnyView

    public init(paint: @escaping @MainActor @Sendable (AnyView, _ edges: Bool) -> AnyView) {
        self.paint = paint
    }

    /// Gabarit's background, nothing else.
    public static let plain = GGround { view, edges in
        AnyView(view.background { GColor.background.ignoresSafeArea(edges: edges ? .all : []).allowsHitTesting(false) })
    }
}

public extension EnvironmentValues {
    /// How pages paint their ground (`gPageGround()`): set once at the root of each window.
    @Entry var gGround = GGround.plain
    /// A ground is already painted above (a page in a window): an application's ground does not paint it twice. A sheet,
    /// another window, sets it back to false.
    @Entry var gGroundPainted = false
}

public extension View {
    /// The page's ground behind this view, as the application paints it (`gGround`).
    func gPageGround(edges: Bool = true) -> some View {
        modifier(GPageGround(edges: edges))
    }
}

private struct GPageGround: ViewModifier {
    let edges: Bool
    @Environment(\.gGround) private var ground

    func body(content: Content) -> some View {
        ground.paint(AnyView(content), edges)
    }
}

// MARK: Sheets

/// A Gabarit sheet's stack: on iPhone and iPad, a navigation stack (its dark bar, its buttons); on the Mac, nothing:
/// the sheet draws its header itself (`gSheet`), without the system's bar or buttons.
public struct GSheetStack<Content: View>: View {
    @ViewBuilder let content: Content

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        #if os(iOS)
        NavigationStack { content }
            // A sheet is another window: its ground is not the page's that opens it.
            .environment(\.gGroundPainted, false)
        #else
        content.environment(\.gGroundPainted, false)
        #endif
    }
}

public extension View {
    /// A Gabarit sheet closed by a button: the title large in the sheet and Gabarit's cross (Escape), no system bar or
    /// button; what it does ("Start", "Create") is a button in the sheet. On iPhone and iPad, the sheet's stack
    /// (`GSheetStack`) keeps its bar for the pages pushed in it. `onClose`: what closing does before it closes (save a
    /// changed name…); without it, it closes. `back`: a page pushed in the sheet on the Mac (the arrow before the title).
    func gSheet(symbol: String, title: String, summary: String, close: String? = nil, confirm: Bool = false,
                onClose: (() -> Void)? = nil, back: (() -> Void)? = nil) -> some View {
        modifier(GSheetChrome(symbol: symbol, title: title, summary: summary, close: close ?? gText("Cancel"),
                              confirm: confirm, onClose: onClose, back: back))
    }

    /// A sheet page like settings pages: on iPhone and iPad, the dark top bar and its title; a form (`GForm`) carries
    /// the title large in the page, and the sentence that says what it is for. Bar buttons go through `GToolbarItem`.
    func gSheetPage(symbol: String, title: String, summary: String) -> some View {
        #if os(iOS)
        modifier(GSheetPageChrome(symbol: symbol, title: title, summary: summary))
        #else
        modifier(GSheetAppearance()).navigationTitle(title)
        #endif
    }
}

/// A sheet is a window of its own: it takes the appearance of the view that opens it.
private struct GSheetAppearance: ViewModifier {
    @Environment(\.colorScheme) private var colorScheme

    func body(content: Content) -> some View {
        content.preferredColorScheme(colorScheme)
    }
}

#if os(iOS)
/// A sheet's page on iPhone and iPad: the dark bar; the title large in a Gabarit form, or, under a system `Form`, the
/// header band.
private struct GSheetPageChrome: ViewModifier {
    let symbol: String
    let title: String
    let summary: String
    @Environment(\.gFormLayout) private var gabarit

    func body(content: Content) -> some View {
        content
            .environment(\.gFormTitle, gabarit ? GFormTitle(title: title, summary: summary) : nil)
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .gFrameToolbar()
            .toolbar { ToolbarItem(placement: .principal) { Color.clear.frame(width: 1, height: 1) } }
            .safeAreaInset(edge: .top, spacing: 0) {
                if !gabarit { GPageBand(symbol: symbol, title: title, summary: summary) }
            }
            .modifier(GSheetAppearance())
    }
}
#endif

private struct GSheetChrome: ViewModifier {
    let symbol: String
    let title: String
    let summary: String
    let close: String
    let confirm: Bool
    var onClose: (() -> Void)?
    var back: (() -> Void)?
    @Environment(\.dismiss) private var dismiss
    @Environment(\.gFormLayout) private var gabarit

    private func finish() {
        onClose?()
        dismiss()
    }

    func body(content: Content) -> some View {
        chrome(content)
            // A sheet is another window: its ground is not the page's that opens it.
            .environment(\.gGroundPainted, false)
    }

    @ViewBuilder private func chrome(_ content: Content) -> some View {
        if gabarit {
            // Editors: the title large in the sheet, the cross on the right; no band.
            VStack(spacing: 0) {
                GSheetTitle(title: title, summary: summary, close: close, back: back) { finish() }
                content.environment(\.gFormTitle, nil).frame(maxHeight: .infinity)
            }
            .gPageGround()
            #if os(iOS)
            // The title and the cross are in the sheet: no system bar above (pages pushed in the stack have theirs).
            .toolbar(.hidden, for: .navigationBar)
            #endif
            .modifier(GSheetAppearance())
        } else {
            #if os(iOS)
            // Under a system `Form`: the dark bar, its button, the band.
            content
                .gSheetPage(symbol: symbol, title: title, summary: summary)
                .toolbar {
                    if confirm {
                        GToolbarItem(placement: .confirmationAction) { Button(close) { finish() } }
                    } else {
                        GToolbarItem(placement: .cancellationAction) { Button(close) { finish() } }
                    }
                }
            #else
            VStack(spacing: 0) {
                GPageBand(symbol: symbol, title: title, summary: summary, top: 18) {
                    GCloseButton(title: close) { finish() }
                }
                content.frame(maxHeight: .infinity)
            }
            .gPageGround()
            .modifier(GSheetAppearance())
            #endif
        }
    }
}
#endif
