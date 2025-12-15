import React from 'react';
import { setToken } from '../utils/auth';
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
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email обязателен для заполнения')
    .email('Введите корректный email адрес'),
  password: z
    . string()
    .min(1, 'Пароль обязателен для заполнения')
    .min(6, 'Пароль должен содержать минимум 6 символов'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface ApiError {
  response?: {
    status?:  number;
    data?: {
      message?: string | string[];
      error?:  string;
    };
  };
  message?: string;
}

const LoginPage: React. FC = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<LoginFormData>({
    initialValues: {
      email: '',
      password: '',
    },
    validate:  (values) => {
      const result = loginSchema.safeParse(values);
      if (result. success) {
        return {};
      }
      const fieldErrors = result.error. flatten().fieldErrors;
      return {
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      };
    },
    validateInputOnBlur: true,
    validateInputOnChange: ['email', 'password'],
  });

  const getErrorMessage = (error: ApiError): string => {
    const status = error.response?. status;
    const serverMessage = error.response?.data?.message;

    const message = Array.isArray(serverMessage)
      ? serverMessage[0]
      : serverMessage;

    switch (status) {
      case 400:
        return message || 'Некорректные данные для входа';
      case 401:
        return 'Неверный email или пароль';
      case 403:
        return 'Доступ запрещён.  Обратитесь к администратору';
      case 404:
        return 'Пользователь с таким email не найден';
      case 429:
        return 'Слишком много попыток входа.  Попробуйте позже';
      case 500:
      case 502:
      case 503:
        return 'Сервер временно недоступен. Попробуйте позже';
      default:
        if (! error.response) {
          return 'Ошибка сети.  Проверьте подключение к интернету';
        }
        return message || 'Произошла ошибка при входе.  Попробуйте ещё раз';
    }
  };

  const loginMutation = useMutation({
    mutationFn:  (data: LoginFormData) =>
      api.post('/auth/login', data).then((res) => res.data),
    onSuccess: (data) => {
      setToken(data.access_token);

      notifications.show({
        title:  'Успешный вход',
        message: 'Добро пожаловать в систему! ',
        color: 'green',
        icon: <IconCheck size={16} />,
        autoClose: 3000,
      });

      setServerError(null);
      navigate('/tasks', { replace: true });
    },
    onError: (error: ApiError) => {
      const errorMessage = getErrorMessage(error);
      setServerError(errorMessage);

      notifications.show({
        title: 'Ошибка входа',
        message: errorMessage,
        color: 'red',
        icon: <IconAlertCircle size={16} />,
        autoClose: 5000,
      });

      if (error.response?.status === 401) {
        form.setFieldError('email', ' ');
        form.setFieldError('password', 'Неверный email или пароль');
      }
    },
  });

  const handleSubmit = (values: LoginFormData) => {
    setServerError(null);
    loginMutation.mutate(values);
  };

  return (
    <Container size={420} my={40}>
      <Title
        ta="center"
        fw={900}
        style={{ fontFamily: 'Greycliff CF, var(--mantine-font-family)' }}
      >
        Добро пожаловать! 
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Войдите в свой аккаунт для управления задачами
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
              disabled={loginMutation. isPending}
            />

            <PasswordInput
              label="Пароль"
              placeholder="Введите пароль"
              required
              autoComplete="current-password"
              error={form.errors.password}
              {...form.getInputProps('password')}
              disabled={loginMutation.isPending}
            />

            <Button
              fullWidth
              mt="md"
              type="submit"
              loading={loginMutation. isPending}
              disabled={! form.isValid()}
            >
              {loginMutation.isPending ? 'Вход.. .' : 'Войти'}
            </Button>
          </Stack>
        </form>

        <Text ta="center" mt="md" size="sm">
          Нет аккаунта? {' '}
          <Anchor component={Link} to="/register" fw={500}>
            Зарегистрироваться
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
};

export default LoginPage;