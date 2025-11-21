import { Plus } from "lucide-react";
import { Button } from "@/ui/button";
import { useState } from "react";
import { CreateAppModal } from "@/ui/create-app-modal";

export function CreateMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="icon" onClick={() => setOpen(true)}>
        <Plus size={18} />
      </Button>

      <CreateAppModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
