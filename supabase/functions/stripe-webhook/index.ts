import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

type NowPaymentsIPNPayload = {
  payment_id?: number | string;
  payment_status?: string;
  pay_address?: string;
  price_amount?: number | string;
  price_currency?: string;
  pay_amount?: number | string;
  pay_currency?: string;
  actually_paid?: number | string;
  order_id?: string;
  order_description?: string;
  purchase_id?: string;
  invoice_id?: number | string;
  subscription_id?: number | string;
  ipn_type?: string;
  customer_email?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

type PaymentMetadata = {
  userId?: string;
  planId?: string;
  email?: string;
  isRecurring?: boolean;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-nowpayments-sig",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ACTIVE_STATUSES = new Set([
  "finished",
  "confirmed",
  "completed",
  "sending",
]);

const PENDING_STATUSES = new Set([
  "waiting",
  "confirming",
  "partially_paid",
  "pending",
]);

const log = (message: string, data?: Record<string, unknown>) => {
  console.log(`[NOWPAYMENTS-WEBHOOK] ${message}`, data ? JSON.stringify(data) : "");
};

const KNOWN_PLANS = ["standard", "premium", "ultimate", "free-trial"] as const;

type KnownPlan = typeof KNOWN_PLANS[number];

function normalizePlanId(plan: string): KnownPlan | undefined {
  const normalized = plan.toLowerCase().trim().replace(/[_\s]+/g, "-");
  if (KNOWN_PLANS.includes(normalized as KnownPlan)) {
    return normalized as KnownPlan;
  }
  if (["trial", "free", "free_trial", "free-trial-plan"].includes(normalized)) {
    return "free-trial";
  }
  if (["solo", "basic"].includes(normalized)) {
    return "standard";
  }
  if (["duo"].includes(normalized)) {
    return "premium";
  }
  if (["family"].includes(normalized)) {
    return "ultimate";
  }
  return undefined;
}

function detectPlanId(value: string): KnownPlan | undefined {
  const normalizedPlan = normalizePlanId(value);
  if (normalizedPlan) {
    return normalizedPlan;
  }

  const lower = value.toLowerCase();
  if (lower.includes("ultimate")) return "ultimate";
  if (lower.includes("premium") || lower.includes("duo")) return "premium";
  if (lower.includes("standard") || lower.includes("basic") || lower.includes("solo")) return "standard";
  if (lower.includes("trial") || lower.includes("free")) return "free-trial";

  return undefined;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function applyMetadataObject(source: Record<string, unknown>, metadata: PaymentMetadata) {
  for (const [key, value] of Object.entries(source)) {
    const normalizedKey = key.toLowerCase();

    if (typeof value === "string") {
      if (!metadata.userId && (normalizedKey === "user_id" || normalizedKey === "userid" || normalizedKey === "user")) {
        metadata.userId = value;
      }
      if (!metadata.userId && normalizedKey.endsWith("id") && isUuid(value)) {
        metadata.userId = value;
      }
      if (!metadata.planId) {
        if (["plan", "plan_id", "planid", "subscription_plan", "subscriptionplan", "subscription_tier", "subscriptiontier", "tier", "plan_type", "plantype"].includes(normalizedKey)) {
          const normalizedPlan = normalizePlanId(value);
          if (normalizedPlan) {
            metadata.planId = normalizedPlan;
          }
        } else {
          const detectedPlan = detectPlanId(value);
          if (detectedPlan) {
            metadata.planId = detectedPlan;
          }
        }
      }
      if (!metadata.email && normalizedKey.includes("email")) {
        metadata.email = value;
      }
    } else if (typeof value === "boolean") {
      if (normalizedKey.includes("recurring")) {
        metadata.isRecurring = value;
      }
    } else if (typeof value === "number") {
      if (normalizedKey.includes("recurring") && metadata.isRecurring === undefined) {
        metadata.isRecurring = value === 1;
      }
    } else if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item && typeof item === "object") {
          applyMetadataObject(item as Record<string, unknown>, metadata);
        }
      });
    } else if (value && typeof value === "object") {
      applyMetadataObject(value as Record<string, unknown>, metadata);
    }
  }
}

