import { SearchIcon } from "../../../shared/ui/Icons";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search folders or files",
}: SearchInputProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-3 py-2 text-sm">
      <SearchIcon />
      <input
        className="w-44 bg-transparent text-sm outline-none placeholder-muted focus:placeholder-transparent transition"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
