import { Head } from '@inertiajs/react';
import axios from 'axios';
import {
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

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MAX_RESENDS = 3;

interface VerifyResponse {
    message: string;
    reset_token: string;
    user_id: number;
    expires_in: number;
}

interface ResendResponse {
    message: string;
    user_id: number;
    otp_expires_at: number;
    otp_expires_in: number;
    resends_remaining: number;
}

export default function VerifyForgotPassword() {
    /*
    |--------------------------------------------------------------------------
    | STATE
    |--------------------------------------------------------------------------
    */

    const [otp, setOtp] = useState('');

    const [phone, setPhone] = useState('');

    const [userId, setUserId] = useState('');

    const [expiresAt, setExpiresAt] =
        useState<number | null>(null);

    const [secondsLeft, setSecondsLeft] =
        useState(0);

    const [processing, setProcessing] =
        useState(false);

    const [resending, setResending] =
        useState(false);

    const [error, setError] =
        useState('');

    const [success, setSuccess] =
        useState('');

    const [resendsRemaining, setResendsRemaining] =
        useState(MAX_RESENDS);

    /*
    |--------------------------------------------------------------------------
    | LOAD RECOVERY SESSION
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const params =
            new URLSearchParams(
                window.location.search,
            );

        /*
        |--------------------------------------------------------------------------
        | URL VALUES
        |--------------------------------------------------------------------------
        */

        const queryUserId =
            params.get('user_id');

        const queryPhone =
            params.get('phone');

        /*
        |--------------------------------------------------------------------------
        | SESSION STORAGE
        |--------------------------------------------------------------------------
        */

        const storedUserId =
            sessionStorage.getItem(
                'reset_user_id',
            );

        const storedPhone =
            sessionStorage.getItem(
                'reset_phone',
            );

        const storedExpiresAt =
            sessionStorage.getItem(
                'otp_expires_at',
            );

        const storedResends =
            sessionStorage.getItem(
                'otp_resends_remaining',
            );

        /*
        |--------------------------------------------------------------------------
        | RESOLVE USER ID
        |--------------------------------------------------------------------------
        */

        const finalUserId =
            queryUserId ||
            storedUserId ||
            '';

        if (finalUserId) {
            setUserId(finalUserId);

            sessionStorage.setItem(
                'reset_user_id',
                finalUserId,
            );
        }

        /*
        |--------------------------------------------------------------------------
        | RESOLVE PHONE
        |--------------------------------------------------------------------------
        */

        const finalPhone =
            queryPhone ||
            storedPhone ||
            '';

        if (finalPhone) {
            setPhone(finalPhone);

            sessionStorage.setItem(
                'reset_phone',
                finalPhone,
            );
        }

        /*
        |--------------------------------------------------------------------------
        | RESTORE TIMER
        |--------------------------------------------------------------------------
        */

        if (storedExpiresAt) {
            const timestamp =
                Number(storedExpiresAt);

            if (
                Number.isFinite(timestamp) &&
                timestamp > 0
            ) {
                setExpiresAt(timestamp);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | RESTORE RESEND COUNT
        |--------------------------------------------------------------------------
        */

        if (storedResends) {
            const remaining =
                Number(storedResends);

            if (
                Number.isFinite(remaining) &&
                remaining >= 0
            ) {
                setResendsRemaining(
                    remaining,
                );
            }
        }
    }, []);

    /*
    |--------------------------------------------------------------------------
    | TIMER
    |--------------------------------------------------------------------------
    |
    | The backend supplies otp_expires_at.
    | We calculate the remaining time from the
    | actual timestamp instead of starting a new
    | 5-minute timer every time the page loads.
    |
    */

    useEffect(() => {
        if (!expiresAt) {
            setSecondsLeft(0);
            return;
        }

        const updateTimer = () => {
            const remaining = Math.max(
                0,
                Math.floor(
                    (expiresAt * 1000 -
                        Date.now()) /
                        1000,
                ),
            );

            setSecondsLeft(
                remaining,
            );
        };

        updateTimer();

        const interval =
            window.setInterval(
                updateTimer,
                1000,
            );

        return () => {
            window.clearInterval(
                interval,
            );
        };
    }, [expiresAt]);

    /*
    |--------------------------------------------------------------------------
    | TIMER VALUES
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
        !expiresAt ||
        secondsLeft <= 0;

    /*
    |--------------------------------------------------------------------------
    | MASK PHONE
    |--------------------------------------------------------------------------
    */

    const maskedPhone =
        phone.length >= 8
            ? `${phone.substring(
                  0,
                  4,
              )}••••${phone.substring(
                  8,
              )}`
            : phone;

    /*
    |--------------------------------------------------------------------------
    | VERIFY OTP
    |--------------------------------------------------------------------------
    */

    const submit: FormEventHandler =
        async (event) => {
            event.preventDefault();

            setError('');
            setSuccess('');

            /*
            |--------------------------------------------------------------------------
            | VALIDATE USER ID
            |--------------------------------------------------------------------------
            */

            if (!userId) {
                setError(
                    'Your password recovery session is invalid. Please start again.',
                );

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | VALIDATE TIMER
            |--------------------------------------------------------------------------
            */

            if (timerExpired) {
                setError(
                    'Your verification code has expired. Please request a new code.',
                );

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | VALIDATE OTP
            |--------------------------------------------------------------------------
            */

            if (otp.length !== 6) {
                setError(
                    'Please enter the 6-digit verification code.',
                );

                return;
            }

            setProcessing(true);

            try {
                const response =
                    await axios.post<VerifyResponse>(
                        '/api/forgot-password/verify',
                        {
                            user_id:
                                Number(
                                    userId,
                                ),

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
                    response.data
                        .reset_token,
                );

                sessionStorage.setItem(
                    'reset_user_id',
                    String(
                        response.data
                            .user_id,
                    ),
                );

                /*
                |--------------------------------------------------------------------------
                | CLEAR OTP SESSION
                |--------------------------------------------------------------------------
                */

                sessionStorage.removeItem(
                    'otp_expires_at',
                );

                sessionStorage.removeItem(
                    'otp_resends_remaining',
                );

                /*
                |--------------------------------------------------------------------------
                | REDIRECT
                |--------------------------------------------------------------------------
                */

                window.location.href =
                    '/reset-password';

            } catch (err: any) {
                if (
                    axios.isAxiosError(
                        err,
                    )
                ) {
                    const response =
                        err.response;

                    /*
                    |--------------------------------------------------------------------------
                    | OTP EXPIRED
                    |--------------------------------------------------------------------------
                    */

                    if (
                        response?.status ===
                        410
                    ) {
                        setSecondsLeft(
                            0,
                        );

                        setError(
                            response.data
                                ?.message ||
                                'Your verification code has expired.',
                        );

                        return;
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | TOO MANY ATTEMPTS
                    |--------------------------------------------------------------------------
                    */

                    if (
                        response?.status ===
                        429
                    ) {
                        setError(
                            response.data
                                ?.message ||
                                'Too many verification attempts.',
                        );

                        return;
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | VALIDATION ERROR
                    |--------------------------------------------------------------------------
                    */

                    if (
                        response?.status ===
                        422
                    ) {
                        setError(
                            response.data
                                ?.message ||
                                response.data
                                    ?.errors
                                    ?.otp?.[0] ||
                                'Invalid verification code.',
                        );

                        return;
                    }

                    setError(
                        response.data
                            ?.message ||
                            'Unable to verify the verification code.',
                    );

                    return;
                }

                setError(
                    'Unable to verify the verification code. Please try again.',
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

    const resendOtp =
        async () => {
            setError('');
            setSuccess('');

            /*
            |--------------------------------------------------------------------------
            | DON'T RESEND WHILE TIMER IS ACTIVE
            |--------------------------------------------------------------------------
            */

            if (!timerExpired) {
                setError(
                    'Please wait until the current verification code expires.',
                );

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | NO RESENDS LEFT
            |--------------------------------------------------------------------------
            */

            if (
                resendsRemaining <=
                0
            ) {
                setError(
                    'Maximum resend attempts reached. Please start a new recovery request later.',
                );

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | USER ID REQUIRED
            |--------------------------------------------------------------------------
            */

            if (!userId) {
                setError(
                    'Your password recovery session is invalid. Please start again.',
                );

                return;
            }

            setResending(true);

            try {
                const response =
                    await axios.post<ResendResponse>(
                        '/api/forgot-password/resend',
                        {
                            user_id:
                                Number(
                                    userId,
                                ),
                        },
                    );

                /*
                |--------------------------------------------------------------------------
                | NEW EXPIRATION
                |--------------------------------------------------------------------------
                */

                const newExpiresAt =
                    response.data
                        .otp_expires_at;

                setExpiresAt(
                    newExpiresAt,
                );

                /*
                |--------------------------------------------------------------------------
                | SAVE EXPIRATION
                |--------------------------------------------------------------------------
                */

                sessionStorage.setItem(
                    'otp_expires_at',
                    String(
                        newExpiresAt,
                    ),
                );

                /*
                |--------------------------------------------------------------------------
                | SAVE RESEND COUNT
                |--------------------------------------------------------------------------
                */

                const remaining =
                    response.data
                        .resends_remaining;

                setResendsRemaining(
                    remaining,
                );

                sessionStorage.setItem(
                    'otp_resends_remaining',
                    String(
                        remaining,
                    ),
                );

                /*
                |--------------------------------------------------------------------------
                | CLEAR OLD OTP
                |--------------------------------------------------------------------------
                */

                setOtp('');

                /*
                |--------------------------------------------------------------------------
                | MESSAGE
                |--------------------------------------------------------------------------
                */

                setSuccess(
                    'A new verification code has been sent to your mobile number.',
                );

            } catch (err: any) {
                if (
                    axios.isAxiosError(
                        err,
                    )
                ) {
                    const response =
                        err.response;

                    /*
                    |--------------------------------------------------------------------------
                    | STILL ACTIVE
                    |--------------------------------------------------------------------------
                    */

                    if (
                        response?.status ===
                        429
                    ) {
                        const retryAfter =
                            response.data
                                ?.retry_after;

                        if (
                            retryAfter
                        ) {
                            const newExpiresAt =
                                Math.floor(
                                    Date.now() /
                                        1000,
                                ) +
                                Number(
                                    retryAfter,
                                );

                            setExpiresAt(
                                newExpiresAt,
                            );

                            sessionStorage.setItem(
                                'otp_expires_at',
                                String(
                                    newExpiresAt,
                                ),
                            );
                        }

                        setError(
                            response.data
                                ?.message ||
                                'Please wait before requesting another code.',
                        );

                        return;
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | SESSION EXPIRED
                    |--------------------------------------------------------------------------
                    */

                    if (
                        response?.status ===
                        410
                    ) {
                        setExpiresAt(
                            null,
                        );

                        sessionStorage.removeItem(
                            'otp_expires_at',
                        );

                        setError(
                            response.data
                                ?.message ||
                                'Your recovery session has expired.',
                        );

                        return;
                    }

                    setError(
                        response.data
                            ?.message ||
                            'Unable to send a new verification code.',
                    );

                    return;
                }

                setError(
                    'Unable to send a new verification code.',
                );
            } finally {
                setResending(false);
            }
        };

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <>
            <Head
                title="Verify OTP | Municipality of Estancia"
            />

            <div className="fixed inset-0 overflow-hidden bg-slate-100">

                {/* ========================================================= */}
                {/* HEADER */}
                {/* ========================================================= */}

                <header className="h-[68px] bg-[#0b1f3a] text-white">

                    <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-5">

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white p-1 shadow-md">

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

                                <h1 className="text-xs font-bold uppercase tracking-wide">
                                    Municipality of Estancia
                                </h1>

                                <p className="text-[9px] text-blue-200">
                                    Province of Iloilo
                                </p>

                            </div>

                        </div>

                        <div className="hidden text-right sm:block">

                            <p className="text-xs font-bold">
                                eDTS
                            </p>

                            <p className="text-[8px] text-blue-200">
                                Electronic Document Tracking System
                            </p>

                        </div>

                    </div>

                </header>

                {/* ========================================================= */}
                {/* MAIN */}
                {/* ========================================================= */}

                <main className="flex h-[calc(100dvh-68px)] items-center justify-center overflow-hidden px-3 py-3 sm:px-5">

                    <div className="flex h-full max-h-[620px] w-full max-w-[980px] overflow-hidden rounded-2xl bg-white shadow-xl">

                        {/* ================================================= */}
                        {/* LEFT BRANDING */}
                        {/* ================================================= */}

                        <section className="relative hidden w-[52%] overflow-hidden bg-gradient-to-br from-[#0b1f3a] via-[#123b69] to-[#0b5cab] p-8 text-white lg:flex lg:flex-col lg:justify-between">

                            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full border border-white/10" />

                            <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full border border-white/10" />

                            <div className="relative">

                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white p-2 shadow-lg">

                                    <img
                                        src="/images/estancia-logo.png"
                                        alt="Municipality of Estancia"
                                        className="h-full w-full object-contain"
                                    />

                                </div>

                                <p className="mt-7 text-[9px] font-semibold uppercase tracking-[0.2em] text-blue-200">
                                    Municipal Government
                                </p>

                                <h2 className="mt-2 text-3xl font-bold leading-tight">
                                    Electronic Document

                                    <span className="block text-blue-300">
                                        Tracking System
                                    </span>
                                </h2>

                                <p className="mt-4 max-w-sm text-xs leading-5 text-blue-100">
                                    Securely manage and track
                                    official municipal documents
                                    throughout the Municipality
                                    of Estancia.
                                </p>

                                <div className="mt-7 flex items-center gap-3">

                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">

                                        <ShieldCheck className="h-4 w-4 text-emerald-300" />

                                    </div>

                                    <div>

                                        <p className="text-[11px] font-semibold">
                                            Secure OTP Verification
                                        </p>

                                        <p className="text-[9px] text-blue-200">
                                            Your account is protected
                                        </p>

                                    </div>

                                </div>

                            </div>

                            <div className="relative">

                                <p className="text-[9px] text-blue-300">
                                    Municipality of Estancia
                                </p>

                                <p className="mt-1 text-[9px] text-blue-400">
                                    Province of Iloilo • Philippines
                                </p>

                            </div>

                        </section>

                        {/* ================================================= */}
                        {/* RIGHT OTP */}
                        {/* ================================================= */}

                        <section className="flex min-w-0 flex-1 items-center justify-center overflow-hidden px-5 py-5 sm:px-8">

                            <div className="w-full max-w-[390px]">

                                {/* MOBILE LOGO */}

                                <div className="mb-4 flex justify-center lg:hidden">

                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white p-1 shadow ring-1 ring-slate-200">

                                        <img
                                            src="/images/estancia-logo.png"
                                            alt="Municipality of Estancia"
                                            className="h-full w-full object-contain"
                                        />

                                    </div>

                                </div>

                                {/* ICON */}

                                <div className="mb-3 flex justify-center lg:justify-start">

                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">

                                        <CheckCircle2 className="h-5 w-5" />

                                    </div>

                                </div>

                                {/* TITLE */}

                                <div className="mb-4 text-center lg:text-left">

                                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-700">
                                        Security Verification
                                    </p>

                                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                                        Verify your mobile
                                    </h2>

                                    <p className="mt-1.5 text-[11px] text-slate-500">
                                        Enter the 6-digit code sent to
                                    </p>

                                    <p className="mt-0.5 text-xs font-bold text-slate-800">
                                        {maskedPhone}
                                    </p>

                                </div>

                                {/* ================================================= */}
                                {/* TIMER */}
                                {/* ================================================= */}

                                <div
                                    className={`mb-4 flex items-center justify-between rounded-xl border px-3.5 py-2.5 ${
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

                                            <p className="text-[9px] text-slate-500">
                                                Code expires in
                                            </p>

                                            <p
                                                className={`text-sm font-bold tabular-nums ${
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

                                    {!timerExpired && (
                                        <span className="text-[9px] font-medium text-slate-400">
                                            5 minute validity
                                        </span>
                                    )}

                                </div>

                                {/* ================================================= */}
                                {/* ALERT */}
                                {/* ================================================= */}

                                {success && (
                                    <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-medium text-emerald-700">
                                        {success}
                                    </div>
                                )}

                                {error && (
                                    <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] text-red-700">
                                        {error}
                                    </div>
                                )}

                                {/* ================================================= */}
                                {/* FORM */}
                                {/* ================================================= */}

                                <form
                                    onSubmit={submit}
                                    className="space-y-3.5"
                                >

                                    <div>

                                        <Label
                                            htmlFor="otp"
                                            className="mb-1.5 block text-[10px] font-semibold text-slate-700"
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
                                            onChange={(event) => {
                                                const value =
                                                    event.target.value
                                                        .replace(
                                                            /\D/g,
                                                            '',
                                                        )
                                                        .slice(
                                                            0,
                                                            6,
                                                        );

                                                setOtp(value);

                                                setError('');
                                            }}
                                            disabled={
                                                processing ||
                                                timerExpired
                                            }
                                            placeholder="000000"
                                            className="h-12 rounded-xl border-slate-200 bg-slate-50 px-3 text-center text-xl font-bold tracking-[0.45em] focus:bg-white"
                                        />

                                    </div>

                                    {/* SECURITY MESSAGE */}

                                    <div className="flex gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">

                                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />

                                        <div>

                                            <p className="text-[10px] font-semibold text-blue-900">
                                                Secure verification
                                            </p>

                                            <p className="mt-0.5 text-[9px] leading-4 text-blue-700">
                                                Never share this verification
                                                code with anyone.
                                            </p>

                                        </div>

                                    </div>

                                    {/* VERIFY BUTTON */}

                                    <Button
                                        type="submit"
                                        disabled={
                                            processing ||
                                            timerExpired ||
                                            otp.length !== 6
                                        }
                                        className="h-10 w-full rounded-xl bg-[#0b5cab] text-xs font-semibold shadow-md shadow-blue-900/10 hover:bg-[#084b8d]"
                                    >

                                        {processing ? (
                                            <>
                                                <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" />

                                                Verifying...
                                            </>
                                        ) : (
                                            'Verify Code'
                                        )}

                                    </Button>

                                </form>

                                {/* ================================================= */}
                                {/* RESEND */}
                                {/* ================================================= */}

                                <div className="mt-4 text-center">

                                    {!timerExpired ? (

                                        <div>

                                            <p className="text-[10px] text-slate-400">
                                                Didn't receive the code?
                                            </p>

                                            <p className="mt-1 text-[9px] text-slate-400">
                                                You can request a new code
                                                after the timer expires.
                                            </p>

                                        </div>

                                    ) : resendsRemaining > 0 ? (

                                        <div>

                                            <p className="text-[10px] text-slate-500">
                                                Didn't receive the code?
                                            </p>

                                            <button
                                                type="button"
                                                onClick={
                                                    resendOtp
                                                }
                                                disabled={
                                                    resending
                                                }
                                                className="mt-1 text-[10px] font-bold text-blue-700 transition hover:text-blue-800 disabled:opacity-50"
                                            >

                                                {resending ? (
                                                    <span className="inline-flex items-center gap-1.5">

                                                        <LoaderCircle className="h-3 w-3 animate-spin" />

                                                        Sending new code...

                                                    </span>
                                                ) : (
                                                    'Resend verification code'
                                                )}

                                            </button>

                                            <p className="mt-1 text-[9px] text-slate-400">
                                                {resendsRemaining}{' '}
                                                resend
                                                {resendsRemaining !==
                                                1
                                                    ? 's'
                                                    : ''}{' '}
                                                remaining
                                            </p>

                                        </div>

                                    ) : (

                                        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2">

                                            <p className="text-[10px] font-semibold text-red-700">
                                                Resend limit reached
                                            </p>

                                            <p className="mt-0.5 text-[9px] text-red-600">
                                                Maximum verification code
                                                requests reached.
                                            </p>

                                        </div>

                                    )}

                                </div>

                                {/* ================================================= */}
                                {/* FOOTER */}
                                {/* ================================================= */}

                                <div className="mt-5 border-t border-slate-100 pt-4 text-center">

                                    <p className="text-[8px] uppercase tracking-[0.14em] text-slate-400">
                                        Municipal Government of Estancia
                                    </p>

                                    <p className="mt-0.5 text-[8px] text-slate-400">
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