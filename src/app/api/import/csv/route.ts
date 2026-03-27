import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/get-user";

export const dynamic = "force-dynamic";

interface CsvRow {
  title: string;
  description?: string;
  price: string;
  cost?: string;
  category?: string;
  image?: string;
  images?: string;
  sku?: string;
  stock?: string;
  tags?: string;
  sourceUrl?: string;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length < 2) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      if (idx < values.length) {
        row[h] = values[idx].trim();
      }
    });

    if (row.title || row.name || row.product_name) {
      rows.push({
        title: row.title || row.name || row.product_name || "",
        description: row.description || row.body || row.body_html || "",
        price: row.price || row.retail_price || row.sell_price || "0",
        cost: row.cost || row.supplier_cost || row.source_price || row.price || "0",
        category: row.category || row.type || row.product_type || "",
        image: row.image || row.image_url || row.main_image || "",
        images: row.images || row.image_urls || row.additional_images || "",
        sku: row.sku || row.variant_sku || "",
        stock: row.stock || row.inventory || row.quantity || "0",
        tags: row.tags || "",
        sourceUrl: row.source_url || row.url || row.link || "",
      });
    }
  }

  return rows;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.replace(/^["']|["']$/g, ""));
      current = "";
    } else {
      current += ch;
    }
  }

  result.push(current.replace(/^["']|["']$/g, ""));
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const { workspace } = await getWorkspace();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const csvText = formData.get("csv") as string | null;

    let text: string;
    if (file) {
      text = await file.text();
    } else if (csvText) {
      text = csvText;
    } else {
      return error("No CSV file or data provided", 400);
    }

    const rows = parseCsv(text);
    if (rows.length === 0) {
      return error("No valid rows found in CSV. Ensure the first row contains headers (title, price, etc.)", 400);
    }

    const imported: string[] = [];
    const errors: string[] = [];

    for (const row of rows.slice(0, 500)) {
      try {
        const images: string[] = [];
        if (row.image) images.push(row.image);
        if (row.images) {
          row.images.split(";").forEach((img) => {
            const trimmed = img.trim();
            if (trimmed) images.push(trimmed);
          });
        }

        const cost = parseFloat(row.cost || row.price) || 0;
        const retailPrice = parseFloat(row.price) || cost * 2.5;
        const tags = row.tags
          ? row.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [];

        const product = await db.product.create({
          data: {
            workspaceId: workspace.id,
            title: row.title,
            description: row.description || null,
            images: images,
            category: row.category || null,
            tags,
            status: "DRAFT",
            variants: {
              create: [
                {
                  name: "Default",
                  sku: row.sku || null,
                  supplierCost: cost,
                  retailPrice,
                  stock: parseInt(row.stock || "0") || 0,
                },
              ],
            },
          },
        });

        imported.push(product.id);
      } catch (err) {
        errors.push(`Row "${row.title}": ${err instanceof Error ? err.message : "unknown error"}`);
      }
    }

    return success({
      imported: imported.length,
      errors: errors.length,
      errorDetails: errors.slice(0, 10),
      total: rows.length,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
