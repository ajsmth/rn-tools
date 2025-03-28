package expo.modules.sheets

import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.background
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.nestedscroll.NestedScrollDispatcher
import androidx.compose.ui.viewinterop.AndroidView
import com.composables.core.ModalBottomSheet
import com.composables.core.Scrim
import com.composables.core.SheetDetent
import com.composables.core.rememberModalBottomSheetState
import com.composables.core.Sheet

val Peek = SheetDetent(identifier = "peek") { containerHeight, sheetHeight ->
    containerHeight * 0.4f
}
val Peek2 = SheetDetent(identifier = "peek2") { containerHeight, sheetHeight ->
    containerHeight * 0.6f
}



@Composable
fun SheetView(
    props: SheetProps
) {
    val sheetState = rememberModalBottomSheetState(
        initialDetent = Peek,
        detents = listOf(SheetDetent.Hidden, Peek, Peek2, SheetDetent.FullyExpanded)
    )

    val dispatcher = remember { NestedScrollDispatcher() }

    ModalBottomSheet(state = sheetState) {
        Scrim()
        Sheet(modifier = Modifier.fillMaxWidth().background(Color.White)) {
            // Render the root ViewGroup using AndroidView
            Box(
                modifier = Modifier
                    .fillMaxWidth()
            ) {
                AndroidView(
                    factory = { context ->
                        NestedScrollInteropView(context).apply {
                            nestedScrollDispatcher = dispatcher
                            addView(props.rootViewGroup)
                        }

                    },
                    modifier = Modifier.fillMaxWidth()
                )
            }

        }
    }
}