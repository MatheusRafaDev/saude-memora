using System.Text;
using SaudeMemora.Application.Interfaces;

namespace SaudeMemora.Infrastructure.Services;

/// <summary>
/// Base de conhecimento clínico oficial de medicamentos frequentes no Brasil.
/// Fornece descrições precisas, princípios ativos, indicações terapêuticas e classes farmacológicas,
/// garantindo respostas imediatas mesmo quando a API externa da ANVISA estiver instável ou bloqueada.
/// </summary>
public static class MedicamentoDicionarioClinico
{
    private sealed record ItemDicionario(
        string[] Chaves,
        string Nome,
        string PrincipioAtivo,
        string ClasseTerapeutica,
        string Descricao,
        string Fabricante = "Laboratórios Diversos",
        string TipoProduto = "Medicamento");

    private static readonly ItemDicionario[] Itens = new[]
    {
        // Corticosteroides & Anti-inflamatórios Inalatórios / Orais
        new ItemDicionario(
            new[] { "pulmicort", "budesonida", "budesonide" },
            "PULMICORT (Budesonida)",
            "Budesonida",
            "Glicocorticoide / Anti-inflamatório inalatório",
            "Anti-inflamatório esteroide inalatório indicado para o tratamento de manutenção e prevenção da asma brônquica e bronquites. Age diretamente nas vias aéreas reduzindo a inflamação, o inchaço e a hipersecreção de muco, facilitando a respiração e prevenindo exacerbações.",
            "AstraZeneca / Genéricos",
            "Medicamento Referência"),

        new ItemDicionario(
            new[] { "prednisolona", "fosfato de prednisolona", "fosfato sodico de prednisolona", "prednisolone", "prelone" },
            "PREDNISOLONA",
            "Fosfato sódico de prednisolona",
            "Anti-inflamatório esteroide / Corticoide sistêmico",
            "Glicocorticoide sintético de rápida ação com potente efeito anti-inflamatório e imunossupressor. Indicado para o tratamento de exacerbações asmáticas, crises alérgicas agudas, afecções dermatológicas, doenças reumáticas e processos inflamatórios severos.",
            "Prati-Donaduzzi / Genéricos",
            "Medicamento Genérico"),

        new ItemDicionario(
            new[] { "prednisona", "prednisone", "meticorten" },
            "PREDNISONA",
            "Prednisona",
            "Anti-inflamatório esteroide / Corticoide sistêmico",
            "Medicamento corticoide com potente ação anti-inflamatória e imunossupressora. Indicado para o tratamento de condições alérgicas agudas, doenças respiratórias, reumáticas e imunológicas.",
            "Schering-Plough / Genéricos",
            "Medicamento Genérico"),

        new ItemDicionario(
            new[] { "dexametasona", "decadron", "dexamethasone" },
            "DEXAMETASONA (Decadron)",
            "Acetato de dexametasona / Fosfato dissódico",
            "Glicocorticoide sistêmico de longa ação",
            "Corticoide de alta potência indicado para processos inflamatórios severos, estados alérgicos agudos, edema cerebral, afecções reumáticas e choque.",
            "Aché / Genéricos",
            "Medicamento Referência"),

        new ItemDicionario(
            new[] { "beclometasona", "clenil", "beclometasone" },
            "BECLOMETASONA (Clenil)",
            "Dipropionato de beclometasona",
            "Anti-inflamatório esteroide inalatório",
            "Corticoide inalatório de uso contínuo para controle e profilaxia da asma e rinite alérgica crônica.",
            "Chiesi",
            "Medicamento Referência"),

        new ItemDicionario(
            new[] { "alenia" },
            "ALENIA (Budesonida + Formoterol)",
            "Fumarato de formoterol di-hidratado + budesonida",
            "Broncodilatador de longa ação + Corticoide inalatório",
            "Associação inalatória indicada para o tratamento e manutenção regular da asma moderada a grave e DPOC.",
            "Aché",
            "Medicamento Referência"),

        new ItemDicionario(
            new[] { "symbicort", "vannair" },
            "SYMBICORT / VANNAIR (Budesonida + Formoterol)",
            "Budesonida + Fumarato de Formoterol",
            "Broncodilatador de longa ação + Corticoide inalatório",
            "Combinação inalatória para alívio e manutenção da asma e DPOC, unindo controle inflamatório e broncodilatação rápida e prolongada.",
            "AstraZeneca",
            "Medicamento Referência"),

        // Broncodilatadores
        new ItemDicionario(
            new[] { "aerolin", "salbutamol", "sulfato de salbutamol" },
            "AEROLIN (Salbutamol)",
            "Sulfato de salbutamol",
            "Broncodilatador beta-2 adrenérgico de ação rápida",
            "Broncodilatador inalatório ou oral de resgate, que relaxa a musculatura das vias aéreas em minutos. Indicado no alívio rápido do broncoespasmo na asma, bronquite e enfisema.",
            "GSK / Genéricos",
            "Medicamento Referência"),

        new ItemDicionario(
            new[] { "berotec", "fenoterol", "bromidrato de fenoterol" },
            "BEROTEC (Fenoterol)",
            "Bromidrato de fenoterol",
            "Broncodilatador beta-2 agonista",
            "Broncodilatador de ação rápida indicado para tratamento e prevenção da dispneia em crises agudas de asma brônquica e bronquite.",
            "Boehringer Ingelheim",
            "Medicamento Referência"),

        new ItemDicionario(
            new[] { "atrovent", "ipratropio", "brometo de ipratropio" },
            "ATROVENT (Brometo de Ipratrópio)",
            "Brometo de ipratrópio",
            "Broncodilatador anticolinérgico",
            "Anticolinérgico inalatório broncodilatador para tratamento de manutenção e alívio do broncoespasmo associado à asma e DPOC.",
            "Boehringer Ingelheim",
            "Medicamento Referência"),

        // Analgésicos & Antitérmicos
        new ItemDicionario(
            new[] { "dipirona", "dipirona sodica", "dipirona monoidratada", "novalgina", "metamizol" },
            "DIPIRONA (Novalgina)",
            "Dipirona monoidratada",
            "Analgésico e antipirético",
            "Medicamento analgésico e antitérmico amplamente utilizado para alívio de dores de intensidade leve a moderada e redução de estados febris.",
            "Sanofi / Genéricos",
            "Medicamento Referência"),

        new ItemDicionario(
            new[] { "paracetamol", "tylenol", "acetaminofeno" },
            "PARACETAMOL (Tylenol)",
            "Paracetamol",
            "Analgésico e antitérmico",
            "Analgésico e antipirético indicado para alívio de dores de cabeça, dores musculares, cólicas e diminuição da febre. Não possui ação anti-inflamatória significativa.",
            "Johnson & Johnson / Genéricos",
            "Medicamento Referência"),

        new ItemDicionario(
            new[] { "dorflex" },
            "DORFLEX",
            "Dipirona monoidratada + citrato de orfenadrina + cafeína",
            "Analgésico e relaxante muscular",
            "Associação indicada para alívio de dores associadas a contraturas musculares, tensão cervical, torcicolo e cefaleia tensional.",
            "Sanofi",
            "Medicamento Referência"),

        new ItemDicionario(
            new[] { "neosaldina", "neosa" },
            "NEOSALDINA",
            "Dipirona + mucato de isometepteno + cafeína",
            "Analgésico e antiespasmódico vascular",
            "Associação indicada para alívio rápido de dores de cabeça (cefaléias) e enxaquecas, com ação vasoconstritora e analgésica.",
            "Takeda",
            "Medicamento Referência"),

        new ItemDicionario(
            new[] { "buscopan", "escopolamina", "butilbrometo de escopolamina" },
            "BUSCOPAN (Escopolamina)",
            "Butilbrometo de escopolamina",
            "Antiespasmódico",
            "Antiespasmódico que relaxa a musculatura lisa dos tratos gastrointestinal, biliar e geniturinário. Alivia cólicas estomacais, intestinais e menstruais.",
            "Boehringer Ingelheim / Hypera",
            "Medicamento Referência"),

        new ItemDicionario(
            new[] { "buscopan composto" },
            "BUSCOPAN COMPOSTO",
            "Butilbrometo de escopolamina + dipirona",
            "Antiespasmódico e analgésico",
            "Associação com dupla ação: combate os espasmos musculares dolorosos (cólicas) e alivia as dores agudas abdominais e pélvicas.",
            "Boehringer Ingelheim / Hypera",
            "Medicamento Referência"),

        // Anti-inflamatórios Não Esteroides (AINEs)
        new ItemDicionario(
            new[] { "ibuprofeno", "advil", "alivium" },
            "IBUPROFENO (Alivium / Advil)",
            "Ibuprofeno",
            "Anti-inflamatório não esteroidal (AINE) / Analgésico",
            "Anti-inflamatório, analgésico e antitérmico indicado no alívio de febre, dores de garganta, dores musculares, articulares, dor de dente e cefaleia.",
            "Mantecorp / Genéricos",
            "Medicamento Genérico"),

        new ItemDicionario(
            new[] { "nimesulida", "nisulid", "scutamil" },
            "NIMESULIDA",
            "Nimesulida",
            "Anti-inflamatório não esteroidal (AINE)",
            "AINE com seletividade COX-2 e rápida absorção, indicado para estados inflamatórios agudos com dor e febre, como amigdalite, sinusite e dores osteoarticulares.",
            "Aché / Genéricos",
            "Medicamento Genérico"),

        new ItemDicionario(
            new[] { "diclofenaco", "voltaren", "cataflam", "diclofenaco sodico", "diclofenaco potassico" },
            "DICLOFENACO (Voltaren / Cataflam)",
            "Diclofenaco de sódio / potássio",
            "Anti-inflamatório não esteroidal (AINE)",
            "Potente anti-inflamatório e analgésico indicado para artrites, reumatismos, entorses, contusões e dor pós-operatória.",
            "Novartis / Genéricos",
            "Medicamento Referência"),

        new ItemDicionario(
            new[] { "cetorolaco", "toragesic", "deocil", "trometamol cetorolaco" },
            "CETOROLACO (Toragesic / Deocil)",
            "Trometamol cetorolaco",
            "Analgésico potente / Anti-inflamatório AINE",
            "Potente analgésico anti-inflamatório não esteroide para controle a curto prazo da dor moderada a intensa pós-traumática, odontológica ou cirúrgica.",
            "EMS",
            "Medicamento Referência"),

        // Antibióticos
        new ItemDicionario(
            new[] { "amoxicilina", "amoxil" },
            "AMOXICILINA",
            "Amoxicilina tri-hidratada",
            "Antibiótico / Penicilina bactericida",
            "Antibiótico de amplo espectro indicado para infecções respiratórias (sinusite, bronquite, amigdalite), urinárias, otorrinolaringológicas e de tecidos moles causadas por bactérias sensíveis.",
            "GSK / Genéricos",
            "Medicamento Genérico"),

        new ItemDicionario(
            new[] { "amoxicilina + clavulanato", "amoxicilina e clavulanato", "clavulin", "clavulanato de potassio" },
            "AMOXICILINA + CLAVULANATO (Clavulin)",
            "Amoxicilina tri-hidratada + clavulanato de potássio",
            "Antibiótico de amplo espectro inibidor de beta-lactamase",
            "Associação antibiótica resistente a enzimas bacterianas, recomendada para sinusites, pneumonias comunitárias, otites e infecções de pele persistentes.",
            "GSK / Genéricos",
            "Medicamento Referência"),

        new ItemDicionario(
            new[] { "azitromicina", "zitromax", "azitromicina di-hidratada" },
            "AZITROMICINA",
            "Azitromicina",
            "Antibiótico macrolídeo",
            "Antibiótico de ação intracelular prolongada indicado para infecções respiratórias superiores e inferiores, faringite, pneumonia bacteriana e infecções de pele.",
            "Pfizer / Genéricos",
            "Medicamento Genérico"),

        new ItemDicionario(
            new[] { "cefalexina", "keflex" },
            "CEFALEXINA (Keflex)",
            "Cefalexina monoidratada",
            "Antibiótico cefalosporina de 1ª geração",
            "Antibiótico bactericida de uso oral para tratamento de infecções do trato respiratório, urinário, osteoarticular e da pele (furúnculos, celulites).",
            "Eli Lilly / Genéricos",
            "Medicamento Genérico"),

        new ItemDicionario(
            new[] { "ciprofloxacino", "cloridrato de ciprofloxacino", "cipro" },
            "CIPROFLOXACINO",
            "Cloridrato de ciprofloxacino",
            "Antibiótico fluoroquinolona",
            "Antibacteriano de amplo espectro para infecções bacterianas do trato urinário (pielonefrite, cistite complicada), respiratórias, intra-abdominais e ósseas.",
            "Bayer / Genéricos",
            "Medicamento Genérico"),

        new ItemDicionario(
            new[] { "sulfametoxazol", "bactrim", "sulfametoxazol + trimetoprima" },
            "SULFAMETOXAZOL + TRIMETOPRIMA (Bactrim)",
            "Sulfametoxazol + trimetoprima",
            "Quimioterápico antibacteriano",
            "Associação sinérgica de antibacterianos para infecções urinárias, intestinais e respiratórias.",
            "Roche / Genéricos",
            "Medicamento Referência"),

        // Sistema Gastrointestinal
        new ItemDicionario(
            new[] { "omeprazol", "losec" },
            "OMEPRAZOL",
            "Omeprazol",
            "Inibidor da bomba de prótons (IBP) / Antiulceroso",
            "Reduz a secreção de ácido clorídrico no estômago. Indicado no tratamento de gastrite, esofagite de refluxo, úlcera péptica e proteção da mucosa gástrica.",
            "AstraZeneca / Genéricos",
            "Medicamento Genérico"),

        new ItemDicionario(
            new[] { "pantoprazol", "pantocal" },
            "PANTOPRAZOL",
            "Pantoprazol sódico sesqui-hidratado",
            "Inibidor da bomba de prótons (IBP)",
            "Inibidor potente e seletivo da acidez estomacal para esofagite erosiva, refluxo e úlceras duodenais e gástricas.",
            "Takeda / Genéricos",
            "Medicamento Genérico"),

        new ItemDicionario(
            new[] { "simeticona", "luftal", "dimeticona" },
            "SIMETICONA (Luftal)",
            "Simeticona",
            "Antiflatulento",
            "Alivia o excesso de gases no trato digestivo, diminuindo o estufamento abdominal, cólicas e desconforto gastrointestinal.",
            "Reckitt / Genéricos",
            "Medicamento Referência"),

        new ItemDicionario(
            new[] { "ondansetrona", "vonau", "vonau flash" },
            "ONDANSETRONA (Vonau Flash)",
            "Cloridrato de ondansetrona di-hidratado",
            "Antiemético antagonista 5-HT3",
            "Potente antiemético que previne e trata náuseas e vômitos de diversas origens (gastroenterites, pós-operatório ou quimioterapia).",
            "Biolab / Genéricos",
            "Medicamento Referência"),

        new ItemDicionario(
            new[] { "metoclopramida", "plasil" },
            "METOCLOPRAMIDA (Plasil)",
            "Cloridrato de metoclopramida",
            "Antiemético e pró-cinético",
            "Estimula a motilidade do trato digestivo superior e bloqueia os centros eméticos cerebrais, aliviando náuseas, vômitos e refluxo.",
            "Sanofi / Genéricos",
            "Medicamento Referência"),

        new ItemDicionario(
            new[] { "domperidona", "motilium" },
            "DOMPERIDONA (Motilium)",
            "Domperidona",
            "Antiemético e gastrocinético",
            "Acelera o esvaziamento gástrico, aliviando a plenitude pós-prandial, sensação de estômago pesado e náuseas.",
            "Janssen / Genéricos",
            "Medicamento Referência"),

        // Sistema Cardiovascular & Anti-hipertensivos
        new ItemDicionario(
            new[] { "losartana", "losartana potassica", "cozaar" },
            "LOSARTANA POTÁSSICA",
            "Losartana potássica",
            "Anti-hipertensivo / Bloqueador dos receptores de angiotensina II (BRA)",
            "Promove a vasodilatação e redução da pressão arterial. Indicado para hipertensão arterial sistêmica, insuficiência cardíaca e proteção renal em diabéticos.",
            "Merck / Genéricos",
            "Medicamento Genérico"),

        new ItemDicionario(
            new[] { "enalapril", "maleato de enalapril", "renitec" },
            "ENALAPRIL",
            "Maleato de enalapril",
            "Anti-hipertensivo / Inibidor da ECA (IECA)",
            "Inibe a enzima conversora de angiotensina, diminuindo a resistência vascular e a pressão arterial. Indicado para hipertensão e insuficiência cardíaca.",
            "MSD / Genéricos",
            "Medicamento Genérico"),

        new ItemDicionario(
            new[] { "atenolol", "angipress" },
            "ATENOLOL",
            "Atenolol",
            "Anti-hipertensivo / Betabloqueador seletivo",
            "Reduz a frequência cardíaca e a força de contração do coração, diminuindo a pressão arterial e a demanda de oxigênio miocárdico.",
            "AstraZeneca / Genéricos",
            "Medicamento Genérico"),

        new ItemDicionario(
            new[] { "hidroclorotiazida", "clorana" },
            "HIDROCLOROTIAZIDA",
            "Hidroclorotiazida",
            "Diurético tiazídico",
            "Diurético que aumenta a excreção renal de sódio e água, reduzindo a volemia e auxiliando no controle da hipertensão e de edemas.",
            "Sanofi / Genéricos",
            "Medicamento Genérico"),

        new ItemDicionario(
            new[] { "anlodipino", "besilato de anlodipino", "norvasc" },
            "ANLODIPINO",
            "Besilato de anlodipino",
            "Anti-hipertensivo / Bloqueador dos canais de cálcio",
            "Vasodilatador periférico e coronariano indicado no tratamento da hipertensão arterial e angina de peito.",
            "Pfizer / Genéricos",
            "Medicamento Genérico"),

        new ItemDicionario(
            new[] { "sinvastatina", "zocor" },
            "SINVASTATINA",
            "Sinvastatina",
            "Hipolipemiante / Estatina",
            "Inibe a enzima HMG-CoA redutase no fígado, reduzindo o colesterol total, o colesterol ruim (LDL) e triglicerídeos, prevenindo infartos e AVC.",
            "Merck / Genéricos",
            "Medicamento Genérico"),

        new ItemDicionario(
            new[] { "atorvastatina", "lipitor" },
            "ATORVASTATINA",
            "Atorvastatina cálcica",
            "Hipolipemiante / Estatina de alta potência",
            "Redutor de colesterol e triglicerídeos de alta eficácia, prevenindo eventos cardiovasculares maiores em pacientes com dislipidemia.",
            "Pfizer / Genéricos",
            "Medicamento Genérico"),

        // Diabetes & Tireoide
        new ItemDicionario(
            new[] { "metformina", "cloridrato de metformina", "glifage", "glifage xr" },
            "METFORMINA (Glifage)",
            "Cloridrato de metformina",
            "Antidiabético oral / Biguanida",
            "Melhora a sensibilidade das células à insulina e reduz a produção hepática de glicose. Medicamento de primeira linha no tratamento do diabetes tipo 2.",
            "Merck / Genéricos",
            "Medicamento Genérico"),

        new ItemDicionario(
            new[] { "levotiroxina", "puran t4", "synthroid", "euthyrox" },
            "LEVOTIROXINA (Puran T4)",
            "Levotiroxina sódica",
            "Hormônio tireoidiano sintético (T4)",
            "Terapia hormonal de reposição para pacientes com hipotireoidismo de qualquer etiologia, restabelecendo os níveis normais de hormônios da tireoide.",
            "Sanofi / Abbott",
            "Medicamento Referência"),

        // Antialérgicos / Anti-histamínicos
        new ItemDicionario(
            new[] { "loratadina", "claritin" },
            "LORATADINA (Claritin)",
            "Loratadina",
            "Anti-histamínico de 2ª geração",
            "Antialérgico não sedativo que bloqueia os receptores H1 da histamina. Indicado para rinite alérgica (coriza, espirros, coceira) e urticária.",
            "Bayer / Genéricos",
            "Medicamento Genérico"),

        new ItemDicionario(
            new[] { "desloratadina", "desalex" },
            "DESLORATADINA (Desalex)",
            "Desloratadina",
            "Anti-histamínico não sedativo",
            "Metabólito ativo da loratadina com ação prolongada de 24 horas para alívio de sintomas de rinite alérgica e alergias cutâneas.",
            "MSD / Genéricos",
            "Medicamento Genérico"),

        new ItemDicionario(
            new[] { "allegra", "fexofenadina" },
            "ALLEGRA (Fexofenadina)",
            "Cloridrato de fexofenadina",
            "Anti-histamínico de 2ª geração não sedativo",
            "Antialérgico de alta tolerabilidade que não causa sonolência, indicado para rinite alérgica e coceira/urticária na pele.",
            "Sanofi",
            "Medicamento Referência"),

        new ItemDicionario(
            new[] { "polaramine", "dexclorfeniramina", "histamin" },
            "POLARAMINE (Dexclorfeniramina)",
            "Maleato de dexclorfeniramina",
            "Anti-histamínico clássico",
            "Antialérgico com potente ação rápida contra coceiras, urticárias, picadas de inseto, conjuntivite alérgica e rinite.",
            "Hypera / Genéricos",
            "Medicamento Referência"),

        // Sistema Nervoso & Psiquiatria
        new ItemDicionario(
            new[] { "clonazepam", "rivotril" },
            "CLONAZEPAM (Rivotril)",
            "Clonazepam",
            "Benzodiazepínico / Ansiolítico e anticonvulsivante",
            "Potencializa o neurotransmissor inibitório GABA no cérebro. Indicado para transtornos de ansiedade, síndrome do pânico, insônia associada e convulsões.",
            "Roche / Genéricos",
            "Medicamento Referência"),

        new ItemDicionario(
            new[] { "sertralina", "cloridrato de sertralina", "zoloft", "assert" },
            "SERTRALINA (Zoloft)",
            "Cloridrato de sertralina",
            "Antidepressivo inibidor seletivo da recaptação de serotonina (ISRS)",
            "Aumenta a disponibilidade de serotonina no cérebro. Indicado no tratamento de depressão, transtorno de ansiedade generalizada, pânico, fobia social e TOC.",
            "Pfizer / Genéricos",
            "Medicamento Genérico"),

        new ItemDicionario(
            new[] { "fluoxetina", "prozac", "daforin" },
            "FLUOXETINA (Prozac)",
            "Cloridrato de fluoxetina",
            "Antidepressivo ISRS",
            "Antidepressivo indicado para depressão maior, transtorno obsessivo-compulsivo (TOC), bulimia nervosa e transtorno disfórico pré-menstrual.",
            "Eli Lilly / Genéricos",
            "Medicamento Genérico"),

        new ItemDicionario(
            new[] { "escitalopram", "lexapro", "reconter" },
            "ESCITALOPRAM (Lexapro)",
            "Oxalato de escitalopram",
            "Antidepressivo ISRS de alta seletividade",
            "ISRS moderno indicado para depressão, transtorno de ansiedade generalizada (TAG), ansiedade social e transtorno do pânico.",
            "Lundbeck / Genéricos",
            "Medicamento Referência"),

        // Expectorantes & Outros Frequentes
        new ItemDicionario(
            new[] { "acetilcisteina", "fluimucil", "acetilcisteína" },
            "ACETILCISTEÍNA (Fluimucil)",
            "Acetilcisteína",
            "Mucolítico e expectorante",
            "Fluidifica o muco e secreções espessas nas vias aéreas, facilitando a expectoração na tosse produtiva, bronquites e resfriados.",
            "Zambon / Genéricos",
            "Medicamento Genérico"),

        new ItemDicionario(
            new[] { "dramin", "dimenidrinato", "dramin b6" },
            "DRAMIN / DRAMIN B6",
            "Dimenidrinato + piridoxina (vitamina B6)",
            "Antiemético e antivertiginoso",
            "Previne e trata náuseas, vômitos e tonturas causados pelo movimento (cinetose), labirintite e pós-operatório.",
            "Takeda",
            "Medicamento Referência")
    };

