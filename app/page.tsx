import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

// Root page — redirect ke /login
export default function HomePage() {
  redirect(ROUTES.LOGIN);
}
