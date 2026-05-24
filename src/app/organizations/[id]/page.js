import { redirect } from "next/navigation";

export default function OrganizationRedirectPage({ params }) {
  redirect(`/business-units/${params.id}`);
}
