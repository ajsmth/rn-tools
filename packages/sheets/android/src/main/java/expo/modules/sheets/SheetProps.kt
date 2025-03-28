package expo.modules.sheets

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

class SheetProps {
    var isVisible by mutableStateOf(false)
    lateinit var rootViewGroup: SheetRootView
}