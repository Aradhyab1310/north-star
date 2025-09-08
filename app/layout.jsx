import "./globals.css";
import AppShell from "@/components/AppShell";
import FocusTimerProvider from "@/components/focus/FocusTimerProvider";
import { Quicksand } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export const metadata = {
  title: "North Star",
  description: "Academic Planner",
};

const heading = Quicksand({ subsets: ["latin"], weight: ["600","700"], variable: "--font-heading" });


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${heading.variable} font-sans`}>
        <ThemeProvider>
          <FocusTimerProvider>
            <AppShell>{children}</AppShell>
          </FocusTimerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
