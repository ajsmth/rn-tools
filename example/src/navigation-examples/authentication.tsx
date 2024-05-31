import { navigation, Stack } from "@rn-tools/navigation";
import * as React from "react";
import { Button, Text, TextInput, View } from "react-native";

export function AuthenticationExample() {
  let [user, setUser] = React.useState(null);

  return (
    <Stack.Root>
      <Stack.Screens>
        <Stack.Screen>
          <MyLoginScreen onLoginSuccess={(user) => setUser(user)} />
        </Stack.Screen>

        {user != null && (
          <UserContext.Provider value={user}>
            <Stack.Screen gestureEnabled={false}>
              <MyAuthenticatedApp />
            </Stack.Screen>

            <Stack.Slot />
          </UserContext.Provider>
        )}
      </Stack.Screens>
    </Stack.Root>
  );
}

type User = {
  id: string;
  name: string;
};

let UserContext = React.createContext<User | null>(null);

let useUser = () => {
  let user = React.useContext(UserContext);

  if (user == null) {
    throw new Error("User not found");
  }

  return user;
};

function MyLoginScreen({
  onLoginSuccess,
}: {
  onLoginSuccess: (user: User) => void;
}) {
  let [name, setName] = React.useState("");

  return (
    <View style={{ flex: 1, paddingTop: 124, paddingHorizontal: 16 }}>
      <View>
        <TextInput
          style={{ fontSize: 20, fontWeight: "semibold" }}
          placeholder="Enter your name"
          onChangeText={setName}
          onSubmitEditing={(event) => {
            event.nativeEvent.text &&
              onLoginSuccess({ id: "1", name: event.nativeEvent.text });
          }}
        />
        <Button
          title="Login"
          disabled={!name}
          onPress={() => onLoginSuccess({ id: "1", name })}
        />
      </View>
    </View>
  );
}

function MyAuthenticatedApp() {
  let user = useUser();

  return <MyScreen title={`Welcome ${user.name}`} bg="lightblue" />;
}

function MyScreen({
  title,
  showPopButton = false,
  bg,
  children,
}: {
  title: string;
  showPopButton?: boolean;
  bg?: string;
  children?: React.ReactNode;
}) {
  function pushScreen() {
    navigation.pushScreen(
      <Stack.Screen>
        <MyScreen title="Pushed screen" showPopButton />
      </Stack.Screen>
    );
  }

  function popScreen() {
    navigation.popScreen();
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: bg || "white",
      }}
    >
      <Text style={{ fontSize: 28, fontWeight: "bold" }}>{title}</Text>
      {children}
      <Button title="Push screen" onPress={pushScreen} />
      {showPopButton && <Button title="Pop screen" onPress={popScreen} />}
    </View>
  );
}
