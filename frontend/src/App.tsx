import { BrowserRouter, Navigate, Route, Routes } from "react-router";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/train" replace />} />
        <Route path="*" element={<div>DrillDeck</div>} />
      </Routes>
    </BrowserRouter>
  );
}
