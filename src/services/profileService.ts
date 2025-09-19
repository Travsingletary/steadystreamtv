import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

export class ProfileError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "ProfileError";
  }
}

export class ProfilePermissionError extends ProfileError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "ProfilePermissionError";
  }
}

export class ProfileSchemaError extends ProfileError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "ProfileSchemaError";
  }
}

const PERMISSION_DENIED_CODES = new Set(["42501", "PGRST301"]);

interface FetchProfileOptions {
  ensureProfile?: boolean;
  defaults?: Partial<ProfileInsert>;
}

export const profileService = {
  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      throw new ProfileError("Failed to resolve authenticated user", error);
    }
    return data.user;
  },

  async fetchProfile(options: FetchProfileOptions = {}) {
    const { ensureProfile = true, defaults = {} } = options;

    const user = await this.getCurrentUser();
    if (!user) {
      return { user: null, profile: null };
    }

    if (ensureProfile) {
      await this.ensureProfileRow(user.id, {
        email: user.email ?? null,
        subscription_status: "inactive",
        subscription_tier: null,
        updated_at: new Date().toISOString(),
        ...defaults,
      });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      if (isPermissionError(error)) {
        throw new ProfilePermissionError("Authenticated user is not allowed to read their profile", error);
      }

      if (isSchemaError(error)) {
        throw new ProfileSchemaError("Profiles table schema is missing expected columns", error);
      }

      throw new ProfileError("Failed to fetch profile", error);
    }

    return { user, profile };
  },

  async ensureProfileRow(userId: string, defaults: Partial<ProfileInsert> = {}) {
    const payload: ProfileInsert = {
      id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      subscription_status: "inactive",
      ...defaults,
    };

    const { error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    if (error && !isConflict(error)) {
      if (isPermissionError(error)) {
        throw new ProfilePermissionError("Authenticated user is not allowed to create or update their profile", error);
      }

      if (isSchemaError(error)) {
        throw new ProfileSchemaError("Profiles table schema is missing expected columns", error);
      }

      throw new ProfileError("Failed to ensure user profile", error);
    }
  },
};

function isConflict(error: { code?: string }) {
  return error.code === "23505";
}

function isPermissionError(error: { code?: string }) {
  return error.code ? PERMISSION_DENIED_CODES.has(error.code) : false;
}

function isSchemaError(error: { code?: string; message?: string }) {
  return error.code === "42703" || (error.message?.includes("column") ?? false);
}
