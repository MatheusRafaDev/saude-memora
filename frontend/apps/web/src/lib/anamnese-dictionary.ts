export type AnamneseSuggestion = {
  label: string;
  aliases?: string[];
};

export const CONDITION_SUGGESTIONS: AnamneseSuggestion[] = [
  { label: 'Hipertensão arterial', aliases: ['pressão alta', 'hipertensao'] },
  { label: 'Diabetes Mellitus', aliases: ['diabetes', 'diabete'] },
  { label: 'Asma / Bronquite', aliases: ['asma', 'bronquite'] },
  { label: 'Doença cardíaca', aliases: ['problema no coração', 'cardiopatia'] },
  { label: 'Colesterol alto', aliases: ['colesterol', 'dislipidemia'] },
  { label: 'Ansiedade', aliases: ['transtorno de ansiedade'] },
  { label: 'Depressão', aliases: ['depressao'] },
  { label: 'Artrite / Artrose', aliases: ['artrite', 'artrose'] },
  { label: 'Doença renal', aliases: ['problema nos rins', 'insuficiência renal'] },
  { label: 'Doença da tireoide', aliases: ['tireoide', 'tireóide'] },
  { label: 'Hipotireoidismo' },
  { label: 'Hipertireoidismo' },
  { label: 'Enxaqueca', aliases: ['migrânea', 'migranea'] },
  { label: 'Epilepsia', aliases: ['convulsão', 'convulsao'] },
  { label: 'Câncer', aliases: ['cancro', 'tumor maligno'] },
  { label: 'Doença autoimune', aliases: ['lúpus', 'lupus', 'artrite reumatoide'] },
  { label: 'Osteoporose' },
  { label: 'Doença pulmonar', aliases: ['dpoc', 'enfisema'] },
];

export const ALLERGY_SUGGESTIONS: AnamneseSuggestion[] = [
  { label: 'Dipirona', aliases: ['metamizol'] },
  { label: 'Penicilina' },
  { label: 'Amoxicilina' },
  { label: 'AAS (ácido acetilsalicílico)', aliases: ['aspirina'] },
  { label: 'Ibuprofeno' },
  { label: 'Diclofenaco' },
  { label: 'Látex' },
  { label: 'Amendoim' },
  { label: 'Leite (proteínas do leite)' },
  { label: 'Ovo' },
  { label: 'Camarão' },
  { label: 'Peixes' },
  { label: 'Mariscos' },
  { label: 'Picada de abelha', aliases: ['insetos', 'vespa'] },
  { label: 'Pólen' },
  { label: 'Ácaros', aliases: ['poeira'] },
  { label: 'Pelos de animais', aliases: ['cães', 'gatos'] },
  { label: 'Contraste iodado', aliases: ['contraste'] },
];

export const SURGERY_SUGGESTIONS: AnamneseSuggestion[] = [
  { label: 'Apendicectomia (retirada do apêndice)', aliases: ['apêndice'] },
  { label: 'Cesárea', aliases: ['cesariana'] },
  { label: 'Colecistectomia (retirada da vesícula)', aliases: ['vesícula', 'vesicula'] },
  { label: 'Histerectomia (retirada do útero)', aliases: ['útero', 'utero'] },
  { label: 'Cirurgia de hérnia', aliases: ['herniorrafia', 'hérnia', 'hernia'] },
  { label: 'Cirurgia de catarata', aliases: ['catarata'] },
  { label: 'Amigdalectomia (retirada das amígdalas)', aliases: ['amígdalas', 'amigdalas'] },
  { label: 'Cirurgia cardíaca', aliases: ['coração', 'coracao', 'ponte de safena'] },
  { label: 'Cirurgia ortopédica' },
  { label: 'Cirurgia bariátrica', aliases: ['bariátrica', 'bariatrica', 'redução de estômago'] },
  { label: 'Outra cirurgia' },
];

