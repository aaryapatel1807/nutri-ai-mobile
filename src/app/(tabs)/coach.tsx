import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { ChatBubble, TypingBubble, type ChatRole } from '@/components/ChatBubble';
import { ScenicBackground } from '@/components/ui/ScenicBackground';
import { apiFetch, ApiError, AuthExpiredError } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/theme/ThemeContext';
import { radii, spacing } from '@/theme/tokens';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  failed?: boolean;
}

interface HistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

interface Targets {
  calorieTarget?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  goal?: 'fat_loss' | 'muscle_gain' | 'maintain' | string;
}

const HISTORY_LIMIT = 10;
const PERSONA = 'nutrition' as const;

const SUGGESTIONS = [
  'What should I eat for lunch?',
  'How much protein do I need?',
  'Is skipping breakfast ok?',
];

const GOAL_LABELS: Record<string, string> = {
  fat_loss: 'Fat loss',
  muscle_gain: 'Muscle gain',
  maintain: 'Maintenance',
};

function forceLogout() {
  void useAuthStore.getState().logout();
  router.replace('/(auth)/login');
}

function TargetTile({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value?: number | null;
  unit: string;
  color: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.glass,
        borderColor: colors.glassBorder,
        borderWidth: 1,
        borderRadius: radii.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xs,
        alignItems: 'center',
        gap: 1,
      }}
    >
      <AppText variant="bodyStrong" color={value != null ? color : colors.faint} numberOfLines={1}>
        {value != null ? `${Number(value).toLocaleString('en-IN')}` : '—'}
      </AppText>
      <AppText variant="caption" numberOfLines={1}>
        {label} · {unit}
      </AppText>
    </View>
  );
}

