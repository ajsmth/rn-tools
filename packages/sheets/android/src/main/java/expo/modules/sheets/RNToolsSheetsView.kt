package expo.modules.sheets

import android.content.Context
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import expo.modules.sheets.SheetRootView

class RNToolsSheetsView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  val onDismiss by EventDispatcher()
  var rootViewGroup = SheetRootView(context, appContext)

  private var bottomSheetDialog: BottomSheetDialog? = null
  private var bottomSheetBehavior: BottomSheetBehavior<View>? = null
  private var snapPoints: List<Int> = listOf()

  override fun setId(id: Int) {
    super.setId(id)
    rootViewGroup.id = id
  }

  fun setSnapPoints(snapPoints: List<Int>) {
    this.snapPoints = snapPoints.sorted() // Ensure sorted order

    // If the sheet is already showing, update the behavior dynamically
    bottomSheetBehavior?.let { behavior ->
      behavior.peekHeight = snapPoints.firstOrNull() ?: 0
    }
  }

  fun hideSheet() {
    bottomSheetDialog?.dismiss()
  }

  fun showSheet() {
    (rootViewGroup.parent as? ViewGroup)?.removeView(rootViewGroup)

    bottomSheetDialog = BottomSheetDialog(context).apply {
      val frameLayout = FrameLayout(context)
      frameLayout.addView(rootViewGroup)
      setContentView(frameLayout)



      setOnShowListener {
        val bottomSheet = findViewById<View>(com.google.android.material.R.id.design_bottom_sheet)
        bottomSheet?.let {
          bottomSheetBehavior = BottomSheetBehavior.from(it).apply {
            isFitToContents = false  // Required for multiple snap points
            peekHeight = snapPoints.firstOrNull() ?: 0  // Set initial snap point

            val maxHeight = snapPoints.lastOrNull() ?: ViewGroup.LayoutParams.WRAP_CONTENT
            bottomSheet.layoutParams.height = maxHeight
            bottomSheet.requestLayout()
          }
        }
      }

      setOnDismissListener {
        bottomSheetDialog = null
        onDismiss(mapOf())
      }

      show()
    }
  }
}
