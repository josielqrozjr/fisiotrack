import {
  Athlete,
  ClinicalSummary,
  FunctionalAssessment,
  OrthopedicTestItem,
  RiskLevel,
} from '@/types/fisiotrack';

/**
 * Calcula o Limb Symmetry Index (LSI %) = (Menor / Maior) * 100
 */
export function calculateLSI(right: number, left: number): number {
  if (right <= 0 || left <= 0) return 0;
  const min = Math.min(right, left);
  const max = Math.max(right, left);
  return Number(((min / max) * 100).toFixed(1));
}

/**
 * Calcula o percentual de assimetria entre membros = (|D - E| / Maior) * 100
 */
export function calculateAsymmetryPercent(right: number, left: number): number {
  if (right <= 0 || left <= 0) return 0;
  const diff = Math.abs(right - left);
  const max = Math.max(right, left);
  return Number(((diff / max) * 100).toFixed(1));
}

/**
 * Catálogo padrão de Testes Ortopédicos Especiais por articulação
 */
export function createDefaultOrthopedicTests(): OrthopedicTestItem[] {
  return [
    // Joelho
    {
      id: 'ortho-lachman',
      joint: 'Joelho',
      name: 'Teste de Lachman',
      targetStructure: 'Ligamento Cruzado Anterior (LCA)',
      result: 'Negativo',
      side: 'Bilateral',
      painNotes: '',
    },
    {
      id: 'ortho-gaveta-joelho',
      joint: 'Joelho',
      name: 'Gaveta Anterior / Posterior',
      targetStructure: 'Estabilidade Anteroposterior (LCA / LCP)',
      result: 'Negativo',
      side: 'Bilateral',
      painNotes: '',
    },
    {
      id: 'ortho-mcmurray',
      joint: 'Joelho',
      name: 'Teste de McMurray',
      targetStructure: 'Meniscos Medial e Lateral',
      result: 'Negativo',
      side: 'Bilateral',
      painNotes: '',
    },
    {
      id: 'ortho-valgo-varo',
      joint: 'Joelho',
      name: 'Estresse em Valgo / Varo',
      targetStructure: 'Ligamentos Colaterais (LCM / LCL)',
      result: 'Negativo',
      side: 'Bilateral',
      painNotes: '',
    },
    // Tornozelo
    {
      id: 'ortho-gaveta-tornozelo',
      joint: 'Tornozelo',
      name: 'Gaveta Anterior Talofibular',
      targetStructure: 'Ligamento Talofibular Anterior (LTFA)',
      result: 'Negativo',
      side: 'Bilateral',
      painNotes: '',
    },
    {
      id: 'ortho-thompson',
      joint: 'Tornozelo',
      name: 'Teste de Thompson',
      targetStructure: 'Integridade do Tendão Calcâneo (Aquiles)',
      result: 'Negativo',
      side: 'Bilateral',
      painNotes: '',
    },
    {
      id: 'ortho-kleiger',
      joint: 'Tornozelo',
      name: 'Teste de Kleiger (Rotação Externa)',
      targetStructure: 'Sindesmose Tibiofibular / Ligamento Deltoide',
      result: 'Negativo',
      side: 'Bilateral',
      painNotes: '',
    },
    // Ombro
    {
      id: 'ortho-neer',
      joint: 'Ombro',
      name: 'Teste de Impacto de Neer',
      targetStructure: 'Espaço Subacromial / Supraespinal',
      result: 'Negativo',
      side: 'Bilateral',
      painNotes: '',
    },
    {
      id: 'ortho-hawkins',
      joint: 'Ombro',
      name: 'Teste de Hawkins-Kennedy',
      targetStructure: 'Impacto Subacromial / Bursa Subdeltoidea',
      result: 'Negativo',
      side: 'Bilateral',
      painNotes: '',
    },
    {
      id: 'ortho-jobe',
      joint: 'Ombro',
      name: 'Teste de Jobe (Empty Can)',
      targetStructure: 'Tendão do Supraespinal (Manguito Rotador)',
      result: 'Negativo',
      side: 'Bilateral',
      painNotes: '',
    },
    // Quadril/Coluna
    {
      id: 'ortho-thomas',
      joint: 'Quadril/Coluna',
      name: 'Teste de Thomas',
      targetStructure: 'Flexores de Quadril (Iliopsoas / Reto Femoral)',
      result: 'Negativo',
      side: 'Bilateral',
      painNotes: '',
    },
    {
      id: 'ortho-lasegue',
      joint: 'Quadril/Coluna',
      name: 'Teste de Lasègue / Slump',
      targetStructure: 'Tensão Neural Ciática / Radiculopatia Lombar',
      result: 'Negativo',
      side: 'Bilateral',
      painNotes: '',
    },
    {
      id: 'ortho-patrick',
      joint: 'Quadril/Coluna',
      name: 'Teste de Patrick (FABER)',
      targetStructure: 'Articulação Coxofemoral e Sacroilíaca',
      result: 'Negativo',
      side: 'Bilateral',
      painNotes: '',
    },
  ];
}

