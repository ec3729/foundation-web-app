import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, RefreshCw, Database, ArrowLeftRight } from "lucide-react";

const TABLES = [
  "zones",
  "storefronts",
  "businesses",
  "volunteers",
  "corrections",
  "canvassing_sessions",
  "volunteer_sessions",
] as const;

type TableName = (typeof TABLES)[number];

export default function DataPage() {
  const { toast } = useToast();

  // CSV state
  const [csvExporting, setCsvExporting] = useState<string | null>(null);
  const [csvImportTable, setCsvImportTable] = useState<TableName>("zones");
  const [csvPreview, setCsvPreview] = useState<any[] | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Airtable state
  const [atBaseId, setAtBaseId] = useState("");
  const [atTableName, setAtTableName] = useState("");
  const [atTargetTable, setAtTargetTable] = useState<TableName>("zones");
  const [atSourceTable, setAtSourceTable] = useState<TableName>("zones");
  const [atImportPreview, setAtImportPreview] = useState<any[] | null>(null);
  const [atLoading, setAtLoading] = useState(false);

  // ─── CSV Export ───
  async function handleCsvExport(table: TableName) {
    setCsvExporting(table);
    try {
      const { data, error } = await supabase.from(table).select("*");
      if (error) throw error;
      if (!data || data.length === 0) {
        toast({ title: "No data", description: `Table "${table}" is empty.` });
        return;
      }
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${table}_export.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exported", description: `${data.length} rows from "${table}".` });
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    } finally {
      setCsvExporting(null);
    }
  }

  // ─── CSV Import ───
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvPreview(results.data as any[]);
      },
      error: (err) => {
        toast({ title: "Parse error", description: err.message, variant: "destructive" });
      },
    });
  }

  async function handleCsvImport() {
    if (!csvPreview || csvPreview.length === 0) return;
    setCsvImporting(true);
    try {
      // Remove empty string values, convert "null" strings
      const cleaned = csvPreview.map((row) => {
        const out: any = {};
        for (const [k, v] of Object.entries(row)) {
          if (v === "" || v === "null") out[k] = null;
          else out[k] = v;
        }
        // Remove id if auto-generated to avoid conflicts
        if (out.id === null) delete out.id;
        return out;
      });

      const { error } = await supabase.from(csvImportTable).upsert(cleaned as any);
      if (error) throw error;
      toast({ title: "Imported", description: `${cleaned.length} rows into "${csvImportTable}".` });
      setCsvPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: any) {
      toast({ title: "Import failed", description: e.message, variant: "destructive" });
    } finally {
      setCsvImporting(false);
    }
  }

  // ─── Airtable Import (pull from Airtable) ───
  async function handleAirtableImport() {
    if (!atBaseId || !atTableName) {
      toast({ title: "Missing config", description: "Enter Airtable Base ID and Table Name.", variant: "destructive" });
      return;
    }
    setAtLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("airtable-sync", {
        body: { action: "import", baseId: atBaseId, tableName: atTableName },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setAtImportPreview(data.records);
      toast({ title: "Fetched from Airtable", description: `${data.count} records loaded. Review and confirm.` });
    } catch (e: any) {
      toast({ title: "Airtable import failed", description: e.message, variant: "destructive" });
    } finally {
      setAtLoading(false);
    }
  }

  async function confirmAirtableImport() {
    if (!atImportPreview || atImportPreview.length === 0) return;
    setAtLoading(true);
    try {
      // Strip airtableId before inserting
      const rows = atImportPreview.map(({ airtableId, ...rest }) => {
        const out: any = {};
        for (const [k, v] of Object.entries(rest)) {
          out[k] = v === "" ? null : v;
        }
        if (out.id === null || out.id === undefined) delete out.id;
        return out;
      });
      const { error } = await supabase.from(atTargetTable).upsert(rows as any);
      if (error) throw error;
      toast({ title: "Imported", description: `${rows.length} records into "${atTargetTable}".` });
      setAtImportPreview(null);
    } catch (e: any) {
      toast({ title: "Import failed", description: e.message, variant: "destructive" });
    } finally {
      setAtLoading(false);
    }
  }

  // ─── Airtable Export (push to Airtable) ───
  async function handleAirtableExport() {
    if (!atBaseId || !atTableName) {
      toast({ title: "Missing config", description: "Enter Airtable Base ID and Table Name.", variant: "destructive" });
      return;
    }
    setAtLoading(true);
    try {
      const { data: rows, error: fetchErr } = await supabase.from(atSourceTable).select("*");
      if (fetchErr) throw fetchErr;
      if (!rows || rows.length === 0) {
        toast({ title: "No data", description: `Table "${atSourceTable}" is empty.` });
        setAtLoading(false);
        return;
      }
      // Remove internal id before pushing
      const cleaned = rows.map(({ id, ...rest }) => rest);

      const { data, error } = await supabase.functions.invoke("airtable-sync", {
        body: { action: "export", baseId: atBaseId, tableName: atTableName, records: cleaned },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      toast({ title: "Exported to Airtable", description: `${data.created} records pushed.` });
    } catch (e: any) {
      toast({ title: "Airtable export failed", description: e.message, variant: "destructive" });
    } finally {
      setAtLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-yellow-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">Data Management</h1>
          <p className="text-muted-foreground">
            Import and export data between your database and Airtable via CSV or direct API.
          </p>
        </div>

        <Tabs defaultValue="csv" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="csv" className="gap-2">
              <Database className="h-4 w-4" /> CSV
            </TabsTrigger>
            <TabsTrigger value="airtable" className="gap-2">
              <ArrowLeftRight className="h-4 w-4" /> Airtable
            </TabsTrigger>
          </TabsList>

          {/* ─── CSV Tab ─── */}
          <TabsContent value="csv" className="space-y-6">
            {/* Export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" /> Export to CSV
                </CardTitle>
                <CardDescription>Download any table as a CSV file.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {TABLES.map((t) => (
                    <Button
                      key={t}
                      variant="outline"
                      onClick={() => handleCsvExport(t)}
                      disabled={csvExporting === t}
                      className="justify-start"
                    >
                      {csvExporting === t ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {t}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Import */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" /> Import from CSV
                </CardTitle>
                <CardDescription>Upload a CSV file to upsert into a table.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={csvImportTable}
                    onChange={(e) => setCsvImportTable(e.target.value as TableName)}
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {TABLES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <Input ref={fileRef} type="file" accept=".csv" onChange={handleFileSelect} />
                </div>

                {csvPreview && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Preview: <strong>{csvPreview.length}</strong> rows,{" "}
                      <strong>{Object.keys(csvPreview[0] || {}).length}</strong> columns
                    </p>
                    <div className="max-h-48 overflow-auto rounded border">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted">
                            {Object.keys(csvPreview[0] || {}).map((col) => (
                              <th key={col} className="px-2 py-1 text-left font-medium">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreview.slice(0, 5).map((row, i) => (
                            <tr key={i} className="border-t">
                              {Object.values(row).map((v, j) => (
                                <td key={j} className="px-2 py-1 truncate max-w-[150px]">
                                  {String(v ?? "")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleCsvImport} disabled={csvImporting}>
                        {csvImporting && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}
                        Import {csvPreview.length} rows into {csvImportTable}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setCsvPreview(null);
                          if (fileRef.current) fileRef.current.value = "";
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Airtable Tab ─── */}
          <TabsContent value="airtable" className="space-y-6">
            {/* Config */}
            <Card>
              <CardHeader>
                <CardTitle>Airtable Connection</CardTitle>
                <CardDescription>
                  Enter your Airtable Base ID (starts with "app…") and the table name. Your Personal Access Token
                  should be configured as a project secret.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="Base ID (e.g. appXXXXXXXXXX)"
                    value={atBaseId}
                    onChange={(e) => setAtBaseId(e.target.value)}
                  />
                  <Input
                    placeholder="Table Name"
                    value={atTableName}
                    onChange={(e) => setAtTableName(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Import from Airtable */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" /> Import from Airtable
                </CardTitle>
                <CardDescription>Pull records from Airtable into your database.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">Target table</label>
                    <select
                      value={atTargetTable}
                      onChange={(e) => setAtTargetTable(e.target.value as TableName)}
                      className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {TABLES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button onClick={handleAirtableImport} disabled={atLoading} className="mt-5">
                    {atLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                    Fetch from Airtable
                  </Button>
                </div>

                {atImportPreview && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Fetched <strong>{atImportPreview.length}</strong> records. Review below, then confirm import
                      into <strong>{atTargetTable}</strong>.
                    </p>
                    <div className="max-h-48 overflow-auto rounded border">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted">
                            {Object.keys(atImportPreview[0] || {}).map((col) => (
                              <th key={col} className="px-2 py-1 text-left font-medium">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {atImportPreview.slice(0, 5).map((row, i) => (
                            <tr key={i} className="border-t">
                              {Object.values(row).map((v, j) => (
                                <td key={j} className="px-2 py-1 truncate max-w-[150px]">
                                  {String(v ?? "")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={confirmAirtableImport} disabled={atLoading}>
                        {atLoading && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}
                        Confirm Import ({atImportPreview.length} records)
                      </Button>
                      <Button variant="ghost" onClick={() => setAtImportPreview(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Export to Airtable */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" /> Export to Airtable
                </CardTitle>
                <CardDescription>Push records from your database to Airtable.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">Source table</label>
                    <select
                      value={atSourceTable}
                      onChange={(e) => setAtSourceTable(e.target.value as TableName)}
                      className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {TABLES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button onClick={handleAirtableExport} disabled={atLoading} className="mt-5">
                    {atLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                    Push to Airtable
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
