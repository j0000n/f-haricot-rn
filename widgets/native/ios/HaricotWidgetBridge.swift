import Foundation
import WidgetKit
import React

@objc(HaricotWidgetBridge)
class HaricotWidgetBridge: NSObject {
    private let appGroupIdentifier = "group.com.haricotappsyndicate.haricot.widgets"
    private let storageKey = "widget_data"

    @objc
    func constantsToExport() -> [AnyHashable: Any]! {
        return [:]
    }

    @objc
    func setWidgetData(_ payload: String, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
        guard let userDefaults = UserDefaults(suiteName: appGroupIdentifier) else {
            reject("app_group_unavailable", "Unable to open shared defaults", nil)
            return
        }

        userDefaults.set(payload, forKey: storageKey)
        userDefaults.synchronize()

        resolve(nil)
    }

    @objc
    func reloadAllTimelines(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
            resolve(nil)
        } else {
            resolve(nil)
        }
    }

    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
