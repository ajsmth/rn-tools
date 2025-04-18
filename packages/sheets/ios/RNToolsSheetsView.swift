import ExpoModulesCore
import SwiftUI

public class SheetProps: ObservableObject {
    @Published var children: [UIView] = []
    @Published var isOpen: Bool = false
    @Published var openToIndex: Int = 0
    @Published var snapPoints: [Int] = []

    // Appearance props
    @Published var grabberVisible: Bool = true
    @Published var scrimDim: Double = 0.0

}

struct SheetAppearance: Record {
    @Field
    var grabberVisible: Bool?

    @Field
    var scrimDim: Double?
}

public class RNToolsSheetsView: ExpoView {
    public var props = SheetProps()
    var onDismiss = EventDispatcher()
    var onStateChange = EventDispatcher()

    var touchHandler: RCTTouchHandler?

    lazy var hostingController = UIHostingController(
        rootView: ContentView(
            props: props, onDismiss: onDismiss, onStateChange: onStateChange))

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)

        if let bridge = appContext?.reactBridge {
            touchHandler = RCTTouchHandler(bridge: bridge)
        }

        hostingController.view.autoresizingMask = [
            .flexibleWidth, .flexibleHeight,
        ]
        hostingController.view.backgroundColor = UIColor.clear
        hostingController.rootView = ContentView(
            props: props, onDismiss: onDismiss, onStateChange: onStateChange)

        addSubview(hostingController.view)
    }

    public override func reactSubviews() -> [UIView]! {
        return []
    }

    public override func insertReactSubview(_ subview: UIView!, at atIndex: Int)
    {
        super.insertReactSubview(subview, at: atIndex)
        props.children.insert(subview, at: atIndex)
        if atIndex == 0 {
            touchHandler?.attach(to: subview)
        }
    }

    public override func removeReactSubview(_ subview: UIView!) {
        super.removeReactSubview(subview)
        if let index = props.children.firstIndex(of: subview) {
            props.children.remove(at: index)
        }
    }
}

struct ContentView: View {
    @ObservedObject var props: SheetProps
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
                VStack {
                    ForEach(Array(props.children.enumerated()), id: \.offset) {
                        index, child in
                        RepresentableView(view: child)
                    }
                }
                .background(
                    GeometryReader { geometry in
                        Color.clear
                            .onChange(of: geometry.size.height) { newHeight in
                                if abs(newHeight - lastHeight) > 2 {
                                    if !isDragging {
                                        isDragging = true
                                        onStateChange(["type": "DRAGGING"])
                                    }

                                    settleTimer?.invalidate()
                                    settleTimer = Timer.scheduledTimer(
                                        withTimeInterval: 0.15, repeats: false
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
                .presentationBackground(Color.clear)
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

struct RepresentableView: UIViewRepresentable {
    var view: UIView

    func makeUIView(context: Context) -> UIView {
        let containerView = UIView()
        containerView.backgroundColor = .clear

        view.translatesAutoresizingMaskIntoConstraints = false
        containerView.addSubview(view)

        NSLayoutConstraint.activate([
            view.topAnchor.constraint(equalTo: containerView.topAnchor),
            view.leadingAnchor.constraint(equalTo: containerView.leadingAnchor),
            view.trailingAnchor.constraint(
                equalTo: containerView.trailingAnchor),
            view.bottomAnchor.constraint(equalTo: containerView.bottomAnchor),
        ])

        return containerView
    }

    func updateUIView(_ uiView: UIView, context: Context) {}
}
