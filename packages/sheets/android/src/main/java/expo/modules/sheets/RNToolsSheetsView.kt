package expo.modules.sheets

import BottomSheetFragment
import android.content.Context
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.annotation.UiThread
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.FragmentManager
import com.facebook.infer.annotation.SuppressLint
import com.facebook.react.bridge.GuardedRunnable
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.uimanager.JSPointerDispatcher
import com.facebook.react.uimanager.JSTouchDispatcher
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.RootView
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.views.modal.ReactModalHostManager
import com.facebook.react.views.modal.ReactModalHostView
import com.facebook.react.views.view.ReactViewGroup
import com.google.android.material.bottomsheet.BottomSheetDialog
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView



/**
 * TODO:
 *
 * - init an inner view group and forward children to this view group with overrides
 * - the inner view group will be attached to the dialog component
 * - this view group needs to be a ReactRootView which sets up touch handling as well
 */
class RNToolsSheetsView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  val onDismiss by EventDispatcher()

  var rootViewGroup: SheetRootViewGroup = SheetRootViewGroup(context, appContext)
  var bottomSheetFragment: BottomSheetFragment? = null
  init {}
  private val contentView: View
    /**
     * Returns the view that will be the root view of the dialog. We are wrapping this in a
     * FrameLayout because this is the system's way of notifying us that the dialog size has
     * changed.
     */
    get() =
      FrameLayout(context).apply {
        addView(rootViewGroup)
      }

  override fun setId(id: Int) {
    super.setId(id)
    rootViewGroup.id = id
  }


  override fun addView(child: View?) {
    UiThreadUtil.assertOnUiThread()
    rootViewGroup.addView(child)
  }
//
  public override fun addView(child: View?, index: Int) {
    UiThreadUtil.assertOnUiThread()
    rootViewGroup.addView(child, index)
  }

//
  public override fun removeView(child: View?) {
    UiThreadUtil.assertOnUiThread()
    if (child != null) {
      rootViewGroup.removeView(child)
    }
  }
//
  public override fun removeViewAt(index: Int) {
    UiThreadUtil.assertOnUiThread()
    val child = getChildAt(index)
    rootViewGroup.removeView(child)
  }

  fun hideSheet() {
    bottomSheetFragment?.dismiss()
  }

  fun showSheet() {

    val sheet = BottomSheetDialog(context)
    sheet.setContentView(contentView)

    sheet.show()

  }
}


public class SheetRootViewGroup internal constructor(context: Context, appContext: AppContext) : ExpoView(context, appContext), RootView {
  override val shouldUseAndroidLayout: Boolean
    get() = true

  internal var stateWrapper: StateWrapper? = null
  internal var eventDispatcher: EventDispatcher? = null

  private var viewWidth = 0
  private var viewHeight = 0
  private val jSTouchDispatcher: JSTouchDispatcher = JSTouchDispatcher(this)
  private var jSPointerDispatcher: JSPointerDispatcher? = null

  private val reactContext: ThemedReactContext
    get() = context as ThemedReactContext

  init {
    eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, id)
  }


  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    super.onMeasure(widthMeasureSpec, heightMeasureSpec)

    repeat(childCount) { index ->
      val child = getChildAt(index)
      child?.requestLayout()
    }
  }

  init {
    if (ReactFeatureFlags.dispatchPointerEvents) {
      jSPointerDispatcher = JSPointerDispatcher(this)
    }

//    // Set proper layout parameters for this root view group
//    layoutParams = LayoutParams(
//      ViewGroup.LayoutParams.MATCH_PARENT,
//      ViewGroup.LayoutParams.WRAP_CONTENT
//    )
  }

//
//  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
//    super.onSizeChanged(w, h, oldw, oldh)
//    viewWidth = w
//    viewHeight = h
//
//
//    reactContext.runOnNativeModulesQueueThread(
//      object : GuardedRunnable(reactContext) {
//        override fun runGuarded() {
//          reactContext.reactApplicationContext
//            .getNativeModule(UIManagerModule::class.java)
//            ?.updateNodeSize(id, viewWidth, viewHeight)
//        }
//      })
//  }

//  @UiThread
//  public fun updateState(width: Int, height: Int) {
//    val realWidth: Float = width.toFloat().pxToDp()
//    val realHeight: Float = height.toFloat().pxToDp()
//
//    stateWrapper?.let { sw ->
//      // new architecture
//      val newStateData: WritableMap = WritableNativeMap()
//      newStateData.putDouble("screenWidth", realWidth.toDouble())
//      newStateData.putDouble("screenHeight", realHeight.toDouble())
//      sw.updateState(newStateData)
//    }
//      ?: run {
//        // old architecture
//        // TODO: T44725185 remove after full migration to Fabric
//        reactContext.runOnNativeModulesQueueThread(
//          object : GuardedRunnable(reactContext) {
//            override fun runGuarded() {
//              reactContext.reactApplicationContext
//                .getNativeModule(UIManagerModule::class.java)
//                ?.updateNodeSize(id, viewWidth, viewHeight)
//            }
//          })
//      }
//  }
//
  override fun handleException(t: Throwable) {
    reactContext.reactApplicationContext.handleException(RuntimeException(t))
  }

  override fun onInterceptTouchEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { eventDispatcher ->
      jSTouchDispatcher.handleTouchEvent(event, eventDispatcher, reactContext)
      jSPointerDispatcher?.handleMotionEvent(event, eventDispatcher, true)
    }
    return super.onInterceptTouchEvent(event)
  }

  @SuppressLint("ClickableViewAccessibility")
  override fun onTouchEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { eventDispatcher ->
      jSTouchDispatcher.handleTouchEvent(event, eventDispatcher, reactContext)
      jSPointerDispatcher?.handleMotionEvent(event, eventDispatcher, false)
    }
    super.onTouchEvent(event)
    // In case when there is no children interested in handling touch event, we return true from
    // the root view in order to receive subsequent events related to that gesture
    return true
  }

  override fun onInterceptHoverEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { jSPointerDispatcher?.handleMotionEvent(event, it, true) }
    return super.onHoverEvent(event)
  }

  override fun onHoverEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { jSPointerDispatcher?.handleMotionEvent(event, it, false) }
    return super.onHoverEvent(event)
  }

  override fun onChildStartedNativeGesture(childView: View?, ev: MotionEvent) {
    eventDispatcher?.let { eventDispatcher ->
      jSTouchDispatcher.onChildStartedNativeGesture(ev, eventDispatcher)
      jSPointerDispatcher?.onChildStartedNativeGesture(childView, ev, eventDispatcher)
    }
  }

  override fun onChildEndedNativeGesture(childView: View, ev: MotionEvent) {
    eventDispatcher?.let { jSTouchDispatcher.onChildEndedNativeGesture(ev, it) }
    jSPointerDispatcher?.onChildEndedNativeGesture()
  }

  override fun requestDisallowInterceptTouchEvent(disallowIntercept: Boolean) {
    // No-op - override in order to still receive events to onInterceptTouchEvent
    // even when some other view disallow that
  }
}