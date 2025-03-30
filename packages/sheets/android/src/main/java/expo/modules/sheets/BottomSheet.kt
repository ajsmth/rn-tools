@file:OptIn(ExperimentalFoundationApi::class)

package expo.modules.sheets

import android.annotation.SuppressLint
import androidx.compose.animation.core.AnimationSpec
import androidx.compose.animation.core.DecayAnimationSpec
import androidx.compose.animation.core.tween
import androidx.compose.animation.rememberSplineBasedDecay
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.Indication
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.Saver
import androidx.compose.runtime.saveable.mapSaver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.input.nestedscroll.NestedScrollSource
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.layout
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.*
import expo.modules.sheets.androidx.compose.foundation.gestures.*
import kotlin.jvm.JvmName
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

private fun Saver(
    animationSpec: AnimationSpec<Float>,
    coroutineScope: CoroutineScope,
    sheetDetents: List<SheetDetent>,
    velocityThreshold: () -> Float,
    positionalThreshold: (totalDistance: Float) -> Float,
    decayAnimationSpec: DecayAnimationSpec<Float>,
    confirmDetentChange: (SheetDetent) -> Boolean,
): Saver<BottomSheetState, *> = mapSaver(save = { mapOf("detent" to it.currentDetent.identifier) }, restore = { map ->
    val selectedDetentName = map["detent"]
    BottomSheetState(
        initialDetent = sheetDetents.first { it.identifier == selectedDetentName },
        detents = sheetDetents,
        coroutineScope = coroutineScope,
        animationSpec = animationSpec,
        velocityThreshold = velocityThreshold,
        positionalThreshold = positionalThreshold,
        decayAnimationSpec = decayAnimationSpec,
        confirmDetentChange = confirmDetentChange,
    )
})

@Composable
public fun rememberBottomSheetState(
    initialDetent: SheetDetent,
    detents: List<SheetDetent> = listOf(SheetDetent.Hidden, SheetDetent.FullyExpanded),
    animationSpec: AnimationSpec<Float> = tween(),
    confirmDetentChange: (SheetDetent) -> Boolean = { true },
    decayAnimationSpec: DecayAnimationSpec<Float> = rememberSplineBasedDecay(),
    velocityThreshold: () -> Dp = { 125.dp },
    positionalThreshold: (totalDistance: Dp) -> Dp = { 56.dp },
): BottomSheetState {
    val density = LocalDensity.current
    val scope = rememberCoroutineScope()
    return rememberSaveable(
        saver = Saver(
            animationSpec = animationSpec,
            coroutineScope = scope,
            sheetDetents = detents,
            velocityThreshold = {
                with(density) {
                    velocityThreshold().toPx()
                }
            },
            positionalThreshold = { totalDistance ->
                with(density) {
                    positionalThreshold(totalDistance.toDp()).toPx()
                }
            },
            decayAnimationSpec = decayAnimationSpec,
            confirmDetentChange = confirmDetentChange,
        )
    ) {
        BottomSheetState(
            initialDetent = initialDetent,
            detents = detents,
            coroutineScope = scope,
            animationSpec = animationSpec,
            velocityThreshold = {
                with(density) {
                    velocityThreshold().toPx()
                }
            },
            positionalThreshold = { totalDistance ->
                with(density) {
                    positionalThreshold(totalDistance.toDp()).toPx()
                }
            },
            decayAnimationSpec = decayAnimationSpec,
            confirmDetentChange = confirmDetentChange
        )
    }
}

@Immutable
public class SheetDetent(
    public val identifier: String,
    public val calculateDetentHeight: (containerHeight: Dp, sheetHeight: Dp) -> Dp
) {
    public companion object {
        public val FullyExpanded: SheetDetent =
            SheetDetent("fully-expanded") { containerHeight, sheetHeight -> sheetHeight }
        public val Hidden: SheetDetent = SheetDetent("hidden") { containerHeight, sheetHeight -> 0.dp }
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other == null || this::class != other::class) return false

        other as SheetDetent

        return identifier == other.identifier
    }

    override fun hashCode(): Int {
        return identifier.hashCode()
    }
}

