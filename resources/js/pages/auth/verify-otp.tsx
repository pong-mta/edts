import { Head } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowLeft,
    CheckCircle2,
    LoaderCircle,
    ShieldCheck,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

export default function VerifyOtp() {
    const [userId, setUserId] = useState<string>('');
    const [phone, setPhone] = useState<string>('');

    const [otp, setOtp] = useState<string[]>([
        '',
        '',
        '',
        '',
        '',
        '',
    ]);

    const [processing, setProcessing] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [countdown, setCountdown] = useState(300);

    const inputs = useRef<
        Array<HTMLInputElement | null>
    >([]);

    /*
    |--------------------------------------------------------------------------
    | GET USER
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const params = new URLSearchParams(
            window.location.search,
        );

        const queryUserId =
            params.get('user_id') ||
            sessionStorage.getItem('otp_user_id');

        const queryPhone =
            params.get('phone') ||
            sessionStorage.getItem('otp_phone');

        if (queryUserId) {
            setUserId(queryUserId);
        }

        if (queryPhone) {
            setPhone(queryPhone);
        }

        setTimeout(() => {
            inputs.current[0]?.focus();
        }, 200);
    }, []);

    /*
    |--------------------------------------------------------------------------
    | COUNTDOWN
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (countdown <= 0) {
            return;
        }

        const timer = setInterval(() => {
            setCountdown((value) =>
                value > 0 ? value - 1 : 0,
            );
        }, 1000);

        return () => clearInterval(timer);
    }, [countdown]);

    /*
    |--------------------------------------------------------------------------
    | OTP INPUT
    |--------------------------------------------------------------------------
    */

    const handleOtpChange = (
        index: number,
        value: string,
    ) => {
        const digit = value.replace(/\D/g, '');

        if (!digit) {
            const newOtp = [...otp];
            newOtp[index] = '';

            setOtp(newOtp);
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = digit.slice(-1);

        setOtp(newOtp);
        setError('');

        if (index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (
            e.key === 'Backspace' &&
            !otp[index] &&
            index > 0
        ) {
            inputs.current[index - 1]?.focus();
        }
    };

    /*
    |--------------------------------------------------------------------------
    | VERIFY
    |--------------------------------------------------------------------------
    */

    const verify = async () => {
        const code = otp.join('');

        if (code.length !== 6) {
            setError(
                'Please enter the complete 6-digit verification code.',
            );
            return;
        }

        if (!userId) {
            setError(
                'Your verification session is invalid. Please register again.',
            );
            return;
        }

        setProcessing(true);
        setError('');
        setSuccess('');

        try {
            const response = await axios.post(
                '/api/verify-otp',
                {
                    user_id: Number(userId),
                    otp: code,
                },
            );

            const token = response.data.token;

            if (token) {
                localStorage.setItem(
                    'auth_token',
                    token,
                );
            }

            localStorage.setItem(
                'token_type',
                response.data.token_type || 'Bearer',
            );

            if (response.data.user) {
                localStorage.setItem(
                    'user',
                    JSON.stringify(
                        response.data.user,
                    ),
                );
            }

            sessionStorage.removeItem(
                'otp_user_id',
            );

            sessionStorage.removeItem(
                'otp_phone',
            );

            setSuccess(
                'Your phone number has been verified successfully.',
            );

            setTimeout(() => {
                window.location.href =
                    '/dashboard';
            }, 1000);

        } catch (error: any) {
            setError(
                error.response?.data?.message ||
                    'Invalid verification code. Please try again.',
            );

            setOtp([
                '',
                '',
                '',
                '',
                '',
                '',
            ]);

            setTimeout(() => {
                inputs.current[0]?.focus();
            }, 100);

        } finally {
            setProcessing(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | RESEND
    |--------------------------------------------------------------------------
    */

    const resendOtp = async () => {
        if (!userId || resending) {
            return;
        }

        setResending(true);
        setError('');
        setSuccess('');

        try {
            const response = await axios.post(
                '/api/resend-otp',
                {
                    user_id: Number(userId),
                },
            );

            setCountdown(
                response.data.expires_in || 300,
            );

            setOtp([
                '',
                '',
                '',
                '',
                '',
                '',
            ]);

            setSuccess(
                'A new verification code has been sent to your mobile number.',
            );

            setTimeout(() => {
                inputs.current[0]?.focus();
            }, 100);

        } catch (error: any) {
            setError(
                error.response?.data?.message ||
                    'Unable to resend the verification code.',
            );
        } finally {
            setResending(false);
        }
    };

    const formattedTime = `${String(
        Math.floor(countdown / 60),
    ).padStart(2, '0')}:${String(
        countdown % 60,
    ).padStart(2, '0')}`;

    const maskedPhone = phone
        ? `${phone.slice(0, 4)}****${phone.slice(-3)}`
        : '';

    return (
        <>
            <Head title="Verify Mobile Number | Municipality of Estancia" />

            <div className="h-screen overflow-hidden bg-slate-100">

                {/* HEADER */}

                <header className="h-[72px] bg-[#0b1f3a] text-white">
                    <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-5">

                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white p-1">
                                <img
                                    src="/images/estancia-logo.png"
                                    alt=""
                                    className="h-full w-full object-contain"
                                />
                            </div>

                            <div>
                                <p className="text-[8px] uppercase tracking-[0.2em] text-blue-200">
                                    Republic of the Philippines
                                </p>

                                <h1 className="text-sm font-bold uppercase">
                                    Municipality of Estancia
                                </h1>

                                <p className="text-[10px] text-blue-200">
                                    Province of Iloilo
                                </p>
                            </div>
                        </div>

                        <span className="text-xs font-semibold">
                            eDTS
                        </span>
                    </div>
                </header>

                {/* CONTENT */}

                <main className="flex h-[calc(100vh-72px)] items-center justify-center px-4">

                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">

                        {/* ICON */}

                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                            <ShieldCheck className="h-8 w-8" />
                        </div>

                        <div className="mt-5 text-center">

                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">
                                Account Verification
                            </p>

                            <h2 className="mt-2 text-2xl font-bold text-slate-900">
                                Verify your mobile
                            </h2>

                            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                                Enter the 6-digit verification code
                                sent to
                            </p>

                            <p className="mt-1 font-semibold text-slate-800">
                                {maskedPhone || 'your mobile number'}
                            </p>
                        </div>

                        {/* ERROR */}

                        {error && (
                            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-xs text-red-700">
                                {error}
                            </div>
                        )}

                        {/* SUCCESS */}

                        {success && (
                            <div className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                                <CheckCircle2 className="h-4 w-4" />
                                {success}
                            </div>
                        )}

                        {/* OTP */}

                        <div className="mt-7 flex justify-center gap-2 sm:gap-3">

                            {otp.map((value, index) => (
                                <input
                                    key={index}
                                    ref={(element) => {
                                        inputs.current[index] =
                                            element;
                                    }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={value}
                                    onChange={(e) =>
                                        handleOtpChange(
                                            index,
                                            e.target.value,
                                        )
                                    }
                                    onKeyDown={(e) =>
                                        handleKeyDown(
                                            index,
                                            e,
                                        )
                                    }
                                    disabled={processing}
                                    className="h-12 w-11 rounded-xl border border-slate-200 bg-slate-50 text-center text-xl font-bold text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:h-14 sm:w-12"
                                />
                            ))}
                        </div>

                        {/* TIMER */}

                        <div className="mt-5 text-center">
                            {countdown > 0 ? (
                                <p className="text-xs text-slate-500">
                                    Code expires in{' '}
                                    <span className="font-semibold text-blue-700">
                                        {formattedTime}
                                    </span>
                                </p>
                            ) : (
                                <p className="text-xs font-medium text-red-600">
                                    Verification code expired.
                                </p>
                            )}
                        </div>

                        {/* VERIFY */}

                        <Button
                            onClick={verify}
                            disabled={
                                processing ||
                                otp.join('').length !== 6
                            }
                            className="mt-6 h-11 w-full rounded-xl bg-[#0b5cab] font-semibold hover:bg-[#084b8d]"
                        >
                            {processing ? (
                                <>
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                'Verify Mobile Number'
                            )}
                        </Button>

                        {/* RESEND */}

                        <div className="mt-5 text-center">

                            {countdown > 0 ? (
                                <p className="text-xs text-slate-400">
                                    Didn't receive the code?
                                    <br />
                                    You can request another code
                                    when the timer expires.
                                </p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={resendOtp}
                                    disabled={resending}
                                    className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                                >
                                    {resending ? (
                                        <>
                                            <LoaderCircle className="mr-1 inline h-3 w-3 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        'Resend verification code'
                                    )}
                                </button>
                            )}
                        </div>

                        {/* BACK */}

                        <div className="mt-6 border-t border-slate-100 pt-5 text-center">
                            <a
                                href="/register"
                                className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Back to registration
                            </a>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}