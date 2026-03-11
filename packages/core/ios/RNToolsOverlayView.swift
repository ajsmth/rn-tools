import ExpoModulesCore
import React
import UIKit

public final class RNToolsOverlayView: ExpoView {
    private let overlayRootView = UIView()
    private let overlayContentView = UIView()
    private var overlayWindow: RNToolsOverlayPassthroughWindow?
    private var overlayTouchHandler: UIGestureRecognizer?
    private var observers: [NSObjectProtocol] = []
    private var contentHeight: CGFloat?
    private var offsetTop: CGFloat = 0

    private lazy var overlayViewController: UIViewController = {
        let viewController = UIViewController()
        viewController.view = overlayRootView
        viewController.view.backgroundColor = .clear
        return viewController
    }()

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)

        backgroundColor = .clear
        isOpaque = false

        overlayRootView.backgroundColor = .clear
        overlayRootView.isOpaque = false
        overlayRootView.isUserInteractionEnabled = true

        overlayContentView.backgroundColor = .clear
        overlayContentView.isOpaque = false
        overlayContentView.isUserInteractionEnabled = true

        overlayTouchHandler = RNToolsCoreTouchHandler.createAndAttach(
            for: overlayRootView
        )

        overlayRootView.addSubview(overlayContentView)
        showOverlay()
    }

    deinit {
        observers.forEach(NotificationCenter.default.removeObserver)
        observers.removeAll()

        if let overlayTouchHandler {
            RNToolsCoreTouchHandler.detach(overlayTouchHandler, from: overlayRootView)
            self.overlayTouchHandler = nil
        }

        hideOverlay()
    }

    public override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
        childComponentView.removeFromSuperview()
        overlayContentView.insertSubview(childComponentView, at: index)
    }

    public override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
        _ = index
        childComponentView.removeFromSuperview()
    }

    public override func insertReactSubview(_ subview: UIView!, at index: Int) {
        overlayContentView.insertSubview(subview, at: index)
    }

    public override func removeReactSubview(_ subview: UIView!) {
        subview.removeFromSuperview()
    }

    public override func reactSubviews() -> [UIView]! {
        return overlayContentView.subviews
    }

    func setContentHeight(_ contentHeight: Double?) {
        if let contentHeight, contentHeight > 0 {
            self.contentHeight = CGFloat(contentHeight)
        } else {
            self.contentHeight = nil
        }
        updateOverlayFrame()
    }

    func setOffsetTop(_ offsetTop: Double?) {
        self.offsetTop = CGFloat(offsetTop ?? 0)
        updateOverlayFrame()
    }

    private func showOverlay() {
        guard overlayWindow == nil else { return }

        let window: RNToolsOverlayPassthroughWindow
        if let scene = UIApplication.shared.connectedScenes
            .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene {
            window = RNToolsOverlayPassthroughWindow(windowScene: scene)
        } else {
            window = RNToolsOverlayPassthroughWindow(frame: UIScreen.main.bounds)
        }

        window.backgroundColor = .clear
        window.isOpaque = false

        overlayRootView.frame = window.bounds
        overlayRootView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        overlayContentView.frame = overlayRootView.bounds
        overlayContentView.autoresizingMask = [.flexibleWidth, .flexibleHeight]

        window.rootViewController = overlayViewController
        window.floatAboveEverything()

        overlayWindow = window
        installWindowObservers()
        updateOverlayFrame()
    }

    private func hideOverlay() {
        observers.forEach(NotificationCenter.default.removeObserver)
        observers.removeAll()

        guard let window = overlayWindow else { return }
        window.isHidden = true
        window.rootViewController = nil
        overlayWindow = nil
    }

    private func installWindowObservers() {
        guard observers.isEmpty else { return }

        let center = NotificationCenter.default
        observers = [
            center.addObserver(
                forName: UIWindow.didBecomeVisibleNotification,
                object: nil,
                queue: .main
            ) { [weak self] _ in
                self?.overlayWindow?.floatAboveEverything()
                self?.updateOverlayFrame()
            },
            center.addObserver(
                forName: UIWindow.didBecomeKeyNotification,
                object: nil,
                queue: .main
            ) { [weak self] _ in
                self?.overlayWindow?.floatAboveEverything()
                self?.updateOverlayFrame()
            },
            center.addObserver(
                forName: UIDevice.orientationDidChangeNotification,
                object: nil,
                queue: .main
            ) { [weak self] _ in
                self?.updateOverlayFrame()
            },
        ]
    }

    private func updateOverlayFrame() {
        guard let window = overlayWindow else { return }

        let windowBounds = resolvedWindowBounds(for: window)
        let frame = CGRect(
            x: 0,
            y: contentHeight != nil ? offsetTop : 0,
            width: windowBounds.width,
            height: contentHeight ?? windowBounds.height
        )

        if window.frame != frame {
            window.frame = frame
        }

        overlayViewController.view.frame = window.bounds
        overlayRootView.frame = window.bounds
        overlayContentView.frame = overlayRootView.bounds
    }

    private func resolvedWindowBounds(for window: UIWindow) -> CGRect {
        if let sceneBounds = window.windowScene?.coordinateSpace.bounds {
            return sceneBounds
        }
        return UIScreen.main.bounds
    }
}

private final class RNToolsOverlayPassthroughWindow: UIWindow {
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        guard let hit = super.hitTest(point, with: event) else { return nil }
        return hit.hasReactViewAncestor() ? hit : nil
    }
}

private extension UIView {
    func hasReactViewAncestor() -> Bool {
        var current: UIView? = self
        while let view = current {
            if view is RCTView {
                return true
            }
            if NSStringFromClass(type(of: view)).hasPrefix("RCT") {
                return true
            }
            current = view.superview
        }
        return false
    }
}

private extension UIWindow {
    func floatAboveEverything() {
        guard let scene = windowScene else { return }

        let maxLevel = scene.windows
            .filter { $0 !== self }
            .map(\.windowLevel)
            .max() ?? .normal

        windowLevel = max(maxLevel + 1, .statusBar + 1)
        isHidden = false
    }
}
