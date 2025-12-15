import React from 'react';
import { Paper, TextInput, PasswordInput, Button, Title, Text, Anchor, Container, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const form = useForm<LoginFormData>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: (values) => {
      const result = loginSchema.safeParse(values);
      if (result.success) {
        return {};
      }
      const fieldErrors = result.error.flatten();
      return fieldErrors.fieldErrors;
    },
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) =>
      api.post('/auth/login', data).then(res => res.data),
    onSuccess: (data) => {
      localStorage.setItem('token', data.access_token);
      navigate('/tasks', { replace: true });
    },
    onError: (error: any) => {
      console.error('Login failed:', error?.response?.data || error.message);
      const message = error?.response?.data?.message || 'Login failed';
      form.setFieldError('email', message);
    }
  });

  const handleSubmit = (values: LoginFormData) => {
    loginMutation.mutate(values);
  };

  return (
    <Container size={420} my={40}>
      <Title align="center" sx={(theme) => ({ fontFamily: `Greycliff CF, ${theme.fontFamily}`, fontWeight: 900 })}>
        Welcome back!
      </Title>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Email"
            placeholder="you@mantine.dev"
            required
            {...form.getInputProps('email')}
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            required
            mt="md"
            {...form.getInputProps('password')}
          />
          <Button fullWidth mt="xl" type="submit" loading={loginMutation.isPending}>
            Sign in
          </Button>
        </form>
        <Text align="center" mt="md">
          Don't have an account?{' '}
          <Anchor component={Link} to="/register">
            Register
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
};

export default LoginPage;