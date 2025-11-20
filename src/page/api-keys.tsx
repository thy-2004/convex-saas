"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

import { Plus, Copy, Trash } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";

export default function ApiKeysPage() {
  const appKeys = useQuery(api.apiKeys.listAppKeys);
  const createAppKey = useMutation(api.apiKeys.createAppKey);
  const deleteAppKey = useMutation(api.apiKeys.deleteAppKey);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("App name is required");
      return;
    }

    try {
      const res = await createAppKey({ name, description });
      toast.success("API key created, copied to clipboard!");

      // res.apiKey từ mutation
      if (res?.apiKey) {
        navigator.clipboard.writeText(res.apiKey);
      }

      setName("");
      setDescription("");
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create API key");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAppKey({ id });
      toast.success("API key deleted");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete key");
    }
  }

  function handleCopy(key: string) {
    navigator.clipboard.writeText(key);
    toast.success("Copied to clipboard");
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-sm text-neutral-400">
            Create App Clients and manage their secret API keys.
          </p>
        </div>

        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create App
        </Button>
      </div>

      {/* List keys */}
      <div className="space-y-4">
        {appKeys === undefined && (
          <div className="text-sm text-neutral-400">Loading...</div>
        )}

        {appKeys?.length === 0 && (
          <div className="text-sm text-neutral-400">
            No API keys yet. Click &quot;Create App&quot; to generate one.
          </div>
        )}

        {appKeys?.map((key) => (
          <div
            key={key._id}
            className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3"
          >
            <div>
              <div className="font-semibold">{key.name}</div>
              <div className="text-xs text-neutral-400 break-all">
                {key.key}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleCopy(key.key)}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="destructive"
                onClick={() => handleDelete(key._id)}
              >
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog tạo App */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create App Client</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label htmlFor="name">App name</Label>
              <Input
                id="name"
                placeholder="My Mobile App"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Optional"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Button className="w-full" onClick={handleCreate}>
              Create &amp; Generate API Key
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
