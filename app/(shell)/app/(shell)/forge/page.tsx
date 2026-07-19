import { SectionPlaceholder } from "@/components/shell/section-placeholder";
import { sectionMeta } from "@/lib/sections";

export default function Page() {
  return <SectionPlaceholder {...sectionMeta.forge} />;
}