export default function CoachScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [targets, setTargets] = useState<Targets | null>(null);

  const listRef = useRef<FlatList<ChatMessage>>(null);
  const sendingRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Daily targets strip.
  useEffect(() => {
    let alive = true;
    apiFetch<Targets>('/api/coaching/targets')
      .then((t) => {
        if (alive) setTargets(t);
      })
      .catch((err) => {
        if (err instanceof AuthExpiredError) forceLogout();
        // Otherwise the strip just stays hidden.
      });
    return () => {
      alive = false;
    };
  }, []);

  const scrollToEnd = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, []);

  const postMessage = useCallback(async (text: string, opts?: { echoUser?: boolean }) => {
    const trimmed = text.trim();
    if (!trimmed || sendingRef.current) return;
    const echoUser = opts?.echoUser ?? true;

    sendingRef.current = true;
    setSending(true);
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };
    const history: HistoryItem[] = [...messagesRef.current, userMsg]
      .slice(-HISTORY_LIMIT)
      .map((m) => ({ role: m.role, content: m.content }));
    if (echoUser) setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      const res = await apiFetch<{ response?: string; text?: string }>('/api/ml/chat', {
        method: 'POST',
        body: { message: trimmed, history, user_data: { persona: PERSONA } },
      });
      const reply = (res.response ?? res.text ?? '').trim();
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: reply || 'Sorry, I could not think of a reply just now.',
        },
      ]);
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        forceLogout();
        return;
      }
      // 429 (daily AI limit): show the backend's message verbatim, no retry.
      // Other errors: retryable coach bubble.
      const isRateLimit = err instanceof ApiError && err.status === 429;
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          content: msg,
          failed: !isRateLimit,
        },
      ]);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }, []);

  const send = useCallback(() => {
    void postMessage(input);
  }, [input, postMessage]);

  const retryBubble = useCallback(
    (bubbleId: string) => {
      const prior = messagesRef.current;
      const idx = prior.findIndex((m) => m.id === bubbleId);
      if (idx <= 0) return;
      const lastUser = [...prior.slice(0, idx)].reverse().find((m) => m.role === 'user');
      if (!lastUser) return;
      setMessages((prev) => prev.filter((m) => m.id !== bubbleId));
      void postMessage(lastUser.content, { echoUser: false });
    },
    [postMessage],
  );

  const hasTargets =
    targets != null &&
    (targets.calorieTarget != null ||
      targets.proteinG != null ||
      targets.carbsG != null ||
      targets.fatG != null);

  const isEmpty = messages.length === 0;

  return (
    <ScenicBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 44}
      >
        {/* Header + targets strip */}
        <View
          style={{
            paddingTop: insets.top + spacing.sm,
            paddingHorizontal: spacing.lg,
            gap: spacing.sm,
          }}
        >
          <View>
            <AppText variant="headline">AI Coach</AppText>
            <AppText variant="caption">Ask anything about food, macros and goals.</AppText>
          </View>
          {hasTargets ? (
            <View style={{ gap: 6 }}>
              <AppText variant="label">
                Daily targets{targets?.goal ? ` · ${GOAL_LABELS[targets.goal] ?? targets.goal}` : ''}
              </AppText>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <TargetTile label="Calories" unit="kcal" value={targets?.calorieTarget} color={colors.ink} />
                <TargetTile label="Protein" unit="g" value={targets?.proteinG} color={colors.protein} />
                <TargetTile label="Carbs" unit="g" value={targets?.carbsG} color={colors.carbs} />
                <TargetTile label="Fat" unit="g" value={targets?.fatG} color={colors.fat} />
              </View>
            </View>
          ) : null}
        </View>

        {/* Messages */}
        {isEmpty && !sending ? (
          <View
            style={{
              flex: 1,
              paddingHorizontal: spacing.lg,
              justifyContent: 'center',
              gap: spacing.lg,
            }}
          >
            <View style={{ gap: spacing.sm, alignItems: 'center' }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: radii.pill,
                  backgroundColor: colors.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={30} color={colors.primaryStrong} />
              </View>
              <AppText variant="title" style={{ textAlign: 'center' }}>
                Your nutrition coach is here
              </AppText>
              <AppText variant="body" color={colors.muted} style={{ textAlign: 'center' }}>
                Get meal ideas, macro advice and honest answers — powered by your own daily targets.
              </AppText>
            </View>
            <View style={{ gap: spacing.sm }}>
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => postMessage(s)}
                  accessibilityRole="button"
                  accessibilityLabel={s}
                  style={({ pressed }) => ({
                    backgroundColor: colors.glass,
                    borderColor: colors.glassBorder,
                    borderWidth: 1,
                    borderRadius: radii.pill,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <AppText variant="body" color={colors.ink} style={{ textAlign: 'center' }}>
                    {s}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => (
              <ChatBubble
                role={item.role}
                content={item.content}
                failed={item.failed}
                onRetry={item.failed ? () => retryBubble(item.id) : undefined}
              />
            )}
            contentContainerStyle={{
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.md,
              paddingBottom: spacing.md,
              gap: spacing.sm,
            }}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={scrollToEnd}
            onLayout={scrollToEnd}
            ListFooterComponent={
              sending ? (
                <View style={{ marginTop: spacing.sm }}>
                  <TypingBubble />
                </View>
              ) : null
            }
          />
        )}

        {/* Composer */}
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: 108,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              backgroundColor: colors.input,
              borderColor: colors.inputBorder,
              borderWidth: 1,
              borderRadius: radii.pill,
              paddingLeft: spacing.lg,
              paddingRight: 6,
              paddingVertical: 6,
            }}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask your coach…"
              placeholderTextColor={colors.faint}
              returnKeyType="send"
              onSubmitEditing={send}
              editable={!sending}
              maxLength={4000}
              style={{
                flex: 1,
                fontFamily: 'Inter_400Regular',
                fontSize: 15,
                color: colors.ink,
                minHeight: 36,
              }}
            />
            <Pressable
              onPress={send}
              disabled={sending || !input.trim()}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: radii.pill,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: sending || !input.trim() ? 0.45 : pressed ? 0.85 : 1,
              })}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScenicBackground>
  );
}
