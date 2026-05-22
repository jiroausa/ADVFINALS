// App.js
import { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "./firebase/firebaseConfig";

import HomeScreen from "./screens/homeScreen";
import LoginScreen from "./screens/loginScreen";
import RegisterScreen from "./screens/registerScreen";
import ProfileScreen from "./screens/profileScreen";
import MangaDetailScreen from "./screens/mangaDetailScreen";

const Stack = createNativeStackNavigator();

function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="MangaDetail" component={MangaDetailScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(undefined);
  const navigationRef = useRef(null);
  const prevUserRef = useRef(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const prev = prevUserRef.current;
      prevUserRef.current = firebaseUser;
      setUser(firebaseUser ?? null);
      setAuthChecked(true);

      if (navigationRef.current) {
        const wasLoggedOut = prev === null || prev === undefined;
        const isNowLoggedIn = !!firebaseUser;
        const wasLoggedIn = !!prev;
        const isNowLoggedOut = !firebaseUser;

        if (wasLoggedIn && isNowLoggedOut) {
          navigationRef.current.reset({ index: 0, routes: [{ name: "Home" }] });
        } else if (wasLoggedOut && isNowLoggedIn) {
          const currentRoute = navigationRef.current.getCurrentRoute();
          if (currentRoute?.name === "Login" || currentRoute?.name === "Register") {
            navigationRef.current.reset({ index: 0, routes: [{ name: "Home" }] });
          }
        }
      }
    });
    return unsubscribe;
  }, []);

  if (!authChecked) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0F0F", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#E8272F" size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <RootStack />
    </NavigationContainer>
  );
}