import ExpoModulesCore
import UIKit

private let laneHorizontalInset: CGFloat = 0
private let laneVerticalSpacing: CGFloat = 0
private let laneCornerRadius: CGFloat = 16
private let laneAbsoluteMaxHeight: CGFloat = 280
private let laneRelativeMaxHeightRatio: CGFloat = 0.42
private let laneMinimumHeight: CGFloat = 72
private let topLaneChildIdentifier = "rn-tools-toasts-lane-top"
private let bottomLaneChildIdentifier = "rn-tools-toasts-lane-bottom"

public class RNToolsToastsView: ExpoView {
    private var overlayWindow: PassthroughWindow?
    private let rootView = PassthroughRootView()
    private let topLaneMountView = PassthroughContainerView()
    private let bottomLaneMountView = PassthroughContainerView()
    private let topLaneView = ToastDebugLaneView(position: .top)
    private let bottomLaneView = ToastDebugLaneView(position: .bottom)
    private let topGuideView = DebugGuideView(position: .top)
    private let bottomGuideView = DebugGuideView(position: .bottom)
    private var topLaneTouchHandler: UIGestureRecognizer?
    private var bottomLaneTouchHandler: UIGestureRecognizer?
    private var childLaneAssignments: [ObjectIdentifier: ToastLanePosition] = [:]
    private var isDebugLayoutEnabled = false

