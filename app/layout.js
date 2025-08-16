import "./globals.css";

export const metadata = {
  title: "North Star"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className={"bg-zinc-800 text-white text-xs px-3 py-1"}>
          Root layout (Public)  - testing
        </div>
        {children}
      </body>
    </html>
  );
}
