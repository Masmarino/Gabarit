import GabaritApple
import SwiftUI

// The glass (4.0): the ground, the content glass in its three densities, the liquid glass (a floating tab bar, a search,
// round buttons), an inset list with no lines and a chosen row.

struct Conversation: Identifiable {
    let id: String
    let initial: String
    let hue: Color
    let last: String
    let time: String
}

struct GlassSection: View {
    @State private var tab = "messages"
    @State private var chosen: String? = "Camille Roux"
    @State private var query = ""
    private let conversations = [
        Conversation(id: "Camille Roux", initial: "C", hue: .orange, last: "Message éphémère", time: "08:28"),
        Conversation(id: "Resto du vendredi", initial: "R", hue: .teal, last: "Hugo écrit…", time: "08:27"),
        Conversation(id: "Marie Dupont", initial: "M", hue: .pink, last: "Vous : Avec plaisir", time: "08:26"),
        Conversation(id: "Hugo Petit", initial: "H", hue: .blue, last: "Vous : Je regarde chez moi", time: "05:25"),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            VStack(alignment: .leading, spacing: 4) {
                Text("VENDREDI 13 NOVEMBRE").font(GFont.caption.weight(.semibold)).foregroundStyle(.gInk2)
                Text("Bonjour, Florian").font(GFont.display).foregroundStyle(.gInk)
                Text("Le sol, le verre de contenu, le verre liquide.").font(GFont.body).foregroundStyle(.gInk2)
            }
            HStack(alignment: .top, spacing: GSpacing.gap) {
                ForEach([("Thin", GGlassDensity.thin), ("Regular", .regular), ("Thick", .thick)], id: \.0) { name, density in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(name).font(GFont.headline).foregroundStyle(.gInk)
                        Text("A long text reads on the glass: dense enough, the ground a whisper behind.")
                            .font(GFont.callout).foregroundStyle(.gInk2)
                            .fixedSize(horizontal: false, vertical: true)
                        Text("Discreet").font(GFont.caption).foregroundStyle(.gInk3)
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, minHeight: 130, alignment: .topLeading)
                    .gGlass(density)
                }
            }
            HStack(alignment: .top, spacing: GSpacing.gap) {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("Messages").font(GFont.title3).foregroundStyle(.gInk)
                        Spacer()
                        GGlassGroup(spacing: 8) {
                            HStack(spacing: 8) {
                                GRoundButton(systemImage: "person", title: "Contacts") {}
                                GRoundButton(systemImage: "square.and.pencil", title: "New message") {}
                            }
                        }
                    }
                    GInsetList(conversations, selection: $chosen) { conversation in
                        HStack(spacing: 12) {
                            Text(conversation.initial).font(GFont.headline).foregroundStyle(.white)
                                .frame(width: 36, height: 36).background(conversation.hue.gradient, in: Circle())
                            VStack(alignment: .leading, spacing: 1) {
                                Text(conversation.id).font(GFont.body.weight(.semibold)).foregroundStyle(.gInk)
                                Text(conversation.last).font(GFont.callout).foregroundStyle(.gInk2)
                            }
                            Spacer()
                            Text(conversation.time).font(GFont.caption.monospacedDigit()).foregroundStyle(.gInk2)
                        }
                    }
                }
                .padding(12)
                .gGlass(.regular)
                .frame(width: 400)
                VStack(alignment: .leading, spacing: 16) {
                    HStack(spacing: 8) {
                        Image(systemName: "magnifyingglass").foregroundStyle(.gInk2)
                        TextField("", text: $query, prompt: Text("Rechercher").foregroundStyle(.gInk3))
                            .textFieldStyle(.plain).font(GFont.body).foregroundStyle(.gInk)
                    }
                    .padding(.horizontal, 14)
                    .frame(height: 36)
                    // A search field: a hollow of thin glass (4.1).
                    .gGlassHollow(in: Capsule())
                    GGlassGroup(spacing: 10) {
                        HStack(spacing: 10) {
                            GRoundButton(systemImage: "plus", title: "Add") {}
                            GRoundButton(systemImage: "phone", title: "Call") {}
                            GRoundButton(systemImage: "video", title: "Video") {}
                            GRoundButton(systemImage: "mic.fill", title: "Speak", prominent: true) {}
                        }
                    }
                    GToastLabel(text: "Lien copié", systemImage: "link")
                    Spacer(minLength: 0)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            GTabBar(tabs: [
                GTab(id: "today", title: "Pour vous", systemImage: "sun.horizon"),
                GTab(id: "messages", title: "Messages", systemImage: "bubble.left", badge: 9),
                GTab(id: "communities", title: "Communautés", systemImage: "person.2"),
                GTab(id: "spaces", title: "Espaces", systemImage: "square.stack"),
                GTab(id: "music", title: "Musique", systemImage: "music.note"),
            ], selection: $tab)
            .padding(.horizontal, 60)
        }
    }
}
