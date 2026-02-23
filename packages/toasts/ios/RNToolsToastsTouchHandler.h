#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface RNToolsToastsTouchHandler : NSObject

+ (nullable UIGestureRecognizer *)createAndAttachTouchHandlerForView:(UIView *)view;
+ (void)detachTouchHandler:(nullable UIGestureRecognizer *)handler fromView:(UIView *)view;

@end

NS_ASSUME_NONNULL_END
