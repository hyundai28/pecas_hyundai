/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const users: any[] = [];

  const filePath = path.join(process.cwd(), "data", "users.csv");

  return new Promise((resolve) => {
    fs.createReadStream(filePath)
      .pipe(
        csv({
          separator: ";",
          mapHeaders: ({ header }) =>
            header
              .replace(/^\uFEFF/, "") // remove BOM
              .replace(/['"]/g, "") // remove aspas
              .trim(),
        }),
      )
      .on("data", (row) => users.push(row))
      .on("end", async () => {
        const results = [];

        for (const user of users) {
          console.log(user);
          const { error } = await supabaseAdmin.auth.admin.createUser({
            email: user.email,
            password: user.senha,
            email_confirm: true,
            user_metadata: {
              dealer: user.dealer_name,
              role: user.role,
            },
          });

          results.push({
            email: user.email,
            status: error ? error.message : "ok",
          });
        }

        resolve(
          Response.json({
            total: users.length,
            results,
          }),
        );
      });
  });
}
