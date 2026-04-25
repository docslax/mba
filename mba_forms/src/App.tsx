import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import FormSelector from "./pages/FormSelector";
import ShirtOrderForm from "./components/ShirtOrderForm";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FormSelector />} />
        <Route path="/forms/shirt-order" element={<ShirtOrderForm />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
