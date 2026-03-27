"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ImportResult {
  imported: number;
  errors: number;
  errorDetails: string[];
  total: number;
}

const SAMPLE_CSV = `title,price,cost,category,image,sku,stock,tags
"Wireless Bluetooth Earbuds",24.99,8.99,Electronics,https://example.com/earbuds.jpg,WBE-001,100,"electronics,audio,wireless"
"LED Ring Light 10 inch",19.99,7.50,Electronics,https://example.com/ringlight.jpg,LRL-010,50,"lighting,photography"
"Phone Mount Car Holder",12.99,3.25,Auto,https://example.com/mount.jpg,PMC-001,200,"auto,phone,accessories"
"Portable Blender USB",29.99,11.00,Home,https://example.com/blender.jpg,PBU-001,75,"kitchen,portable,blender"`;

export default function CsvImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string[][]>([]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.endsWith(".csv")) {
      setError("Please select a CSV file");
      return;
    }

    setFile(selected);
    setError("");
    setResult(null);

    // Preview first few lines
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n").slice(0, 6);
      const parsed = lines.map((line) =>
        line.split(",").map((cell) => cell.trim().replace(/^["']|["']$/g, ""))
      );
      setPreview(parsed);
    };
    reader.readAsText(selected);
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import/csv", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.ok) {
        setResult(json.data);
      } else {
        setError(json.error || "Import failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "opticart-sample-import.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Import Products from CSV</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Upload a CSV file to bulk import products from any source
        </p>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">CSV Format</CardTitle>
          <CardDescription className="text-xs">
            Your CSV should have these columns (first row as headers):
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[
              { name: "title", required: true },
              { name: "price", required: true },
              { name: "cost", required: false },
              { name: "category", required: false },
              { name: "image", required: false },
              { name: "sku", required: false },
              { name: "stock", required: false },
              { name: "tags", required: false },
              { name: "description", required: false },
              { name: "source_url", required: false },
            ].map((col) => (
              <Badge
                key={col.name}
                variant={col.required ? "default" : "secondary"}
                className="text-xs"
              >
                {col.name}
                {col.required && <span className="ml-0.5 text-red-300">*</span>}
              </Badge>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={downloadSample} className="gap-1.5">
            <Download className="h-3 w-3" />
            Download Sample CSV
          </Button>
        </CardContent>
      </Card>

      {/* Upload area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          file ? "border-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/10" : "border-zinc-300 dark:border-zinc-700"
        }`}
      >
        <CardContent className="py-8">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!file ? (
            <div
              className="flex flex-col items-center cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <div className="rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
                <Upload className="h-8 w-8 text-zinc-400" />
              </div>
              <p className="mt-3 text-sm font-medium">Click to upload CSV file</p>
              <p className="mt-1 text-xs text-zinc-400">or drag and drop</p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-emerald-100 p-3 dark:bg-emerald-900/30">
                <FileSpreadsheet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-zinc-400">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setPreview([]);
                  setResult(null);
                }}
              >
                Remove
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {preview.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Preview</CardTitle>
            <CardDescription className="text-xs">
              Showing first {Math.min(5, preview.length - 1)} rows
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-zinc-50 dark:bg-zinc-800/50">
                    {preview[0]?.map((header, i) => (
                      <th key={i} className="px-3 py-2 text-left font-medium text-zinc-500">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(1).map((row, i) => (
                    <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800">
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-2 text-zinc-600 dark:text-zinc-400 max-w-[150px] truncate">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
          <XCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <Card className={result.errors > 0 ? "border-amber-200" : "border-emerald-200"}>
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              {result.errors === 0 ? (
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              )}
              <div>
                <p className="text-lg font-semibold">
                  {result.imported} products imported
                </p>
                <p className="text-sm text-zinc-500">
                  Out of {result.total} total rows
                  {result.errors > 0 && ` (${result.errors} errors)`}
                </p>
              </div>
            </div>
            {result.errorDetails.length > 0 && (
              <div className="mt-3 space-y-1">
                {result.errorDetails.map((err, i) => (
                  <p key={i} className="text-xs text-red-600 dark:text-red-400">
                    {err}
                  </p>
                ))}
              </div>
            )}
            <Button
              className="mt-4 gap-1.5"
              onClick={() => (window.location.href = "/products")}
            >
              View Products
              <ArrowRight className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Import button */}
      {file && !result && (
        <Button
          onClick={handleImport}
          disabled={importing}
          className="w-full gap-2"
          size="lg"
        >
          {importing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Import Products
            </>
          )}
        </Button>
      )}
    </div>
  );
}
