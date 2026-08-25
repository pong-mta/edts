import { Head, useForm } from '@inertiajs/react';
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
import AuthLayout from '@/layouts/auth-layout';

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
    const { data, setData, reset } = useForm<RegisterForm>({
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
                setLoadingDepartments(true);

                const response = await axios.get('/api/departments');

                setDepartments(response.data);
            } catch (error) {
                console.error('Failed to load departments:', error);

                setGeneralError(
                    'Unable to load departments. Please refresh the page and try again.',
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
                password_confirmation: data.password_confirmation,
            });

            const userId = response.data.user_id;
            const phone = response.data.phone;

            sessionStorage.setItem('otp_user_id', String(userId));
            sessionStorage.setItem('otp_phone', phone);

            window.location.href =
                `/verify-otp?user_id=${userId}&phone=${encodeURIComponent(phone)}`;
        } catch (error: any) {
            if (
                axios.isAxiosError(error) &&
                error.response?.status === 422
            ) {
                const validationErrors = error.response.data.errors;

                if (validationErrors) {
                    setErrors({
                        name: validationErrors.name?.[0],
                        phone: validationErrors.phone?.[0],
                        department_id:
                            validationErrors.department_id?.[0],
                        password: validationErrors.password?.[0],
                        password_confirmation:
                            validationErrors.password_confirmation?.[0],
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
                setGeneralError(error.response.data.message);
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

            <AuthLayout title="" description="">
                <div className="w-full max-w-lg">

                    {/* ================================================== */}
                    {/* GOVERNMENT BRANDING */}
                    {/* ================================================== */}

                    <div className="mb-7 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1f3a] via-[#123b69] to-[#0b5cab] shadow-xl">

                        <div className="relative px-6 py-7 sm:px-8">

                            {/* Decorative circles */}
                            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/5" />
                            <div className="absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-white/5" />

                            <div className="relative flex items-center gap-5">

                                {/* LOGO */}
                                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white p-2 shadow-lg ring-4 ring-white/10">
                                    <img
                                        src="/images/estancia-logo.png"
                                        alt="Municipality of Estancia"
                                        className="h-full w-full object-contain"
                                    />
                                </div>

                                {/* TITLE */}
                                <div className="min-w-0 text-white">
                                    <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-blue-100">
                                        Republic of the Philippines
                                    </p>

                                    <h1 className="mt-1 text-xl font-bold uppercase leading-tight tracking-wide sm:text-2xl">
                                        Municipality of Estancia
                                    </h1>

                                    <p className="mt-1 text-sm text-blue-100">
                                        Province of Iloilo
                                    </p>
                                </div>
                            </div>

                            {/* System identity */}
                            <div className="relative mt-7 border-t border-white/15 pt-5">
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-100">
                                        Electronic Document Tracking System
                                    </span>
                                </div>

                                <h2 className="mt-2 text-2xl font-bold text-white">
                                    Create your account
                                </h2>

                                <p className="mt-1 text-sm text-blue-100">
                                    Register for secure access to the municipal document system.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ================================================== */}
                    {/* FORM */}
                    {/* ================================================== */}

                    <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">

                        {/* Form header */}
                        <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
                            <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                    <Building2 className="h-5 w-5" />
                                </div>

                                <div>
                                    <h3 className="font-semibold text-slate-900">
                                        Registration Details
                                    </h3>

                                    <p className="text-xs text-slate-500">
                                        Complete the information below
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form
                            onSubmit={submit}
                            className="space-y-5 px-6 py-6 sm:px-8 sm:py-7"
                        >

                            {/* ERROR */}

                            {generalError && (
                                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />

                                    <span>
                                        {generalError}
                                    </span>
                                </div>
                            )}

                            {/* NAME */}

                            <div className="space-y-2">
                                <Label
                                    htmlFor="name"
                                    className="text-sm font-semibold text-slate-700"
                                >
                                    Full Name
                                </Label>

                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    autoComplete="name"
                                    tabIndex={1}
                                    value={data.name}
                                    onChange={(e) =>
                                        setData(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    disabled={processing}
                                    placeholder="Juan Dela Cruz"
                                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 px-4 transition focus:bg-white"
                                />

                                <InputError message={errors.name} />
                            </div>

                            {/* PHONE */}

                            <div className="space-y-2">
                                <Label
                                    htmlFor="phone"
                                    className="text-sm font-semibold text-slate-700"
                                >
                                    Mobile Number
                                </Label>

                                <Input
                                    id="phone"
                                    type="tel"
                                    required
                                    autoComplete="tel"
                                    tabIndex={2}
                                    value={data.phone}
                                    onChange={(e) =>
                                        setData(
                                            'phone',
                                            e.target.value.replace(
                                                /\D/g,
                                                '',
                                            ),
                                        )
                                    }
                                    disabled={processing}
                                    placeholder="09123456789"
                                    maxLength={11}
                                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 px-4 tracking-wide transition focus:bg-white"
                                />

                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />

                                    <span>
                                        An OTP will be sent to this number.
                                    </span>
                                </div>

                                <InputError message={errors.phone} />
                            </div>

                            {/* DEPARTMENT */}

                            <div className="space-y-2">
                                <Label
                                    htmlFor="department_id"
                                    className="text-sm font-semibold text-slate-700"
                                >
                                    Department / Office
                                </Label>

                                <div className="relative">
                                    <select
                                        id="department_id"
                                        required
                                        tabIndex={3}
                                        value={data.department_id}
                                        onChange={(e) =>
                                            setData(
                                                'department_id',
                                                e.target.value,
                                            )
                                        }
                                        disabled={
                                            processing ||
                                            loadingDepartments
                                        }
                                        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <option value="">
                                            {loadingDepartments
                                                ? 'Loading departments...'
                                                : 'Select your department / office'}
                                        </option>

                                        {departments.map(
                                            (department) => (
                                                <option
                                                    key={department.id}
                                                    value={department.id}
                                                >
                                                    {department.name}
                                                </option>
                                            ),
                                        )}
                                    </select>

                                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                </div>

                                <InputError
                                    message={errors.department_id}
                                />
                            </div>

                            {/* PASSWORD ROW */}

                            <div className="grid gap-5 sm:grid-cols-2">

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="password"
                                        className="text-sm font-semibold text-slate-700"
                                    >
                                        Password
                                    </Label>

                                    <Input
                                        id="password"
                                        type="password"
                                        required
                                        autoComplete="new-password"
                                        tabIndex={4}
                                        value={data.password}
                                        onChange={(e) =>
                                            setData(
                                                'password',
                                                e.target.value,
                                            )
                                        }
                                        disabled={processing}
                                        placeholder="••••••••"
                                        className="h-11 rounded-xl border-slate-200 bg-slate-50/50 px-4 transition focus:bg-white"
                                    />

                                    <InputError
                                        message={errors.password}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="password_confirmation"
                                        className="text-sm font-semibold text-slate-700"
                                    >
                                        Confirm Password
                                    </Label>

                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        required
                                        autoComplete="new-password"
                                        tabIndex={5}
                                        value={
                                            data.password_confirmation
                                        }
                                        onChange={(e) =>
                                            setData(
                                                'password_confirmation',
                                                e.target.value,
                                            )
                                        }
                                        disabled={processing}
                                        placeholder="••••••••"
                                        className="h-11 rounded-xl border-slate-200 bg-slate-50/50 px-4 transition focus:bg-white"
                                    />

                                    <InputError
                                        message={
                                            errors.password_confirmation
                                        }
                                    />
                                </div>
                            </div>

                            {/* VERIFICATION NOTICE */}

                            <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-sky-50 p-4">
                                <div className="flex gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold text-blue-950">
                                            Mobile verification required
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-blue-700">
                                            Your mobile number will be verified
                                            through a one-time password after
                                            registration.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* SUBMIT */}

                            <Button
                                type="submit"
                                tabIndex={6}
                                disabled={
                                    processing ||
                                    loadingDepartments ||
                                    departments.length === 0
                                }
                                className="h-12 w-full rounded-xl bg-[#0b5cab] text-sm font-semibold shadow-lg shadow-blue-900/10 transition hover:bg-[#084b8d] hover:shadow-xl disabled:opacity-60"
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
                    </div>

                    {/* ================================================== */}
                    {/* LOGIN */}
                    {/* ================================================== */}

                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-500">
                            Already have an account?{' '}

                            <TextLink
                                href={route('login')}
                                tabIndex={7}
                                className="font-semibold text-blue-700 hover:text-blue-800"
                            >
                                Sign in
                            </TextLink>
                        </p>
                    </div>

                    {/* ================================================== */}
                    {/* FOOTER */}
                    {/* ================================================== */}

                    <div className="mt-7 text-center">
                        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                            Municipal Government of Estancia
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                            Province of Iloilo • Philippines
                        </p>
                    </div>
                </div>
            </AuthLayout>
        </>
    );
}