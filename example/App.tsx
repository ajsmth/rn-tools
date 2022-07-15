import * as React from "react";
import { LogBox } from "react-native";
import { ExpoPreviewProvider } from "expo-component-preview";
import {
  createStackNavigator,
  ScreenProps,
  navigate,
  goBack,
  Router,
  Routes,
} from "@rn-toolkit/navigation";
import {
  createBottomSheetProvider,
  createModalProvider,
  createToastProvider,
} from "@rn-toolkit/ui";
import { ThemeProvider } from "@rn-toolkit/tailwind";
import { View, Text, Pressable } from "./styles";

const Modal = createModalProvider();
const Toast = createToastProvider();
const BottomSheet = createBottomSheetProvider();

LogBox.ignoreLogs(["Constants.platform"]);

const Stack = createStackNavigator();

export default function App() {
  console.log("\n");

  return (
    <ExpoPreviewProvider>
      <ThemeProvider themePreference="dark">
        <BottomSheet.Provider>
          <Modal.Provider>
            <Toast.Provider>
              <Router
                routes={{
                  "/hey": ({ next, url }) => {
                    Stack.push(MyScreen);
                    console.log("HIT");
                  },
                }}
              >
                <Stack.Navigator>
                  <MenuContainer />
                </Stack.Navigator>
              </Router>
            </Toast.Provider>
          </Modal.Provider>
        </BottomSheet.Provider>
      </ThemeProvider>
    </ExpoPreviewProvider>
  );
}

function MenuContainer() {
  return (
    <View
      styles="flex-1 justify-center"
      // TODO: babel plugin for tailwind
      selectors={{ light: "bg-red-500", dark: "bg-blue-500" }}
    >
      <Menu />
    </View>
  );
}

function Menu() {
  return (
    <View>
      <MyButton
        title="Push screen"
        onPress={() => {
          navigate("/hey");
        }}
      />

      <MyButton title="Push bottom sheet" onPress={() => {}} />

      <MyButton title="Push modal" onPress={() => {}} />

      <MyButton title="Push toast" onPress={() => {}} />
    </View>
  );
}

function MyScreen(props: ScreenProps<{ title: string }>) {
  return (
    <View styles="flex-1 items-center pt-48">
      <MyButton
        title="Pop"
        onPress={async () => {
          const item = await Stack.pop();
        }}
      />
      <MyButton
        title="Update header"
        onPress={() => props.setHeaderProps({ title: "!@3" })}
      />
      <MyButton
        title="Update screen"
        onPress={() => {
          console.log("Update Screen");
          props.setScreenProps({ style: { backgroundColor: "red" } });
        }}
      />

      <MyButton
        title="Go back"
        onPress={() => {
          goBack();
        }}
      />

      <MyButton title="Navigate" onPress={() => navigate("/hey")} />
      {/* <Menu /> */}
    </View>
  );
}

function MyButton({ onPress, title }: any) {
  return (
    <Pressable onPress={onPress} styles="py-2 px-4 items-center">
      <Text styles="text-lg font-medium">{title}</Text>
    </Pressable>
  );
}

function MyBottomSheet(props: BottomSheetProps) {
  return (
    <View styles="flex-1">
      <MyButton
        title="Push screen"
        onPress={() => {
          // Stack.push(MyScreen, { headerProps: { title: "Heyo" } });
        }}
      />
    </View>
  );
}

function MyModal() {
  return (
    <View styles="bg-white rounded-lg mx-4 p-4 shadow-medium">
      <Menu />
    </View>
  );
}

function MyToast() {
  return (
    <View styles="bg-green-500 mx-4 py-4 border-1 rounded-md">
      <Text styles="text-center text-lg font-semibold text-white">Hi</Text>
    </View>
  );
}
