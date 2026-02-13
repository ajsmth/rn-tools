import ExpoModulesCore
import React
import UIKit

public class SheetProps {
    var isOpen: Bool = false
    var initialIndex: Int = 0
    var snapPoints: [CGFloat] = []
    var canDismiss: Bool = true

    // Appearance props
    var grabberVisible: Bool = true
    var backgroundColor: String? = nil
    var cornerRadius: Float? = nil
}

protocol RNToolsSheetsViewDelegate: AnyObject {
    func handleSheetStateChange(index: Int)
    func handleSheetDismissed()
    func handleSheetCanDismiss() -> Bool
}

public class RNToolsSheetsView: ExpoView, RNToolsSheetsViewDelegate {
    public var props = SheetProps()

    var onDismiss = EventDispatcher()
    var onStateChange = EventDispatcher()
    var onDismissPrevented = EventDispatcher()

    private lazy var sheetVC = SheetViewController()

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)

        sheetVC.appContext = appContext
        sheetVC.delegate = self
    }

    deinit {
        sheetVC.cleanup()
    }

    func updateSnapPoints(_ snapPoints: [CGFloat]) {
        props.snapPoints = snapPoints
        if props.isOpen {
            sheetVC.updateSheetConfiguration(
                openTo: props.initialIndex,
                snapPoints: props.snapPoints,
                grabberVisible: props.grabberVisible,
                backgroundColor: props.backgroundColor,
                cornerRadius: props.cornerRadius
            )
        }
    }

    func updateIsOpen(_ isOpen: Bool) {
        props.isOpen = isOpen
        if isOpen {
            sheetVC.presentSheet(
                openTo: props.initialIndex,
                snapPoints: props.snapPoints,
                grabberVisible: props.grabberVisible,
                backgroundColor: props.backgroundColor,
                cornerRadius: props.cornerRadius
            )
        } else {
            sheetVC.dismissSheet()
        }
    }

    func updateInitialIndex(_ initialIndex: Int) {
        props.initialIndex = initialIndex
        if props.isOpen {
            sheetVC.updateSheetConfiguration(
                openTo: props.initialIndex,
                snapPoints: props.snapPoints,
                grabberVisible: props.grabberVisible,
                backgroundColor: props.backgroundColor,
                cornerRadius: props.cornerRadius
            )
        }
    }

    func updateCanDismiss(_ canDismiss: Bool) {
        props.canDismiss = canDismiss
    }

    func updateAppearance(
        grabberVisible: Bool,
        backgroundColor: String?,
        cornerRadius: Float?
    ) {
        props.grabberVisible = grabberVisible
        props.backgroundColor = backgroundColor
        props.cornerRadius = cornerRadius
        if props.isOpen {
            sheetVC.updateSheetConfiguration(
                openTo: props.initialIndex,
                snapPoints: props.snapPoints,
                grabberVisible: props.grabberVisible,
                backgroundColor: props.backgroundColor,
                cornerRadius: props.cornerRadius
            )
        }
    }

    func handleSheetDismissed() {
        onDismiss([:])
        onStateChange(["type": "HIDDEN"])
    }

    func handleSheetStateChange(index: Int) {
        onStateChange([
            "type": "OPEN",
            "payload": ["index": index],
        ])
    }

    func handleSheetCanDismiss() -> Bool {
        if !props.canDismiss {
            onDismissPrevented([:])
        }
        return props.canDismiss
    }

    public override func reactSubviews() -> [UIView]! {
        return []
    }


        public override func mountChildComponentView(
            _ childComponentView: UIView,
            index: Int
        ) {
            sheetVC.insertChild(childComponentView, at: index)
        }

        public override func unmountChildComponentView(
            _ childComponentView: UIView,
            index: Int
        ) {
            childComponentView.removeFromSuperview()
        }
//        public override func insertReactSubview(
//            _ subview: UIView!, at atIndex: Int
//        ) {
//            sheetVC.insertChild(subview, at: atIndex)
//        }
//
//        public override func removeReactSubview(_ subview: UIView!) {
//            sheetVC.removeChild(subview)
//        }

}

