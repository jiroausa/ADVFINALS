/**
 * registerScreen.jsx — MangaVault
 * Enhanced manga ink-panel aesthetic. Firebase Auth registration.
 */

import { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
} from "react-native";
import { auth } from "../firebase/firebaseConfig";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

const C = {
  bg: "#080808",
  surface: "#111111",
  surface2: "#181818",
  border: "#282828",
  borderBright: "#3A3A3A",
  accent: "#E8272F",
  accentDark: "#9E1A20",
  accentGold: "#F5C518",
  accentBlue: "#2B7FE8",
  ink: "#0D0D0D",
  text: "#F0EDE8",
  textMuted: "#666666",
  textDim: "#444444",
  white: "#FFFFFF",
  panel: "#161616",
};

// Perks data
const PERKS = [
  { icon: "⭐", label: "RATE", sub: "Score every title" },
  { icon: "💬", label: "REVIEW", sub: "Share your take" },
  { icon: "📚", label: "DISCOVER", sub: "Find new gems" },
];

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const passwordTooShort = password.length > 0 && password.length < 6;

  function shakeError() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 35, useNativeDriver: true }),
    ]).start();
  }

  const handlePressIn = () =>
    Animated.spring(pressAnim, { toValue: 0.95, useNativeDriver: true, speed: 30 }).start();
  const handlePressOut = () =>
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  async function handleRegister() {
    if (!username || !email || !password || !confirmPassword) {
      shakeError(); alert("All fields are required."); return;
    }
    if (password !== confirmPassword) {
      shakeError(); alert("Passwords do not match."); return;
    }
    if (password.length < 6) {
      shakeError(); alert("Password must be at least 6 characters."); return;
    }
    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCred.user, { displayName: username.trim() });
      navigation.replace("Home");
    } catch (error) {
      shakeError();
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Side accent bars */}
      <View style={styles.sideBarLeft} />
      <View style={styles.sideBarRight} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← BACK</Text>
            </TouchableOpacity>
            <View style={styles.headerRight}>
              <Text style={styles.headerChapter}>CH.01</Text>
            </View>
          </View>

          {/* Hero panel */}
          <View style={styles.heroBanner}>
            <View style={styles.heroBannerAccent} />
            <View style={styles.heroBannerContent}>
              <View style={styles.heroIconBox}>
                <Text style={styles.heroIcon}>📖</Text>
              </View>
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroOverline}>NEW READER</Text>
                <Text style={styles.heroTitle}>Join the Vault</Text>
                <Text style={styles.heroSub}>Start your manga journey today</Text>
              </View>
            </View>
          </View>

          {/* Perks strip */}
          <View style={styles.perksRow}>
            {PERKS.map((perk) => (
              <View key={perk.label} style={styles.perkItem}>
                <Text style={styles.perkIcon}>{perk.icon}</Text>
                <Text style={styles.perkLabel}>{perk.label}</Text>
                <Text style={styles.perkSub}>{perk.sub}</Text>
              </View>
            ))}
          </View>

          {/* Form card */}
          <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
            {/* Top bar */}
            <View style={styles.cardTopBar}>
              <View style={[styles.cardTopSeg, { backgroundColor: C.accentGold, flex: 2 }]} />
              <View style={[styles.cardTopSeg, { backgroundColor: C.accent, flex: 1 }]} />
              <View style={[styles.cardTopSeg, { backgroundColor: C.accentBlue, flex: 1 }]} />
            </View>

            <View style={styles.cardBody}>
              {/* Panel chrome */}
              <View style={styles.panelHeader}>
                <View style={styles.panelDots}>
                  <View style={[styles.panelDot, { backgroundColor: C.accent }]} />
                  <View style={[styles.panelDot, { backgroundColor: C.accentGold }]} />
                  <View style={[styles.panelDot, { backgroundColor: C.accentBlue }]} />
                </View>
                <Text style={styles.panelTitle}>CREATE ACCOUNT</Text>
              </View>

              {/* Fields */}
              {[
                {
                  key: "username",
                  label: "▸ USERNAME",
                  placeholder: "MangaReader42",
                  icon: "✦",
                  value: username,
                  onChange: setUsername,
                  secure: false,
                  keyboardType: "default",
                  error: null,
                },
                {
                  key: "email",
                  label: "▸ EMAIL",
                  placeholder: "reader@vault.com",
                  icon: "@",
                  value: email,
                  onChange: setEmail,
                  secure: false,
                  keyboardType: "email-address",
                  error: null,
                },
                {
                  key: "password",
                  label: "▸ PASSWORD",
                  placeholder: "Min. 6 characters",
                  icon: "⬛",
                  value: password,
                  onChange: setPassword,
                  secure: true,
                  keyboardType: "default",
                  error: passwordTooShort ? "⚠ Too short — min 6 characters" : null,
                },
                {
                  key: "confirm",
                  label: "▸ CONFIRM PASSWORD",
                  placeholder: "Repeat password",
                  icon: "⬛",
                  value: confirmPassword,
                  onChange: setConfirmPassword,
                  secure: true,
                  keyboardType: "default",
                  error: passwordMismatch ? "✗ Passwords don't match" : null,
                },
              ].map((field) => (
                <View key={field.key} style={styles.fieldGroup}>
                  <Text style={styles.label}>{field.label}</Text>
                  <View style={[
                    styles.inputWrap,
                    focusedField === field.key && styles.inputWrapFocused,
                    field.error && styles.inputWrapError,
                  ]}>
                    <Text style={styles.inputIcon}>{field.icon}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={field.placeholder}
                      placeholderTextColor={C.textDim}
                      value={field.value}
                      onChangeText={field.onChange}
                      secureTextEntry={field.secure}
                      keyboardType={field.keyboardType}
                      autoCapitalize="none"
                      onFocus={() => setFocusedField(field.key)}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                  {field.error && (
                    <Text style={styles.errorText}>{field.error}</Text>
                  )}
                </View>
              ))}

              {/* Submit */}
              <TouchableOpacity
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handleRegister}
                activeOpacity={1}
                style={{ marginTop: 8 }}
              >
                <Animated.View style={[styles.registerBtn, { transform: [{ scale: pressAnim }] }]}>
                  <Text style={styles.registerBtnArrow}>{loading ? "⟳" : "✦"}</Text>
                  <Text style={styles.registerBtnText}>
                    {loading ? "CREATING ACCOUNT..." : "JOIN NOW"}
                  </Text>
                </Animated.View>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Login link */}
          <View style={styles.loginRow}>
            <View style={styles.loginDivider} />
            <View style={styles.loginRowInner}>
              <Text style={styles.loginPrompt}>Already a member?</Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.loginLink}>SIGN IN →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.loginDivider} />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },

  sideBarLeft: {
    position: "absolute", top: 0, left: 0,
    width: 4, height: "100%", backgroundColor: C.accentGold, zIndex: 10,
  },
  sideBarRight: {
    position: "absolute", top: 0, right: 0,
    width: 4, height: "100%", backgroundColor: C.accent, zIndex: 10,
  },

  container: {
    flexGrow: 1,
    backgroundColor: "transparent",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 48,
    paddingHorizontal: 22,
  },

  // Header
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backBtn: {
    paddingVertical: 6,
    paddingRight: 12,
    borderRightWidth: 2,
    borderRightColor: C.border,
  },
  backBtnText: {
    fontSize: 11, color: C.textMuted, fontWeight: "900", letterSpacing: 2,
  },
  headerRight: {},
  headerChapter: {
    fontSize: 9, color: C.accent, fontWeight: "900", letterSpacing: 4,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.accent,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 2,
  },

  // Hero
  heroBanner: {
    width: "100%",
    backgroundColor: C.surface,
    borderWidth: 2,
    borderColor: C.border,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 16,
  },
  heroBannerAccent: { height: 3, backgroundColor: C.accentGold },
  heroBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  heroIconBox: {
    width: 54, height: 54,
    backgroundColor: C.accentGold,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.white,
  },
  heroIcon: { fontSize: 28 },
  heroTextWrap: { flex: 1, gap: 2 },
  heroOverline: {
    fontSize: 8, color: C.accent, fontWeight: "900", letterSpacing: 4,
  },
  heroTitle: {
    fontSize: 20, fontWeight: "900", color: C.white,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  heroSub: { fontSize: 12, color: C.textMuted },

  // Perks
  perksRow: {
    flexDirection: "row",
    width: "100%",
    gap: 8,
    marginBottom: 20,
  },
  perkItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: C.surface,
    borderWidth: 2,
    borderColor: C.border,
    borderRadius: 2,
    paddingVertical: 12,
    paddingHorizontal: 6,
    gap: 3,
  },
  perkIcon: { fontSize: 22, marginBottom: 2 },
  perkLabel: {
    fontSize: 9, color: C.accentGold, fontWeight: "900", letterSpacing: 2,
  },
  perkSub: { fontSize: 9, color: C.textMuted, textAlign: "center" },

  // Card
  card: {
    width: "100%",
    backgroundColor: C.surface,
    borderWidth: 2.5,
    borderColor: C.white,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: C.accentGold,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 10,
  },
  cardTopBar: { flexDirection: "row", height: 5 },
  cardTopSeg: {},
  cardBody: { padding: 20 },

  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  panelDots: { flexDirection: "row", gap: 6 },
  panelDot: { width: 10, height: 10, borderRadius: 5 },
  panelTitle: { fontSize: 9, fontWeight: "900", color: C.textMuted, letterSpacing: 3 },

  // Fields
  fieldGroup: { marginBottom: 14 },
  label: {
    fontSize: 9, fontWeight: "900", color: C.accent,
    letterSpacing: 3, marginBottom: 7,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.panel,
    borderWidth: 2,
    borderColor: C.border,
    borderRadius: 2,
    paddingHorizontal: 12,
  },
  inputWrapFocused: { borderColor: C.accentGold },
  inputWrapError: { borderColor: C.accent },
  inputIcon: { fontSize: 12, color: C.textMuted, marginRight: 8, fontWeight: "900" },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: C.text,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 10, color: C.accent, fontWeight: "700",
    marginTop: 5, letterSpacing: 0.5,
  },

  // Register button
  registerBtn: {
    backgroundColor: C.accentGold,
    borderRadius: 2,
    borderWidth: 3,
    borderColor: C.white,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  registerBtnArrow: { fontSize: 16, color: C.ink, fontWeight: "900" },
  registerBtnText: {
    color: C.ink, fontSize: 15, fontWeight: "900", letterSpacing: 2,
  },

  // Login link
  loginRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loginDivider: { flex: 1, height: 1, backgroundColor: C.border },
  loginRowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.surface,
    borderWidth: 2,
    borderColor: C.border,
    borderRadius: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loginPrompt: { fontSize: 12, color: C.textMuted },
  loginLink: {
    fontSize: 11, color: C.accentGold, fontWeight: "900", letterSpacing: 1,
  },
});