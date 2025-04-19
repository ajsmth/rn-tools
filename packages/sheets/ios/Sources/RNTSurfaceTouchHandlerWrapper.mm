// RNTSurfaceTouchHandlerWrapper.mm  (Objective‑C++, .mm extension!)
#import "RNTSurfaceTouchHandlerWrapper.h"
#import <React/RCTSurfaceTouchHandler.h>

@implementation RNTSurfaceTouchHandlerWrapper {
  RCTSurfaceTouchHandler *_handler;
}

- (instancetype)init {
  if (self = [super init]) {
    _handler = [[RCTSurfaceTouchHandler alloc] init];
  }
  return self;
}

- (void)attachToView:(UIView *)view {
  [_handler attachToView:view];
}
@end