function parseMetadataString(source: string, metadata: PaymentMetadata) {
  const trimmed = source.trim();
  if (!trimmed) return;

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      parsed.forEach((item) => {
        if (item && typeof item === "object") {
          applyMetadataObject(item as Record<string, unknown>, metadata);
        }
      });
      return;
    }
    if (parsed && typeof parsed === "object") {
      applyMetadataObject(parsed as Record<string, unknown>, metadata);
      return;
    }
  } catch (_) {
    // Not JSON - continue parsing using heuristics
  }

  if (!metadata.userId && isUuid(trimmed)) {
    metadata.userId = trimmed;
  }

  const userMatch = trimmed.match(/user[_\s-]*id[:=]\s*([A-Za-z0-9-]+)/i);
  if (userMatch && !metadata.userId) {
    metadata.userId = userMatch[1];
  }

  const planMatch = trimmed.match(/plan[:=]\s*([A-Za-z-]+)/i);
  if (planMatch && !metadata.planId) {
    const normalizedPlan = normalizePlanId(planMatch[1]);
    if (normalizedPlan) {
      metadata.planId = normalizedPlan;
    }
  }

  const tierMatch = trimmed.match(/tier[:=]\s*([A-Za-z-]+)/i);
  if (tierMatch && !metadata.planId) {
    const normalizedPlan = normalizePlanId(tierMatch[1]);
    if (normalizedPlan) {
      metadata.planId = normalizedPlan;
    }
  }

  const detectedPlan = detectPlanId(trimmed);
  if (detectedPlan && !metadata.planId) {
    metadata.planId = detectedPlan;
  }

  const emailMatch = trimmed.match(/email[:=]\s*([^\s;|,]+)/i);
  if (emailMatch && !metadata.email) {
    metadata.email = emailMatch[1];
  }
}

function extractMetadata(payload: NowPaymentsIPNPayload): PaymentMetadata {
  const metadata: PaymentMetadata = {};
  const candidateStrings = [
    typeof payload.order_id === "string" ? payload.order_id : undefined,
    typeof payload.order_description === "string" ? payload.order_description : undefined,
    typeof payload.purchase_id === "string" ? payload.purchase_id : undefined,
    typeof payload.ipn_type === "string" ? payload.ipn_type : undefined,
  ];

  candidateStrings.forEach((candidate) => {
    if (candidate) {
      parseMetadataString(candidate, metadata);
    }
  });

  if (!metadata.email && typeof payload.customer_email === "string") {
    metadata.email = payload.customer_email;
  }

  if (!metadata.planId && payload.price_currency) {
    const planFromCurrency = detectPlanId(String(payload.price_currency));
    if (planFromCurrency) {
      metadata.planId = planFromCurrency;
    }
  }

  if (!metadata.planId && payload.order_description) {
    const planFromDescription = detectPlanId(payload.order_description);
    if (planFromDescription) {
      metadata.planId = planFromDescription;
    }
  }

  if (metadata.planId) {
    const normalizedPlan = normalizePlanId(metadata.planId);
    metadata.planId = normalizedPlan ?? metadata.planId;
    if (normalizedPlan === undefined) {
      const detectedPlan = detectPlanId(metadata.planId);
      metadata.planId = detectedPlan;
    }
  }

  return metadata;
}

