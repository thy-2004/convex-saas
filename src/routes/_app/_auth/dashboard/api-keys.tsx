// "use client";

// import { useState } from "react";
// import { useMutation, useQuery } from "convex/react";
// import { api } from "../../../../convex/_generated/api";


// import { Plus, Copy, Trash } from "lucide-react";

// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/ui/dialog";

// import { Input } from "@/ui/input";
// import { Button } from "@/ui/button";
// import { Label } from "@/ui/label";



// export default function ApiKeysPage() {
//   const appKeys = useQuery(api.apiKeys.listAppKeys);
//   const createKey = useMutation(api.apiKeys.createAppKey);
//   const deleteKey = useMutation(api.apiKeys.deleteAppKey);

//   const [open, setOpen] = useState(false);
//   const [name, setName] = useState("");
//   const [description, setDescription] = useState("");

//   const handleCreate = async () => {
//     try {
//       const res = await createKey({ name, description });
//       toast.success("API Key created!");

//       navigator.clipboard.writeText(res.apiKey);
//       toast.info("Copied API Key to clipboard");

//       setOpen(false);
//       setName("");
//       setDescription("");
//     } catch (err: any) {
//       toast.error(err.message);
//     }
//   };

//   if (!appKeys) return <p>Loading...</p>;

//   return (
//     <div className="p-6 space-y-6">
//       <div className="flex justify-between items-center">
//         <h1 className="text-xl font-bold">API Keys</h1>
//         <Button onClick={() => setOpen(true)}>
//           <Plus className="w-4 h-4 mr-2" />
//           New API Key
//         </Button>
//       </div>

//       {/* LIST KEYS */}
//       <div className="space-y-3">
//         {appKeys.length === 0 && (
//           <p className="text-gray-400">No API keys created yet.</p>
//         )}

//         {appKeys.map((k) => (
//           <div
//             key={k._id}
//             className="p-4 border rounded-lg flex justify-between items-center"
//           >
//             <div>
//               <p className="font-semibold">{k.name}</p>
//               <p className="text-sm text-gray-400">{k.key}</p>
//             </div>

//             <div className="flex gap-3">
//               <Button
//                 variant="outline"
//                 onClick={() => {
//                   navigator.clipboard.writeText(k.key);
//                   toast.success("Copied!");
//                 }}
//               >
//                 <Copy className="w-4 h-4" />
//               </Button>

//               <Button
//                 variant="destructive"
//                 onClick={() => deleteKey({ id: k._id })}
//               >
//                 <Trash className="w-4 h-4" />
//               </Button>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* CREATE KEY DIALOG */}
//       <Dialog open={open} onOpenChange={setOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Create API Key</DialogTitle>
//           </DialogHeader>

//           <div className="space-y-4 mt-2">
//             <div>
//               <Label>Name</Label>
//               <Input
//                 placeholder="My App"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//               />
//             </div>

//             <div>
//               <Label>Description</Label>
//               <Input
//                 placeholder="Description (optional)"
//                 value={description}
//                 onChange={(e) => setDescription(e.target.value)}
//               />
//             </div>

//             <Button className="w-full" onClick={handleCreate}>
//               Create
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }
