import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ProductSpecifications({
  specs,
  description,
}: {
  specs: { id: number; label: string; value: string }[];
  description: string | null;
}) {
  if (specs.length === 0 && !description) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Specifications</h2>

      {specs.length > 0 && (
        <div className="border rounded-lg overflow-hidden mb-6 max-w-2xl">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead className="w-1/3">Attribute</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {specs.map((spec) => (
                <TableRow key={spec.id}>
                  <TableCell className="font-medium">{spec.label}</TableCell>
                  <TableCell className="text-muted-foreground">{spec.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {description && (
        <div className="prose prose-neutral max-w-none text-muted-foreground">
          <h3 className="text-lg font-semibold text-foreground">About this product</h3>
          {description.split(/\n{2,}/).map((para, index) => (
            <p key={index} className="whitespace-pre-line">
              {para}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