function hexToUint8Array(hex: string): Uint8Array {
  const cleanHex = hex.replace(/[^0-9a-f]/gi, "");
  if (cleanHex.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
}

function signatureToUint8Array(signature: string): Uint8Array {
  const trimmed = signature.trim();
  try {
    return hexToUint8Array(trimmed);
  } catch (_) {
    try {
      const decoded = atob(trimmed);
      const bytes = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
      }
      return bytes;
    } catch (error) {
      throw new Error(`Unsupported signature encoding: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

async function verifySignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["verify"],
    );

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureToUint8Array(signature),
      encoder.encode(rawBody),
    );

    return isValid;
  } catch (error) {
    log("Failed to verify signature", { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}

function determineSubscriptionIdentifier(payload: NowPaymentsIPNPayload): string | null {
  const identifiers = [payload.subscription_id, payload.invoice_id, payload.purchase_id, payload.payment_id];
  for (const identifier of identifiers) {
    if (identifier !== undefined && identifier !== null) {
      return String(identifier);
    }
  }
  return null;
}

function mapNowPaymentsStatus(status: string | undefined) {
  const normalized = status ? status.toLowerCase() : "unknown";
  if (ACTIVE_STATUSES.has(normalized)) {
    return { subscriptionStatus: "active", normalizedStatus: normalized };
  }
  if (PENDING_STATUSES.has(normalized)) {
    return { subscriptionStatus: "pending", normalizedStatus: normalized };
  }
  return { subscriptionStatus: "inactive", normalizedStatus: normalized };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const signature = req.headers.get("x-nowpayments-sig");
  log("Incoming webhook", {
    method: req.method,
    url: req.url,
    hasSignature: !!signature,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  if (!signature) {
    return new Response(
      JSON.stringify({ error: "Missing NOWPayments signature header" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const ipnSecret = Deno.env.get("NOWPAYMENTS_IPN_SECRET");
  if (!ipnSecret) {
    log("NOWPayments IPN secret missing from environment");
    return new Response(
      JSON.stringify({ error: "Server misconfiguration" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const rawBody = await req.text();
  log("Webhook payload received", { length: rawBody.length });

  let payload: NowPaymentsIPNPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    log("Failed to parse webhook payload", { error: error instanceof Error ? error.message : String(error) });
    return new Response(
      JSON.stringify({ error: "Invalid JSON payload" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const signatureValid = await verifySignature(rawBody, signature, ipnSecret);
  if (!signatureValid) {
    log("Invalid NOWPayments signature", { paymentId: payload.payment_id, orderId: payload.order_id });
    return new Response(
      JSON.stringify({ error: "Invalid signature" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const metadata = extractMetadata(payload);
  log("Extracted metadata", metadata);

  const userId = metadata.userId;
  if (!userId) {
    log("Missing user identifier in webhook", { orderId: payload.order_id, paymentId: payload.payment_id });
    return new Response(
      JSON.stringify({
        success: false,
        message: "User identifier not found in webhook payload",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    log("Supabase credentials missing", { hasUrl: !!supabaseUrl, hasKey: !!serviceRoleKey });
    return new Response(
      JSON.stringify({ error: "Server misconfiguration: missing Supabase credentials" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
    global: { headers: { "X-Client-Info": "nowpayments-webhook" } },
  });

  const statusInfo = mapNowPaymentsStatus(payload.payment_status);
  const planId = metadata.planId ?? (payload.order_description ? detectPlanId(payload.order_description) : undefined) ?? (payload.order_id ? detectPlanId(payload.order_id) : undefined);
  const subscriptionIdentifier = determineSubscriptionIdentifier(payload);

  const updateData: Record<string, unknown> = {
    subscription_status: statusInfo.subscriptionStatus,
    updated_at: new Date().toISOString(),
  };

  if (planId) {
    updateData.subscription_tier = planId;
  }

  if (metadata.email) {
    updateData.email = metadata.email;
  }

  if (subscriptionIdentifier) {
    updateData.stripe_subscription_id = subscriptionIdentifier;
  }

  const { data: updatedProfiles, error: updateError } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", userId)
    .select("id, subscription_status, subscription_tier");

  if (updateError) {
    log("Failed to update profile", { error: updateError });
    return new Response(
      JSON.stringify({ error: "Failed to update subscription" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  if (!updatedProfiles || updatedProfiles.length === 0) {
    log("No profile updated", { userId });
    return new Response(
      JSON.stringify({
        success: false,
        message: `Profile not found for user ${userId}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  log("Subscription updated", {
    userId,
    planId: planId ?? null,
    subscriptionStatus: statusInfo.subscriptionStatus,
    paymentStatus: payload.payment_status,
    subscriptionIdentifier,
  });

  return new Response(
    JSON.stringify({
      success: true,
      message: "NOWPayments webhook processed",
      data: {
        userId,
        subscriptionStatus: statusInfo.subscriptionStatus,
        planId: planId ?? null,
        rawStatus: payload.payment_status ?? null,
      },
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
