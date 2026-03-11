package expo.modules.rntoolscore

import android.app.Activity
import android.content.Context
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.GradientDrawable
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.view.WindowManager
import androidx.appcompat.app.AppCompatDialog
import androidx.core.view.WindowCompat
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

class RNToolsOverlayView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private var contentHeight = 0f
  private var offsetTop = 0f

  internal val rootViewGroup = RNToolsOverlayRootView(context)
    .apply {
      layoutParams = LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT
      )
    }
  private var overlayDialog: AppCompatDialog? = null

  override fun setId(id: Int) {
    super.setId(id)
    rootViewGroup.id = id
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    hideOverlay()
  }

  fun setContentHeight(height: Float) {
    contentHeight = height
    if (contentHeight <= 0f) {
      hideOverlay()
      return
    }

    ensureOverlayIsShown()
    overlayDialog?.window?.let(::setupWindow)
  }

  fun setOffsetTop(offset: Float) {
    offsetTop = offset
    if (contentHeight > 0f) {
      ensureOverlayIsShown()
      overlayDialog?.window?.let(::setupWindow)
    }
  }

  private fun ensureOverlayIsShown() {
    if (overlayDialog != null) {
      return
    }

    (rootViewGroup.parent as? ViewGroup)?.removeView(rootViewGroup)

    overlayDialog = object : AppCompatDialog(context, R.style.RNToolsOverlayDialogTheme) {
      override fun dispatchTouchEvent(event: MotionEvent): Boolean {
        return super.dispatchTouchEvent(event)
      }
    }.apply {
      setContentView(rootViewGroup)
      setCanceledOnTouchOutside(false)
      setCancelable(false)
      setupWindow(window)
      show()
    }

    Log.d("RNToolsOverlay", "overlay dialog shown")
  }

  private fun hideOverlay() {
    overlayDialog?.dismiss()
    (rootViewGroup.parent as? ViewGroup)?.removeView(rootViewGroup)
    overlayDialog = null
  }

  private fun setupWindow(window: Window?) {
    window ?: return

    window.setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
    window.clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)
    WindowCompat.setDecorFitsSystemWindows(window, false)

    val attributes = window.attributes
    attributes.width = ViewGroup.LayoutParams.MATCH_PARENT
    attributes.height = if (contentHeight > 0f) contentHeight.dpToPx else ViewGroup.LayoutParams.MATCH_PARENT
    attributes.gravity = Gravity.TOP
    attributes.y = if (offsetTop > 0f) offsetTop.dpToPx else 0
    attributes.flags =
      WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
    attributes.token = (context as? Activity)?.window?.decorView?.windowToken
    window.attributes = attributes

    window.setLayout(
      ViewGroup.LayoutParams.MATCH_PARENT,
      attributes.height
    )

  }

  private val Float.dpToPx: Int
    get() = TypedValue.applyDimension(
      TypedValue.COMPLEX_UNIT_DIP,
      this,
      resources.displayMetrics
    ).toInt()

  private fun styleDebugBounds(window: Window) {
    val border = GradientDrawable().apply {
      shape = GradientDrawable.RECTANGLE
      setColor(Color.argb(24, 255, 0, 128))
      setStroke(4, Color.argb(220, 255, 64, 160))
    }

    window.decorView.setBackground(border)
    window.decorView.systemUiVisibility =
      window.decorView.systemUiVisibility or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
  }
}
