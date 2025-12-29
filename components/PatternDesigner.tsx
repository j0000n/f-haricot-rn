import { useEffect, useMemo, useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { RobustColorPicker } from "./RobustColorPicker";
import { Slider } from "./Slider";
import { useTheme } from "@/styles/tokens";
import type { ThemeTokens } from "@/styles/tokens";

type ThemeColorSet = ThemeTokens["colors"];

type PatternDesignerProps = {
  initialRows?: number;
  initialColumns?: number;
  initialGrid?: string[][];
  initialColor?: string;
  colors?: ThemeColorSet;
  tokens?: ThemeTokens;
  onPatternChange?: (pattern: {
    rows: number;
    columns: number;
    grid: string[][];
    svg: string;
    dataUri: string;
  }) => void;
  storageKey?: string;
  recentColorsStorage?: {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
  };
};

type PatternSample = {
  name: string;
  grid: string[][];
};

const SAMPLE_PATTERNS: PatternSample[] = [
  {
    name: "Checkerboard",
    grid: Array.from({ length: 8 }, (_, row) =>
      Array.from({ length: 8 }, (_, col) => ((row + col) % 2 === 0 ? "#0f172a" : "#f8fafc"))
    ),
  },
  {
    name: "Diagonal",
    grid: Array.from({ length: 10 }, (_, row) =>
      Array.from({ length: 10 }, (_, col) => (row === col ? "#22c55e" : "#e2e8f0"))
    ),
  },
  {
    name: "Plus",
    grid: Array.from({ length: 9 }, (_, row) =>
      Array.from({ length: 9 }, (_, col) =>
        row === 4 || col === 4 ? "#f97316" : row % 2 === 0 && col % 2 === 0 ? "#0ea5e9" : "#f1f5f9"
      )
    ),
  },
];

const DEFAULT_ROWS = 8;
const DEFAULT_COLUMNS = 8;
const RECENT_LIMIT = 10;

const createEmptyGrid = (rows: number, columns: number, fill = "#00000000") =>
  Array.from({ length: rows }, () => Array.from({ length: columns }, () => fill));

const encodeBase64 = (value: string): string => {
  if (typeof btoa === "function") {
    return btoa(unescape(encodeURIComponent(value)));
  }
  // eslint-disable-next-line no-undef
  if (typeof Buffer !== "undefined") {
    // eslint-disable-next-line no-undef
    return Buffer.from(value, "utf-8").toString("base64");
  }
  return "";
};

const gridToSvg = (grid: string[][], strokeColor: string) => {
  const cellSize = 12;
  const rows = grid.length;
  const columns = grid[0]?.length ?? 0;
  const width = columns * cellSize;
  const height = rows * cellSize;

  const cells = grid
    .map((row, rowIndex) =>
      row
        .map(
          (fill, colIndex) =>
            `<rect x="${colIndex * cellSize}" y="${rowIndex * cellSize}" width="${cellSize}" height="${cellSize}" fill="${fill}" stroke="${strokeColor}" stroke-width="0.5" />`
        )
        .join("")
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" shape-rendering="crispEdges">${cells}</svg>`;
};

const coerceGrid = (grid: string[][], rows: number, columns: number) => {
  const resized = Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: columns }, (_, colIndex) => grid[rowIndex]?.[colIndex] ?? grid[0]?.[0] ?? "#00000000")
  );
  return resized;
};

