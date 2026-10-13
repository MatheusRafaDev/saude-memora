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
  { label: 'Pratico atividade física regularmente', aliases: ['exercício', 'exercicio', 'academia'] },
  { label: 'Tenho uma rotina sedentária', aliases: ['sedentário', 'sedentaria'] },
  { label: 'Durmo cerca de 7 a 8 horas por noite', aliases: ['sono', 'durmo'] },
  { label: 'Tenho dificuldade para dormir', aliases: ['insônia', 'insonia'] },
  { label: 'Mantenho alimentação variada', aliases: ['alimentação', 'alimentacao', 'dieta'] },
  { label: 'Sigo uma dieta vegetariana', aliases: ['vegetariano', 'vegetariana'] },
  { label: 'Sigo uma dieta vegana', aliases: ['vegano', 'vegana'] },
  { label: 'Fumo atualmente', aliases: ['cigarro', 'tabaco', 'fumante'] },
  { label: 'Parei de fumar', aliases: ['ex-fumante', 'ex fumante'] },
  { label: 'Consumo bebidas alcoólicas ocasionalmente', aliases: ['álcool', 'alcool', 'bebida'] },
  { label: 'Não consumo bebidas alcoólicas', aliases: ['não bebo', 'nao bebo'] },
  { label: 'Bebo cerca de ___ copos de água por dia', aliases: ['água', 'agua', 'hidratação'] },
];

export const FAMILY_HISTORY_SUGGESTIONS: AnamneseSuggestion[] = [
  { label: 'Hipertensão arterial na família', aliases: ['pressão alta', 'hipertensão'] },
  { label: 'Diabetes na família', aliases: ['diabetes', 'diabete'] },
  { label: 'Doença cardíaca na família', aliases: ['coração', 'coracao', 'infarto'] },
  { label: 'Câncer na família', aliases: ['cancer', 'tumor'] },
  { label: 'AVC na família', aliases: ['derrame'] },
  { label: 'Doença da tireoide na família', aliases: ['tireoide', 'tireóide'] },
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

export function appendAnamneseEntry(currentValue: string, entry: string): string {
  const entries = currentValue
    .split(/[\n,;]+/)
    .map(normalize)
    .filter(Boolean);

  if (entries.includes(normalize(entry))) return currentValue;
  return `${currentValue.trim()}${currentValue.trim() ? '\n' : ''}${entry}`;
}

export function getAnamneseQuery(value: string): string {
  return value.trim().split(/\s+/).at(-1)?.replace(/[.,;:!?]+$/g, '') ?? '';
}

export function normalizeAnamneseTerm(value: string): string {
  return normalize(value);
}
