#if canImport(SwiftUI)
import SwiftUI

// MARK: The page's ground

/// How a page paints its ground (a page, a form, a sheet's page). By default (4.0), nothing where a ground is already
/// laid above (`gGround` at the root of the window: the page is on it), the ground in force otherwise. `plain`: Gabarit's
/// flat background, as in 3.x. An application paints its own through `gPagePaint`. `edges`: up to the screen's edges.
/// (3.x called this `GGround`, and its environment value `gGround`: those names are now the ground's.)
public struct GPagePaint: Sendable {
    let paint: @MainActor @Sendable (AnyView, _ edges: Bool) -> AnyView

    public init(paint: @escaping @MainActor @Sendable (AnyView, _ edges: Bool) -> AnyView) {
        self.paint = paint
    }

    /// The ground in force (`gGround`), unless one is laid above already.
    public static let ground = GPagePaint { view, edges in
        AnyView(view.modifier(GPageOnGround(edges: edges)))
    }

    /// Gabarit's flat background, lit at its top (3.x's default).
    public static let plain = GPagePaint { view, edges in
        AnyView(view
            .background {
                LinearGradient(stops: [.init(color: GColor.pageLight, location: 0), .init(color: .clear, location: 0.4)], startPoint: .top, endPoint: .bottom)
                    .ignoresSafeArea(edges: edges ? .all : [])
                    .allowsHitTesting(false)
            }
            .background { GColor.background.ignoresSafeArea(edges: edges ? .all : []).allowsHitTesting(false) })
    }
}

/// A page on the ground: nothing of its own when the ground is laid above it, the ground otherwise.
private struct GPageOnGround: ViewModifier {
    let edges: Bool
    @Environment(\.gGroundPainted) private var painted

    func body(content: Content) -> some View {
        if painted {
            content
        } else {
            content.background { GGround().ignoresSafeArea(edges: edges ? .all : []) }
        }
    }
}

public extension EnvironmentValues {
    /// How pages paint their ground (`gPageGround()`): set once at the root of each window.
    @Entry var gPagePaint = GPagePaint.ground
    /// A ground is already laid above (`gGround`, a sheet's glass): a page does not paint it twice. A window of its own
    /// sets it back to false.
    @Entry var gGroundPainted = false
}

public extension View {
    /// The page's ground behind this view, as the application paints it (`gPagePaint`).
    func gPageGround(edges: Bool = true) -> some View {
        modifier(GPageGround(edges: edges))
    }
}

private struct GPageGround: ViewModifier {
    let edges: Bool
    @Environment(\.gPagePaint) private var paint

    func body(content: Content) -> some View {
        paint.paint(AnyView(content), edges)
    }
}

// MARK: Sheets

public extension View {
    /// A sheet's ground (4.0): the ground in force under thick glass (a sheet is content, and carries forms). On iPhone
    /// and iPad, the sheet's own background; on the Mac, behind the view. The pages in it paint nothing more.
    func gSheetGround() -> some View { modifier(GSheetGroundModifier()) }
}

/// The ground in force, under its thick glass: dense, so that a form reads on any ambiance.
public struct GSheetGround: View {
    @Environment(\.gResolvedGround) private var spec
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    public init() {}

    public var body: some View {
        ZStack {
            GGroundPaint(spec: spec)
            Color(spec.glass.opacity(reduceTransparency ? GGlassValues.reduced : GGlassDensity.thick.opacity(spec.kind)))
        }
        .ignoresSafeArea()
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

private struct GSheetGroundModifier: ViewModifier {
    func body(content: Content) -> some View {
        #if os(iOS)
        content
            .environment(\.gGroundPainted, true)
            .environment(\.gOnSurface, true)
            .presentationBackground { GSheetGround() }
        #else
        content
            .environment(\.gGroundPainted, true)
            .environment(\.gOnSurface, true)
            .background { GSheetGround() }
        #endif
    }
}

/// A Gabarit sheet's stack: on iPhone and iPad, a navigation stack (its bar on the page's grey, its buttons); on the Mac,
/// nothing: the sheet draws its header itself (`gSheet`), without the system's bar or buttons.
public struct GSheetStack<Content: View>: View {
    @ViewBuilder let content: Content

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        #if os(iOS)
        NavigationStack { content }
            // A sheet is content: thick glass on the ground, its pages on it.
            .gSheetGround()
            .environment(\.gInSheet, true)
        #else
        content.gSheetGround().environment(\.gInSheet, true)
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

    /// A sheet page: on iPhone and iPad, a top bar on the page's grey; a form (`GForm`) carries the title large in the
    /// page, and the sentence that says what it is for. Bar buttons go through `GToolbarItem`.
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
/// A sheet's page on iPhone and iPad: the bar on the page's grey; the title large in a Gabarit form, or, under a system
/// `Form`, the header band.
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
            .environment(\.gInSheet, true)
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

    private func finish() {
        onClose?()
        dismiss()
    }

    func body(content: Content) -> some View {
        chrome(content)
    }

    private func chrome(_ content: Content) -> some View {
        // Always the title large in the sheet and the cross on the right, on the page's grey: what tells a sheet from a
        // page (the dark frame).
        VStack(spacing: 0) {
            GSheetTitle(title: title, summary: summary, close: close, back: back) { finish() }
            content.environment(\.gFormTitle, nil).frame(maxHeight: .infinity)
        }
        // A sheet is content: thick glass on the ground (4.0), no rim.
        .gSheetGround()
        #if os(iOS)
        // The title and the cross are in the sheet: no system bar above (pages pushed in the stack have theirs).
        .toolbar(.hidden, for: .navigationBar)
        #endif
        .modifier(GSheetAppearance())
        .environment(\.gInSheet, true)
    }
}
#endif
