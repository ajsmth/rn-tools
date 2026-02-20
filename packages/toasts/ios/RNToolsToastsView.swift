import ExpoModulesCore
import UIKit

private let laneHorizontalInset: CGFloat = 12
private let laneVerticalSpacing: CGFloat = 8
private let laneCornerRadius: CGFloat = 16
private let laneHeaderHeight: CGFloat = 26
private let laneItemHeight: CGFloat = 36
private let laneMaxDebugItems = 5

public class RNToolsToastsView: ExpoView {
    private var overlayWindow: PassthroughWindow?
    private let rootView = PassthroughRootView()
    private let topLaneView = ToastDebugLaneView(position: .top)
    private let bottomLaneView = ToastDebugLaneView(position: .bottom)
    private let topGuideView = DebugGuideView(position: .top)
    private let bottomGuideView = DebugGuideView(position: .bottom)

    private var debugLayoutEnabled = false
    private var topItemCount = 0
    private var bottomItemCount = 0

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
        rootView.isUserInteractionEnabled = false
        rootView.onLayout = { [weak self] in
            self?.layoutOverlay(animated: false)
        }

        rootView.addSubview(topGuideView)
        rootView.addSubview(bottomGuideView)
        rootView.addSubview(topLaneView)
        rootView.addSubview(bottomLaneView)

        updateDebugLayout(false)
    }

    deinit {
        hideOverlay()
    }

    func updateIsVisible(_ isVisible: Bool) {
        if isVisible {
            showOverlay()
        } else {
            hideOverlay()
        }
    }

    func updateDebugLayout(_ debugLayout: Bool) {
        debugLayoutEnabled = debugLayout

        rootView.backgroundColor = debugLayout
            ? UIColor.systemYellow.withAlphaComponent(0.08)
            : .clear

        topGuideView.isHidden = !debugLayout
        bottomGuideView.isHidden = !debugLayout
        topLaneView.isHidden = !debugLayout
        bottomLaneView.isHidden = !debugLayout
        topLaneView.setDebugEnabled(debugLayout)
        bottomLaneView.setDebugEnabled(debugLayout)

        layoutOverlay(animated: false)
    }

    func updateTopItemCount(_ count: Int) {
        topItemCount = max(0, count)
        topLaneView.setItemCount(topItemCount)
        layoutOverlay(animated: true)
    }

    func updateBottomItemCount(_ count: Int) {
        bottomItemCount = max(0, count)
        bottomLaneView.setItemCount(bottomItemCount)
        layoutOverlay(animated: true)
    }

    public override func reactSubviews() -> [UIView]! {
        // Children integration will come later. For now this host is fully native.
        return []
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
        layoutOverlay(animated: false)
    }

    private func hideOverlay() {
        overlayWindow?.isHidden = true
        overlayWindow = nil
    }

    private func layoutOverlay(animated: Bool) {
        guard rootView.bounds.width > 0, rootView.bounds.height > 0 else { return }

        let safeInsets = overlayWindow?.safeAreaInsets ?? rootView.safeAreaInsets
        let rootWidth = rootView.bounds.width
        let rootHeight = rootView.bounds.height
        let laneWidth = max(0, rootWidth - (laneHorizontalInset * 2))

        let topLaneHeight = topLaneView.preferredHeight(debugEnabled: debugLayoutEnabled)
        let bottomLaneHeight = bottomLaneView.preferredHeight(debugEnabled: debugLayoutEnabled)

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

        topLaneView.frame = CGRect(
            x: laneHorizontalInset,
            y: safeInsets.top,
            width: laneWidth,
            height: topLaneHeight
        )
        bottomLaneView.frame = CGRect(
            x: laneHorizontalInset,
            y: rootHeight - safeInsets.bottom - bottomLaneHeight,
            width: laneWidth,
            height: bottomLaneHeight
        )

        _ = animated
        topLaneView.transform = .identity
        bottomLaneView.transform = .identity
        topLaneView.alpha = 1
        bottomLaneView.alpha = 1
    }
}

private final class ToastDebugLaneView: UIView {
    private let position: ToastLanePosition
    private let headerLabel = UILabel()
    private let countBadgeLabel = UILabel()
    private let stackView = UIStackView()

    private var debugEnabled = false
    private var itemCount = 0

