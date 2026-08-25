import { Head } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowLeft,
    KeyRound,
    LoaderCircle,
    ShieldCheck,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] =
        useState('');

    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();

        setProcessing(true);
        setError('');

        const userId =
            sessionStorage.getItem('reset_user_id');

        const phone =
            sessionStorage.getItem('reset_phone');

        const resetToken =
            sessionStorage.getItem('reset_token');

        try {
            const response = await axios.post(
                '/api/forgot-password/reset',
                {
                    user_id: Number(userId),
                    phone,
                    token: resetToken,
                    password,
                    password_confirmation:
                        passwordConfirmation,
                },
            );

            sessionStorage.removeItem(
                'reset_user_id',
            );

            sessionStorage.removeItem(
                'reset_phone',
            );

            sessionStorage.removeItem(
                'reset_token',
            );

            window.location.href =
                '/login?reset=success';

        } catch (error: any) {
            if (
                axios.isAxiosError(error) &&
                error.response?.status === 422
            ) {
                const errors =
                    error.response.data.errors;

                setError(
                    errors?.password?.[0] ||
                        errors?.password_confirmation?.[0] ||
                        error.response.data.message ||
                        'Please check your password.',
                );

                return;
            }

            setError(
                error.response?.data?.message ||
                    'Unable to reset your password.',
            );
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <Head title="Reset Password | Municipality of Estancia" />

            <div className="h-screen overflow-hidden bg-slate-100">

                {/* HEADER */}

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

                {/* MAIN */}

                <main className="flex h-[calc(100vh-72px)] items-center justify-center px-4">

                    <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">

                        {/* LEFT */}

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
                                    municipal documents throughout
                                    the Municipality of Estancia.
                                </p>

                                <div className="mt-8 flex items-center gap-3">

                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                                        <ShieldCheck className="h-5 w-5 text-emerald-300" />
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold">
                                            Secure Account Recovery
                                        </p>

                                        <p className="text-[10px] text-blue-200">
                                            Verified through mobile OTP
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

                        {/* RIGHT */}

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

                                        <KeyRound className="h-6 w-6" />

                                    </div>

                                </div>

                                {/* TITLE */}

                                <div className="mb-7 text-center lg:text-left">

                                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">
                                        Account Recovery
                                    </p>

                                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                                        Create new password
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        Your mobile number has been
                                        verified. Create a new password
                                        for your account.
                                    </p>

                                </div>

                                {error && (
                                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                                        {error}
                                    </div>
                                )}

                                <form
                                    onSubmit={submit}
                                    className="space-y-5"
                                >

                                    {/* NEW PASSWORD */}

                                    <div>

                                        <Label
                                            htmlFor="password"
                                            className="mb-2 block text-xs font-semibold text-slate-700"
                                        >
                                            New Password
                                        </Label>

                                        <Input
                                            id="password"
                                            type="password"
                                            required
                                            autoFocus
                                            autoComplete="new-password"
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(
                                                    e.target.value,
                                                )
                                            }
                                            disabled={processing}
                                            placeholder="Enter new password"
                                            className="h-11 rounded-xl border-slate-200 bg-slate-50 px-4 text-sm focus:bg-white"
                                        />

                                    </div>

                                    {/* CONFIRM */}

                                    <div>

                                        <Label
                                            htmlFor="password_confirmation"
                                            className="mb-2 block text-xs font-semibold text-slate-700"
                                        >
                                            Confirm New Password
                                        </Label>

                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            required
                                            autoComplete="new-password"
                                            value={
                                                passwordConfirmation
                                            }
                                            onChange={(e) =>
                                                setPasswordConfirmation(
                                                    e.target.value,
                                                )
                                            }
                                            disabled={processing}
                                            placeholder="Confirm new password"
                                            className="h-11 rounded-xl border-slate-200 bg-slate-50 px-4 text-sm focus:bg-white"
                                        />

                                    </div>

                                    {/* SECURITY */}

                                    <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3.5">

                                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

                                        <div>

                                            <p className="text-xs font-semibold text-blue-900">
                                                Password requirements
                                            </p>

                                            <p className="mt-1 text-[10px] leading-4 text-blue-700">
                                                Use at least 8 characters
                                                and make sure both passwords
                                                match.
                                            </p>

                                        </div>

                                    </div>

                                    {/* SUBMIT */}

                                    <Button
                                        type="submit"
                                        disabled={
                                            processing ||
                                            password.length < 8 ||
                                            password !==
                                                passwordConfirmation
                                        }
                                        className="h-11 w-full rounded-xl bg-[#0b5cab] text-sm font-semibold shadow-lg shadow-blue-900/10 hover:bg-[#084b8d]"
                                    >

                                        {processing ? (
                                            <>
                                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                Updating password...
                                            </>
                                        ) : (
                                            'Set New Password'
                                        )}

                                    </Button>

                                </form>

                                {/* BACK */}

                                <div className="mt-7 border-t border-slate-100 pt-6 text-center">

                                    <TextLink
                                        href={route('login')}
                                        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-700"
                                    >
                                        <ArrowLeft className="h-3.5 w-3.5" />

                                        Back to login
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