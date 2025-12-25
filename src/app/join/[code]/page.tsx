'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { buildingService, userService } from '@/services/firebase-services';
import { Building } from '@/types';
import { Button, Card, CardContent, Spinner } from '@/components/ui';
import { UserGroupIcon, BuildingOffice2Icon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function JoinBuildingPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;
  
  const [building, setBuilding] = useState<Building | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);

  useEffect(() => {
    async function fetchBuilding() {
      try {
        const foundBuilding = await buildingService.getBuildingByInviteCode(code.toUpperCase());
        if (foundBuilding) {
          setBuilding(foundBuilding);
          
          // Check if user is already a member
          if (user && user.buildingIds.includes(foundBuilding.id)) {
            setAlreadyMember(true);
          }
        } else {
          setError('Invalid or expired invite code');
        }
      } catch (err) {
        console.error('Error fetching building:', err);
        setError('Something went wrong. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    if (code) {
      fetchBuilding();
    }
  }, [code, user]);

  const handleJoin = async () => {
    if (!user || !building) {
      router.push(`/login?redirect=/join/${code}`);
      return;
    }

    setIsJoining(true);
    try {
      await userService.joinBuilding(user.id, building.id);
      await refreshUser();
      toast.success(`Welcome to ${building.name}!`);
      router.push('/dashboard');
    } catch (err) {
      console.error('Error joining building:', err);
      toast.error('Failed to join building');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center">
              <UserGroupIcon className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900">Minyan</span>
          </Link>
        </div>

        <Card>
          <CardContent className="p-6 text-center">
            {error ? (
              <>
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-3xl">❌</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">{error}</h1>
                <p className="text-gray-600 mb-6">
                  The invite link may be invalid or expired. Please ask for a new one.
                </p>
                <Link href="/buildings">
                  <Button>Go to Buildings</Button>
                </Link>
              </>
            ) : alreadyMember ? (
              <>
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-success-100 flex items-center justify-center">
                  <CheckCircleIcon className="h-8 w-8 text-success-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  Already a Member
                </h1>
                <p className="text-gray-600 mb-2">
                  You&apos;re already a member of
                </p>
                <p className="text-lg font-semibold text-gray-900 mb-6">
                  {building?.name}
                </p>
                <Link href="/dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
              </>
            ) : (
              <>
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
                  <BuildingOffice2Icon className="h-8 w-8 text-primary-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  You&apos;ve Been Invited!
                </h1>
                <p className="text-gray-600 mb-2">
                  Join the minyan community at
                </p>
                <p className="text-lg font-semibold text-gray-900 mb-1">
                  {building?.name}
                </p>
                <p className="text-sm text-gray-500 mb-6">{building?.address}</p>

                {user ? (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleJoin}
                    isLoading={isJoining}
                  >
                    Join Building
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Link href={`/signup?redirect=/join/${code}`}>
                      <Button className="w-full" size="lg">
                        Sign Up to Join
                      </Button>
                    </Link>
                    <Link href={`/login?redirect=/join/${code}`}>
                      <Button variant="secondary" className="w-full" size="lg">
                        Sign In to Join
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
