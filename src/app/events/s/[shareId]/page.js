import SponsorshipOptions from "@/app/components/events/SponsorshipOptions";

// 's' stands for share, but keeps the URL shorter
const SponsorshipSharePage = async ({ params }) => {
  const { shareId } = params;

  // Fetch sponsorship data using the shareId
  const sponsorshipData = await getSponsorshipByShareId(shareId);

  if (!sponsorshipData) {
    return <div>This sponsorship page is no longer available.</div>;
  }

  return (
    <div className="container mx-auto">
      <SponsorshipOptions {...sponsorshipData} />
    </div>
  );
};

export default SponsorshipSharePage;
