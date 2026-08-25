import { Head } from '@inertiajs/react';
import axios from 'axios';
import { LoaderCircle, ShieldCheck } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

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

const OTP_SECONDS = 5 * 60;
const MAX_RESENDS = 3;

export default function VerifyForgotPassword() {
    const [otp, setOtp] = useState('');
    const [phone, setPhone] = useState('');
    const [userId, setUserId] = useState('');

    const [expiresAt, setExpiresAt] = useState<number | null>(null);
    const [secondsLeft, setSecondsLeft] = useState(0);

    const [processing, setProcessing] = useState(false);
    const [resending, setResending] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [resendsRemaining, setResendsRemaining] =
        useState(MAX_RESENDS);

    /*
    |--------------------------------------------------------------------------
    | Load recovery information
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        const urlUserId = params.get('user_id') ?? '';
        const urlPhone = params.get('phone') ?? '';

        const savedUserId =
            sessionStorage.getItem('reset_user_id') ?? '';

        const savedPhone =
            sessionStorage.getItem('reset_phone') ?? '';

        const savedExpiresAt =
            sessionStorage.getItem('otp_expires_at');

        const savedResends =
            sessionStorage.getItem('otp_resends_remaining');

        const finalUserId = urlUserId || savedUserId;
        const finalPhone = urlPhone || savedPhone;

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

        if (savedExpiresAt) {
            const timestamp = Number(savedExpiresAt);

            if (Number.isFinite(timestamp)) {
                setExpiresAt(timestamp);
            }
        }

        if (savedResends) {
            const remaining = Number(savedResends);

            if (
                Number.isFinite(remaining) &&
                remaining >= 0
            ) {
                setResendsRemaining(remaining);
            }
        }
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Countdown
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!expiresAt) {
            setSecondsLeft(0);
            return;
        }

        const update = () => {
            const remaining = Math.max(
                0,
                Math.floor(
                    expiresAt * 1000 - Date.now(),
                ) / 1000,
            );

            setSecondsLeft(Math.floor(remaining));
        };

        update();

        const timer = window.setInterval(update, 1000);

        return () => {
            window.clearInterval(timer);
        };
    }, [expiresAt]);

    const expired = secondsLeft <= 0;

    const minutes = Math.floor(secondsLeft / 60)
        .toString()
        .padStart(2, '0');

    const seconds = (secondsLeft % 60)
        .toString()
        .padStart(2, '0');

    const maskedPhone =
        phone.length >= 8
            ? `${phone.slice(0, 4)}••••${phone.slice(-3)}`
            : phone;

    /*
    |--------------------------------------------------------------------------
    | Verify OTP
    |--------------------------------------------------------------------------
    */

    const submit: FormEventHandler = async (event) => {
        event.preventDefault();

        setError('');
        setSuccess('');

        if (!userId) {
            setError('Invalid password recovery session.');
            return;
        }

        if (expired) {
            setError(
                'This verification code has expired. Request a new code.',
            );
            return;
        }

        if (otp.length !== 6) {
            setError('Enter the 6-digit verification code.');
            return;
        }

        setProcessing(true);

        try {
            const response =
                await axios.post<VerifyResponse>(
                    '/api/forgot-password/verify',
                    {
                        user_id: Number(userId),
                        otp,
                    },
                );

            sessionStorage.setItem(
                'reset_token',
                response.data.reset_token,
            );

            sessionStorage.setItem(
                'reset_user_id',
                String(response.data.user_id),
            );

            sessionStorage.removeItem('otp_expires_at');
            sessionStorage.removeItem(
                'otp_resends_remaining',
            );

            window.location.href = '/reset-password';
        } catch (err: any) {
            const response = err?.response;

            if (response?.status === 410) {
                setSecondsLeft(0);
                setError(
                    response.data?.message ||
                        'This verification code has expired.',
                );
            } else if (response?.status === 429) {
                setError(
                    response.data?.message ||
                        'Too many verification attempts.',
                );
            } else {
                setError(
                    response?.data?.message ||
                        'Invalid verification code.',
                );
            }
        } finally {
            setProcessing(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Resend OTP
    |--------------------------------------------------------------------------
    */

    const resendOtp = async () => {
        if (!expired || !userId || resendsRemaining <= 0) {
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
                        user_id: Number(userId),
                    },
                );

            const newExpiresAt =
                response.data.otp_expires_at;

            const remaining =
                response.data.resends_remaining;

            setExpiresAt(newExpiresAt);
            setResendsRemaining(remaining);
            setOtp('');

            sessionStorage.setItem(
                'otp_expires_at',
                String(newExpiresAt),
            );

            sessionStorage.setItem(
                'otp_resends_remaining',
                String(remaining),
            );

            setSuccess(
                'A new verification code has been sent.',
            );
        } catch (err: any) {
            const response = err?.response;

            setError(
                response?.data?.message ||
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

            <div className="flex h-dvh items-center justify-center bg-slate-100 px-4">

                <div className="w-full max-w-[420px]">

                    {/* Logo / Government */}
                    <div className="mb-6 text-center">

                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white p-2 shadow-sm ring-1 ring-slate-200">
                            <img
                                src="/images/estancia-logo.png"
                                alt="Municipality of Estancia"
                                className="h-full w-full object-contain"
                            />
                        </div>

                        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                            Republic of the Philippines
                        </p>

                        <h1 className="mt-1 text-sm font-bold text-slate-800">
                            Municipality of Estancia
                        </h1>

                        <p className="text-[10px] text-slate-400">
                            Province of Iloilo
                        </p>

                    </div>

                    {/* Card */}
                    <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200">

                        {/* Header */}
                        <div className="text-center">

                            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                <ShieldCheck className="h-5 w-5" />
                            </div>

                            <h2 className="text-xl font-bold text-slate-900">
                                Verify your account
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                Enter the 6-digit code sent to
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-800">
                                {maskedPhone || 'your mobile number'}
                            </p>

                        </div>

                        {/* Timer */}
                        <div
                            className={`mt-5 rounded-xl px-4 py-3 text-center ${
                                expired
                                    ? 'bg-red-50'
                                    : 'bg-slate-50'
                            }`}
                        >

                            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                Verification code expires in
                            </p>

                            <p
                                className={`mt-1 text-2xl font-bold tabular-nums ${
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

                        {/* Messages */}
                        {error && (
                            <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-600">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs text-emerald-700">
                                {success}
                            </div>
                        )}

                        {/* Form */}
                        <form
                            onSubmit={submit}
                            className="mt-5"
                        >

                            <label
                                htmlFor="otp"
                                className="mb-2 block text-xs font-semibold text-slate-700"
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
                                    processing || expired
                                }
                                onChange={(event) => {
                                    setOtp(
                                        event.target.value
                                            .replace(
                                                /\D/g,
                                                '',
                                            )
                                            .slice(0, 6),
                                    );

                                    setError('');
                                }}
                                placeholder="000000"
                                className="h-14 rounded-xl bg-slate-50 text-center text-2xl font-bold tracking-[0.5em]"
                            />

                            <Button
                                type="submit"
                                disabled={
                                    processing ||
                                    expired ||
                                    otp.length !== 6
                                }
                                className="mt-4 h-11 w-full rounded-xl bg-blue-600 text-sm font-semibold hover:bg-blue-700"
                            >
                                {processing && (
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                )}

                                {processing
                                    ? 'Verifying...'
                                    : 'Verify Code'}
                            </Button>

                        </form>

                        {/* Resend */}
                        <div className="mt-5 border-t border-slate-100 pt-4 text-center">

                            {!expired ? (
                                <p className="text-xs text-slate-400">
                                    Didn't receive the code?
                                    <br />
                                    You can resend it when the timer
                                    reaches zero.
                                </p>
                            ) : resendsRemaining > 0 ? (
                                <>
                                    <p className="text-xs text-slate-500">
                                        Didn't receive the code?
                                    </p>

                                    <button
                                        type="button"
                                        onClick={resendOtp}
                                        disabled={resending}
                                        className="mt-1 text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
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

                                    <p className="mt-1 text-[10px] text-slate-400">
                                        {resendsRemaining}{' '}
                                        resend
                                        {resendsRemaining !== 1
                                            ? 's'
                                            : ''}{' '}
                                        remaining
                                    </p>
                                </>
                            ) : (
                                <p className="text-xs text-red-500">
                                    Resend limit reached.
                                </p>
                            )}

                        </div>

                    </div>

                    {/* Footer */}
                    <p className="mt-4 text-center text-[10px] text-slate-400">
                        Electronic Document Tracking System
                    </p>

                </div>

            </div>
        </>
    );
}