final class SheetViewController: UIViewController,
    UISheetPresentationControllerDelegate
{
    weak var delegate: RNToolsSheetsViewDelegate?

    var appContext: AppContext? {
        didSet {
            _ = view
        }
    }

    @available(*, unavailable) required init?(coder: NSCoder) { fatalError() }

    init() {
        super.init(nibName: nil, bundle: nil)
        view.backgroundColor = .white
    }

    override func loadView() {
        self.view = UIView()
        RNToolsTouchHandlerHelper.createAndAttachTouchHandler(for: self.view)
    }
    

    deinit {
        overlayWindow = nil
    }

    private let detentTag = UUID().uuidString

    private var overlayWindow: UIWindow?

    func presentSheet(
        openTo index: Int = 0,
        snapPoints: [CGFloat],
        grabberVisible: Bool,
        backgroundColor: String?,
        cornerRadius: Float?
    ) {
        guard overlayWindow == nil else {
            updateSheetConfiguration(
                openTo: index,
                snapPoints: snapPoints,
                grabberVisible: grabberVisible,
                backgroundColor: backgroundColor,
                cornerRadius: cornerRadius
            )
            return
        }

        modalPresentationStyle = .pageSheet

        updateSheetConfiguration(
            openTo: index,
            snapPoints: snapPoints,
            grabberVisible: grabberVisible,
            backgroundColor: backgroundColor,
            cornerRadius: cornerRadius
        )

        let w = UIWindow(frame: UIScreen.main.bounds)
        w.windowLevel = .statusBar + 2
        w.rootViewController = UIViewController()
        w.makeKeyAndVisible()

        overlayWindow = w

        let host = UIViewController()
        host.modalPresentationStyle = .overFullScreen
        host.view.backgroundColor = .clear

        w.rootViewController?.present(host, animated: false) {
            host.present(self, animated: true) { [weak self] in
                self?.emitInitialOpenState(requestedIndex: index)
            }
        }
    }

    func updateSheetConfiguration(
        openTo index: Int = 0,
        snapPoints: [CGFloat],
        grabberVisible: Bool,
        backgroundColor: String?,
        cornerRadius: Float?
    ) {
        if let sheet = sheetPresentationController {
            sheet.delegate = self
            sheet.prefersGrabberVisible = grabberVisible
            sheet.detents = makeDetents(from: snapPoints)

            if let radius = cornerRadius {
                sheet.preferredCornerRadius = CGFloat(radius)
            }

            let detents = sheet.detents
            if detents.indices.contains(index) {
                sheet.selectedDetentIdentifier = detents[index].identifier
            } else {
                sheet.selectedDetentIdentifier = detents.first?.identifier
            }
        }

        view.backgroundColor = UIColor(hex: backgroundColor) ?? .white
    }

    func dismissSheet() {
        dismiss(animated: true) { [weak self] in
            self?.delegate?.handleSheetDismissed()
            self?.overlayWindow?.isHidden = true
            self?.overlayWindow = nil
        }
    }

    func cleanup() {
        overlayWindow?.isHidden = true
        overlayWindow = nil
    }

    func insertChild(_ child: UIView, at index: Int) {
        view.insertSubview(child, at: index)

    }

    func removeChild(_ child: UIView) {
        child.removeFromSuperview()
    }

    func sheetPresentationControllerDidChangeSelectedDetentIdentifier(
        _ sheetPresentationController: UISheetPresentationController
    ) {
        guard
            let selectedID = sheetPresentationController
                .selectedDetentIdentifier,
            let index = sheetPresentationController.detents
                .firstIndex(where: { $0.identifier == selectedID })
        else { return }

        delegate?.handleSheetStateChange(index: index)
    }

    func presentationControllerShouldDismiss(
        _ presentationController: UIPresentationController
    ) -> Bool {
        if let d = delegate {
            return d.handleSheetCanDismiss()
        }

        return true
    }

    func presentationControllerDidDismiss(
        _ presentationController: UIPresentationController
    ) {
        delegate?.handleSheetDismissed()
        cleanup()
    }

    private func emitInitialOpenState(requestedIndex: Int) {
        guard let sheet = sheetPresentationController else { return }

        if
            let selectedID = sheet.selectedDetentIdentifier,
            let index = sheet.detents.firstIndex(where: { $0.identifier == selectedID })
        {
            delegate?.handleSheetStateChange(index: index)
            return
        }

        let fallbackIndex: Int
        if sheet.detents.indices.contains(requestedIndex) {
            fallbackIndex = requestedIndex
        } else {
            fallbackIndex = 0
        }
        delegate?.handleSheetStateChange(index: fallbackIndex)
    }

    private func makeDetents(from points: [CGFloat])
        -> [UISheetPresentationController.Detent]
    {
        guard !points.isEmpty else { return [.large()] }

        return points.enumerated().map { idx, raw in
            .custom(identifier: .init("\(detentTag)_\(idx)")) { _ in
                return raw
            }
        }
    }

}

extension UIColor {
    convenience init?(hex: String?) {
        guard let hex, !hex.isEmpty else { return nil }

        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")

        guard hexSanitized.count == 6 else { return nil }

        var rgb: UInt64 = 0
        guard Scanner(string: hexSanitized).scanHexInt64(&rgb) else { return nil }

        let red = CGFloat((rgb & 0xFF0000) >> 16) / 255.0
        let green = CGFloat((rgb & 0x00FF00) >> 8) / 255.0
        let blue = CGFloat(rgb & 0x0000FF) / 255.0

        self.init(red: red, green: green, blue: blue, alpha: 1.0)
    }
}
