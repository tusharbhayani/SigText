import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Appearance, type ColorSchemeName } from "react-native"

interface Colors {
  primary: string
  secondary: string
  background: string
  surface: string
  cardBackground: string
  text: string
  textSecondary: string
  border: string
  success: string
  warning: string
  error: string
}

interface ThemeContextType {
  isDark: boolean
  colors: Colors
  toggleTheme: () => void
  setTheme: (theme: "light" | "dark" | "system") => void
  currentTheme: "light" | "dark" | "system"
}

const lightColors: Colors = {
  primary: "#007AFF",
  secondary: "#5856D6",
  background: "#FFFFFF",
  surface: "#F2F2F7",
  cardBackground: "#FFFFFF",
  text: "#000000",
  textSecondary: "#6D6D70",
  border: "#C6C6C8",
  success: "#34C759",
  warning: "#FF9500",
  error: "#FF3B30",
}

const darkColors: Colors = {
  primary: "#0A84FF",
  secondary: "#5E5CE6",
  background: "#000000",
  surface: "#1C1C1E",
  cardBackground: "#2C2C2E",
  text: "#FFFFFF",
  textSecondary: "#8E8E93",
  border: "#38383A",
  success: "#30D158",
  warning: "#FF9F0A",
  error: "#FF453A",
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark" | "system">("system")
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(Appearance.getColorScheme())

  // Determine if we should use dark mode
  const isDark = currentTheme === "dark" || (currentTheme === "system" && systemColorScheme === "dark")

  const colors = isDark ? darkColors : lightColors

  useEffect(() => {
    // Load saved theme preference
    loadThemePreference()

    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme)
    })

    return () => subscription?.remove()
  }, [])

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("theme")
      if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
        setCurrentTheme(savedTheme as "light" | "dark" | "system")
      }
    } catch (error) {
      console.error("Error loading theme preference:", error)
    }
  }

  const saveThemePreference = async (theme: "light" | "dark" | "system") => {
    try {
      await AsyncStorage.setItem("theme", theme)
    } catch (error) {
      console.error("Error saving theme preference:", error)
    }
  }

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark"
    setCurrentTheme(newTheme)
    saveThemePreference(newTheme)
  }

  const setTheme = (theme: "light" | "dark" | "system") => {
    setCurrentTheme(theme)
    saveThemePreference(theme)
  }

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        colors,
        toggleTheme,
        setTheme,
        currentTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
