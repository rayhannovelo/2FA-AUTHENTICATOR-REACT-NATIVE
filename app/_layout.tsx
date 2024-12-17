import AsyncStorage from "@react-native-async-storage/async-storage";
import { Theme, ThemeProvider } from "@react-navigation/native";
import { PortalHost } from "@rn-primitives/portal";
import { SplashScreen, Stack } from "expo-router";
import { type SQLiteDatabase, SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { Platform } from "react-native";
import { AccountMenu } from "~/components/AccountMenu";
import { ThemeToggle } from "~/components/ThemeToggle";
import { SessionProvider } from "~/ctx/session";
import "~/global.css";
import { setAndroidNavigationBar } from "~/lib/android-navigation-bar";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/useColorScheme";

const LIGHT_THEME: Theme = {
  dark: false,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  dark: true,
  colors: NAV_THEME.dark,
};

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

// Prevent the splash screen from auto-hiding before getting the color scheme.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme, setColorScheme, isDarkColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const theme = await AsyncStorage.getItem("theme");
      if (Platform.OS === "web") {
        // Adds the background color to the html element to prevent white background on overscroll.
        document.documentElement.classList.add("bg-background");
      }
      if (!theme) {
        AsyncStorage.setItem("theme", colorScheme);
        setIsColorSchemeLoaded(true);
        return;
      }
      const colorTheme = theme === "dark" ? "dark" : "light";
      if (colorTheme !== colorScheme) {
        setColorScheme(colorTheme);
        setAndroidNavigationBar(colorTheme);
        setIsColorSchemeLoaded(true);
        return;
      }
      setAndroidNavigationBar(colorTheme);
      setIsColorSchemeLoaded(true);
    })().finally(() => {
      SplashScreen.hideAsync();
    });
  }, [colorScheme, setColorScheme]);

  if (!isColorSchemeLoaded) {
    return null;
  }

  return (
    <SessionProvider>
      <SQLiteProvider databaseName="2fa.db" onInit={migrateDbIfNeeded}>
        <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
          <StatusBar style={isDarkColorScheme ? "light" : "dark"} />
          <Stack>
            <Stack.Screen
              name="index"
              options={{
                title: "2FA AUTHENTICATOR",
                headerLeft: () => <ThemeToggle />,
                headerRight: () => <AccountMenu />,
                headerTitleAlign: "center",
              }}
            />
            <Stack.Screen
              name="scan-qr"
              options={{
                title: "Scan QR",
                headerBackTitle: "Back",
              }}
            />
          </Stack>
          <PortalHost />
        </ThemeProvider>
      </SQLiteProvider>
    </SessionProvider>
  );
}

async function migrateDbIfNeeded(db: SQLiteDatabase) {
  // latest version
  const DATABASE_VERSION = 1;

  // get current version
  const result = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  let currentDbVersion = result?.user_version ?? 0;

  // don't migrate if latest version
  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }

  // first migration
  if (currentDbVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      CREATE TABLE IF NOT EXISTS two_fas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reference_id TEXT NULL,
        secret TEXT NOT NULL,
        issuer TEXT NOT NULL,
        account TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    currentDbVersion = 1;
  }

  // prepare for the next migration
  // if (currentDbVersion === 1) {
  //   currentDbVersion = 2;
  // }

  currentDbVersion = 0;

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
