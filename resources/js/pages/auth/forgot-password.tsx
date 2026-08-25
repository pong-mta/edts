import { Head } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowRight,
    CheckCircle2,
    KeyRound,
    LoaderCircle,
    ShieldCheck,
} from 'lucide-react';
import {
    FormEventHandler,
    useEffect,
    useState,
} from 'react';

interface ForgotPasswordProps {
    status?: string;
}

export default function ForgotPassword({
    status,
}: ForgotPasswordProps) {
    const [phone, setPhone] = useState('');

    const [processing, setProcessing] =
        useState(false);

    const [error, setError] =
        useState('');

    const [success, setSuccess] =
        useState('');

    /*
    |--------------------------------------------------------------------------
    | EXISTING RECOVERY SESSION
    |--------------------------------------------------------------------------
    */

    const [existingSession, setExistingSession] =
        useState(false);

    const [existingUserId, setExistingUserId] =
        useState('');

    const [existingPhone, setExistingPhone] =
        useState('');

    const [existingExpiresAt, setExistingExpiresAt] =
        useState<number | null>(null);

    const [existingSecondsLeft, setExistingSecondsLeft] =
        useState(0);

    /*
    |--------------------------------------------------------------------------
    | CHECK EXISTING SESSION
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const storedUserId =
            sessionStorage.getItem(
                'forgot_password_user_id',
            );

        const storedPhone =
            sessionStorage.getItem(
                'forgot_password_phone',
            );

        const storedExpiresAt =
            sessionStorage.getItem(
                'forgot_password_otp_expires_at',
            );

        if (
            storedUserId &&
            storedPhone &&
            storedExpiresAt
        ) {
            const expiresAt =
                Number(storedExpiresAt);

            const remaining = Math.max(
                0,
                Math.floor(
                    expiresAt -
                        Date.now() / 1000,
                ),
            );

            /*
            |--------------------------------------------------------------------------
            | EXISTING ACTIVE SESSION
            |--------------------------------------------------------------------------
            */

            if (remaining > 0) {
                setExistingSession(true);

                setExistingUserId(
                    storedUserId,
                );

                setExistingPhone(
                    storedPhone,
                );

                setExistingExpiresAt(
                    expiresAt,
                );

                setExistingSecondsLeft(
                    remaining,
                );

                setPhone(
                    storedPhone,
                );
            }
        }
    }, []);

    /*
    |--------------------------------------------------------------------------
    | EXISTING SESSION TIMER
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (
            !existingSession ||
            !existingExpiresAt
        ) {
            return;
        }

        const timer =
            window.setInterval(() => {
                const remaining =
                    Math.max(
                        0,
                        Math.floor(
                            existingExpiresAt -
                                Date.now() /
                                    1000,
                        ),
                    );

                setExistingSecondsLeft(
                    remaining,
                );

                /*
                |--------------------------------------------------------------------------
                | SESSION EXPIRED
                |--------------------------------------------------------------------------
                */

                if (remaining <= 0) {
                    setExistingSession(
                        false,
                    );

                    setExistingUserId(
                        '',
                    );

                    setExistingExpiresAt(
                        null,
                    );

                    sessionStorage.removeItem(
                        'forgot_password_user_id',
                    );

                    sessionStorage.removeItem(
                        'forgot_password_phone',
                    );

                    sessionStorage.removeItem(
                        'forgot_password_otp_expires_at',
                    );
                }
            }, 1000);

        return () =>
            window.clearInterval(
                timer,
            );
    }, [
        existingSession,
        existingExpiresAt,
    ]);

    /*
    |--------------------------------------------------------------------------
    | FORMAT EXISTING TIMER
    |--------------------------------------------------------------------------
    */

    const existingMinutes =
        Math.floor(
            existingSecondsLeft /
                60,
        )
            .toString()
            .padStart(2, '0');

    const existingSeconds = (
        existingSecondsLeft %
        60
    )
        .toString()
        .padStart(2, '0');

    /*
    |--------------------------------------------------------------------------
    | PHONE FORMAT
    |--------------------------------------------------------------------------
    */

    const handlePhoneChange = (
        value: string,
    ) => {
        const cleaned = value
            .replace(/\D/g, '')
            .slice(0, 11);

        setPhone(cleaned);

        setError('');
        setSuccess('');
    };

    /*
    |--------------------------------------------------------------------------
    | GO TO EXISTING VERIFICATION
    |--------------------------------------------------------------------------
    */

    const continueToVerification = () => {
        if (!existingUserId) {
            return;
        }

        const targetPhone =
            existingPhone || phone;

        window.location.href =
            `/forgot-password/verify?user_id=${encodeURIComponent(
                existingUserId,
            )}&phone=${encodeURIComponent(
                targetPhone,
            )}`;
    };

    /*
    |--------------------------------------------------------------------------
    | SUBMIT
    |--------------------------------------------------------------------------
    */

    const submit: FormEventHandler =
        async (event) => {
            event.preventDefault();

            setError('');
            setSuccess('');

            /*
            |--------------------------------------------------------------------------
            | VALIDATE PHONE
            |--------------------------------------------------------------------------
            */

            if (
                !/^09[0-9]{9}$/.test(
                    phone,
                )
            ) {
                setError(
                    'Mobile number must be exactly 11 digits and start with 09.',
                );

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | EXISTING ACTIVE SESSION
            |--------------------------------------------------------------------------
            |
            | Don't make another API request.
            |
            */

            if (
                existingSession &&
                existingUserId
            ) {
                continueToVerification();

                return;
            }

            setProcessing(true);

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
                | RESPONSE DATA
                |--------------------------------------------------------------------------
                */

                const userId =
                    response.data
                        ?.user_id;

                const responsePhone =
                    response.data
                        ?.phone ||
                    phone;

                const expiresAt =
                    response.data
                        ?.otp_expires_at;

                /*
                |--------------------------------------------------------------------------
                | SAVE SESSION
                |--------------------------------------------------------------------------
                */

                if (userId) {
                    sessionStorage.setItem(
                        'forgot_password_user_id',
                        String(userId),
                    );
                }

                sessionStorage.setItem(
                    'forgot_password_phone',
                    responsePhone,
                );

                if (expiresAt) {
                    sessionStorage.setItem(
                        'forgot_password_otp_expires_at',
                        String(
                            expiresAt,
                        ),
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | GO TO VERIFICATION
                |--------------------------------------------------------------------------
                */

                if (userId) {
                    window.location.href =
                        `/forgot-password/verify?user_id=${encodeURIComponent(
                            String(
                                userId,
                            ),
                        )}&phone=${encodeURIComponent(
                            responsePhone,
                        )}`;

                    return;
                }

                /*
                |--------------------------------------------------------------------------
                | GENERIC RESPONSE
                |--------------------------------------------------------------------------
                */

                setSuccess(
                    response.data
                        ?.message ||
                        'If the mobile number is registered, a verification code has been sent.',
                );
            } catch (error: any) {
                const response =
                    error?.response;

                /*
                |--------------------------------------------------------------------------
                | ACTIVE RECOVERY SESSION
                |--------------------------------------------------------------------------
                |
                | Backend returns 429 when an OTP already exists.
                |
                */

                if (
                    response?.status ===
                        429 &&
                    response.data
                        ?.user_id
                ) {
                    const userId =
                        String(
                            response
                                .data
                                .user_id,
                        );

                    const responsePhone =
                        response
                            .data
                            ?.phone ||
                        phone;

                    const expiresAt =
                        response
                            .data
                            ?.otp_expires_at;

                    /*
                    |--------------------------------------------------------------------------
                    | SAVE EXISTING SESSION
                    |--------------------------------------------------------------------------
                    */

                    sessionStorage.setItem(
                        'forgot_password_user_id',
                        userId,
                    );

                    sessionStorage.setItem(
                        'forgot_password_phone',
                        responsePhone,
                    );

                    if (
                        expiresAt
                    ) {
                        sessionStorage.setItem(
                            'forgot_password_otp_expires_at',
                            String(
                                expiresAt,
                            ),
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | UPDATE UI
                    |--------------------------------------------------------------------------
                    */

                    setExistingSession(
                        true,
                    );

                    setExistingUserId(
                        userId,
                    );

                    setExistingPhone(
                        responsePhone,
                    );

                    if (
                        expiresAt
                    ) {
                        const remaining =
                            Math.max(
                                0,
                                Math.floor(
                                    Number(
                                        expiresAt,
                                    ) -
                                        Date.now() /
                                            1000,
                                ),
                            );

                        setExistingExpiresAt(
                            Number(
                                expiresAt,
                            ),
                        );

                        setExistingSecondsLeft(
                            remaining,
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | IMPORTANT
                    |--------------------------------------------------------------------------
                    |
                    | Don't show duplicate red messages.
                    | Show ONE message and let the user
                    | continue to the existing OTP.
                    |
                    */

                    setError('');

                    setSuccess(
                        'A password recovery request is already active. Please use the current verification code.',
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
                    const message =
                        response
                            .data
                            ?.message;

                    setError(
                        message ||
                            'Please check your mobile number.',
                    );

                    return;
                }

                /*
                |--------------------------------------------------------------------------
                | TOO MANY REQUESTS
                |--------------------------------------------------------------------------
                */

                if (
                    response?.status ===
                    429
                ) {
                    setError(
                        response
                            .data
                            ?.message ||
                            'Too many requests. Please try again later.',
                    );

                    return;
                }

                /*
                |--------------------------------------------------------------------------
                | SERVER ERROR
                |--------------------------------------------------------------------------
                */

                setError(
                    response
                        ?.data
                        ?.message ||
                        'Unable to process your request. Please try again.',
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
            <Head title="Forgot Password | Municipality of Estancia" />

            <div className="h-screen overflow-hidden bg-slate-100">

                {/* ========================================================== */}
                {/* TOP HEADER */}
                {/* ========================================================== */}

                <header className="h-[72px] bg-[#0b1f3a]">

                    <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-5">

                        {/* BRAND */}

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white p-1.5 shadow-sm">

                                <img
                                    src="/images/estancia-logo.png"
                                    alt="Municipality of Estancia"
                                    className="h-full w-full object-contain"
                                />

                            </div>

                            <div className="leading-tight">

                                <p className="text-[7px] uppercase tracking-[0.18em] text-blue-200">
                                    Republic of the Philippines
                                </p>

                                <p className="text-[12px] font-bold text-white">
                                    Municipality of Estancia
                                </p>

                                <p className="text-[8px] text-blue-200">
                                    Province of Iloilo
                                </p>

                            </div>

                        </div>

                        {/* SYSTEM */}

                        <div className="text-right">

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

                <main className="h-[calc(100vh-72px)] overflow-hidden">

                    <div className="mx-auto flex h-full max-w-6xl items-center justify-center px-4 py-4">

                        <div className="grid h-full max-h-[760px] w-full max-w-[1200px] overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-2">

                            {/* ================================================== */}
                            {/* LEFT PANEL */}
                            {/* ================================================== */}

                            <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#102f55] via-[#124b82] to-[#0d5ca8] p-10 text-white lg:flex lg:flex-col">

                                {/* DECORATION */}

                                <div className="absolute -right-32 -top-32 h-[360px] w-[360px] rounded-full border border-white/10" />

                                <div className="absolute -bottom-44 -left-32 h-[420px] w-[420px] rounded-full border border-white/10" />

                                <div className="relative z-10">

                                    {/* LOGO */}

                                    <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white p-4 shadow-xl">

                                        <img
                                            src="/images/estancia-logo.png"
                                            alt="Municipality of Estancia"
                                            className="h-full w-full object-contain"
                                        />

                                    </div>

                                    {/* LABEL */}

                                    <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-200">
                                        Municipal Government
                                    </p>

                                    {/* TITLE */}

                                    <h1 className="mt-3 text-4xl font-bold leading-[1.05] tracking-tight">

                                        Electronic Document

                                        <span className="block text-blue-300">
                                            Tracking System
                                        </span>

                                    </h1>

                                    {/* DESCRIPTION */}

                                    <p className="mt-7 max-w-md text-sm leading-6 text-blue-100">
                                        Securely manage and track official municipal documents across the Municipality of Estancia.
                                    </p>

                                    {/* FEATURE */}

                                    <div className="mt-10 flex items-center gap-4">

                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">

                                            <ShieldCheck className="h-6 w-6 text-emerald-300" />

                                        </div>

                                        <div>

                                            <p className="text-sm font-semibold text-white">
                                                Secure Account Recovery
                                            </p>

                                            <p className="text-[11px] text-blue-200">
                                                Verification through registered mobile
                                            </p>

                                        </div>

                                    </div>

                                </div>

                                {/* FOOTER */}

                                <div className="relative z-10 mt-auto">

                                    <p className="text-[10px] text-blue-200">
                                        Municipality of Estancia
                                    </p>

                                </div>

                            </section>

                            {/* ================================================== */}
                            {/* RIGHT PANEL */}
                            {/* ================================================== */}

                            <section className="flex min-h-0 flex-col justify-center overflow-hidden px-6 py-7 sm:px-10 lg:px-12">

                                {/* ICON */}

                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                                    <KeyRound className="h-6 w-6" />

                                </div>

                                {/* TITLE */}

                                <div className="mt-5">

                                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600">
                                        Account Recovery
                                    </p>

                                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                        Forgot your password?
                                    </h2>

                                    <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                                        Enter your registered mobile number and we'll send you a verification code.
                                    </p>

                                </div>

                                {/* ================================================== */}
                                {/* SUCCESS / EXISTING SESSION */}
                                {/* ================================================== */}

                                {success && (
                                    <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">

                                        <div className="flex items-start gap-3">

                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

                                            <p className="text-xs leading-5 text-emerald-700">
                                                {success}
                                            </p>

                                        </div>

                                    </div>
                                )}

                                {/* ================================================== */}
                                {/* ERROR */}
                                {/* ================================================== */}

                                {error && (
                                    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

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
                                    className="mt-6"
                                >

                                    {/* PHONE */}

                                    <div>

                                        <label
                                            htmlFor="phone"
                                            className="mb-2 block text-xs font-semibold text-slate-700"
                                        >
                                            Registered Mobile Number
                                        </label>

                                        <input
                                            id="phone"
                                            type="tel"
                                            inputMode="numeric"
                                            autoComplete="tel"
                                            maxLength={
                                                11
                                            }
                                            value={
                                                phone
                                            }
                                            disabled={
                                                processing
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                handlePhoneChange(
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            placeholder="09XXXXXXXXX"
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
                                        />

                                    </div>

                                    {/* ================================================== */}
                                    {/* SECURITY INFORMATION */}
                                    {/* ================================================== */}

                                    <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4">

                                        <div className="flex gap-3">

                                            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                                            <div>

                                                <p className="text-xs font-semibold text-blue-900">
                                                    Secure verification
                                                </p>

                                                <p className="mt-1 text-[11px] leading-5 text-blue-600">
                                                    A one-time verification code will be sent to your registered mobile number.
                                                </p>

                                            </div>

                                        </div>

                                    </div>

                                    {/* ================================================== */}
                                    {/* BUTTON */}
                                    {/* ================================================== */}

                                    {existingSession ? (
                                        <button
                                            type="button"
                                            onClick={
                                                continueToVerification
                                            }
                                            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0b63ad] text-sm font-semibold text-white shadow-lg shadow-blue-900/10 transition hover:bg-[#09599d]"
                                        >

                                            Continue to verification

                                            <ArrowRight className="h-4 w-4" />

                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={
                                                processing ||
                                                phone.length !==
                                                    11
                                            }
                                            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0b63ad] text-sm font-semibold text-white shadow-lg shadow-blue-900/10 transition hover:bg-[#09599d] disabled:cursor-not-allowed disabled:opacity-50"
                                        >

                                            {processing ? (
                                                <>
                                                    <LoaderCircle className="h-4 w-4 animate-spin" />

                                                    Sending verification code...
                                                </>
                                            ) : (
                                                <>
                                                    Continue

                                                    <ArrowRight className="h-4 w-4" />
                                                </>
                                            )}

                                        </button>
                                    )}

                                </form>

                                {/* ================================================== */}
                                {/* ACTIVE OTP INFORMATION */}
                                {/* ================================================== */}

                                {existingSession &&
                                    existingSecondsLeft >
                                        0 && (
                                        <div className="mt-4 text-center">

                                            <p className="text-[10px] text-slate-400">
                                                Your current verification code expires in
                                            </p>

                                            <p className="mt-1 text-sm font-bold tabular-nums text-blue-700">
                                                {
                                                    existingMinutes
                                                }
                                                :
                                                {
                                                    existingSeconds
                                                }
                                            </p>

                                        </div>
                                    )}

                                {/* ================================================== */}
                                {/* BACK TO LOGIN */}
                                {/* ================================================== */}

                                <div className="mt-6 border-t border-slate-100 pt-5 text-center">

                                    <a
                                        href="/login"
                                        className="text-xs font-medium text-slate-500 underline-offset-4 hover:text-slate-800 hover:underline"
                                    >
                                        ← Back to login
                                    </a>

                                </div>

                                {/* FOOTER */}

                                <p className="mt-5 text-center text-[9px] uppercase tracking-[0.18em] text-slate-300">
                                    Municipal Government of Estancia
                                </p>

                            </section>

                        </div>

                    </div>

                </main>

            </div>
        </>
    );
}