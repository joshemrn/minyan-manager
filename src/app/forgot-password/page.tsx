'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Card, CardContent } from '@/components/ui';
import { UserGroupIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ForgotPasswordForm {
  email: string;
}

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      await resetPassword(data.email);
      setSubmittedEmail(data.email);
      setSubmitted(true);
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
            {!submitted ? (
              <>
                <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
                  Reset Password
                </h1>
                <p className="text-gray-500 text-center mb-8">
                  Enter your email and we&apos;ll send you a reset link
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    isLoading={isLoading}
                  >
                    Send Reset Email
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                  <Link
                    href="/login"
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    ← Back to login
                  </Link>
                </p>
              </>
            ) : (
              <div className="text-center space-y-4 py-2">
                <div className="flex justify-center">
                  <div className="h-14 w-14 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircleIcon className="h-7 w-7 text-green-600" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Check your inbox</h2>
                  <p className="text-sm text-gray-500">
                    If an account exists for{' '}
                    <span className="font-medium text-gray-700">{submittedEmail}</span>,
                    you&apos;ll receive a password reset link shortly. Check your spam folder if you don&apos;t see it.
                  </p>
                </div>
                <p className="text-sm text-gray-600">
                  <Link
                    href="/login"
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    ← Back to login
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
