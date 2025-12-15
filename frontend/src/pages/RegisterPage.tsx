import React, { useRef } from 'react';
import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Anchor,
  Container,
  Alert,
  Stack,
  Progress,
  Popover,
  Box,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconX } from '@tabler/icons-react';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { setToken } from '../utils/auth';

const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email обязателен для заполнения')
      .email('Введите корректный email адрес'),
    password: z
      .string()
      .min(1, 'Пароль обязателен для заполнения')
      .min(8, 'Пароль должен содержать минимум 8 символов')
      .regex(/[a-z]/, 'Пароль должен содержать строчную букву')
      .regex(/[A-Z]/, 'Пароль должен содержать заглавную букву')
      .regex(/[0-9]/, 'Пароль должен содержать цифру'),
    confirmPassword:  z. string().min(1, 'Подтвердите пароль'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

interface ApiError {
  response?:  {
    status?:  number;
    data?: {
      message?:  string | string[];
      error?: string;
    };
  };
  message?: string;
}

interface PasswordRequirementProps {
  meets: boolean;
  label: string;
}

const PasswordRequirement: React.FC<PasswordRequirementProps> = ({ meets, label }) => {
  return (
    <Text
      c={meets ? 'teal' : 'red'}
      size="sm"
      style={{ display: 'flex', alignItems: 'center', gap:  7 }}
    >
      {meets ? <IconCheck size={14} /> : <IconX size={14} />}
      {label}
    </Text>
  );
};

const getPasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (/[a-z]/.test(password)) strength += 25;
  if (/[A-Z]/.test(password)) strength += 25;
  if (/[0-9]/.test(password)) strength += 25;
  return strength;
};

const getStrengthColor = (strength: number): string => {
  if (strength === 100) return 'teal';
  if (strength >= 75) return 'green';
  if (strength >= 50) return 'yellow';
  if (strength >= 25) return 'orange';
  return 'red';
};

