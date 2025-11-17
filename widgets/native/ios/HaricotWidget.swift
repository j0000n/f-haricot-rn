import WidgetKit
import SwiftUI
import UIKit

private let appGroupIdentifier = "group.com.haricotappsyndicate.haricot.widgets"
private let storageKey = "widget_data"

struct HaricotWidgetPayload: Codable {
    struct Summary: Codable {
        let totalItems: Int
        let totalQuantity: Int
        let expiringSoon: Int
        let expiringNow: Int
        let storageBreakdown: [String: Int]
        let topCategories: [CategorySummary]
    }

    struct CategorySummary: Codable, Identifiable {
        var id: String { category }
        let category: String
        let count: Int
    }

    struct InventoryItem: Codable, Identifiable {
        var id: String { code + (variety ?? "") }
        let code: String
        let name: String
        let quantity: Double
        let storageLocation: String
        let emoji: String
        let daysRemaining: Int?
        let freshnessStatus: String
        let category: String
        let variety: String?
    }

    struct Recipe: Codable, Identifiable {
        let id: String
        let name: String
        let emojiTags: [String]
        let totalTimeMinutes: Int
        let servings: Int
        let matchPercentage: Int
        let missingIngredients: Int
    }

    let updatedAt: Double
    let summary: Summary
    let spotlightItems: [InventoryItem]
    let recentlyAddedItems: [InventoryItem]
    let cookableRecipes: [Recipe]
}

struct HaricotWidgetEntry: TimelineEntry {
    let date: Date
    let payload: HaricotWidgetPayload?
}

struct HaricotWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> HaricotWidgetEntry {
        HaricotWidgetEntry(date: Date(), payload: HaricotWidgetSampleData.payload)
    }

    func getSnapshot(in context: Context, completion: @escaping (HaricotWidgetEntry) -> Void) {
        let entry = HaricotWidgetEntry(date: Date(), payload: loadPayload())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<HaricotWidgetEntry>) -> Void) {
        let entry = HaricotWidgetEntry(date: Date(), payload: loadPayload())
        let timeline = Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(15 * 60)))
        completion(timeline)
    }

    private func loadPayload() -> HaricotWidgetPayload? {
        guard
            let userDefaults = UserDefaults(suiteName: appGroupIdentifier),
            let json = userDefaults.string(forKey: storageKey),
            let data = json.data(using: .utf8)
        else {
            return nil
        }

        return try? JSONDecoder().decode(HaricotWidgetPayload.self, from: data)
    }
}

struct HaricotWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let payload: HaricotWidgetPayload?

    var body: some View {
        Group {
            if let payload {
                switch family {
                case .systemSmall:
                    SmallHaricotWidgetView(payload: payload)
                case .systemMedium:
                    MediumHaricotWidgetView(payload: payload)
                default:
                    LargeHaricotWidgetView(payload: payload)
                }
            } else {
                EmptyWidgetState()
            }
        }
        .padding(12)
        .background(Color(uiColor: .systemBackground))
    }
}

struct SmallHaricotWidgetView: View {
    let payload: HaricotWidgetPayload

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Haricot Pantry")
                .font(.headline)
            Text("\(payload.summary.totalItems) items ready")
                .font(.subheadline)
            Text("\(payload.summary.expiringSoon) expiring soon")
                .font(.footnote)
            if let next = payload.spotlightItems.first {
                Divider()
                HStack(spacing: 6) {
                    Text(next.emoji)
                        .font(.title2)
                    VStack(alignment: .leading) {
                        Text(next.name)
                            .font(.subheadline)
                            .bold()
                        if let days = next.daysRemaining {
                            Text(daysLabel(for: days))
                                .font(.caption)
                        }
                    }
                    Spacer()
                }
            }
        }
    }

    private func daysLabel(for days: Int) -> String {
        switch days {
        case ..<0:
            return "Expired"
        case 0:
            return "Use today"
        case 1:
            return "1 day left"
        default:
            return "\(days) days left"
        }
    }
}

struct MediumHaricotWidgetView: View {
    let payload: HaricotWidgetPayload

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HeaderView(updatedAt: payload.updatedAt)
            HStack(alignment: .top, spacing: 12) {
                SpotlightList(title: "Spotlight", items: payload.spotlightItems.prefix(3))
                RecipeList(title: "Cook now", recipes: payload.cookableRecipes.prefix(2))
            }
        }
    }
}

struct LargeHaricotWidgetView: View {
    let payload: HaricotWidgetPayload

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HeaderView(updatedAt: payload.updatedAt)
            SummaryGrid(summary: payload.summary)
            HStack(alignment: .top, spacing: 12) {
                SpotlightList(title: "Spotlight", items: payload.spotlightItems.prefix(4))
                SpotlightList(title: "New arrivals", items: payload.recentlyAddedItems.prefix(4))
                RecipeList(title: "Cook now", recipes: payload.cookableRecipes.prefix(3))
            }
        }
    }
}

