import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import expo.modules.sheets.SheetProps


class BottomSheetFragment(private val props: SheetProps) : BottomSheetDialogFragment() {

    private lateinit var bottomSheetContainer: LinearLayout

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Create a LinearLayout to contain the child views
        bottomSheetContainer = LinearLayout(requireContext()).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }

        // Dynamically add child views to the container
        for (view in props.children) {
            bottomSheetContainer.addView(view)
        }

        return bottomSheetContainer
    }

    override fun onDestroyView() {
        super.onDestroyView()
        // Clean up any resources
    }
}
