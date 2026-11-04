import Foundation

/// The quick search's matching (⌘K): every word of the query in an entry's label, detail or keywords, ignoring case and
/// accents; entries whose label starts with the query first, then those with a word starting with one of the query's.
/// No UI framework: every platform's palette uses it.
public enum GCommandSearch {
    public struct Entry: Equatable, Sendable {
        public var id: String
        public var label: String
        public var detail: String?
        public var keywords: [String]

        public init(id: String, label: String, detail: String? = nil, keywords: [String] = []) {
            self.id = id
            self.label = label
            self.detail = detail
            self.keywords = keywords
        }
    }

    public static func fold(_ text: String) -> String {
        text.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current)
    }

    /// The entries kept for `query`, in display order (at most `limit`); all of them when the query is empty.
    public static func filter(_ entries: [Entry], query: String, limit: Int = 8) -> [Entry] {
        let words = fold(query).split(whereSeparator: \.isWhitespace).map(String.init)
        guard !words.isEmpty else { return Array(entries.prefix(limit)) }
        let ranked = entries.enumerated().compactMap { index, entry -> (Entry, Int, Int)? in
            let haystack = ([entry.label, entry.detail ?? ""] + entry.keywords).map(fold).joined(separator: " ")
            guard words.allSatisfy(haystack.contains) else { return nil }
            return (entry, rank(entry.label, words), index)
        }
        return ranked.sorted { ($0.1, $0.2) < ($1.1, $1.2) }.prefix(limit).map(\.0)
    }

    private static func rank(_ label: String, _ words: [String]) -> Int {
        let folded = fold(label)
        if folded.hasPrefix(words.joined(separator: " ")) { return 0 }
        let titleWords = folded.split(whereSeparator: { !$0.isLetter && !$0.isNumber })
        if titleWords.contains(where: { word in words.contains { word.hasPrefix($0) } }) { return 1 }
        return 2
    }
}
