export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="p-4 shadow bg-white">Dream Clone</header>
      <main className="p-4">{children}</main>
    </div>
  );
}
