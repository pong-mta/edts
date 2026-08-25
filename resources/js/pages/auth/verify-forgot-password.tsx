import { Head } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    LoaderCircle,
    ShieldCheck,
} from 'lucide-react';
import {
    FormEventHandler,
    useEffect,
    useState,
} from 'react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const OTP_DURATION = 10 * 60;

export default function VerifyForgotPassword() {
    const [otp, setOtp] = useState('');

    const [phone, setPhone] = useState('');
    const [userId, setUserId] = useState('');

    const [processing, setProcessing] =
        useState(false);

    const [resending, setResending] =
        useState(false);

    const [error, setError] = useState('');

    const [success, setSuccess] =
        useState('');

    const [secondsLeft, setSecondsLeft] =
        useState(OTP_DURATION);

    /*
    |--------------------------------------------------------------------------
    | LOAD USER INFORMATION
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const params = new URLSearchParams(
            window.location.search,
        );

        const queryUserId =
            params.get('user_id');

        const queryPhone =
            params.get('phone');

        const storedUserId =
            sessionStorage.getItem(
                'reset_user_id',
            );

        const storedPhone =
            sessionStorage.getItem(
                'reset_phone',
            );

        const finalUserId =
            queryUserId || storedUserId || '';

        const finalPhone =
            queryPhone || storedPhone || '';

        if (finalUserId) {
            setUserId(finalUserId);

            sessionStorage.setItem(
                'reset_user_id',
                finalUserId,
            );
        }

        if (finalPhone) {
            setPhone(finalPhone);

            sessionStorage.setItem(
                'reset_phone',
                finalPhone,
            );
        }
    }, []);

    /*
    |--------------------------------------------------------------------------
    | OTP TIMER
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (secondsLeft <= 0) {
            return;
        }

        const timer = window.setInterval(() => {
            setSecondsLeft((current) => {
                if (current <= 1) {
                    window.clearInterval(timer);
                    return 0;
                }

                return current - 1;
            });
        }, 1000);

        return () => {
            window.clearInterval(timer);
        };
    }, [secondsLeft]);

    /*
    |--------------------------------------------------------------------------
    | FORMAT TIMER
    |--------------------------------------------------------------------------
    */

    const minutes = Math.floor(
        secondsLeft / 60,
    )
        .toString()
        .padStart(2, '0');

    const seconds = (
        secondsLeft % 60
    )
        .toString()
        .padStart(2, '0');

    const timerExpired =
        secondsLeft === 0;

    /*
    |--------------------------------------------------------------------------
    | VERIFY OTP
    |--------------------------------------------------------------------------
    */

    const submit: FormEventHandler = async (
        e,
    ) => {
        e.preventDefault();

        setProcessing(true);
        setError('');
        setSuccess('');

        if (!userId) {
            setError(
                'Invalid password reset session. Please request a new OTP.',
            );

            setProcessing(false);
            return;
        }

        if (timerExpired) {
            setError(
                'Your verification code has expired. Please request a new code.',
            );

            setProcessing(false);
            return;
        }

        if (otp.length !== 6) {
            setError(
                'Please enter the 6-digit verification code.',
            );

            setProcessing(false);
            return;
        }

        try {
            const response =
                await axios.post(
                    '/api/forgot-password/verify',
                    {
                        user_id:
                            Number(userId),
                        otp,
                    },
                );

            /*
            |--------------------------------------------------------------------------
            | SAVE RESET TOKEN
            |--------------------------------------------------------------------------
            */

            sessionStorage.setItem(
                'reset_token',
                response.data.reset_token,
            );

            sessionStorage.setItem(
                'reset_user_id',
                String(
                    response.data.user_id ||
                        userId,
                ),
            );

            /*
            |--------------------------------------------------------------------------
            | RESET SESSION
            |--------------------------------------------------------------------------
            */

            sessionStorage.removeItem(
                'otp_expires_at',
            );

            /*
            |--------------------------------------------------------------------------
            | GO TO RESET PASSWORD
            |--------------------------------------------------------------------------
            */

            window.location.href =
                '/reset-password';

        } catch (error: any) {
            if (
                axios.isAxiosError(error)
            ) {
                const response =
                    error.response;

                if (
                    response?.status === 422
                ) {
                    setError(
                        response.data?.errors
                            ?.otp?.[0] ||
                            response.data
                                ?.message ||
                            'Invalid verification code.',
                    );

                    return;
                }

                setError(
                    response?.data
                        ?.message ||
                        'Unable to verify the code.',
                );

                return;
            }

            setError(
                'Unable to verify the code. Please try again.',
            );
        } finally {
            setProcessing(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | RESEND OTP
    |--------------------------------------------------------------------------
    */

    const resendOtp = async () => {
        if (
            secondsLeft > 0 ||
            resending
        ) {
            return;
        }

        setResending(true);
        setError('');
        setSuccess('');

        if (!phone) {
            setError(
                'Mobile number is missing. Please start the password recovery process again.',
            );

            setResending(false);
            return;
        }

        try {
            const response =
                await axios.post(
                    '/api/forgot-password',
                    {
                        phone,
                    },
                );

            /*
            |--------------------------------------------------------------------------
            | UPDATE USER ID
            |--------------------------------------------------------------------------
            */

            if (
                response.data?.user_id
            ) {
                setUserId(
                    String(
                        response.data.user_id,
                    ),
                );

                sessionStorage.setItem(
                    'reset_user_id',
                    String(
                        response.data.user_id,
                    ),
                );
            }

            /*
            |--------------------------------------------------------------------------
            | RESET TIMER
            |--------------------------------------------------------------------------
            */

            setSecondsLeft(
                OTP_DURATION,
            );

            setOtp('');

            setSuccess(
                'A new verification code has been sent to your mobile number.',
            );

        } catch (error: any) {
            setError(
                error.response?.data
                    ?.message ||
                    'Unable to resend the verification code.',
            );
        } finally {
            setResending(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | MASK PHONE
    |--------------------------------------------------------------------------
    */

    const maskedPhone = phone
        ? phone.substring(0, 4) +
          '••••' +
          phone.substring(8)
        : '';

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <>
            <Head title="Verify OTP | Municipality of Estancia" />

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
                                    municipal documents throughout
                                    the Municipality of Estancia.
                                </p>

                                <div className="mt-8 flex items-center gap-3">

                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                                        <ShieldCheck className="h-5 w-5 text-emerald-300" />
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold">
                                            Secure OTP Verification
                                        </p>

                                        <p className="text-[10px] text-blue-200">
                                            Verify your registered mobile number
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
                        {/* RIGHT PANEL */}
                        {/* ================================================== */}

                        <section className="flex items-center p-6 sm:p-8 lg:p-10">

                            <div className="w-full">

                                {/* MOBILE LOGO */}

                                <div className="mb-5 flex justify-center lg:hidden">

                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white p-1 shadow-md ring-1 ring-slate-200">

                                        <img
                                            src="/images/estancia-logo.png"
                                            alt="Municipality of Estancia"
                                            className="h-full w-full object-contain"
                                        />

                                    </div>

                                </div>

                                {/* ICON */}

                                <div className="mb-4 flex justify-center lg:justify-start">

                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">

                                        <CheckCircle2 className="h-5 w-5" />

                                    </div>

                                </div>

                                {/* TITLE */}

                                <div className="mb-6 text-center lg:text-left">

                                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">
                                        Security Verification
                                    </p>

                                    <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
                                        Verify your mobile
                                    </h2>

                                    <p className="mt-2 text-xs leading-5 text-slate-500">
                                        Enter the 6-digit code sent to
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-slate-800">
                                        {maskedPhone}
                                    </p>

                                </div>

                                {/* ALERT */}

                                {success && (
                                    <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
                                        {success}
                                    </div>
                                )}

                                {error && (
                                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                                        {error}
                                    </div>
                                )}

                                {/* TIMER */}

                                <div
                                    className={`mb-5 flex items-center justify-between rounded-xl border px-4 py-3 ${
                                        timerExpired
                                            ? 'border-red-200 bg-red-50'
                                            : 'border-slate-200 bg-slate-50'
                                    }`}
                                >

                                    <div className="flex items-center gap-2">

                                        <Clock3
                                            className={`h-4 w-4 ${
                                                timerExpired
                                                    ? 'text-red-600'
                                                    : 'text-blue-700'
                                            }`}
                                        />

                                        <div>
                                            <p className="text-[10px] font-medium text-slate-500">
                                                Code expires in
                                            </p>

                                            <p
                                                className={`text-sm font-bold ${
                                                    timerExpired
                                                        ? 'text-red-600'
                                                        : 'text-slate-900'
                                                }`}
                                            >
                                                {timerExpired
                                                    ? 'Expired'
                                                    : `${minutes}:${seconds}`}
                                            </p>
                                        </div>

                                    </div>

                                    {timerExpired && (
                                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-[9px] font-semibold text-red-700">
                                            New code required
                                        </span>
                                    )}

                                </div>

                                {/* FORM */}

                                <form
                                    onSubmit={submit}
                                    className="space-y-4"
                                >

                                    <div>

                                        <Label
                                            htmlFor="otp"
                                            className="mb-2 block text-xs font-semibold text-slate-700"
                                        >
                                            Verification Code
                                        </Label>

                                        <Input
                                            id="otp"
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            maxLength={6}
                                            required
                                            autoFocus
                                            value={otp}
                                            onChange={(e) =>
                                                setOtp(
                                                    e.target.value.replace(
                                                        /\D/g,
                                                        '',
                                                    ),
                                                )
                                            }
                                            disabled={
                                                processing ||
                                                timerExpired
                                            }
                                            placeholder="000000"
                                            className="h-14 rounded-xl border-slate-200 bg-slate-50 px-4 text-center text-2xl font-bold tracking-[0.5em] transition focus:bg-white"
                                        />

                                    </div>

                                    {/* SECURITY */}

                                    <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3">

                                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

                                        <div>

                                            <p className="text-xs font-semibold text-blue-900">
                                                Secure verification
                                            </p>

                                            <p className="mt-1 text-[10px] leading-4 text-blue-700">
                                                Never share this code with
                                                anyone.
                                            </p>

                                        </div>

                                    </div>

                                    {/* VERIFY */}

                                    <Button
                                        type="submit"
                                        disabled={
                                            processing ||
                                            timerExpired ||
                                            otp.length !== 6
                                        }
                                        className="h-11 w-full rounded-xl bg-[#0b5cab] text-sm font-semibold shadow-lg shadow-blue-900/10 transition hover:bg-[#084b8d]"
                                    >

                                        {processing ? (
                                            <>
                                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            'Verify Code'
                                        )}

                                    </Button>

                                </form>

                                {/* RESEND */}

                                <div className="mt-5 text-center">

                                    {!timerExpired ? (
                                        <p className="text-[11px] text-slate-400">
                                            You can request a new code
                                            when the timer expires.
                                        </p>
                                    ) : (
                                        <>
                                            <p className="text-xs text-slate-500">
                                                Didn't receive the code?
                                            </p>

                                            <button
                                                type="button"
                                                onClick={resendOtp}
                                                disabled={
                                                    resending
                                                }
                                                className="mt-1.5 text-xs font-semibold text-blue-700 transition hover:text-blue-800 disabled:opacity-50"
                                            >
                                                {resending
                                                    ? 'Sending new code...'
                                                    : 'Resend verification code'}
                                            </button>
                                        </>
                                    )}

                                </div>

                                {/* BACK */}

                                <div className="mt-5 border-t border-slate-100 pt-5 text-center">

                                    <TextLink
                                        href="/forgot-password"
                                        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-700"
                                    >
                                        <ArrowLeft className="h-3.5 w-3.5" />

                                        Back to password recovery
                                    </TextLink>

                                </div>

                                {/* FOOTER */}

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