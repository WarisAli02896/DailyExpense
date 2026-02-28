import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { registerSnackbarHandler } from '../../services/snackbarService';

const DURATION_MS = 2600;

const getTypeFromTitle = (title) => {
  const text = String(title || '').toLowerCase();
  if (text.includes('error') || text.includes('failed')) return 'error';
  if (text.includes('success')) return 'success';
  if (text.includes('warning')) return 'warning';
  return 'info';
};

const typeStyles = {
  info: { bg: COLORS.primary, accent: COLORS.info },
  success: { bg: COLORS.success, accent: COLORS.success },
  warning: { bg: '#B8860B', accent: COLORS.warning },
  error: { bg: COLORS.danger, accent: COLORS.danger },
};

const SnackbarHost = () => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-8)).current;
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    const unregister = registerSnackbarHandler((payload) => {
      setQueue((prev) => [...prev, payload]);
    });
    return unregister;
  }, []);

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((prev) => prev.slice(1));
    }
  }, [queue, current]);

  useEffect(() => {
    if (!current) return undefined;

    fadeAnim.setValue(0);
    slideAnim.setValue(-8);

    const enter = Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]);

    const exit = Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -8, duration: 160, useNativeDriver: true }),
    ]);

    enter.start();
    const timer = setTimeout(() => {
      exit.start(() => setCurrent(null));
    }, DURATION_MS);

    return () => clearTimeout(timer);
  }, [current, fadeAnim, slideAnim]);

  const snackbarType = useMemo(() => {
    if (!current) return 'info';
    return current.type || getTypeFromTitle(current.title);
  }, [current]);

  if (!current) return null;

  const title = current.title || '';
  const message = current.message || '';
  const style = typeStyles[snackbarType] || typeStyles.info;

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Animated.View
        style={[
          styles.snackbar,
          { marginTop: insets.top + 8, backgroundColor: style.bg, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={[styles.dot, { backgroundColor: style.accent }]} />
        <View style={styles.textWrap}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    zIndex: 9999,
  },
  snackbar: {
    width: '92%',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.18)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 10,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: COLORS.textWhite,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 1,
  },
  message: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 12,
  },
});

export default SnackbarHost;
