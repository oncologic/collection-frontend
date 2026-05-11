export const metadata = {
  title: "Shared External Link",
  description: "Shared external link view",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function PublicExternalLinkLayout({ children }) {
  return <>{children}</>;
}
