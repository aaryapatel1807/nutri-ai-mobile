import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { ScanResultSheet, type DetectedFood } from '@/components/ScanResultSheet';
import { apiFetch, apiUpload, ApiError, AuthExpiredError } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { colors, radii, spacing } from '@/theme/tokens';

type Mode = 'scan' | 'barcode' | 'library';

const MODES: { id: Mode; label: string; icon: 'scan' | 'barcode-outline' | 'images-outline' }[] = [
  { id: 'scan', label: 'Scan', icon: 'scan' },
  { id: 'barcode', label: 'Barcode', icon: 'barcode-outline' },
  { id: 'library', label: 'Library', icon: 'images-outline' },
];

interface BarcodeProduct {
  code: string;
  name: string;
  brand: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string | null;
  image: string | null;
}

function guessMealType(): 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' {
  const h = new Date().getHours();
  if (h < 11) return 'Breakfast';
  if (h < 15) return 'Lunch';
  if (h < 21) return 'Dinner';
  return 'Snack';
}

function handleAuthExpired() {
  useAuthStore.getState().logout().catch(() => {});
  router.replace('/(auth)/login');
}

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e'] as const;

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<Mode>('scan');
  const [focused, setFocused] = useState(true);

  const cameraRef = useRef<CameraView>(null);
  const scanY = useSharedValue(0);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorRetry, setErrorRetry] = useState<(() => void) | null>(null);

  const [foods, setFoods] = useState<DetectedFood[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [logging, setLogging] = useState(false);
  const [logged, setLogged] = useState(false);

  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productLogged, setProductLogged] = useState(false);
  const [productLogging, setProductLogging] = useState(false);
  const lastScannedAt = useRef(0);
  const lastScannedCode = useRef('');

  const resetResults = useCallback(() => {
    setFoods([]);
    setTotalCalories(0);
    setLogged(false);
    setLogging(false);
    setProduct(null);
    setProductError(null);
    setProductLogged(false);
    setProductLogging(false);
    setError(null);
    setErrorRetry(null);
  }, []);

  // Only run the camera while this tab is focused.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => {
        setFocused(false);
        resetResults();
      };
    }, [resetResults]),
  );

  useEffect(() => {
    scanY.value = withRepeat(withTiming(1, { duration: 2200 }), -1, true);
  }, [scanY]);

  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value * 190 }],
    opacity: 0.9,
  }));

  const showError = useCallback((message: string, retry?: () => void) => {
    setError(message);
    setErrorRetry(retry ? () => retry : null);
  }, []);

  const showAuthExpired = useCallback(() => {
    handleAuthExpired();
  }, []);

  /**
   * Stable indirection for retry closures. The action callbacks below pass
   * themselves as "try again" handlers, which the React compiler flags as
   * use-before-declaration inside their own useCallback initializers;
   * going through this ref keeps the closures valid and fresh.
   */
  const retryFns = useRef({
    detectFood: async (_uri: string) => {},
    capture: async () => {},
    pickFromLibrary: async () => {},
    logDetectedMeal: async () => {},
    logBarcode: async () => {},
  });

  /** POST the photo to the food-detection endpoint and open the result sheet. */
  const detectFood = useCallback(
    async (uri: string) => {
      setUploading(true);
      setError(null);
      setErrorRetry(null);
      try {
        const res = await apiUpload<{ foods: DetectedFood[]; total_calories: number }>(
          '/api/ml/detect-food',
          uri,
        );
        if (!res.foods || res.foods.length === 0) {
          showError('Could not detect any food in that photo. Try a closer shot in good light.', () => {
            void retryFns.current.detectFood(uri);
          });
          return;
        }
        setFoods(res.foods);
        setTotalCalories(res.total_calories ?? 0);
        setLogged(false);
      } catch (err) {
        if (err instanceof AuthExpiredError) return showAuthExpired();
        if (err instanceof ApiError)
          return showError(err.message, () => {
            void retryFns.current.detectFood(uri);
          });
        showError('Something went wrong. Please try again.', () => {
          void retryFns.current.detectFood(uri);
        });
      } finally {
        setUploading(false);
      }
    },
    [showAuthExpired, showError],
  );

  const capture = useCallback(async () => {
    if (!cameraRef.current || uploading) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) {
        setMode('scan');
        resetResults();
        await detectFood(photo.uri);
      }
    } catch {
      showError('Could not take a photo. Please try again.', () => {
        void retryFns.current.capture();
      });
    }
  }, [detectFood, resetResults, showError, uploading]);

  const pickFromLibrary = useCallback(async () => {
    setError(null);
    setErrorRetry(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset?.uri) {
        showError('Could not read that image. Please try another.');
        return;
      }
      resetResults();
      await detectFood(asset.uri);
    } catch {
      showError('Could not open your photo library. Please try again.', () => {
        void retryFns.current.pickFromLibrary();
      });
    }
  }, [detectFood, resetResults, showError]);

  const onModePress = useCallback(
    (next: Mode) => {
      setMode(next);
      resetResults();
      if (next === 'library') pickFromLibrary();
    },
    [pickFromLibrary, resetResults],
  );

  /** Log every detected food as one meal, guessing mealType by time of day. */
  const logDetectedMeal = useCallback(async () => {
    if (logging || logged || foods.length === 0) return;
    setLogging(true);
    setError(null);
    try {
      const mealType = guessMealType();
      const name = foods.map((f) => f.name).join(' + ');
      await apiFetch('/api/meals', {
        method: 'POST',
        body: {
          name,
          calories: Math.round(totalCalories),
          protein: 0,
          carbs: 0,
          fat: 0,
          mealType,
        },
      });
      setLogged(true);
    } catch (err) {
      if (err instanceof AuthExpiredError) return showAuthExpired();
      showError(
        err instanceof ApiError ? err.message : 'Could not log the meal. Please try again.',
        () => {
          void retryFns.current.logDetectedMeal();
        },
      );
    } finally {
      setLogging(false);
    }
  }, [foods, logged, logging, showAuthExpired, showError, totalCalories]);

  const selectFood = useCallback((food: DetectedFood) => {
    router.push({
      pathname: '/food-detail',
      params: {
        name: food.name,
        calories: String(Math.round(food.calories)),
        protein: '0',
        carbs: '0',
        fat: '0',
      },
    });
  }, []);

  /** Barcode scan → debounce → GET /api/barcode/:code. */
  const onBarcodeScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      if (!data || productLoading) return;
      const now = Date.now();
      if (data === lastScannedCode.current && now - lastScannedAt.current < 3000) return;
      lastScannedAt.current = now;
      lastScannedCode.current = data;

      setProductLoading(true);
      setProductError(null);
      setProduct(null);
      setProductLogged(false);

      apiFetch<BarcodeProduct>(`/api/barcode/${encodeURIComponent(data)}`)
        .then((res) => setProduct(res))
        .catch((err) => {
          if (err instanceof AuthExpiredError) return showAuthExpired();
          setProductError(
            err instanceof ApiError ? err.message : 'Could not look up that barcode. Please try again.',
          );
        })
        .finally(() => setProductLoading(false));
    },
    [productLoading, showAuthExpired],
  );

  const logBarcode = useCallback(async () => {
    if (!product || productLogging || productLogged) return;
    setProductLogging(true);
    setError(null);
    try {
      await apiFetch('/api/barcode/log', {
        method: 'POST',
        body: { code: product.code, mealType: guessMealType() },
      });
      setProductLogged(true);
    } catch (err) {
      if (err instanceof AuthExpiredError) return showAuthExpired();
      showError(
        err instanceof ApiError ? err.message : 'Could not log the product. Please try again.',
        () => {
          void retryFns.current.logBarcode();
        },
      );
    } finally {
      setProductLogging(false);
    }
  }, [product, productLogged, productLogging, showAuthExpired, showError]);

  // Keep the retry indirection pointing at the latest callbacks.
  useEffect(() => {
    retryFns.current = { detectFood, capture, pickFromLibrary, logDetectedMeal, logBarcode };
  });

  const viewBarcodeProduct = useCallback(() => {
    if (!product) return;
    router.push({
      pathname: '/food-detail',
      params: {
        name: product.name,
        calories: String(Math.round(product.calories ?? 0)),
        protein: String(product.protein ?? 0),
        carbs: String(product.carbs ?? 0),
        fat: String(product.fat ?? 0),
      },
    });
  }, [product]);

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 12) }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <AppText variant="title" color="#fff">Food Scanner</AppText>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Viewfinder */}
      <View style={styles.viewfinder}>
        {permission?.granted && focused && (mode === 'scan' || mode === 'barcode') ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={
              mode === 'barcode'
                ? { barcodeTypes: [...BARCODE_TYPES] }
                : undefined
            }
            onBarcodeScanned={mode === 'barcode' ? onBarcodeScanned : undefined}
          />
        ) : mode === 'library' ? (
          <View style={styles.centered}>
            <Ionicons name="images-outline" size={56} color="#3E4F3A" />
            <AppText variant="body" color="#8FA084" style={{ marginTop: spacing.sm, textAlign: 'center' }}>
              Pick a photo from your library to analyse
            </AppText>
            <Pressable
              onPress={pickFromLibrary}
              accessibilityRole="button"
              accessibilityLabel="Open photo library"
              style={styles.libraryButton}
            >
              <AppText variant="bodyStrong" color="#fff">Open library</AppText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.centered}>
            <Ionicons name="camera-outline" size={56} color="#3E4F3A" />
          </View>
        )}

        {/* Corner brackets */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.corner, { top: 18, left: 18, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 }]} />
          <View style={[styles.corner, { top: 18, right: 18, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 }]} />
          <View style={[styles.corner, { bottom: 18, left: 18, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 }]} />
          <View style={[styles.corner, { bottom: 18, right: 18, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 }]} />
          {mode === 'scan' && permission?.granted && (
            <Animated.View style={[styles.scanLine, scanStyle]} />
          )}
        </View>

        {/* Barcode result / status */}
        {mode === 'barcode' && (
          <View style={styles.barcodeStatus}>
            {productLoading && (
              <View style={styles.statusPill}>
                <ActivityIndicator size="small" color={colors.primary} />
                <AppText variant="caption" color="#fff" style={{ marginLeft: 8 }}>Looking up…</AppText>
              </View>
            )}
            {productError && (
              <View style={styles.statusPill}>
                <Ionicons name="alert-circle-outline" size={18} color="#F5A524" />
                <AppText variant="caption" color="#fff" style={{ marginLeft: 8, maxWidth: 220 }}>
                  {productError}
                </AppText>
              </View>
            )}
          </View>
        )}

        {/* Detection result sheet */}
        {foods.length > 0 && !uploading && (
          <ScanResultSheet
            foods={foods}
            totalCalories={totalCalories}
            logging={logging}
            logged={logged}
            onSelect={selectFood}
            onLog={logDetectedMeal}
            onClose={() => {
              setFoods([]);
              setLogged(false);
            }}
          />
        )}

        {/* Barcode product card */}
        {product && !productLoading && (
          <View style={styles.productCard}>
            <Pressable
              onPress={() => setProduct(null)}
              accessibilityRole="button"
              accessibilityLabel="Dismiss product"
              hitSlop={12}
              style={styles.dismiss}
            >
              <Ionicons name="close-circle" size={28} color="#8FA084" />
            </Pressable>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              {product.image ? (
                <Image source={{ uri: product.image }} style={styles.productImage} />
              ) : (
                <View style={[styles.productImage, styles.centered, { backgroundColor: '#1A241A' }]}>
                  <Ionicons name="barcode-outline" size={28} color="#3E4F3A" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong" color="#fff" numberOfLines={2}>{product.name}</AppText>
                {product.brand ? (
                  <AppText variant="caption" color="#C9D4C2">{product.brand}</AppText>
                ) : null}
                <AppText variant="numberSm" color="#fff" style={{ marginTop: 4 }}>
                  {Math.round(product.calories ?? 0)}
                  <AppText variant="caption" color="#8FA084"> kcal</AppText>
                </AppText>
                <AppText variant="caption" color="#C9D4C2">
                  P {Math.round(product.protein ?? 0)}g · C {Math.round(product.carbs ?? 0)}g · F{' '}
                  {Math.round(product.fat ?? 0)}g
                </AppText>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
              <Pressable
                onPress={viewBarcodeProduct}
                accessibilityRole="button"
                accessibilityLabel="View product details"
                style={[styles.cardButton, { backgroundColor: '#22301F' }]}
              >
                <AppText variant="bodyStrong" color="#fff">Details</AppText>
              </Pressable>
              <Pressable
                onPress={logBarcode}
                disabled={productLogging || productLogged}
                accessibilityRole="button"
                accessibilityLabel="Log product as a meal"
                style={[
                  styles.cardButton,
                  { backgroundColor: productLogged ? '#3E4F3A' : colors.primary },
                ]}
              >
                <AppText variant="bodyStrong" color="#fff">
                  {productLogging ? 'Logging…' : productLogged ? 'Logged' : 'Log'}
                </AppText>
              </Pressable>
            </View>
          </View>
        )}

        {/* Analysing overlay */}
        {uploading && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText variant="bodyStrong" color="#fff" style={{ marginTop: spacing.md }}>
              Analysing…
            </AppText>
          </View>
        )}

        {/* Inline error */}
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={20} color="#F5A524" />
            <AppText variant="body" color="#fff" style={{ flex: 1 }}>
              {error}
            </AppText>
            {errorRetry && (
              <Pressable
                onPress={errorRetry}
                accessibilityRole="button"
                accessibilityLabel="Retry"
                style={styles.retryButton}
              >
                <AppText variant="bodyStrong" color={colors.primary}>Retry</AppText>
              </Pressable>
            )}
          </View>
        )}

        {/* Capture button */}
        {mode === 'scan' && permission?.granted && foods.length === 0 && !uploading && (
          <View style={styles.captureRow}>
            <Pressable
              onPress={capture}
              accessibilityRole="button"
              accessibilityLabel="Take photo and scan"
              style={styles.captureButton}
            >
              <View style={styles.captureInner} />
            </Pressable>
          </View>
        )}
      </View>

      {/* Mode buttons */}
      <View style={styles.modes}>
        {MODES.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => onModePress(m.id)}
            accessibilityRole="button"
            accessibilityLabel={m.label}
            style={[
              styles.modeButton,
              { backgroundColor: mode === m.id ? colors.primary : '#2C3B28' },
            ]}
          >
            <Ionicons name={m.icon} size={22} color="#fff" />
            <AppText variant="caption" color="#fff">{m.label}</AppText>
          </Pressable>
        ))}
      </View>

      {/* Permission states */}
      {!permission && (
        <View style={styles.permissionCard}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
      {permission && !permission.granted && (
        <View style={styles.permissionCard}>
          <Ionicons name="camera-outline" size={32} color="#8FA084" />
          <AppText variant="title" color="#fff" style={{ marginTop: spacing.sm, textAlign: 'center' }}>
            Camera access needed
          </AppText>
          <AppText variant="body" color="#C9D4C2" style={{ textAlign: 'center', marginTop: 4 }}>
            The food scanner needs your camera to detect meals and read barcodes.
          </AppText>
          <Pressable
            onPress={requestPermission}
            accessibilityRole="button"
            accessibilityLabel="Grant camera permission"
            style={styles.libraryButton}
          >
            <AppText variant="bodyStrong" color="#fff">Grant permission</AppText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#22301F',
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: '#2C3B28',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    height: 420,
    borderRadius: radii.lg,
    backgroundColor: '#1A241A',
    overflow: 'hidden',
  },
  centered: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  corner: {
    width: 34,
    height: 34,
    borderColor: colors.primary,
    position: 'absolute',
  },
  scanLine: {
    position: 'absolute',
    top: 44,
    left: '15%',
    width: '70%',
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(18, 24, 17, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureRow: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
  modes: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  modeButton: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  errorCard: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: '#2C3B28',
    borderRadius: radii.md,
    borderLeftWidth: 4,
    borderLeftColor: '#F5A524',
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  retryButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  productCard: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: '#2C3B28',
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  productImage: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
  },
  dismiss: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 1,
  },
  cardButton: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  barcodeStatus: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 48, 31, 0.92)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  libraryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  permissionCard: {
    backgroundColor: '#2C3B28',
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
    alignItems: 'center',
  },
});
