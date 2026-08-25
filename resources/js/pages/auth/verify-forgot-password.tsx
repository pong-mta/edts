import { Head } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowLeft,
    CheckCircle2,
    LoaderCircle,
    ShieldCheck,
} from 'lucide-react';
import {
    useEffect,
    useRef,
    useState,
} from 'react';

export default function VerifyForgotPassword() {
    const [userId, setUserId] =
        useState<string>('');

    const [phone, setPhone] =
        useState<string>('');

    const [otp, setOtp] = useState<string[]>([
        '',
        '',
        '',
        '',
        '',
        '',
    ]);

    const [processing, setProcessing] =
        useState(false);

    const [resending, setResending] =
        useState(false);

    const [error, setError] =
        useState('');

    const [success, setSuccess] =
        useState('');

    const [countdown, setCountdown] =
        useState(300);

    const inputs = useRef<
        Array<HTMLInputElement | null>
    >([]);

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

        const queryUserId =
            params.get('user_id') ||
            sessionStorage.getItem(
                'forgot_password_user_id',
            );

        const queryPhone =
            params.get('phone') ||
            sessionStorage.getItem(
                'forgot_password_phone',
            );

        const queryExpiresAt =
            params.get('otp_expires_at') ||
            sessionStorage.getItem(
                'forgot_password_otp_expires_at',
            );

        if (queryUserId) {
            setUserId(queryUserId);

            sessionStorage.setItem(
                'forgot_password_user_id',
                queryUserId,
            );
        }

        if (queryPhone) {
            setPhone(queryPhone);

            sessionStorage.setItem(
                'forgot_password_phone',
                queryPhone,
            );
        }

        if (queryExpiresAt) {
            const remaining = Math.max(
                0,
                Math.floor(
                    Number(queryExpiresAt) -
                        Date.now() / 1000,
                ),
            );

            setCountdown(
                remaining,
            );
        } else {
            /*
            |--------------------------------------------------------------------------
            | DEFAULT 5 MINUTES
            |--------------------------------------------------------------------------
            */

            const expiresAt =
                Math.floor(
                    Date.now() / 1000,
                ) + 300;

            sessionStorage.setItem(
                'forgot_password_otp_expires_at',
                String(expiresAt),
            );

            setCountdown(300);
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

        const timer =
            window.setInterval(() => {
                setCountdown(
                    (value) =>
                        value > 0
                            ? value - 1
                            : 0,
                );
            }, 1000);

        return () =>
            window.clearInterval(
                timer,
            );
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
        const digits =
            value.replace(
                /\D/g,
                '',
            );

        /*
        |--------------------------------------------------------------------------
        | CLEAR
        |--------------------------------------------------------------------------
        */

        if (!digits) {
            const newOtp = [...otp];

            newOtp[index] = '';

            setOtp(newOtp);
            setError('');

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | PASTE 6 DIGITS
        |--------------------------------------------------------------------------
        */

        if (digits.length > 1) {
            const pasted = digits
                .slice(0, 6)
                .split('');

            const newOtp = [
                '',
                '',
                '',
                '',
                '',
                '',
            ];

            pasted.forEach(
                (digit, i) => {
                    newOtp[i] = digit;
                },
            );

            setOtp(newOtp);
            setError('');

            const nextIndex = Math.min(
                pasted.length,
                5,
            );

            setTimeout(() => {
                inputs.current[
                    nextIndex
                ]?.focus();
            }, 50);

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | SINGLE DIGIT
        |--------------------------------------------------------------------------
        */

        const newOtp = [...otp];

        newOtp[index] =
            digits.slice(-1);

        setOtp(newOtp);
        setError('');

        if (index < 5) {
            inputs.current[
                index + 1
            ]?.focus();
        }
    };

    /*
    |--------------------------------------------------------------------------
    | KEYBOARD
    |--------------------------------------------------------------------------
    */

    const handleKeyDown = (
        index: number,
        event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (
            event.key === 'Backspace' &&
            !otp[index] &&
            index > 0
        ) {
            inputs.current[
                index - 1
            ]?.focus();
        }
    };

    /*
    |--------------------------------------------------------------------------
    | VERIFY OTP
    |--------------------------------------------------------------------------
    */

    const verify = async () => {
        const code =
            otp.join('');

        setError('');
        setSuccess('');

        /*
        |--------------------------------------------------------------------------
        | VALIDATE CODE
        |--------------------------------------------------------------------------
        */

        if (code.length !== 6) {
            setError(
                'Please enter the complete 6-digit verification code.',
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | VALIDATE USER
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
        | CHECK TIMER
        |--------------------------------------------------------------------------
        */

        if (countdown <= 0) {
            setError(
                'This verification code has expired. Please request a new code.',
            );

            return;
        }

        setProcessing(true);

        try {
            /*
            |--------------------------------------------------------------------------
            | VERIFY
            |--------------------------------------------------------------------------
            */

            const response =
                await axios.post(
                    '/api/forgot-password/verify',
                    {
                        user_id:
                            Number(
                                userId,
                            ),

                        otp: code,
                    },
                );

            /*
            |--------------------------------------------------------------------------
            | GET RESET TOKEN
            |--------------------------------------------------------------------------
            */

            const resetToken =
                response.data
                    ?.reset_token;

            if (!resetToken) {
                throw new Error(
                    'Reset token was not returned by the server.',
                );
            }

            /*
            |--------------------------------------------------------------------------
            | IMPORTANT
            |--------------------------------------------------------------------------
            |
            | This MUST be "reset_token".
            |
            | reset-password.tsx reads:
            |
            | sessionStorage.getItem('reset_token')
            |
            */

            sessionStorage.setItem(
                'reset_token',
                resetToken,
            );

            /*
            |--------------------------------------------------------------------------
            | SAVE USER ID
            |--------------------------------------------------------------------------
            */

            sessionStorage.setItem(
                'reset_user_id',
                String(
                    response.data
                        ?.user_id ||
                        userId,
                ),
            );

            /*
            |--------------------------------------------------------------------------
            | SAVE PHONE
            |--------------------------------------------------------------------------
            */

            if (phone) {
                sessionStorage.setItem(
                    'reset_phone',
                    phone,
                );
            }

            /*
            |--------------------------------------------------------------------------
            | REMOVE OLD TOKEN KEY
            |--------------------------------------------------------------------------
            |
            | Prevent old sessions from causing confusion.
            |
            */

            sessionStorage.removeItem(
                'password_reset_token',
            );

            sessionStorage.removeItem(
                'password_reset_user_id',
            );

            /*
            |--------------------------------------------------------------------------
            | REMOVE OTP SESSION
            |--------------------------------------------------------------------------
            */

            sessionStorage.removeItem(
                'forgot_password_otp_expires_at',
            );

            sessionStorage.removeItem(
                'forgot_password_user_id',
            );

            sessionStorage.removeItem(
                'forgot_password_phone',
            );

            /*
            |--------------------------------------------------------------------------
            | SUCCESS
            |--------------------------------------------------------------------------
            */

            setSuccess(
                'Verification successful. Redirecting...',
            );

            /*
            |--------------------------------------------------------------------------
            | RESET PASSWORD PAGE
            |--------------------------------------------------------------------------
            */

            window.setTimeout(() => {
                window.location.href =
                    '/reset-password';
            }, 700);
        } catch (error: any) {
            /*
            |--------------------------------------------------------------------------
            | API ERROR
            |--------------------------------------------------------------------------
            */

            const message =
                error?.response?.data
                    ?.message ||
                error?.message ||
                'Invalid verification code. Please try again.';

            setError(message);

            /*
            |--------------------------------------------------------------------------
            | CLEAR INPUT
            |--------------------------------------------------------------------------
            */

            setOtp([
                '',
                '',
                '',
                '',
                '',
                '',
            ]);

            window.setTimeout(() => {
                inputs.current[0]?.focus();
            }, 100);
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
        /*
        |--------------------------------------------------------------------------
        | ONLY AFTER TIMER EXPIRES
        |--------------------------------------------------------------------------
        */

        if (
            !userId ||
            resending ||
            countdown > 0
        ) {
            return;
        }

        setResending(true);
        setError('');
        setSuccess('');

        try {
            const response =
                await axios.post(
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
            | EXPIRATION
            |--------------------------------------------------------------------------
            */

            const expiresIn =
                Number(
                    response.data
                        ?.otp_expires_in ||
                        300,
                );

            const expiresAt =
                Number(
                    response.data
                        ?.otp_expires_at ||
                        Math.floor(
                            Date.now() /
                                1000,
                        ) +
                            expiresIn,
                );

            /*
            |--------------------------------------------------------------------------
            | SAVE EXPIRATION
            |--------------------------------------------------------------------------
            */

            sessionStorage.setItem(
                'forgot_password_otp_expires_at',
                String(expiresAt),
            );

            /*
            |--------------------------------------------------------------------------
            | RESET TIMER
            |--------------------------------------------------------------------------
            */

            setCountdown(
                expiresIn,
            );

            /*
            |--------------------------------------------------------------------------
            | CLEAR OTP
            |--------------------------------------------------------------------------
            */

            setOtp([
                '',
                '',
                '',
                '',
                '',
                '',
            ]);

            /*
            |--------------------------------------------------------------------------
            | SUCCESS
            |--------------------------------------------------------------------------
            */

            setSuccess(
                'A new verification code has been sent to your mobile number.',
            );

            setTimeout(() => {
                inputs.current[0]?.focus();
            }, 100);
        } catch (error: any) {
            const retryAfter =
                error?.response?.data
                    ?.retry_after;

            if (retryAfter) {
                setCountdown(
                    Number(
                        retryAfter,
                    ),
                );
            }

            setError(
                error?.response?.data
                    ?.message ||
                'Unable to resend the verification code.',
            );
        } finally {
            setResending(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | BACK
    |--------------------------------------------------------------------------
    */

    const goBack = () => {
        /*
        |--------------------------------------------------------------------------
        | DO NOT ABUSE ACTIVE OTP
        |--------------------------------------------------------------------------
        */

        if (countdown > 0) {
            setError(
                'Your current verification code is still active. Please complete verification before starting another recovery request.',
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | CLEAR SESSION
        |--------------------------------------------------------------------------
        */

        sessionStorage.removeItem(
            'forgot_password_user_id',
        );

        sessionStorage.removeItem(
            'forgot_password_phone',
        );

        sessionStorage.removeItem(
            'forgot_password_otp_expires_at',
        );

        window.location.href =
            '/forgot-password';
    };

    /*
    |--------------------------------------------------------------------------
    | TIMER
    |--------------------------------------------------------------------------
    */

    const minutes =
        Math.floor(
            countdown / 60,
        )
            .toString()
            .padStart(2, '0');

    const seconds = (
        countdown % 60
    )
        .toString()
        .padStart(2, '0');

    const formattedTime =
        `${minutes}:${seconds}`;

    /*
    |--------------------------------------------------------------------------
    | MASK PHONE
    |--------------------------------------------------------------------------
    */

    const maskedPhone = phone
        ? `${phone.slice(
              0,
              4,
          )}****${phone.slice(-3)}`
        : 'your mobile number';

    /*
    |--------------------------------------------------------------------------
    | UI
    |--------------------------------------------------------------------------
    */

    return (
        <>
            <Head
                title="Verify Recovery Code | Municipality of Estancia"
            />

            <div className="h-screen overflow-hidden bg-slate-100">

                {/* ========================================================== */}
                {/* HEADER */}
                {/* ========================================================== */}

                <header className="h-[72px] bg-[#0b1f3a] text-white">

                    <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-5">

                        <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white p-1">

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

                                <h1 className="text-sm font-bold uppercase">
                                    Municipality of Estancia
                                </h1>

                                <p className="text-[10px] text-blue-200">
                                    Province of Iloilo
                                </p>

                            </div>

                        </div>

                        <div className="text-right">

                            <p className="text-xs font-semibold text-white">
                                eDTS
                            </p>

                            <p className="hidden text-[8px] text-blue-200 sm:block">
                                Electronic Document Tracking System
                            </p>

                        </div>

                    </div>

                </header>

                {/* ========================================================== */}
                {/* MAIN */}
                {/* ========================================================== */}

                <main className="flex h-[calc(100vh-72px)] items-center justify-center overflow-hidden px-4 py-4">

                    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

                        <div className="p-6 sm:p-8">

                            {/* ================================================== */}
                            {/* ICON */}
                            {/* ================================================== */}

                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-700">

                                <ShieldCheck className="h-8 w-8" />

                            </div>

                            {/* ================================================== */}
                            {/* TITLE */}
                            {/* ================================================== */}

                            <div className="mt-5 text-center">

                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">
                                    Password Recovery
                                </p>

                                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                                    Verify your mobile
                                </h2>

                                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                                    Enter the 6-digit verification code sent to
                                </p>

                                <p className="mt-1 font-semibold text-slate-800">
                                    {maskedPhone}
                                </p>

                            </div>

                            {/* ================================================== */}
                            {/* ERROR */}
                            {/* ================================================== */}

                            {error && (
                                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-xs leading-5 text-red-700">
                                    {error}
                                </div>
                            )}

                            {/* ================================================== */}
                            {/* SUCCESS */}
                            {/* ================================================== */}

                            {success && (
                                <div className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">

                                    <CheckCircle2 className="h-4 w-4 shrink-0" />

                                    <span>
                                        {success}
                                    </span>

                                </div>
                            )}

                            {/* ================================================== */}
                            {/* OTP INPUTS */}
                            {/* ================================================== */}

                            <div className="mt-7 flex justify-center gap-2 sm:gap-3">

                                {otp.map(
                                    (
                                        value,
                                        index,
                                    ) => (
                                        <input
                                            key={
                                                index
                                            }
                                            ref={(
                                                element,
                                            ) => {
                                                inputs.current[
                                                    index
                                                ] =
                                                    element;
                                            }}
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete={
                                                index ===
                                                0
                                                    ? 'one-time-code'
                                                    : 'off'
                                            }
                                            maxLength={
                                                1
                                            }
                                            value={
                                                value
                                            }
                                            disabled={
                                                processing
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                handleOtpChange(
                                                    index,
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            onKeyDown={(
                                                event,
                                            ) =>
                                                handleKeyDown(
                                                    index,
                                                    event,
                                                )
                                            }
                                            className="h-12 w-11 rounded-xl border border-slate-200 bg-slate-50 text-center text-xl font-bold text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:h-14 sm:w-12"
                                        />
                                    ),
                                )}

                            </div>

                            {/* ================================================== */}
                            {/* TIMER */}
                            {/* ================================================== */}

                            <div className="mt-5 text-center">

                                {countdown >
                                0 ? (
                                    <p className="text-xs text-slate-500">

                                        Code expires in{' '}

                                        <span className="font-semibold text-blue-700">
                                            {
                                                formattedTime
                                            }
                                        </span>

                                    </p>
                                ) : (
                                    <p className="text-xs font-medium text-red-600">
                                        Verification code expired.
                                    </p>
                                )}

                            </div>

                            {/* ================================================== */}
                            {/* VERIFY */}
                            {/* ================================================== */}

                            <button
                                type="button"
                                onClick={
                                    verify
                                }
                                disabled={
                                    processing ||
                                    otp.join(
                                        '',
                                    ).length !==
                                        6 ||
                                    countdown <=
                                        0
                                }
                                className="mt-6 flex h-11 w-full items-center justify-center rounded-xl bg-[#0b5cab] font-semibold text-white transition hover:bg-[#084b8d] disabled:cursor-not-allowed disabled:opacity-50"
                            >

                                {processing ? (
                                    <>
                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />

                                        Verifying...
                                    </>
                                ) : (
                                    'Verify Recovery Code'
                                )}

                            </button>

                            {/* ================================================== */}
                            {/* RESEND */}
                            {/* ================================================== */}

                            <div className="mt-5 text-center">

                                {countdown >
                                0 ? (
                                    <p className="text-xs leading-5 text-slate-400">
                                        Didn't receive the code?
                                        <br />
                                        You can request another code when the timer expires.
                                    </p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={
                                            resendOtp
                                        }
                                        disabled={
                                            resending
                                        }
                                        className="text-xs font-semibold text-blue-700 hover:text-blue-800 disabled:opacity-50"
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

                            {/* ================================================== */}
                            {/* BACK */}
                            {/* ================================================== */}

                            <div className="mt-6 border-t border-slate-100 pt-5 text-center">

                                <button
                                    type="button"
                                    onClick={
                                        goBack
                                    }
                                    className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800"
                                >

                                    <ArrowLeft className="h-3.5 w-3.5" />

                                    Back to password recovery

                                </button>

                            </div>

                        </div>

                        {/* ================================================== */}
                        {/* FOOTER */}
                        {/* ================================================== */}

                        <div className="border-t border-slate-100 px-6 py-3 text-center">

                            <p className="text-[9px] uppercase tracking-[0.16em] text-slate-400">
                                Municipal Government of Estancia
                            </p>

                        </div>

                    </div>

                </main>

            </div>
        </>
    );
}