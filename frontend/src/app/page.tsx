'use client';

import React from 'react';
import Link from 'next/link';
import {
  Heart,
  ShieldCheck,
  Calendar,
  Baby,
  Truck,
  Activity,
  ArrowRight,
  CheckCircle2,
  Users,
  Building2,
  ChevronRight,
  Stethoscope,
  PhoneCall,
  Coins,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { APP_NAME } from '@/lib/constants';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* 1. TOP ANNOUNCEMENT & NAVIGATION BAR */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-emerald-700/20">
              <Heart className="h-6 w-6 fill-current" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                {APP_NAME}
              </span>
              <span className="hidden text-xs font-semibold uppercase tracking-wider text-primary sm:inline-block sm:ml-2">
                360° Motherhood
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <a href="#initiatives" className="text-muted-foreground transition hover:text-foreground">
              Clinical Care
            </a>
            <a href="#features" className="text-muted-foreground transition hover:text-foreground">
              Core Modules
            </a>
            <a href="#impact" className="text-muted-foreground transition hover:text-foreground">
              Field Impact
            </a>
            <a href="#credentials" className="text-muted-foreground transition hover:text-foreground">
              Demo Access
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">Portal Login</Link>
            </Button>
            <Button asChild className="shadow-md shadow-emerald-600/20">
              <Link href="/login" className="flex items-center gap-1.5">
                <span>Access System</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 bg-gradient-to-b from-emerald-50/70 via-background to-background dark:from-emerald-950/20">
        <div className="container relative z-10 max-w-7xl px-4 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-4 gap-1.5 border-emerald-300 bg-emerald-50/80 px-3 py-1 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Activity className="h-3.5 w-3.5 animate-pulse text-emerald-600 dark:text-emerald-400" />
              Primary Health Care Board Partnership
            </Badge>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-foreground">
              Protecting Every <span className="text-primary underline decoration-emerald-400/40 underline-offset-8">Mother</span>, Nurturing Every <span className="text-primary underline decoration-emerald-400/40 underline-offset-8">Child</span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground sm:text-xl leading-relaxed">
              Haihuwa Lafiya 360° Motherhood is an integrated digital health platform unifying antenatal tracking, birth preparedness, referral transit, and postnatal care across primary health centers and rural communities in Northern Nigeria.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="w-full sm:w-auto text-base h-12 px-8 shadow-lg shadow-emerald-700/20">
                <Link href="/login">
                  Enter Healthcare Portal
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto text-base h-12 px-8">
                <a href="#features">Explore Platform Features</a>
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground sm:text-sm">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Offline-capable field workflows
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Strict deduplication algorithms
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Role-based clinical governance
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE CLINICAL MODULES GRID */}
      <section id="features" className="py-16 md:py-24 border-t border-border/40 bg-muted/20">
        <div className="container max-w-7xl px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              End-to-End Maternal Health Journey
            </h2>
            <p className="mt-3 text-muted-foreground text-base sm:text-lg">
              Designed according to WHO Antenatal Contact Models and national primary healthcare clinical protocols.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <Card className="border-border/60 transition hover:shadow-md hover:border-emerald-500/40">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Mother Registration & Deduplication</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Community and facility intake with deduplication indexing (name, phone, DOB) and automated unique identifier assignment (e.g. <code>HL-NAS-000001</code>).
                </p>
              </CardContent>
            </Card>

            {/* Card 2 */}
            <Card className="border-border/60 transition hover:shadow-md hover:border-emerald-500/40">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mb-4">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">ANC Tracking & EDD Calculator</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Automated Naegele&apos;s rule EDD calculations, versioned WHO 8-contact schedules, and proactive overdue visit queues for Community Health Workers.
                </p>
              </CardContent>
            </Card>

            {/* Card 3 */}
            <Card className="border-border/60 transition hover:shadow-md hover:border-emerald-500/40">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mb-4">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Clinical Vitals & Danger Signs</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Structured records for blood pressure, fundal height, maternal weight, MUAC, and prenatal lab screenings (HIV, Hemoglobin, Hepatitis, Malaria).
                </p>
              </CardContent>
            </Card>

            {/* Card 4 */}
            <Card className="border-border/60 transition hover:shadow-md hover:border-emerald-500/40">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mb-4">
                  <Truck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Emergency Transit & Referrals</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Formal care escalation from Primary Health Centres to Specialist General Hospitals with real-time transit status logging and outcome confirmations.
                </p>
              </CardContent>
            </Card>

            {/* Card 5 */}
            <Card className="border-border/60 transition hover:shadow-md hover:border-emerald-500/40">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mb-4">
                  <Baby className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Childbirth & Newborn Records</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Support for multiple births (twins/triplets), APGAR scoring, immediate resuscitation logs, and birth vaccinations (BCG, OPV-0, Hep-B-0).
                </p>
              </CardContent>
            </Card>

            {/* Card 6 */}
            <Card className="border-border/60 transition hover:shadow-md hover:border-emerald-500/40">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mb-4">
                  <Coins className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Milestone Incentives & Audit</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Financial transport subsidies and nutrition incentive claims with duplicate protection, approval workflows, and immutable audit logs.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. SEEDED DEMO CREDENTIALS QUICK-REFERENCE */}
      <section id="credentials" className="py-16 md:py-24 border-t border-border/40">
        <div className="container max-w-7xl px-4 sm:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <Badge variant="outline" className="mb-3 text-primary border-primary/30">
              Instant Demonstration Access
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Pre-Seeded Role Accounts
            </h2>
            <p className="mt-2 text-muted-foreground text-sm sm:text-base">
              Use any of the accounts below to explore role-specific permissions and capabilities.
            </p>
            <div className="mt-4 inline-block rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2 border border-emerald-200 dark:border-emerald-800">
              <span className="text-xs text-muted-foreground">Universal password for all accounts: </span>
              <code className="font-mono font-bold text-primary">Password123!</code>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {[
              { role: 'Super Administrator', email: 'admin@haihuwalafiya.org', desc: 'Full system administration & user access control' },
              { role: 'Programme Manager', email: 'manager@haihuwalafiya.org', desc: 'State-wide analytics & aggregated coverage reports' },
              { role: 'LGA Coordinator', email: 'coordinator@haihuwalafiya.org', desc: 'Local Government Area oversight and facility monitoring' },
              { role: 'Facility In-Charge', email: 'facility@haihuwalafiya.org', desc: 'Health centre operational management and roster' },
              { role: 'Senior Midwife', email: 'midwife@haihuwalafiya.org', desc: 'Clinical ANC, Labor, Delivery, and Newborn care' },
              { role: 'Community Health Worker', email: 'chw@haihuwalafiya.org', desc: 'Household visits, mother intake, and overdue recalls' },
              { role: 'M&E Data Officer', email: 'data@haihuwalafiya.org', desc: 'DHIS2 reporting, data validation, and exports' },
              { role: 'Finance Officer', email: 'finance@haihuwalafiya.org', desc: 'Milestone claim verification and disbursement approval' },
              { role: 'Clinical Auditor', email: 'auditor@haihuwalafiya.org', desc: 'Quality assurance and immutable event inspection' },
            ].map((acc) => (
              <div
                key={acc.email}
                className="rounded-lg border border-border/80 bg-card p-4 transition hover:border-primary/50 shadow-sm"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">{acc.role}</span>
                  <Badge variant="secondary" className="text-[10px]">Active</Badge>
                </div>
                <div className="font-mono text-sm font-medium text-foreground select-all">{acc.email}</div>
                <p className="text-xs text-muted-foreground mt-2">{acc.desc}</p>
                <div className="mt-3 pt-2 border-t border-border/40 flex justify-end">
                  <Link
                    href={`/login?email=${encodeURIComponent(acc.email)}`}
                    className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                  >
                    <span>Use Account</span>
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="mt-auto border-t border-border/60 bg-muted/40 py-10">
        <div className="container max-w-7xl px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary fill-current" />
            <span className="font-semibold text-foreground">{APP_NAME} — 360° Motherhood Initiative</span>
          </div>
          <div>
            Supporting Northern Nigeria State Primary Health Care Development Agencies.
          </div>
          <div>
            Built for production readiness on Neon PostgreSQL and Render.
          </div>
        </div>
      </footer>
    </div>
  );
}
