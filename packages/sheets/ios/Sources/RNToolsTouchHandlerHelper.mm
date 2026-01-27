// RNToolsTouchHandlerHelper.mm

#import "RNToolsTouchHandlerHelper.h"
#import <React/RCTSurfaceTouchHandler.h>

@implementation RNToolsTouchHandlerHelper

+ (nullable UIGestureRecognizer *)createAndAttachTouchHandlerForView:(UIView *)view {
  for (UIGestureRecognizer *recognizer in [view.gestureRecognizers copy]) {
    if ([recognizer isKindOfClass:[RCTSurfaceTouchHandler class]]) {
      return nil;
    }
  }

  RCTSurfaceTouchHandler *touchHandler = [[RCTSurfaceTouchHandler alloc] init];
  [touchHandler attachToView:view];
  return touchHandler;
}

+ (void)detachTouchHandler:(nullable UIGestureRecognizer *)handler fromView:(UIView *)view {
  if (!handler) {
    return;
  }

  if ([handler isKindOfClass:[RCTSurfaceTouchHandler class]]) {
    RCTSurfaceTouchHandler *touchHandler = (RCTSurfaceTouchHandler *)handler;
    [touchHandler detachFromView:view];
  }
}

@end
