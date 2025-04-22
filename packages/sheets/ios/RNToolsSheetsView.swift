import ExpoModulesCore
import React
import SwiftUI

public class SheetProps: ObservableObject {
    @Published var children: [UIView] = []
    @Published var isOpen: Bool = false
    @Published var openToIndex: Int = 0
    @Published var snapPoints: [Int] = []

    // Appearance props
    @Published var grabberVisible: Bool = true
    @Published var backgroundColor: String? = nil
    @Published var cornerRadius: Float? = nil
}

struct SheetAppearance: Record {
    @Field
    var grabberVisible: Bool?

    @Field
    var backgroundColor: String?

    @Field
    var cornerRadius: Float?
}

public class RNToolsSheetsView: ExpoView {
    public var props = SheetProps()
    var onDismiss = EventDispatcher()
    var onStateChange = EventDispatcher()

    var touchHandler: RCTTouchHandler?

    private lazy var sheetVC = SheetInternalViewController()

    lazy var hostingController = UIHostingController(
        rootView: ContentView(
            props: props, sheetVC: sheetVC, onDismiss: onDismiss,
            onStateChange: onStateChange))

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)

        if let bridge = appContext?.reactBridge {
            sheetVC.bridge = bridge
        }

        hostingController.view.autoresizingMask = [
            .flexibleWidth, .flexibleHeight,
        ]
        hostingController.view.backgroundColor = UIColor.clear
    }

    public override func layoutSubviews() {
        super.layoutSubviews()
        hostingController.view.frame = bounds
    }

    public override func didMoveToSuperview() {
        super.didMoveToSuperview()
        let parentViewController = findParentViewControllerOrNil()

        parentViewController.apply {
            $0.addChild(hostingController)
        }

        hostingController.view.layer.removeAllAnimations()
        hostingController.view.frame = bounds
        addSubview(hostingController.view)
        parentViewController.apply {
            hostingController.didMove(toParent: $0)
        }
    }

    public override func reactSubviews() -> [UIView]! {
        return []
    }

    #if RCT_NEW_ARCH_ENABLED
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

    #else
        public override func insertReactSubview(
            _ subview: UIView!, at atIndex: Int
        ) {
            sheetVC.insertChild(subview, at: atIndex)
        }

        public override func removeReactSubview(_ subview: UIView!) {
            sheetVC.removeChild(subview)
        }

    #endif

}

struct ContentView: View {
    @ObservedObject var props: SheetProps
    var sheetVC: SheetInternalViewController
    var onDismiss: EventDispatcher
    var onStateChange: EventDispatcher

    @State private var selectedDetent: PresentationDetent = .height(400.0)
    @State private var lastHeight: CGFloat = 0
    @State private var isDragging = false
    @State private var settleTimer: Timer?

    private var detents: [PresentationDetent] {
        props.snapPoints.map { .height(CGFloat($0)) }
    }

    private func detent(for index: Int?) -> PresentationDetent {
        guard
            let i = index,
            detents.indices.contains(i)
        else { return detents.first! }
        return detents[i]
    }

    private func upperSnapIndex(
        for height: CGFloat,
        snapPoints: [Int]
    ) -> Int {
        guard !snapPoints.isEmpty else { return 0 }

        let sorted = snapPoints.sorted()
        if let i = sorted.firstIndex(where: { CGFloat($0) >= height }) {
            return i
        }
        return sorted.count - 1
    }

