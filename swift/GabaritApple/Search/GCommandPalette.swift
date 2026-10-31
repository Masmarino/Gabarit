#if canImport(SwiftUI)
import SwiftUI

/// An entry of the quick search (⌘K): a page, an action, a conversation, a note…
public struct GCommandItem: Identifiable {
    public let id: String
    public let label: String
    public var detail: String?
    public let icon: String
    public var keywords: [String]
    /// The shortcut shown on the right ("⌘ N"…).
    public var shortcut: String?
    public let perform: () -> Void

    public init(id: String, label: String, detail: String? = nil, icon: String, keywords: [String] = [],
                shortcut: String? = nil, perform: @escaping () -> Void) {
        self.id = id
        self.label = label
        self.detail = detail
        self.icon = icon
        self.keywords = keywords
        self.shortcut = shortcut
        self.perform = perform
    }
}

public struct GCommandGroup: Identifiable {
    public let title: String
    public let items: [GCommandItem]
    public var id: String { title }

    public init(title: String, items: [GCommandItem]) {
        self.title = title
        self.items = items
    }
}

public extension Notification.Name {
    /// Opens the quick search (the rail's "⌘ + K" button).
    static let gOpenCommandPalette = Notification.Name("gabarit.open-command-palette")
}

/// The quick search: a field, then the entries that match, by group; arrows to choose, Return to open, Escape to close.
public struct GCommandPalette: View {
    @Binding var isPresented: Bool
    let prompt: String
    let groups: [GCommandGroup]
    @State private var query = ""
    @State private var activeID: String?
    @FocusState private var fieldFocused: Bool

    public init(isPresented: Binding<Bool>, prompt: String? = nil, groups: [GCommandGroup]) {
        _isPresented = isPresented
        self.prompt = prompt ?? gText("Search")
        self.groups = groups
    }

    private var shown: [GCommandGroup] {
        groups.compactMap { group in
            let entries = group.items.map { GCommandSearch.Entry(id: $0.id, label: $0.label, detail: $0.detail, keywords: $0.keywords) }
            let kept = GCommandSearch.filter(entries, query: query, limit: query.isEmpty ? 6 : 8).map(\.id)
            let items = kept.compactMap { id in group.items.first { $0.id == id } }
            return items.isEmpty ? nil : GCommandGroup(title: group.title, items: items)
        }
    }

    private var ordered: [GCommandItem] { shown.flatMap(\.items) }

    public var body: some View {
        ZStack(alignment: .top) {
            Color.black.opacity(0.35)
                .ignoresSafeArea()
                .onTapGesture(perform: close)
                .accessibilityHidden(true)
            palette
                .padding(.horizontal, 16)
                .padding(.top, 72)
        }
        .onAppear {
            fieldFocused = true
            activeID = ordered.first?.id
        }
        .onChange(of: query) { activeID = ordered.first?.id }
    }

    private var palette: some View {
        let shape = RoundedRectangle(cornerRadius: GRadius.lg, style: .continuous)
        return VStack(spacing: 0) {
            field
            Rectangle().fill(GColor.hairline).frame(height: 1)
            results
        }
        .frame(maxWidth: 620)
        .background(GColor.surface, in: shape)
        .overlay { shape.strokeBorder(GColor.border.opacity(0.6), lineWidth: 1) }
        .clipShape(shape)
        .shadow(color: .black.opacity(0.25), radius: 24, y: 10)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(gText("Quick search"))
    }

