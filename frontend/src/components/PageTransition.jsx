import { useLocation } from "react-router-dom";

export function PageTransition({ children }) {
  const location = useLocation();

  return (
    <div className="page-enter" key={location.pathname}>
      {children}
    </div>
  );
}
