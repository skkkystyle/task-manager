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
} from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import api from '../services/api';

interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  createdAt: string;
}

interface CreateUpdateTaskDto {
  id?: number;
  title: string;
  description?: string;
  status: string;
}

const TasksPage: React.FC = () => {
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);
  const [filters, setFilters] = useState<{ status?: string; search?: string }>({});
  const [editTask, setEditTask] = useState<Task | null>(null);
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const res = await api.get(`/tasks?${params.toString()}`);
      return res.data as Task[];
    },
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
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/tasks/${id}`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleCreateClick = () => {
    setEditTask(null);
    setOpened(true);
  };

  const handleEditClick = (task: Task) => {
    setEditTask(task);
    setOpened(true);
  };

  const handleModalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries()) as any;

    if (editTask) {
      taskMutation.mutate({ ...data, id: editTask.id });
    } else {
      taskMutation.mutate(data);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value || undefined }));
  };

  if (tasksQuery.isLoading) return <div>Loading...</div>;
  if (tasksQuery.isError) return <div>Error: {(tasksQuery.error as Error).message}</div>;

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
          <ActionIcon color="red" onClick={() => deleteMutation.mutate(task.id)}>
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
        <form onSubmit={handleModalSubmit}>
          <TextInput
            label="Title"
            name="title"
            required
            defaultValue={editTask?.title || ''}
            mb="md"
          />
          <TextInput
            label="Description"
            name="description"
            defaultValue={editTask?.description || ''}
            mb="md"
          />
          <Select
            label="Status"
            name="status"
            required
            data={[
              { value: 'TODO', label: 'To Do' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'DONE', label: 'Done' },
            ]}
            defaultValue={editTask?.status || 'TODO'}
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