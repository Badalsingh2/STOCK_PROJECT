import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';

export async function getSession() {
  return await getServerSession();
}

export async function requireAuth() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  return session;
}

export async function requireNoAuth() {
  const session = await getSession();
  
  if (session) {
    redirect('/dashboard');
  }
  
  return null;
}