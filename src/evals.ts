import { resolve } from "node:path";
import { PRODUCTION_EVAL_SUITE } from "./production-eval-golden-set.js";
import { executeProductionEvalCase } from "./production-eval-harness.js";
import {
  productionEvalExitCode,
  runProductionEvalSuite,
  type ProductionEvalRunOutcome,
} from "./production-eval-runner.js";
import { renderProductionEvalFailure } from "./production-eval-scorecard.js";
import { FileProductionEvalArtifactStore } from "./production-eval-store.js";

function configurationFailure(): ProductionEvalRunOutcome {
  return {
    ok: false,
    error: {
      code: "invalid_configuration",
      message: "Production eval runner configuration is invalid.",
    },
  };
}

async function main(): Promise<void> {
  let outcome: ProductionEvalRunOutcome;
  try {
    const artifactPath = resolve(
      process.env.PRODUCTION_EVAL_LOG_PATH ?? "./data/production-evals.jsonl",
    );
    outcome = await runProductionEvalSuite({
      suite: PRODUCTION_EVAL_SUITE,
      executeCase: executeProductionEvalCase,
      artifactStore: new FileProductionEvalArtifactStore(artifactPath),
    });
  } catch {
    outcome = configurationFailure();
  }
  console.log(renderProductionEvalFailure(outcome));
  process.exitCode = productionEvalExitCode(outcome);
}

await main();
