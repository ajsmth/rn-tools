package expo.modules.sheets

import android.content.Context
import android.graphics.drawable.GradientDrawable
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.platform.ComposeView
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import android.graphics.Color
import com.facebook.react.bridge.UiThreadUtil

class RNToolsSheetsView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  val onDismiss by EventDispatcher()
  val onStateChange by EventDispatcher()
  val onDismissPrevented by EventDispatcher()

  var rootViewGroup = SheetRootView(context, appContext)
  private var composeView: ComposeView
  
  private var bottomSheetDialog: BottomSheetDialog? = null

  val props = SheetProps()

  init {
    layoutParams = LayoutParams(
      ViewGroup.LayoutParams.MATCH_PARENT,
      ViewGroup.LayoutParams.WRAP_CONTENT
    )

    props.rootViewGroup = rootViewGroup

    composeView = ComposeView(context).apply {
      setContent {
        LaunchedEffect(props.isOpen) {
          if (props.isOpen) {
            showSheet()
          } else {
            hideSheet()
          }
        }

        LaunchedEffect(props.canDismiss) {
          UiThreadUtil.runOnUiThread {
            bottomSheetDialog?.apply {
              setCancelable(true)
              behavior.isHideable = props.canDismiss
            }
          }
        }
      }
    }

    addView(composeView)
  }

  override fun setId(id: Int) {
    super.setId(id)
    rootViewGroup.id = id
  }

  private fun hideSheet() {
    UiThreadUtil.runOnUiThread {
      bottomSheetDialog?.dismiss()
      bottomSheetDialog = null
    }
  }

  private fun showSheet() {
    UiThreadUtil.runOnUiThread {
      (rootViewGroup.parent as? ViewGroup)?.removeView(rootViewGroup)

      val frameLayout = FrameLayout(context).apply {
        layoutParams = LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.WRAP_CONTENT
        )

        addView(rootViewGroup)
      }

      val snapPoints = props.snapPoints
      val initialIndex = props.initialIndex

      val hasTwoSnapPoints = snapPoints.size >= 2
      val peekHeight = if (hasTwoSnapPoints) snapPoints[0] else -1
      val expandedHeight = if (snapPoints.isNotEmpty()) snapPoints.getOrNull(1) ?: snapPoints[0] else -1
      val initialHeight = snapPoints.getOrNull(initialIndex) ?: peekHeight

      bottomSheetDialog = PreventDismissBottomSheetDialog(
        context = context,
        canDismiss = { props.canDismiss },
        onDismissPrevented = { onDismissPrevented(mapOf()) }
      ).apply {
        setCancelable(true)
        setContentView(frameLayout)

        window?.setDimAmount(props.dimAmount)

        behavior.isHideable = props.canDismiss

        window?.findViewById<View>(com.google.android.material.R.id.design_bottom_sheet)?.let { bottomSheet ->
          val backgroundColor = props.backgroundColor?.let {
            try {
              Color.parseColor(it)
            } catch (e: IllegalArgumentException) {
              Color.WHITE
            }
          } ?: Color.WHITE

          val radius = props.cornerRadius ?: 32f

          val drawable = GradientDrawable().apply {
            setColor(backgroundColor)
            cornerRadii = floatArrayOf(
              radius, radius,
              radius, radius,
              0f, 0f,
              0f, 0f
            )
          }

          bottomSheet.background = drawable
        }

        val behavior = behavior

        setOnDismissListener {
          onDismiss(mapOf())
          if (behavior.state != BottomSheetBehavior.STATE_HIDDEN) {
            onStateChange(mapOf(
              "type" to "HIDDEN",
            ))
          }
        }

        if (peekHeight > 0) {
          behavior.peekHeight = peekHeight
        }

        if (expandedHeight > 0) {
          frameLayout.layoutParams.height = expandedHeight
          frameLayout.requestLayout()
        }

        behavior.addBottomSheetCallback(object : BottomSheetBehavior.BottomSheetCallback() {
          override fun onStateChanged(bottomSheet: android.view.View, newState: Int) {
            if (!props.canDismiss && newState == BottomSheetBehavior.STATE_HIDDEN) {
              onDismissPrevented(mapOf())
            }

            handleSheetStateChange(newState)
          }

          override fun onSlide(bottomSheet: android.view.View, slideOffset: Float) {
          }
        })

        show()

        if (initialHeight == peekHeight) {
          behavior.state = BottomSheetBehavior.STATE_COLLAPSED
        } else {
          behavior.state = BottomSheetBehavior.STATE_EXPANDED
        }

        handleSheetStateChange(behavior.state)
      }
    }
  }

  fun convertToPx(height: Double): Int {
    val density = context.resources.displayMetrics.density
    return (height * density).toInt()
  }

  fun handleSheetStateChange(newState: Int) {
    when (newState) {
      BottomSheetBehavior.STATE_HIDDEN -> {
        onStateChange(mapOf(
          "type" to "HIDDEN",
        ))

      }
      BottomSheetBehavior.STATE_COLLAPSED -> {
        onStateChange(mapOf(
          "type" to "OPEN",
          "payload" to mapOf(
            "index" to 0
          )
        ))
      }

      BottomSheetBehavior.STATE_HALF_EXPANDED -> {
        onStateChange(mapOf(
          "type" to "OPEN",
          "payload" to mapOf(
            "index" to 0
          )
        ))
      }

      BottomSheetBehavior.STATE_EXPANDED -> {
        onStateChange(mapOf(
          "type" to "OPEN",
          "payload" to mapOf(
            "index" to 1
          )
        ))
      }

    }
  }
}

class PreventDismissBottomSheetDialog(
  context: Context,
  private val canDismiss: () -> Boolean,
  private val onDismissPrevented: () -> Unit
) : BottomSheetDialog(context) {
  override fun cancel() {
    if (canDismiss()) super.cancel() else onDismissPrevented()
  }

  override fun onBackPressed() {
    if (canDismiss()) super.onBackPressed() else onDismissPrevented()
  }
}
