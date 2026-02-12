import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export async function POST() {
  try {
    const { data, error } =
      await supabaseAdmin.auth.admin.updateUserById(
        "3bf90e96-15d8-475a-b5bf-2a842b4ed9fb",
        {
          user_metadata: {
            role: "admin",
          },
        }
      );

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
