package com.haricotappsyndicate.haricot.widgets

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class HaricotWidgetUpdaterModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "HaricotWidgetUpdater"

  @ReactMethod
  fun setWidgetData(payload: String, promise: Promise) {
    try {
      val sharedPreferences = reactContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE)
      sharedPreferences.edit().putString(SHARED_PREFS_KEY, payload).apply()
      notifyWidgets()
      promise.resolve(null)
    } catch (error: Exception) {
      Log.e(TAG, "Failed to persist widget payload", error)
      promise.reject("set_widget_data_error", error)
    }
  }

  private fun notifyWidgets() {
    val context = reactContext.applicationContext
    val manager = AppWidgetManager.getInstance(context)
    val component = ComponentName(context, HaricotWidgetProvider::class.java)
    val widgetIds = manager.getAppWidgetIds(component)

    if (widgetIds.isEmpty()) {
      return
    }

    val intent = Intent(context, HaricotWidgetProvider::class.java).apply {
      action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
      putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, widgetIds)
    }

    context.sendBroadcast(intent)
  }

  companion object {
    private const val TAG = "HaricotWidgetModule"
    const val SHARED_PREFS_NAME = "HaricotWidgetData"
    const val SHARED_PREFS_KEY = "widget_data"
  }
}
