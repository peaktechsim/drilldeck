import { useEffect, useState } from "react";
import DrillFlow, { DrillFlowResult } from "@/components/drill-flow";
import Scorecard from "@/components/scorecard";
import SessionSetup, { SessionConfig } from "@/components/session-setup";
import { useImmersive } from "@/context/immersive-context";

type TrainPhase = "setup" | "drilling" | "scorecard";

export default function TrainPage() {
  const { setImmersive } = useImmersive();
  const [phase, setPhase] = useState<TrainPhase>("setup");
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);
  const [result, setResult] = useState<DrillFlowResult | null>(null);

  useEffect(() => {
    setImmersive(phase === "drilling" || phase === "scorecard");

    return () => {
      setImmersive(false);
    };
  }, [phase, setImmersive]);

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

  if (phase === "setup") {
    return (
      <div className="flex flex-1 flex-col space-y-6">
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Training mode</h1>
          <p className="text-sm text-muted-foreground">
            Build a live session, run shooters through the drill deck, and print the scorecard when the line is cold.
          </p>
        </div>

        <SessionSetup onBegin={handleBegin} />
      </div>
    );
  }

  if (phase === "drilling" && sessionConfig) {
    return <DrillFlow config={sessionConfig} onComplete={handleComplete} onExit={handleReset} />;
  }

  if (phase === "scorecard" && sessionConfig && result) {
    return <Scorecard config={sessionConfig} result={result} onNewSession={handleReset} />;
  }

  return null;
}
