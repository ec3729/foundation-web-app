import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const airtablePat = Deno.env.get("AIRTABLE_PAT");
    if (!airtablePat) {
      return new Response(
        JSON.stringify({ error: "AIRTABLE_PAT secret is not configured. Please add it in project settings." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action, baseId, tableName, records } = body;

    if (!baseId || !tableName) {
      return new Response(
        JSON.stringify({ error: "baseId and tableName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const airtableBase = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
    const headers = {
      Authorization: `Bearer ${airtablePat}`,
      "Content-Type": "application/json",
    };

    if (action === "import") {
      // Fetch all records from Airtable (handles pagination)
      let allRecords: any[] = [];
      let offset: string | undefined;

      do {
        const url = offset ? `${airtableBase}?offset=${offset}` : airtableBase;
        const res = await fetch(url, { headers });
        if (!res.ok) {
          const errText = await res.text();
          return new Response(
            JSON.stringify({ error: `Airtable API error: ${res.status} ${errText}` }),
            { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const data = await res.json();
        allRecords = allRecords.concat(
          data.records.map((r: any) => ({ airtableId: r.id, ...r.fields }))
        );
        offset = data.offset;
      } while (offset);

      return new Response(
        JSON.stringify({ records: allRecords, count: allRecords.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "export") {
      if (!records || !Array.isArray(records)) {
        return new Response(
          JSON.stringify({ error: "records array is required for export" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Airtable limits to 10 records per request
      const results: any[] = [];
      for (let i = 0; i < records.length; i += 10) {
        const batch = records.slice(i, i + 10).map((r: any) => ({
          fields: r,
        }));

        const res = await fetch(airtableBase, {
          method: "POST",
          headers,
          body: JSON.stringify({ records: batch }),
        });

        if (!res.ok) {
          const errText = await res.text();
          return new Response(
            JSON.stringify({
              error: `Airtable API error on batch ${Math.floor(i / 10) + 1}: ${res.status} ${errText}`,
              created: results.length,
            }),
            { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const data = await res.json();
        results.push(...data.records);
      }

      return new Response(
        JSON.stringify({ created: results.length, records: results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "import" or "export".' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
