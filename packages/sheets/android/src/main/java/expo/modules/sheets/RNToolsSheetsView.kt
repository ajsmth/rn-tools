package expo.modules.sheets

import BottomSheetFragment
import android.content.Context
import android.view.View
import android.view.ViewGroup
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.FragmentManager
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView


class RNToolsSheetsView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val onDismiss by EventDispatcher()

  val props = SheetProps()
  var bottomSheet = BottomSheetFragment(props)

  init {
  }

  override fun addView(child: View?, index: Int) {
    val viewGroup = child as? ViewGroup

    if (viewGroup != null) {
      props.children.add(child)
    }

  }

  fun showSheet() {
    bottomSheet = BottomSheetFragment(props)

    val activity = appContext.currentActivity as? AppCompatActivity

    if (activity != null) {
      // Get the FragmentManager from the activity
      val manager = activity.supportFragmentManager

      // Show the BottomSheetFragment using the FragmentManager
      bottomSheet.show(manager, bottomSheet.tag)
    } else {
      // Handle the case where context is not an Activity or FragmentActivity
      // You could throw an error or log a message here for debugging purposes
      throw IllegalStateException("Context is not an AppCompatActivity")
    }

  }
}