    private lazy var rootVC: UIViewController = {
        let vc = UIViewController()
        vc.view = rootView
        vc.view.backgroundColor = .clear
        return vc
    }()

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)

        backgroundColor = .clear
        isOpaque = false

        rootView.backgroundColor = .clear
        rootView.isOpaque = false
        // Keep touch handling enabled so future React children can receive events.
        rootView.isUserInteractionEnabled = true
        rootView.onLayout = { [weak self] in
            self?.layoutOverlay()
        }

        topLaneMountView.backgroundColor = .clear
        topLaneMountView.isUserInteractionEnabled = true
        topLaneMountView.clipsToBounds = true

        bottomLaneMountView.backgroundColor = .clear
        bottomLaneMountView.isUserInteractionEnabled = true
        bottomLaneMountView.clipsToBounds = true

        topLaneTouchHandler = RNToolsToastsTouchHandler.createAndAttach(
            for: topLaneMountView
        )
        bottomLaneTouchHandler = RNToolsToastsTouchHandler.createAndAttach(
            for: bottomLaneMountView
        )

        rootView.addSubview(topLaneMountView)
        rootView.addSubview(bottomLaneMountView)
        rootView.addSubview(topGuideView)
        rootView.addSubview(bottomGuideView)
        rootView.addSubview(topLaneView)
        rootView.addSubview(bottomLaneView)

        showOverlay()
        updateDebugLayout(false)
    }

    deinit {
        if let topLaneTouchHandler {
            RNToolsToastsTouchHandler.detach(topLaneTouchHandler, from: topLaneMountView)
            self.topLaneTouchHandler = nil
        }
        if let bottomLaneTouchHandler {
            RNToolsToastsTouchHandler.detach(bottomLaneTouchHandler, from: bottomLaneMountView)
            self.bottomLaneTouchHandler = nil
        }
        hideOverlay()
    }

    func updateDebugLayout(_ debugLayout: Bool) {
        isDebugLayoutEnabled = debugLayout
        rootView.backgroundColor = debugLayout
            ? UIColor.systemYellow.withAlphaComponent(0.08)
            : .clear

        topGuideView.isHidden = !debugLayout
        bottomGuideView.isHidden = !debugLayout
        topLaneView.isHidden = !debugLayout
        bottomLaneView.isHidden = !debugLayout

        layoutOverlay()
    }

    public override func reactSubviews() -> [UIView]! {
        // Children are mounted via mount/unmountChildComponentView into lane containers.
        return []
    }

    public override func mountChildComponentView(
        _ childComponentView: UIView,
        index: Int
    ) {
        let childID = ObjectIdentifier(childComponentView)
        let assignedLane = resolvedLaneAssignment(
            for: childComponentView,
            preferredIndex: index,
            existing: childLaneAssignments[childID]
        )
        childLaneAssignments[childID] = assignedLane
        let laneContainer = laneContainerView(for: assignedLane)

        childComponentView.removeFromSuperview()
        childComponentView.frame = laneContainer.bounds
        childComponentView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        laneContainer.addSubview(childComponentView)

        #if DEBUG
            if isDebugLayoutEnabled {
            NSLog(
                "[RNToolsToasts][mount] index=%d id=%@ lane=%@ topSubviews=%d bottomSubviews=%d",
                index,
                childComponentView.accessibilityIdentifier ?? "nil",
                assignedLane == .top ? "top" : "bottom",
                topLaneMountView.subviews.count,
                bottomLaneMountView.subviews.count
            )
            }
        #endif
    }

    public override func unmountChildComponentView(
        _ childComponentView: UIView,
        index: Int
    ) {
        _ = index
        childLaneAssignments.removeValue(forKey: ObjectIdentifier(childComponentView))
        childComponentView.removeFromSuperview()

        #if DEBUG
            if isDebugLayoutEnabled {
            NSLog(
                "[RNToolsToasts][unmount] index=%d id=%@ topSubviews=%d bottomSubviews=%d",
                index,
                childComponentView.accessibilityIdentifier ?? "nil",
                topLaneMountView.subviews.count,
                bottomLaneMountView.subviews.count
            )
            }
        #endif
    }

    private func showOverlay() {
        guard overlayWindow == nil else { return }

        let window: PassthroughWindow
        if let scene = UIApplication.shared.connectedScenes
            .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene {
            window = PassthroughWindow(windowScene: scene)
        } else {
            window = PassthroughWindow(frame: UIScreen.main.bounds)
        }

        window.windowLevel = .statusBar + 3
        window.backgroundColor = .clear
        window.isOpaque = false

        rootView.frame = window.bounds
        rootView.autoresizingMask = [.flexibleWidth, .flexibleHeight]

        window.rootViewController = rootVC
        window.isHidden = false

        overlayWindow = window
        layoutOverlay()
    }

    private func hideOverlay() {
        overlayWindow?.isHidden = true
        overlayWindow = nil
    }

    private func layoutOverlay() {
        guard rootView.bounds.width > 0, rootView.bounds.height > 0 else { return }

        let safeInsets = overlayWindow?.safeAreaInsets ?? rootView.safeAreaInsets
        let rootWidth = rootView.bounds.width
        let rootHeight = rootView.bounds.height

        let laneWidth = max(0, rootWidth - laneHorizontalInset * 2)
        let availableHeight = max(0, rootHeight - safeInsets.top - safeInsets.bottom)
        let laneHeight = max(
            laneMinimumHeight,
            min(laneAbsoluteMaxHeight, availableHeight * laneRelativeMaxHeightRatio)
        )

        let topLaneFrame = CGRect(
            x: laneHorizontalInset,
            y: safeInsets.top + laneVerticalSpacing,
            width: laneWidth,
            height: laneHeight
        )

        let bottomLaneFrame = CGRect(
            x: laneHorizontalInset,
            y: rootHeight - safeInsets.bottom - laneVerticalSpacing - laneHeight,
            width: laneWidth,
            height: laneHeight
        )

        topGuideView.frame = CGRect(
            x: laneHorizontalInset,
            y: safeInsets.top,
            width: laneWidth,
            height: 1
        )

        bottomGuideView.frame = CGRect(
            x: laneHorizontalInset,
            y: rootHeight - safeInsets.bottom - 1,
            width: laneWidth,
            height: 1
        )

        topLaneMountView.frame = topLaneFrame
        bottomLaneMountView.frame = bottomLaneFrame
        topLaneView.frame = topLaneFrame
        bottomLaneView.frame = bottomLaneFrame

        topLaneView.updateDebugFrame(topLaneFrame)
        bottomLaneView.updateDebugFrame(bottomLaneFrame)
    }

    private func nextLaneAssignment(preferredIndex index: Int) -> ToastLanePosition {
        if topLaneMountView.subviews.isEmpty {
            return .top
        }
        if bottomLaneMountView.subviews.isEmpty {
            return .bottom
        }
        return index == 0 ? .top : .bottom
    }

    private func resolvedLaneAssignment(
        for childComponentView: UIView,
        preferredIndex index: Int,
        existing: ToastLanePosition?
    ) -> ToastLanePosition {
        if childComponentView.accessibilityIdentifier == topLaneChildIdentifier {
            return .top
        }
        if childComponentView.accessibilityIdentifier == bottomLaneChildIdentifier {
            return .bottom
        }
        if let existing {
            return existing
        }
        return nextLaneAssignment(preferredIndex: index)
    }

    private func laneContainerView(for position: ToastLanePosition) -> UIView {
        if position == .top {
            return topLaneMountView
        }
        return bottomLaneMountView
    }

}

