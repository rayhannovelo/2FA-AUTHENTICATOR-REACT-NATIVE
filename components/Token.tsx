import { useEffect, useState } from "react";
import { View } from "react-native";
import AnimatedProgressWheel from "react-native-progress-wheel";
import { Text } from "~/components/ui/text";
import { Separator } from "~/components/ui/separator";
import { authenticator } from "~/lib/authenticator";

export function Token({
  value,
}: {
  value: { issuer: string; account: string; secret: string };
}) {
  const [timeRemaining, settimeRemaining] = useState(
    authenticator.timeRemaining()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const timeRemaining = authenticator.timeRemaining();
      settimeRemaining(timeRemaining);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <View className="flex px-4 mt-1">
      <Text className="text-lg font-medium">
        {value.issuer}: {value.account}
      </Text>
      <View className="flex flex-row justify-between items-center pr-4">
        <Text className="text-5xl text-info leading-tight">
          {authenticator.generate(value.secret).replace(/(.{3})/g, "$1 ")}
        </Text>
        <View style={{ transform: [{ scaleX: -1 }] }}>
          <AnimatedProgressWheel
            size={38}
            width={20}
            color={"#0088CC"}
            backgroundColor={"white"}
            max={30}
            progress={timeRemaining}
            rotation={"-90deg"}
            duration={0}
          />
        </View>
      </View>
      <Separator />
    </View>
  );
}
