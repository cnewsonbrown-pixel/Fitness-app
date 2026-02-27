import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FitStudio — The all-in-one platform for fitness studios',
  description:
    'Manage members, schedule classes, process payments, and grow your gym with FitStudio. Trusted by 500+ fitness studios worldwide.',
  keywords: 'gym management software, fitness studio platform, gym scheduling, member management',
  openGraph: {
    title: 'FitStudio — Run your gym smarter',
    description: 'The all-in-one platform for modern fitness studios.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
