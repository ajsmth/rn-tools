package expo.modules.sheets

import android.content.Context
import android.view.MotionEvent
import android.view.View
import com.facebook.infer.annotation.SuppressLint
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.uimanager.JSPointerDispatcher
import com.facebook.react.uimanager.JSTouchDispatcher
import com.facebook.react.uimanager.RootView
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.views.view.ReactViewGroup

import expo.modules.kotlin.AppContext


class SheetRootView internal constructor(context: Context, appContext: AppContext) : ReactViewGroup(context),
    RootView {
    internal var eventDispatcher: EventDispatcher? = null

    private val jSTouchDispatcher: JSTouchDispatcher = JSTouchDispatcher(this)
    private var jSPointerDispatcher: JSPointerDispatcher? = null

    private val reactContext: ThemedReactContext
        get() = context as ThemedReactContext

    init {
        eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, id)

        if (ReactFeatureFlags.dispatchPointerEvents) {
            jSPointerDispatcher = JSPointerDispatcher(this)
        }
    }

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
