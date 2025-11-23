import { Button } from "@/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/ui/dropdown-menu";

import { Plus } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { Id } from "@cvx/_generated/dataModel";

export default function AppNewMenu({ appId }: { appId: Id<"apps"> }) {
  const router = useRouter();

  const go = (to: string) => {
    router.navigate({ to: to as any, params: { appId } });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Actions ▾
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
            onClick={() =>
              router.navigate({
                to: "/_app/_auth/dashboard/apps/$appId/users/new",
                params: { appId },
              })
            }
          >
            New User
          </DropdownMenuItem>


        {/* Các item khác tạm để TODO, sẽ làm module sau */}
        <DropdownMenuItem
          onClick={() =>
            go("/_app/_auth/dashboard/apps/$appId/organizations/new")
          }
        >
          New Organization
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            go("/_app/_auth/dashboard/apps/$appId/workspaces/new")
          }
        >
          New Workspace
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            go("/_app/_auth/dashboard/apps/$appId/api-keys/new")
          }
        >
          New API Key
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            go(
              "/_app/_auth/dashboard/apps/$appId/email-templates/new",
            )
          }
        >
          New Email Template
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            go("/_app/_auth/dashboard/apps/$appId/plans/new")
          }
        >
          New Subscription Plan
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            go("/_app/_auth/dashboard/apps/$appId/deployments/new")
          }
        >
          New Deployment
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            go("/_app/_auth/dashboard/apps/$appId/roles/new")
          }
        >
          New Role / Permission
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
