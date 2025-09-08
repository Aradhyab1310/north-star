import "./globals.css";
import AppShell from "@/components/AppShell";
import FocusTimerProvider from "@/components/focus/FocusTimerProvider";

export const metadata = {
  title: "North Star",
  description: "Academic Planner",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <FocusTimerProvider>
          <AppShell>{children}</AppShell>
        </FocusTimerProvider>
      </body>
    </html>
  );
}
