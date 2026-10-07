import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, name } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const RESEND_AUDIENCE_ID = Deno.env.get("RESEND_AUDIENCE_ID");

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Email service not configured. Set RESEND_API_KEY secret." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: authUser } = await supabase.auth.getUser(
      req.headers.get("Authorization")?.replace("Bearer ", "") ?? ""
    );

    const userId = authUser?.user?.id;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("marketing_consent")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.marketing_consent) {
      return new Response(
        JSON.stringify({ error: "Marketing consent not given" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contactPayload: Record<string, unknown> = {
      email,
      first_name: name || undefined,
      unsubscribed: false,
    };

    if (RESEND_AUDIENCE_ID) {
      contactPayload.audience_id = RESEND_AUDIENCE_ID;
    }

    const resendResponse = await fetch("https://api.resend.com/contacts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contactPayload),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      return new Response(
        JSON.stringify({ error: `Resend API error: ${errorText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Subscribed to marketing list" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
