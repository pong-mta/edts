import { Head } from '@inertiajs/react';
import axios from 'axios';
import {
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

interface VerifyResponse {
    message: string;
    reset_token: string;
    user_id: number;
}

interface ResendResponse {
    message: string;
    user_id: number;
    otp_expires_at: number;
    resends_remaining: number;
}

const MAX_RESENDS = 3;

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
    | LOAD RECOVERY DATA
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const params =
            new URLSearchParams(
                window.location.search,
            );

        const urlUserId =
            params.get('user_id') ?? '';

        const urlPhone =
            params.get('phone') ?? '';

        const storedUserId =
            sessionStorage.getItem(
                'reset_user_id',
            ) ?? '';

        const storedPhone =
            sessionStorage.getItem(
                'reset_phone',
            ) ?? '';

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
        | USER ID
        |--------------------------------------------------------------------------
        */

        const finalUserId =
            urlUserId || storedUserId;

        if (finalUserId) {
            setUserId(finalUserId);

            sessionStorage.setItem(
                'reset_user_id',
                finalUserId,
            );
        }

        /*
        |--------------------------------------------------------------------------
        | PHONE
        |--------------------------------------------------------------------------
        */

        const finalPhone =
            urlPhone || storedPhone;

        if (finalPhone) {
            setPhone(finalPhone);

            sessionStorage.setItem(
                'reset_phone',
                finalPhone,
            );
        }

        /*
        |--------------------------------------------------------------------------
        | EXPIRATION
        |--------------------------------------------------------------------------
        */

        if (storedExpiresAt) {
            const timestamp =
                Number(storedExpiresAt);

            if (
                Number.isFinite(
                    timestamp,
                ) &&
                timestamp > 0
            ) {
                setExpiresAt(
                    timestamp,
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | RESEND COUNT
        |--------------------------------------------------------------------------
        */

        if (storedResends) {
            const remaining =
                Number(storedResends);

            if (
                Number.isFinite(
                    remaining,
                ) &&
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
    */

    useEffect(() => {
        if (!expiresAt) {
            setSecondsLeft(0);
            return;
        }

        const updateTimer = () => {
            const remaining =
                Math.max(
                    0,
                    Math.floor(
                        (
                            expiresAt *
                                1000 -
                            Date.now()
                        ) /
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
    | TIMER DISPLAY
    |--------------------------------------------------------------------------
    */

    const expired =
        secondsLeft <= 0;

    const minutes =
        Math.floor(
            secondsLeft / 60,
        )
            .toString()
            .padStart(2, '0');

    const seconds =
        (
            secondsLeft % 60
        )
            .toString()
            .padStart(2, '0');

    /*
    |--------------------------------------------------------------------------
    | MASK PHONE
    |--------------------------------------------------------------------------
    */

    const maskedPhone =
        phone.length >= 8
            ? `${phone.slice(
                  0,
                  4,
              )}••••${phone.slice(-3)}`
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

            if (!userId) {
                setError(
                    'Invalid password recovery session.',
                );

                return;
            }

            if (expired) {
                setError(
                    'This verification code has expired. Please request a new code.',
                );

                return;
            }

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
                | REMOVE OTP DATA
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
                | GO TO RESET PASSWORD
                |--------------------------------------------------------------------------
                */

                window.location.href =
                    '/reset-password';
            } catch (err: any) {
                const response =
                    err?.response;

                /*
                |--------------------------------------------------------------------------
                | EXPIRED
                |--------------------------------------------------------------------------
                */

                if (
                    response?.status ===
                    410
                ) {
                    setSecondsLeft(0);

                    setError(
                        response.data
                            ?.message ||
                            'This verification code has expired.',
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
                | VALIDATION / WRONG OTP
                |--------------------------------------------------------------------------
                */

                setError(
                    response?.data
                        ?.message ||
                        'Invalid verification code.',
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
            if (
                !expired ||
                !userId ||
                resendsRemaining <= 0
            ) {
                return;
            }

            setError('');
            setSuccess('');
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

                const newExpiresAt =
                    response.data
                        .otp_expires_at;

                const remaining =
                    response.data
                        .resends_remaining;

                /*
                |--------------------------------------------------------------------------
                | UPDATE STATE
                |--------------------------------------------------------------------------
                */

                setExpiresAt(
                    newExpiresAt,
                );

                setResendsRemaining(
                    remaining,
                );

                setOtp('');

                /*
                |--------------------------------------------------------------------------
                | SAVE SESSION DATA
                |--------------------------------------------------------------------------
                */

                sessionStorage.setItem(
                    'otp_expires_at',
                    String(
                        newExpiresAt,
                    ),
                );

                sessionStorage.setItem(
                    'otp_resends_remaining',
                    String(
                        remaining,
                    ),
                );

                setSuccess(
                    'A new verification code has been sent.',
                );
            } catch (err: any) {
                const response =
                    err?.response;

                setError(
                    response?.data
                        ?.message ||
                        'Unable to send a new verification code.',
                );
            } finally {
                setResending(false);
            }
        };

    /*
    |--------------------------------------------------------------------------
    | UI
    |--------------------------------------------------------------------------
    */

    return (
        <>
            <Head title="Verify OTP" />

            <div className="h-dvh overflow-hidden bg-slate-100">

                <div className="flex h-full items-center justify-center overflow-y-auto px-4 py-4">

                    <div className="w-full max-w-[420px]">

                        {/* ================================================== */}
                        {/* LOGO */}
                        {/* ================================================== */}

                        <div className="mb-4 text-center">

                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white p-1.5 shadow-sm ring-1 ring-slate-200">

                                <img
                                    src="/images/estancia-logo.png"
                                    alt="Municipality of Estancia"
                                    className="h-full w-full object-contain"
                                />

                            </div>

                            <p className="mt-2 text-[9px] uppercase tracking-[0.16em] text-slate-400">
                                Republic of the Philippines
                            </p>

                            <h1 className="text-sm font-bold text-slate-800">
                                Municipality of Estancia
                            </h1>

                            <p className="text-[9px] text-slate-400">
                                Province of Iloilo
                            </p>

                        </div>

                        {/* ================================================== */}
                        {/* CARD */}
                        {/* ================================================== */}

                        <div className="rounded-2xl bg-white px-5 py-5 shadow-lg ring-1 ring-slate-200">

                            {/* HEADER */}

                            <div className="text-center">

                                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">

                                    <ShieldCheck className="h-4 w-4" />

                                </div>

                                <h2 className="text-lg font-bold text-slate-900">
                                    Verify your account
                                </h2>

                                <p className="mt-1 text-[11px] text-slate-500">
                                    Enter the 6-digit code sent to
                                </p>

                                <p className="mt-0.5 text-xs font-semibold text-slate-800">
                                    {maskedPhone ||
                                        'your mobile number'}
                                </p>

                            </div>

                            {/* ================================================== */}
                            {/* TIMER */}
                            {/* ================================================== */}

                            <div
                                className={`mt-4 rounded-xl px-3 py-2 ${
                                    expired
                                        ? 'bg-red-50'
                                        : 'bg-slate-50'
                                }`}
                            >

                                <p className="text-center text-[9px] uppercase tracking-wider text-slate-400">
                                    Code expires in
                                </p>

                                <p
                                    className={`mt-0.5 text-center text-xl font-bold tabular-nums ${
                                        expired
                                            ? 'text-red-600'
                                            : 'text-slate-900'
                                    }`}
                                >
                                    {expired
                                        ? '00:00'
                                        : `${minutes}:${seconds}`}
                                </p>

                            </div>

                            {/* ================================================== */}
                            {/* ERROR */}
                            {/* ================================================== */}

                            {error && (
                                <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-center text-[11px] leading-4 text-red-600">
                                    {error}
                                </div>
                            )}

                            {/* ================================================== */}
                            {/* SUCCESS */}
                            {/* ================================================== */}

                            {success && (
                                <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-center text-[11px] leading-4 text-emerald-700">
                                    {success}
                                </div>
                            )}

                            {/* ================================================== */}
                            {/* FORM */}
                            {/* ================================================== */}

                            <form
                                onSubmit={submit}
                                className="mt-4"
                            >

                                <label
                                    htmlFor="otp"
                                    className="mb-1.5 block text-[11px] font-semibold text-slate-700"
                                >
                                    Verification Code
                                </label>

                                <Input
                                    id="otp"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    value={otp}
                                    disabled={
                                        processing ||
                                        expired
                                    }
                                    onChange={(
                                        event,
                                    ) => {
                                        const value =
                                            event
                                                .target
                                                .value
                                                .replace(
                                                    /\D/g,
                                                    '',
                                                )
                                                .slice(
                                                    0,
                                                    6,
                                                );

                                        setOtp(
                                            value,
                                        );

                                        setError(
                                            '',
                                        );
                                    }}
                                    placeholder="000000"
                                    className="h-12 rounded-xl bg-slate-50 text-center text-xl font-bold tracking-[0.45em]"
                                />

                                <Button
                                    type="submit"
                                    disabled={
                                        processing ||
                                        expired ||
                                        otp.length !==
                                            6
                                    }
                                    className="mt-3 h-10 w-full rounded-xl bg-blue-600 text-xs font-semibold hover:bg-blue-700"
                                >

                                    {processing && (
                                        <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" />
                                    )}

                                    {processing
                                        ? 'Verifying...'
                                        : 'Verify Code'}

                                </Button>

                            </form>

                            {/* ================================================== */}
                            {/* RESEND */}
                            {/* ================================================== */}

                            <div className="mt-4 text-center">

                                {!expired ? (
                                    <p className="text-[10px] leading-4 text-slate-400">
                                        Didn't receive the
                                        code?
                                        <br />
                                        You can resend after
                                        the timer expires.
                                    </p>
                                ) : resendsRemaining >
                                  0 ? (
                                    <>
                                        <p className="text-[10px] text-slate-500">
                                            Didn't receive the
                                            code?
                                        </p>

                                        <button
                                            type="button"
                                            onClick={
                                                resendOtp
                                            }
                                            disabled={
                                                resending
                                            }
                                            className="mt-1 text-[10px] font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                                        >
                                            {resending ? (
                                                <span className="inline-flex items-center gap-1">

                                                    <LoaderCircle className="h-3 w-3 animate-spin" />

                                                    Sending...

                                                </span>
                                            ) : (
                                                'Resend verification code'
                                            )}
                                        </button>

                                        <p className="mt-1 text-[9px] text-slate-400">
                                            {
                                                resendsRemaining
                                            }{' '}
                                            resend
                                            {resendsRemaining !==
                                            1
                                                ? 's'
                                                : ''}{' '}
                                            remaining
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-[10px] text-red-500">
                                        Resend limit reached.
                                    </p>
                                )}

                            </div>

                        </div>

                        {/* ================================================== */}
                        {/* FOOTER */}
                        {/* ================================================== */}

                        <p className="mt-3 text-center text-[9px] text-slate-400">
                            Electronic Document Tracking System
                        </p>

                    </div>

                </div>

            </div>
        </>
    );
}