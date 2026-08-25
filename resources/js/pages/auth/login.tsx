import { Head, useForm } from '@inertiajs/react';
import {
    ArrowRight,
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

interface LoginForm {
    phone: string;
    password: string;
    remember: boolean;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({
    status,
    canResetPassword,
}: LoginProps) {
    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
    } = useForm<LoginForm>({
        phone: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        /*
        |--------------------------------------------------------------------------
        | IMPORTANT
        |--------------------------------------------------------------------------
        |
        | This uses Laravel's WEB login route.
        |
        | DO NOT use /api/login here.
        |
        */

        post(route('login'), {
            onFinish: () => {
                reset('password');
            },
        });
    };

    return (
        <>
            <Head title="Login | Municipality of Estancia" />

            <div className="h-screen overflow-hidden bg-slate-100">

                {/* ========================================================== */}
                {/* GOVERNMENT HEADER */}
                {/* ========================================================== */}

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

                {/* ========================================================== */}
                {/* MAIN */}
                {/* ========================================================== */}

                <main className="flex h-[calc(100vh-72px)] items-center justify-center overflow-hidden px-4 py-4">

                    <div className="grid h-full max-h-[700px] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">

                        {/* ================================================== */}
                        {/* LEFT PANEL */}
                        {/* ================================================== */}

                        <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#0b1f3a] via-[#123b69] to-[#0b5cab] p-9 text-white lg:flex lg:flex-col lg:justify-between">

                            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />

                            <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full border border-white/10" />

                            <div className="relative z-10">

                                {/* LOGO */}

                                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white p-2 shadow-xl">

                                    <img
                                        src="/images/estancia-logo.png"
                                        alt="Municipality of Estancia"
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
                                    A centralized platform for managing,
                                    routing, and tracking official
                                    documents throughout the Municipality
                                    of Estancia.
                                </p>

                                {/* FEATURES */}

                                <div className="mt-8 space-y-3">

                                    <div className="flex items-center gap-3">

                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">

                                            <ShieldCheck className="h-4 w-4 text-emerald-300" />

                                        </div>

                                        <span className="text-xs text-blue-100">
                                            Secure municipal access
                                        </span>

                                    </div>

                                    <div className="flex items-center gap-3">

                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">

                                            <LockKeyhole className="h-4 w-4 text-blue-200" />

                                        </div>

                                        <span className="text-xs text-blue-100">
                                            Protected account credentials
                                        </span>

                                    </div>

                                </div>

                            </div>

                            <div className="relative z-10">

                                <p className="text-[10px] text-blue-300">
                                    Municipality of Estancia
                                </p>

                                <p className="mt-1 text-[10px] text-blue-400">
                                    Province of Iloilo • Philippines
                                </p>

                            </div>

                        </section>

                        {/* ================================================== */}
                        {/* LOGIN PANEL */}
                        {/* ================================================== */}

                        <section className="flex min-h-0 items-center overflow-hidden px-6 py-7 sm:px-9 lg:px-10">

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

                                {/* TITLE */}

                                <div className="mb-7 text-center lg:text-left">

                                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">
                                        eDTS Portal
                                    </p>

                                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                                        Welcome back
                                    </h2>

                                    <p className="mt-2 text-sm text-slate-500">
                                        Sign in to your municipal account
                                    </p>

                                </div>

                                {/* STATUS */}

                                {status && (
                                    <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
                                        {status}
                                    </div>
                                )}

                                {/* FORM */}

                                <form
                                    onSubmit={submit}
                                    className="space-y-5"
                                >

                                    {/* PHONE */}

                                    <div>

                                        <Label
                                            htmlFor="phone"
                                            className="mb-2 block text-xs font-semibold text-slate-700"
                                        >
                                            Mobile Number
                                        </Label>

                                        <Input
                                            id="phone"
                                            type="tel"
                                            inputMode="numeric"
                                            required
                                            autoFocus
                                            autoComplete="tel"
                                            maxLength={11}
                                            value={data.phone}
                                            onChange={(e) =>
                                                setData(
                                                    'phone',
                                                    e.target.value
                                                        .replace(
                                                            /\D/g,
                                                            '',
                                                        )
                                                        .slice(
                                                            0,
                                                            11,
                                                        ),
                                                )
                                            }
                                            disabled={processing}
                                            placeholder="09123456789"
                                            className="h-11 rounded-xl border-slate-200 bg-slate-50 px-4 text-sm transition focus:bg-white"
                                        />

                                        <InputError
                                            message={errors.phone}
                                            className="mt-2"
                                        />

                                    </div>

                                    {/* PASSWORD */}

                                    <div>

                                        <div className="mb-2 flex items-center justify-between">

                                            <Label
                                                htmlFor="password"
                                                className="text-xs font-semibold text-slate-700"
                                            >
                                                Password
                                            </Label>

                                            {canResetPassword && (
                                                <TextLink
                                                    href={route(
                                                        'password.request',
                                                    )}
                                                    className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                                                >
                                                    Forgot password?
                                                </TextLink>
                                            )}

                                        </div>

                                        <Input
                                            id="password"
                                            type="password"
                                            required
                                            autoComplete="current-password"
                                            value={data.password}
                                            onChange={(e) =>
                                                setData(
                                                    'password',
                                                    e.target.value,
                                                )
                                            }
                                            disabled={processing}
                                            placeholder="Enter your password"
                                            className="h-11 rounded-xl border-slate-200 bg-slate-50 px-4 text-sm transition focus:bg-white"
                                        />

                                        <InputError
                                            message={errors.password}
                                            className="mt-2"
                                        />

                                    </div>

                                    {/* REMEMBER */}

                                    <label className="flex cursor-pointer items-center gap-2">

                                        <input
                                            type="checkbox"
                                            checked={data.remember}
                                            onChange={(e) =>
                                                setData(
                                                    'remember',
                                                    e.target.checked,
                                                )
                                            }
                                            disabled={processing}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                                        />

                                        <span className="text-xs text-slate-500">
                                            Remember me
                                        </span>

                                    </label>

                                    {/* LOGIN */}

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="group h-11 w-full rounded-xl bg-[#0b5cab] text-sm font-semibold shadow-lg shadow-blue-900/10 transition hover:bg-[#084b8d] hover:shadow-xl"
                                    >

                                        {processing ? (
                                            <>
                                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />

                                                Signing in...
                                            </>
                                        ) : (
                                            <>
                                                Sign in to eDTS

                                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </>
                                        )}

                                    </Button>

                                </form>

                                {/* REGISTER */}

                                <div className="mt-7 border-t border-slate-100 pt-6 text-center">

                                    <p className="text-xs text-slate-500">
                                        Don't have a municipal account?
                                    </p>

                                    <TextLink
                                        href={route('register')}
                                        className="mt-2 inline-block text-sm font-semibold text-blue-700 hover:text-blue-800"
                                    >
                                        Create an account
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