public class BottomSheetState internal constructor(
    initialDetent: SheetDetent,
    internal val detents: List<SheetDetent>,
    private val coroutineScope: CoroutineScope,
    animationSpec: AnimationSpec<Float>,
    velocityThreshold: () -> Float,
    positionalThreshold: (totalDistance: Float) -> Float,
    decayAnimationSpec: DecayAnimationSpec<Float>,
    internal val confirmDetentChange: (SheetDetent) -> Boolean,
) {
    init {
        check(detents.isNotEmpty()) {
            "Tried to create a bottom sheet without any detents. Make sure to pass at least one detent when creating your sheet's state."
        }
        check(detents.contains(initialDetent)) {
            "The initialDetent ${initialDetent.identifier} was not part of the included detents while creating the sheet's state."
        }

        val duplicates = detents.groupBy { it.identifier }
            .filter { it.value.size > 1 }
            .map { it.key }

        check(duplicates.isEmpty()) {
            "Detent identifiers need to be unique, but you passed the following detents multiple times: ${duplicates.joinToString { it }}."
        }
    }

    internal var closestDentToTop: Float by mutableStateOf(Float.NaN)

    internal var fullContentHeight = Float.NaN

    internal val anchoredDraggableState = UnstyledAnchoredDraggableState(
        initialValue = initialDetent,
        positionalThreshold = positionalThreshold,
        velocityThreshold = velocityThreshold,
        snapAnimationSpec = animationSpec,
        decayAnimationSpec = decayAnimationSpec,
        confirmValueChange = confirmDetentChange,
    )

    public var currentDetent: SheetDetent
        get() = anchoredDraggableState.currentValue
        set(value) {
            check(detents.contains(value)) {
                "Tried to set currentDetent to an unknown detent with identifier ${value.identifier}. Make sure that the detent is passed to the list of detents when instantiating the sheet's state."
            }
            coroutineScope.launch {
                anchoredDraggableState.animateTo(value)
            }
        }

    public val targetDetent: SheetDetent
        get() = anchoredDraggableState.targetValue

    public val isIdle: Boolean by derivedStateOf {
        (progress == 1f || progress == 0f) && currentDetent == targetDetent && anchoredDraggableState.isAnimationRunning.not()
    }

    public val progress: Float
        get() = anchoredDraggableState.progress(detents.first(), detents.last())

    public val offset: Float by derivedStateOf {
        if (anchoredDraggableState.offset.isNaN() || closestDentToTop.isNaN()) {
            1f
        } else {
            val offsetFromTop = anchoredDraggableState.offset - closestDentToTop
            fullContentHeight - offsetFromTop
        }
    }

    @Deprecated("Velocity can no longer be set", ReplaceWith("animateTo(value)"))
    public suspend fun animateTo(value: SheetDetent, velocity: Float = anchoredDraggableState.lastVelocity) {
        animateTo(value)
    }

    public suspend fun animateTo(value: SheetDetent) {
        check(detents.contains(value)) {
            "Tried to set currentDetent to an unknown detent with identifier ${value.identifier}. Make sure that the detent is passed to the list of detents when instantiating the sheet's state."
        }
        anchoredDraggableState.animateTo(value)
    }

    public fun jumpTo(value: SheetDetent) {
        check(detents.contains(value)) {
            "Tried to set currentDetent to an unknown detent with identifier ${value.identifier}. Make sure that the detent is passed to the list of detents when instantiating the sheet's state."
        }
        coroutineScope.launch { anchoredDraggableState.snapTo(value) }
    }
}

public class BottomSheetScope internal constructor(
    internal val state: BottomSheetState,
    enabled: Boolean
) {
    internal var enabled by mutableStateOf(enabled)
}

