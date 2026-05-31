'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { isSignInWithEmailLink } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Card, CardContent, Spinner } from '@/components/ui';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface EmailConfirmForm {
  email: string;
}

type Status = 'loading' | 'need-email' | 'error' | 'success';

export default function EmailLinkPage() {
  const { completeMagicLink } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [href, setHref] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailConfirmForm>();

  const completeSignIn = async (email: string, url: string) => {
    try {
      await completeMagicLink(email, url);
      setStatus('success');
      toast.success('Signed in successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Email link sign-in error:', error);
      const code = error?.code;
      if (code === 'auth/invalid-action-code') {
        setErrorMessage('This link has expired or has already been used.');
      } else if (code === 'auth/invalid-email') {
        setErrorMessage('The email address doesn\'t match the one used to request this link.');
      } else {
        setErrorMessage('Sign-in failed. Please try again.');
      }
      setStatus('error');
    }
  };

  useEffect(() => {
    const currentHref = window.location.href;
    setHref(currentHref);

    if (!isSignInWithEmailLink(auth, currentHref)) {
      setErrorMessage('This link is not valid.');
      setStatus('error');
      return;
    }

    const savedEmail = window.localStorage.getItem('emailForSignIn');
    if (!savedEmail) {
      setStatus('need-email');
      return;
    }

    completeSignIn(savedEmail, currentHref);
  }, []);

  const onEmailConfirm = async (data: EmailConfirmForm) => {
    await completeSignIn(data.email, href);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-amber-50 px-4 py-12">
      <div className="w-full max-w-md relative">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-amber-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="text-center mb-8 relative">
          <Link href="/" className="inline-flex items-center space-x-3">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-xl shadow-primary-500/30">
              <UserGroupIcon className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Minyan</span>
          </Link>
        </div>

        <Card className="relative backdrop-blur-sm bg-white/80 border-gray-200 shadow-2xl">
          <CardContent className="p-8">
            {status === 'loading' && (
              <div className="flex flex-col items-center space-y-4 py-4">
                <Spinner size="lg" />
                <p className="text-gray-500">Signing you in...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center space-y-4 py-4">
                <Spinner size="lg" />
                <p className="text-gray-500">Signed in! Redirecting...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Sign-in failed</h2>
                <p className="text-sm text-gray-500">{errorMessage}</p>
                <Link
                  href="/login"
                  className="inline-block font-medium text-primary-600 hover:text-primary-500 text-sm"
                >
                  ← Go to login
                </Link>
              </div>
            )}

            {status === 'need-email' && (
              <>
                <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                  Confirm your email
                </h2>
                <p className="text-gray-500 text-center mb-6 text-sm">
                  Please enter the email address you used to request this link.
                </p>
                <form onSubmit={handleSubmit(onEmailConfirm)} className="space-y-4">
                  <Input
                    label="Email"
                    type="email"
                    autoComplete="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    error={errors.email?.message}
                  />
                  <Button type="submit" className="w-full" size="lg">
                    Continue
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