    private var field: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass").foregroundStyle(GColor.textSecondary).accessibilityHidden(true)
            TextField("", text: $query, prompt: Text(prompt).foregroundStyle(GColor.textDiscret))
                .textFieldStyle(.plain)
                .font(GFont.body)
                .foregroundStyle(GColor.textPrimary)
                .tint(GColor.accent)
                .focused($fieldFocused)
                .autocorrectionDisabled()
                #if os(iOS)
                .textInputAutocapitalization(.never)
                .submitLabel(.go)
                #endif
                .onSubmit(runActive)
                .accessibilityLabel(gText("Quick search"))
            Text(gText("Esc")).font(GFont.mono).foregroundStyle(GColor.textDiscret)
                .onTapGesture(perform: close)
                .accessibilityHidden(true)
        }
        .padding(.horizontal, 16)
        .frame(height: 52)
        .onKeyPress(.downArrow) { move(1); return .handled }
        .onKeyPress(.upArrow) { move(-1); return .handled }
        .onKeyPress(.escape) { close(); return .handled }
    }

    @ViewBuilder private var results: some View {
        if shown.isEmpty {
            Text(gText("Nothing matches."))
                .font(GFont.subheadline).foregroundStyle(GColor.textSecondary)
                .frame(maxWidth: .infinity).padding(24)
        } else {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 2) {
                        ForEach(shown) { group in
                            Text(group.title.uppercased())
                                .font(GFont.caption2.weight(.semibold)).tracking(0.8)
                                .foregroundStyle(GColor.textSecondary)
                                .padding(.horizontal, 10).padding(.top, 10).padding(.bottom, 2)
                                .accessibilityAddTraits(.isHeader)
                            ForEach(group.items) { item in row(item).id(item.id) }
                        }
                    }
                    .padding(6)
                }
                .frame(maxHeight: 420)
                .onChange(of: activeID) { _, id in if let id { proxy.scrollTo(id) } }
            }
        }
    }

    private func row(_ item: GCommandItem) -> some View {
        let active = item.id == activeID
        return Button { run(item) } label: {
            HStack(spacing: 10) {
                Image(systemName: item.icon)
                    .font(GFont.subheadline)
                    .foregroundStyle(active ? GColor.accent : GColor.textSecondary)
                    .frame(width: 20)
                    .accessibilityHidden(true)
                Text(item.label).font(GFont.subheadline.weight(.medium)).foregroundStyle(GColor.textPrimary).lineLimit(1)
                if let detail = item.detail {
                    Text(detail).font(GFont.footnote).foregroundStyle(GColor.textSecondary).lineLimit(1)
                }
                Spacer(minLength: 8)
                if let shortcut = item.shortcut {
                    Text(shortcut).font(GFont.mono).foregroundStyle(GColor.textDiscret)
                }
            }
            .padding(.horizontal, 10)
            .frame(minHeight: 40)
            .background(active ? GColor.hover : .clear, in: RoundedRectangle(cornerRadius: GRadius.sm, style: .continuous))
            .overlay(alignment: .leading) {
                if active { Rectangle().fill(GColor.accent).frame(width: 2).padding(.vertical, 8) }
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .onHover { if $0 { activeID = item.id } }
        .gPointer()
        .accessibilityAddTraits(active ? .isSelected : [])
    }

    private func move(_ offset: Int) {
        guard !ordered.isEmpty else { return }
        let current = ordered.firstIndex { $0.id == activeID } ?? 0
        activeID = ordered[min(max(current + offset, 0), ordered.count - 1)].id
    }

    private func runActive() {
        guard let item = ordered.first(where: { $0.id == activeID }) ?? ordered.first else { return }
        run(item)
    }

    private func run(_ item: GCommandItem) {
        close()
        item.perform()
    }

    private func close() {
        isPresented = false
        query = ""
    }
}

public extension View {
    /// The quick search over this view: ⌘K (or the "⌘ + K" button, `gOpenCommandPalette`) opens it. `prompt`: what the
    /// field invites to search.
    func gCommandPalette(isPresented: Binding<Bool>, prompt: String? = nil, groups: @escaping () -> [GCommandGroup]) -> some View {
        overlay {
            if isPresented.wrappedValue {
                GCommandPalette(isPresented: isPresented, prompt: prompt, groups: groups())
                    .transition(.opacity)
                    .zIndex(200)
            }
        }
        // A fade, not a movement: kept with reduced motion.
        .animation(.easeOut(duration: 0.15), value: isPresented.wrappedValue)
        .background {
            // The keyboard shortcut, even with no visible button (an iPad with a keyboard).
            Button(gText("Quick search")) { isPresented.wrappedValue = true }
                .keyboardShortcut("k", modifiers: .command)
                .opacity(0)
                .accessibilityHidden(true)
        }
        .onReceive(NotificationCenter.default.publisher(for: .gOpenCommandPalette)) { _ in isPresented.wrappedValue = true }
    }
}

/// The rail's "⌘ + K" button (Mac, iPad): a magnifier and the whole shortcut, the key and the letter (the ⌘ symbol
/// alone is not understood).
public struct GCommandKButton: View {
    public init() {}

    public var body: some View {
        Button { NotificationCenter.default.post(name: .gOpenCommandPalette, object: nil) } label: {
            GHover { hovering in
                VStack(spacing: 3) {
                    Image(systemName: "magnifyingglass").font(.system(size: 15))
                    Text("⌘ + K").font(GFont.caption.weight(.medium)).lineLimit(1).minimumScaleFactor(0.7)
                }
                .foregroundStyle(hovering ? GPalette.graphite100 : GPalette.graphite300)
                .frame(maxWidth: .infinity, minHeight: 48)
                .background(hovering ? GPalette.graphite100.opacity(0.05) : .clear, in: .rect(cornerRadius: GRadius.sm))
                .overlay { RoundedRectangle(cornerRadius: GRadius.sm).strokeBorder(GPalette.graphite700, lineWidth: 1) }
                .contentShape(Rectangle())
            }
        }
        .buttonStyle(.plain)
        .help(gText("Quick search (⌘ + K)"))
        .accessibilityLabel(gText("Quick search"))
        .accessibilityHint(gText("Shortcut: Command K"))
    }
}
#endif
