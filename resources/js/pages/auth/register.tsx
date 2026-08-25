import { Head } from '@inertiajs/react';
import axios from 'axios';
import {
    Building2,
    ChevronDown,
    LoaderCircle,
    ShieldCheck,
} from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Department {
    id: number;
    name: string;
    code: string;
}

interface RegisterForm {
    name: string;
    phone: string;
    department_id: string;
    password: string;
    password_confirmation: string;
}

interface ApiErrors {
    name?: string;
    phone?: string;
    department_id?: string;
    password?: string;
    password_confirmation?: string;
}

export default function Register() {
    const [data, setData] = useState<RegisterForm>({
        name: '',
        phone: '',
        department_id: '',
        password: '',
        password_confirmation: '',
    });

    const [departments, setDepartments] = useState<Department[]>([]);
    const [loadingDepartments, setLoadingDepartments] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<ApiErrors>({});
    const [generalError, setGeneralError] = useState('');

    /*
    |--------------------------------------------------------------------------
    | LOAD DEPARTMENTS
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const loadDepartments = async () => {
            try {
                const response = await axios.get('/api/departments');

                setDepartments(response.data);
            } catch (error) {
                console.error(
                    'Failed to load departments:',
                    error,
                );

                setGeneralError(
                    'Unable to load departments. Please refresh the page.',
                );
            } finally {
                setLoadingDepartments(false);
            }
        };

        loadDepartments();
    }, []);

    /*
    |--------------------------------------------------------------------------
    | REGISTER
    |--------------------------------------------------------------------------
    */

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();

        setProcessing(true);
        setErrors({});
        setGeneralError('');

        try {
            const response = await axios.post('/api/register', {
                name: data.name,
                phone: data.phone,
                department_id: Number(data.department_id),
                password: data.password,
                password_confirmation:
                    data.password_confirmation,
            });

            const userId = response.data.user_id;
            const phone = response.data.phone;

            sessionStorage.setItem(
                'otp_user_id',
                String(userId),
            );

            sessionStorage.setItem(
                'otp_phone',
                phone,
            );

            window.location.href =
                `/verify-otp?user_id=${userId}&phone=${encodeURIComponent(phone)}`;

        } catch (error: any) {
            if (
                axios.isAxiosError(error) &&
                error.response?.status === 422
            ) {
                const validationErrors =
                    error.response.data.errors;

                if (validationErrors) {
                    setErrors({
                        name:
                            validationErrors.name?.[0],
                        phone:
                            validationErrors.phone?.[0],
                        department_id:
                            validationErrors.department_id?.[0],
                        password:
                            validationErrors.password?.[0],
                        password_confirmation:
                            validationErrors
                                .password_confirmation?.[0],
                    });
                } else {
                    setGeneralError(
                        error.response.data.message ||
                            'Please check your information.',
                    );
                }

                return;
            }

            if (
                axios.isAxiosError(error) &&
                error.response?.data?.message
            ) {
                setGeneralError(
                    error.response.data.message,
                );

                return;
            }

            setGeneralError(
                'Something went wrong. Please try again.',
            );
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <Head title="Create Account | Municipality of Estancia" />

            <div className="h-screen w-full overflow-hidden bg-slate-100">

                {/* ================================================== */}
                {/* TOP GOVERNMENT BAR */}
                {/* ================================================== */}

                <header className="h-[76px] bg-[#0b1f3a] text-white">
                    <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">

                        <div className="flex items-center gap-3">

                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white p-1 shadow-md">
                                <img
                                    src="/images/estancia-logo.png"
                                    alt="Municipality of Estancia"
                                    className="h-full w-full object-contain"
                                />
                            </div>

                            <div>
                                <p className="text-[9px] uppercase tracking-[0.2em] text-blue-200">
                                    Republic of the Philippines
                                </p>

                                <h1 className="text-sm font-bold uppercase tracking-wide sm:text-base">
                                    Municipality of Estancia
                                </h1>

                                <p className="text-[11px] text-blue-200">
                                    Province of Iloilo
                                </p>
                            </div>
                        </div>

                        <div className="hidden text-right sm:block">
                            <p className="text-xs font-semibold">
                                Electronic Document
                            </p>

                            <p className="text-[10px] text-blue-200">
                                Tracking System
                            </p>
                        </div>
                    </div>
                </header>

                {/* ================================================== */}
                {/* MAIN */}
                {/* ================================================== */}

                <main className="flex h-[calc(100vh-76px)] items-center justify-center overflow-hidden px-4 py-4 sm:px-6">

                    <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-300/50 lg:grid-cols-[0.85fr_1.15fr]">

                        {/* ================================================== */}
                        {/* LEFT PANEL */}
                        {/* ================================================== */}

                        <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#0b1f3a] via-[#123b69] to-[#0b5cab] p-8 text-white lg:flex lg:flex-col lg:justify-between">

                            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/10" />
                            <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full border border-white/10" />

                            <div className="relative">

                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white p-2 shadow-xl">
                                    <img
                                        src="/images/estancia-logo.png"
                                        alt="Municipality of Estancia"
                                        className="h-full w-full object-contain"
                                    />
                                </div>

                                <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200">
                                    Municipal Government
                                </p>

                                <h2 className="mt-2 text-3xl font-bold leading-tight">
                                    Electronic Document
                                    <span className="block text-blue-300">
                                        Tracking System
                                    </span>
                                </h2>

                                <p className="mt-5 max-w-sm text-sm leading-6 text-blue-100">
                                    A centralized platform for managing
                                    and tracking official documents
                                    across the Municipality of Estancia.
                                </p>
                            </div>

                            <div className="relative">
                                <div className="flex items-center gap-2 text-xs text-blue-200">
                                    <ShieldCheck className="h-4 w-4 text-emerald-400" />

                                    <span>
                                        Secure municipal access
                                    </span>
                                </div>

                                <p className="mt-3 text-[10px] text-blue-300">
                                    Municipality of Estancia • Iloilo
                                </p>
                            </div>
                        </section>

                        {/* ================================================== */}
                        {/* RIGHT FORM */}
                        {/* ================================================== */}

                        <section className="p-5 sm:p-7 lg:p-8">

                            <div className="mb-5">

                                <div className="flex items-center gap-3">

                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                                        <Building2 className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">
                                            Create Account
                                        </h2>

                                        <p className="text-xs text-slate-500">
                                            Register your municipal account
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 h-px bg-slate-100" />
                            </div>

                            <form
                                onSubmit={submit}
                                className="space-y-3.5"
                            >

                                {/* ERROR */}

                                {generalError && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                                        {generalError}
                                    </div>
                                )}

                                {/* NAME */}

                                <div>
                                    <Label
                                        htmlFor="name"
                                        className="mb-1.5 block text-xs font-semibold text-slate-700"
                                    >
                                        Full Name
                                    </Label>

                                    <Input
                                        id="name"
                                        type="text"
                                        required
                                        autoFocus
                                        autoComplete="name"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                name: e.target.value,
                                            })
                                        }
                                        disabled={processing}
                                        placeholder="Juan Dela Cruz"
                                        className="h-10 rounded-lg bg-slate-50 text-sm"
                                    />

                                    <InputError
                                        message={errors.name}
                                    />
                                </div>

                                {/* PHONE */}

                                <div>
                                    <Label
                                        htmlFor="phone"
                                        className="mb-1.5 block text-xs font-semibold text-slate-700"
                                    >
                                        Mobile Number
                                    </Label>

                                    <Input
                                        id="phone"
                                        type="tel"
                                        required
                                        autoComplete="tel"
                                        value={data.phone}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                phone: e.target.value.replace(
                                                    /\D/g,
                                                    '',
                                                ),
                                            })
                                        }
                                        disabled={processing}
                                        placeholder="09123456789"
                                        maxLength={11}
                                        className="h-10 rounded-lg bg-slate-50 text-sm"
                                    />

                                    <InputError
                                        message={errors.phone}
                                    />
                                </div>

                                {/* DEPARTMENT */}

                                <div>
                                    <Label
                                        htmlFor="department_id"
                                        className="mb-1.5 block text-xs font-semibold text-slate-700"
                                    >
                                        Department / Office
                                    </Label>

                                    <div className="relative">
                                        <select
                                            id="department_id"
                                            required
                                            value={
                                                data.department_id
                                            }
                                            onChange={(e) =>
                                                setData({
                                                    ...data,
                                                    department_id:
                                                        e.target.value,
                                                })
                                            }
                                            disabled={
                                                processing ||
                                                loadingDepartments
                                            }
                                            className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 pr-10 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                                        >
                                            <option value="">
                                                {loadingDepartments
                                                    ? 'Loading departments...'
                                                    : 'Select department / office'}
                                            </option>

                                            {departments.map(
                                                (department) => (
                                                    <option
                                                        key={
                                                            department.id
                                                        }
                                                        value={
                                                            department.id
                                                        }
                                                    >
                                                        {
                                                            department.name
                                                        }
                                                    </option>
                                                ),
                                            )}
                                        </select>

                                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    </div>

                                    <InputError
                                        message={
                                            errors.department_id
                                        }
                                    />
                                </div>

                                {/* PASSWORDS */}

                                <div className="grid grid-cols-2 gap-3">

                                    <div>
                                        <Label
                                            htmlFor="password"
                                            className="mb-1.5 block text-xs font-semibold text-slate-700"
                                        >
                                            Password
                                        </Label>

                                        <Input
                                            id="password"
                                            type="password"
                                            required
                                            autoComplete="new-password"
                                            value={data.password}
                                            onChange={(e) =>
                                                setData({
                                                    ...data,
                                                    password:
                                                        e.target.value,
                                                })
                                            }
                                            disabled={processing}
                                            placeholder="••••••••"
                                            className="h-10 rounded-lg bg-slate-50 text-sm"
                                        />

                                        <InputError
                                            message={
                                                errors.password
                                            }
                                        />
                                    </div>

                                    <div>
                                        <Label
                                            htmlFor="password_confirmation"
                                            className="mb-1.5 block text-xs font-semibold text-slate-700"
                                        >
                                            Confirm Password
                                        </Label>

                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            required
                                            autoComplete="new-password"
                                            value={
                                                data.password_confirmation
                                            }
                                            onChange={(e) =>
                                                setData({
                                                    ...data,
                                                    password_confirmation:
                                                        e.target.value,
                                                })
                                            }
                                            disabled={processing}
                                            placeholder="••••••••"
                                            className="h-10 rounded-lg bg-slate-50 text-sm"
                                        />

                                        <InputError
                                            message={
                                                errors.password_confirmation
                                            }
                                        />
                                    </div>
                                </div>

                                {/* OTP NOTICE */}

                                <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
                                    <ShieldCheck className="h-5 w-5 shrink-0 text-blue-700" />

                                    <p className="text-[11px] leading-4 text-blue-800">
                                        Your mobile number will be verified
                                        through OTP after registration.
                                    </p>
                                </div>

                                {/* BUTTON */}

                                <Button
                                    type="submit"
                                    disabled={
                                        processing ||
                                        loadingDepartments ||
                                        departments.length === 0
                                    }
                                    className="h-10 w-full rounded-lg bg-[#0b5cab] text-sm font-semibold shadow-sm hover:bg-[#084b8d]"
                                >
                                    {processing ? (
                                        <>
                                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                            Creating account...
                                        </>
                                    ) : (
                                        'Create Municipal Account'
                                    )}
                                </Button>

                            </form>

                            {/* LOGIN */}

                            <div className="mt-5 text-center text-xs text-slate-500">
                                Already have an account?{' '}

                                <TextLink
                                    href={route('login')}
                                    className="font-semibold text-blue-700 hover:text-blue-800"
                                >
                                    Sign in
                                </TextLink>
                            </div>

                        </section>
                    </div>
                </main>

                {/* ================================================== */}
                {/* BOTTOM BAR */}
                {/* ================================================== */}

                <footer className="fixed bottom-0 left-0 right-0 hidden h-7 items-center justify-center bg-white/80 text-[9px] text-slate-400 backdrop-blur sm:flex">
                    © {new Date().getFullYear()} Municipal Government of Estancia,
                    Iloilo • Electronic Document Tracking System
                </footer>
            </div>
        </>
    );
}