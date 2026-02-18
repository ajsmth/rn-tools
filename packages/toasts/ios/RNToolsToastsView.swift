import ExpoModulesCore
import UIKit

public class ToastProps {
    var isVisible: Bool = false
    var position: String = "top"
    var duration: Double = 3.0
}

protocol RNToolsToastsViewDelegate: AnyObject {
    func handleToastShown()
    func handleToastDismissed()
}

public class RNToolsToastsView: ExpoView, RNToolsToastsViewDelegate {
    public var props = ToastProps()

    var onShown = EventDispatcher()
    var onDismissed = EventDispatcher()

    private lazy var toastVC = ToastViewController()

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        toastVC.appContext = appContext
        toastVC.delegate = self
    }

    deinit {
        toastVC.cleanup()
    }

    func updateIsVisible(_ isVisible: Bool) {
        props.isVisible = isVisible
        if isVisible {
            toastVC.showToast(position: props.position, duration: props.duration)
        } else {
            toastVC.dismissToast()
        }
    }

    func updatePosition(_ position: String) {
        props.position = position
    }

    func updateDuration(_ duration: Double) {
        props.duration = duration
    }

    func handleToastShown() {
        onShown([:])
    }

    func handleToastDismissed() {
        onDismissed([:])
    }

    public override func reactSubviews() -> [UIView]! {
        return []
    }

    public override func mountChildComponentView(
        _ childComponentView: UIView,
        index: Int
    ) {
        toastVC.insertChild(childComponentView, at: index)
    }

    public override func unmountChildComponentView(
        _ childComponentView: UIView,
        index: Int
    ) {
        childComponentView.removeFromSuperview()
    }
}

// MARK: - Passthrough Window

private class PassthroughWindow: UIWindow {
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        guard let hit = super.hitTest(point, with: event) else { return nil }
        // Only intercept touches that land on a subview of the toast content,
        // not on the root VC view or the window itself
        if hit === rootViewController?.view || hit === self {
            return nil
        }
        return hit
    }
}

// MARK: - Toast View Controller

final class ToastViewController: UIViewController {
    weak var delegate: RNToolsToastsViewDelegate?

    var appContext: AppContext? {
        didSet {
            _ = view
        }
    }

    private var overlayWindow: PassthroughWindow?
    private var autoDismissWork: DispatchWorkItem?
    private var position: String = "top"
    private var isShowing = false

    @available(*, unavailable) required init?(coder: NSCoder) { fatalError() }

    init() {
        super.init(nibName: nil, bundle: nil)
    }

    override func loadView() {
        self.view = UIView()
        self.view.backgroundColor = .clear
        RNToolsToastsTouchHandler.attach(to: self.view)
    }

    deinit {
        overlayWindow = nil
    }

    func showToast(position: String, duration: Double) {
        guard !isShowing else { return }
        isShowing = true
        self.position = position

        autoDismissWork?.cancel()

        let w = PassthroughWindow(frame: UIScreen.main.bounds)
        w.windowLevel = .statusBar + 3
        w.backgroundColor = .clear
        w.rootViewController = self
        w.makeKeyAndVisible()
        overlayWindow = w

        // Start off-screen
        let offset = position == "top"
            ? -UIScreen.main.bounds.height
            : UIScreen.main.bounds.height
        view.transform = CGAffineTransform(translationX: 0, y: offset)

        UIView.animate(
            withDuration: 0.4,
            delay: 0,
            usingSpringWithDamping: 0.7,
            initialSpringVelocity: 0,
            options: [.curveEaseOut],
            animations: {
                self.view.transform = .identity
            },
            completion: { _ in
                self.delegate?.handleToastShown()

                if duration > 0 {
                    self.scheduleAutoDismiss(after: duration)
                }
            }
        )
    }

    func dismissToast() {
        guard isShowing else { return }
        autoDismissWork?.cancel()
        autoDismissWork = nil

        let offset = position == "top"
            ? -UIScreen.main.bounds.height
            : UIScreen.main.bounds.height

        UIView.animate(
            withDuration: 0.3,
            delay: 0,
            usingSpringWithDamping: 1.0,
            initialSpringVelocity: 0,
            options: [.curveEaseIn],
            animations: {
                self.view.transform = CGAffineTransform(translationX: 0, y: offset)
            },
            completion: { _ in
                self.isShowing = false
                self.delegate?.handleToastDismissed()
                self.cleanup()
            }
        )
    }

    func cleanup() {
        autoDismissWork?.cancel()
        autoDismissWork = nil
        overlayWindow?.isHidden = true
        overlayWindow = nil
        isShowing = false
    }

    func insertChild(_ child: UIView, at index: Int) {
        view.insertSubview(child, at: index)
    }

    // MARK: - Private

    private func scheduleAutoDismiss(after seconds: Double) {
        let work = DispatchWorkItem { [weak self] in
            self?.dismissToast()
        }
        autoDismissWork = work
        DispatchQueue.main.asyncAfter(deadline: .now() + seconds, execute: work)
    }
}