@SuppressLint("UnusedBoxWithConstraintsScope")
@Composable
public fun BottomSheet(
    state: BottomSheetState,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    content: @Composable (BottomSheetScope.() -> Unit),
) {
    val scope = remember { BottomSheetScope(state, enabled) }
    scope.enabled = enabled

    val coroutineScope = rememberCoroutineScope()

    BoxWithConstraints(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.TopCenter) {
        var containerHeight by remember { mutableStateOf(Dp.Unspecified) }
        state.fullContentHeight = Float.NaN

        val density = LocalDensity.current

        Box(
            modifier = Modifier.matchParentSize()
                .onSizeChanged { containerHeight = with(density) { it.height.toDp() } }
        ) {
            Box(
                contentAlignment = Alignment.TopCenter,
                modifier = Modifier
                    .let {
                        if (containerHeight != Dp.Unspecified) {
                            it.onSizeChanged { sheetSize ->
                                val sheetHeight = with(density) { sheetSize.height.toDp() }
                                state.fullContentHeight = sheetSize.height.toFloat()
                                val anchors = UnstyledDraggableAnchors {
                                    with(density) {
                                        state.closestDentToTop = Float.NaN

                                        state.detents.forEach { detent ->
                                            val contentHeight = detent
                                                .calculateDetentHeight(containerHeight, sheetHeight)
                                                .coerceIn(0.dp, sheetHeight)

                                            val offsetDp = containerHeight - contentHeight
                                            val offset = offsetDp.toPx()
                                            if (state.closestDentToTop.isNaN() || state.closestDentToTop > offset) {
                                                state.closestDentToTop = offset
                                            }
                                            detent at offset
                                        }
                                    }
                                }
                                val newTarget = if (state.isIdle) {
                                    state.anchoredDraggableState.currentValue
                                } else {
                                    state.anchoredDraggableState.targetValue
                                }

                                state.anchoredDraggableState.updateAnchors(anchors, newTarget)
                            }
                        } else it
                    }
                    .layout { measurable, constraints ->
                        val maxDetentHeight = if (containerHeight == Dp.Unspecified) {
                            constraints.maxHeight
                        } else {
                            state.detents.maxOf { detent ->
                                detent.calculateDetentHeight(containerHeight, with(density) {
                                    constraints.maxHeight.toDp()
                                })
                            }.roundToPx()
                        }
                        val placeable = measurable.measure(
                            constraints.copy(maxHeight = maxDetentHeight)
                        )
                        layout(placeable.width, placeable.height) {
                            placeable.place(0, 0)
                        }
                    }
                    .offset {
                        if (state.anchoredDraggableState.offset.isNaN().not()) {
                            val requireOffset = state.anchoredDraggableState.requireOffset()
                            val y = requireOffset.toInt()
                            IntOffset(x = 0, y = y)
                        } else {
                            IntOffset(x = 0, y = containerHeight.roundToPx())
                        }
                    }
//                    .then(
//                        if (scope.enabled) {
//                            Modifier.nestedScroll(
//                                remember(state.anchoredDraggableState, Orientation.Vertical) {
//                                    ConsumeSwipeWithinBottomSheetBoundsNestedScrollConnection(
//                                        orientation = Orientation.Vertical,
//                                        sheetState = state.anchoredDraggableState,
//                                        onFling = {
//                                            coroutineScope.launch { state.anchoredDraggableState.settle(it) }
//                                        }
//                                    )
//                                })
//                        } else Modifier
//                    )
//                    .unstyledAnchoredDraggable(
//                        state = state.anchoredDraggableState,
//                        orientation = Orientation.Vertical,
//                        enabled = scope.enabled
//                    )
//                    .pointerInput(Unit) { detectTapGestures { } }

                    // In your BottomSheet composable, replace this:
//                    .nestedUnstyledAnchoredDraggable(
//                        state = state.anchoredDraggableState,
//                        orientation = Orientation.Vertical,
//                        enabled = scope.enabled
//                    )

// With this:
                    .pointerInput(Unit) {
                        // This empty pointer input ensures we don't consume events
                    }
                    .unstyledAnchoredDraggable(
                        state = state.anchoredDraggableState,
                        orientation = Orientation.Vertical,
                        enabled = true // Set to false to let child views handle events
                    )
                    .align(Alignment.TopCenter)
                    .then(modifier)
            ) {
                scope.content()
            }
        }
    }
}