struct HeaderView: View {
    let updatedAt: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("Haricot Pantry")
                .font(.headline)
            Text("Updated \(relativeDate)")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }

    private var relativeDate: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .short
        return formatter.localizedString(for: Date(timeIntervalSince1970: updatedAt / 1000), relativeTo: Date())
    }
}

struct SummaryGrid: View {
    let summary: HaricotWidgetPayload.Summary

    var body: some View {
        HStack {
            SummaryItem(title: "Items", value: "\(summary.totalItems)")
            SummaryItem(title: "Quantity", value: "\(summary.totalQuantity)")
            SummaryItem(title: "Soon", value: "\(summary.expiringSoon)")
            SummaryItem(title: "Expired", value: "\(summary.expiringNow)")
        }
    }
}

struct SummaryItem: View {
    let title: String
    let value: String

    var body: some View {
        VStack {
            Text(value)
                .font(.title3)
                .bold()
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

struct SpotlightList: View {
    let title: String
    let items: ArraySlice<HaricotWidgetPayload.InventoryItem>

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.subheadline)
                .bold()
            ForEach(Array(items)) { item in
                HStack(spacing: 6) {
                    Text(item.emoji)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(item.name)
                            .font(.footnote)
                        Text(detail(for: item))
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func detail(for item: HaricotWidgetPayload.InventoryItem) -> String {
        if let days = item.daysRemaining {
            switch days {
            case ..<0:
                return "Expired"
            case 0:
                return "Use today"
            default:
                return "\(days) days left"
            }
        }

        return item.category
    }
}

struct RecipeList: View {
    let title: String
    let recipes: ArraySlice<HaricotWidgetPayload.Recipe>

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.subheadline)
                .bold()
            ForEach(Array(recipes)) { recipe in
                VStack(alignment: .leading, spacing: 2) {
                    HStack {
                        Text(recipe.emojiTags.first ?? "🍽️")
                        Text(recipe.name)
                            .font(.footnote)
                        Spacer()
                    }
                    Text(recipeDetail(recipe))
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func recipeDetail(_ recipe: HaricotWidgetPayload.Recipe) -> String {
        if recipe.missingIngredients == 0 {
            return "Ready to cook • \(recipe.totalTimeMinutes) min"
        }

        return "Missing \(recipe.missingIngredients) • \(recipe.matchPercentage)% stocked"
    }
}

struct EmptyWidgetState: View {
    var body: some View {
        VStack(spacing: 6) {
            Text("Haricot Pantry")
                .font(.headline)
            Text("Sign in to sync your kitchen")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

@main
struct HaricotWidgetBundle: WidgetBundle {
    var body: some Widget {
        HaricotWidget()
    }
}

struct HaricotWidget: Widget {
    let kind: String = "HaricotWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HaricotWidgetProvider()) { entry in
            HaricotWidgetView(payload: entry.payload)
        }
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        .configurationDisplayName("Haricot Pantry")
        .description("Track inventory and recipes ready to cook.")
    }
}

private enum HaricotWidgetSampleData {
    static let payload = HaricotWidgetPayload(
        updatedAt: Date().timeIntervalSince1970 * 1000,
        summary: .init(
            totalItems: 8,
            totalQuantity: 14,
            expiringSoon: 2,
            expiringNow: 1,
            storageBreakdown: ["fridge": 3, "pantry": 3, "freezer": 2],
            topCategories: [
                .init(category: "Produce", count: 3),
                .init(category: "Proteins", count: 2),
                .init(category: "Grains", count: 2),
            ]
        ),
        spotlightItems: [
            .init(
                code: "apple",
                name: "Honeycrisp Apples",
                quantity: 4,
                storageLocation: "fridge",
                emoji: "🍎",
                daysRemaining: 1,
                freshnessStatus: "warning",
                category: "Produce",
                variety: nil
            ),
            .init(
                code: "kale",
                name: "Lacinato Kale",
                quantity: 1,
                storageLocation: "fridge",
                emoji: "🥬",
                daysRemaining: 3,
                freshnessStatus: "fresh",
                category: "Produce",
                variety: nil
            )
        ],
        recentlyAddedItems: [
            .init(
                code: "beans",
                name: "Cannelini Beans",
                quantity: 2,
                storageLocation: "pantry",
                emoji: "🫘",
                daysRemaining: nil,
                freshnessStatus: "fresh",
                category: "Pantry",
                variety: nil
            )
        ],
        cookableRecipes: [
            .init(
                id: "sample-recipe",
                name: "Weeknight Pasta",
                emojiTags: ["🍝"],
                totalTimeMinutes: 30,
                servings: 4,
                matchPercentage: 100,
                missingIngredients: 0
            )
        ]
    )
}
