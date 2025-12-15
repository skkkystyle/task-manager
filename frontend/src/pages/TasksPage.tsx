import React, { useState } from 'react';
import {
  Title,
  Button,
  Group,
  Paper,
  Table,
  ActionIcon,
  Modal,
  TextInput,
  Select,
  Flex,
  SimpleGrid,
  Box,
  Text,
  LoadingOverlay,
  useMantineTheme,
  Alert,
  useMantineColorScheme,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotifications } from '@mantine/notifications';
import { IconEdit, IconTrash, IconPlus, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import api from '../services/api';

interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  createdAt: string;
}

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
});

type CreateUpdateTaskDto = z.infer<typeof taskSchema> & { id?: number };

const TasksPage: React.FC = () => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const notifications = useNotifications();
  const [opened, setOpened] = useState(false);
  const [filters, setFilters] = useState<{ status?: string; search?: string }>({});
  const [editTask, setEditTask] = useState<Task | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<CreateUpdateTaskDto>({
    initialValues: {
      title: '',
      description: '',
      status: 'TODO',
    },
    validate: (values) => {
      const result = taskSchema.safeParse(values);
      if (result.success) {
        return {};
      }
      const fieldErrors = result.error.flatten();
      return fieldErrors.fieldErrors;
    },
  });

  const tasksQuery = useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const res = await api.get(`/tasks?${params.toString()}`);
      return res.data as Task[];
    },
    onError: (error: any) => {
      console.error('Failed to load tasks:', error?.response?.data || error.message);
      const message = error?.response?.data?.message || 'Failed to load tasks';
      notifications.show({
        title: 'Error',
        message: message,
        color: 'red',
        icon: <IconAlertCircle size="1rem" />,
      });
    }
  });

  const taskMutation = useMutation({
    mutationFn: (data: CreateUpdateTaskDto) => {
      if (data.id) {
        return api.patch(`/tasks/${data.id}`, data).then(res => res.data);
      } else {
        return api.post('/tasks', data).then(res => res.data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setOpened(false);
      form.reset();
      notifications.show({
        title: 'Success',
        message: editTask ? 'Task updated successfully' : 'Task created successfully',
        color: 'green',
        icon: <IconCheck size="1rem" />,
      });
    },
    onError: (error: any) => {
      console.error('Task operation failed:', error?.response?.data || error.message);
      const message = error?.response?.data?.message || 'An error occurred';
      notifications.show({
        title: 'Error',
        message: message,
        color: 'red',
        icon: <IconAlertCircle size="1rem" />,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/tasks/${id}`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      notifications.show({
        title: 'Success',
        message: 'Task deleted successfully',
        color: 'green',
        icon: <IconCheck size="1rem" />,
      });
    },
    onError: (error: any) => {
      console.error('Task deletion failed:', error?.response?.data || error.message);
      const message = error?.response?.data?.message || 'Failed to delete task';
      notifications.show({
        title: 'Error',
        message: message,
        color: 'red',
        icon: <IconAlertCircle size="1rem" />,
      });
    },
  });

  const handleCreateClick = () => {
    setEditTask(null);
    form.reset();
    form.setValues({ title: '', description: '', status: 'TODO' });
    setOpened(true);
  };

  const handleEditClick = (task: Task) => {
    setEditTask(task);
    form.setValues({ ...task });
    setOpened(true);
  };

  const handleModalSubmit = (values: CreateUpdateTaskDto) => {
    taskMutation.mutate(values);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value || undefined }));
  };

  if (tasksQuery.isError) {
    return (
      <Alert
        mt="md"
        icon={<IconAlertCircle size="1rem" />}
        title="Error"
        color="red"
      >
        Failed to load tasks. Check notifications for details.
      </Alert>
    );
  }

  if (tasksQuery.isLoading) return <div>Loading...</div>;

  const rows = tasksQuery.data?.map((task) => (
    <tr key={task.id}>
      <td>{task.title}</td>
      <td>{task.description || '-'}</td>
      <td>{task.status}</td>
      <td>{new Date(task.createdAt).toLocaleDateString()}</td>
      <td>
        <Group spacing="xs">
          <ActionIcon color="blue" onClick={() => handleEditClick(task)}>
            <IconEdit size="1rem" />
          </ActionIcon>
          <ActionIcon
            color="red"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this task?')) {
                deleteMutation.mutate(task.id);
              }
            }}
          >
            <IconTrash size="1rem" />
          </ActionIcon>
        </Group>
      </td>
    </tr>
  ));

  return (
    <Box p="md">
      <Flex justify="space-between" align="center" mb="md">
        <Title order={2}>Your Tasks</Title>
        <Button leftIcon={<IconPlus />} onClick={handleCreateClick}>
          Add New Task
        </Button>
      </Flex>

      <SimpleGrid cols={2} mb="md">
        <Select
          label="Status"
          placeholder="Filter by status"
          data={[
            { value: 'TODO', label: 'To Do' },
            { value: 'IN_PROGRESS', label: 'In Progress' },
            { value: 'DONE', label: 'Done' },
          ]}
          value={filters.status || null}
          onChange={(value) => setFilters(prev => ({ ...prev, status: value || undefined }))}
        />
        <TextInput
          label="Search"
          placeholder="Search by title..."
          value={filters.search || ''}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value || undefined }))}
        />
      </SimpleGrid>

      <Paper shadow="xs" p="md">
        <Table striped highlightOnHover>
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </Table>
      </Paper>

      <Modal opened={opened} onClose={() => setOpened(false)} title={editTask ? 'Edit Task' : 'Create Task'} centered>
        <LoadingOverlay visible={taskMutation.isPending} />
        <form onSubmit={form.onSubmit(handleModalSubmit)}>
          <TextInput
            label="Title"
            required
            {...form.getInputProps('title')}
            mb="md"
          />
          <TextInput
            label="Description"
            {...form.getInputProps('description')}
            mb="md"
          />
          <Select
            label="Status"
            required
            data={[
              { value: 'TODO', label: 'To Do' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'DONE', label: 'Done' },
            ]}
            {...form.getInputProps('status')}
            mb="md"
          />
          <Group position="right" mt="md">
            <Button type="submit">Submit</Button>
            <Button variant="subtle" onClick={() => setOpened(false)}>Cancel</Button>
          </Group>
        </form>
      </Modal>
    </Box>
  );
};

export default TasksPage;