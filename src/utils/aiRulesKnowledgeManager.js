import supabase from "@/config/supabaseClient";

const RULES_STORAGE_KEY = "proyecto_cafe_ai_rules";
const KNOWLEDGE_STORAGE_KEY = "proyecto_cafe_ai_knowledge";

// Reglas por defecto si el almacenamiento está vacío
const DEFAULT_RULES = [
  {
    id: "default-rule-1",
    title: "Política General de Precios",
    content: "Los precios del menú son fijos salvo promociones expresamente autorizadas por la administración.",
    category: "Precios",
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: "default-rule-2",
    title: "Prioridad en Selección de Insumos",
    content: "Ante consultas sobre stock o recetas, sugerir siempre consumir primero los insumos con fecha de vencimiento más próxima (FIFO).",
    category: "Inventario",
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: "default-rule-3",
    title: "Atención y Tono de Voz",
    content: "Responder siempre de forma respetuosa, clara y ejecutiva en español latinoamericano.",
    category: "General",
    is_active: true,
    created_at: new Date().toISOString()
  }
];

// --- GESTIÓN DE REGLAS DE ADMINISTRADOR ---

export async function getAIRules() {
  try {
    const { data, error } = await supabase
      .from("ai_assistant_rules")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (e) {
    console.warn("Supabase ai_assistant_rules fetch skipped/fallback to localStorage:", e.message);
  }

  // Fallback a localStorage
  const local = localStorage.getItem(RULES_STORAGE_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error("Error al parsear reglas locales:", e);
    }
  }

  // Guardar reglas por defecto la primera vez
  localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(DEFAULT_RULES));
  return DEFAULT_RULES;
}

export async function saveAIRule(rule) {
  const newRule = {
    id: rule.id || `rule-${Date.now()}`,
    title: rule.title.trim(),
    content: rule.content.trim(),
    category: rule.category || "General",
    is_active: rule.is_active !== undefined ? rule.is_active : true,
    updated_at: new Date().toISOString(),
    created_at: rule.created_at || new Date().toISOString()
  };

  // Intentar guardar en Supabase
  try {
    const { data, error } = await supabase
      .from("ai_assistant_rules")
      .upsert(newRule)
      .select();

    if (!error && data) {
      // Actualizar copia local
      const current = await getAIRules();
      const filtered = current.filter((r) => r.id !== newRule.id);
      localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify([newRule, ...filtered]));
      return data[0];
    }
  } catch (e) {
    console.warn("Supabase upsert rule fallback to localStorage:", e);
  }

  // Fallback localStorage
  const current = await getAIRules();
  const filtered = current.filter((r) => r.id !== newRule.id);
  const updatedList = [newRule, ...filtered];
  localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(updatedList));
  return newRule;
}

export async function toggleAIRuleStatus(ruleId, isActive) {
  const rules = await getAIRules();
  const target = rules.find((r) => r.id === ruleId);
  if (!target) return null;

  target.is_active = isActive;
  return await saveAIRule(target);
}

export async function deleteAIRule(ruleId) {
  try {
    await supabase.from("ai_assistant_rules").delete().eq("id", ruleId);
  } catch (e) {
    console.warn("Supabase delete rule error/fallback:", e);
  }

  const current = await getAIRules();
  const updatedList = current.filter((r) => r.id !== ruleId);
  localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(updatedList));
  return true;
}


// --- GESTIÓN DE CONOCIMIENTO INGERIDO ---

export async function getAIKnowledge() {
  try {
    const { data, error } = await supabase
      .from("ai_assistant_knowledge")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      return data;
    }
  } catch (e) {
    console.warn("Supabase ai_assistant_knowledge fetch fallback to localStorage:", e);
  }

  const local = localStorage.getItem(KNOWLEDGE_STORAGE_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error("Error al parsear conocimiento local:", e);
    }
  }
  return [];
}

export async function saveAIKnowledgeItem(item) {
  const newItem = {
    id: item.id || `kn-${Date.now()}`,
    type: item.type || "text", // 'pdf', 'youtube', 'audio', 'text'
    title: item.title.trim(),
    content: item.content.trim(),
    metadata: item.metadata || {},
    created_at: item.created_at || new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from("ai_assistant_knowledge")
      .upsert(newItem)
      .select();

    if (!error && data) {
      const current = await getAIKnowledge();
      const filtered = current.filter((k) => k.id !== newItem.id);
      localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify([newItem, ...filtered]));
      return data[0];
    }
  } catch (e) {
    console.warn("Supabase upsert knowledge fallback:", e);
  }

  const current = await getAIKnowledge();
  const filtered = current.filter((k) => k.id !== newItem.id);
  const updatedList = [newItem, ...filtered];
  localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(updatedList));
  return newItem;
}

export async function deleteAIKnowledgeItem(itemId) {
  try {
    await supabase.from("ai_assistant_knowledge").delete().eq("id", itemId);
  } catch (e) {
    console.warn("Supabase delete knowledge error:", e);
  }

  const current = await getAIKnowledge();
  const updatedList = current.filter((k) => k.id !== itemId);
  localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(updatedList));
  return true;
}
