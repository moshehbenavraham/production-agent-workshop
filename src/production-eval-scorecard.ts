import {
  isProductionEvalArtifact,
  type ProductionEvalArtifact,
  type ProductionEvalRunOutcome,
} from "./production-eval-runner.js";

function metricLabel(
  metric:
    | ProductionEvalArtifact["results"][number]["metrics"]["latency"]
    | ProductionEvalArtifact["results"][number]["metrics"]["cost"],
): string {
  return metric.availability === "available"
    ? `${Math.round(metric.value * 1_000) / 1_000}${metric.unit}`
    : `unavailable:${metric.reason}`;
}

export function renderProductionEvalScorecard(input: unknown): string {
  if (!isProductionEvalArtifact(input)) {
    return "PRODUCTION EVAL ERROR invalid_artifact Production eval scorecard input is invalid.";
  }
  const artifact = input;
  const lines = [
    `PRODUCTION EVAL ${artifact.status.toUpperCase()} ${artifact.aggregate.passedCases}/${artifact.aggregate.caseCount} cases critical_failures:${artifact.aggregate.criticalFailureCount}`,
  ];
  for (const result of artifact.results) {
    lines.push(
      `${result.status.toUpperCase()} ${result.caseId} critical:${result.score.critical.failures.length} latency:${metricLabel(result.metrics.latency)} cost:${metricLabel(result.metrics.cost)}`,
    );
    for (const dimension of result.dimensions.filter((entry) => !entry.passed)) {
      lines.push(
        `  ${dimension.dimension} ${dimension.code} expected:[${dimension.expected.join("|")}] observed:[${dimension.observed.join("|")}]`,
      );
    }
  }
  lines.push(
    `QUALITY average:${artifact.aggregate.qualityAverage ?? "unavailable"} latency_threshold:${artifact.thresholds.latencyMs.status} token_threshold:${artifact.thresholds.tokens.status} cost_threshold:${artifact.thresholds.costUsd.status}`,
  );
  lines.push(`ARTIFACT ${artifact.runId} ${artifact.finishedAt}`);
  return lines.join("\n");
}

export function renderProductionEvalFailure(outcome: ProductionEvalRunOutcome): string {
  return outcome.ok
    ? renderProductionEvalScorecard(outcome.value)
    : `PRODUCTION EVAL ERROR ${outcome.error.code} ${outcome.error.message}`;
}
