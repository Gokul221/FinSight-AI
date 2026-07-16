import "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import { read, utils } from "xlsx";

export type SupportedDocumentType = "PDF" | "CSV" | "XLSX" | "TXT";

export async function extractText(buffer: Buffer, type: SupportedDocumentType): Promise<string> {
  switch (type) {
    case "PDF": {
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        return result.text;
      } finally {
        await parser.destroy();
      }
    }
    case "XLSX": {
      const workbook = read(buffer);
      return workbook.SheetNames.map((name) => {
        const sheet = workbook.Sheets[name];
        return `Sheet: ${name}\n${utils.sheet_to_csv(sheet)}`;
      }).join("\n\n");
    }
    case "CSV":
    case "TXT":
      return buffer.toString("utf-8");
  }
}