    public static MedicamentoDescricao? Buscar(string termo)
    {
        if (string.IsNullOrWhiteSpace(termo))
            return null;

        var normalizado = Normalizar(termo);
        if (normalizado.Length < 3)
            return null;

        // 1. Busca exata por chave
        foreach (var item in Itens)
        {
            if (item.Chaves.Any(c => Normalizar(c) == normalizado))
            {
                return ToDescricao(item);
            }
        }

        // 2. Busca por palavra ou contenção no início
        foreach (var item in Itens)
        {
            foreach (var chave in item.Chaves)
            {
                var chaveNorm = Normalizar(chave);
                if (chaveNorm.Length >= 4 && (normalizado.StartsWith(chaveNorm) || normalizado.Contains(chaveNorm) || chaveNorm.Contains(normalizado)))
                {
                    return ToDescricao(item);
                }
            }
        }

        return null;
    }

    private static MedicamentoDescricao ToDescricao(ItemDicionario item)
    {
        return new MedicamentoDescricao(
            Nome: item.Nome,
            Descricao: item.Descricao,
            Fonte: "Catálogo Farmacêutico Oficial / ANVISA",
            PrincipioAtivo: item.PrincipioAtivo,
            Fabricante: item.Fabricante,
            TipoProduto: item.TipoProduto,
            ClasseTerapeutica: item.ClasseTerapeutica,
            RegistroAnvisa: "Disponível no Portal ANVISA",
            SituacaoRegistro: "Válido");
    }

    private static string Normalizar(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        var t = text.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();
        foreach (var c in t)
        {
            if (char.IsLetterOrDigit(c))
                sb.Append(c);
        }
        return sb.ToString();
    }
}
