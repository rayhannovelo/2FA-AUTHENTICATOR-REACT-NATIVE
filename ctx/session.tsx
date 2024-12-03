import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import axios from "axios";
import * as SQLite from "expo-sqlite";
import { type PropsWithChildren, createContext, useContext } from "react";
import { Platform } from "react-native";

import { useStorageState } from "./useStorageState";

type TwoFa = {
  id: number;
  reference_id: string;
  issuer: string;
  account: string;
  secret: string;
  created_at: string;
};

const AuthContext = createContext<{
  signIn: () => void;
  signOut: () => void;
  session?: string | null;
  isLoading: boolean;
}>({
  signIn: () => null,
  signOut: () => null,
  session: null,
  isLoading: false,
});

// This hook can be used to access the user info.
export function useSession() {
  const value = useContext(AuthContext);
  if (process.env.NODE_ENV !== "production") {
    if (!value) {
      throw new Error("useSession must be wrapped in a <SessionProvider />");
    }
  }

  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState("session");

  return (
    <AuthContext.Provider
      value={{
        signIn: async () => {
          // Perform sign-in logic here
          try {
            GoogleSignin.configure({
              offlineAccess: true,
              webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
              iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
            });

            await GoogleSignin.hasPlayServices();
            const response = await GoogleSignin.signIn();
            if (isSuccessResponse(response)) {
              // setState({ userInfo: response.data });
              const data = response.data;
              axios
                .post(
                  `${process.env.EXPO_PUBLIC_API_URL}/auth/google-sign-in`,
                  {
                    idToken: data.idToken,
                    googleId: data.user.id,
                    platform: Platform.OS,
                  },
                  {
                    headers: {
                      Accept: "application/json, application/vnd.api+json",
                    },
                  },
                )
                .then(async function (response) {
                  // get local 2fa
                  const db = await SQLite.openDatabaseAsync("2fa.db");
                  const twoFas = await db.getAllAsync<TwoFa>(
                    "SELECT * FROM two_fas",
                  );

                  if (twoFas.length) {
                    const ids = twoFas.map((value) => value.reference_id);

                    axios
                      .post(
                        `${process.env.EXPO_PUBLIC_API_URL}/user-2fas/sync`,
                        { referenceId: ids },
                        {
                          headers: {
                            Accept:
                              "application/json, application/vnd.api+json",
                            Authorization: `Bearer ${response.data.data.user_token.token}`,
                          },
                        },
                      )
                      .catch(function (error) {
                        console.log("error sync", error.message);
                      });
                  }

                  // remove local 2fa
                  await db.runAsync("DELETE FROM two_fas");

                  // set session
                  setSession(JSON.stringify(response.data.data));
                })
                .catch(function (error) {
                  console.log("error", error.message);
                });
            } else {
              // sign in was cancelled by user
              console.log("sign in was cancelled by user");
            }
          } catch (error) {
            if (isErrorWithCode(error)) {
              switch (error.code) {
                case statusCodes.IN_PROGRESS:
                  // operation (eg. sign in) already in progress
                  console.log("operation (eg. sign in) already in progress");
                  break;
                case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
                  // Android only, play services not available or outdated
                  console.log(
                    "Android only, play services not available or outdated",
                  );
                  break;
                default:
                  // some other error happened
                  console.log("some other error happened");
                  alert(error.message);
              }
            } else {
              // an error that's not related to google sign in occurred
              console.log(
                "an error that's not related to google sign in occurred",
              );
            }
          }
        },
        signOut: () => {
          setSession(null);
        },
        session,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
