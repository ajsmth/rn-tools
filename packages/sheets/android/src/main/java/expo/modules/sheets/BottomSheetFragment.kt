import android.content.Context
import android.content.DialogInterface
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.LinearLayout
import androidx.fragment.app.FragmentActivity
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import expo.modules.sheets.SheetProps


class BottomSheetFragment(val c: Context, val contentView: View) : BottomSheetDialogFragment() {
    var onDismissListener: (() -> Unit)? = null  // Callback for dismiss event

    override fun onDismiss(dialog: DialogInterface) {
        super.onDismiss(dialog)
        onDismissListener?.invoke()  // Invoke the onDismiss callback
    }

    public fun showSheet() {
        val fragmentManager = (c as FragmentActivity).supportFragmentManager
        show(fragmentManager, tag)
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return contentView
    }
}
