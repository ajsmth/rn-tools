#import "RNToolsToastsTouchHandler.h"
#import <React/RCTSurfaceTouchHandler.h>

@implementation RNToolsToastsTouchHandler

+ (nullable UIGestureRecognizer *)attachToView:(UIView *)view {
  RCTSurfaceTouchHandler *handler = [[RCTSurfaceTouchHandler alloc] init];
  [handler attachToView:view];
  return handler;
}

+ (void)detach:(nullable UIGestureRecognizer *)handler fromView:(UIView *)view {
  if (!handler) return;
  if ([handler isKindOfClass:[RCTSurfaceTouchHandler class]]) {
    [(RCTSurfaceTouchHandler *)handler detachFromView:view];
  }
}

@end
