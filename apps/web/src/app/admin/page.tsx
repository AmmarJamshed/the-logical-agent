export const metadata = { title: "Admin" };

export default function AdminPage() {
  const modules = [
    "RBAC & user management",
    "Content moderation",
    "AI agent monitoring",
    "Scheduler",
    "Newsletter management",
    "Community moderation",
    "Advertisement management",
    "Analytics",
    "Audit logs",
    "System health",
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <p className="eyebrow">Admin portal</p>
      <h1 className="mt-3 font-display text-5xl">Operate the platform</h1>
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <div key={module} className="panel p-5 text-sm">
            {module}
          </div>
        ))}
      </div>
    </div>
  );
}
