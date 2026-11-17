import type { Metadata } from "next";
import { Fraunces, Cormorant_Garamond, Sora, Tiro_Devanagari_Sanskrit } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display",
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-names",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-sans",
  display: "swap",
});

const tiroDevanagari = Tiro_Devanagari_Sanskrit({
  subsets: ["latin", "devanagari"],
  weight: ["400"],
  variable: "--font-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://panchani-wedding.vercel.app"),
  title: {
    default: "॥ શુભ લગ્ન નિમંત્રણ ॥ ચિ. ધાર્મિક & કુ. નિશા | પાંચાણી પરિવાર",
    template: "%s | પાંચાણી પરિવાર",
  },
  description:
    "॥ શ્રી ગણેશાય નમઃ ॥ અમારા આંગણે રૂડા અવસરના વધામણાં છે. ૨૮ અને ૨૯ જાન્યુઆરી ૨૦૨૭ ના શુભ પ્રસંગે અમારા સુપુત્ર ચિ. ધાર્મિક તથા કુ. નિશા ના શુભ વિવાહ નિમિત્તે આપશ્રીને સહપરિવાર પધારવા અમારું હાર્દિક નિમંત્રણ છે. • પાંચાણી પરિવાર",
  keywords: [
    "ધાર્મિક નિશા લગ્ન",
    "પાંચાણી પરિવાર",
    "Dharmik Nisha Wedding",
    "Panchani Wedding",
    "Panchani Parivar",
    "Panchani Family",
    "Dharmik Panchani",
    "Nisha Patel",
    "Panchani Lagna",
    "Panchani Lagna Patrika",
    "Gujarati Wedding Invitation",
    "Shahi Patra",
    "Shubh Vivaah Panchani",
  ],
  authors: [{ name: "પાંચાણી પરિવાર", url: "https://panchani-wedding.vercel.app" }],
  creator: "પાંચાણી પરિવાર",
  publisher: "પાંચાણી પરિવાર",
  applicationName: "પાંચાણી પરિવાર શુભ વિવાહ નિમંત્રણ",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: true,
    telephone: true,
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "॥ શુભ લગ્ન નિમંત્રણ ॥ ચિ. ધાર્મિક & કુ. નિશા | પાંચાણી પરિવાર",
    description:
      "॥ શ્રી ગણેશાય નમઃ ॥ ૨૮ અને ૨૯ જાન્યુઆરી ૨૦૨૭ ના શુભ અવસરે આપશ્રીને સહપરિવાર પધારવા અમારું હાર્દિક અને ભાવભર્યું નિમંત્રણ છે. • પાંચાણી પરિવાર",
    url: "https://panchani-wedding.vercel.app",
    siteName: "પાંચાણી પરિવાર શુભ વિવાહ નિમંત્રણ",
    locale: "gu_IN",
    type: "website",
    images: [
      {
        url: "/media/mandap_dusk.webp",
        width: 1200,
        height: 630,
        alt: "ધાર્મિક અને નિશા શુભ વિવાહ મંડપ - પાંચાણી પરિવાર",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "॥ શુભ લગ્ન નિમંત્રણ ॥ ચિ. ધાર્મિક & કુ. નિશા | પાંચાણી પરિવાર",
    description:
      "શ્રી ગણેશાય નમઃ । અમારા આંગણે રૂડા અવસરના વધામણાં છે. ૨૮ અને ૨૯ જાન્યુઆરી ૨૦૨૭ - પાંચાણી પરિવાર.",
    images: ["/media/mandap_dusk.webp"],
    creator: "@PanchaniWedding",
  },
  category: "Wedding & Celebration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Rich Structured Data (JSON-LD) for Google Knowledge Graph & Rich Snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://panchani-wedding.vercel.app/#website",
        "url": "https://panchani-wedding.vercel.app",
        "name": "પાંચાણી પરિવાર શુભ વિવાહ",
        "alternateName": [
          "Panchani Wedding",
          "Panchani Parivar",
          "Panchani Family Wedding",
          "ધાર્મિક નિશા લગ્ન",
          "Dharmik Nisha Wedding"
        ],
        "description": "ચિ. ધાર્મિક અને કુ. નિશા ના શુભ વિવાહ નિમિત્તે પાંચાણી પરિવાર તરફથી ભાવભર્યું નિમંત્રણ.",
        "inLanguage": "gu-IN",
        "publisher": {
          "@type": "Organization",
          "name": "પાંચાણી પરિવાર",
          "url": "https://panchani-wedding.vercel.app"
        }
      },
      {
        "@type": "Event",
        "@id": "https://panchani-wedding.vercel.app/#wedding-event",
        "name": "શુભ લગ્ન - ચિ. ધાર્મિક & કુ. નિશા",
        "alternateName": "Panchani Royale Wedding",
        "description": "પાંચાણી પરિવાર દ્વારા આયોજિત ચિ. ધાર્મિક અને કુ. નિશા નો શુભ વિવાહ મહોત્સવ.",
        "startDate": "2027-01-28T10:00:00+05:30",
        "endDate": "2027-01-29T23:00:00+05:30",
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "location": {
          "@type": "Place",
          "name": "ધ ગ્રાન્ડ પેલેસ",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Grand Palace Road",
            "addressLocality": "Ahmedabad",
            "addressRegion": "Gujarat",
            "postalCode": "380015",
            "addressCountry": "IN"
          }
        },
        "organizer": {
          "@type": "Organization",
          "name": "પાંચાણી પરિવાર",
          "url": "https://panchani-wedding.vercel.app"
        },
        "performer": [
          {
            "@type": "Person",
            "name": "ચિ. ધાર્મિક પાંચાણી"
          },
          {
            "@type": "Person",
            "name": "કુ. નિશા પટેલ"
          }
        ],
        "image": [
          "https://panchani-wedding.vercel.app/media/mandap_dusk.webp"
        ]
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://panchani-wedding.vercel.app/#breadcrumb",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Panchani Wedding",
            "item": "https://panchani-wedding.vercel.app"
          }
        ]
      }
    ]
  };

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${cormorantGaramond.variable} ${sora.variable} ${tiroDevanagari.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased selection:bg-royale-crimson selection:text-royale-gold">
        {children}
      </body>
    </html>
  );
}
