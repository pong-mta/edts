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
    const [loadingDepartments, setLoadingDepartments] =
        useState(true);

    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<ApiErrors>({});
    const [generalError, setGeneralError] = useState('');

    useEffect(() => {
        const loadDepartments = async () => {
            try {
                const response = await axios.get(
                    '/api/departments',
                );

                setDepartments(response.data);
            } catch (error) {
                console.error(error);

                setGeneralError(
                    'Unable to load departments. Please refresh the page.',
                );
            } finally {
                setLoadingDepartments(false);
            }
        };

        loadDepartments();
    }, []);

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();

        setProcessing(true);
        setErrors({});
        setGeneralError('');

        try {
            const response = await axios.post(
                '/api/register',
                {
                    name: data.name,
                    phone: data.phone,
                    department_id: Number(
                        data.department_id,
                    ),
                    password: data.password,
                    password_confirmation:
                        data.password_confirmation,
                },
            );

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

            setGeneralError(
                error.response?.data?.message ||
                    'Something went wrong. Please try again.',
            );
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <Head title="Create Account | Municipality of Estancia" />

            <div className="h-screen overflow-hidden bg-slate-100">

                {/* HEADER */}

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

                {/* CONTENT */}

                <main className="flex h-[calc(100vh-72px)] items-center justify-center px-4 py-3">

                    <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">

                        {/* LEFT */}

                        <div className="relative hidden bg-gradient-to-br from-[#0b1f3a] via-[#123b69] to-[#0b5cab] p-8 text-white lg:flex lg:flex-col lg:justify-between">

                            <div>
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white p-2 shadow-xl">
                                    <img
                                        src="/images/estancia-logo.png"
                                        alt=""
                                        className="h-full w-full object-contain"
                                    />
                                </div>

                                <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200">
                                    Municipal Government
                                </p>

                                <h2 className="mt-2 text-3xl font-bold leading-tight">
                                    Electronic Document
                                    <span className="block text-blue-300">
                                        Tracking System
                                    </span>
                                </h2>

                                <p className="mt-4 max-w-sm text-sm leading-6 text-blue-100">
                                    Securely manage and track official
                                    municipal documents across
                                    departments and offices.
                                </p>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-blue-200">
                                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                Secure municipal access
                            </div>
                        </div>

                        {/* FORM */}

                        <div className="p-5 sm:p-7 lg:p-8">

                            <div className="mb-4 flex items-center gap-3">
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

                            <div className="mb-5 h-px bg-slate-100" />

                            <form
                                onSubmit={submit}
                                className="space-y-3"
                            >

                                {generalError && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                                        {generalError}
                                    </div>
                                )}

                                <div>
                                    <Label
                                        htmlFor="name"
                                        className="mb-1 block text-xs font-semibold"
                                    >
                                        Full Name
                                    </Label>

                                    <Input
                                        id="name"
                                        type="text"
                                        required
                                        autoFocus
                                        placeholder="Juan Dela Cruz"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                name: e.target.value,
                                            })
                                        }
                                        disabled={processing}
                                        className="h-10 rounded-lg bg-slate-50"
                                    />

                                    <InputError
                                        message={errors.name}
                                    />
                                </div>

                                <div>
                                    <Label
                                        htmlFor="phone"
                                        className="mb-1 block text-xs font-semibold"
                                    >
                                        Mobile Number
                                    </Label>

                                    <Input
                                        id="phone"
                                        type="tel"
                                        required
                                        maxLength={11}
                                        placeholder="09123456789"
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
                                        className="h-10 rounded-lg bg-slate-50"
                                    />

                                    <InputError
                                        message={errors.phone}
                                    />
                                </div>

                                <div>
                                    <Label
                                        htmlFor="department_id"
                                        className="mb-1 block text-xs font-semibold"
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
                                            className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 pr-10 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
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

                                <div className="grid grid-cols-2 gap-3">

                                    <div>
                                        <Label
                                            htmlFor="password"
                                            className="mb-1 block text-xs font-semibold"
                                        >
                                            Password
                                        </Label>

                                        <Input
                                            id="password"
                                            type="password"
                                            required
                                            placeholder="••••••••"
                                            value={
                                                data.password
                                            }
                                            onChange={(e) =>
                                                setData({
                                                    ...data,
                                                    password:
                                                        e.target.value,
                                                })
                                            }
                                            disabled={processing}
                                            className="h-10 rounded-lg bg-slate-50"
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
                                            className="mb-1 block text-xs font-semibold"
                                        >
                                            Confirm
                                        </Label>

                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            required
                                            placeholder="••••••••"
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
                                            className="h-10 rounded-lg bg-slate-50"
                                        />

                                        <InputError
                                            message={
                                                errors.password_confirmation
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
                                    <ShieldCheck className="h-4 w-4 text-blue-700" />

                                    <p className="text-[10px] text-blue-800">
                                        Your mobile number will be verified
                                        through OTP.
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={
                                        processing ||
                                        loadingDepartments ||
                                        departments.length === 0
                                    }
                                    className="h-10 w-full rounded-lg bg-[#0b5cab] text-sm font-semibold hover:bg-[#084b8d]"
                                >
                                    {processing && (
                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                    )}

                                    {processing
                                        ? 'Creating account...'
                                        : 'Create Municipal Account'}
                                </Button>
                            </form>

                            <div className="mt-4 text-center text-xs text-slate-500">
                                Already have an account?{' '}

                                <TextLink
                                    href={route('login')}
                                    className="font-semibold text-blue-700"
                                >
                                    Sign in
                                </TextLink>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}