export const metadata = {
  title: "Shared Collection",
  description: "Shared collection view",
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

export default function PublicCollectionLayout({ children }) {
  return <>{children}</>;
}
