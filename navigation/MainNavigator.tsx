import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createStackNavigator } from "@react-navigation/stack"
import { Chrome as Home, QrCode, Settings, MessageSquare, Shield, Smartphone, Beaker, Coins } from "lucide-react-native"
import { useTheme } from "../contexts/ThemeContext"
import { Platform } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

// Import screens
import HomeScreen from "../screens/HomeScreen"
import ScannerScreen from "../screens/ScannerScreen"
import SettingsScreen from "../screens/SettingsScreen"
import MessagesScreen from "../screens/MessagesScreen"
import OrganizationsScreen from "../screens/OrganizationsScreen"
import SMSScreen from "../screens/SMSScreen"
import TestScreen from "../screens/TestScreen"
import AlgorandScreen from "../screens/AlgorandScreen"
import AddOrganizationScreen from "../screens/AddOrganizationScreen"
import ScanResultScreen from "../screens/ScanResultScreen"
import AlgorandTestScreen from "../screens/AlgorandTestScreen"
import AlgorandTestDataScreen from "../screens/AlgorandTestDataScreen"

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

// Stack navigators for screens that need nested navigation
const OrganizationsStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="OrganizationsList" component={OrganizationsScreen} />
            <Stack.Screen name="AddOrganization" component={AddOrganizationScreen} />
        </Stack.Navigator>
    )
}

const ScannerStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="ScannerMain" component={ScannerScreen} />
            <Stack.Screen name="ScanResult" component={ScanResultScreen} />
        </Stack.Navigator>
    )
}

const AlgorandStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="AlgorandMain" component={AlgorandScreen} />
            <Stack.Screen name="AlgorandTest" component={AlgorandTestScreen} />
            <Stack.Screen name="AlgorandTestData" component={AlgorandTestDataScreen} />
        </Stack.Navigator>
    )
}

const MainNavigator = () => {
    const { colors } = useTheme()
    const insets = useSafeAreaInsets()

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.background,
                    borderTopColor: colors.border,
                    borderTopWidth: 0.5,
                    paddingBottom: Math.max(insets.bottom, Platform.OS === "ios" ? 20 : 10),
                    paddingTop: 8,
                    paddingHorizontal: 4,
                    height: Platform.OS === "ios" ? 85 + insets.bottom : 90,
                    elevation: 8,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarLabelStyle: {
                    fontFamily: "Inter-Medium",
                    fontSize: 10,
                    marginTop: 5,
                },
                tabBarIconStyle: {
                    marginTop: 2,
                },
                tabBarItemStyle: {
                    paddingVertical: 2,
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Home size={22} color={color} />,
                }}
            />
            <Tab.Screen
                name="Scanner"
                component={ScannerStack}
                options={{
                    tabBarIcon: ({ color, size }) => <QrCode size={22} color={color} />,
                }}
            />
            <Tab.Screen
                name="Organizations"
                component={OrganizationsStack}
                options={{
                    tabBarLabel: "Orgs",
                    tabBarIcon: ({ color, size }) => <Shield size={22} color={color} />,
                }}
            />
            <Tab.Screen
                name="Algorand"
                component={AlgorandStack}
                options={{
                    tabBarIcon: ({ color, size }) => <Coins size={22} color={color} />,
                }}
            />
            <Tab.Screen
                name="SMS"
                component={SMSScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Smartphone size={22} color={color} />,
                }}
            />
            <Tab.Screen
                name="Messages"
                component={MessagesScreen}
                options={{
                    tabBarLabel: "Msgs",
                    tabBarIcon: ({ color, size }) => <MessageSquare size={22} color={color} />,
                }}
            />
            <Tab.Screen
                name="Test"
                component={TestScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Beaker size={22} color={color} />,
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarLabel: "Config",
                    tabBarIcon: ({ color, size }) => <Settings size={22} color={color} />,
                }}
            />
        </Tab.Navigator>
    )
}

export default MainNavigator
