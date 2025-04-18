package expo.modules.sheets

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class SheetProps {
    var isOpen by mutableStateOf(false)
    var openToIndex by mutableIntStateOf(0)
    var snapPoints by mutableStateOf<List<Int>>(emptyList())
    lateinit var rootViewGroup: SheetRootView

    // Appearance props
    var dimAmount by mutableStateOf(0.56f)
}

class SheetAppearance : Record {
    @Field
    var dimAmount: Float? = 0.56f
}
