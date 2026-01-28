package expo.modules.rntoolscore

import android.graphics.Rect
import android.os.Build
import android.view.View
import android.view.WindowInsets
import androidx.annotation.RequiresApi
import kotlin.math.max
import kotlin.math.min

data class EdgeInsets(
  val top: Float,
  val right: Float,
  val bottom: Float,
  val left: Float
)

@RequiresApi(Build.VERSION_CODES.R)
private fun getRootWindowInsetsCompatR(rootView: View): EdgeInsets? {
  val insets =
    rootView.rootWindowInsets?.getInsets(
      WindowInsets.Type.statusBars() or
        WindowInsets.Type.displayCutout() or
        WindowInsets.Type.navigationBars() or
        WindowInsets.Type.captionBar()
    ) ?: return null

  return EdgeInsets(
    top = insets.top.toFloat(),
    right = insets.right.toFloat(),
    bottom = insets.bottom.toFloat(),
    left = insets.left.toFloat()
  )
}

@RequiresApi(Build.VERSION_CODES.M)
@Suppress("DEPRECATION")
private fun getRootWindowInsetsCompatM(rootView: View): EdgeInsets? {
  val insets = rootView.rootWindowInsets ?: return null
  return EdgeInsets(
    top = insets.systemWindowInsetTop.toFloat(),
    right = insets.systemWindowInsetRight.toFloat(),
    // Use the min to avoid including the keyboard while still honoring nav bars.
    bottom = min(insets.systemWindowInsetBottom, insets.stableInsetBottom).toFloat(),
    left = insets.systemWindowInsetLeft.toFloat()
  )
}

private fun getRootWindowInsetsCompatBase(rootView: View): EdgeInsets? {
  val visibleRect = Rect()
  rootView.getWindowVisibleDisplayFrame(visibleRect)
  return EdgeInsets(
    top = visibleRect.top.toFloat(),
    right = (rootView.width - visibleRect.right).toFloat(),
    bottom = (rootView.height - visibleRect.bottom).toFloat(),
    left = visibleRect.left.toFloat()
  )
}

private fun getRootWindowInsetsCompat(rootView: View): EdgeInsets? {
  return when {
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.R -> getRootWindowInsetsCompatR(rootView)
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.M -> getRootWindowInsetsCompatM(rootView)
    else -> getRootWindowInsetsCompatBase(rootView)
  }
}

fun getSafeAreaInsets(view: View): EdgeInsets? {
  if (view.height == 0) {
    return null
  }

  val rootView = view.rootView
  val windowInsets = getRootWindowInsetsCompat(rootView) ?: return null

  val windowWidth = rootView.width.toFloat()
  val windowHeight = rootView.height.toFloat()
  val visibleRect = Rect()
  view.getGlobalVisibleRect(visibleRect)

  return EdgeInsets(
    top = max(windowInsets.top - visibleRect.top, 0f),
    right = max(min(visibleRect.left + view.width - windowWidth, 0f) + windowInsets.right, 0f),
    bottom = max(min(visibleRect.top + view.height - windowHeight, 0f) + windowInsets.bottom, 0f),
    left = max(windowInsets.left - visibleRect.left, 0f)
  )
}
