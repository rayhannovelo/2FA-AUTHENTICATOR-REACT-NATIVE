import { TouchableOpacity } from "react-native";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Text } from "~/components/ui/text";
import { useSession } from "~/ctx/session";
import { CircleUserRound } from "~/lib/icons/CircleUserRound";

export function AccountMenu() {
  const { session, signIn, signOut } = useSession();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <TouchableOpacity className="w-12 flex items-end">
          <CircleUserRound />
        </TouchableOpacity>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 native:w-72 mt-[5%] ml-[-5%]">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {session ? (
          <DropdownMenuItem onPress={() => signOut()}>
            <Text>Log out</Text>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onPress={() => signIn()}>
            <Text>Sign In With Google</Text>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
