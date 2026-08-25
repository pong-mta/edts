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
    const {
        data,
        setData,
        reset,
    } = useForm<RegisterForm>({
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
                console.error(
                    'Failed to load departments:',
                    error,
                );

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

            <AuthLayout
                title=""
                description=""
            >
                <div className="w-full">

                    {/* -------------------------------------------------- */}
                    {/* GOVERNMENT HEADER */}
                    {/* -------------------------------------------------- */}

                    <div className="mb-8 text-center">

                        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-white p-2 shadow-sm">
                            <img
                                src="/images/estancia-logo.png"
                                alt="Municipality of Estancia"
                                className="h-full w-full object-contain"
                            />
                        </div>

                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Republic of the Philippines
                        </p>

                        <h1 className="mt-1 text-xl font-bold uppercase tracking-wide text-slate-900">
                            Municipality of Estancia
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Province of Iloilo
                        </p>

                        <div className="mx-auto mt-5 h-px w-16 bg-blue-700" />

                        <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
                            Create an Account
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Register for access to the Electronic
                            Document Tracking System.
                        </p>
                    </div>

                    {/* -------------------------------------------------- */}
                    {/* FORM CARD */}
                    {/* -------------------------------------------------- */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

                        {/* Account Information */}
                        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                                <Building2 className="h-5 w-5" />
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-slate-900">
                                    Account Information
                                </h3>

                                <p className="text-xs text-slate-500">
                                    Enter your municipal account details
                                </p>
                            </div>
                        </div>

                        <form
                            className="space-y-5"
                            onSubmit={submit}
                        >

                            {/* GENERAL ERROR */}

                            {generalError && (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
                                    {generalError}
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
                                    tabIndex={1}
                                    autoComplete="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    disabled={processing}
                                    placeholder="Enter your full name"
                                    className="h-11 rounded-lg"
                                />

                                <InputError
                                    message={errors.name}
                                />
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
                                    tabIndex={2}
                                    autoComplete="tel"
                                    value={data.phone}
                                    onChange={(e) =>
                                        setData(
                                            'phone',
                                            e.target.value,
                                        )
                                    }
                                    disabled={processing}
                                    placeholder="09XXXXXXXXX"
                                    maxLength={11}
                                    className="h-11 rounded-lg"
                                />

                                <p className="text-xs leading-5 text-slate-500">
                                    An OTP will be sent to this
                                    number for verification.
                                </p>

                                <InputError
                                    message={errors.phone}
                                />
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
                                        value={
                                            data.department_id
                                        }
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
                                        className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-10 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
                                    >
                                        <option value="">
                                            {loadingDepartments
                                                ? 'Loading departments...'
                                                : 'Select your department / office'}
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

                            {/* PASSWORD */}

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
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData(
                                            'password',
                                            e.target.value,
                                        )
                                    }
                                    disabled={processing}
                                    placeholder="Create a password"
                                    className="h-11 rounded-lg"
                                />

                                <InputError
                                    message={errors.password}
                                />
                            </div>

                            {/* CONFIRM PASSWORD */}

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
                                    tabIndex={5}
                                    autoComplete="new-password"
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
                                    placeholder="Confirm your password"
                                    className="h-11 rounded-lg"
                                />

                                <InputError
                                    message={
                                        errors.password_confirmation
                                    }
                                />
                            </div>

                            {/* SECURITY NOTICE */}

                            <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

                                <div>
                                    <p className="text-sm font-semibold text-blue-900">
                                        Account Verification
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-blue-700">
                                        After registration, an OTP
                                        will be sent to your mobile
                                        number to verify your account.
                                    </p>
                                </div>
                            </div>

                            {/* SUBMIT */}

                            <Button
                                type="submit"
                                className="h-11 w-full rounded-lg bg-blue-700 text-sm font-semibold shadow-sm transition hover:bg-blue-800"
                                tabIndex={6}
                                disabled={
                                    processing ||
                                    loadingDepartments ||
                                    departments.length === 0
                                }
                            >
                                {processing && (
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                )}

                                {processing
                                    ? 'Creating account...'
                                    : 'Create Account'}
                            </Button>
                        </form>
                    </div>

                    {/* LOGIN */}

                    <div className="mt-6 text-center text-sm text-slate-500">
                        Already have an account?{' '}

                        <TextLink
                            href={route('login')}
                            tabIndex={7}
                            className="font-semibold text-blue-700 hover:text-blue-800"
                        >
                            Sign in
                        </TextLink>
                    </div>

                    {/* FOOTER */}

                    <div className="mt-8 text-center">
                        <p className="text-[11px] text-slate-400">
                            Municipality of Estancia
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                            Electronic Document Tracking System
                        </p>
                    </div>
                </div>
            </AuthLayout>
        </>
    );
}