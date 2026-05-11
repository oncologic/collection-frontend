import Image from "next/image";

export default function OrganizationBadge({ organization }) {
  return (
    <div
      className={`inline-flex items-center rounded px-2 py-1 ${organization.color}`}
    >
      {/*
        <Image
          src={organization.logo}
          alt={organization.name}
          width={20}
          height={20}
          className="mr-2 rounded-full"
        />
      */}
      <Image
        src={organization.logo}
        alt={organization.name}
        width={20}
        height={20}
        className="mr-2 rounded-full"
      />
      <span className="text-sm font-semibold">{organization.name}</span>
    </div>
  );
}
