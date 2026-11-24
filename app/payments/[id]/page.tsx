"use client";

import { useParams } from "next/navigation";
import PaymentsDashboard from "@/app/payments-dashboard";

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <PaymentsDashboard paymentId={id}/>;
}