internal fun ConsumeSwipeWithinBottomSheetBoundsNestedScrollConnection(
    sheetState: UnstyledAnchoredDraggableState<SheetDetent>,
    orientation: Orientation,
    onFling: (velocity: Float) -> Unit
): NestedScrollConnection =
    object : NestedScrollConnection {
        override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset {
            val delta = available.toFloat()
            if (source == NestedScrollSource.UserInput && delta < 0) {
                // Check if the sheet is NOT fully expanded:
                val currentOffset = sheetState.requireOffset()
                val maxAnchor = sheetState.anchors.maxAnchor()
                // e.g. if offset < maxAnchor means there's room to expand upward
                // Adjust logic if your library’s "fully expanded" is minAnchor instead!

                return if (currentOffset < maxAnchor) {
                    // The sheet can still expand => consume the delta
                    Offset.Zero
                } else {
                    // The sheet is already at top => pass it to child (Offset.Zero)
                    Offset.Zero
                }
            }
            // If not an upward user drag, do nothing
            return Offset.Zero
        }

        override fun onPostScroll(
            consumed: Offset,
            available: Offset,
            source: NestedScrollSource
        ): Offset {
            if (source == NestedScrollSource.UserInput) {
                val delta = available.toFloat()
                if (delta < 0) {
                    val currentOffset = sheetState.requireOffset()
                    val maxAnchor = sheetState.anchors.maxAnchor()

                    return if (currentOffset < maxAnchor) {
                        Offset.Zero
//                        sheetState.dispatchRawDelta(delta).toOffset(orientation)
                    } else {
                        Offset.Zero
                    }
                }
            }
            return Offset.Zero
        }

        override suspend fun onPreFling(available: Velocity): Velocity {
            val toFling = available.toFloat()
            val currentOffset = sheetState.requireOffset()
            val minAnchor = sheetState.anchors.minAnchor()
            // original logic, typically the sheet tries to consume upward fling if not at top
            // but if you're fully expanded, pass fling to child

            return Velocity.Zero

            return if (toFling < 0 && currentOffset > minAnchor) {
                onFling(toFling)
                available
            } else {
                Velocity.Zero
            }
        }

        override suspend fun onPostFling(consumed: Velocity, available: Velocity): Velocity {
            onFling(available.toFloat())
            return available
        }

        private fun Float.toOffset(): Offset =
            Offset(
                x = if (orientation == Orientation.Horizontal) this else 0f,
                y = if (orientation == Orientation.Vertical) this else 0f
            )

        @JvmName("velocityToFloat")
        private fun Velocity.toFloat() = if (orientation == Orientation.Horizontal) x else y

        @JvmName("offsetToFloat")
        private fun Offset.toFloat(): Float = if (orientation == Orientation.Horizontal) x else y

        // Utility to convert float -> Offset for vertical/horizontal
        private fun Float.toOffset(orientation: Orientation): Offset =
            if (orientation == Orientation.Vertical) Offset(0f, this) else Offset(this, 0f)
    }
//
//@Composable
//public fun BottomSheetScope.DragIndication(
//    modifier: Modifier = Modifier,
//    indication: Indication = rememberFocusRingIndication(
//        ringColor = Color.Blue,
//        ringWidth = 4.dp,
//        paddingValues = PaddingValues(horizontal = 8.dp, vertical = 14.dp),
//        cornerRadius = 8.dp
//    ),
//    interactionSource: MutableInteractionSource = remember { MutableInteractionSource() },
//    onClickLabel: String? = "Toggle sheet"
//) {
//    var detentIndex by rememberSaveable { mutableStateOf(-1) }
//    var goUp by rememberSaveable { mutableStateOf(true) }
//
//    val onIndicationClicked: () -> Unit = {
//        if (detentIndex == -1) {
//            detentIndex = state.detents.indexOf(state.currentDetent)
//        }
//        if (detentIndex == state.detents.size - 1) goUp = false
//        if (detentIndex == 0) goUp = true
//
//        if (goUp) detentIndex++ else detentIndex--
//
//        val detent = state.detents[detentIndex]
//        state.currentDetent = detent
//    }
//
//    Box(
//        modifier = modifier.clickable(
//            role = Role.Button,
//            enabled = enabled && state.detents.size > 1,
//            interactionSource = interactionSource,
//            indication = indication,
//            onClickLabel = onClickLabel,
//            onClick = onIndicationClicked
//        )
//    )
//}