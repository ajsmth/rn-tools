package expo.modules.sheets

import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.background
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.viewinterop.AndroidView



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

    ModalBottomSheet(state = sheetState) {
//        Scrim()
        Sheet(modifier = Modifier.fillMaxWidth().background(Color.White)) {
            Box(modifier = Modifier.fillMaxWidth()) {
                AndroidView(
                    factory = { props.rootViewGroup },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}