    init(position: ToastLanePosition) {
        self.position = position
        super.init(frame: .zero)

        layer.cornerRadius = laneCornerRadius
        clipsToBounds = true
        isUserInteractionEnabled = false

        headerLabel.font = UIFont.monospacedSystemFont(ofSize: 12, weight: .semibold)
        headerLabel.textColor = .white

        countBadgeLabel.font = UIFont.monospacedSystemFont(ofSize: 11, weight: .bold)
        countBadgeLabel.textAlignment = .right
        countBadgeLabel.textColor = .white

        stackView.axis = .vertical
        stackView.spacing = 6
        stackView.alignment = .fill
        stackView.distribution = .fill

        addSubview(headerLabel)
        addSubview(countBadgeLabel)
        addSubview(stackView)

        setItemCount(0)
        refreshPalette()
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    func setDebugEnabled(_ enabled: Bool) {
        debugEnabled = enabled
        refreshPalette()
    }

    func setItemCount(_ count: Int) {
        itemCount = max(0, count)
        rebuildRows()
        setNeedsLayout()
    }

    func preferredHeight(debugEnabled: Bool) -> CGFloat {
        let visibleRows = min(max(itemCount, debugEnabled ? 1 : 0), laneMaxDebugItems)
        return laneHeaderHeight + CGFloat(visibleRows) * laneItemHeight + laneVerticalSpacing * 2
    }

    override func layoutSubviews() {
        super.layoutSubviews()

        headerLabel.frame = CGRect(
            x: 12,
            y: 8,
            width: bounds.width * 0.6,
            height: laneHeaderHeight - 6
        )

        countBadgeLabel.frame = CGRect(
            x: bounds.width * 0.6,
            y: 8,
            width: bounds.width * 0.4 - 12,
            height: laneHeaderHeight - 6
        )

        let stackTop = laneHeaderHeight + 4
        stackView.frame = CGRect(
            x: 10,
            y: stackTop,
            width: bounds.width - 20,
            height: bounds.height - stackTop - 8
        )
    }

    private func refreshPalette() {
        let isTop = position == .top
        let tone = isTop ? UIColor.systemRed : UIColor.systemBlue

        backgroundColor = tone.withAlphaComponent(debugEnabled ? 0.32 : 0.22)
        layer.borderColor = tone.withAlphaComponent(0.85).cgColor
        layer.borderWidth = debugEnabled ? 2 : 1

        headerLabel.text = isTop ? "TOP LANE" : "BOTTOM LANE"
        countBadgeLabel.text = "count: \(itemCount)"
    }

    private func rebuildRows() {
        while let first = stackView.arrangedSubviews.first {
            stackView.removeArrangedSubview(first)
            first.removeFromSuperview()
        }

        let rowCount = min(max(itemCount, debugEnabled ? 1 : 0), laneMaxDebugItems)
        for index in 0..<rowCount {
            let row = UIView()
            row.layer.cornerRadius = 10
            row.clipsToBounds = true

            let isTop = position == .top
            row.backgroundColor = isTop
                ? UIColor.systemRed.withAlphaComponent(0.25)
                : UIColor.systemBlue.withAlphaComponent(0.25)

            let label = UILabel()
            label.frame = CGRect(x: 10, y: 0, width: 240, height: laneItemHeight)
            label.font = UIFont.monospacedSystemFont(ofSize: 11, weight: .medium)
            label.textColor = .white
            label.text = "debug item \(index + 1)"

            row.addSubview(label)
            row.heightAnchor.constraint(equalToConstant: laneItemHeight).isActive = true
            stackView.addArrangedSubview(row)
        }

        if itemCount > laneMaxDebugItems {
            let overflow = UILabel()
            overflow.font = UIFont.monospacedSystemFont(ofSize: 11, weight: .semibold)
            overflow.textColor = .white.withAlphaComponent(0.88)
            overflow.textAlignment = .center
            overflow.text = "+\(itemCount - laneMaxDebugItems) more"
            overflow.heightAnchor.constraint(equalToConstant: 18).isActive = true
            stackView.addArrangedSubview(overflow)
        }

        countBadgeLabel.text = "count: \(itemCount)"
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
        label.frame = CGRect(x: 0, y: position == .top ? -12 : -12, width: 80, height: 12)
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

private enum ToastLanePosition {
    case top
    case bottom
}
