import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useSQLiteContext } from "expo-sqlite";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import otpauthUriParser from "otpauth-uri-parser";

export default function ScanQR() {
  const db = useSQLiteContext();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [open, setOpen] = useState(false);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View className="flex-1 justify-center items-center ">
        <Text>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} className="w-2/3">
          <Text>Grant Access</Text>
        </Button>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);

    const parsedData = otpauthUriParser(data);
    if (!parsedData) {
      setOpen(true);
      return false;
    }

    // get secret
    const secret = parsedData?.query?.secret;
    if (!secret) {
      setOpen(true);
      return false;
    }

    // save to db
    await db.runAsync(
      "INSERT INTO two_fas (reference_id, secret, issuer, account) VALUES (?, ?, ?, ?)",
      parsedData.query.referenceId,
      parsedData.query.secret,
      parsedData.query.issuer,
      parsedData.label.account
    );

    router.navigate("/");
  };

  return (
    <>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      >
        <View className="w-72 h-72 border-4 border-green-400"></View>
      </CameraView>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Can't scan this QR Code</AlertDialogTitle>
            <AlertDialogDescription>
              Please scan QR Code generated by 2FA PPI APP
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onPress={() => router.navigate("/")}>
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={() => setScanned(false)}>
              <Text>Scan Again</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
