export const metadata = {
  title: "Shared Collection | Resource Registry",
  description: "Browse curated resources from our public collection library",
  openGraph: {
    title: "Shared Collection | Resource Registry",
    description: "Browse curated resources from our public collection library",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shared Collection | Resource Registry",
    description: "Browse curated resources from our public collection library",
  },
};

export default function SharedCollectionLayout({ children }) {
  return <div className="min-h-screen">{children}</div>;
}
