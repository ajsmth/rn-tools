package expo.modules.sheets

import android.view.View


class SheetProps {
    val children: MutableList<View> = mutableListOf()  // List of child views
    var isVisible: Boolean = false                     // Boolean to track visibility
    var onDismiss: (() -> Unit)? = null                // Optional callback when dismissed
}