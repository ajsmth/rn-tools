import ExpoModulesCore
import SwiftUI

public class SheetProps: ObservableObject {
  @Published var children: [UIView] = []
  @Published var isVisible: Bool = false
  @Published var snapPoints: [Int] = []
}

public class RNToolsSheetsView: ExpoView {
  public var props = SheetProps()
  var onDismiss = EventDispatcher()
  
  var touchHandler: RCTTouchHandler?
  

  lazy var hostingController = UIHostingController(
    rootView: ContentView(props: props, onDismiss: onDismiss))

  
  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    
    if let bridge = appContext?.reactBridge {
      touchHandler = RCTTouchHandler(bridge: bridge)
    }
    
    hostingController.view.autoresizingMask = [
        .flexibleWidth, .flexibleHeight,
    ]
    hostingController.view.backgroundColor = UIColor.clear
    hostingController.rootView = ContentView(props: props, onDismiss: onDismiss)
    
    addSubview(hostingController.view)
  }
  
  public override func reactSubviews() -> [UIView]! {
       return []
   }

  public override func insertReactSubview(_ subview: UIView!, at atIndex: Int) {
       super.insertReactSubview(subview, at: atIndex)
       props.children.insert(subview, at: atIndex)
    if (atIndex == 0) {
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
  
  @State private var previousHeight: CGFloat = 0
  @State private var newHeight: CGFloat = 0
  @State private var contentHeight: CGFloat = 0

  
  var body: some View {
      Color.clear
        .sheet(isPresented: $props.isVisible, onDismiss: {
          onDismiss([:])
        }) {
          VStack {
            ForEach(Array(props.children.enumerated()), id: \.offset) { index, child in
              RepresentableView(view: child)
            }
          }
          .background(
            GeometryReader { geometry in
              Color.clear
                .onChange(of: geometry.size.height) { newHeight in
                  print("newheight: \(newHeight)")
                  // Check if the height has changed significantly (a threshold can be used)
                  if abs(newHeight - previousHeight) > 1 {
                    previousHeight = newHeight
                    // Callback when the detent has changed based on height change
                    print("onDetentChange: \(newHeight)")
                  }
                }
            }
          ).presentationDetents(Set(props.snapPoints.map { snapPoint in
              PresentationDetent.height(CGFloat(snapPoint))
          }))
        }
  }
}



struct RepresentableView: UIViewRepresentable {
    var view: UIView
    
    func makeUIView(context: Context) -> UIView {
        // Create a container view that respects safe areas
        let containerView = UIView()
        containerView.backgroundColor = .clear
        
        view.translatesAutoresizingMaskIntoConstraints = false
        containerView.addSubview(view)
        
        NSLayoutConstraint.activate([
            view.topAnchor.constraint(equalTo: containerView.topAnchor),
            view.leadingAnchor.constraint(equalTo: containerView.leadingAnchor),
            view.trailingAnchor.constraint(equalTo: containerView.trailingAnchor),
            view.bottomAnchor.constraint(equalTo: containerView.bottomAnchor)
        ])
        
        return containerView
    }
    
    func updateUIView(_ uiView: UIView, context: Context) {}
}

