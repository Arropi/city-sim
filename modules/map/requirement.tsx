import { INFORMASI_PERUMAHAN_ITEMS } from "@/constants/helper";
import { BookOpen } from "lucide-react";

export default function RequirementPanel() {
  return (
    <div>
      <div className="flex gap-1 items-center">
        <BookOpen /> <span>Syarat Pembangunan</span>
      </div>
      <ol className="list-decimal list-outside pl-5 space-y-1.5 text-sm text-muted-foreground mt-2">
        {INFORMASI_PERUMAHAN_ITEMS.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ol>
    </div>
  );
}
