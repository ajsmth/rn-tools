import ExpoModulesCore
import UIKit

public class RNToolsCoreModule: Module {
    private var lastInsets: UIEdgeInsets?
    private var observers: [NSObjectProtocol] = []

    public func definition() -> ModuleDefinition {
        Name("RNToolsCore")

        Events("onSafeAreaInsetsChange")

        Function("getSafeAreaInsets") { () -> [String: CGFloat] in
            if Thread.isMainThread {
                return self.safeAreaInsetsDictionary()
            }

            var result = self.safeAreaInsetsDictionary()
            DispatchQueue.main.sync {
                result = self.safeAreaInsetsDictionary()
            }
            return result
        }

        OnCreate {
            self.startObservingSafeArea()
        }

        OnDestroy {
            self.stopObservingSafeArea()
        }

        OnAppBecomesActive {
            self.emitSafeAreaInsetsIfChanged()
        }
    }

    private func startObservingSafeArea() {
        UIDevice.current.beginGeneratingDeviceOrientationNotifications()
        let center = NotificationCenter.default
        let names: [NSNotification.Name] = [
            UIApplication.didBecomeActiveNotification,
            UIApplication.willEnterForegroundNotification,
            UIDevice.orientationDidChangeNotification,
            UIApplication.didChangeStatusBarFrameNotification,
        ]

        observers = names.map { name in
            center.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in
                self?.emitSafeAreaInsetsIfChanged()
            }
        }

        emitSafeAreaInsetsIfChanged()
    }

    private func stopObservingSafeArea() {
        let center = NotificationCenter.default
        observers.forEach { center.removeObserver($0) }
        observers.removeAll()
        UIDevice.current.endGeneratingDeviceOrientationNotifications()
    }

    private func emitSafeAreaInsetsIfChanged() {
        let send = { [weak self] in
            guard let self else { return }
            let windowInsets = self.keyWindow()?.safeAreaInsets ?? .zero
            if let last = self.lastInsets, self.areInsetsEqual(last, windowInsets) {
                return
            }
            self.lastInsets = windowInsets
            self.sendEvent("onSafeAreaInsetsChange", ["insets": self.safeAreaInsetsDictionary(windowInsets)])
        }

        if Thread.isMainThread {
            send()
        } else {
            DispatchQueue.main.async { send() }
        }
    }

    private func safeAreaInsetsDictionary(_ insets: UIEdgeInsets? = nil) -> [String: CGFloat] {
        let resolved = insets ?? keyWindow()?.safeAreaInsets ?? .zero
        return [
            "top": resolved.top,
            "right": resolved.right,
            "bottom": resolved.bottom,
            "left": resolved.left,
        ]
    }

    private func areInsetsEqual(_ lhs: UIEdgeInsets, _ rhs: UIEdgeInsets) -> Bool {
        return lhs.top == rhs.top &&
            lhs.right == rhs.right &&
            lhs.bottom == rhs.bottom &&
            lhs.left == rhs.left
    }

    private func keyWindow() -> UIWindow? {
        let scenes = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }

        if let window = scenes.first(where: { $0.isKeyWindow }) {
            return window
        }

        return UIApplication.shared.windows.first(where: { $0.isKeyWindow })
    }
}
