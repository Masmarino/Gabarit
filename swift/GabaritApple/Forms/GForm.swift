#if canImport(SwiftUI)
import SwiftUI

// Gabarit's settings pages, like Discord's or the Mac's System Settings: the page's title large in the page (no band),
// its sections as crisp cards on the ground, a reading width aligned left, rows of a constant height split by a fine
// line, a section's sentence discreet below. `GForm` draws them so everywhere (Mac, iPhone, iPad); `gFormLayout` false
// gives the system's `Form`.

/// The settings pages' measures: a 4-point grid.
public enum GFormMetrics {
    /// The content's reading width.
    public static let readable: CGFloat = 680
    /// A single column of cards (a narrow window): a little wider than the settings'.
    public static let column: CGFloat = 760
    /// The maximum width of a wide page, centred by `GPageContainer`, or of a tool.
    public static let wide: CGFloat = 1160
    /// A page's left margin (settings); a sheet's (editors), tighter. On iPhone and iPad, the system lists'.
    #if os(macOS)
    public static let pageMargin: CGFloat = 40
    public static let sheetMargin: CGFloat = 24
    #else
    public static let pageMargin: CGFloat = 20
    public static let sheetMargin: CGFloat = 20
    #endif
    /// A simple row's height (taller under the finger).
    #if os(macOS)
    public static let rowHeight: CGFloat = 44
    #else
    public static let rowHeight: CGFloat = 52
    #endif
    /// The space between two sections.
    public static let sectionSpacing: CGFloat = 32
    /// The margin above a page's title; the smallest touch target (iPhone, iPad).
    #if os(macOS)
    public static let pageTop: CGFloat = 36
    public static let touchTarget: CGFloat = 0
    #else
    public static let pageTop: CGFloat = 24
    public static let touchTarget: CGFloat = 44
    #endif
}

/// A settings page's title, drawn at the head of the form.
public struct GFormTitle {
    public var title: String
    public var summary: String
    /// The name of the page one comes from (a sub-page): "‹ Name" above the title, and ⌘[.
    public var back: String?
    public var onBack: (() -> Void)?

    public init(title: String, summary: String, back: String? = nil, onBack: (() -> Void)? = nil) {
        self.title = title
        self.summary = summary
        self.back = back
        self.onBack = onBack
    }
}

public extension EnvironmentValues {
    /// The page's title, at the head of the form.
    @Entry var gFormTitle: GFormTitle?
    /// The pages drawn in this container (Mac): centred in this maximum width, as by `GPageContainer`. Nil: each page
    /// keeps its own layout.
    @Entry var gPageContainer: CGFloat?
    /// In a form card's row: the card draws the hover over the whole row.
    @Entry var gFormCardRow = false
}

public extension ContainerValues {
    /// A row laid right on the page's ground, out of its section's card (a preview, a grid, an empty state).
    @Entry var gFormBare = false
}

public extension View {
    /// A row laid right on the ground, out of its section's card: in the system's `Form`, with no row ground; in
    /// Gabarit's, out of the card.
    func gFormBare() -> some View {
        listRowBackground(Color.clear).containerValue(\.gFormBare, true)
    }
}

/// A Gabarit form, like settings pages: the title in the page, the sections as crisp cards, a reading width.
/// `gFormLayout` false: the system's `Form`.
public struct GForm<Content: View>: View {
    @ViewBuilder let content: Content
    @Environment(\.gFormLayout) private var gabarit

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        if gabarit {
            GFormLayout { content }
        } else {
            systemForm
        }
    }

    private var systemForm: some View {
        Form {
            Group { content }
                // A flat ground: a gradient, redrawn row by row, made bands.
                .listRowBackground(GColor.surface)
        }
        .formStyle(.grouped)
        .scrollContentBackground(.hidden)
        .gControls()
        .gPageGround()
    }
}

/// A wide page's container (Mac): like a CSS container (`max-width` and `margin: 0 auto`), a maximum width centred in
/// the page, with the pages' margins on each side. The page's title goes in it too. Settings keep their reading column
/// aligned left (`GFormLayout`).
public struct GPageContainer<Content: View>: View {
    var maxWidth: CGFloat
    @ViewBuilder let content: Content

    public init(maxWidth: CGFloat = GFormMetrics.wide, @ViewBuilder content: () -> Content) {
        self.maxWidth = maxWidth
        self.content = content()
    }

    public var body: some View {
        content
            .frame(maxWidth: maxWidth, alignment: .leading)
            .padding(.horizontal, GFormMetrics.pageMargin)
            .frame(maxWidth: .infinity, alignment: .center)
    }
}

/// A page's title: large and bold, the sentence that says what it is for more discreet below.
public struct GPageTitle: View {
    let title: String
    let summary: String
    /// On iPhone and iPad, a notch under the system's large title: the page already carries the top bar.
    #if os(macOS)
    public static var font: Font { GFont.largeTitle }
    #else
    public static var font: Font { GFont.title }
    #endif

