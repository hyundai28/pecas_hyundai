"use server";

import { createClient } from "@/lib/supabase/server";
import {
  DashboardData,
  NotaFiscalDashboardItem,
  NotaFiscalDB,
} from "@/types/notas_banco_schema";

/* ===============================
   FILTROS
=============================== */

interface DashboardFilters {
  startDate?: string;
  endDate?: string;
}

/* ===============================
   ACTION
=============================== */

export async function fetchDashboardData(
  filters: DashboardFilters
): Promise<DashboardData | { error: string }> {
  /* ---------- 1. Client + Auth ---------- */

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Usuário não autenticado." };
  }

  /* ---------- 2. Query ---------- */

  let query = supabase
    .from("notas_fiscais")
    .select(`
      id,
      dealer_name,
      ordem_servico,
      chassi,
      numero_nf,
      data_nf,
      valor_nf,
      tipo_de_venda,
      num_os_franquia,
      num_nf_franquia,
      valor_franquia,
      nf_pecas (
        id,
        codigo,
        valor
      )
    `)
    .order("data_nf", { ascending: false });

  if (filters.startDate) {
    query = query.gte("data_nf", filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte("data_nf", filters.endDate);
  }

  const { data, error } =
    await query.returns<NotaFiscalDB[]>();

  if (error) {
    console.error("Erro dashboard:", error);
    return { error: error.message };
  }

  const itemsDB = data ?? [];

  /* ---------- 3. Transformação ---------- */

  const items: NotaFiscalDashboardItem[] = itemsDB.map(
    (item) => ({
      id: item.id,

      dealer_name: item.dealer_name ?? "-", // ✅ agora correto

      ordemServico: item.ordem_servico,
      numeroNF: item.numero_nf,
      dataNF: item.data_nf,

      tipoDeVenda: item.tipo_de_venda,
      chassi: item.chassi,

      valorNF: item.valor_nf
        .toFixed(2)
        .replace(".", ","),

      valorNFFloat: item.valor_nf,

      numOSFranquia:
        item.num_os_franquia ?? undefined,

      numNFFranquia:
        item.num_nf_franquia ?? undefined,

      valorFranquia: item.valor_franquia
        ? item.valor_franquia
            .toFixed(2)
            .replace(".", ",")
        : undefined,

      pecas: (item.nf_pecas ?? []).map(
        (peca) => ({
          id: peca.id,
          codigo: peca.codigo,
          valor: peca.valor
            .toFixed(2)
            .replace(".", ","),
          valorFloat: peca.valor,
        })
      ),
    })
  );

  /* ---------- 4. Métricas ---------- */

  const totalValue = items.reduce(
    (sum, item) => sum + item.valorNFFloat,
    0
  );

  const count = items.length;

  const averageValue =
    count > 0 ? totalValue / count : 0;

  /* ---------- 5. Retorno ---------- */

  return {
    items,
    totalValue,
    averageValue,
    count,
  };
}
