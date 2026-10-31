import Foundation

/// Gabarit's own words (tooltips, names for screen readers, the quick search's texts) for GTK and WinUI, in the
/// system's language: English, or French. Apple's come from GabaritApple's string tables.
public enum GStrings {
    /// French when the system's first language is, English otherwise.
    public static let french: Bool = {
        let language = ProcessInfo.processInfo.environment["LANGUAGE"]?.split(separator: ":").first.map(String.init)
            ?? ProcessInfo.processInfo.environment["LC_ALL"]
            ?? ProcessInfo.processInfo.environment["LC_MESSAGES"]
            ?? ProcessInfo.processInfo.environment["LANG"]
            ?? Locale.preferredLanguages.first
            ?? "en"
        return language.lowercased().hasPrefix("fr")
    }()

    private static let fr: [String: String] = [
        "Close": "Fermer",
        "Close (Esc)": "Fermer (Échap)",
        "Back": "Retour",
        "Decrease": "Diminuer",
        "Increase": "Augmenter",
        "Search": "Rechercher",
        "Nothing matches.": "Rien ne correspond.",
        "Quick search": "Recherche rapide",
        "Quick search (Ctrl + K)": "Recherche rapide (Ctrl + K)",
        "Needs attention": "À vérifier",
        "Esc": "Échap",
        "OK": "OK",
    ]

    /// `text` in the system's language.
    public static func text(_ text: String) -> String {
        french ? fr[text] ?? text : text
    }
}
