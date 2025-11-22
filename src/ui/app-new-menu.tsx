// src/ui/app-new-menu.tsx
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56">
        <DropdownMenuItem
          onClick={() =>
            alert("New User (demo — bạn tự thêm modal hoặc route sau)")
          }
        >
          New User
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            alert("New Organization (demo — bạn tự thêm modal hoặc route sau)")
          }
        >
          New Organization
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            alert("New Workspace (demo — bạn thêm route sau)")
          }
        >
          New Workspace
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            alert("New API Key (demo — bạn tự thêm chức năng sau)")
          }
        >
          New API Key
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            alert("New Email Template (demo)")
          }
        >
          New Email Template
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            alert("New Subscription Plan (demo)")
          }
        >
          New Subscription Plan
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            alert("New Deployment (demo)")
          }
        >
          New Deployment
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            alert("New Role / Permission (demo)")
          }
        >
          New Role / Permission
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
