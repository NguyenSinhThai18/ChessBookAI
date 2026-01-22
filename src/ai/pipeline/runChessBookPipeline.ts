import { callGitHubAI } from '../githubAiClient';
import type { AiBookJson, LessonPlan, PipelineTrace, TopicBrief, ValidationError } from './types';
import {
  buildContentGeneratorPrompt,
  buildLessonPlannerPrompt,
  buildTopicInterpreterPrompt,
} from './prompts';
import { autoFix } from './autoFixer';
import {
  extractJsonFromModelText,
  validateChessRuleConstraints,
  validatePedagogyMinimal,
} from './validators';

function safeJsonParse<T>(modelText: string): { ok: true; value: T } | { ok: false; error: any } {
  try {
    const jsonText = extractJsonFromModelText(modelText);
    return { ok: true, value: JSON.parse(jsonText) as T };
  } catch (error) {
    return { ok: false, error };
  }
}

export interface RunPipelineOptions {
  maxAttempts?: number; // total attempts for content+fix loop
  debug?: boolean;
  onTraceUpdate?: (trace: PipelineTrace) => void;
}

export async function runChessBookPipeline(
  userTopic: string,
  opts: RunPipelineOptions = {}
): Promise<{ aiJson: AiBookJson; trace: PipelineTrace }> {
  const maxAttempts = opts.maxAttempts ?? 3;
  const trace: PipelineTrace = { topic: userTopic, stages: [] };
  const emit = () => {
    try {
      opts.onTraceUpdate?.(trace);
    } catch {
      // Never let UI callback break the pipeline.
    }
  };

  // ① Topic interpreter
  {
    const prompt = buildTopicInterpreterPrompt(userTopic);
    trace.stages.push({ name: 'topic_interpreter', input: { prompt } });
    emit();
    const text = await callGitHubAI(prompt);
    if (!text) throw new Error('Topic interpreter returned empty');
    const parsed = safeJsonParse<TopicBrief>(text);
    if (!parsed.ok) {
      const err: ValidationError = { code: 'JSON_PARSE_FAILED', message: 'Topic JSON parse failed' };
      trace.stages[trace.stages.length - 1].errors = [err];
      emit();
      throw new Error(err.message);
    }
    trace.stages[trace.stages.length - 1].output = parsed.value;
    emit();
  }
  const topicBrief = trace.stages.find((s) => s.name === 'topic_interpreter')!.output as TopicBrief;

  // ② Lesson planner
  {
    const prompt = buildLessonPlannerPrompt(topicBrief);
    trace.stages.push({ name: 'lesson_planner', input: { prompt } });
    emit();
    const text = await callGitHubAI(prompt);
    if (!text) throw new Error('Lesson planner returned empty');
    const parsed = safeJsonParse<LessonPlan>(text);
    if (!parsed.ok) {
      const err: ValidationError = { code: 'JSON_PARSE_FAILED', message: 'LessonPlan JSON parse failed' };
      trace.stages[trace.stages.length - 1].errors = [err];
      emit();
      throw new Error(err.message);
    }
    trace.stages[trace.stages.length - 1].output = parsed.value;
    emit();
  }
  const lessonPlan = trace.stages.find((s) => s.name === 'lesson_planner')!.output as LessonPlan;

  // ③→⑥ Content generator + validators + auto-fix loop
  let aiJson: AiBookJson | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // ③ Content generator
    const genPrompt = buildContentGeneratorPrompt(userTopic, topicBrief, lessonPlan);
    trace.stages.push({
      name: 'content_generator',
      input: { attempt, prompt: opts.debug ? genPrompt : '(hidden)' },
    });
    emit();
    const text = await callGitHubAI(genPrompt);
    if (!text) throw new Error('Content generator returned empty');

    const parsed = safeJsonParse<AiBookJson>(text);

    // 🧠 GHI FULL OUTPUT AI
    trace.stages[trace.stages.length - 1].output = {
      rawText: text, // ⭐ QUAN TRỌNG NHẤT
      parsedOk: parsed.ok,
      parsedJson: parsed.ok ? parsed.value : null,
      pagesCount:
        parsed.ok && Array.isArray(parsed.value?.pages)
          ? parsed.value.pages.length
          : null,
    };
    emit();

    // ⛔ parse fail thì retry như cũ
    if (!parsed.ok) {
      trace.stages[trace.stages.length - 1].errors = [
        {
          code: 'JSON_PARSE_FAILED',
          message: `Content JSON parse failed (attempt ${attempt})`,
        },
      ];
      emit();
      continue;
    }

    aiJson = parsed.value;


    // ④ Chess rule validator (minimal deterministic checks right now)
    const ruleErrors = validateChessRuleConstraints(aiJson);
    trace.stages.push({ name: 'chess_rule_validator', input: { attempt }, errors: ruleErrors });
    emit();
    if (ruleErrors.length > 0) {
      // ⑥ Auto fixer (minimal)
      const { fixed, changed } = autoFix(aiJson, ruleErrors);
      trace.stages.push({
        name: 'auto_fixer',
        input: { attempt, changed },
        output: { pages: fixed.pages?.length },
        errors: ruleErrors,
      });
      emit();
      aiJson = fixed;

      // Re-validate after fix
      const ruleErrors2 = validateChessRuleConstraints(aiJson);
      trace.stages.push({ name: 'chess_rule_validator', input: { attempt, afterFix: true }, errors: ruleErrors2 });
      emit();
      if (ruleErrors2.length > 0) continue;
    }

    // ⑤ Pedagogy validator (minimal)
    const pedErrors = validatePedagogyMinimal(aiJson);
    trace.stages.push({ name: 'pedagogy_validator', input: { attempt }, errors: pedErrors });
    emit();
    if (pedErrors.length > 0) continue;

    // PASS
    break;
  }

  if (!aiJson) throw new Error('Pipeline failed to produce aiJson');
  const finalRuleErrors = validateChessRuleConstraints(aiJson);
  const finalPedErrors = validatePedagogyMinimal(aiJson);
  if (finalRuleErrors.length || finalPedErrors.length) {
    throw new Error('Pipeline validation failed after max attempts');
  }

  // ⑦ Page generator happens outside (UI mapping); here we just stamp trace stage.
  trace.stages.push({ name: 'page_generator', output: { pages: aiJson.pages?.length } });
  emit();

  return { aiJson, trace };
}



