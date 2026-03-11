package expo.modules.rntoolscore

import android.content.Context
import android.util.Log
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

internal class RNToolsOverlayRootView(context: Context) : ReactViewGroup(context), RootView {
  private var eventDispatcher: EventDispatcher? = null
  private val jsTouchDispatcher = JSTouchDispatcher(this)
  private var jsPointerDispatcher: JSPointerDispatcher? = null

  private val reactContext: ThemedReactContext
    get() = context as ThemedReactContext

  init {
    updateEventDispatcher()

    if (ReactFeatureFlags.dispatchPointerEvents) {
      jsPointerDispatcher = JSPointerDispatcher(this)
    }
  }

  override fun setId(id: Int) {
    super.setId(id)
    updateEventDispatcher()
  }

  override fun handleException(t: Throwable) {
    reactContext.reactApplicationContext.handleException(RuntimeException(t))
  }

  override fun onInterceptTouchEvent(event: MotionEvent): Boolean {
    Log.d("RNToolsOverlay", "root onInterceptTouchEvent action=${event.actionMasked}")
    eventDispatcher?.let { dispatcher ->
      jsTouchDispatcher.handleTouchEvent(event, dispatcher, reactContext)
      jsPointerDispatcher?.handleMotionEvent(event, dispatcher, true)
    }

    return super.onInterceptTouchEvent(event)
  }

  @SuppressLint("ClickableViewAccessibility")
  override fun onTouchEvent(event: MotionEvent): Boolean {
    Log.d("RNToolsOverlay", "root onTouchEvent action=${event.actionMasked}")
    eventDispatcher?.let { dispatcher ->
      jsTouchDispatcher.handleTouchEvent(event, dispatcher, reactContext)
      jsPointerDispatcher?.handleMotionEvent(event, dispatcher, false)
    }

    super.onTouchEvent(event)
    return true
  }

  override fun onInterceptHoverEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { dispatcher ->
      jsPointerDispatcher?.handleMotionEvent(event, dispatcher, true)
    }

    return super.onHoverEvent(event)
  }

  override fun onHoverEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { dispatcher ->
      jsPointerDispatcher?.handleMotionEvent(event, dispatcher, false)
    }

    return super.onHoverEvent(event)
  }

  override fun onChildStartedNativeGesture(childView: View?, ev: MotionEvent) {
    eventDispatcher?.let { dispatcher ->
      jsTouchDispatcher.onChildStartedNativeGesture(ev, dispatcher)
      jsPointerDispatcher?.onChildStartedNativeGesture(childView, ev, dispatcher)
    }
  }

  override fun onChildEndedNativeGesture(childView: View, ev: MotionEvent) {
    eventDispatcher?.let { dispatcher ->
      jsTouchDispatcher.onChildEndedNativeGesture(ev, dispatcher)
    }
    jsPointerDispatcher?.onChildEndedNativeGesture()
  }

  override fun requestDisallowInterceptTouchEvent(disallowIntercept: Boolean) {
    // Keep receiving touch events for the RootView dispatcher.
  }

  private fun updateEventDispatcher() {
    val reactTag = id
    if (reactTag != View.NO_ID) {
      eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, reactTag)
    }
  }
}
