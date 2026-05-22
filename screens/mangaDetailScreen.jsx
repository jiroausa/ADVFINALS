

import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Image, ActivityIndicator, TextInput, Platform, StatusBar,
  KeyboardAvoidingView, Animated, Alert, Modal, Pressable,
} from "react-native";
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";

const C = {
  bg: "#0A0A0A", surface: "#141414", surface2: "#1A1A1A",
  border: "#252525", borderBright: "#333333",
  accent: "#E8272F", accentGold: "#F5C518", accentBlue: "#2B7FE8",
  text: "#F0EDE8", textMuted: "#666666", textDim: "#3A3A3A",
  white: "#FFFFFF", panel: "#1A1A1A",
  overlay: "rgba(0,0,0,0.82)",
};

const RATING_LABELS = ["", "Did not like it", "It was ok", "Liked it", "Really liked it", "It was amazing"];

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars({ rating, onSelect, size = 28, interactive = false }) {
  const [hover, setHover] = useState(0);
  const display = interactive ? (hover || rating) : rating;
  return (
    <View style={{ flexDirection: "row", gap: interactive ? 6 : 3 }}>
      {[1,2,3,4,5].map((s) => (
        <TouchableOpacity key={s}
          onPress={() => interactive && onSelect?.(s)}
          onPressIn={() => interactive && setHover(s)}
          onPressOut={() => interactive && setHover(0)}
          disabled={!interactive} activeOpacity={interactive ? 0.6 : 1}
        >
          <Text style={{ fontSize: size, color: s <= display ? C.accentGold : C.borderBright }}>
            {s <= display ? "★" : "☆"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Cover ────────────────────────────────────────────────────────────────────
function Cover({ uri, title }) {
  const [err, setErr] = useState(false);
  const [ok, setOk] = useState(false);
  return (
    <View style={s.coverWrap}>
      {!ok && !err && <ActivityIndicator color={C.accentGold} size="small" style={StyleSheet.absoluteFill} />}
      {err ? (
        <View style={s.coverFallback}>
          <Text style={{ fontSize: 48 }}>📖</Text>
          <Text style={s.coverFallbackText}>{title}</Text>
        </View>
      ) : (
        <Image source={{ uri }} style={[s.cover, !ok && { opacity: 0 }]}
          resizeMode="cover" onLoad={() => setOk(true)} onError={() => setErr(true)} />
      )}
    </View>
  );
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────
// Slide-up sheet that lets the user log in or register without leaving the page.
function AuthModal({ visible, onClose, onSuccess, triggerLabel = "rate & comment" }) {
  const [tab, setTab] = useState("login"); // "login" | "register"
  const slideAnim = useRef(new Animated.Value(500)).current;

  // Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (visible) {
      setError(""); setEmail(""); setPassword(""); setUsername(""); setConfirmPw("");
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 180 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 500, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible]);

  function switchTab(t) { setTab(t); setError(""); }

  async function handleLogin() {
    setError("");
    if (!email.trim() || !password) { setError("Enter your email and password."); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      onSuccess?.();
    } catch (e) {
      switch (e.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("Incorrect email or password."); break;
        case "auth/invalid-email":
          setError("Enter a valid email address."); break;
        case "auth/too-many-requests":
          setError("Too many attempts. Try again later."); break;
        default: setError(e.message);
      }
    } finally { setLoading(false); }
  }

  async function handleRegister() {
    setError("");
    if (!username.trim() || !email.trim() || !password) { setError("All fields are required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPw) { setError("Passwords don't match."); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: username.trim() });
      onSuccess?.();
    } catch (e) {
      if (e.code === "auth/email-already-in-use") setError("An account with that email already exists.");
      else setError(e.message);
    } finally { setLoading(false); }
  }

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Dimmed backdrop */}
        <Pressable style={s.modalBackdrop} onPress={onClose} />

        {/* Sheet */}
        <Animated.View style={[s.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle bar */}
          <View style={s.sheetHandle} />

          {/* Header */}
          <View style={s.sheetHeader}>
            <View>
              <Text style={s.sheetTitle}>
                MANGA<Text style={{ color: C.accent }}>VAULT</Text>
              </Text>
              <Text style={s.sheetSubtitle}>Sign in to {triggerLabel}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={s.sheetCloseBtn}>
              <Text style={s.sheetCloseBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tab switcher */}
          <View style={s.tabRow}>
            <TouchableOpacity
              style={[s.tab, tab === "login" && s.tabActive]}
              onPress={() => switchTab("login")}
            >
              <Text style={[s.tabText, tab === "login" && s.tabTextActive]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.tab, tab === "register" && s.tabActive]}
              onPress={() => switchTab("register")}
            >
              <Text style={[s.tabText, tab === "register" && s.tabTextActive]}>Create Account</Text>
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>⚠ {error}</Text>
            </View>
          ) : null}

          {/* Login form */}
          {tab === "login" && (
            <View style={s.formFields}>
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>EMAIL</Text>
                <TextInput
                  style={s.fieldInput}
                  placeholder="your@email.com"
                  placeholderTextColor={C.textDim}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(""); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>PASSWORD</Text>
                <TextInput
                  style={s.fieldInput}
                  placeholder="••••••••"
                  placeholderTextColor={C.textDim}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(""); }}
                  secureTextEntry
                  autoCapitalize="none"
                  onSubmitEditing={handleLogin}
                />
              </View>
              <TouchableOpacity
                style={[s.submitBtn, loading && s.submitBtnDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={s.submitBtnText}>{loading ? "Signing in…" : "Sign In"}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Register form */}
          {tab === "register" && (
            <View style={s.formFields}>
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>USERNAME</Text>
                <TextInput
                  style={s.fieldInput}
                  placeholder="MangaReader42"
                  placeholderTextColor={C.textDim}
                  value={username}
                  onChangeText={(t) => { setUsername(t); setError(""); }}
                  autoCapitalize="none"
                />
              </View>
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>EMAIL</Text>
                <TextInput
                  style={s.fieldInput}
                  placeholder="your@email.com"
                  placeholderTextColor={C.textDim}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(""); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>PASSWORD</Text>
                <TextInput
                  style={s.fieldInput}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={C.textDim}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(""); }}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>CONFIRM PASSWORD</Text>
                <TextInput
                  style={s.fieldInput}
                  placeholder="Repeat password"
                  placeholderTextColor={C.textDim}
                  value={confirmPw}
                  onChangeText={(t) => { setConfirmPw(t); setError(""); }}
                  secureTextEntry
                  autoCapitalize="none"
                  onSubmitEditing={handleRegister}
                />
              </View>
              <TouchableOpacity
                style={[s.submitBtn, loading && s.submitBtnDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={s.submitBtnText}>{loading ? "Creating account…" : "Create Account"}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 20 }} />
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MangaDetailScreen({ route, navigation }) {
  const { mangaId } = route.params;
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const userId = currentUser?.uid;
  const userName = currentUser?.displayName || currentUser?.email?.split("@")[0] || "Reader";

  const [manga, setManga] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myRating, setMyRating] = useState(0);
  const [pendingRating, setPendingRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showAllComments, setShowAllComments] = useState(false);

  // Auth modal state
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authTriggerLabel, setAuthTriggerLabel] = useState("rate & comment");
  // After login succeeds inside the modal, replay the intended action
  const [pendingAction, setPendingAction] = useState(null); // "rate" | "comment"

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);

  // Keep currentUser in sync when auth state changes (e.g. after modal login)
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "manga_reviews", mangaId), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setManga(data);
        if (userId) {
          const r = data.userRatings?.[userId] || 0;
          setMyRating(r); setPendingRating(r);
        }
      }
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    });
    return unsub;
  }, [mangaId, userId]);

  function openAuthModal(action, label) {
    setPendingAction(action);
    setAuthTriggerLabel(label);
    setAuthModalVisible(true);
  }

  function handleAuthSuccess() {
    setAuthModalVisible(false);
    // pendingAction will be handled naturally because currentUser re-renders the UI
  }

  if (loading) return (
    <View style={[s.screen, { alignItems: "center", justifyContent: "center" }]}>
      <ActivityIndicator color={C.accent} size="large" />
    </View>
  );
  if (!manga) return (
    <View style={[s.screen, { alignItems: "center", justifyContent: "center", gap: 12 }]}>
      <Text style={{ color: C.textMuted, fontSize: 16 }}>Manga not found.</Text>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={{ color: C.accent, fontWeight: "700" }}>← Go back</Text>
      </TouchableOpacity>
    </View>
  );

  const userRatings = manga.userRatings || {};
  const ratingVals = Object.values(userRatings);
  const totalRatings = ratingVals.length;
  const avgRating = totalRatings > 0 ? ratingVals.reduce((a, b) => a + b, 0) / totalRatings : 0;
  const breakdown = [5,4,3,2,1].map((star) => ({
    star, count: ratingVals.filter((v) => v === star).length,
  }));

  const allComments = [...(manga.comments || [])].reverse();
  const comments = showAllComments ? allComments : allComments.slice(0, 5);

  async function submitRating(star) {
    if (!currentUser) {
      openAuthModal("rate", "rate this manga");
      return;
    }
    setPendingRating(star);
    setSubmittingRating(true);
    try {
      await updateDoc(doc(db, "manga_reviews", mangaId), { [`userRatings.${userId}`]: star });
      setMyRating(star);
      setRatingDone(true);
      setTimeout(() => setRatingDone(false), 2500);
    } catch (e) {
      const msg = e.message || "Failed to save rating.";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert("Error", msg);
    } finally {
      setSubmittingRating(false);
    }
  }

  async function submitComment() {
    if (!currentUser || !commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const comment = {
        id: `${userId}_${Date.now()}`,
        text: commentText.trim(),
        authorId: userId,
        authorName: userName,
        createdAt: Date.now(),
      };
      await updateDoc(doc(db, "manga_reviews", mangaId), { comments: arrayUnion(comment) });
      setCommentText("");
    } catch (e) {
      const msg = e.message || "Failed to post comment.";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert("Error", msg);
    } finally {
      setSubmittingComment(false);
    }
  }

  async function deleteComment(comment) {
    setDeletingId(comment.id);
    try {
      await updateDoc(doc(db, "manga_reviews", mangaId), { comments: arrayRemove(comment) });
    } catch (e) {
      const msg = e.message || "Failed to delete comment.";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert("Error", msg);
    } finally {
      setDeletingId(null);
    }
  }

  const statusColor = manga.status === "Finished" ? "#4CAF50" : manga.status === "Publishing" ? "#4A90E2" : "#E2A04A";
  const statusBg = manga.status === "Finished" ? "#0d2b0d" : manga.status === "Publishing" ? "#0a1628" : "#2a1a05";

  return (
    <View style={s.screen}>
      <StatusBar barStyle="light-content" backgroundColor={C.surface} />

      {/* Auth modal — slides up without leaving the page */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        onSuccess={handleAuthSuccess}
        triggerLabel={authTriggerLabel}
      />

      {/* Nav */}
      <View style={s.nav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={s.navTitle} numberOfLines={1}>{manga.mangaTitle}</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Animated.ScrollView
          ref={scrollRef}
          style={{ opacity: fadeAnim }}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Hero ── */}
          <View style={s.hero}>
            <Cover uri={manga.coverUrl} title={manga.mangaTitle} />
            <View style={s.heroInfo}>
              <Text style={s.heroTitle}>{manga.mangaTitle}</Text>
              {manga.author ? <Text style={s.heroAuthor}>by {manga.author}</Text> : null}

              <View style={s.communityRating}>
                <Stars rating={Math.round(avgRating)} size={16} />
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 5, marginTop: 3 }}>
                  <Text style={s.avgNum}>{avgRating > 0 ? avgRating.toFixed(2) : "—"}</Text>
                  <Text style={s.avgSub}>{totalRatings > 0 ? `${totalRatings} rating${totalRatings !== 1 ? "s" : ""}` : "No ratings yet"}</Text>
                </View>
              </View>

              {manga.genre?.length > 0 && (
                <View style={s.genreRow}>
                  {manga.genre.map((g) => (
                    <View key={g} style={s.genreChip}>
                      <Text style={s.genreChipText}>{g}</Text>
                    </View>
                  ))}
                </View>
              )}

              {manga.status ? (
                <View style={[s.statusBadge, { backgroundColor: statusBg }]}>
                  <Text style={[s.statusBadgeText, { color: statusColor }]}>
                    {manga.status === "Publishing" ? "● " : manga.status === "Finished" ? "✓ " : "⏸ "}
                    {manga.status}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* ── Details grid ── */}
          {(manga.volumes || manga.chapters || manga.published || manga.serialization) ? (
            <View style={s.detailsGrid}>
              {[
                { label: "Author", value: manga.author },
                { label: "Published", value: manga.published },
                { label: "Volumes", value: manga.volumes },
                { label: "Chapters", value: manga.chapters },
                { label: "Serialization", value: manga.serialization },
                { label: "Status", value: manga.status },
              ].filter((d) => d.value).map((d) => (
                <View key={d.label} style={s.detailItem}>
                  <Text style={s.detailLabel}>{d.label}</Text>
                  <Text style={s.detailValue}>{d.value}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* ── About ── */}
          {manga.synopsis ? (
            <View style={s.section}>
              <Text style={s.sectionTitle}>About</Text>
              <View style={s.divider} />
              <Text style={s.synopsisText}>{manga.synopsis}</Text>
            </View>
          ) : null}

          {/* ── Community Reviews ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Community Reviews</Text>
            <View style={s.divider} />
            <View style={s.reviewSummary}>
              <View style={s.reviewSummaryLeft}>
                <Text style={s.bigAvg}>{avgRating > 0 ? avgRating.toFixed(2) : "—"}</Text>
                <Stars rating={Math.round(avgRating)} size={18} />
                {totalRatings > 0 && <Text style={s.totalRatingsText}>{totalRatings} ratings</Text>}
              </View>
              <View style={s.breakdownWrap}>
                {breakdown.map(({ star, count }) => {
                  const pct = totalRatings > 0 ? count / totalRatings : 0;
                  return (
                    <View key={star} style={s.breakdownRow}>
                      <Text style={s.breakdownLabel}>{star}★</Text>
                      <View style={s.breakdownBg}>
                        <View style={[s.breakdownFill, { width: `${Math.round(pct * 100)}%` }]} />
                      </View>
                      <Text style={s.breakdownCount}>{count}</Text>
                    </View>
                  );
                })}
                {totalRatings === 0 && <Text style={{ color: C.textMuted, fontSize: 12 }}>No ratings yet</Text>}
              </View>
            </View>
          </View>

          {/* ── Rate this Manga ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Rate this Manga</Text>
            <View style={s.divider} />

            {currentUser ? (
              <View style={s.rateBox}>
                <Text style={s.rateLabel}>
                  {myRating > 0 ? `Your rating: ${RATING_LABELS[myRating]}` : "Tap a star to rate"}
                </Text>
                <Stars rating={pendingRating} onSelect={submitRating} size={40} interactive />
                {submittingRating && (
                  <ActivityIndicator color={C.accentGold} size="small" style={{ marginTop: 6 }} />
                )}
                {ratingDone && (
                  <View style={s.ratingSuccessBadge}>
                    <Text style={s.ratingSuccessText}>✓ Rating saved!</Text>
                  </View>
                )}
                {myRating > 0 && !submittingRating && !ratingDone && (
                  <Text style={s.changeRatingHint}>Tap a star to change your rating</Text>
                )}
              </View>
            ) : (
              /* Guest: show ghost stars that trigger the auth modal on tap */
              <View style={s.rateBox}>
                <Text style={s.rateLabel}>How would you rate this?</Text>
                <TouchableOpacity
                  onPress={() => openAuthModal("rate", "rate this manga")}
                  activeOpacity={0.75}
                  style={{ alignSelf: "flex-start" }}
                >
                  <Stars rating={0} size={40} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.guestRateHint}
                  onPress={() => openAuthModal("rate", "rate this manga")}
                >
                  <Text style={s.guestRateHintText}>🔒  Sign in to leave your rating</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ── Comments ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              Comments {allComments.length > 0 ? `(${allComments.length})` : ""}
            </Text>
            <View style={s.divider} />

            {currentUser ? (
              <View style={s.commentInputWrap}>
                <View style={s.commentAvatar}>
                  <Text style={s.commentAvatarText}>{userName[0]?.toUpperCase()}</Text>
                </View>
                <View style={s.commentInputRight}>
                  <TextInput
                    style={s.commentInput}
                    placeholder="Share your thoughts..."
                    placeholderTextColor={C.textDim}
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline maxLength={500}
                  />
                  <View style={s.commentInputFooter}>
                    <Text style={s.charCount}>{commentText.length}/500</Text>
                    <TouchableOpacity
                      style={[s.postBtn, (!commentText.trim() || submittingComment) && s.postBtnDisabled]}
                      onPress={submitComment}
                      disabled={!commentText.trim() || submittingComment}
                    >
                      {submittingComment
                        ? <ActivityIndicator color={C.white} size="small" />
                        : <Text style={s.postBtnText}>Post</Text>
                      }
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              /* Guest: tappable placeholder comment box */
              <TouchableOpacity
                style={s.guestCommentBox}
                onPress={() => openAuthModal("comment", "leave a comment")}
                activeOpacity={0.8}
              >
                <View style={s.guestCommentAvatarPlaceholder}>
                  <Text style={{ fontSize: 16 }}>?</Text>
                </View>
                <View style={s.guestCommentInputFake}>
                  <Text style={s.guestCommentPlaceholder}>Share your thoughts…</Text>
                </View>
                <View style={s.guestPostBtnFake}>
                  <Text style={s.guestPostBtnFakeText}>🔒</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Comment list — always visible to everyone */}
            {allComments.length === 0 ? (
              <View style={s.noComments}>
                <Text style={{ fontSize: 30 }}>💬</Text>
                <Text style={s.noCommentsText}>No comments yet. Be the first!</Text>
              </View>
            ) : (
              <>
                {comments.map((c) => {
                  const isOwn = userId === c.authorId;
                  return (
                    <View key={c.id} style={s.commentItem}>
                      <View style={[s.commentBubble, { backgroundColor: isOwn ? "#1a1200" : C.surface2 }]}>
                        <View style={s.commentBubbleHeader}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <View style={[s.miniAvatar, { backgroundColor: isOwn ? C.accentGold : C.borderBright }]}>
                              <Text style={[s.miniAvatarText, { color: isOwn ? C.bg : C.textMuted }]}>
                                {c.authorName?.[0]?.toUpperCase() || "?"}
                              </Text>
                            </View>
                            <View>
                              <Text style={[s.commentAuthor, isOwn && { color: C.accentGold }]}>
                                {c.authorName}{isOwn ? " (you)" : ""}
                              </Text>
                              <Text style={s.commentDate}>
                                {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </Text>
                            </View>
                          </View>
                          {isOwn && (
                            <TouchableOpacity
                              onPress={() => {
                                const doDelete = () => deleteComment(c);
                                if (Platform.OS === "web") {
                                  if (window.confirm("Delete this comment?")) doDelete();
                                } else {
                                  Alert.alert("Delete comment?", "This cannot be undone.", [
                                    { text: "Cancel", style: "cancel" },
                                    { text: "Delete", style: "destructive", onPress: doDelete },
                                  ]);
                                }
                              }}
                              disabled={deletingId === c.id}
                              style={s.deleteBtn}
                            >
                              {deletingId === c.id
                                ? <ActivityIndicator size="small" color={C.accent} />
                                : <Text style={s.deleteBtnText}>Delete</Text>
                              }
                            </TouchableOpacity>
                          )}
                        </View>
                        <Text style={s.commentText}>{c.text}</Text>
                      </View>
                    </View>
                  );
                })}
                {allComments.length > 5 && (
                  <TouchableOpacity style={s.showMoreBtn} onPress={() => setShowAllComments(!showAllComments)}>
                    <Text style={s.showMoreText}>
                      {showAllComments ? "Show less" : `Show all ${allComments.length} comments`}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          <View style={{ height: 48 }} />
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  nav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: Platform.OS === "ios" ? 54 : 36, paddingBottom: 12,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { width: 60 },
  backBtnText: { fontSize: 17, color: C.accent, fontWeight: "700" },
  navTitle: { flex: 1, textAlign: "center", fontSize: 13, fontWeight: "900", color: C.white, letterSpacing: 0.5 },

  scroll: { paddingBottom: 40 },

  // Hero
  hero: {
    flexDirection: "row", gap: 16, padding: 20,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  coverWrap: {
    width: 110, height: 165, borderRadius: 8, overflow: "hidden", flexShrink: 0,
    backgroundColor: C.panel, borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOffset: { width: 4, height: 8 }, shadowOpacity: 0.7, shadowRadius: 12, elevation: 14,
  },
  cover: { width: "100%", height: "100%" },
  coverFallback: { flex: 1, alignItems: "center", justifyContent: "center", padding: 8 },
  coverFallbackText: { fontSize: 9, color: C.textMuted, textAlign: "center", marginTop: 4 },

  heroInfo: { flex: 1, gap: 8 },
  heroTitle: {
    fontSize: 18, fontWeight: "900", color: C.white, lineHeight: 24,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  heroAuthor: { fontSize: 13, color: C.accentGold, fontWeight: "600" },
  communityRating: { gap: 1 },
  avgNum: { fontSize: 22, fontWeight: "900", color: C.accentGold },
  avgSub: { fontSize: 11, color: C.textMuted },
  genreRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  genreChip: {
    backgroundColor: C.surface2, borderWidth: 1, borderColor: C.borderBright,
    borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3,
  },
  genreChipText: { fontSize: 10, color: C.textMuted, fontWeight: "700" },
  statusBadge: { alignSelf: "flex-start", borderRadius: 5, paddingHorizontal: 9, paddingVertical: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: "800" },

  // Details grid
  detailsGrid: {
    flexDirection: "row", flexWrap: "wrap",
    backgroundColor: C.surface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  detailItem: { width: "50%", paddingVertical: 7, paddingRight: 10 },
  detailLabel: { fontSize: 9, color: C.textMuted, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 },
  detailValue: { fontSize: 13, color: C.text, fontWeight: "600" },

  // Sections
  section: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: C.white, letterSpacing: 0.3, fontFamily: Platform.OS === "ios" ? "Georgia" : "serif" },
  divider: { height: 1, backgroundColor: C.border, marginTop: 10, marginBottom: 16 },
  synopsisText: { fontSize: 14, color: C.text, lineHeight: 23 },

  // Community reviews
  reviewSummary: { flexDirection: "row", gap: 16, alignItems: "flex-start" },
  reviewSummaryLeft: { alignItems: "center", gap: 5, minWidth: 70 },
  bigAvg: { fontSize: 36, fontWeight: "900", color: C.accentGold, lineHeight: 42 },
  totalRatingsText: { fontSize: 10, color: C.textMuted, textAlign: "center" },
  breakdownWrap: { flex: 1, gap: 7 },
  breakdownRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  breakdownLabel: { width: 24, fontSize: 11, color: C.accentGold, fontWeight: "700" },
  breakdownBg: { flex: 1, height: 8, backgroundColor: C.surface2, borderRadius: 4, overflow: "hidden" },
  breakdownFill: { height: "100%", backgroundColor: C.accentGold, borderRadius: 4 },
  breakdownCount: { width: 24, fontSize: 10, color: C.textMuted, textAlign: "right" },

  // Rate box
  rateBox: { gap: 10 },
  rateLabel: { fontSize: 14, color: C.text, fontWeight: "600" },
  ratingSuccessBadge: {
    alignSelf: "flex-start", backgroundColor: "#0d2b0d",
    borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6,
  },
  ratingSuccessText: { color: "#4CAF50", fontWeight: "900", fontSize: 13 },
  changeRatingHint: { fontSize: 11, color: C.textMuted, marginTop: -4 },

  // Guest rate hint
  guestRateHint: {
    backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border,
    borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14,
    alignSelf: "flex-start",
  },
  guestRateHintText: { fontSize: 13, color: C.accentGold, fontWeight: "700" },

  // Guest comment box
  guestCommentBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.surface2, borderWidth: 1, borderColor: C.borderBright,
    borderRadius: 10, padding: 12, marginBottom: 20,
    opacity: 0.85,
  },
  guestCommentAvatarPlaceholder: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.borderBright, alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  guestCommentInputFake: {
    flex: 1, backgroundColor: C.panel, borderWidth: 1, borderColor: C.border,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44,
    justifyContent: "center",
  },
  guestCommentPlaceholder: { fontSize: 14, color: C.textDim },
  guestPostBtnFake: {
    backgroundColor: C.surface2, borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 14,
    borderWidth: 1, borderColor: C.border,
  },
  guestPostBtnFakeText: { fontSize: 18 },

  // Comment input (logged in)
  commentInputWrap: { flexDirection: "row", gap: 10, marginBottom: 20 },
  commentAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.accent, alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  commentAvatarText: { fontSize: 16, fontWeight: "900", color: C.white },
  commentInputRight: { flex: 1, gap: 6 },
  commentInput: {
    backgroundColor: C.surface2, borderWidth: 1, borderColor: C.borderBright,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: C.text, minHeight: 72, textAlignVertical: "top",
  },
  commentInputFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  charCount: { fontSize: 11, color: C.textDim },
  postBtn: { backgroundColor: C.accent, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18 },
  postBtnDisabled: { opacity: 0.4 },
  postBtnText: { color: C.white, fontWeight: "900", fontSize: 13 },

  // No comments
  noComments: { paddingVertical: 28, alignItems: "center", gap: 8 },
  noCommentsText: { fontSize: 13, color: C.textMuted },

  // Comment items
  commentItem: { marginBottom: 12 },
  commentBubble: { borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border },
  commentBubbleHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10,
  },
  miniAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  miniAvatarText: { fontSize: 12, fontWeight: "900" },
  commentAuthor: { fontSize: 13, fontWeight: "900", color: C.white },
  commentDate: { fontSize: 10, color: C.textMuted, marginTop: 1 },
  deleteBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  deleteBtnText: { fontSize: 11, color: C.accent, fontWeight: "700" },
  commentText: { fontSize: 14, color: C.text, lineHeight: 21 },

  showMoreBtn: {
    alignItems: "center", paddingVertical: 12,
    borderWidth: 1, borderColor: C.border, borderRadius: 8, marginTop: 4,
  },
  showMoreText: { fontSize: 13, color: C.accentGold, fontWeight: "700" },

  // ── Auth Modal ──────────────────────────────────────────────────────────────
  modalBackdrop: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: C.overlay,
  },
  modalSheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#111111",
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 1, borderColor: C.borderBright,
    paddingHorizontal: 22, paddingTop: 12,
    maxHeight: "92%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 30,
  },
  sheetHandle: {
    alignSelf: "center", width: 40, height: 4,
    backgroundColor: C.border, borderRadius: 2, marginBottom: 18,
  },
  sheetHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 22, fontWeight: "900", color: C.white,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: 1,
  },
  sheetSubtitle: { fontSize: 12, color: C.textMuted, marginTop: 3 },
  sheetCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  sheetCloseBtnText: { fontSize: 13, color: C.textMuted, fontWeight: "700" },

  // Tabs
  tabRow: {
    flexDirection: "row", gap: 0,
    backgroundColor: C.surface2, borderRadius: 8,
    borderWidth: 1, borderColor: C.border,
    marginBottom: 16, overflow: "hidden",
  },
  tab: {
    flex: 1, paddingVertical: 11, alignItems: "center",
  },
  tabActive: {
    backgroundColor: C.accent,
  },
  tabText: { fontSize: 13, fontWeight: "800", color: C.textMuted },
  tabTextActive: { color: C.white },

  // Error
  errorBox: {
    backgroundColor: "#2A0A0A", borderWidth: 1, borderColor: C.accent,
    borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 12,
  },
  errorText: { fontSize: 13, color: C.accent, fontWeight: "600" },

  // Form fields
  formFields: { gap: 12 },
  fieldGroup: { gap: 5 },
  fieldLabel: { fontSize: 10, color: C.textMuted, fontWeight: "900", letterSpacing: 1.5 },
  fieldInput: {
    backgroundColor: C.panel, borderWidth: 1, borderColor: C.border,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: C.text,
  },
  submitBtn: {
    backgroundColor: C.accent, borderRadius: 8,
    paddingVertical: 14, alignItems: "center", marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: C.white, fontWeight: "900", fontSize: 15 },
});