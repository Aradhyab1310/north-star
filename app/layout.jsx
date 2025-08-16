import "./globals.css";
import SidebarLayout from "@/components/Sidebar"; // new client component

export const metadata = {
  title: "North Star",
  description: "Academic Planner",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SidebarLayout>{children}</SidebarLayout>
      </body>
    </html>
  );
}
