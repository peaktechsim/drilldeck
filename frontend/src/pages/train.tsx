import { useState } from "react";
import DrillFlow, { type DrillFlowResult } from "@/components/drill-flow";
import Scorecard from "@/components/scorecard";
import SessionSetup, { type SessionConfig } from "@/components/session-setup";

type TrainPhase = "setup" | "drilling" | "scorecard";

export default function TrainPage() {
  const [phase, setPhase] = useState<TrainPhase>("setup");
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);
  const [result, setResult] = useState<DrillFlowResult | null>(null);

  function handleBegin(config: SessionConfig) {
    setSessionConfig(config);
    setResult(null);
    setPhase("drilling");
  }

  function handleComplete(nextResult: DrillFlowResult) {
    setResult(nextResult);
    setPhase("scorecard");
  }

  function handleReset() {
    setSessionConfig(null);
    setResult(null);
    setPhase("setup");
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Training mode</h1>
        <p className="text-sm text-muted-foreground">
          Build a live session, run each shooter through the drill deck, and print the scorecard when the line is cold.
        </p>
      </div>

      {phase === "setup" ? <SessionSetup onBegin={handleBegin} /> : null}
      {phase === "drilling" && sessionConfig ? <DrillFlow config={sessionConfig} onComplete={handleComplete} /> : null}
      {phase === "scorecard" && sessionConfig && result ? (
        <Scorecard config={sessionConfig} result={result} onNewSession={handleReset} />
      ) : null}
    </div>
  );
}
