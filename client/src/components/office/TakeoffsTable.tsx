import type { ExtractedTakeoff, ProjectFileRecord } from "@shared/office";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { newTakeoffRow } from "@/lib/office";

type TakeoffsTableProps = {
  files: ProjectFileRecord[];
  takeoffs: ExtractedTakeoff[];
  setTakeoffs: (takeoffs: ExtractedTakeoff[]) => void;
};

export function TakeoffsTable({ files, takeoffs, setTakeoffs }: TakeoffsTableProps) {
  const updateTakeoff = (id: string, updater: (takeoff: ExtractedTakeoff) => ExtractedTakeoff) => {
    setTakeoffs(takeoffs.map((takeoff) => (takeoff.id === id ? updater(takeoff) : takeoff)));
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border bg-background">
        <Table className="min-w-[1120px]">
          <TableHeader>
            <TableRow>
              <TableHead>Approved</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Sq Ft</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {takeoffs.map((takeoff) => (
              <TableRow key={takeoff.id}>
                <TableCell>
                  <Checkbox
                    checked={takeoff.approved}
                    onCheckedChange={(checked) =>
                      updateTakeoff(takeoff.id, (current) => ({
                        ...current,
                        approved: Boolean(checked),
                      }))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input className="min-w-[150px]" value={takeoff.roomName} onChange={(event) => updateTakeoff(takeoff.id, (current) => ({ ...current, roomName: event.target.value }))} />
                </TableCell>
                <TableCell>
                  <Input className="min-w-[140px]" value={takeoff.levelName} onChange={(event) => updateTakeoff(takeoff.id, (current) => ({ ...current, levelName: event.target.value }))} />
                </TableCell>
                <TableCell>
                  <Input className="min-w-[120px]" value={takeoff.materialHint} onChange={(event) => updateTakeoff(takeoff.id, (current) => ({ ...current, materialHint: event.target.value }))} />
                </TableCell>
                <TableCell>
                  <Input
                    className="min-w-[100px]"
                    type="number"
                    min="0"
                    step="0.01"
                    value={takeoff.squareFeet}
                    onChange={(event) => updateTakeoff(takeoff.id, (current) => ({ ...current, squareFeet: Number(event.target.value) || 0 }))}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="min-w-[100px]"
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={takeoff.confidence}
                    onChange={(event) => updateTakeoff(takeoff.id, (current) => ({ ...current, confidence: Number(event.target.value) || 0 }))}
                  />
                </TableCell>
                <TableCell>
                  <div className="min-w-[280px] space-y-2">
                    <select
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={takeoff.sourceFileId || ""}
                      onChange={(event) => updateTakeoff(takeoff.id, (current) => ({ ...current, sourceFileId: event.target.value || null }))}
                    >
                      <option value="">No source file</option>
                      {files.map((file) => (
                        <option key={file.id} value={file.id}>
                          {file.originalName}
                        </option>
                      ))}
                    </select>
                    <Input
                      value={takeoff.sourceReference}
                      placeholder="Reference"
                      onChange={(event) => updateTakeoff(takeoff.id, (current) => ({ ...current, sourceReference: event.target.value }))}
                    />
                    <Input
                      value={takeoff.notes}
                      placeholder="Notes"
                      onChange={(event) => updateTakeoff(takeoff.id, (current) => ({ ...current, notes: event.target.value }))}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Button variant="outline" onClick={() => setTakeoffs([...takeoffs, newTakeoffRow(files[0]?.id || null)])}>
        <Plus className="mr-2 h-4 w-4" />
        Add Takeoff Row
      </Button>
    </div>
  );
}
