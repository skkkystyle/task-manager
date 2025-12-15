import React, { useState } from 'react';
import { Paper, TextInput, PasswordInput, Button, Title, Text, Anchor, Container } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';

interface RegisterFormData {
  email: string;
  password: string;
}

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({ email: '', password: '' });
  const navigate = useNavigate();

  const registerMutation = useMutation({
    mutationFn: (data: RegisterFormData) =>
      api.post('/auth/register', data).then(res => res.data),
    onSuccess: (data) => {
      localStorage.setItem('token', data.access_token);
      navigate('/tasks', { replace: true });
    },
    onError: (error: any) => {
      console.error('Registration failed:', error?.response?.data || error.message);
      alert('Registration failed: ' + (error?.response?.data?.message || 'Unknown error'));
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(formData);
  };

  return (
    <Container size={420} my={40}>
      <Title align="center" sx={(theme) => ({ fontFamily: `Greycliff CF, ${theme.fontFamily}`, fontWeight: 900 })}>
        Create account
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