import { Badge } from "@/components/ui/badge";
import { formatConcreteVolume } from "@/lib/utils/format";

export function RemainingConcreteBadge({
  estimatedTotalConcrete,
  totalConcretePoured,
}: {
  estimatedTotalConcrete: number;
  totalConcretePoured: number;
}) {
  const remainingConcrete = estimatedTotalConcrete - totalConcretePoured;

  if (remainingConcrete <= 0) {
    return (
      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
        Complete or Over Target
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
      {formatConcreteVolume(remainingConcrete)} Remaining
    </Badge>
  );
}
