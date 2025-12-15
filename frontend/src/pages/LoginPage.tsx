import React, { useState } from 'react';
import { Paper, TextInput, PasswordInput, Button, Title, Text, Anchor, Container, Group } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';

interface LoginFormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: ( LoginFormData) =>
      api.post('/auth/login', data).then(res => res.data),
    onSuccess: (data) => {
      localStorage.setItem('token', data.access_token);
      navigate('/tasks', { replace: true });
    },
    onError: (error: any) => {
      console.error('Login failed:', error?.response?.data || error.message);
      alert('Login failed: ' + (error?.response?.data?.message || 'Unknown error'));
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  };

  return (
    <Container size={420} my={40}>
      <Title align="center" sx={(theme) => ({ fontFamily: `Greycliff CF, ${theme.fontFamily}`, fontWeight: 900 })}>
        Welcome back!
      </Title>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Email"
            placeholder="you@mantine.dev"
            required
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            required
            mt="md"
            name="password"
            value={formData.password}
            onChange={handleChange}
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