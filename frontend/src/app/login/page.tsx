'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/validations/auth';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Heart, Loader2, AlertCircle, Shield, Activity } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-50/50 via-background to-background p-4 sm:p-6 lg:p-8">
      {/* Background healthcare decoration */}
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-emerald-700/20 ring-4 ring-emerald-500/10">
            <Heart className="h-8 w-8 fill-current" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {APP_NAME}
          </h1>
          <p className="mt-1 text-sm font-medium text-emerald-800 dark:text-emerald-400">
            360° Motherhood & Newborn Care Platform
          </p>
        </div>

        {/* Login Form Card */}
        <Card className="border-border/60 shadow-xl shadow-muted/50 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold">Sign in to your account</CardTitle>
            <CardDescription>
              Enter your clinical or administrative credentials to access the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <div
                className="mb-4 flex items-start gap-3 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="doctor.amina@haihuwa.ng"
                          type="email"
                          autoComplete="email"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline focus:outline-none"
                          onClick={() => {
                            alert('Please contact your LGA Coordinator or System Administrator to reset your password.');
                          }}
                        >
                          Forgot password?
                        </button>
                      </div>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          type="password"
                          autoComplete="current-password"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormLabel className="text-xs font-normal text-muted-foreground">
                        Keep me signed in on this device
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full text-base font-medium"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col border-t bg-muted/20 px-6 py-4">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>Role-based access control enabled</span>
            </div>
          </CardFooter>
        </Card>

        {/* Support & Privacy Info */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            Secure health platform for Primary Health Centres & Community Health Workers.
          </p>
          <div className="mt-2 flex items-center justify-center gap-1 text-[11px] text-muted-foreground/80">
            <Activity className="h-3 w-3 text-emerald-600" />
            <span>Kaduna, Kano & Katsina Primary Health Care Boards</span>
          </div>
        </div>
      </div>
    </div>
  );
}
