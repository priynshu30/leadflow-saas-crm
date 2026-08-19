"use client";

import React, { useState, useRef, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  ArrowRight,
} from "lucide-react";

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/settings/business")
        .then((res) => res.json())
        .then((data) => {
          if (data.settings) setBusinessSettings(data.settings);
        })
        .catch(() => {});
      setFile(null);
      setParsedRows([]);
      setImportResult(null);
    }
  }, [isOpen]);

  const handleDownloadTemplate = async () => {
    try {
      const XLSX = await import("xlsx");

      const f1 = businessSettings?.field1Label || "Requirement 1";
      const f2 = businessSettings?.field2Label || "Requirement 2";
      const f3 = businessSettings?.field3Label || "Requirement 3";
      const f4 = businessSettings?.field4Label || "Requirement 4";

      const sampleData = [
        {
          "Lead Name": "Rahul Sharma",
          "Phone": "9876543210",
          "Email": "rahul.sharma@example.com",
          "Source": "99acres / MagicBricks",
          "Status": "NEW",
          [f1]: "3 BHK Apartment",
          [f2]: "Golf Course Road",
          [f3]: "3 BHK",
          [f4]: "₹1.8 Cr",
          "Notes": "Looking for ready to move property",
          "Next Follow Up (YYYY-MM-DD)": "2026-08-25",
        },
        {
          "Lead Name": "Pooja Verma",
          "Phone": "9811223344",
          "Email": "pooja.v@example.com",
          "Source": "Direct Call",
          "Status": "INTERESTED",
          [f1]: "4 BHK Villa",
          [f2]: "DLF Phase 5",
          [f3]: "4 BHK",
          [f4]: "₹3.5 Cr",
          "Notes": "Wants site visit on weekend",
          "Next Follow Up (YYYY-MM-DD)": "2026-08-26",
        },
      ];

      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leads Template");

      // Auto-fit column widths
      worksheet["!cols"] = [
        { wch: 18 },
        { wch: 14 },
        { wch: 24 },
        { wch: 18 },
        { wch: 12 },
        { wch: 20 },
        { wch: 20 },
        { wch: 14 },
        { wch: 14 },
        { wch: 30 },
        { wch: 26 },
      ];

      XLSX.writeFile(workbook, `LeadFlow_Sample_Import_Template.xlsx`);
      showToast("Sample Excel template downloaded!", "success");
    } catch (e: any) {
      showToast("Failed to generate Excel template", "error");
    }
  };

  const processFile = async (selectedFile: File) => {
    try {
      setLoading(true);
      const XLSX = await import("xlsx");
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (rawJson.length < 2) {
        showToast("The uploaded spreadsheet is empty or missing data rows", "error");
        setLoading(false);
        return;
      }

      const headers = rawJson[0].map((h: any) => h?.toString().trim().toLowerCase());
      const dataRows = rawJson.slice(1);

      // Find column indices
      const findIndex = (keywords: string[]) =>
        headers.findIndex((h) => keywords.some((k) => h?.includes(k)));

      const nameIdx = findIndex(["name", "lead name", "customer", "contact name"]);
      const phoneIdx = findIndex(["phone", "mobile", "contact", "number", "tel", "cell"]);
      const emailIdx = findIndex(["email", "mail"]);
      const sourceIdx = findIndex(["source", "channel", "origin", "platform"]);
      const statusIdx = findIndex(["status", "stage"]);
      const notesIdx = findIndex(["notes", "note", "comment", "remark", "description"]);
      const followupIdx = findIndex(["follow", "followup", "next follow", "date"]);

      // Map dynamic niche fields from remaining columns
      const f1Name = businessSettings?.field1Label?.toLowerCase();
      const f2Name = businessSettings?.field2Label?.toLowerCase();
      const f3Name = businessSettings?.field3Label?.toLowerCase();
      const f4Name = businessSettings?.field4Label?.toLowerCase();

      const f1Idx = f1Name ? findIndex([f1Name]) : 5;
      const f2Idx = f2Name ? findIndex([f2Name]) : 6;
      const f3Idx = f3Name ? findIndex([f3Name]) : 7;
      const f4Idx = f4Name ? findIndex([f4Name]) : 8;

      const formatted = dataRows
        .filter((row) => row && row.some((cell) => cell !== undefined && cell !== ""))
        .map((row) => {
          const rawName = nameIdx !== -1 ? row[nameIdx] : row[0];
          const rawPhone = phoneIdx !== -1 ? row[phoneIdx] : row[1];
          const rawEmail = emailIdx !== -1 ? row[emailIdx] : null;
          const rawSource = sourceIdx !== -1 ? row[sourceIdx] : "Excel Import";
          const rawStatus = statusIdx !== -1 ? row[statusIdx] : "NEW";
          const rawNotes = notesIdx !== -1 ? row[notesIdx] : null;
          const rawFollowup = followupIdx !== -1 ? row[followupIdx] : null;

          const f1Val = f1Idx !== -1 && f1Idx !== nameIdx && f1Idx !== phoneIdx ? row[f1Idx] : null;
          const f2Val = f2Idx !== -1 && f2Idx !== nameIdx && f2Idx !== phoneIdx ? row[f2Idx] : null;
          const f3Val = f3Idx !== -1 && f3Idx !== nameIdx && f3Idx !== phoneIdx ? row[f3Idx] : null;
          const f4Val = f4Idx !== -1 && f4Idx !== nameIdx && f4Idx !== phoneIdx ? row[f4Idx] : null;

          let nextFollowupAt = null;
          if (rawFollowup) {
            const parsedDate = new Date(rawFollowup);
            if (!isNaN(parsedDate.getTime())) {
              nextFollowupAt = parsedDate.toISOString();
            }
          }

          return {
            name: rawName ? rawName.toString().trim() : "",
            phone: rawPhone ? rawPhone.toString().trim() : "",
            email: rawEmail ? rawEmail.toString().trim() : null,
            source: rawSource ? rawSource.toString().trim() : "Excel Import",
            status: rawStatus ? rawStatus.toString().trim().toUpperCase() : "NEW",
            field1Value: f1Val ? f1Val.toString().trim() : null,
            field2Value: f2Val ? f2Val.toString().trim() : null,
            field3Value: f3Val ? f3Val.toString().trim() : null,
            field4Value: f4Val ? f4Val.toString().trim() : null,
            notes: rawNotes ? rawNotes.toString().trim() : null,
            nextFollowupAt,
            isValid: Boolean(rawName && rawPhone),
          };
        });

      setFile(selectedFile);
      setParsedRows(formatted);
      showToast(`Parsed ${formatted.length} rows from file`, "info");
    } catch (err: any) {
      showToast("Error reading spreadsheet: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleImportSubmit = async () => {
    const validLeads = parsedRows.filter((r) => r.isValid);
    if (validLeads.length === 0) {
      showToast("No valid leads found in file (Name and Phone required)", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leads: validLeads,
          skipDuplicates,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Import failed");
      }

      setImportResult(data);
      showToast(`Successfully imported ${data.imported} leads!`, "success");
      if (onSuccess) onSuccess();
    } catch (e: any) {
      showToast(e.message || "Failed to import leads", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Leads from Excel / CSV"
      description="Bulk upload prospects directly into your CRM database"
      maxWidth="xl"
    >
      <div className="space-y-5">
        {/* Step 1: Download Sample or Upload */}
        {!file && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-indigo-50/70 border border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-indigo-950">Download Standard Template</h4>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Pre-formatted columns including your business's custom requirement fields
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleDownloadTemplate}
                className="whitespace-nowrap bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
              >
                <Download className="h-4 w-4 mr-1.5" /> Download .XLSX
              </Button>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="h-12 w-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Click to select or drag & drop spreadsheet
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) files
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Preview Parsed Rows */}
        {file && !importResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-6 w-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-slate-900 truncate max-w-xs">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {parsedRows.length} total rows • {parsedRows.filter((r) => r.isValid).length} ready to import
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setParsedRows([]);
                }}
              >
                <X className="h-4 w-4 mr-1" /> Remove
              </Button>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                Skip duplicate phone numbers if already in CRM
              </label>
            </div>

            {/* Preview Table */}
            <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Phone</th>
                    <th className="p-2.5">{businessSettings?.field1Label || "Field 1"}</th>
                    <th className="p-2.5">{businessSettings?.field2Label || "Field 2"}</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.slice(0, 15).map((row, idx) => (
                    <tr key={idx} className={row.isValid ? "hover:bg-slate-50" : "bg-rose-50/50"}>
                      <td className="p-2.5 font-medium">{row.name || <span className="text-rose-500">Missing</span>}</td>
                      <td className="p-2.5 font-mono">{row.phone || <span className="text-rose-500">Missing</span>}</td>
                      <td className="p-2.5 truncate max-w-[120px]">{row.field1Value || "—"}</td>
                      <td className="p-2.5 truncate max-w-[120px]">{row.field2Value || "—"}</td>
                      <td className="p-2.5">{row.status || "NEW"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {parsedRows.length > 15 && (
              <p className="text-[11px] text-slate-400 text-center">
                Showing first 15 of {parsedRows.length} rows
              </p>
            )}

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleImportSubmit} loading={loading}>
                Import {parsedRows.filter((r) => r.isValid).length} Leads <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Success Report */}
        {importResult && (
          <div className="p-6 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Import Completed!</h3>
              <p className="text-xs text-slate-500 mt-1">Your leads have been added to the database.</p>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-md mx-auto text-center">
              <div>
                <span className="text-xs text-slate-500 font-medium">Total</span>
                <p className="text-lg font-bold text-slate-900">{importResult.total}</p>
              </div>
              <div>
                <span className="text-xs text-emerald-600 font-semibold">Imported</span>
                <p className="text-lg font-bold text-emerald-600">{importResult.imported}</p>
              </div>
              <div>
                <span className="text-xs text-amber-600 font-semibold">Duplicates Skipped</span>
                <p className="text-lg font-bold text-amber-600">{importResult.skippedDuplicates}</p>
              </div>
            </div>

            <Button onClick={onClose} className="w-full max-w-xs mx-auto">
              Done & View Leads
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
