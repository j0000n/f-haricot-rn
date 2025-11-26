import { useState, useRef } from "react";
import { StyleSheet, View, Pressable, PanResponder } from "react-native";

type SliderProps = {
  value: number;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  onValueChange: (value: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  style?: object;
};

export function Slider({
  value,
  minimumValue,
  maximumValue,
  step = 1,
  onValueChange,
  minimumTrackTintColor = "#007AFF",
  maximumTrackTintColor = "#E5E5E5",
  thumbTintColor = "#007AFF",
  style,
}: SliderProps) {
  const [sliderWidth, setSliderWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<View>(null);

  const getValueFromPosition = (x: number) => {
    if (sliderWidth === 0) return value;
    const percentage = Math.max(0, Math.min(1, x / sliderWidth));
    const rawValue = minimumValue + percentage * (maximumValue - minimumValue);
    const steppedValue = Math.round(rawValue / step) * step;
    return Math.max(minimumValue, Math.min(maximumValue, steppedValue));
  };

  const getPositionFromValue = (val: number) => {
    if (sliderWidth === 0) return 0;
    const percentage = (val - minimumValue) / (maximumValue - minimumValue);
    return percentage * sliderWidth;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: { nativeEvent: { locationX: number } }) => {
        setIsDragging(true);
        const locationX = evt.nativeEvent.locationX;
        const newValue = getValueFromPosition(locationX);
        onValueChange(newValue);
      },
      onPanResponderMove: (evt: { nativeEvent: { locationX: number } }) => {
        const locationX = evt.nativeEvent.locationX;
        const newValue = getValueFromPosition(locationX);
        onValueChange(newValue);
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
      },
    })
  ).current;

  const handlePress = (evt: { nativeEvent: { locationX: number } }) => {
    const locationX = evt.nativeEvent.locationX;
    const newValue = getValueFromPosition(locationX);
    onValueChange(newValue);
  };

  const trackFillPercentage = ((value - minimumValue) / (maximumValue - minimumValue)) * 100;
  const thumbPosition = getPositionFromValue(value);

  const handleResponderChange = (evt: { nativeEvent: { locationX?: number } }) => {
    const locationX = evt.nativeEvent.locationX ?? 0;
    const newValue = getValueFromPosition(locationX);
    onValueChange(newValue);
  };

  return (
    <View
      ref={containerRef}
      style={[styles.container, style]}
      onLayout={(evt: { nativeEvent: { layout: { width: number } } }) => {
        const { width } = evt.nativeEvent.layout;
        if (width > 0 && sliderWidth !== width) {
          setSliderWidth(width);
        }
      }}
      onStartShouldSetResponder={() => true}
      onResponderGrant={handleResponderChange}
      onResponderMove={handleResponderChange}
    >
      <Pressable
        style={styles.pressableArea}
        onPress={handlePress}
        {...panResponder.panHandlers}
      >
        <View style={styles.trackContainer}>
          <View
            style={[
              styles.track,
              {
                backgroundColor: maximumTrackTintColor,
              },
            ]}
          />
          <View
            style={[
              styles.trackFill,
              {
                width: `${trackFillPercentage}%`,
                backgroundColor: minimumTrackTintColor,
              },
            ]}
          />
        </View>
        <View
          style={[
            styles.thumb,
            {
              backgroundColor: thumbTintColor,
              left: Math.max(0, Math.min(sliderWidth - 20, thumbPosition - 10)),
              transform: [{ scale: isDragging ? 1.2 : 1 }],
            },
          ]}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: "center",
    position: "relative",
  },
  trackContainer: {
    height: 4,
    borderRadius: 2,
    position: "relative",
    overflow: "hidden",
  },
  track: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
  },
  trackFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
  },
  pressableArea: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

