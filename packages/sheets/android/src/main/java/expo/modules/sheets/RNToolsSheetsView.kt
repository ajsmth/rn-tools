package expo.modules.sheets

import android.content.Context
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import com.facebook.react.bridge.UiThreadUtil
import com.google.android.material.bottomsheet.BottomSheetDialog
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView


class RNToolsSheetsView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  val onDismiss by EventDispatcher()

  val rootViewGroup = SheetRootView(context, appContext)

  override fun setId(id: Int) {
    super.setId(id)
    rootViewGroup.id = id
  }

//  override fun addView(child: View?) {
//    rootViewGroup.addView(child)
//  }
//
//  override fun addView(child: View?, index: Int) {
//    rootViewGroup.addView(child, index)
//  }
//
//  override fun getChildCount(): Int {
//    return rootViewGroup.childCount
//  }
//
//  override fun getChildAt(index: Int): View {
//    return rootViewGroup.getChildAt(index)
//  }
//
//  override fun removeView(child: View?) {
//    if (child != null) {
//      rootViewGroup.removeView(child)
//    }
//  }

//  override fun removeViewAt(index: Int) {
//    if (index < 0 || index >= rootViewGroup.childCount) {
//      return
//    }
//
//    val child = rootViewGroup.getChildAt(index)
//    rootViewGroup.removeView(child)
//  }

  private var bottomSheetDialog: BottomSheetDialog? = null

  fun hideSheet() {
    bottomSheetDialog?.dismiss()
  }

  fun showSheet() {
    (rootViewGroup.parent as? ViewGroup)?.removeView(rootViewGroup)  // Detach if already attached

    bottomSheetDialog = BottomSheetDialog(context).apply {
      setContentView(FrameLayout(context).apply {
        addView(rootViewGroup)
      })

      setOnDismissListener {
        bottomSheetDialog = null
        onDismiss(mapOf())
      }

      show()
    }
  }
}

