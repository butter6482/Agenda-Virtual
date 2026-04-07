interface AlertProps {
  severity: "error" | "warning" | "info" | "success";
  title?: string;
  message?: string;
}

const COLORS = {
  error: "bg-red-50 border-red-200 text-red-700",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
  info: "bg-blue-50 border-blue-200 text-blue-700",
  success: "bg-green-50 border-green-200 text-green-700",
};

export function Alert({ severity, title, message }: AlertProps) {
  return (
    <div className={`rounded-xl border p-3 text-sm ${COLORS[severity]}`}>
      {title && <p className="font-semibold">{title}</p>}
      {message && <p className="mt-0.5">{message}</p>}
    </div>
  );
}
