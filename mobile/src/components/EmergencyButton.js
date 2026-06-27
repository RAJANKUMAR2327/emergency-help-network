import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Vibration } from 'react-native';

const EmergencyButton = ({ onPress, disabled }) => {
  const [pressing, setPressing] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);
  const countRef = useRef(null);
  const pulseRef = useRef(null);    // store animation so we can stop it on unmount
  const pressingRef = useRef(false); // ref mirror of pressing state to avoid stale closures

  useEffect(() => {
    // Store animation reference for cleanup
    pulseRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulseRef.current.start();

    return () => {
      // Stop animation on unmount to prevent setState on unmounted component
      pulseRef.current?.stop();
      clearTimeout(timerRef.current);
      clearInterval(countRef.current);
    };
  }, []);

  const handlePressIn = () => {
    if (disabled) return;
    pressingRef.current = true;
    setPressing(true);
    setCountdown(3);
    Vibration.vibrate(100);
    Animated.spring(scaleAnim, { toValue: 0.92, useNativeDriver: true }).start();

    let count = 3;
    countRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      Vibration.vibrate(50);
      if (count <= 0) {
        clearInterval(countRef.current);
      }
    }, 1000);

    timerRef.current = setTimeout(() => {
      handleTrigger();
    }, 3000);
  };

  const handlePressOut = () => {
    // Use ref (not state) to check pressing to avoid stale closure race condition
    if (!pressingRef.current) return;
    pressingRef.current = false;
    setPressing(false);
    setCountdown(3);
    clearTimeout(timerRef.current);
    clearInterval(countRef.current);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleTrigger = () => {
    pressingRef.current = false;
    setPressing(false);
    Vibration.vibrate([0, 200, 100, 200]);
    onPress();
  };

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.outerRing, { transform: [{ scale: pulseAnim }] }]}>
        <Animated.View style={[styles.innerRing, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity
            style={[
              styles.button,
              pressing && styles.buttonPressed,
              disabled && styles.buttonDisabled,
            ]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
            disabled={disabled}
            accessibilityLabel="SOS emergency button. Hold for 3 seconds to trigger."
            accessibilityRole="button"
          >
            <Text style={styles.sos}>SOS</Text>
            {pressing ? (
              <Text style={styles.countdownText}>{countdown}</Text>
            ) : (
              <Text style={styles.holdText}>{disabled ? 'Sending…' : 'Hold 3 sec'}</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  outerRing: {
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(220,38,38,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  innerRing: {
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(220,38,38,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  button: {
    width: 160, height: 160, borderRadius: 80, backgroundColor: '#DC2626',
    alignItems: 'center', justifyContent: 'center', elevation: 8,
    shadowColor: '#DC2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8,
  },
  buttonPressed: { backgroundColor: '#991B1B' },
  buttonDisabled: { backgroundColor: '#9CA3AF' },
  sos: { fontSize: 42, fontWeight: 'bold', color: '#fff', letterSpacing: 4 },
  countdownText: { fontSize: 28, color: '#fff', fontWeight: 'bold', marginTop: 4 },
  holdText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
});

export default EmergencyButton;
