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
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import expo.modules.sheets.SheetProps


class BottomSheetFragment(val c: Context, val rootViewGroup: ViewGroup) : BottomSheetDialogFragment() {
    private val contentView: View
        /**
         * Returns the view that will be the root view of the dialog. We are wrapping this in a
         * FrameLayout because this is the system's way of notifying us that the dialog size has
         * changed. This has the pleasant side-effect of us not having to preface all Modals with "top:
         * statusBarHeight", since that margin will be included in the FrameLayout.
         */
        get() =
            FrameLayout(c).apply {
                addView(rootViewGroup)
            }

    var onDismissListener: (() -> Unit)? = null  // Callback for dismiss event

    override fun onDismiss(dialog: DialogInterface) {
        super.onDismiss(dialog)
        onDismissListener?.invoke()  // Invoke the onDismiss callback
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return contentView
    }
}