private final class ToastDebugLaneView: UIView {
    private let position: ToastLanePosition
    private let titleLabel = UILabel()
    private let frameLabel = UILabel()

    init(position: ToastLanePosition) {
        self.position = position
        super.init(frame: .zero)

        layer.cornerRadius = laneCornerRadius
        clipsToBounds = true
        isUserInteractionEnabled = false

        titleLabel.font = UIFont.monospacedSystemFont(ofSize: 12, weight: .semibold)
        titleLabel.textColor = .white
        titleLabel.text = position == .top ? "TOP LANE" : "BOTTOM LANE"

        frameLabel.font = UIFont.monospacedSystemFont(ofSize: 11, weight: .regular)
        frameLabel.textColor = UIColor.white.withAlphaComponent(0.9)
        frameLabel.numberOfLines = 2

        addSubview(titleLabel)
        addSubview(frameLabel)
        refreshPalette()
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func layoutSubviews() {
        super.layoutSubviews()

        titleLabel.frame = CGRect(
            x: 12,
            y: 10,
            width: max(0, bounds.width - 24),
            height: 18
        )

        frameLabel.frame = CGRect(
            x: 12,
            y: 30,
            width: max(0, bounds.width - 24),
            height: max(0, bounds.height - 40)
        )
    }

    func updateDebugFrame(_ frame: CGRect) {
        frameLabel.text = [
            "x:\(Int(frame.minX)) y:\(Int(frame.minY))",
            "w:\(Int(frame.width)) h:\(Int(frame.height))",
        ].joined(separator: "\n")
    }

    private func refreshPalette() {
        let tone = position == .top ? UIColor.systemRed : UIColor.systemBlue
        backgroundColor = .clear
        layer.borderColor = tone.withAlphaComponent(0.9).cgColor
        layer.borderWidth = 2
        titleLabel.textColor = tone.withAlphaComponent(0.95)
        frameLabel.textColor = tone.withAlphaComponent(0.85)
    }
}

private final class DebugGuideView: UIView {
    private let position: ToastLanePosition
    private let label = UILabel()

    init(position: ToastLanePosition) {
        self.position = position
        super.init(frame: .zero)

        layer.borderWidth = 1
        layer.borderColor = UIColor.systemGreen.withAlphaComponent(0.85).cgColor
        isUserInteractionEnabled = false

        label.font = UIFont.monospacedSystemFont(ofSize: 10, weight: .bold)
        label.textColor = UIColor.systemGreen.withAlphaComponent(0.95)
        label.text = position == .top ? "safe-top" : "safe-bottom"
        addSubview(label)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        label.frame = CGRect(x: 0, y: -12, width: 90, height: 12)
    }
}

private final class PassthroughWindow: UIWindow {
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        guard let hit = super.hitTest(point, with: event) else { return nil }
        if hit === rootViewController?.view || hit === self { return nil }
        return hit
    }
}

private final class PassthroughRootView: UIView {
    var onLayout: (() -> Void)?

    override func layoutSubviews() {
        super.layoutSubviews()
        onLayout?()
    }

    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        guard let hit = super.hitTest(point, with: event) else { return nil }
        if hit === self { return nil }
        return hit
    }
}

private final class PassthroughContainerView: UIView {
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        guard let hit = super.hitTest(point, with: event) else { return nil }
        if hit === self { return nil }
        return hit
    }
}

private enum ToastLanePosition {
    case top
    case bottom
}