    var body: some View {

        Color.clear
            .sheet(
                isPresented: $props.isOpen,
                onDismiss: {
                    onDismiss([:])
                    onStateChange(["type": "HIDDEN"])
                }
            ) {
                SheetInternalVCRepresentable(controller: sheetVC)
                    .background(
                        GeometryReader { geometry in
                            Color.clear
                                .onChange(of: geometry.size.height) {
                                    newHeight in
                                    if abs(newHeight - lastHeight) > 2 {
                                        if !isDragging {
                                            isDragging = true
                                            onStateChange(["type": "DRAGGING"])
                                        }

                                        settleTimer?.invalidate()
                                        settleTimer = Timer.scheduledTimer(
                                            withTimeInterval: 0.15,
                                            repeats: false
                                        ) { _ in
                                            isDragging = false
                                            onStateChange(["type": "SETTLING"])

                                            DispatchQueue.main.asyncAfter(
                                                deadline: .now() + 0.15
                                            ) {
                                                let idx = upperSnapIndex(
                                                    for: newHeight,
                                                    snapPoints: props.snapPoints
                                                )
                                                onStateChange([
                                                    "type": "OPEN",
                                                    "payload": ["index": idx],
                                                ])
                                            }
                                        }
                                    }

                                    lastHeight = newHeight
                                }
                        }
                    )
                    .presentationBackground16_4(
                        props.backgroundColor != nil
                            ? Color(hex: props.backgroundColor!) : Color.white
                    )
                    .presentationCornerRadius16_4(
                        props.cornerRadius.map { CGFloat($0) }
                    )
                    .presentationDragIndicator(
                        props.grabberVisible ? .visible : .hidden
                    )
                    .presentationDetents(
                        Set(detents),
                        selection: $selectedDetent
                    )
          
                    .onAppear {
                        selectedDetent = detent(for: props.openToIndex)
                    }
            }
    }
}

struct SheetInternalVCRepresentable: UIViewControllerRepresentable {
    let controller: SheetInternalViewController

    func makeUIViewController(context: Context) -> SheetInternalViewController {
        controller
    }
    func updateUIViewController(
        _ uiViewController: SheetInternalViewController,
        context: Context
    ) {}
}

final class SheetInternalViewController: UIViewController {
    var bridge: RCTBridge? {
        didSet {
            touchHandler = RCTTouchHandler(bridge: bridge)
            self.touchHandler?.attach(to: self.view)
        }
    }
    var surfaceTouchHandler = RNTSurfaceTouchHandlerWrapper()
    var touchHandler: RCTTouchHandler?

    init() {
        super.init(nibName: nil, bundle: nil)
        view.backgroundColor = .clear
    }

    override func loadView() {
        self.view = UIView()

        self.surfaceTouchHandler.attach(to: self.view)
    }

    @available(*, unavailable) required init?(coder: NSCoder) { fatalError() }

    func insertChild(_ child: UIView, at index: Int) {
        view.insertSubview(child, at: index)

    }

    func removeChild(_ child: UIView) {
        child.removeFromSuperview()
    }
}

extension Optional {
    func apply(_ fn: (Wrapped) -> Void) {
        if case let .some(val) = self {
            fn(val)
        }
    }
}

extension UIView {
    // Walks the responder chain to find the parent UIViewController
    // or null if not in a heirarchy yet
    func findParentViewControllerOrNil() -> UIViewController? {
        var nextResponder: UIResponder? = next
        while nextResponder != nil && nextResponder as? UIViewController == nil
        {
            nextResponder = nextResponder?.next
        }

        return nextResponder as? UIViewController
    }
}

extension Color {
    init(hex: String) {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")

        var rgb: UInt64 = 0
        Scanner(string: hexSanitized).scanHexInt64(&rgb)

        let red = Double((rgb & 0xFF0000) >> 16) / 255.0
        let green = Double((rgb & 0x00FF00) >> 8) / 255.0
        let blue = Double(rgb & 0x0000FF) / 255.0

        self.init(red: red, green: green, blue: blue)
    }
}


extension View {
    @ViewBuilder
    func presentationBackground16_4(_ color: Color?) -> some View {
        if #available(iOS 16.4, *) {
            self.presentationBackground(color ?? .white)
        } else {
            self
        }
    }

    @ViewBuilder
    func presentationCornerRadius16_4(_ radius: CGFloat?) -> some View {
        if #available(iOS 16.4, *) {
            self.presentationCornerRadius(radius)
        } else {
            self
        }
    }
}