export function PatternDesigner({
  initialRows = DEFAULT_ROWS,
  initialColumns = DEFAULT_COLUMNS,
  initialGrid,
  initialColor,
  colors: providedColors,
  tokens: providedTokens,
  onPatternChange,
  recentColorsStorage,
  storageKey = "pattern-designer-recent-colors",
}: PatternDesignerProps) {
  const theme = useTheme();
  const tokens = providedTokens ?? theme.tokens;
  const colors = providedColors ?? tokens.colors;

  const [rows, setRows] = useState(initialRows);
  const [columns, setColumns] = useState(initialColumns);
  const [grid, setGrid] = useState(
    initialGrid ? coerceGrid(initialGrid, initialRows, initialColumns) : createEmptyGrid(initialRows, initialColumns)
  );
  const [activeColor, setActiveColor] = useState(initialColor ?? colors.accent);
  const [recentColors, setRecentColors] = useState<string[]>([initialColor ?? colors.accent]);

  useEffect(() => {
    if (!recentColorsStorage) return;
    recentColorsStorage
      .getItem(storageKey)
      .then((stored) => {
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setRecentColors((prev) => (prev.length ? prev : parsed));
          }
        }
      })
      .catch(() => {
        // optional persistence failure is non-blocking
      });
  }, [recentColorsStorage, storageKey]);

  const persistRecent = (next: string[]) => {
    if (!recentColorsStorage) return;
    recentColorsStorage
      .setItem(storageKey, JSON.stringify(next))
      .catch(() => {
        // optional persistence failure is non-blocking
      });
  };

  const updateRecentColors = (nextColor: string) => {
    setRecentColors((prev) => {
      const filtered = prev.filter((color) => color !== nextColor);
      const next = [nextColor, ...filtered].slice(0, RECENT_LIMIT);
      persistRecent(next);
      return next;
    });
  };

  const handleColorChange = (color: string) => {
    setActiveColor(color);
    updateRecentColors(color);
  };

  const updateGridDimensions = (nextRows: number, nextColumns: number) => {
    setRows(nextRows);
    setColumns(nextColumns);
    setGrid((prev) => coerceGrid(prev, nextRows, nextColumns));
  };

  const handleCellPress = (rowIndex: number, colIndex: number) => {
    setGrid((prev) =>
      prev.map((row, r) =>
        row.map((cell, c) => {
          if (r === rowIndex && c === colIndex) {
            return cell === activeColor ? "#00000000" : activeColor;
          }
          return cell;
        })
      )
    );
  };

  const svg = useMemo(() => gridToSvg(grid, colors.border), [grid, colors.border]);
  const dataUri = useMemo(() => `data:image/svg+xml;base64,${encodeBase64(svg)}`, [svg]);

  useEffect(() => {
    onPatternChange?.({ rows, columns, grid, svg, dataUri });
  }, [rows, columns, grid, svg, dataUri, onPatternChange]);

  const handleSampleLoad = (sample: PatternSample) => {
    const sampleRows = sample.grid.length;
    const sampleColumns = sample.grid[0]?.length ?? 0;
    setRows(sampleRows);
    setColumns(sampleColumns);
    setGrid(sample.grid);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16 }}
      contentContainerStyle={{ gap: 16 }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: colors.textPrimary, fontSize: 18, fontFamily: tokens.fontFamilies.bold }}>
          Pattern Designer
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
          {rows} × {columns}
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 14, fontFamily: tokens.fontFamilies.semiBold }}>
          Grid Size
        </Text>
        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>Rows</Text>
          <Slider
            value={rows}
            minimumValue={4}
            maximumValue={20}
            step={1}
            onValueChange={(val) => updateGridDimensions(val, columns)}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.accent}
          />
        </View>
        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>Columns</Text>
          <Slider
            value={columns}
            minimumValue={4}
            maximumValue={20}
            step={1}
            onValueChange={(val) => updateGridDimensions(rows, val)}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.accent}
          />
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 14, fontFamily: tokens.fontFamilies.semiBold }}>
          Active Color
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <RobustColorPicker value={activeColor} onChange={handleColorChange} colors={colors} tokens={tokens} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 14 }}>{activeColor}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>Tap a cell to paint or clear</Text>
          </View>
        </View>
        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Recent colors</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {recentColors.map((color) => (
              <Pressable
                key={color}
                onPress={() => handleColorChange(color)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: color === activeColor ? colors.accent : colors.border,
                  backgroundColor: color,
                }}
              />
            ))}
          </View>
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 14, fontFamily: tokens.fontFamilies.semiBold }}>
          Canvas
        </Text>
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 8,
            backgroundColor: colors.overlay,
          }}
        >
          <View
            style={{
              flexDirection: "column",
              gap: 6,
            }}
          >
            {grid.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={{ flexDirection: "row", gap: 6 }}>
                {row.map((cell, colIndex) => (
                  <Pressable
                    key={`cell-${rowIndex}-${colIndex}`}
                    onPress={() => handleCellPress(rowIndex, colIndex)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      backgroundColor: cell,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 14, fontFamily: tokens.fontFamilies.semiBold }}>
          Preview
        </Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <ImageBackground
            source={{ uri: dataUri }}
            resizeMode="cover"
            style={{ flex: 1, aspectRatio: 1, borderRadius: 12, overflow: "hidden" }}
          />
          <View
            style={{
              flex: 1,
              aspectRatio: 1,
              borderRadius: 12,
              overflow: "hidden",
              borderWidth: 4,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            }}
          >
            <Image source={{ uri: dataUri }} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
          </View>
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 14, fontFamily: tokens.fontFamilies.semiBold }}>
          Sample Patterns
        </Text>
        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
          {SAMPLE_PATTERNS.map((sample) => {
            const previewSvg = gridToSvg(sample.grid, colors.border);
            const previewUri = `data:image/svg+xml;base64,${encodeBase64(previewSvg)}`;
            return (
              <Pressable
                key={sample.name}
                onPress={() => handleSampleLoad(sample)}
                style={{
                  width: 100,
                  padding: 8,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.overlay,
                  gap: 8,
                }}
              >
                <Image source={{ uri: previewUri }} style={{ width: "100%", height: 72, borderRadius: 8 }} />
                <Text style={{ color: colors.textPrimary, fontSize: 12, fontFamily: tokens.fontFamilies.semiBold }}>
                  {sample.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}
