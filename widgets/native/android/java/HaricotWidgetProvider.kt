package com.haricotappsyndicate.haricot.widgets

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.RemoteViews
import com.haricotappsyndicate.haricot.R
import org.json.JSONArray
import org.json.JSONObject

class HaricotWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    for (appWidgetId in appWidgetIds) {
      updateWidget(context, appWidgetManager, appWidgetId)
    }
  }

  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)

    if (intent.action == ACTION_REFRESH) {
      val manager = AppWidgetManager.getInstance(context)
      val component = ComponentName(context, HaricotWidgetProvider::class.java)
      val ids = manager.getAppWidgetIds(component)
      onUpdate(context, manager, ids)
    }
  }

  override fun onAppWidgetOptionsChanged(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int,
    newOptions: Bundle
  ) {
    updateWidget(context, appWidgetManager, appWidgetId)
  }

  companion object {
    private const val TAG = "HaricotWidget"
    const val ACTION_REFRESH = "com.haricotappsyndicate.haricot.widgets.REFRESH"

    fun requestRefresh(context: Context) {
      val intent = Intent(context, HaricotWidgetProvider::class.java).apply {
        action = ACTION_REFRESH
      }
      context.sendBroadcast(intent)
    }

    private fun getLayoutForSize(options: Bundle): Int {
      val minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0)
      return when {
        minWidth < 140 -> R.layout.widget_small
        minWidth < 220 -> R.layout.widget_medium
        else -> R.layout.widget_large
      }
    }

    private fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
      val options = appWidgetManager.getAppWidgetOptions(appWidgetId)
      val layoutId = getLayoutForSize(options)
      val views = RemoteViews(context.packageName, layoutId)

      val payload = loadPayload(context)
      if (payload != null) {
        applySummary(views, payload.optJSONObject("summary"))
        applySpotlight(views, payload.optJSONArray("spotlightItems"))
        applyRecent(views, payload.optJSONArray("recentlyAddedItems"))
        applyRecipes(views, payload.optJSONArray("cookableRecipes"))
      } else {
        setText(views, R.id.widget_title, "Haricot Pantry")
        setText(views, R.id.widget_total_items, "Sign in to sync")
        setText(views, R.id.widget_expiring, "")
      }

      setLaunchIntent(context, views)
      appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun setLaunchIntent(context: Context, views: RemoteViews) {
      val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        ?: Intent(Intent.ACTION_MAIN).apply {
          addCategory(Intent.CATEGORY_LAUNCHER)
          component = ComponentName(context, "com.haricotappsyndicate.haricot.MainActivity")
        }

      val pendingIntent = PendingIntent.getActivity(
        context,
        0,
        launchIntent,
        PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
      )

      views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)
    }

    private fun loadPayload(context: Context): JSONObject? {
      val sharedPreferences = context.getSharedPreferences(HaricotWidgetUpdaterModule.SHARED_PREFS_NAME, Context.MODE_PRIVATE)
      val json = sharedPreferences.getString(HaricotWidgetUpdaterModule.SHARED_PREFS_KEY, null)
      if (json.isNullOrEmpty()) {
        return null
      }

      return try {
        JSONObject(json)
      } catch (error: Exception) {
        Log.e(TAG, "Failed to parse widget payload", error)
        null
      }
    }

    private fun applySummary(views: RemoteViews, summary: JSONObject?) {
      summary ?: return
      setText(views, R.id.widget_title, "Haricot Pantry")
      setText(
        views,
        R.id.widget_total_items,
        "${summary.optInt("totalItems", 0)} items • ${summary.optInt("totalQuantity", 0)} qty"
      )
      val expiringSoon = summary.optInt("expiringSoon", 0)
      val expiringNow = summary.optInt("expiringNow", 0)
      val expiringText = when {
        expiringNow > 0 -> "$expiringNow expired • $expiringSoon soon"
        expiringSoon > 0 -> "$expiringSoon expiring soon"
        else -> "All fresh"
      }
      setText(views, R.id.widget_expiring, expiringText)

      val topCategories = summary.optJSONArray("topCategories") ?: return
      if (topCategories.length() > 0) {
        val first = topCategories.optJSONObject(0)
        setText(
          views,
          R.id.widget_category_primary,
          "Top: ${first?.optString("category", "") ?: ""}"
        )
      }
    }

    private fun applySpotlight(views: RemoteViews, items: JSONArray?) {
      items ?: return
      for (index in 0 until minOf(items.length(), 4)) {
        val item = items.optJSONObject(index) ?: continue
        val name = item.optString("name")
        val emoji = item.optString("emoji", "")
        val detail = buildInventoryDetail(item)
        val nameViewId = when (index) {
          0 -> R.id.widget_spotlight_1_name
          1 -> R.id.widget_spotlight_2_name
          2 -> R.id.widget_spotlight_3_name
          else -> R.id.widget_spotlight_4_name
        }
        val detailViewId = when (index) {
          0 -> R.id.widget_spotlight_1_detail
          1 -> R.id.widget_spotlight_2_detail
          2 -> R.id.widget_spotlight_3_detail
          else -> R.id.widget_spotlight_4_detail
        }
        setText(views, nameViewId, "$emoji $name")
        setText(views, detailViewId, detail)
      }
    }

    private fun applyRecent(views: RemoteViews, items: JSONArray?) {
      items ?: return
      val first = items.optJSONObject(0) ?: return
      setText(views, R.id.widget_recent_title, "New: ${first.optString("name")}")
      setText(views, R.id.widget_recent_detail, buildInventoryDetail(first))
    }

    private fun applyRecipes(views: RemoteViews, recipes: JSONArray?) {
      recipes ?: return
      for (index in 0 until minOf(recipes.length(), 3)) {
        val recipe = recipes.optJSONObject(index) ?: continue
        val name = recipe.optString("name")
        val emoji = recipe.optJSONArray("emojiTags")?.optString(0) ?: "🍽️"
        val detail = buildRecipeDetail(recipe)
        val nameViewId = when (index) {
          0 -> R.id.widget_recipe_1_name
          1 -> R.id.widget_recipe_2_name
          else -> R.id.widget_recipe_3_name
        }
        val detailViewId = when (index) {
          0 -> R.id.widget_recipe_1_detail
          1 -> R.id.widget_recipe_2_detail
          else -> R.id.widget_recipe_3_detail
        }
        setText(views, nameViewId, "$emoji $name")
        setText(views, detailViewId, detail)
      }
    }

    private fun buildInventoryDetail(item: JSONObject): String {
      val daysRemaining = item.optInt("daysRemaining", Int.MIN_VALUE)
      return when {
        daysRemaining == Int.MIN_VALUE -> item.optString("category", "")
        daysRemaining < 0 -> "Expired"
        daysRemaining == 0 -> "Use today"
        daysRemaining == 1 -> "1 day left"
        else -> "$daysRemaining days left"
      }
    }

    private fun buildRecipeDetail(recipe: JSONObject): String {
      val missing = recipe.optInt("missingIngredients", 0)
      val match = recipe.optInt("matchPercentage", 0)
      return if (missing == 0) {
        "Ready • ${recipe.optInt("totalTimeMinutes", 0)} min"
      } else {
        "Missing $missing • $match% stocked"
      }
    }

    private fun setText(views: RemoteViews, viewId: Int, text: String) {
      if (viewId == 0) {
        return
      }
      views.setTextViewText(viewId, text)
    }
  }
}
