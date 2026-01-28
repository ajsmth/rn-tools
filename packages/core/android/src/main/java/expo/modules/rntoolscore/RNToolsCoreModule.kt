package expo.modules.rntoolscore

import android.view.View
import android.view.ViewGroup
import com.facebook.react.bridge.UiThreadUtil
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

class RNToolsCoreModule : Module() {
  private var lastInsets: EdgeInsets? = null
  private var attachedView: View? = null
  private var insetsListener: View.OnApplyWindowInsetsListener? = null

  override fun definition() = ModuleDefinition {
    Name("RNToolsCore")

    Events("onSafeAreaInsetsChange")

    Function("getSafeAreaInsets") {
      val fallback = mapOf(
        "top" to 0f,
        "right" to 0f,
        "bottom" to 0f,
        "left" to 0f
      )

      val activity = appContext.currentActivity ?: return@Function fallback
      val decorView = activity.window?.decorView as? ViewGroup ?: return@Function fallback

      if (UiThreadUtil.isOnUiThread()) {
        val insets = getSafeAreaInsets(decorView) ?: return@Function fallback
        return@Function insetsToMap(insets)
      }

      val latch = CountDownLatch(1)
      var result: Map<String, Float> = fallback

      UiThreadUtil.runOnUiThread {
        val insets = getSafeAreaInsets(decorView)
        result = if (insets == null) fallback else insetsToMap(insets)
        latch.countDown()
      }

      latch.await(200, TimeUnit.MILLISECONDS)
      return@Function result
    }

    OnCreate {
      attachInsetsListener()
    }

    OnDestroy {
      detachInsetsListener()
    }

    OnActivityEntersForeground {
      attachInsetsListener()
    }
  }

  private fun attachInsetsListener() {
    UiThreadUtil.runOnUiThread {
      val activity = appContext.currentActivity ?: return@runOnUiThread
      val decorView = activity.window?.decorView as? ViewGroup ?: return@runOnUiThread

      attachedView = decorView
      insetsListener = View.OnApplyWindowInsetsListener { view, insets ->
        emitSafeAreaInsetsIfChanged(view)
        view.onApplyWindowInsets(insets)
      }

      decorView.setOnApplyWindowInsetsListener(insetsListener)
      decorView.requestApplyInsets()
      emitSafeAreaInsetsIfChanged(decorView)
    }
  }

  private fun detachInsetsListener() {
    UiThreadUtil.runOnUiThread {
      attachedView?.setOnApplyWindowInsetsListener(null)
      attachedView = null
      insetsListener = null
    }
  }

  private fun emitSafeAreaInsetsIfChanged(view: View?) {
    val target = view ?: return
    val insets = getSafeAreaInsets(target) ?: return

    if (lastInsets != null && areInsetsEqual(lastInsets!!, insets)) {
      return
    }

    lastInsets = insets
    sendEvent(
      "onSafeAreaInsetsChange",
      mapOf("insets" to insetsToMap(insets))
    )
  }

  private fun areInsetsEqual(lhs: EdgeInsets, rhs: EdgeInsets): Boolean {
    return lhs.top == rhs.top &&
      lhs.right == rhs.right &&
      lhs.bottom == rhs.bottom &&
      lhs.left == rhs.left
  }

  private fun insetsToMap(insets: EdgeInsets): Map<String, Float> {
    return mapOf(
      "top" to insets.top,
      "right" to insets.right,
      "bottom" to insets.bottom,
      "left" to insets.left
    )
  }
}