/**
 * Motor Clínico de Avaliação: gera Score de Prontidão (Return-to-Play),
 * Nível de Risco ('Baixo' | 'Moderado' | 'Alto'), alertas e recomendações baseadas em evidências.
 */
export function evaluateClinicalSummary(
  athlete: Omit<Athlete, 'id' | 'createdAt' | 'clinicalSummary'>
): ClinicalSummary {
  const alerts: string[] = [];
  const recommendations: string[] = [];
  let penaltyPoints = 0;

  const { functional, orthopedic, injuries, mainSportFrequency, hasExtraActivity, extraActivities } =
    athlete;

  // 1. Análise do Single Leg Hop Test (LSI)
  const lsi = functional.hopTestLSI;
  const weakerHopSide =
    functional.hopTestRightCm < functional.hopTestLeftCm ? 'direito' : 'esquerdo';
  if (lsi > 0 && lsi < 90) {
    penaltyPoints += lsi < 85 ? 35 : 22;
    alerts.push(
      `Déficit de simetria no Single Leg Hop Test (LSI: ${lsi}% — corte de segurança: ≥ 90%), com menor desempenho no membro ${weakerHopSide}.`
    );
    recommendations.push(
      `Atleta apresenta LSI de ${lsi}% no Hop Test com déficit à ${
        weakerHopSide === 'direito' ? 'direita' : 'esquerda'
      }. Recomenda-se fortalecimento unilateral excêntrico de quadríceps/isquiotibiais e treino pliométrico de aterrissagem antes do retorno total sem restrições.`
    );
  }

  // 2. Análise do Y-Balance Test (Controle Neuromuscular Dinâmico)
  const yDiffCm = Math.abs(functional.yBalanceRightCm - functional.yBalanceLeftCm);
  const weakerYSide =
    functional.yBalanceRightCm < functional.yBalanceLeftCm ? 'direito' : 'esquerdo';
  if (functional.yBalanceAsymmetryPercent > 5 || yDiffCm >= 4) {
    penaltyPoints += 15;
    alerts.push(
      `Assimetria no Y-Balance Test de ${yDiffCm.toFixed(1)} cm (${functional.yBalanceAsymmetryPercent}%), indicando déficit de controle sensório-motor no membro ${weakerYSide}.`
    );
    recommendations.push(
      `Incluir protocolo de estabilidade dinâmica unipodal e controle valgo dinâmico de joelho/quadril com foco no membro ${weakerYSide}.`
    );
  }

  // 3. Análise do Lunge Test (Mobilidade de Dorsiflexão de Tornozelo)
  const lungeDiffCm = Math.abs(functional.lungeTestRightCm - functional.lungeTestLeftCm);
  const restrictedLungeSide =
    functional.lungeTestRightCm < functional.lungeTestLeftCm ? 'direito' : 'esquerdo';
  if (lungeDiffCm >= 1.5 || functional.lungeAsymmetryPercent >= 12) {
    penaltyPoints += 14;
    alerts.push(
      `Restrição de dorsiflexão de tornozelo no Lunge Test (${functional.lungeTestRightCm} cm D vs ${functional.lungeTestLeftCm} cm E — diferença de ${lungeDiffCm.toFixed(1)} cm).`
    );
    recommendations.push(
      `Restrição de dorsiflexão à ${
        restrictedLungeSide === 'direito' ? 'direita' : 'esquerda'
      } (${Math.min(functional.lungeTestRightCm, functional.lungeTestLeftCm)} cm). Indicar mobilização articular talocrural (Mulligan MWM) e liberação miofascial do complexo gastrocnêmio-sóleo para reduzir sobrecarga compensatória em joelho.`
    );
  }

  // 4. Prancha Isométrica (Resistência de Core)
  if (functional.plankTimeSeconds > 0 && functional.plankTimeSeconds < 60) {
    penaltyPoints += 10;
    alerts.push(
      `Tempo de prancha isométrica reduzido (${functional.plankTimeSeconds}s), sugerindo baixa resistência estabilizadora lombopélvica.`
    );
    recommendations.push(
      `Reforçar estabilidade de core anti-rotação e anti-extensão (McGill Big 3) para otimizar transferência de força entre extremidades.`
    );
  }

  // 5. Testes Ortopédicos Especiais Positivos
  const positiveTests = orthopedic.tests.filter((t) => t.result === 'Positivo');
  if (positiveTests.length > 0) {
    penaltyPoints += positiveTests.length * 22;
    const testNames = positiveTests
      .map((t) => `${t.name} (${t.side})`)
      .join(', ');
    alerts.push(
      `${positiveTests.length} teste(s) ortopédico(s) positivo(s) identificado(s): ${testNames}.`
    );

    const hasKneePositive = positiveTests.some((t) => t.joint === 'Joelho');
    const hasShoulderPositive = positiveTests.some((t) => t.joint === 'Ombro');
    const hasAnklePositive = positiveTests.some((t) => t.joint === 'Tornozelo');
    const hasHipSpinePositive = positiveTests.some((t) => t.joint === 'Quadril/Coluna');

    if (hasKneePositive) {
      recommendations.push(
        `Presença de teste articular positivo em joelho (${positiveTests
          .filter((t) => t.joint === 'Joelho')
          .map((t) => t.name)
          .join(', ')}). Correlacionar com estabilidade ligamentar/meniscal e evitar pivoteios de alta velocidade até estabilização clínica.`
      );
    }
    if (hasShoulderPositive) {
      recommendations.push(
        `Sinais clínicos de impacto subacromial/sobrecarga do manguito rotador (${positiveTests
          .filter((t) => t.joint === 'Ombro')
          .map((t) => t.name)
          .join(', ')}). Priorizar fortalecimento de rotadores externos, controle escapulotorácico (serrátil anterior/trapézio inferior) e ajuste do volume de movimentos overhead.`
      );
    }
    if (hasAnklePositive) {
      recommendations.push(
        `Instabilidade clínica detectada em complexo do tornozelo. Indicar treino proprioceptivo reativo, fortalecimento de fibulares e considerar órtese/bandagem funcional durante treinos de impacto.`
      );
    }
    if (hasHipSpinePositive) {
      recommendations.push(
        `Alteração nos testes provocativos lombopélvicos/coxofemorais. Avaliar mobilidade de quadril e controle motor lombo-pélvico.`
      );
    }
  }

  // 6. Histórico de Lesões & Escala Visual Analógica de Dor (EVA)
  const highPainInjuries = injuries.filter((inj) => inj.currentPainEVA > 3);
  const activeRehabInjuries = injuries.filter((inj) => inj.recoveryStatus === 'Em reabilitação');

  if (highPainInjuries.length > 0) {
    const maxEva = Math.max(...highPainInjuries.map((i) => i.currentPainEVA));
    penaltyPoints += maxEva >= 6 ? 25 : 15;
    alerts.push(
      `Queixa álgica ativa significativa (EVA ${maxEva}/10) em região de ${highPainInjuries
        .map((i) => `${i.bodyRegion} (${i.side})`)
        .join(', ')}.`
    );
    recommendations.push(
      `Monitorar resposta de dor 24h pós-treino (regra do semáforo de dor EVA ≤ 3). Ajustar volume e intensidade nos exercícios provocativos.`
    );
  } else if (activeRehabInjuries.length > 0) {
    penaltyPoints += 12;
    alerts.push(
      `Atleta possui histórico recente em fase de reabilitação/transição (${activeRehabInjuries
        .map((i) => i.description)
        .join(', ')}).`
    );
  }

  // 7. Relação Carga Semanal vs. Preparação Física Complementar
  const hasComplementaryPrep = hasExtraActivity && extraActivities.length > 0;
  if (mainSportFrequency >= 5 && !hasComplementaryPrep) {
    penaltyPoints += 15;
    alerts.push(
      `Alta frequência semanal no esporte principal (${mainSportFrequency}x/semana) sem trabalho complementar de fortalecimento ou prevenção.`
    );
    recommendations.push(
      `Introduzir 2 sessões semanais de treinamento de força/controle neuromuscular específico para reduzir sobrecarga cumulativa da modalidade (${athlete.mainSport}).`
    );
  }

  const readinessScore = Math.max(15, Math.min(100, 100 - penaltyPoints));

  let riskLevel: RiskLevel = 'Baixo';
  if (
    (lsi > 0 && lsi < 90) ||
    positiveTests.length >= 2 ||
    (positiveTests.length >= 1 && highPainInjuries.length >= 1) ||
    penaltyPoints >= 35
  ) {
    riskLevel = 'Alto';
  } else if (
    penaltyPoints >= 14 ||
    positiveTests.length === 1 ||
    highPainInjuries.length > 0 ||
    lungeDiffCm >= 1.5 ||
    functional.yBalanceAsymmetryPercent > 5
  ) {
    riskLevel = 'Moderado';
  }

  if (alerts.length === 0) {
    alerts.push(
      'Parâmetros de simetria funcional (LSI ≥ 90%), mobilidade articular e testes ortopédicos especiais dentro dos padrões de normalidade.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Atleta apto para prática esportiva sem restrições (Return to Play liberado). Manter rotina preventiva de fortalecimento e reavaliação periódica a cada 12 semanas.'
    );
  }

  return {
    riskLevel,
    readinessScore,
    alerts,
    recommendations,
  };
}

/**
 * Recalcula métricas derivadas de FunctionalAssessment a partir dos valores brutos
 */
export function computeFunctionalMetrics(
  raw: Pick<
    FunctionalAssessment,
    | 'yBalanceRightCm'
    | 'yBalanceLeftCm'
    | 'hopTestRightCm'
    | 'hopTestLeftCm'
    | 'lungeTestRightCm'
    | 'lungeTestLeftCm'
    | 'plankTimeSeconds'
    | 'functionalNotes'
  >
): FunctionalAssessment {
  return {
    ...raw,
    yBalanceAsymmetryPercent: calculateAsymmetryPercent(raw.yBalanceRightCm, raw.yBalanceLeftCm),
    hopTestLSI: calculateLSI(raw.hopTestRightCm, raw.hopTestLeftCm),
    lungeAsymmetryPercent: calculateAsymmetryPercent(raw.lungeTestRightCm, raw.lungeTestLeftCm),
  };
}
