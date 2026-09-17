export type ExtractionResult = { provider: "real" | "demo"; name?: string; rollNumber?: string; college?: string; department?: string; confidence?: number };
export interface DocumentExtractionProvider { extractCollegeId(file: File): Promise<ExtractionResult>; }

class DemoExtractionProvider implements DocumentExtractionProvider {
  async extractCollegeId(): Promise<ExtractionResult> { return { provider: "demo" }; }
}

class HttpExtractionProvider implements DocumentExtractionProvider {
  async extractCollegeId(file: File): Promise<ExtractionResult> {
    const response = await fetch(process.env.OCR_API_URL!, { method: "POST", headers: { authorization: `Bearer ${process.env.OCR_API_KEY!}`, "content-type": file.type }, body: await file.arrayBuffer() });
    if (!response.ok) throw new Error("OCR provider request failed");
    return { provider: "real", ...(await response.json() as Omit<ExtractionResult, "provider">) };
  }
}

export function getDocumentExtractionProvider(): DocumentExtractionProvider { return process.env.OCR_PROVIDER === "http" ? new HttpExtractionProvider() : new DemoExtractionProvider(); }
