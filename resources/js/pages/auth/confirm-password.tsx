import { Head, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    LoaderCircle,
    LockKeyhole,
    ShieldCheck,
} from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ConfirmPassword() {
    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
    } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Confirm Password | Municipality of Estancia" />

            <div className="h-screen overflow-hidden bg-slate-100">

                {/* ================================================== */}
                {/* HEADER */}
                {/* ================================================== */}

                <header className="h-[72px] bg-[#0b1f3a] text-white">
                    <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-5">

                        <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white p-1 shadow-md">
                                <img
                                    src="/images/estancia-logo.png"
                                    alt="Municipality of Estancia"
                                    className="h-full w-full object-contain"
                                />
                            </div>

                            <div>
                                <p className="text-[8px] uppercase tracking-[0.2em] text-blue-200">
                                    Republic of the Philippines
                                </p>

                                <h1 className="text-sm font-bold uppercase tracking-wide">
                                    Municipality of Estancia
                                </h1>

                                <p className="text-[10px] text-blue-200">
                                    Province of Iloilo
                                </p>
                            </div>
                        </div>

                        <div className="hidden text-right sm:block">
                            <p className="text-xs font-semibold">
                                eDTS
                            </p>

                            <p className="text-[9px] text-blue-200">
                                Electronic Document Tracking System
                            </p>
                        </div>
                    </div>
                </header>

                {/* ================================================== */}
                {/* MAIN */}
                {/* ================================================== */}

                <main className="flex h-[calc(100vh-72px)] items-center justify-center px-4">

                    <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">

                        {/* ================================================== */}
                        {/* LEFT PANEL */}
                        {/* ================================================== */}

                        <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#0b1f3a] via-[#123b69] to-[#0b5cab] p-10 text-white lg:flex lg:flex-col lg:justify-between">

                            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />

                            <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full border border-white/10" />

                            <div className="relative">

                                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white p-2 shadow-xl">
                                    <img
                                        src="/images/estancia-logo.png"
                                        alt=""
                                        className="h-full w-full object-contain"
                                    />
                                </div>

                                <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200">
                                    Municipal Government
                                </p>

                                <h2 className="mt-2 text-4xl font-bold leading-tight">
                                    Electronic Document
                                    <span className="block text-blue-300">
                                        Tracking System
                                    </span>
                                </h2>

                                <p className="mt-5 max-w-md text-sm leading-6 text-blue-100">
                                    Securely manage and track official
                                    municipal documents across the
                                    Municipality of Estancia.
                                </p>

                                <div className="mt-8 flex items-center gap-3">

                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                                        <ShieldCheck className="h-5 w-5 text-emerald-300" />
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold">
                                            Protected Area
                                        </p>

                                        <p className="text-[10px] text-blue-200">
                                            Password confirmation required
                                        </p>
                                    </div>

                                </div>
                            </div>

                            <div className="relative">
                                <p className="text-[10px] text-blue-300">
                                    Municipality of Estancia
                                </p>

                                <p className="mt-1 text-[10px] text-blue-400">
                                    Province of Iloilo • Philippines
                                </p>
                            </div>
                        </section>

                        {/* ================================================== */}
                        {/* FORM */}
                        {/* ================================================== */}

                        <section className="flex items-center p-6 sm:p-8 lg:p-10">

                            <div className="w-full">

                                {/* MOBILE LOGO */}

                                <div className="mb-6 flex justify-center lg:hidden">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white p-1 shadow-md ring-1 ring-slate-200">
                                        <img
                                            src="/images/estancia-logo.png"
                                            alt="Municipality of Estancia"
                                            className="h-full w-full object-contain"
                                        />
                                    </div>
                                </div>

                                {/* ICON */}

                                <div className="mb-5 flex justify-center lg:justify-start">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                        <LockKeyhole className="h-6 w-6" />
                                    </div>
                                </div>

                                {/* TITLE */}

                                <div className="mb-7 text-center lg:text-left">

                                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">
                                        Security Verification
                                    </p>

                                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                                        Confirm your password
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        This is a secure area of the
                                        application. Please confirm your
                                        password before continuing.
                                    </p>
                                </div>

                                {/* FORM */}

                                <form
                                    onSubmit={submit}
                                    className="space-y-5"
                                >

                                    <div>
                                        <Label
                                            htmlFor="password"
                                            className="mb-2 block text-xs font-semibold text-slate-700"
                                        >
                                            Password
                                        </Label>

                                        <Input
                                            id="password"
                                            type="password"
                                            name="password"
                                            placeholder="Enter your password"
                                            autoComplete="current-password"
                                            value={data.password}
                                            autoFocus
                                            onChange={(e) =>
                                                setData(
                                                    'password',
                                                    e.target.value,
                                                )
                                            }
                                            disabled={processing}
                                            className="h-11 rounded-xl border-slate-200 bg-slate-50 px-4 text-sm transition focus:bg-white"
                                        />

                                        <InputError
                                            message={
                                                errors.password
                                            }
                                        />
                                    </div>

                                    {/* SECURITY NOTICE */}

                                    <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3.5">

                                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

                                        <div>
                                            <p className="text-xs font-semibold text-blue-900">
                                                Secure confirmation
                                            </p>

                                            <p className="mt-1 text-[10px] leading-4 text-blue-700">
                                                Your password is required to
                                                access this protected area.
                                            </p>
                                        </div>
                                    </div>

                                    {/* BUTTON */}

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="h-11 w-full rounded-xl bg-[#0b5cab] text-sm font-semibold shadow-lg shadow-blue-900/10 hover:bg-[#084b8d]"
                                    >
                                        {processing ? (
                                            <>
                                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                Confirming...
                                            </>
                                        ) : (
                                            <>
                                                Confirm Password
                                            </>
                                        )}
                                    </Button>

                                </form>

                                {/* BACK */}

                                <div className="mt-7 border-t border-slate-100 pt-6 text-center">

                                    <TextLink
                                        href={route('dashboard')}
                                        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-700"
                                    >
                                        <ArrowLeft className="h-3.5 w-3.5" />

                                        Back to dashboard
                                    </TextLink>

                                </div>

                                {/* FOOTER */}

                                <div className="mt-7 text-center">

                                    <p className="text-[9px] uppercase tracking-[0.16em] text-slate-400">
                                        Municipal Government of Estancia
                                    </p>

                                    <p className="mt-1 text-[9px] text-slate-400">
                                        Province of Iloilo • Philippines
                                    </p>

                                </div>

                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </>
    );
}