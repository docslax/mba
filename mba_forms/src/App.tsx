import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

const FormSelector = lazy(() => import("./pages/FormSelector"));
const ShirtOrderForm = lazy(() => import("./components/ShirtOrderForm"));
const JacketOrderForm = lazy(() => import("./components/JacketOrderForm"));
const MembershipApplicationForm = lazy(
  () => import("./components/MembershipApplicationForm"),
);

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading…</div>}>
        <Routes>
          <Route path="/" element={<FormSelector />} />
          <Route path="/forms/shirt-order" element={<ShirtOrderForm />} />
          <Route path="/forms/jacket-order" element={<JacketOrderForm />} />
          <Route
            path="/forms/membership-application"
            element={<MembershipApplicationForm />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
