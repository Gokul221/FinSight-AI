import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetText, mockDestroy, mockRead, mockSheetToCsv } = vi.hoisted(() => ({
  mockGetText: vi.fn(),
  mockDestroy: vi.fn(),
  mockRead: vi.fn(),
  mockSheetToCsv: vi.fn(),
}));

vi.mock("pdf-parse/worker", () => ({}));
vi.mock("pdf-parse", () => ({
  PDFParse: vi.fn().mockImplementation(function PDFParseMock() {
    return { getText: mockGetText, destroy: mockDestroy };
  }),
}));
vi.mock("xlsx", () => ({
  read: mockRead,
  utils: { sheet_to_csv: mockSheetToCsv },
}));

import { extractText } from "./documentParsing";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("extractText", () => {
  it("returns CSV and TXT buffers as plain utf-8 text", async () => {
    const buffer = Buffer.from("a,b,c\n1,2,3");
    expect(await extractText(buffer, "CSV")).toBe("a,b,c\n1,2,3");
    expect(await extractText(buffer, "TXT")).toBe("a,b,c\n1,2,3");
  });

  it("extracts PDF text via pdf-parse and always destroys the parser", async () => {
    mockGetText.mockResolvedValue({ text: "extracted pdf text" });

    const result = await extractText(Buffer.from("fake-pdf"), "PDF");

    expect(result).toBe("extracted pdf text");
    expect(mockDestroy).toHaveBeenCalledTimes(1);
  });

  it("destroys the PDF parser even if extraction throws", async () => {
    mockGetText.mockRejectedValue(new Error("corrupt pdf"));

    await expect(extractText(Buffer.from("fake-pdf"), "PDF")).rejects.toThrow("corrupt pdf");
    expect(mockDestroy).toHaveBeenCalledTimes(1);
  });

  it("converts every sheet of an XLSX workbook to labeled CSV text", async () => {
    mockRead.mockReturnValue({
      SheetNames: ["Sheet1", "Sheet2"],
      Sheets: { Sheet1: "sheet1-data", Sheet2: "sheet2-data" },
    });
    mockSheetToCsv.mockImplementation((sheet: string) => `csv:${sheet}`);

    const result = await extractText(Buffer.from("fake-xlsx"), "XLSX");

    expect(result).toBe("Sheet: Sheet1\ncsv:sheet1-data\n\nSheet: Sheet2\ncsv:sheet2-data");
  });
});
