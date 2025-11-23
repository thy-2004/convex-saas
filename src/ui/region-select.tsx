import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/ui/select";

const REGIONS = [
  { code: "vn-vncentral-1", emoji: "🇻🇳", label: "Vietnam Central (Hanoi)" },
  { code: "vn-vnsouth-1", emoji: "🇻🇳", label: "Vietnam South (Ho Chi Minh)" },
  { code: "us-east-1", emoji: "🇺🇸", label: "US East (N. Virginia)" },
  { code: "us-west-1", emoji: "🇺🇸", label: "US West (California)" },
  { code: "eu-west-1", emoji: "🇪🇺", label: "EU West (Ireland)" },
  { code: "eu-central-1", emoji: "🇪🇺", label: "EU Central (Frankfurt)" },
  { code: "sg-southeast-1", emoji: "🇸🇬", label: "AP Southeast (Singapore)" },
  { code: "jp-northeast-1", emoji: "🇯🇵", label: "AP Northeast (Tokyo)" },
  { code: "in-south-1", emoji: "🇮🇳", label: "AP South (Mumbai)" },
];

export function RegionSelect({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full bg-black/40 border-emerald-600/30 text-emerald-200 shadow-inner shadow-emerald-700/20 hover:border-emerald-400 transition-all">
        <SelectValue placeholder="Select region..." />
      </SelectTrigger>

      <SelectContent className="bg-black/80 border border-emerald-600/20 text-emerald-200 shadow-xl shadow-emerald-700/30 backdrop-blur-md">
        {REGIONS.map((r) => (
          <SelectItem
            key={r.code}
            value={r.code}
            className="cursor-pointer text-emerald-200 hover:bg-emerald-600/20 focus:bg-emerald-600/25 flex items-center gap-2"
          >
            <span className="text-lg">{r.emoji}</span>
            <span className="font-medium">{r.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
