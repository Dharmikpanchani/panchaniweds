import { redirect } from 'next/navigation';

export default function Page({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const params = new URLSearchParams();
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === 'string') {
        params.set(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      }
    }
  }
  const qs = params.toString();
  redirect(`/index.html${qs ? '?' + qs : ''}`);
}
