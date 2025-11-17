#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(HaricotWidgetBridge, NSObject)

RCT_EXTERN_METHOD(setWidgetData:(NSString *)payload resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(reloadAllTimelines:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

@end