    public init(title: String, summary: String) {
        self.title = title
        self.summary = summary
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(Self.font).foregroundStyle(GColor.textPrimary)
                .accessibilityAddTraits(.isHeader)
            if !summary.isEmpty {
                Text(summary).font(GFont.body).foregroundStyle(GColor.textDiscret)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// Gabarit's form: the page's title, then each section as a card, in a reading width.
public struct GFormLayout<Content: View>: View {
    @ViewBuilder let content: Content
    @Environment(\.gFormTitle) private var page

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        let margin = page == nil ? GFormMetrics.sheetMargin : GFormMetrics.pageMargin
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                if let page {
                    if let back = page.back, let onBack = page.onBack {
                        Button(action: onBack) {
                            GHover { hovering in
                                Label(back, systemImage: "chevron.left")
                                    .labelStyle(GCompactLabelStyle())
                                    .font(GFont.callout.weight(.medium))
                                    .foregroundStyle(GColor.accentText)
                                    .underline(hovering)
                                    .contentShape(Rectangle())
                            }
                        }
                        .buttonStyle(.plain)
                        .keyboardShortcut("[", modifiers: .command)
                        .help(gText("Back to \(back) (⌘[)"))
                        .padding(.bottom, 10)
                        .frame(minHeight: GFormMetrics.touchTarget)
                    }
                    GPageTitle(title: page.title, summary: page.summary).padding(.bottom, 28)
                }
                VStack(alignment: .leading, spacing: GFormMetrics.sectionSpacing) {
                    ForEach(sections: content) { section in
                        GFormSection(section: section)
                    }
                }
            }
            .frame(maxWidth: GFormMetrics.readable, alignment: .leading)
            .padding(.horizontal, margin)
            .padding(.top, page == nil ? 16 : GFormMetrics.pageTop)
            .padding(.bottom, 48)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollBounceBehavior(.basedOnSize)
        .labeledContentStyle(GLabeledContentStyle())
        // Its fields have no frame of their own: the card is their frame (a frame in a frame), the row their room. Set
        // for the whole form: a field takes its style from where the form's rows are declared, not from its card.
        .textFieldStyle(GTextFieldStyle(bare: true))
        .gControls()
        .labelStyle(GFormRowLabelStyle())
        .gPageGround()
    }
}

/// A section: its title, its rows in a card (or right on the ground), its sentence discreet below.
private struct GFormSection: View {
    let section: SectionConfiguration

    var body: some View {
        let rows = section.content
        let bare = !rows.isEmpty && rows.allSatisfy { $0.containerValues.gFormBare }
        if !rows.isEmpty || !section.header.isEmpty || !section.footer.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                if !section.header.isEmpty {
                    section.header
                        .font(GFont.headline)
                        .foregroundStyle(GColor.textPrimary)
                        .labelStyle(GHeaderLabelStyle())
                        .accessibilityAddTraits(.isHeader)
                        .padding(.bottom, 4)
                }
                if bare {
                    VStack(alignment: .leading, spacing: 12) {
                        ForEach(rows) { $0.frame(maxWidth: .infinity, alignment: .leading) }
                    }
                } else if !rows.isEmpty {
                    card(rows)
                }
                if !section.footer.isEmpty {
                    section.footer
                        .font(GFont.callout)
                        .foregroundStyle(GColor.textDiscret)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.horizontal, 2)
                }
            }
        }
    }

    private func card(_ rows: SubviewsCollection) -> some View {
        let shape = RoundedRectangle(cornerRadius: GRadius.lg, style: .continuous)
        return VStack(spacing: 0) {
            ForEach(Array(rows.enumerated()), id: \.element.id) { index, row in
                if index > 0 { Rectangle().fill(GColor.hairline).frame(height: 1).padding(.leading, 16) }
                if row.containerValues.gFormBare {
                    row.frame(maxWidth: .infinity, alignment: .leading).padding(12)
                } else {
                    GFormCardRow {
                        // A button laid as it is here is a row (GFormButtonStyle, from the form's controls).
                        row
                            .frame(maxWidth: .infinity, minHeight: GFormMetrics.rowHeight - 16, alignment: .leading)
                            .contentShape(Rectangle())
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                    }
                }
            }
        }
        // The card rests on the page: its shadow is the ground's, not its rows'.
        .background { shape.fill(GColor.surface).gShadow(GShadowValues.card) }
        .overlay { shape.strokeBorder(GColor.hairline, lineWidth: 1) }
    }
}

/// A card-row button: its text in the accent (red if it destroys), full width; the veil on hover (Mac), dimmed while
/// pressed.
public struct GFormRowButtonStyle: ButtonStyle {
    public init() {}

    public func makeBody(configuration: Configuration) -> some View {
        GFormRowButton(configuration: configuration)
    }
}

private struct GFormRowButton: View {
    let configuration: ButtonStyleConfiguration
    @Environment(\.isEnabled) private var isEnabled

    var body: some View {
        configuration.label
            .font(GFont.body)
            .foregroundStyle(configuration.role == .destructive ? GTone.error.text : GColor.accentText)
            .frame(maxWidth: .infinity, alignment: .leading)
            .contentShape(Rectangle())
            .opacity(isEnabled ? (configuration.isPressed ? 0.6 : 1) : GOpacity.disabled)
            .modifier(GRowHover())
    }
}

