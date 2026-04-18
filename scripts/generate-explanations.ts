/**
 * MasteX — Explanation generation script (CCP Edition)
 *
 * Generates explanations at 3 student levels (beginner/intermediate/advanced)
 * for every SHS Year 1 sub-topic across all 4 subjects and saves them to the
 * explanations table.
 *
 * Prerequisites:
 *   - Migration 004_ccp_rebuild.sql applied in Supabase
 *   - scripts/seed-curriculum.ts completed
 *   - .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *     ANTHROPIC_API_KEY
 *
 * Run with:
 *   npx tsx scripts/generate-explanations.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubTopic {
  id: string;
  name: string;
  description: string | null;
  subject_id: string;
  topics: { name: string; strand_name: string | null } | null;
}

const SUBJECT_NAMES: Record<string, string> = {
  core_math: "Core Mathematics",
  english: "English Language",
  social_studies: "Social Studies",
  integrated_science: "Integrated Science",
};

interface GeneratedExplanation {
  explanation: string;
  worked_example: string;
  guided_practice: string;
  guided_hints: string[];
  guided_answer: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVELS = ["beginner", "intermediate", "advanced"] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_DESCRIPTIONS: Record<Level, string> = {
  beginner:
    "A student who struggles with this subject. Use very simple words, short sentences, break into tiny steps, and relate to everyday Ghana life (markets, football, cooking, etc.).",
  intermediate:
    "An average SHS Year 1 student. Use standard clear explanations with good examples.",
  advanced:
    "A strong student who grasps concepts quickly. Be concise with more technical depth and challenge them slightly.",
};

const DELAY_MS = 3_000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(subTopic: SubTopic, level: Level): string {
  const subjectName = SUBJECT_NAMES[subTopic.subject_id] ?? subTopic.subject_id;
  const topicName = subTopic.topics?.name ?? subjectName;
  const strandName = subTopic.topics?.strand_name ?? "";
  const desc = subTopic.description ?? subTopic.name;

  return `You are an experienced Ghana SHS teacher and WAEC examiner creating study content for the MasteX learning platform, aligned with the Common Core Programme (CCP).

Subject: ${subjectName}
Strand: ${strandName}
Topic: ${topicName}
Sub-topic: ${subTopic.name}
Sub-topic description: ${desc}
Year Group: SHS 1
Student level: ${level}

${LEVEL_DESCRIPTIONS[level]}

Where relevant, use Ghanaian contexts, names, places and examples to make the content relatable to SHS students in Ghana.

Generate a complete learning package for this sub-topic at the ${level} level.
Return ONLY a valid JSON object — no markdown, no extra text:

{
  "explanation": "Clear explanation of the concept. ${level === "beginner" ? "Break into very small chunks, use simple words, relate to everyday Ghana life. 150-200 words." : level === "intermediate" ? "Standard clear explanation with examples. 150-250 words." : "Concise with technical depth. 120-180 words."}",

  "worked_example": "A fully solved WAEC-style problem. Format:\\nQuestion: [the problem]\\nSolution:\\nStep 1: [step]\\nStep 2: [step]\\n...\\nFinal Answer: [answer]\\nNote: [one thing to watch out for]. 100-200 words.",

  "guided_practice": "A similar problem for the student to solve themselves. State the problem clearly in 1-3 sentences. Do NOT give the answer here.",

  "guided_hints": [
    "Hint 1: a gentle first nudge — what to think about or identify first",
    "Hint 2: a more specific direction — which method or formula to use",
    "Hint 3: almost there — describe the final step without giving the full answer"
  ],

  "guided_answer": "The complete correct answer to the guided_practice problem with every step shown clearly, formatted the same way as the worked_example."
}`;
}

// ─── Generation ───────────────────────────────────────────────────────────────

async function generate(
  client: Anthropic,
  subTopic: SubTopic,
  level: Level
): Promise<GeneratedExplanation> {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [{ role: "user", content: buildPrompt(subTopic, level) }],
  });

  const block = msg.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No text block in response");

  let parsed: GeneratedExplanation;
  try {
    parsed = JSON.parse(stripFences(block.text));
  } catch {
    throw new Error(`JSON parse failed. Raw: ${block.text.slice(0, 200)}`);
  }

  if (
    !parsed.explanation ||
    !parsed.worked_example ||
    !parsed.guided_practice ||
    !Array.isArray(parsed.guided_hints) ||
    parsed.guided_hints.length !== 3 ||
    !parsed.guided_answer
  ) {
    throw new Error("Response missing required fields");
  }

  return parsed;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!supabaseUrl || !serviceKey || !anthropicKey) {
    console.error(
      "❌  Missing env vars. Check .env.local for:\n" +
        "    NEXT_PUBLIC_SUPABASE_URL\n" +
        "    SUPABASE_SERVICE_ROLE_KEY\n" +
        "    ANTHROPIC_API_KEY"
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const anthropic = new Anthropic({ apiKey: anthropicKey });

  // Fetch all sub-topics for all 4 subjects
  console.log("Fetching sub-topics for all subjects…");
  const { data: subTopics, error } = await supabase
    .from("sub_topics")
    .select("id, name, description, subject_id, topics(name, strand_name)")
    .in("subject_id", ["core_math", "english", "social_studies", "integrated_science"])
    .order("subject_id")
    .order("topic_id")
    .order("order_index");

  if (error || !subTopics?.length) {
    console.error("❌  Failed to fetch sub-topics:", error?.message ?? "empty result");
    process.exit(1);
  }

  // Fetch existing explanations to skip re-generation
  const { data: existing } = await supabase
    .from("explanations")
    .select("sub_topic_id, student_level")
    .in("sub_topic_id", subTopics.map((s) => s.id));

  const existingSet = new Set(
    (existing ?? []).map((e) => `${e.sub_topic_id}::${e.student_level}`)
  );

  const totalNeeded = subTopics.length * 3;
  const alreadyDone = existingSet.size;
  console.log(
    `Found ${subTopics.length} sub-topics across 4 subjects × 3 levels = ${totalNeeded} explanations needed.`
  );
  if (alreadyDone > 0) console.log(`  ↷ Skipping ${alreadyDone} already generated.`);

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const st of subTopics as unknown as SubTopic[]) {
    console.log(`\n[${st.subject_id}] ${st.name}`);

    for (const level of LEVELS) {
      const key = `${st.id}::${level}`;
      if (existingSet.has(key)) {
        console.log(`  ↷ Skipping ${level} (already exists)`);
        skipped++;
        continue;
      }

      try {
        const result = await generate(anthropic, st, level);

        const { error: insertErr } = await supabase.from("explanations").upsert(
          {
            sub_topic_id: st.id,
            student_level: level,
            content: result.explanation,
            worked_example: result.worked_example,
            guided_practice: result.guided_practice,
            guided_hints: result.guided_hints,
            guided_answer: result.guided_answer,
            model_used: "claude-sonnet-4-20250514",
          },
          { onConflict: "sub_topic_id,student_level", ignoreDuplicates: true }
        );

        if (insertErr) throw new Error(`DB insert: ${insertErr.message}`);

        console.log(`  ✓ ${level}`);
        generated++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`  ✗ ${level}: ${msg}`);
        failed++;
      }

      await sleep(DELAY_MS);
    }
  }

  console.log("\n" + "─".repeat(50));
  console.log("Done.");
  console.log(`  ✓ Generated : ${generated}`);
  if (skipped > 0) console.log(`  ↷ Skipped   : ${skipped}`);
  if (failed > 0) console.log(`  ✗ Failed    : ${failed}`);
  console.log("─".repeat(50));

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
