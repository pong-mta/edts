import { Head } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowLeft,
    KeyRound,
    LoaderCircle,
    ShieldCheck,
} from 'lucide-react';
import {
    FormEventHandler,
    useState,
} from 'react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPassword() {
    const [password, setPassword] =
        useState('');

    const [passwordConfirmation, setPasswordConfirmation] =
        useState('');

    const [processing, setProcessing] =
        useState(false);

    const [error, setError] =
        useState('');

    /*
    |--------------------------------------------------------------------------
    | SUBMIT
    |--------------------------------------------------------------------------
    */

    const submit: FormEventHandler =
        async (e) => {
            e.preventDefault();

            setError('');

            /*
            |--------------------------------------------------------------------------
            | GET RESET TOKEN
            |--------------------------------------------------------------------------
            */

            const resetToken =
                sessionStorage.getItem(
                    'reset_token',
                );

            if (!resetToken) {
                setError(
                    'Your password reset session has expired. Please request a new verification code.',
                );

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | VALIDATE PASSWORD
            |--------------------------------------------------------------------------
            */

            if (password.length < 8) {
                setError(
                    'Password must be at least 8 characters.',
                );

                return;
            }

            if (
                password !==
                passwordConfirmation
            ) {
                setError(
                    'Password confirmation does not match.',
                );

                return;
            }

            setProcessing(true);

            try {
                /*
                |--------------------------------------------------------------------------
                | RESET PASSWORD API
                |--------------------------------------------------------------------------
                */

                await axios.post(
                    '/api/forgot-password/reset',
                    {
                        reset_token:
                            resetToken,

                        password:
                            password,

                        password_confirmation:
                            passwordConfirmation,
                    },
                );

                /*
                |--------------------------------------------------------------------------
                | CLEAR RESET SESSION
                |--------------------------------------------------------------------------
                */

                sessionStorage.removeItem(
                    'reset_token',
                );

                sessionStorage.removeItem(
                    'reset_user_id',
                );

                sessionStorage.removeItem(
                    'reset_phone',
                );

                sessionStorage.removeItem(
                    'password_reset_token',
                );

                sessionStorage.removeItem(
                    'password_reset_user_id',
                );

                /*
                |--------------------------------------------------------------------------
                | GO TO LOGIN
                |--------------------------------------------------------------------------
                */

                window.location.href =
                    '/login?reset=success';
            } catch (error: any) {
                if (
                    axios.isAxiosError(
                        error,
                    )
                ) {
                    const response =
                        error.response;

                    if (
                        response?.status ===
                        422
                    ) {
                        setError(
                            response.data
                                ?.errors
                                ?.password?.[0] ||
                                response.data
                                    ?.errors
                                    ?.password_confirmation?.[0] ||
                                response.data
                                    ?.message ||
                                'Unable to reset your password.',
                        );

                        return;
                    }

                    if (
                        response?.status ===
                        401
                    ) {
                        setError(
                            'Your password reset session is invalid or has expired. Please request a new verification code.',
                        );

                        sessionStorage.removeItem(
                            'reset_token',
                        );

                        return;
                    }

                    setError(
                        response?.data
                            ?.message ||
                            'Unable to reset your password. Please try again.',
                    );

                    return;
                }

                setError(
                    'Unable to reset your password. Please try again.',
                );
            } finally {
                setProcessing(false);
            }
        };

    /*
    |--------------------------------------------------------------------------
    | PAGE
    |--------------------------------------------------------------------------
    */

    return (
        <>
            <Head title="Reset Password | Municipality of Estancia" />

            <div className="h-screen overflow-hidden bg-slate-100">

                {/* ========================================================== */}
                {/* HEADER */}
                {/* ========================================================== */}

                <header className="h-[68px] bg-[#0b1f3a] text-white">

                    <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-5">

                        {/* LEFT BRAND */}

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white p-1.5 shadow-sm">

                                <img
                                    src="/images/estancia-logo.png"
                                    alt="Municipality of Estancia"
                                    className="h-full w-full object-contain"
                                />

                            </div>

                            <div className="leading-tight">

                                <p className="text-[7px] uppercase tracking-[0.2em] text-blue-200">
                                    Republic of the Philippines
                                </p>

                                <p className="text-xs font-bold uppercase tracking-wide text-white">
                                    Municipality of Estancia
                                </p>

                                <p className="text-[8px] text-blue-200">
                                    Province of Iloilo
                                </p>

                            </div>

                        </div>

                        {/* RIGHT BRAND */}

                        <div className="hidden text-right sm:block">

                            <p className="text-xs font-bold text-white">
                                eDTS
                            </p>

                            <p className="text-[8px] text-blue-200">
                                Electronic Document Tracking System
                            </p>

                        </div>

                    </div>

                </header>

                {/* ========================================================== */}
                {/* MAIN */}
                {/* ========================================================== */}

                <main className="flex h-[calc(100vh-68px)] items-center justify-center overflow-hidden px-4 py-4">

                    {/* ====================================================== */}
                    {/* CARD */}
                    {/* ====================================================== */}

                    <div className="grid h-full max-h-[680px] w-full max-w-[1100px] overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-[1fr_0.82fr]">

                        {/* ================================================== */}
                        {/* LEFT PANEL */}
                        {/* ================================================== */}

                        <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#0b1f3a] via-[#123b69] to-[#0b5cab] p-8 text-white lg:flex lg:flex-col lg:justify-between">

                            {/* DECORATIVE CIRCLE */}

                            <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full border border-white/10" />

                            <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full border border-white/10" />

                            {/* CONTENT */}

                            <div className="relative z-10">

                                {/* LOGO */}

                                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white p-3 shadow-xl">

                                    <img
                                        src="/images/estancia-logo.png"
                                        alt="Municipality of Estancia"
                                        className="h-full w-full object-contain"
                                    />

                                </div>

                                {/* LABEL */}

                                <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200">
                                    Municipal Government
                                </p>

                                {/* TITLE */}

                                <h2 className="mt-2 text-3xl font-bold leading-[1.08] tracking-tight">

                                    Electronic Document

                                    <span className="block text-blue-300">
                                        Tracking System
                                    </span>

                                </h2>

                                {/* DESCRIPTION */}

                                <p className="mt-5 max-w-md text-sm leading-6 text-blue-100">
                                    Securely manage and track official municipal documents throughout the Municipality of Estancia.
                                </p>

                                {/* SECURITY */}

                                <div className="mt-8 flex items-center gap-3">

                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">

                                        <ShieldCheck className="h-5 w-5 text-emerald-300" />

                                    </div>

                                    <div>

                                        <p className="text-xs font-semibold text-white">
                                            Secure Account Recovery
                                        </p>

                                        <p className="mt-0.5 text-[10px] text-blue-200">
                                            Verified through mobile OTP
                                        </p>

                                    </div>

                                </div>

                            </div>

                            {/* LEFT FOOTER */}

                            <div className="relative z-10">

                                <p className="text-[10px] text-blue-200">
                                    Municipality of Estancia
                                </p>

                                <p className="mt-1 text-[9px] text-blue-300">
                                    Province of Iloilo • Philippines
                                </p>

                            </div>

                        </section>

                        {/* ================================================== */}
                        {/* RIGHT PANEL */}
                        {/* ================================================== */}

                        <section className="flex min-h-0 items-center overflow-hidden px-6 py-6 sm:px-10 lg:px-12">

                            <div className="w-full">

                                {/* ================================================== */}
                                {/* MOBILE LOGO */}
                                {/* ================================================== */}

                                <div className="mb-5 flex justify-center lg:hidden">

                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white p-1 shadow-md ring-1 ring-slate-200">

                                        <img
                                            src="/images/estancia-logo.png"
                                            alt="Municipality of Estancia"
                                            className="h-full w-full object-contain"
                                        />

                                    </div>

                                </div>

                                {/* ================================================== */}
                                {/* ICON */}
                                {/* ================================================== */}

                                <div className="mb-4 flex justify-center lg:justify-start">

                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">

                                        <KeyRound className="h-5 w-5" />

                                    </div>

                                </div>

                                {/* ================================================== */}
                                {/* TITLE */}
                                {/* ================================================== */}

                                <div className="mb-6 text-center lg:text-left">

                                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">
                                        Account Recovery
                                    </p>

                                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                                        Create new password
                                    </h2>

                                    <p className="mt-2 text-sm leading-5 text-slate-500">
                                        Your mobile number has been verified. Create a new password for your account.
                                    </p>

                                </div>

                                {/* ================================================== */}
                                {/* ERROR */}
                                {/* ================================================== */}

                                {error && (
                                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

                                        <p className="text-xs leading-5 text-red-700">
                                            {error}
                                        </p>

                                    </div>
                                )}

                                {/* ================================================== */}
                                {/* FORM */}
                                {/* ================================================== */}

                                <form
                                    onSubmit={
                                        submit
                                    }
                                    className="space-y-4"
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
                                            value={
                                                password
                                            }
                                            onChange={(
                                                e,
                                            ) =>
                                                setPassword(
                                                    e
                                                        .target
                                                        .value,
                                                )
                                            }
                                            disabled={
                                                processing
                                            }
                                            placeholder="Enter new password"
                                            className="h-11 rounded-xl border-slate-200 bg-slate-50 px-4 text-sm focus:bg-white"
                                        />

                                    </div>

                                    {/* CONFIRM PASSWORD */}

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
                                            onChange={(
                                                e,
                                            ) =>
                                                setPasswordConfirmation(
                                                    e
                                                        .target
                                                        .value,
                                                )
                                            }
                                            disabled={
                                                processing
                                            }
                                            placeholder="Confirm new password"
                                            className="h-11 rounded-xl border-slate-200 bg-slate-50 px-4 text-sm focus:bg-white"
                                        />

                                    </div>

                                    {/* ================================================== */}
                                    {/* PASSWORD REQUIREMENTS */}
                                    {/* ================================================== */}

                                    <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3">

                                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

                                        <div>

                                            <p className="text-xs font-semibold text-blue-900">
                                                Password requirements
                                            </p>

                                            <p className="mt-1 text-[10px] leading-4 text-blue-700">
                                                Use at least 8 characters and make sure both passwords match.
                                            </p>

                                        </div>

                                    </div>

                                    {/* ================================================== */}
                                    {/* SUBMIT */}
                                    {/* ================================================== */}

                                    <Button
                                        type="submit"
                                        disabled={
                                            processing ||
                                            password.length <
                                                8 ||
                                            password !==
                                                passwordConfirmation
                                        }
                                        className="mt-1 h-11 w-full rounded-xl bg-[#0b5cab] text-sm font-semibold shadow-lg shadow-blue-900/10 hover:bg-[#084b8d]"
                                    >

                                        {processing ? (
                                            <>
                                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />

                                                Updating password...
                                            </>
                                        ) : (
                                            <>
                                                Set New Password
                                            </>
                                        )}

                                    </Button>

                                </form>

                                {/* ================================================== */}
                                {/* BACK TO LOGIN */}
                                {/* ================================================== */}

                                <div className="mt-5 border-t border-slate-100 pt-5 text-center">

                                    <TextLink
                                        href={route(
                                            'login',
                                        )}
                                        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-700"
                                    >

                                        <ArrowLeft className="h-3.5 w-3.5" />

                                        Back to login

                                    </TextLink>

                                </div>

                                {/* ================================================== */}
                                {/* FOOTER */}
                                {/* ================================================== */}

                                <div className="mt-5 text-center">

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