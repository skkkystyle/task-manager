import React from 'react';
import { Paper, TextInput, PasswordInput, Button, Title, Text, Anchor, Container } from '@mantine/core';
import { useForm } from '@mantine/form';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';

const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const form = useForm<RegisterFormData>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: (values) => {
      const result = registerSchema.safeParse(values);
      if (result.success) {
        return {};
      }
      const fieldErrors = result.error.flatten();
      return fieldErrors.fieldErrors;
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterFormData) =>
      api.post('/auth/register', data).then(res => res.data),
    onSuccess: (data) => {
      localStorage.setItem('token', data.access_token);
      navigate('/tasks', { replace: true });
    },
    onError: (error: any) => {
      console.error('Registration failed:', error?.response?.data || error.message);
      const message = error?.response?.data?.message || 'Registration failed';
      form.setFieldError('email', message);
    }
  });

  const handleSubmit = (values: RegisterFormData) => {
    registerMutation.mutate(values);
  };

  return (
    <Container size={420} my={40}>
      <Title align="center" sx={(theme) => ({ fontFamily: `Greycliff CF, ${theme.fontFamily}`, fontWeight: 900 })}>
        Create account
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
          <Button fullWidth mt="xl" type="submit" loading={registerMutation.isPending}>
            Register
          </Button>
        </form>
        <Text align="center" mt="md">
          Already have an account?{' '}
          <Anchor component={Link} to="/login">
            Log in
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
};

export default RegisterPage;