const RegisterPage: React. FC = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [popoverOpened, setPopoverOpened] = React.useState(false);
  
  const isSubmittingRef = useRef(false);

  const form = useForm<RegisterFormData>({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: (values) => {
      const result = registerSchema.safeParse(values);
      if (result.success) {
        return {};
      }
      const fieldErrors = result.error.flatten().fieldErrors;
      return {
        email:  fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
        confirmPassword: fieldErrors. confirmPassword?.[0],
      };
    },
    validateInputOnBlur: true,
    validateInputOnChange: ['email', 'password', 'confirmPassword'],
  });

  const password = form.values. password;
  const strength = getPasswordStrength(password);

  const requirements = [
    { meets: password.length >= 8, label: 'Минимум 8 символов' },
    { meets: /[a-z]/.test(password), label: 'Содержит строчную букву' },
    { meets: /[A-Z]/.test(password), label: 'Содержит заглавную букву' },
    { meets: /[0-9]/.test(password), label: 'Содержит цифру' },
  ];

  const getErrorMessage = (error: ApiError): string => {
    const status = error.response?. status;
    const serverMessage = error.response?.data?.message;

    const message = Array.isArray(serverMessage)
      ? serverMessage[0]
      : serverMessage;

    switch (status) {
      case 400:
        return message || 'Некорректные данные для регистрации';
      case 409:
        return 'Пользователь с таким email уже существует';
      case 422:
        return message || 'Проверьте правильность введённых данных';
      case 429:
        return 'Слишком много попыток.  Попробуйте позже';
      case 500:
      case 502:
      case 503:
        return 'Сервер временно недоступен.  Попробуйте позже';
      default:
        if (! error.response) {
          return 'Ошибка сети.  Проверьте подключение к интернету';
        }
        return message || 'Произошла ошибка при регистрации.  Попробуйте ещё раз';
    }
  };

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const response = await api. post('/auth/register', {
        email: data.email,
        password: data.password,
      });
      return response.data;
    },
    onSuccess: (data) => {
      isSubmittingRef. current = false;
      
      setToken(data.access_token);

      notifications.show({
        title: 'Регистрация успешна! ',
        message:  'Добро пожаловать!  Ваш аккаунт создан.',
        color: 'green',
        icon: <IconCheck size={16} />,
        autoClose: 3000,
      });

      setServerError(null);
      navigate('/tasks', { replace: true });
    },
    onError: (error:  ApiError) => {
      isSubmittingRef.current = false;
      
      const errorMessage = getErrorMessage(error);
      setServerError(errorMessage);

      notifications.show({
        title: 'Ошибка регистрации',
        message: errorMessage,
        color: 'red',
        icon: <IconAlertCircle size={16} />,
        autoClose: 5000,
      });

      if (error.response?. status === 409) {
        form.setFieldError('email', 'Этот email уже зарегистрирован');
      }
    },
  });

  const handleSubmit = (values: RegisterFormData) => {
    if (isSubmittingRef. current || registerMutation.isPending) {
      return;
    }
    
    isSubmittingRef.current = true;
    setServerError(null);
    registerMutation.mutate(values);
  };

  return (
    <Container size={420} my={40}>
      <Title
        ta="center"
        fw={900}
        style={{ fontFamily: 'Greycliff CF, var(--mantine-font-family)' }}
      >
        Создать аккаунт
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Зарегистрируйтесь для управления задачами
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {serverError && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Ошибка"
            color="red"
            mb="md"
            withCloseButton
            onClose={() => setServerError(null)}
          >
            {serverError}
          </Alert>
        )}

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="example@mail.com"
              required
              autoComplete="email"
              error={form.errors.email}
              {... form.getInputProps('email')}
              disabled={registerMutation. isPending}
            />

            <Popover
              opened={popoverOpened}
              position="bottom"
              width="target"
              transitionProps={{ transition: 'pop' }}
            >
              <Popover.Target>
                <div
                  onFocusCapture={() => setPopoverOpened(true)}
                  onBlurCapture={() => setPopoverOpened(false)}
                >
                  <PasswordInput
                    label="Пароль"
                    placeholder="Придумайте пароль"
                    required
                    autoComplete="new-password"
                    error={form. errors.password}
                    {...form. getInputProps('password')}
                    disabled={registerMutation.isPending}
                  />
                </div>
              </Popover. Target>
              <Popover. Dropdown>
                <Text size="sm" fw={500} mb="xs">
                  Требования к паролю:
                </Text>
                {requirements.map((requirement, index) => (
                  <PasswordRequirement
                    key={index}
                    meets={requirement.meets}
                    label={requirement.label}
                  />
                ))}
              </Popover.Dropdown>
            </Popover>

            {password. length > 0 && (
              <Box>
                <Progress
                  value={strength}
                  color={getStrengthColor(strength)}
                  size="xs"
                  mb={5}
                />
                <Text size="xs" c="dimmed">
                  Сила пароля:{' '}
                  {strength === 100
                    ? 'Отлично'
                    : strength >= 75
                      ? 'Хорошо'
                      : strength >= 50
                        ? 'Средне'
                        : 'Слабо'}
                </Text>
              </Box>
            )}

            <PasswordInput
              label="Подтверждение пароля"
              placeholder="Повторите пароль"
              required
              autoComplete="new-password"
              error={form.errors.confirmPassword}
              {...form.getInputProps('confirmPassword')}
              disabled={registerMutation. isPending}
            />

            <Button
              fullWidth
              mt="md"
              type="submit"
              loading={registerMutation. isPending}
              disabled={! form.isValid() || strength < 100 || registerMutation. isPending}
            >
              {registerMutation.isPending ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
          </Stack>
        </form>

        <Text ta="center" mt="md" size="sm">
          Уже есть аккаунт? {' '}
          <Anchor component={Link} to="/login" fw={500}>
            Войти
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
};

export default RegisterPage;