export const HABIT_SUGGESTIONS: AnamneseSuggestion[] = [
  { label: 'Pratico atividade física regularmente', aliases: ['exercício', 'exercicio', 'academia', 'musculação', 'caminhada'] },
  { label: 'Tenho uma rotina sedentária', aliases: ['sedentário', 'sedentaria', 'sem exercício'] },
  { label: 'Durmo cerca de 7 a 8 horas por noite', aliases: ['sono', 'durmo', 'dormir'] },
  { label: 'Tenho dificuldade para dormir (insônia)', aliases: ['insônia', 'insonia', 'sono ruim'] },
  { label: 'Mantenho alimentação balanceada e saudável', aliases: ['alimentação', 'alimentacao', 'dieta', 'saudável'] },
  { label: 'Bebo pelo menos 2 litros de água por dia', aliases: ['água', 'agua', 'hidratação', 'líquidos'] },
  { label: 'Sigo uma dieta vegetariana', aliases: ['vegetariano', 'vegetariana'] },
  { label: 'Sigo uma dieta vegana', aliases: ['vegano', 'vegana'] },
  { label: 'Fumo atualmente', aliases: ['cigarro', 'tabaco', 'fumante'] },
  { label: 'Não fumo', aliases: ['não fumo', 'nao fumo', 'livre de tabaco'] },
  { label: 'Parei de fumar', aliases: ['ex-fumante', 'ex fumante'] },
  { label: 'Consumo bebidas alcoólicas ocasionalmente', aliases: ['álcool', 'alcool', 'bebida', 'social'] },
  { label: 'Não consumo bebidas alcoólicas', aliases: ['não bebo', 'nao bebo', 'sem álcool'] },
  { label: 'Caminhada diária ou atividade leve', aliases: ['caminhada', 'passos', 'leve'] },
];

export const FAMILY_HISTORY_SUGGESTIONS: AnamneseSuggestion[] = [
  { label: 'Hipertensão arterial na família', aliases: ['pressão alta', 'hipertensão', 'pressao'] },
  { label: 'Diabetes na família', aliases: ['diabetes', 'diabete'] },
  { label: 'Doença cardíaca na família', aliases: ['coração', 'coracao', 'infarto'] },
  { label: 'Câncer na família', aliases: ['cancer', 'tumor', 'oncológico'] },
  { label: 'AVC (derrame) na família', aliases: ['derrame', 'avc'] },
  { label: 'Doença da tireoide na família', aliases: ['tireoide', 'tireóide'] },
  { label: 'Colesterol alto na família', aliases: ['dislipidemia', 'colesterol'] },
];

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

export function findAnamneseSuggestions(
  query: string,
  dictionary: AnamneseSuggestion[],
  limit = 5,
): AnamneseSuggestion[] {
  const normalizedQuery = normalize(query);
  if (normalizedQuery.length < 2) return [];

  return dictionary
    .filter(({ label, aliases = [] }) =>
      [label, ...aliases].some((term) => normalize(term).includes(normalizedQuery)),
    )
    .slice(0, limit);
}

export function hasAnamneseEntry(currentValue: string, entry: string): boolean {
  if (!currentValue || !entry) return false;
  const normEntry = normalize(entry);
  const lines = currentValue
    .split(/[\n,;]+/)
    .map(normalize)
    .filter(Boolean);
  return lines.some((line) => line === normEntry || line.includes(normEntry) || normEntry.includes(line));
}

export function appendAnamneseEntry(currentValue: string, entry: string): string {
  const trimmed = entry.trim();
  if (!trimmed) return currentValue;
  const entries = currentValue
    .split(/[\n,;]+/)
    .map(normalize)
    .filter(Boolean);

  if (entries.some((e) => e === normalize(trimmed) || e.includes(normalize(trimmed)))) {
    return currentValue;
  }
  return `${currentValue.trim()}${currentValue.trim() ? '\n' : ''}${trimmed}`;
}

export function removeAnamneseEntry(currentValue: string, entry: string): string {
  const normEntry = normalize(entry);
  const lines = currentValue.split('\n');
  const filtered = lines.filter((line) => {
    const normLine = normalize(line);
    return normLine !== normEntry && !normLine.includes(normEntry) && !normEntry.includes(normLine);
  });
  return filtered.join('\n').trim();
}

export function toggleAnamneseEntry(currentValue: string, entry: string): string {
  if (hasAnamneseEntry(currentValue, entry)) {
    return removeAnamneseEntry(currentValue, entry);
  }
  return appendAnamneseEntry(currentValue, entry);
}

export function getAnamneseQuery(value: string): string {
  return value.trim().split(/\s+/).at(-1)?.replace(/[.,;:!?]+$/g, '') ?? '';
}

export function normalizeAnamneseTerm(value: string): string {
  return normalize(value);
}
