import React, { useState, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useThemedStyles } from "@/styles/tokens";
import { Tooltip, type Tooltip as TooltipType } from "./Tooltip";
import type { Id } from "@/convex/_generated/dataModel";

interface TooltipContainerProps {
  tooltips?: TooltipType[];
}

export function TooltipContainer({ tooltips: mockTooltips }: TooltipContainerProps) {
  const styles = useThemedStyles(createTooltipContainerStyles);
  const [dismissedMockIds, setDismissedMockIds] = useState<Set<string>>(new Set());
  
  // Use Convex query for real tooltips, fallback to mock data for now
  const activeTooltips = useQuery(api.tooltips.getActive) ?? [];
  const dismissTooltip = useMutation(api.tooltips.dismiss);
  
  // Use mock data if provided, otherwise use Convex data
  const isUsingMockData = mockTooltips && mockTooltips.length > 0;
  const tooltipsToDisplay = useMemo(() => {
    if (isUsingMockData) {
      // Filter out dismissed mock tooltips
      return mockTooltips.filter(t => !dismissedMockIds.has(t._id));
    }
    return activeTooltips as TooltipType[];
  }, [isUsingMockData, mockTooltips, dismissedMockIds, activeTooltips]);

  const handleDismiss = async (id: Id<"tooltips">) => {
    if (isUsingMockData) {
      // For mock tooltips, just track dismissal locally
      setDismissedMockIds(prev => new Set(prev).add(id));
    } else {
      // For real tooltips, call Convex mutation
      try {
        await dismissTooltip({ id });
      } catch (error) {
        console.error("Failed to dismiss tooltip", error);
      }
    }
  };

  if (tooltipsToDisplay.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {tooltipsToDisplay.map((tooltip) => (
        <Tooltip key={tooltip._id} tooltip={tooltip} onDismiss={handleDismiss} />
      ))}
    </View>
  );
}

const createTooltipContainerStyles = (tokens: any) =>
  StyleSheet.create({
    container: {
      marginHorizontal: tokens.spacing.lg,
      marginBottom: tokens.spacing.lg,
    },
  });
