import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/ui/dialog";
import { Button } from "@/ui/button";
import { useMutation } from "convex/react";
import { api } from "@cvx/_generated/api";
import { useState } from "react";

interface CreateAppModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateAppModal({ open, onClose }: CreateAppModalProps) {
  const createApp = useMutation(api.apps.createApp);

  const [name, setName] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [desc, setDesc] = useState("");

  const submit = async () => {
    await createApp({ name, region });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[420px] p-6 space-y-5 rounded-xl shadow-xl border border-border bg-card">
        <DialogTitle className="text-xl font-semibold text-primary">
          Create App
        </DialogTitle>

        <DialogDescription className="text-sm text-primary/60">
          Enter details for your new Convex App.
        </DialogDescription>

        {/* Name */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-primary">App name</label>
          <input
            className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm focus:ring-2 focus:ring-primary/40"
            placeholder="My Amazing App"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Region */}
    <div className="space-y-1">
    <label className="text-sm font-medium text-primary">Region</label>

    <select
        className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm focus:ring-2 focus:ring-primary/40"
        value={region}
        onChange={(e) => setRegion(e.target.value)}
    >
        {/* 🇻🇳 VIETNAM REGIONS */}
        <option value="vn-central-1">🇻🇳 Vietnam Central (Hanoi)</option>
        <option value="vn-south-1">🇻🇳 Vietnam South (Ho Chi Minh)</option>

        {/* 🇺🇸 US REGIONS */}
        <option value="us-east-1">🇺🇸 US East (N. Virginia)</option>
        <option value="us-west-1">🇺🇸 US West (California)</option>

        {/* 🇪🇺 EU REGIONS */}
        <option value="eu-west-1">🇪🇺 EU West (Ireland)</option>
        <option value="eu-central-1">🇩🇪 EU Central (Frankfurt)</option>

        {/* 🌏 ASIA PACIFIC */}
        <option value="ap-southeast-1">🇸🇬 AP Southeast (Singapore)</option>
        <option value="ap-northeast-1">🇯🇵 AP Northeast (Tokyo)</option>
        <option value="ap-south-1">🇮🇳 AP South (Mumbai)</option>
    </select>
    </div>


        {/* Description */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-primary">Description</label>
          <textarea
            className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm focus:ring-2 focus:ring-primary/40"
            placeholder="Short description for your app…"
            rows={3}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>

        <Button onClick={submit} className="w-full mt-3">
          Create App
        </Button>
      </DialogContent>
    </Dialog>
  );
}