/// A form's label: its icon in a column of its own, so that the rows' texts line up whatever the icon's width.
private struct GFormRowLabelStyle: LabelStyle {
    @ScaledMetric(relativeTo: .body) private var column: CGFloat = 32

    func makeBody(configuration: Configuration) -> some View {
        HStack(spacing: 8) {
            configuration.icon.frame(width: column)
            configuration.title
        }
    }
}

/// A section title with an icon: the icon discreet, tight against the text.
private struct GHeaderLabelStyle: LabelStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack(spacing: 6) {
            configuration.icon.foregroundStyle(GColor.textDiscret).imageScale(.small)
            configuration.title
        }
    }
}

/// A small icon tight against its text (the "‹ Back" above a page's title).
private struct GCompactLabelStyle: LabelStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack(spacing: 3) {
            configuration.icon.imageScale(.small)
            configuration.title
        }
    }
}

/// A value and its title (Mac): the title on the left, the value on the right, against the edge, more discreet.
public struct GLabeledContentStyle: LabeledContentStyle {
    public init() {}

    public func makeBody(configuration: Configuration) -> some View {
        HStack(alignment: .center, spacing: 12) {
            configuration.label.font(GFont.body).foregroundStyle(GColor.textPrimary)
            Spacer(minLength: 12)
            configuration.content
                .font(GFont.body.monospacedDigit())
                .foregroundStyle(GColor.textSecondary)
                .multilineTextAlignment(.trailing)
        }
    }
}

/// A form section's buttons: side by side and aligned right on a single row, as in System Settings; one under the
/// other when room is short (iPhone); under a system `Form`, one row per button.
public struct GFormButtons<Content: View>: View {
    /// On the Mac, on the left rather than the right (a lone button at the head of a page).
    var leading: Bool
    @ViewBuilder let content: Content
    @Environment(\.gSystemControls) private var system

    public init(leading: Bool = false, @ViewBuilder content: () -> Content) {
        self.leading = leading
        self.content = content()
    }

    public var body: some View {
        if system {
            content
        } else {
            ViewThatFits(in: .horizontal) {
                HStack(spacing: 8) {
                    if !leading { Spacer(minLength: 0) }
                    content
                    if leading { Spacer(minLength: 0) }
                }
                VStack(alignment: .leading, spacing: 8) { content }
            }
        }
    }
}

/// A sheet's main button, full width (Gabarit's ink), laid right on the ground.
/// The primary one is the sheet's default: Return triggers it.
public struct GSheetButton: View {
    let title: String
    var variant: GButtonVariant
    let action: () -> Void

    public init(title: String, variant: GButtonVariant = .primary, action: @escaping () -> Void) {
        self.title = title
        self.variant = variant
        self.action = action
    }

    public var body: some View {
        Button(action: action) { Text(title).frame(maxWidth: .infinity) }
            .buttonStyle(GButtonStyle(variant: variant, compact: false))
            .keyboardShortcut(variant == .primary ? .defaultAction : nil)
            // Right on the ground, out of its section's card.
            .gFormBare()
    }
}

/// A sheet's title (an editor): large in the sheet, its sentence below, the cross on the right (Escape). No band: the
/// sheet keeps the page's ground.
public struct GSheetTitle: View {
    let title: String
    let summary: String
    var close: String?
    /// A page pushed in the sheet (Mac): the arrow back to the previous one, before the title.
    var back: (() -> Void)?
    let dismiss: () -> Void
    #if os(macOS)
    public static var font: Font { GFont.title }
    #else
    public static var font: Font { GFont.title2 }
    #endif

    public init(title: String, summary: String, close: String? = nil, back: (() -> Void)? = nil,
                dismiss: @escaping () -> Void) {
        self.title = title
        self.summary = summary
        self.close = close
        self.back = back
        self.dismiss = dismiss
    }

    public var body: some View {
        HStack(alignment: .top, spacing: 16) {
            if let back {
                Button(action: back) {
                    GHover { hovering in
                        Image(systemName: "chevron.left").font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(hovering ? GColor.textPrimary : GColor.textSecondary)
                            .frame(width: 30, height: 30)
                            .background(hovering ? GColor.border.opacity(0.3) : GColor.track, in: Circle())
                            .contentShape(Circle())
                    }
                }
                .buttonStyle(.plain)
                // ⌘[ as the page's back link: ⌘← stays the text fields' (the start of the line).
                .keyboardShortcut("[", modifiers: .command)
                .help(gText("Back"))
                .accessibilityLabel(gText("Back"))
                .padding(.top, 4)
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(title).font(Self.font).foregroundStyle(GColor.textPrimary).lineLimit(2)
                    .accessibilityAddTraits(.isHeader)
                Text(summary).font(GFont.callout).foregroundStyle(GColor.textDiscret)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
            GCloseButton(title: close, onFrame: false, action: dismiss)
        }
        .padding(.horizontal, GFormMetrics.sheetMargin)
        .padding(.top, 22)
        .padding(.bottom, 8)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
#endif
