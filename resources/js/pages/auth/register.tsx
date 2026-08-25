import { Head, useForm } from '@inertiajs/react';
import axios from 'axios';
import { ChevronDown, LoaderCircle } from 'lucide-react';
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
                    error
                );

                setGeneralError(
                    'Unable to load departments. Please refresh the page and try again.'
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
            const response = await axios.post(
                '/api/register',
                {
                    name: data.name,
                    phone: data.phone,
                    department_id: Number(
                        data.department_id
                    ),
                    password: data.password,
                    password_confirmation:
                        data.password_confirmation,
                }
            );

            /*
            |--------------------------------------------------------------------------
            | REGISTRATION SUCCESSFUL
            |--------------------------------------------------------------------------
            */

            const userId = response.data.user_id;
            const phone = response.data.phone;

            /*
            | Store information temporarily for OTP page
            */

            sessionStorage.setItem(
                'otp_user_id',
                String(userId)
            );

            sessionStorage.setItem(
                'otp_phone',
                phone
            );

            /*
            | Redirect to OTP verification
            */

            window.location.href = `/verify-otp?user_id=${userId}&phone=${encodeURIComponent(phone)}`;

        } catch (error: any) {
            /*
            |--------------------------------------------------------------------------
            | VALIDATION ERRORS
            |--------------------------------------------------------------------------
            */

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
                            'Please check your information.'
                    );
                }

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | OTHER API ERROR
            |--------------------------------------------------------------------------
            */

            if (
                axios.isAxiosError(error) &&
                error.response?.data?.message
            ) {
                setGeneralError(
                    error.response.data.message
                );

                return;
            }

            setGeneralError(
                'Something went wrong. Please try again.'
            );
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AuthLayout
            title="Create an account"
            description="Register your account with the Municipality of Estancia"
        >
            <Head title="Register | Municipality of Estancia" />

            <form
                className="flex flex-col gap-6"
                onSubmit={submit}
            >
                <div className="grid gap-6">

                    {/* GENERAL ERROR */}

                    {generalError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {generalError}
                        </div>
                    )}

                    {/* NAME */}

                    <div className="grid gap-2">
                        <Label htmlFor="name">
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
                                    e.target.value
                                )
                            }
                            disabled={processing}
                            placeholder="Enter your full name"
                        />

                        <InputError
                            message={errors.name}
                        />
                    </div>

                    {/* PHONE */}

                    <div className="grid gap-2">
                        <Label htmlFor="phone">
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
                                    e.target.value
                                )
                            }
                            disabled={processing}
                            placeholder="09XXXXXXXXX"
                            maxLength={11}
                        />

                        <p className="text-xs text-muted-foreground">
                            Enter your 11-digit mobile
                            number starting with 09.
                        </p>

                        <InputError
                            message={errors.phone}
                        />
                    </div>

                    {/* DEPARTMENT */}

                    <div className="grid gap-2">
                        <Label htmlFor="department_id">
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
                                        e.target.value
                                    )
                                }
                                disabled={
                                    processing ||
                                    loadingDepartments
                                }
                                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full appearance-none rounded-md border px-3 py-2 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">
                                    {loadingDepartments
                                        ? 'Loading departments...'
                                        : 'Select your department'}
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
                                    )
                                )}
                            </select>

                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
                        </div>

                        <InputError
                            message={
                                errors.department_id
                            }
                        />
                    </div>

                    {/* PASSWORD */}

                    <div className="grid gap-2">
                        <Label htmlFor="password">
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
                                    e.target.value
                                )
                            }
                            disabled={processing}
                            placeholder="Create a password"
                        />

                        <InputError
                            message={errors.password}
                        />
                    </div>

                    {/* CONFIRM PASSWORD */}

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">
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
                                    e.target.value
                                )
                            }
                            disabled={processing}
                            placeholder="Confirm your password"
                        />

                        <InputError
                            message={
                                errors.password_confirmation
                            }
                        />
                    </div>

                    {/* SUBMIT */}

                    <Button
                        type="submit"
                        className="mt-2 w-full"
                        tabIndex={6}
                        disabled={
                            processing ||
                            loadingDepartments ||
                            departments.length === 0
                        }
                    >
                        {processing && (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                        )}

                        {processing
                            ? 'Creating account...'
                            : 'Create account'}
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-sm">
                    Already have an account?{' '}

                    <TextLink
                        href={route('login')}
                        tabIndex={7}
                    >
                        Log in
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}