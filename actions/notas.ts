"use server";

import { z } from "zod";
import { formSchema } from "@/types/form_types";
import { createClient } from "@/lib/supabase/server";
import { convertToFloat } from "@/lib/utils";

type FormPayload = z.infer<typeof formSchema>;

export async function createNotaFiscal(formData: FormPayload) {
  // 1️⃣ Validação
  const validation = formSchema.safeParse(formData);
  const supabase_server = await createClient();

  if (!validation.success) {
    return { success: false, error: "Dados inválidos." };
  }

  const values = validation.data;

  // 🔑 Auth Supabase
  const {
    data: { user },
    error: authError,
  } = await supabase_server.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Usuário não autenticado." };
  }

  const dealerName = user?.user_metadata?.dealer 

  if (!dealerName) {
    return {
      success: false,
      error: "Metadados do revendedor ausentes.",
    };
  }

  // 2️⃣ Conversões
  const valorNF_float = convertToFloat(values.valorNF);
  const desconto_percentual_float = convertToFloat(values.desconto);
  const valorFranquia_float = values.valorFranquia
    ? convertToFloat(values.valorFranquia)
    : null;

  // 3️⃣ Nota Fiscal
  const notaData = {
    ordem_servico: values.ordemServico,
    numero_nf: values.numeroNF,
    data_nf: values.dataNF,
    valor_nf: valorNF_float,
    desconto_percentual: desconto_percentual_float,
    observacao: values.observacao || null,

    // 🔥 METADATA SUPABASE
    dealer_name: dealerName,
    user_id: user.id,

    tipo_de_venda: values.tipoDeVenda,
    num_os_franquia: values.numOSFranquia || null,
    valor_franquia: valorFranquia_float,
    num_nf_franquia: values.numNFFranquia || null,
    chassi: values.chassi || null,
  };

  const { data: nota, error: notaError } = await supabase_server
    .from("notas_fiscais")
    .insert([notaData])
    .select("id")
    .single();

  if (notaError) {
    console.error("Erro Nota Fiscal:", notaError);
    return { success: false, error: "Falha ao salvar NF." };
  }

  const notaFiscalId = nota.id;

  // 4️⃣ Peças
  const pecasData = values.pecas.map((peca) => ({
    nota_fiscal_id: notaFiscalId,
    codigo: peca.codigo,
    valor: Number(peca.valor.replace(/\D/g, "")) / 100,
  }));

  const { error: pecasError } = await supabase_server
    .from("nf_pecas")
    .insert(pecasData);

  if (pecasError) {
    console.error("Erro Peças:", pecasError);
    return { success: false, error: "Falha ao salvar peças." };
  }

  return {
    success: true,
    message: "Nota Fiscal salva com sucesso!",
    id: notaFiscalId,
  };
}
